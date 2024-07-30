import { RecordMeta } from "../../clay/meta";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";

//!Data
export type Industry = {
    id: UUID;
    recordVersion: Version;
    name: string;
};

// BEGIN MAGIC -- DO NOT EDIT
export type IndustryJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
};

export function JSONToIndustry(json: IndustryJSON): Industry {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
    };
}
export type IndustryBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
};

export function newIndustry(): Industry {
    return JSONToIndustry(repairIndustryJSON(undefined));
}
export function repairIndustryJSON(
    json: IndustryBrokenJSON | undefined
): IndustryJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
        };
    }
}

export function IndustryToJSON(value: Industry): IndustryJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
    };
}

export const INDUSTRY_META: RecordMeta<
    Industry,
    IndustryJSON,
    IndustryBrokenJSON
> & { name: "Industry" } = {
    name: "Industry",
    type: "record",
    repair: repairIndustryJSON,
    toJSON: IndustryToJSON,
    fromJSON: JSONToIndustry,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
