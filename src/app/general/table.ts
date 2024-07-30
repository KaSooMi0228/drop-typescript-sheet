import { Decimal } from "decimal.js";
import { Percentage } from "../../clay/common";
import { RecordMeta } from "../../clay/meta";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";

//!Data
export type General = {
    id: UUID;
    recordVersion: Version;
    aCfBonusPercentage: Percentage;
};

export const GENERAL_SETTINGS_ID = "0879b673-368d-4b0c-95e1-b74e49c7000a";

// BEGIN MAGIC -- DO NOT EDIT
export type GeneralJSON = {
    id: string;
    recordVersion: number | null;
    aCfBonusPercentage: string;
};

export function JSONToGeneral(json: GeneralJSON): General {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        aCfBonusPercentage: new Decimal(json.aCfBonusPercentage),
    };
}
export type GeneralBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    aCfBonusPercentage?: string;
};

export function newGeneral(): General {
    return JSONToGeneral(repairGeneralJSON(undefined));
}
export function repairGeneralJSON(
    json: GeneralBrokenJSON | undefined
): GeneralJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            aCfBonusPercentage: json.aCfBonusPercentage || "0",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            aCfBonusPercentage: undefined || "0",
        };
    }
}

export function GeneralToJSON(value: General): GeneralJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        aCfBonusPercentage: value.aCfBonusPercentage.toString(),
    };
}

export const GENERAL_META: RecordMeta<
    General,
    GeneralJSON,
    GeneralBrokenJSON
> & { name: "General" } = {
    name: "General",
    type: "record",
    repair: repairGeneralJSON,
    toJSON: GeneralToJSON,
    fromJSON: JSONToGeneral,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        aCfBonusPercentage: { type: "percentage" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
