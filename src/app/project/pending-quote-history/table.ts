import { parseISO as dateParse } from "date-fns";
import { Decimal } from "decimal.js";
import { Percentage, Quantity } from "../../../clay/common";
import { Link } from "../../../clay/link";
import { LocalDate } from "../../../clay/LocalDate";
import { RecordMeta } from "../../../clay/meta";
import { genUUID, UUID } from "../../../clay/uuid";
import { Version } from "../../../clay/version";
import { User } from "../../user/table";

//!Data
export type LandingLikelihood = {
    id: UUID;
    recordVersion: Version;
    number: Quantity;
    weighting: Percentage;
    name: string;
};

export const REVISING_QUOTE_ID = "d97b9b36-7a34-47a3-9cca-71cc4294c9fd";

//!Data
export type PendingQuoteHistoryRecord = {
    landingLikelihood: Link<LandingLikelihood>;
    date: Date | null;
    followupDate: LocalDate | null;
    message: string;
    user: Link<User>;
};

// BEGIN MAGIC -- DO NOT EDIT
export type LandingLikelihoodJSON = {
    id: string;
    recordVersion: number | null;
    number: string;
    weighting: string;
    name: string;
};

export function JSONToLandingLikelihood(
    json: LandingLikelihoodJSON
): LandingLikelihood {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        number: new Decimal(json.number),
        weighting: new Decimal(json.weighting),
        name: json.name,
    };
}
export type LandingLikelihoodBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    number?: string;
    weighting?: string;
    name?: string;
};

export function newLandingLikelihood(): LandingLikelihood {
    return JSONToLandingLikelihood(repairLandingLikelihoodJSON(undefined));
}
export function repairLandingLikelihoodJSON(
    json: LandingLikelihoodBrokenJSON | undefined
): LandingLikelihoodJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            number: json.number || "0",
            weighting: json.weighting || "0",
            name: json.name || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            number: undefined || "0",
            weighting: undefined || "0",
            name: undefined || "",
        };
    }
}

export function LandingLikelihoodToJSON(
    value: LandingLikelihood
): LandingLikelihoodJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        number: value.number.toString(),
        weighting: value.weighting.toString(),
        name: value.name,
    };
}

export const LANDING_LIKELIHOOD_META: RecordMeta<
    LandingLikelihood,
    LandingLikelihoodJSON,
    LandingLikelihoodBrokenJSON
> & { name: "LandingLikelihood" } = {
    name: "LandingLikelihood",
    type: "record",
    repair: repairLandingLikelihoodJSON,
    toJSON: LandingLikelihoodToJSON,
    fromJSON: JSONToLandingLikelihood,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        number: { type: "quantity" },
        weighting: { type: "percentage" },
        name: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type PendingQuoteHistoryRecordJSON = {
    landingLikelihood: string | null;
    date: string | null;
    followupDate: string | null;
    message: string;
    user: string | null;
};

export function JSONToPendingQuoteHistoryRecord(
    json: PendingQuoteHistoryRecordJSON
): PendingQuoteHistoryRecord {
    return {
        landingLikelihood: json.landingLikelihood,
        date: json.date !== null ? dateParse(json.date) : null,
        followupDate:
            json.followupDate !== null
                ? LocalDate.parse(json.followupDate)
                : null,
        message: json.message,
        user: json.user,
    };
}
export type PendingQuoteHistoryRecordBrokenJSON = {
    landingLikelihood?: string | null;
    date?: string | null;
    followupDate?: string | null;
    message?: string;
    user?: string | null;
};

export function newPendingQuoteHistoryRecord(): PendingQuoteHistoryRecord {
    return JSONToPendingQuoteHistoryRecord(
        repairPendingQuoteHistoryRecordJSON(undefined)
    );
}
export function repairPendingQuoteHistoryRecordJSON(
    json: PendingQuoteHistoryRecordBrokenJSON | undefined
): PendingQuoteHistoryRecordJSON {
    if (json) {
        return {
            landingLikelihood: json.landingLikelihood || null,
            date: json.date ? new Date(json.date!).toISOString() : null,
            followupDate: json.followupDate || null,
            message: json.message || "",
            user: json.user || null,
        };
    } else {
        return {
            landingLikelihood: undefined || null,
            date: undefined ? new Date(undefined!).toISOString() : null,
            followupDate: undefined || null,
            message: undefined || "",
            user: undefined || null,
        };
    }
}

export function PendingQuoteHistoryRecordToJSON(
    value: PendingQuoteHistoryRecord
): PendingQuoteHistoryRecordJSON {
    return {
        landingLikelihood: value.landingLikelihood,
        date: value.date !== null ? value.date.toISOString() : null,
        followupDate:
            value.followupDate !== null ? value.followupDate.toString() : null,
        message: value.message,
        user: value.user,
    };
}

export const PENDING_QUOTE_HISTORY_RECORD_META: RecordMeta<
    PendingQuoteHistoryRecord,
    PendingQuoteHistoryRecordJSON,
    PendingQuoteHistoryRecordBrokenJSON
> & { name: "PendingQuoteHistoryRecord" } = {
    name: "PendingQuoteHistoryRecord",
    type: "record",
    repair: repairPendingQuoteHistoryRecordJSON,
    toJSON: PendingQuoteHistoryRecordToJSON,
    fromJSON: JSONToPendingQuoteHistoryRecord,
    fields: {
        landingLikelihood: { type: "uuid", linkTo: "LandingLikelihood" },
        date: { type: "datetime" },
        followupDate: { type: "date" },
        message: { type: "string" },
        user: { type: "uuid", linkTo: "User" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
