import { User } from "../../app/user/table";
import { View } from "../../app/views/table";
import { Link } from "../link";
import { RecordMeta } from "../meta";
import { genUUID, UUID } from "../uuid";
import { Version } from "../version";

//!Data
export type FilterColumn = {
    column: string;
    filter: string;
};

//!Data
export type Filter = {
    id: UUID;
    recordVersion: Version;
    table: string;
    view: Link<View>;
    user: Link<User>;
    name: string;
    columns: FilterColumn[];
    default: boolean;
};

// BEGIN MAGIC -- DO NOT EDIT
export type FilterColumnJSON = {
    column: string;
    filter: string;
};

export function JSONToFilterColumn(json: FilterColumnJSON): FilterColumn {
    return {
        column: json.column,
        filter: json.filter,
    };
}
export type FilterColumnBrokenJSON = {
    column?: string;
    filter?: string;
};

export function newFilterColumn(): FilterColumn {
    return JSONToFilterColumn(repairFilterColumnJSON(undefined));
}
export function repairFilterColumnJSON(
    json: FilterColumnBrokenJSON | undefined
): FilterColumnJSON {
    if (json) {
        return {
            column: json.column || "",
            filter: json.filter || "",
        };
    } else {
        return {
            column: undefined || "",
            filter: undefined || "",
        };
    }
}

export function FilterColumnToJSON(value: FilterColumn): FilterColumnJSON {
    return {
        column: value.column,
        filter: value.filter,
    };
}

export const FILTER_COLUMN_META: RecordMeta<
    FilterColumn,
    FilterColumnJSON,
    FilterColumnBrokenJSON
> & { name: "FilterColumn" } = {
    name: "FilterColumn",
    type: "record",
    repair: repairFilterColumnJSON,
    toJSON: FilterColumnToJSON,
    fromJSON: JSONToFilterColumn,
    fields: {
        column: { type: "string" },
        filter: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type FilterJSON = {
    id: string;
    recordVersion: number | null;
    table: string;
    view: string | null;
    user: string | null;
    name: string;
    columns: FilterColumnJSON[];
    default: boolean;
};

export function JSONToFilter(json: FilterJSON): Filter {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        table: json.table,
        view: json.view,
        user: json.user,
        name: json.name,
        columns: json.columns.map((inner) => JSONToFilterColumn(inner)),
        default: json.default,
    };
}
export type FilterBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    table?: string;
    view?: string | null;
    user?: string | null;
    name?: string;
    columns?: FilterColumnJSON[];
    default?: boolean;
};

export function newFilter(): Filter {
    return JSONToFilter(repairFilterJSON(undefined));
}
export function repairFilterJSON(
    json: FilterBrokenJSON | undefined
): FilterJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            table: json.table || "",
            view: json.view || null,
            user: json.user || null,
            name: json.name || "",
            columns: (json.columns || []).map((inner) =>
                repairFilterColumnJSON(inner)
            ),
            default: json.default || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            table: undefined || "",
            view: undefined || null,
            user: undefined || null,
            name: undefined || "",
            columns: (undefined || []).map((inner) =>
                repairFilterColumnJSON(inner)
            ),
            default: undefined || false,
        };
    }
}

export function FilterToJSON(value: Filter): FilterJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        table: value.table,
        view: value.view,
        user: value.user,
        name: value.name,
        columns: value.columns.map((inner) => FilterColumnToJSON(inner)),
        default: value.default,
    };
}

export const FILTER_META: RecordMeta<Filter, FilterJSON, FilterBrokenJSON> & {
    name: "Filter";
} = {
    name: "Filter",
    type: "record",
    repair: repairFilterJSON,
    toJSON: FilterToJSON,
    fromJSON: JSONToFilter,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        table: { type: "string" },
        view: { type: "uuid", linkTo: "View" },
        user: { type: "uuid", linkTo: "User" },
        name: { type: "string" },
        columns: { type: "array", items: FILTER_COLUMN_META },
        default: { type: "boolean" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
