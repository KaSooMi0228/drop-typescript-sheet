import Decimal from "decimal.js";
import { Quantity } from "../../clay/common";
import { RecordMeta } from "../../clay/meta";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";

//!Data
export type Column = {
    column: string;
    name: string;
    width: Quantity;
    filter: string;
    fixed: boolean;
};

//!Data
export type View = {
    id: UUID;
    recordVersion: Version;
    name: string;
    table: string;
    columns: Column[];
    default: boolean;
    defaultSortColumn: string;
    defaultSortDirection: boolean;
    segment: string;
};

// BEGIN MAGIC -- DO NOT EDIT
export type ColumnJSON = {
    column: string;
    name: string;
    width: string;
    filter: string;
    fixed: boolean;
};

export function JSONToColumn(json: ColumnJSON): Column {
    return {
        column: json.column,
        name: json.name,
        width: new Decimal(json.width),
        filter: json.filter,
        fixed: json.fixed,
    };
}
export type ColumnBrokenJSON = {
    column?: string;
    name?: string;
    width?: string;
    filter?: string;
    fixed?: boolean;
};

export function newColumn(): Column {
    return JSONToColumn(repairColumnJSON(undefined));
}
export function repairColumnJSON(
    json: ColumnBrokenJSON | undefined
): ColumnJSON {
    if (json) {
        return {
            column: json.column || "",
            name: json.name || "",
            width: json.width || "0",
            filter: json.filter || "",
            fixed: json.fixed || false,
        };
    } else {
        return {
            column: undefined || "",
            name: undefined || "",
            width: undefined || "0",
            filter: undefined || "",
            fixed: undefined || false,
        };
    }
}

export function ColumnToJSON(value: Column): ColumnJSON {
    return {
        column: value.column,
        name: value.name,
        width: value.width.toString(),
        filter: value.filter,
        fixed: value.fixed,
    };
}

export const COLUMN_META: RecordMeta<Column, ColumnJSON, ColumnBrokenJSON> & {
    name: "Column";
} = {
    name: "Column",
    type: "record",
    repair: repairColumnJSON,
    toJSON: ColumnToJSON,
    fromJSON: JSONToColumn,
    fields: {
        column: { type: "string" },
        name: { type: "string" },
        width: { type: "quantity" },
        filter: { type: "string" },
        fixed: { type: "boolean" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type ViewJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    table: string;
    columns: ColumnJSON[];
    default: boolean;
    defaultSortColumn: string;
    defaultSortDirection: boolean;
    segment: string;
};

export function JSONToView(json: ViewJSON): View {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        table: json.table,
        columns: json.columns.map((inner) => JSONToColumn(inner)),
        default: json.default,
        defaultSortColumn: json.defaultSortColumn,
        defaultSortDirection: json.defaultSortDirection,
        segment: json.segment,
    };
}
export type ViewBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    table?: string;
    columns?: ColumnJSON[];
    default?: boolean;
    defaultSortColumn?: string;
    defaultSortDirection?: boolean;
    segment?: string;
};

export function newView(): View {
    return JSONToView(repairViewJSON(undefined));
}
export function repairViewJSON(json: ViewBrokenJSON | undefined): ViewJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            table: json.table || "",
            columns: (json.columns || []).map((inner) =>
                repairColumnJSON(inner)
            ),
            default: json.default || false,
            defaultSortColumn: json.defaultSortColumn || "",
            defaultSortDirection: json.defaultSortDirection || false,
            segment: json.segment || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            table: undefined || "",
            columns: (undefined || []).map((inner) => repairColumnJSON(inner)),
            default: undefined || false,
            defaultSortColumn: undefined || "",
            defaultSortDirection: undefined || false,
            segment: undefined || "",
        };
    }
}

export function ViewToJSON(value: View): ViewJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        table: value.table,
        columns: value.columns.map((inner) => ColumnToJSON(inner)),
        default: value.default,
        defaultSortColumn: value.defaultSortColumn,
        defaultSortDirection: value.defaultSortDirection,
        segment: value.segment,
    };
}

export const VIEW_META: RecordMeta<View, ViewJSON, ViewBrokenJSON> & {
    name: "View";
} = {
    name: "View",
    type: "record",
    repair: repairViewJSON,
    toJSON: ViewToJSON,
    fromJSON: JSONToView,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        table: { type: "string" },
        columns: { type: "array", items: COLUMN_META },
        default: { type: "boolean" },
        defaultSortColumn: { type: "string" },
        defaultSortDirection: { type: "boolean" },
        segment: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
