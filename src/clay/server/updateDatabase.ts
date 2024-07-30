import { camelCase, pascalCase, snakeCase } from "change-case";
import { fromPairs, uniqueId } from "lodash";
import { ClientBase } from "pg";
import { plural } from "pluralize";
import { FunctionBlock, select } from "safe-squel";
import { Dictionary } from "../common";
import { makeDefault, Meta } from "../meta";
import { str, update } from "./squel";
import { databaseEncode } from "./storeRecord";

export async function readDatabaseStructure(
    client: ClientBase
): Promise<Structure> {
    const schema = process.env.PGSCHEMA || "public";

    const tables = fromPairs(
        (
            await client.query(
                select()
                    .from("pg_tables")
                    .field("tablename", "name")
                    .field(
                        str(
                            "coalesce(?, ARRAY[]::TEXT[])",
                            select()
                                .from("information_schema.columns")
                                .where("table_name = tablename")
                                .where(
                                    "pg_tables.schemaname = information_schema.columns.table_schema"
                                )
                                .field(
                                    "array_agg(column_name::text order by ordinal_position)"
                                )
                        ),
                        "columns"
                    )
                    .where("schemaname = ?", schema)
                    .toString()
            )
        ).rows.map((row) => [row.name, row.columns])
    );

    const types = fromPairs(
        (
            await client.query(
                select()
                    .from("pg_type")
                    .join(
                        "pg_namespace",
                        undefined,
                        "pg_namespace.oid = pg_type.typnamespace"
                    )
                    .join(
                        "pg_catalog.pg_class",
                        undefined,
                        "pg_catalog.pg_class.oid = pg_type.typrelid"
                    )
                    .where("pg_namespace.nspname = ?", schema)
                    .where("pg_catalog.pg_class.relkind = ?", "c")
                    .field("typname", "name")
                    .field(
                        str(
                            "coalesce(?, ARRAY[]::TEXT[])",
                            select()
                                .from("pg_attribute")
                                .where("pg_type.typrelid = attrelid")
                                .where("pg_attribute.attisdropped = false")
                                // its very important that we get the order of attributes
                                // as postgres has it, we use this to correctly encode composite types
                                .field(
                                    "array_agg(attname::text order by attnum)"
                                )
                        ),
                        "fields"
                    )
                    .toString()
            )
        ).rows.map((row) => [pascalCase(row.name), row.fields.map(camelCase)])
    );

    return { tables, types };
}

type Structure = {
    tables: Dictionary<string[]>;
    types: Dictionary<string[]>;
};

type Context = {
    client: ClientBase;
    structure: Structure;
    currentStructure: Structure;
};

function sqlType(meta: Meta): string {
    switch (meta.type) {
        case "string":
        case "phone":
        case "enum":
            return "text";
        case "array":
        case "array?":
            return sqlType(meta.items) + "[]";
        case "record":
            const schema = process.env.PGSCHEMA || "public";
            return schema + "." + snakeCase(meta.name);
        case "money":
        case "quantity":
        case "percentage":
        case "money?":
        case "quantity?":
        case "percentage?":
            return "decimal";
        case "boolean":
        case "boolean?":
            return "boolean";
        case "uuid":
            return "uuid";
        case "date":
            return "date";
        case "datetime":
            return "timestamptz";
        case "serial":
            return "serial";
        case "version":
        case "null":
            throw new Error("Should not occour");
        case "binary":
            return "bytea";
    }
}

type Upper = {
    doUpdate: (handler: (s: FunctionBlock) => FunctionBlock) => void;
};

async function visit(
    context: Context,
    meta: Meta,
    upper: Upper | null,
    trace: string[]
) {
    if (!meta) {
        console.error(trace);
    }
    switch (meta.type) {
        case "array":
            if (upper === null) {
                throw new Error("Array not valid at top level");
            }
            await visit(
                context,
                meta.items,
                {
                    doUpdate: (handler) =>
                        upper.doUpdate((access: FunctionBlock) => {
                            const column = uniqueId("c");
                            return str(
                                `array(select ? from unnest ? as ${column})`,
                                handler(str(column)),
                                access
                            );
                        }),
                },
                [...trace, "[]"]
            );
            break;
        case "record":
            if (upper != null) {
                const localDoUpdate = (
                    key: string,
                    handler: (s: FunctionBlock) => FunctionBlock
                ) => {
                    upper.doUpdate((access) =>
                        str(
                            `ROW(${typeFields
                                .map((field) =>
                                    field !== key
                                        ? str("?." + snakeCase(field), access)
                                        : handler(
                                              str(
                                                  "?." + snakeCase(field),
                                                  access
                                              )
                                          )
                                )
                                .join(",")})::"${snakeCase(meta.name)}"`
                        )
                    );
                };
                for (const key of Object.keys(meta.fields)) {
                    const keyName = snakeCase(key);
                    const innerMeta = meta.fields[key];
                    if (
                        !innerMeta ||
                        (innerMeta.type == "array" &&
                            innerMeta.items === undefined)
                    ) {
                        throw new Error("bad key " + key);
                    }
                    await visit(
                        context,
                        meta.fields[key],
                        {
                            doUpdate: localDoUpdate.bind(null, keyName),
                        },
                        [...trace, key]
                    );
                }

                if (context.currentStructure.types[meta.name] === undefined) {
                    await context.client.query(
                        'CREATE TYPE "' + snakeCase(meta.name) + '" AS ()'
                    );
                    context.currentStructure.types[meta.name] = [];
                }

                const typeFields = context.currentStructure.types[meta.name];
                const originalTypeFields =
                    context.structure.types[meta.name] || [];

                for (const key of Object.keys(meta.fields)) {
                    if (typeFields.indexOf(key) === -1) {
                        await context.client.query(
                            'ALTER TYPE "' +
                                snakeCase(meta.name) +
                                '" ADD ATTRIBUTE "' +
                                snakeCase(key) +
                                '" ' +
                                sqlType(meta.fields[key])
                        );
                        typeFields.push(key);
                    }

                    if (originalTypeFields.indexOf(key) === -1) {
                        localDoUpdate(key, () =>
                            str(
                                "?",
                                databaseEncode(
                                    {
                                        types: context.currentStructure.types,
                                    },
                                    meta.fields[key],
                                    makeDefault(meta.fields[key])
                                )
                            )
                        );
                    }
                }
            } else {
                const tableName = snakeCase(plural(meta.name));
                if (context.currentStructure.tables[tableName] === undefined) {
                    await context.client.query(
                        `CREATE TABLE "${tableName}" (id UUID PRIMARY KEY, record_version INTEGER)`
                    );
                    context.currentStructure.tables[tableName] = [
                        "id",
                        "record_version",
                    ];
                }

                await context.client.query(
                    `CREATE UNIQUE INDEX IF NOT EXISTS ds_${tableName}_id on ${tableName}(ID)`
                );

                const tableFields = context.currentStructure.tables[tableName];
                for (const key of Object.keys(meta.fields)) {
                    const updates: ((
                        access: FunctionBlock
                    ) => FunctionBlock)[] = [];

                    const keyName = snakeCase(key);

                    await visit(
                        context,
                        meta.fields[key],
                        {
                            doUpdate: (sql) => updates.push(sql),
                        },
                        [...trace, key]
                    );
                    if (tableFields.indexOf(keyName) === -1) {
                        console.log("Adding missing field: ", keyName);
                        await context.client.query(
                            `ALTER TABLE "${tableName}" ADD COLUMN "${keyName}" ${sqlType(
                                meta.fields[key]
                            )}`
                        );
                        if (tableName === "jobs" && keyName == "name") {
                            await context.client.query(
                                "CREATE UNIQUE INDEX jobname ON jobs(name)"
                            );
                        }
                        if (meta.fields[key].type == "serial") {
                            // Serials are automatically set, but add an index
                            await context.client.query(
                                `CREATE UNIQUE INDEX idx_${camelCase(
                                    tableName
                                )}_${camelCase(
                                    keyName
                                )}_serial ON ${tableName}(${keyName})`
                            );
                        } else {
                            await context.client.query(
                                update()
                                    .table(tableName)
                                    .set(
                                        keyName,
                                        databaseEncode(
                                            {
                                                types: context.currentStructure
                                                    .types,
                                            },
                                            meta.fields[key],
                                            makeDefault(meta.fields[key])
                                        )
                                    )
                                    .toParam()
                            );
                        }
                        tableFields.push(keyName);
                        console.log("added", tableFields);
                    } else {
                        for (const innerUpdate of updates) {
                            await context.client.query(
                                update()
                                    .table(tableName)
                                    .set(keyName, innerUpdate(str(keyName)))
                                    .toParam()
                            );
                        }
                    }
                    if (key === "project") {
                        await context.client.query(
                            `CREATE INDEX IF NOT EXISTS ds_${tableName}_project on ${tableName}(project)`
                        );
                    }
                }
            }
            break;
    }
}

export default async function updateDatabase(
    client: ClientBase,
    tablesMeta: Dictionary<Meta>
) {
    try {
        await client.query("BEGIN");
        const structure = await readDatabaseStructure(client);

        if (!("record_history" in structure.tables)) {
            await client.query(`CREATE TABLE record_history (
            tablename text,
            id uuid,
            diff jsonb,
            version integer,
            user_id uuid,
            form text,
            changed_time timestamptz
        )`);
        }

        if (!("editing" in structure.tables)) {
            await client.query(`CREATE TABLE editing (
            tablename text,
            id uuid,
            user_id uuid,
            time timestamptz,
            primary key (tablename, id, user_id)
        )`);
        }

        if (!("blobs" in structure.tables)) {
            await client.query(`CREATE TABLE blobs (
            id char(64) primary key,
            type text,
            data bytea
        )`);
        }

        const currentStructure = JSON.parse(JSON.stringify(structure));

        for (const [key, table] of Object.entries(tablesMeta)) {
            await visit(
                {
                    client,
                    structure,
                    currentStructure,
                },
                table,
                null,
                [key]
            );

            if (table.type !== "record") {
                throw new Error("Invalid");
            }
            /*
            for (const key in table.expressionFunctions) {
                let expression = parseExpressionAt(
                    table.expressionFunctions[key].toString()
                ) as Expression;

                switch (expression.type) {
                    case "FunctionExpression":
                        console.log(expression.params);
                        console.log(expression.body);
                        break;
                    default:
                        throw new Error("Expected Function Expression");
                }
            }*/
        }

        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    }
}
