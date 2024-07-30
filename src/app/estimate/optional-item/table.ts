import { RecordMeta } from "../../../clay/meta";

//!Data
export type OptionalItem = {
    include: boolean;
    name: string;
    text: string;
};

// BEGIN MAGIC -- DO NOT EDIT
export type OptionalItemJSON = {
    include: boolean;
    name: string;
    text: string;
};

export function JSONToOptionalItem(json: OptionalItemJSON): OptionalItem {
    return {
        include: json.include,
        name: json.name,
        text: json.text,
    };
}
export type OptionalItemBrokenJSON = {
    include?: boolean;
    name?: string;
    text?: string;
};

export function newOptionalItem(): OptionalItem {
    return JSONToOptionalItem(repairOptionalItemJSON(undefined));
}
export function repairOptionalItemJSON(
    json: OptionalItemBrokenJSON | undefined
): OptionalItemJSON {
    if (json) {
        return {
            include: json.include || false,
            name: json.name || "",
            text: json.text || "",
        };
    } else {
        return {
            include: undefined || false,
            name: undefined || "",
            text: undefined || "",
        };
    }
}

export function OptionalItemToJSON(value: OptionalItem): OptionalItemJSON {
    return {
        include: value.include,
        name: value.name,
        text: value.text,
    };
}

export const OPTIONAL_ITEM_META: RecordMeta<
    OptionalItem,
    OptionalItemJSON,
    OptionalItemBrokenJSON
> & { name: "OptionalItem" } = {
    name: "OptionalItem",
    type: "record",
    repair: repairOptionalItemJSON,
    toJSON: OptionalItemToJSON,
    fromJSON: JSONToOptionalItem,
    fields: {
        include: { type: "boolean" },
        name: { type: "string" },
        text: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
