import Decimal from "decimal.js";
import { Money } from "../../../clay/common";
import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { genUUID, UUID } from "../../../clay/uuid";
import { Version } from "../../../clay/version";
import {
    ApplicationType,
    ApplicationTypeOption,
    Substrate,
} from "../types/table";

//!Data
export type FinishSchedule = {
    id: UUID;
    recordVersion: Version;
    rate: Money;
    applicationType: Link<ApplicationType>;
    defaultApplication: Link<ApplicationTypeOption>;
    substrates: Link<Substrate>[];
    name: string;
    content: string;
};

// BEGIN MAGIC -- DO NOT EDIT
export type FinishScheduleJSON = {
    id: string;
    recordVersion: number | null;
    rate: string;
    applicationType: string | null;
    defaultApplication: string | null;
    substrates: (string | null)[];
    name: string;
    content: string;
};

export function JSONToFinishSchedule(json: FinishScheduleJSON): FinishSchedule {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        rate: new Decimal(json.rate),
        applicationType: json.applicationType,
        defaultApplication: json.defaultApplication,
        substrates: json.substrates.map((inner) => inner),
        name: json.name,
        content: json.content,
    };
}
export type FinishScheduleBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    rate?: string;
    applicationType?: string | null;
    defaultApplication?: string | null;
    substrates?: (string | null)[];
    name?: string;
    content?: string;
};

export function newFinishSchedule(): FinishSchedule {
    return JSONToFinishSchedule(repairFinishScheduleJSON(undefined));
}
export function repairFinishScheduleJSON(
    json: FinishScheduleBrokenJSON | undefined
): FinishScheduleJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            rate: json.rate || "0",
            applicationType: json.applicationType || null,
            defaultApplication: json.defaultApplication || null,
            substrates: (json.substrates || []).map((inner) => inner || null),
            name: json.name || "",
            content: json.content || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            rate: undefined || "0",
            applicationType: undefined || null,
            defaultApplication: undefined || null,
            substrates: (undefined || []).map((inner) => inner || null),
            name: undefined || "",
            content: undefined || "",
        };
    }
}

export function FinishScheduleToJSON(
    value: FinishSchedule
): FinishScheduleJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        rate: value.rate.toString(),
        applicationType: value.applicationType,
        defaultApplication: value.defaultApplication,
        substrates: value.substrates.map((inner) => inner),
        name: value.name,
        content: value.content,
    };
}

export const FINISH_SCHEDULE_META: RecordMeta<
    FinishSchedule,
    FinishScheduleJSON,
    FinishScheduleBrokenJSON
> & { name: "FinishSchedule" } = {
    name: "FinishSchedule",
    type: "record",
    repair: repairFinishScheduleJSON,
    toJSON: FinishScheduleToJSON,
    fromJSON: JSONToFinishSchedule,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        rate: { type: "money" },
        applicationType: { type: "uuid", linkTo: "ApplicationType" },
        defaultApplication: { type: "uuid", linkTo: "ApplicationTypeOption" },
        substrates: {
            type: "array",
            items: { type: "uuid", linkTo: "Substrate" },
        },
        name: { type: "string" },
        content: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
