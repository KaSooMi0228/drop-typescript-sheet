import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { genUUID, UUID } from "../../../clay/uuid";
import { Version } from "../../../clay/version";

//!Data
export type QuoteSourceCategory = {
    id: UUID;
    recordVersion: Version;

    name: string;
    requireDetail: boolean;
    active: boolean;
};

//!Data
export type QuoteSource = {
    category: Link<QuoteSourceCategory>;
    detail: string;
};

// BEGIN MAGIC -- DO NOT EDIT
export type QuoteSourceCategoryJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    requireDetail: boolean;
    active: boolean;
};

export function JSONToQuoteSourceCategory(
    json: QuoteSourceCategoryJSON
): QuoteSourceCategory {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        requireDetail: json.requireDetail,
        active: json.active,
    };
}
export type QuoteSourceCategoryBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    requireDetail?: boolean;
    active?: boolean;
};

export function newQuoteSourceCategory(): QuoteSourceCategory {
    return JSONToQuoteSourceCategory(repairQuoteSourceCategoryJSON(undefined));
}
export function repairQuoteSourceCategoryJSON(
    json: QuoteSourceCategoryBrokenJSON | undefined
): QuoteSourceCategoryJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            requireDetail: json.requireDetail || false,
            active: json.active || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            requireDetail: undefined || false,
            active: undefined || false,
        };
    }
}

export function QuoteSourceCategoryToJSON(
    value: QuoteSourceCategory
): QuoteSourceCategoryJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        requireDetail: value.requireDetail,
        active: value.active,
    };
}

export const QUOTE_SOURCE_CATEGORY_META: RecordMeta<
    QuoteSourceCategory,
    QuoteSourceCategoryJSON,
    QuoteSourceCategoryBrokenJSON
> & { name: "QuoteSourceCategory" } = {
    name: "QuoteSourceCategory",
    type: "record",
    repair: repairQuoteSourceCategoryJSON,
    toJSON: QuoteSourceCategoryToJSON,
    fromJSON: JSONToQuoteSourceCategory,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        requireDetail: { type: "boolean" },
        active: { type: "boolean" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type QuoteSourceJSON = {
    category: string | null;
    detail: string;
};

export function JSONToQuoteSource(json: QuoteSourceJSON): QuoteSource {
    return {
        category: json.category,
        detail: json.detail,
    };
}
export type QuoteSourceBrokenJSON = {
    category?: string | null;
    detail?: string;
};

export function newQuoteSource(): QuoteSource {
    return JSONToQuoteSource(repairQuoteSourceJSON(undefined));
}
export function repairQuoteSourceJSON(
    json: QuoteSourceBrokenJSON | undefined
): QuoteSourceJSON {
    if (json) {
        return {
            category: json.category || null,
            detail: json.detail || "",
        };
    } else {
        return {
            category: undefined || null,
            detail: undefined || "",
        };
    }
}

export function QuoteSourceToJSON(value: QuoteSource): QuoteSourceJSON {
    return {
        category: value.category,
        detail: value.detail,
    };
}

export const QUOTE_SOURCE_META: RecordMeta<
    QuoteSource,
    QuoteSourceJSON,
    QuoteSourceBrokenJSON
> & { name: "QuoteSource" } = {
    name: "QuoteSource",
    type: "record",
    repair: repairQuoteSourceJSON,
    toJSON: QuoteSourceToJSON,
    fromJSON: JSONToQuoteSource,
    fields: {
        category: { type: "uuid", linkTo: "QuoteSourceCategory" },
        detail: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
