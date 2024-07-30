import { User } from "@sentry/node";
import dateParse from "date-fns/parseISO";
import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { daysAgo, isNull } from "../../../clay/queryFuncs";
import { genUUID, UUID } from "../../../clay/uuid";
import { Version } from "../../../clay/version";
import { Project } from "../table";

//!Data
export type CoreValueNoticeType = {
    id: UUID;
    name: string;
};

//!Data
export type CoreValueNoticeCategory = {
    id: UUID;
    recordVersion: Version;
    name: string;
    types: CoreValueNoticeType[];
    introText: string;
    conclusionText: string;
};

//!Data
export type CoreValueNotice = {
    id: UUID;
    recordVersion: Version;
    project: Link<Project>;
    addedDateTime: Date | null;
    firstDate: Date | null;
    date: Date | null;
    category: Link<CoreValueNoticeCategory>;
    type: Link<CoreValueNoticeType>;
    custom: string;
    user: Link<User>;
    certifiedForeman: Link<User>;
};

export function calcCoreValueNoticeUngenerated(
    coreValueNotice: CoreValueNotice
): boolean {
    return (
        isNull(coreValueNotice.date) &&
        daysAgo(coreValueNotice.addedDateTime)!.gt(2)
    );
}

// BEGIN MAGIC -- DO NOT EDIT
export type CoreValueNoticeTypeJSON = {
    id: string;
    name: string;
};

export function JSONToCoreValueNoticeType(
    json: CoreValueNoticeTypeJSON
): CoreValueNoticeType {
    return {
        id: { uuid: json.id },
        name: json.name,
    };
}
export type CoreValueNoticeTypeBrokenJSON = {
    id?: string;
    name?: string;
};

export function newCoreValueNoticeType(): CoreValueNoticeType {
    return JSONToCoreValueNoticeType(repairCoreValueNoticeTypeJSON(undefined));
}
export function repairCoreValueNoticeTypeJSON(
    json: CoreValueNoticeTypeBrokenJSON | undefined
): CoreValueNoticeTypeJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
        };
    }
}

export function CoreValueNoticeTypeToJSON(
    value: CoreValueNoticeType
): CoreValueNoticeTypeJSON {
    return {
        id: value.id.uuid,
        name: value.name,
    };
}

export const CORE_VALUE_NOTICE_TYPE_META: RecordMeta<
    CoreValueNoticeType,
    CoreValueNoticeTypeJSON,
    CoreValueNoticeTypeBrokenJSON
> & { name: "CoreValueNoticeType" } = {
    name: "CoreValueNoticeType",
    type: "record",
    repair: repairCoreValueNoticeTypeJSON,
    toJSON: CoreValueNoticeTypeToJSON,
    fromJSON: JSONToCoreValueNoticeType,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type CoreValueNoticeCategoryJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    types: CoreValueNoticeTypeJSON[];
    introText: string;
    conclusionText: string;
};

export function JSONToCoreValueNoticeCategory(
    json: CoreValueNoticeCategoryJSON
): CoreValueNoticeCategory {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        types: json.types.map((inner) => JSONToCoreValueNoticeType(inner)),
        introText: json.introText,
        conclusionText: json.conclusionText,
    };
}
export type CoreValueNoticeCategoryBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    types?: CoreValueNoticeTypeJSON[];
    introText?: string;
    conclusionText?: string;
};

export function newCoreValueNoticeCategory(): CoreValueNoticeCategory {
    return JSONToCoreValueNoticeCategory(
        repairCoreValueNoticeCategoryJSON(undefined)
    );
}
export function repairCoreValueNoticeCategoryJSON(
    json: CoreValueNoticeCategoryBrokenJSON | undefined
): CoreValueNoticeCategoryJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            types: (json.types || []).map((inner) =>
                repairCoreValueNoticeTypeJSON(inner)
            ),
            introText: json.introText || "",
            conclusionText: json.conclusionText || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            types: (undefined || []).map((inner) =>
                repairCoreValueNoticeTypeJSON(inner)
            ),
            introText: undefined || "",
            conclusionText: undefined || "",
        };
    }
}

export function CoreValueNoticeCategoryToJSON(
    value: CoreValueNoticeCategory
): CoreValueNoticeCategoryJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        types: value.types.map((inner) => CoreValueNoticeTypeToJSON(inner)),
        introText: value.introText,
        conclusionText: value.conclusionText,
    };
}

export const CORE_VALUE_NOTICE_CATEGORY_META: RecordMeta<
    CoreValueNoticeCategory,
    CoreValueNoticeCategoryJSON,
    CoreValueNoticeCategoryBrokenJSON
> & { name: "CoreValueNoticeCategory" } = {
    name: "CoreValueNoticeCategory",
    type: "record",
    repair: repairCoreValueNoticeCategoryJSON,
    toJSON: CoreValueNoticeCategoryToJSON,
    fromJSON: JSONToCoreValueNoticeCategory,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        types: { type: "array", items: CORE_VALUE_NOTICE_TYPE_META },
        introText: { type: "string" },
        conclusionText: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type CoreValueNoticeJSON = {
    id: string;
    recordVersion: number | null;
    project: string | null;
    addedDateTime: string | null;
    firstDate: string | null;
    date: string | null;
    category: string | null;
    type: string | null;
    custom: string;
    user: string | null;
    certifiedForeman: string | null;
};

export function JSONToCoreValueNotice(
    json: CoreValueNoticeJSON
): CoreValueNotice {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        project: json.project,
        addedDateTime:
            json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
        firstDate: json.firstDate !== null ? dateParse(json.firstDate) : null,
        date: json.date !== null ? dateParse(json.date) : null,
        category: json.category,
        type: json.type,
        custom: json.custom,
        user: json.user,
        certifiedForeman: json.certifiedForeman,
    };
}
export type CoreValueNoticeBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    project?: string | null;
    addedDateTime?: string | null;
    firstDate?: string | null;
    date?: string | null;
    category?: string | null;
    type?: string | null;
    custom?: string;
    user?: string | null;
    certifiedForeman?: string | null;
};

export function newCoreValueNotice(): CoreValueNotice {
    return JSONToCoreValueNotice(repairCoreValueNoticeJSON(undefined));
}
export function repairCoreValueNoticeJSON(
    json: CoreValueNoticeBrokenJSON | undefined
): CoreValueNoticeJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            project: json.project || null,
            addedDateTime: json.addedDateTime
                ? new Date(json.addedDateTime!).toISOString()
                : null,
            firstDate: json.firstDate
                ? new Date(json.firstDate!).toISOString()
                : null,
            date: json.date ? new Date(json.date!).toISOString() : null,
            category: json.category || null,
            type: json.type || null,
            custom: json.custom || "",
            user: json.user || null,
            certifiedForeman: json.certifiedForeman || null,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            project: undefined || null,
            addedDateTime: undefined
                ? new Date(undefined!).toISOString()
                : null,
            firstDate: undefined ? new Date(undefined!).toISOString() : null,
            date: undefined ? new Date(undefined!).toISOString() : null,
            category: undefined || null,
            type: undefined || null,
            custom: undefined || "",
            user: undefined || null,
            certifiedForeman: undefined || null,
        };
    }
}

export function CoreValueNoticeToJSON(
    value: CoreValueNotice
): CoreValueNoticeJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        project: value.project,
        addedDateTime:
            value.addedDateTime !== null
                ? value.addedDateTime.toISOString()
                : null,
        firstDate:
            value.firstDate !== null ? value.firstDate.toISOString() : null,
        date: value.date !== null ? value.date.toISOString() : null,
        category: value.category,
        type: value.type,
        custom: value.custom,
        user: value.user,
        certifiedForeman: value.certifiedForeman,
    };
}

export const CORE_VALUE_NOTICE_META: RecordMeta<
    CoreValueNotice,
    CoreValueNoticeJSON,
    CoreValueNoticeBrokenJSON
> & { name: "CoreValueNotice" } = {
    name: "CoreValueNotice",
    type: "record",
    repair: repairCoreValueNoticeJSON,
    toJSON: CoreValueNoticeToJSON,
    fromJSON: JSONToCoreValueNotice,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        project: { type: "uuid", linkTo: "Project" },
        addedDateTime: { type: "datetime" },
        firstDate: { type: "datetime" },
        date: { type: "datetime" },
        category: { type: "uuid", linkTo: "CoreValueNoticeCategory" },
        type: { type: "uuid", linkTo: "CoreValueNoticeType" },
        custom: { type: "string" },
        user: { type: "uuid", linkTo: "User" },
        certifiedForeman: { type: "uuid", linkTo: "User" },
    },
    userFacingKey: null,
    functions: {
        ungenerated: {
            fn: calcCoreValueNoticeUngenerated,
            parameterTypes: () => [CORE_VALUE_NOTICE_META],
            returnType: { type: "boolean" },
        },
    },
    segments: {},
};

// END MAGIC -- DO NOT EDIT
