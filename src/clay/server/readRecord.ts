import { snakeCase } from "change-case";
import { fromPairs, mapValues, zip } from "lodash";
import { ClientBase, Pool } from "pg";
import { plural } from "pluralize";
import squel, { PostgresSelect } from "safe-squel";
import { Meta } from "../meta";
import {
    ReadRecordResult,
    ReadRecordsResult,
    Record,
    UserPermissions,
} from "./api";
import { Context } from "./context";
import { verifyPermission } from "./error";
import { select } from "./squel";

export function parseSeq(source: string): (string | null)[] {
    if (Array.isArray(source)) {
        return source;
    }
    if (source.length === 2) {
        return [];
    }

    let mode = 0;
    const items = [];
    let current = "";
    for (let index = 1; index < source.length - 1; index++) {
        const character = source.charAt(index);
        switch (mode) {
            case 0:
                if (character === '"') {
                    mode = 1;
                } else if (character == ",") {
                    items.push(null);
                } else {
                    current += character;
                    mode = 2;
                }
                break;
            case 1:
                if (character === '"') {
                    mode = 3;
                } else if (character === "\\") {
                    mode = 4;
                } else {
                    current += character;
                }
                break;
            case 2:
                if (character === ",") {
                    items.push(current);
                    current = "";
                    mode = 0;
                } else {
                    current += character;
                }
                break;
            case 3:
                if (character === '"') {
                    current += '"';
                    mode = 1;
                } else if (character === ",") {
                    mode = 0;
                    items.push(current);
                    current = "";
                } else {
                    throw new Error("unexpected");
                }
                break;
            case 4:
                current += character;
                mode = 1;
                break;
        }
    }
    switch (mode) {
        case 0:
            items.push(null);
            break;
        case 1:
        case 4:
            console.error(mode, items, source);
            throw new Error("parse error");
        case 3:
        case 2:
            items.push(current);
            break;
    }

    return items;
}

function databaseDecodeInner(
    context: Context,
    meta: Meta,
    value: string
): {} | null {
    switch (meta.type) {
        case "record": {
            const fields = context.types[meta.name];
            if (fields === undefined) {
                console.error(value);
                throw new Error("no type information for " + meta.name);
            }
            const elements = parseSeq(value);
            return fromPairs(
                zip(fields, elements).map(([fieldKey, fieldValue]) => {
                    if (meta.fields[fieldKey as string] === undefined) {
                        console.error(fields);
                        console.error(meta);
                        throw new Error(`Missing meta for ${fieldKey}`);
                    }
                    return [
                        fieldKey as string,
                        fieldValue === null
                            ? null
                            : databaseDecodeInner(
                                  context,
                                  meta.fields[fieldKey as string],
                                  fieldValue as string
                              ),
                    ];
                })
            );
        }
        case "string":
        case "money":
        case "percentage":
        case "quantity":
        case "money?":
        case "percentage?":
        case "quantity?":
        case "uuid":
        case "phone":
        case "enum":
        case "null":
            return value;
        case "datetime":
            if (value === null) {
                return null;
            }
            return new Date(value).toISOString();
        case "date":
            return value.slice(0, 10);
        case "version":
        case "serial":
            return parseInt(value, 10);
        case "array":
        case "array?": {
            if (value === null) {
                return null;
            }
            const elements = parseSeq(value);
            return elements.map((itemValue) =>
                databaseDecodeInner(context, meta.items, itemValue as string)
            );
        }
        case "boolean":
            return value === "t";
        case "boolean?":
            if (value === null || value === "") {
                return null;
            }
            return value === "t";
        case "binary":
            console.error(value);
            throw new Error("not ready");
    }
}

export function databaseDecode(
    context: Context,
    meta: Meta,
    value: {}
): {} | null {
    if (value === null) {
        return null;
    }
    switch (meta.type) {
        case "record":
        case "array":
        case "array?":
        case "string":
        case "money":
        case "percentage":
        case "quantity":
        case "money?":
        case "percentage?":
        case "quantity?":
        case "uuid":
        case "phone":
        case "enum":
            return databaseDecodeInner(context, meta, value as string);
        case "date":
            if (value === null) {
                return null;
            } else {
                return (value as Date).toISOString().slice(0, 10);
            }
        case "datetime":
            if (value === null) {
                return null;
            } else {
                return (value as Date).toISOString();
            }
        case "boolean":
        case "version":
        case "serial":
        case "null":
        case "boolean?":
            return value;
        case "binary":
            console.error(value);
            throw new Error("not ready");
    }
}

export default async function readRecord(
    client: ClientBase | Pool,
    context: Context,
    user: UserPermissions,
    tableName: string,
    recordId: string,
    lockRecord?: boolean
): Promise<ReadRecordResult> {
    verifyPermission(user, tableName, "read");

    const meta = context.metas[tableName];

    const query = select()
        .from(plural(snakeCase(tableName)))
        .where("id = ?", recordId);

    for (const key of Object.keys(meta.fields)) {
        query.field(snakeCase(key));
    }

    if (lockRecord) {
        query.blocks.push(squel.str("FOR UPDATE"));
    }

    const databaseResponse = await client.query(query.toParam());

    const row = databaseResponse.rows[0];

    if (row) {
        return {
            record: mapValues(meta.fields, (fieldMeta, fieldName) =>
                databaseDecode(
                    context,
                    fieldMeta,
                    databaseResponse.rows[0][snakeCase(fieldName)]
                )
            ) as Record,
        };
    } else {
        return {
            record: null,
        };
    }
}

export async function readRecords(
    client: ClientBase,
    context: Context,
    user: UserPermissions,
    tableName: string,
    adaptQuery?: (query: PostgresSelect) => void
): Promise<ReadRecordsResult> {
    verifyPermission(user, tableName, "read");

    const meta = context.metas[tableName];

    const query = select()
        .from(snakeCase(plural(tableName)))
        .field("record_version");

    for (const key of Object.keys(meta.fields)) {
        query.field(snakeCase(key));
    }

    if (adaptQuery) {
        adaptQuery(query);
    }

    const databaseResponse = await client.query(query.toParam());

    return {
        records: databaseResponse.rows.map(
            (row) =>
                mapValues(meta.fields, (fieldMeta, fieldName) =>
                    databaseDecode(
                        context,
                        fieldMeta,
                        row[snakeCase(fieldName)]
                    )
                ) as Record
        ),
    };
}
