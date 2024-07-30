import { writeFileSync } from "fs";
import { mapValues } from "lodash";
import { TABLES_META } from "../../app/tables";
import { Meta } from "../meta";
import createColumns, { Column } from "./createColumns";
const columns = createColumns(TABLES_META);

function processMeta(meta: Meta): any {
    switch (meta.type) {
        case "array":
            return {
                type: "array",
                items: processMeta(meta.items),
            };
        case "enum":
            return {
                type: "enum",
                values: meta.values,
            };
        default:
            return {
                type: meta.type,
            };
    }
}

function buildColumnsForTable(column: Column) {
    const columns: any = {};

    const doColumn = (column: Column, prefix: string) => {
        switch (column.meta.type) {
            case "string":
            case "money":
            case "percentage":
            case "quantity":
            case "money?":
            case "percentage?":
            case "quantity?":
            case "boolean":
            case "datetime":
            case "date":
            case "phone":
            case "boolean?":
            case "serial":
                columns[prefix] = {
                    meta: {
                        type: column.meta.type,
                    },
                    subkeyType: column.subkeyType,
                };
                break;
            case "enum":
                columns[prefix] = {
                    meta: {
                        type: "enum",
                        values: column.meta.values,
                    },
                    subkeyType: column.subkeyType,
                };
                break;
            case "array":
                if (column.meta.items.type === "string") {
                    columns[prefix] = {
                        meta: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                        },
                        subkeyType: column.subkeyType,
                    };
                }
            case "uuid":
            case "record": {
                const inner = column.inner();
                for (const [key, value] of Object.entries(inner)) {
                    const fullKey = prefix ? prefix + "." + key : key;
                    doColumn(value, fullKey);
                }
            }
        }
    };

    doColumn(column, "");
    return columns;
}

writeFileSync(
    "src/columns.json",
    JSON.stringify(mapValues(columns, (c) => buildColumnsForTable(c)))
);

console.log("Finished");
process.exit(0);
