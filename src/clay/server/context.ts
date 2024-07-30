import { Ajv } from "ajv";
import { camelCase, pascalCase, snakeCase } from "change-case";
import { find, mapKeys, mapValues } from "lodash";
import { ClientBase } from "pg";
import { singular } from "pluralize";
import { Dictionary } from "../common";
import { RecordMeta } from "../meta";
import createColumns, { Column } from "./createColumns";
import createTableSchemas from "./createTableSchemas";
import { readDatabaseStructure } from "./updateDatabase";

export type Context = {
    validator: Ajv;
    metas: Dictionary<RecordMeta<any, any, any>>;
    types: Dictionary<string[]>;
    columns: Dictionary<Column>;
};

function findName(meta: RecordMeta<any, any, any>, key: string): string {
    const result = find(
        Object.keys(meta.fields),
        (field) => snakeCase(field) == key
    );
    if (!result) {
        return camelCase(key);
    }
    return result;
}

export async function createContext(
    client: ClientBase,
    tableMetas: Dictionary<RecordMeta<any, any, any>>
): Promise<Context> {
    const databaseStructure = await readDatabaseStructure(client);

    const types = {
        ...databaseStructure.types,
        ...mapValues(
            mapKeys(databaseStructure.tables, (_, key) =>
                singular(pascalCase(key))
            ),
            (x, key) => {
                if (key in tableMetas) {
                    return x.map((y) => findName(tableMetas[key], y));
                } else {
                    return [];
                }
            }
        ),
    };

    const context = {
        validator: createTableSchemas(tableMetas),
        columns: createColumns(tableMetas),
        metas: tableMetas,
        types,
    };
    return context;
}
