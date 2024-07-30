import dateParse from "date-fns/parseISO";
import { Link } from "../../clay/link";
import { RecordMeta } from "../../clay/meta";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";
import { Project } from "../project/table";
import { User } from "../user/table";

//!Data
export type Message = {
    id: UUID;
    recordVersion: Version;

    author: Link<User>;
    project: Link<Project>;
    mentions: Link<User>[];
    hashtags: string[];
    content: string;
    added: Date | null;
};

// BEGIN MAGIC -- DO NOT EDIT
export type MessageJSON = {
    id: string;
    recordVersion: number | null;
    author: string | null;
    project: string | null;
    mentions: (string | null)[];
    hashtags: string[];
    content: string;
    added: string | null;
};

export function JSONToMessage(json: MessageJSON): Message {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        author: json.author,
        project: json.project,
        mentions: json.mentions.map((inner) => inner),
        hashtags: json.hashtags.map((inner) => inner),
        content: json.content,
        added: json.added !== null ? dateParse(json.added) : null,
    };
}
export type MessageBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    author?: string | null;
    project?: string | null;
    mentions?: (string | null)[];
    hashtags?: string[];
    content?: string;
    added?: string | null;
};

export function newMessage(): Message {
    return JSONToMessage(repairMessageJSON(undefined));
}
export function repairMessageJSON(
    json: MessageBrokenJSON | undefined
): MessageJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            author: json.author || null,
            project: json.project || null,
            mentions: (json.mentions || []).map((inner) => inner || null),
            hashtags: (json.hashtags || []).map((inner) => inner || ""),
            content: json.content || "",
            added: json.added ? new Date(json.added!).toISOString() : null,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            author: undefined || null,
            project: undefined || null,
            mentions: (undefined || []).map((inner) => inner || null),
            hashtags: (undefined || []).map((inner) => inner || ""),
            content: undefined || "",
            added: undefined ? new Date(undefined!).toISOString() : null,
        };
    }
}

export function MessageToJSON(value: Message): MessageJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        author: value.author,
        project: value.project,
        mentions: value.mentions.map((inner) => inner),
        hashtags: value.hashtags.map((inner) => inner),
        content: value.content,
        added: value.added !== null ? value.added.toISOString() : null,
    };
}

export const MESSAGE_META: RecordMeta<
    Message,
    MessageJSON,
    MessageBrokenJSON
> & { name: "Message" } = {
    name: "Message",
    type: "record",
    repair: repairMessageJSON,
    toJSON: MessageToJSON,
    fromJSON: JSONToMessage,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        author: { type: "uuid", linkTo: "User" },
        project: { type: "uuid", linkTo: "Project" },
        mentions: { type: "array", items: { type: "uuid", linkTo: "User" } },
        hashtags: { type: "array", items: { type: "string" } },
        content: { type: "string" },
        added: { type: "datetime" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
