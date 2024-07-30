import { ErrorObject } from "ajv";
import { snakeCase } from "change-case";
import { diff } from "jsondiffpatch";
import { mapValues } from "lodash";
import { ClientBase, Pool } from "pg";
import { plural } from "pluralize";
import { QueryBuilder, SetFieldMixin } from "safe-squel";
import { processNotifications } from "../../app/inbox/process-notifications";
import { Dictionary } from "../common";
import { LocalDate } from "../LocalDate";
import { makeDefault, Meta, RecordMeta } from "../meta";
import { StoreRecordResult, UserPermissions } from "./api";
import { Context } from "./context";
import { ServerError, verifyPermission } from "./error";
import { EVENTS } from "./events";
import readRecord from "./readRecord";
import { insert, rstr, select, update } from "./squel";
class EncodingBuilder {
    value: string;
    depth: number;
    escape: string;

    constructor() {
        this.value = "";
        this.depth = 0;
        this.escape = "";
    }

    raw(value: string) {
        this.value += value;
    }

    add(value: string) {
        this.value += value.replace(/\\|"/g, (v) => this.escape + v);
    }

    startQuote() {
        this.raw(this.escape);
        this.raw('"');
        this.escape += this.escape + "\\";
        this.depth += 1;
    }

    stopQuote() {
        this.depth -= 1;
        this.escape = this.escape.slice(this.escape.length / 2 + 0.5);
        this.raw(this.escape);
        this.raw('"');
    }
}

type EncodingContext = {
    types: Dictionary<string[]>;
};
function databaseEncodeInner(
    context: EncodingContext,
    meta: Meta,
    value: {} | null,
    builder: EncodingBuilder
): boolean {
    switch (meta.type) {
        case "record": {
            builder.startQuote();
            const fields = context.types[meta.name];
            builder.raw("(");
            let first = true;
            for (const field of fields) {
                if (!first) {
                    builder.add(",");
                }
                first = false;

                if (meta.fields[field] === undefined) {
                    console.error(fields);
                    console.error(meta.name);
                    throw new Error("Missing " + field);
                }

                databaseEncodeInner(
                    context,
                    meta.fields[field],
                    (value as any)[field],
                    builder
                );
            }
            builder.raw(")");
            builder.stopQuote();
            return true;
        }
        case "array":
        case "array?": {
            if (value === null) {
                return true;
            }
            builder.startQuote();
            builder.raw("{");
            let first = true;
            for (const itemValue of value as any) {
                if (!first) {
                    builder.add(",");
                }
                first = false;

                databaseEncodeInner(context, meta.items, itemValue, builder);
            }
            builder.raw("}");
            builder.stopQuote();
            return true;
        }

        case "string":
        case "money":
        case "percentage":
        case "quantity":

        case "phone":
        case "enum":
            builder.startQuote();
            builder.add(value as string);
            builder.stopQuote();
            return true;
        case "serial":
        case "money?":
        case "percentage?":
        case "quantity?":
            if (value !== null) {
                builder.startQuote();
                builder.add(`${value}`);
                builder.stopQuote();
            }
            return true;
        case "uuid":
        case "date":
        case "datetime":
            if (value !== null) {
                builder.startQuote();
                builder.add(value as string);
                builder.stopQuote();
            }
            return true;
        case "boolean":
            builder.raw(value ? "t" : "f");
            return true;
        case "boolean?":
            if (value !== null) {
                builder.raw(value ? "t" : "f");
            }
            return true;
        case "version":
            if (value === null) {
                throw new Error("Should not happen");
            }
            builder.add(value.toString());
            return true;
        case "null":
            throw new Error();
        case "binary":
            console.error(value);
            throw new Error("not ready");
    }
}

export function databaseEncode(
    context: EncodingContext,
    meta: Meta,
    value: {} | null
): {} | null {
    switch (meta.type) {
        case "record": {
            const fields = context.types[meta.name];
            const builder = new EncodingBuilder();
            builder.add("(");
            let first = true;
            for (const field of fields) {
                if (!first) {
                    builder.add(",");
                }
                first = false;

                if (meta.fields[field] === undefined) {
                    throw new Error("Did not find field: " + field);
                }

                databaseEncodeInner(
                    context,
                    meta.fields[field],
                    (value as any)[field],
                    builder
                );
            }
            builder.add(")");
            return builder.value;
        }
        case "money":
        case "percentage":
        case "quantity":
        case "money?":
        case "percentage?":
        case "quantity?":
        case "string":
        case "boolean":
        case "uuid":
        case "version":
        case "date":
        case "phone":
        case "datetime":
        case "enum":
        case "serial":
        case "boolean?":
            return value;
        case "array":
        case "array?": {
            if (value === null) {
                return null;
            }
            const builder = new EncodingBuilder();
            builder.raw("{");
            let first = true;
            for (const itemValue of value as any) {
                if (!first) {
                    builder.raw(",");
                }
                first = false;

                databaseEncodeInner(context, meta.items, itemValue, builder);
            }
            builder.raw("}");
            return builder.value;
        }
        case "null":
            throw new Error();
        case "binary":
            return (
                "\\x" + Buffer.from(value as string, "base64").toString("hex")
            );
    }
}

export async function updateDatabase(
    client: ClientBase | Pool,
    context: Context,
    parameters: StoreRecordBase,
    query: QueryBuilder & SetFieldMixin,
    version: number,
    meta: RecordMeta<any, any, any>,
    oldRecord: any,
    record: any
): Promise<StoreRecordResult> {
    const { tableName } = parameters;

    const oldVersion = record.recordVersion;

    record = { ...record, recordVersion: version };
    const serials = [];
    for (const fieldName of Object.keys(meta.fields)) {
        if (
            meta.fields[fieldName].type === "serial" &&
            record[fieldName] === null
        ) {
            serials.push(fieldName);
            continue;
        }
        query.set(
            snakeCase(fieldName),
            databaseEncode(context, meta.fields[fieldName], record[fieldName])
        );
    }

    let { text, values } = query.toParam();

    if (serials.length !== 0) {
        text += " RETURNING " + serials.map((s) => snakeCase(s)).join(",");
    }

    let difference = diff(oldRecord, record);
    if (difference) {
        delete difference.recordVersion;

        if (Object.keys(difference).length === 0) {
            difference = undefined;
        }
    }

    if (difference) {
        const result = await client.query({ text, values });
        for (const serial of serials) {
            record[serial] = result.rows[0][snakeCase(serial)];
        }

        await client.query(
            insert()
                .into("record_history")
                .set("tablename", parameters.tableName)
                .set("id", record.id)
                .set("diff", JSON.stringify(difference))
                .set("version", version)
                .set("user_id", parameters.user.id)
                .set("form", parameters.form)
                .set("changed_time", parameters.dateTime.toISOString())
                .toParam()
        );

        EVENTS.emit(
            parameters.tableName,
            parameters.user.id,
            record.id,
            oldRecord,
            record
        );

        processNotifications(
            parameters.tableName,
            parameters.user,
            record.id,
            oldRecord,
            record
        );

        return {
            record,
        };
    } else {
        return {
            record: {
                ...record,
                recordVersion: oldVersion,
            },
        };
    }
}

interface Record {
    id: string;
    recordVersion: number | null;
    [key: string]: any;
}

type StoreRecordBase = {
    client: ClientBase | Pool;
    context: Context;
    tableName: string;
    user: UserPermissions;
    form: string;
    dateTime: Date;
    system?: boolean;
};

type StoreRecord = StoreRecordBase & {
    record: Record;
};

function copyJSON(value: any): any {
    return JSON.parse(JSON.stringify(value));
}

export function makeBase(meta: RecordMeta<any, any, any>, id: string) {
    return mapValues(meta.fields, (value, key) => {
        switch (key) {
            case "id":
                return id;
            case "recordVersion":
                return null;
            default:
                return makeDefault(value);
        }
    });
}

export default async function storeRecord(
    parameters: StoreRecord
): Promise<StoreRecordResult> {
    verifyPermission(parameters.user, parameters.tableName, "write");

    const { client, context, tableName } = parameters;
    let record = parameters.record;

    const meta = context.metas[tableName];

    if (!parameters.system) {
        if ("modifiedBy" in meta.fields) {
            record = { ...record, modifiedBy: parameters.user.id };
        }
        if ("modifiedDate" in meta.fields) {
            record = {
                ...record,
                modifiedDate: new LocalDate(parameters.dateTime).toString(),
            };
        }
        if ("modifiedDateTime" in meta.fields) {
            record = {
                ...record,
                modifiedDateTime: parameters.dateTime.toISOString(),
            };
        }
    }

    if (!context.validator.validate(tableName, record)) {
        throw new ServerError({
            status: "INVALID_RECORD",
            errors: context.validator.errors as ErrorObject[],
        });
    } else {
        const current = await readRecord(
            client,
            context,
            parameters.user,
            tableName,
            record.id,
            true
        );

        if (current.record === null) {
            let recordVersion = 0;

            if (!parameters.system) {
                const recordVersionQuery = await client.query(
                    select()
                        .from("record_history")
                        .where("tablename = ?", tableName)
                        .where("id = ?", record.id)
                        .field(rstr("coalesce(max(version)+1,0)"), "version")
                        .toParam()
                );
                recordVersion = recordVersionQuery.rows[0].version;

                if ("addedBy" in meta.fields) {
                    record = { ...record, addedBy: parameters.user.id };
                }
                if ("addedDate" in meta.fields) {
                    record = {
                        ...record,
                        addedDate: new LocalDate(
                            parameters.dateTime
                        ).toString(),
                    };
                }
                if ("addedDateTime" in meta.fields) {
                    record = {
                        ...record,
                        addedDateTime: parameters.dateTime.toISOString(),
                    };
                }
            }

            verifyPermission(parameters.user, parameters.tableName, "new");
            return updateDatabase(
                client,
                context,
                parameters,
                insert().into(snakeCase(plural(tableName))),
                recordVersion,
                meta,
                makeBase(meta, record.id),
                record
            );
        } else {
            if (current.record.recordVersion === null) {
                throw new Error("this cannot happen");
            }

            return updateDatabase(
                client,
                context,
                parameters,
                update()
                    .table(snakeCase(plural(tableName)))
                    .where("id = ?", record.id),
                current.record.recordVersion + 1,
                meta,
                current.record,
                record
            );
        }
    }
}
