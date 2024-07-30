import { User } from "@sentry/node";
import dateParse from "date-fns/parseISO";
import { Decimal } from "decimal.js";
import { Quantity } from "../../clay/common";
import { Link } from "../../clay/link";
import { RecordMeta } from "../../clay/meta";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";
import { ProjectDescription } from "../project-description/table";

//!Data
export type WarrantyHistoryRecord = {
    user: Link<User>;
    datetime: Date | null;
    event: "generate" | "unlock";
};

//!Data
export type WarrantyLength = {
    id: UUID;
    recordVersion: Version;

    name: string;
    legal: string;
    number: Quantity;
};

//!Data
export type WarrantyTemplate = {
    id: UUID;
    recordVersion: Version;

    name: string;
    content: string;
    length: Link<WarrantyLength>;
    scheduleReview: boolean;
    projectDescriptions: Link<ProjectDescription>[];
};

//!Data
export type Warranty = {
    id: UUID;
    name: string;
    content: string;
    length: Link<WarrantyLength>;
    scheduleReview: boolean;
    active: boolean;
    exceptions: string;
};

// BEGIN MAGIC -- DO NOT EDIT
export type WarrantyHistoryRecordJSON = {
    user: string | null;
    datetime: string | null;
    event: string;
};

export function JSONToWarrantyHistoryRecord(
    json: WarrantyHistoryRecordJSON
): WarrantyHistoryRecord {
    return {
        user: json.user,
        datetime: json.datetime !== null ? dateParse(json.datetime) : null,
        event: json.event as any,
    };
}
export type WarrantyHistoryRecordBrokenJSON = {
    user?: string | null;
    datetime?: string | null;
    event?: string;
};

export function newWarrantyHistoryRecord(): WarrantyHistoryRecord {
    return JSONToWarrantyHistoryRecord(
        repairWarrantyHistoryRecordJSON(undefined)
    );
}
export function repairWarrantyHistoryRecordJSON(
    json: WarrantyHistoryRecordBrokenJSON | undefined
): WarrantyHistoryRecordJSON {
    if (json) {
        return {
            user: json.user || null,
            datetime: json.datetime
                ? new Date(json.datetime!).toISOString()
                : null,
            event: json.event || "generate",
        };
    } else {
        return {
            user: undefined || null,
            datetime: undefined ? new Date(undefined!).toISOString() : null,
            event: undefined || "generate",
        };
    }
}

export function WarrantyHistoryRecordToJSON(
    value: WarrantyHistoryRecord
): WarrantyHistoryRecordJSON {
    return {
        user: value.user,
        datetime: value.datetime !== null ? value.datetime.toISOString() : null,
        event: value.event,
    };
}

export const WARRANTY_HISTORY_RECORD_META: RecordMeta<
    WarrantyHistoryRecord,
    WarrantyHistoryRecordJSON,
    WarrantyHistoryRecordBrokenJSON
> & { name: "WarrantyHistoryRecord" } = {
    name: "WarrantyHistoryRecord",
    type: "record",
    repair: repairWarrantyHistoryRecordJSON,
    toJSON: WarrantyHistoryRecordToJSON,
    fromJSON: JSONToWarrantyHistoryRecord,
    fields: {
        user: { type: "uuid", linkTo: "User" },
        datetime: { type: "datetime" },
        event: {
            type: "enum",
            values: ["generate", "unlock"],
        },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type WarrantyLengthJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    legal: string;
    number: string;
};

export function JSONToWarrantyLength(json: WarrantyLengthJSON): WarrantyLength {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        legal: json.legal,
        number: new Decimal(json.number),
    };
}
export type WarrantyLengthBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    legal?: string;
    number?: string;
};

export function newWarrantyLength(): WarrantyLength {
    return JSONToWarrantyLength(repairWarrantyLengthJSON(undefined));
}
export function repairWarrantyLengthJSON(
    json: WarrantyLengthBrokenJSON | undefined
): WarrantyLengthJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            legal: json.legal || "",
            number: json.number || "0",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            legal: undefined || "",
            number: undefined || "0",
        };
    }
}

export function WarrantyLengthToJSON(
    value: WarrantyLength
): WarrantyLengthJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        legal: value.legal,
        number: value.number.toString(),
    };
}

export const WARRANTY_LENGTH_META: RecordMeta<
    WarrantyLength,
    WarrantyLengthJSON,
    WarrantyLengthBrokenJSON
> & { name: "WarrantyLength" } = {
    name: "WarrantyLength",
    type: "record",
    repair: repairWarrantyLengthJSON,
    toJSON: WarrantyLengthToJSON,
    fromJSON: JSONToWarrantyLength,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        legal: { type: "string" },
        number: { type: "quantity" },
    },
    userFacingKey: "number",
    functions: {},
    segments: {},
};

export type WarrantyTemplateJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    content: string;
    length: string | null;
    scheduleReview: boolean;
    projectDescriptions: (string | null)[];
};

export function JSONToWarrantyTemplate(
    json: WarrantyTemplateJSON
): WarrantyTemplate {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        content: json.content,
        length: json.length,
        scheduleReview: json.scheduleReview,
        projectDescriptions: json.projectDescriptions.map((inner) => inner),
    };
}
export type WarrantyTemplateBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    content?: string;
    length?: string | null;
    scheduleReview?: boolean;
    projectDescriptions?: (string | null)[];
};

export function newWarrantyTemplate(): WarrantyTemplate {
    return JSONToWarrantyTemplate(repairWarrantyTemplateJSON(undefined));
}
export function repairWarrantyTemplateJSON(
    json: WarrantyTemplateBrokenJSON | undefined
): WarrantyTemplateJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            content: json.content || "",
            length: json.length || null,
            scheduleReview: json.scheduleReview || false,
            projectDescriptions: (json.projectDescriptions || []).map(
                (inner) => inner || null
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            content: undefined || "",
            length: undefined || null,
            scheduleReview: undefined || false,
            projectDescriptions: (undefined || []).map(
                (inner) => inner || null
            ),
        };
    }
}

export function WarrantyTemplateToJSON(
    value: WarrantyTemplate
): WarrantyTemplateJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        content: value.content,
        length: value.length,
        scheduleReview: value.scheduleReview,
        projectDescriptions: value.projectDescriptions.map((inner) => inner),
    };
}

export const WARRANTY_TEMPLATE_META: RecordMeta<
    WarrantyTemplate,
    WarrantyTemplateJSON,
    WarrantyTemplateBrokenJSON
> & { name: "WarrantyTemplate" } = {
    name: "WarrantyTemplate",
    type: "record",
    repair: repairWarrantyTemplateJSON,
    toJSON: WarrantyTemplateToJSON,
    fromJSON: JSONToWarrantyTemplate,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        content: { type: "string" },
        length: { type: "uuid", linkTo: "WarrantyLength" },
        scheduleReview: { type: "boolean" },
        projectDescriptions: {
            type: "array",
            items: { type: "uuid", linkTo: "ProjectDescription" },
        },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type WarrantyJSON = {
    id: string;
    name: string;
    content: string;
    length: string | null;
    scheduleReview: boolean;
    active: boolean;
    exceptions: string;
};

export function JSONToWarranty(json: WarrantyJSON): Warranty {
    return {
        id: { uuid: json.id },
        name: json.name,
        content: json.content,
        length: json.length,
        scheduleReview: json.scheduleReview,
        active: json.active,
        exceptions: json.exceptions,
    };
}
export type WarrantyBrokenJSON = {
    id?: string;
    name?: string;
    content?: string;
    length?: string | null;
    scheduleReview?: boolean;
    active?: boolean;
    exceptions?: string;
};

export function newWarranty(): Warranty {
    return JSONToWarranty(repairWarrantyJSON(undefined));
}
export function repairWarrantyJSON(
    json: WarrantyBrokenJSON | undefined
): WarrantyJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            content: json.content || "",
            length: json.length || null,
            scheduleReview: json.scheduleReview || false,
            active: json.active || false,
            exceptions: json.exceptions || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            content: undefined || "",
            length: undefined || null,
            scheduleReview: undefined || false,
            active: undefined || false,
            exceptions: undefined || "",
        };
    }
}

export function WarrantyToJSON(value: Warranty): WarrantyJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        content: value.content,
        length: value.length,
        scheduleReview: value.scheduleReview,
        active: value.active,
        exceptions: value.exceptions,
    };
}

export const WARRANTY_META: RecordMeta<
    Warranty,
    WarrantyJSON,
    WarrantyBrokenJSON
> & { name: "Warranty" } = {
    name: "Warranty",
    type: "record",
    repair: repairWarrantyJSON,
    toJSON: WarrantyToJSON,
    fromJSON: JSONToWarranty,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        content: { type: "string" },
        length: { type: "uuid", linkTo: "WarrantyLength" },
        scheduleReview: { type: "boolean" },
        active: { type: "boolean" },
        exceptions: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
