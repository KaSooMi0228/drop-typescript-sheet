import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { genUUID, UUID } from "../../../clay/uuid";
import { Version } from "../../../clay/version";
import { LandingLikelihood } from "../../project/pending-quote-history/table";

//!Data
export type QuotationType = {
    id: UUID;
    recordVersion: Version;
    name: string;
    print: boolean;
    defaultLandingLikelihood: Link<LandingLikelihood>;
};

export const NEW_CONSTRUCTION_QUOTATION_TYPE_ID =
    "3e564628-007c-4007-b72c-1772ec64c888";

// BEGIN MAGIC -- DO NOT EDIT
export type QuotationTypeJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    print: boolean;
    defaultLandingLikelihood: string | null;
};

export function JSONToQuotationType(json: QuotationTypeJSON): QuotationType {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        print: json.print,
        defaultLandingLikelihood: json.defaultLandingLikelihood,
    };
}
export type QuotationTypeBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    print?: boolean;
    defaultLandingLikelihood?: string | null;
};

export function newQuotationType(): QuotationType {
    return JSONToQuotationType(repairQuotationTypeJSON(undefined));
}
export function repairQuotationTypeJSON(
    json: QuotationTypeBrokenJSON | undefined
): QuotationTypeJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            print: json.print || false,
            defaultLandingLikelihood: json.defaultLandingLikelihood || null,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            print: undefined || false,
            defaultLandingLikelihood: undefined || null,
        };
    }
}

export function QuotationTypeToJSON(value: QuotationType): QuotationTypeJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        print: value.print,
        defaultLandingLikelihood: value.defaultLandingLikelihood,
    };
}

export const QUOTATION_TYPE_META: RecordMeta<
    QuotationType,
    QuotationTypeJSON,
    QuotationTypeBrokenJSON
> & { name: "QuotationType" } = {
    name: "QuotationType",
    type: "record",
    repair: repairQuotationTypeJSON,
    toJSON: QuotationTypeToJSON,
    fromJSON: JSONToQuotationType,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        print: { type: "boolean" },
        defaultLandingLikelihood: { type: "uuid", linkTo: "LandingLikelihood" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
