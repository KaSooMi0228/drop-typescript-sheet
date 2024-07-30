import { parseISO as dateParse } from "date-fns";
import { Link } from "../../clay/link";
import { RecordMeta } from "../../clay/meta";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";
import { User } from "../user/table";

export type NoticeDetail =
    | {
          type: "ASSIGNED_TO_PROJECT";
          project: string;
          role: string;
      }
    | {
          type: "PROJECT_MODIFIED";
          project: string;
          diff: { [key: string]: any };
      };

//!Data
export type Notice = {
    id: UUID;
    recordVersion: Version;
    addedDateTime: Date | null;
    source_user: Link<User>;
    to: Link<User>;
    detail: string;
};

//!Data
export type ChangeRejected = {
    id: UUID;
    tableName: string;
    recordId: UUID;
    recordVersion: Version;
    addedDateTime: Date | null;
    addedBy: Link<User>;
    detail: string;
};

// BEGIN MAGIC -- DO NOT EDIT
export type NoticeJSON = {
    id: string;
    recordVersion: number | null;
    addedDateTime: string | null;
    source_user: string | null;
    to: string | null;
    detail: string;
};

export function JSONToNotice(json: NoticeJSON): Notice {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        addedDateTime:
            json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
        source_user: json.source_user,
        to: json.to,
        detail: json.detail,
    };
}
export type NoticeBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    addedDateTime?: string | null;
    source_user?: string | null;
    to?: string | null;
    detail?: string;
};

export function newNotice(): Notice {
    return JSONToNotice(repairNoticeJSON(undefined));
}
export function repairNoticeJSON(
    json: NoticeBrokenJSON | undefined
): NoticeJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            addedDateTime: json.addedDateTime
                ? new Date(json.addedDateTime!).toISOString()
                : null,
            source_user: json.source_user || null,
            to: json.to || null,
            detail: json.detail || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            addedDateTime: undefined
                ? new Date(undefined!).toISOString()
                : null,
            source_user: undefined || null,
            to: undefined || null,
            detail: undefined || "",
        };
    }
}

export function NoticeToJSON(value: Notice): NoticeJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        addedDateTime:
            value.addedDateTime !== null
                ? value.addedDateTime.toISOString()
                : null,
        source_user: value.source_user,
        to: value.to,
        detail: value.detail,
    };
}

export const NOTICE_META: RecordMeta<Notice, NoticeJSON, NoticeBrokenJSON> & {
    name: "Notice";
} = {
    name: "Notice",
    type: "record",
    repair: repairNoticeJSON,
    toJSON: NoticeToJSON,
    fromJSON: JSONToNotice,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        addedDateTime: { type: "datetime" },
        source_user: { type: "uuid", linkTo: "User" },
        to: { type: "uuid", linkTo: "User" },
        detail: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type ChangeRejectedJSON = {
    id: string;
    tableName: string;
    recordId: string;
    recordVersion: number | null;
    addedDateTime: string | null;
    addedBy: string | null;
    detail: string;
};

export function JSONToChangeRejected(json: ChangeRejectedJSON): ChangeRejected {
    return {
        id: { uuid: json.id },
        tableName: json.tableName,
        recordId: { uuid: json.recordId },
        recordVersion: { version: json.recordVersion },
        addedDateTime:
            json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
        addedBy: json.addedBy,
        detail: json.detail,
    };
}
export type ChangeRejectedBrokenJSON = {
    id?: string;
    tableName?: string;
    recordId?: string;
    recordVersion?: number | null;
    addedDateTime?: string | null;
    addedBy?: string | null;
    detail?: string;
};

export function newChangeRejected(): ChangeRejected {
    return JSONToChangeRejected(repairChangeRejectedJSON(undefined));
}
export function repairChangeRejectedJSON(
    json: ChangeRejectedBrokenJSON | undefined
): ChangeRejectedJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            tableName: json.tableName || "",
            recordId: json.recordId || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            addedDateTime: json.addedDateTime
                ? new Date(json.addedDateTime!).toISOString()
                : null,
            addedBy: json.addedBy || null,
            detail: json.detail || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            tableName: undefined || "",
            recordId: undefined || genUUID(),
            recordVersion: null,
            addedDateTime: undefined
                ? new Date(undefined!).toISOString()
                : null,
            addedBy: undefined || null,
            detail: undefined || "",
        };
    }
}

export function ChangeRejectedToJSON(
    value: ChangeRejected
): ChangeRejectedJSON {
    return {
        id: value.id.uuid,
        tableName: value.tableName,
        recordId: value.recordId.uuid,
        recordVersion: value.recordVersion.version,
        addedDateTime:
            value.addedDateTime !== null
                ? value.addedDateTime.toISOString()
                : null,
        addedBy: value.addedBy,
        detail: value.detail,
    };
}

export const CHANGE_REJECTED_META: RecordMeta<
    ChangeRejected,
    ChangeRejectedJSON,
    ChangeRejectedBrokenJSON
> & { name: "ChangeRejected" } = {
    name: "ChangeRejected",
    type: "record",
    repair: repairChangeRejectedJSON,
    toJSON: ChangeRejectedToJSON,
    fromJSON: JSONToChangeRejected,
    fields: {
        id: { type: "uuid" },
        tableName: { type: "string" },
        recordId: { type: "uuid" },
        recordVersion: { type: "version" },
        addedDateTime: { type: "datetime" },
        addedBy: { type: "uuid", linkTo: "User" },
        detail: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
