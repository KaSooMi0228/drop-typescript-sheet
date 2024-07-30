import dateParse from "date-fns/parseISO";
import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { genUUID, UUID } from "../../../clay/uuid";
import { Version } from "../../../clay/version";
import { User } from "../../user/table";
import { Project } from "../table";

//!Data
export type ProjectEmail = {
    id: UUID;
    recordVersion: Version;
    addedDateTime: Date | null;
    update: boolean;
    project: Link<Project>;
    sender: Link<User>;
    subject: string;
};

// BEGIN MAGIC -- DO NOT EDIT
export type ProjectEmailJSON = {
    id: string;
    recordVersion: number | null;
    addedDateTime: string | null;
    update: boolean;
    project: string | null;
    sender: string | null;
    subject: string;
};

export function JSONToProjectEmail(json: ProjectEmailJSON): ProjectEmail {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        addedDateTime:
            json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
        update: json.update,
        project: json.project,
        sender: json.sender,
        subject: json.subject,
    };
}
export type ProjectEmailBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    addedDateTime?: string | null;
    update?: boolean;
    project?: string | null;
    sender?: string | null;
    subject?: string;
};

export function newProjectEmail(): ProjectEmail {
    return JSONToProjectEmail(repairProjectEmailJSON(undefined));
}
export function repairProjectEmailJSON(
    json: ProjectEmailBrokenJSON | undefined
): ProjectEmailJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            addedDateTime: json.addedDateTime
                ? new Date(json.addedDateTime!).toISOString()
                : null,
            update: json.update || false,
            project: json.project || null,
            sender: json.sender || null,
            subject: json.subject || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            addedDateTime: undefined
                ? new Date(undefined!).toISOString()
                : null,
            update: undefined || false,
            project: undefined || null,
            sender: undefined || null,
            subject: undefined || "",
        };
    }
}

export function ProjectEmailToJSON(value: ProjectEmail): ProjectEmailJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        addedDateTime:
            value.addedDateTime !== null
                ? value.addedDateTime.toISOString()
                : null,
        update: value.update,
        project: value.project,
        sender: value.sender,
        subject: value.subject,
    };
}

export const PROJECT_EMAIL_META: RecordMeta<
    ProjectEmail,
    ProjectEmailJSON,
    ProjectEmailBrokenJSON
> & { name: "ProjectEmail" } = {
    name: "ProjectEmail",
    type: "record",
    repair: repairProjectEmailJSON,
    toJSON: ProjectEmailToJSON,
    fromJSON: JSONToProjectEmail,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        addedDateTime: { type: "datetime" },
        update: { type: "boolean" },
        project: { type: "uuid", linkTo: "Project" },
        sender: { type: "uuid", linkTo: "User" },
        subject: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
