import { User } from "@sentry/node";
import dateParse from "date-fns/parseISO";
import { Link } from "../clay/link";
import { RecordMeta } from "../clay/meta";
import { lastItem, setDifference } from "../clay/queryFuncs";
import { genUUID, UUID } from "../clay/uuid";
import { Version } from "../clay/version";
import { Project } from "./project/table";

//!Data
export type ThreadMessage = {
    author: Link<User>;
    datetime: Date | null;
    message: string;
};

//!Data
export type Thread = {
    id: UUID;
    recordVersion: Version;
    to: Link<User>[];
    subject: string;
    hidden: Link<User>[];
    read: Link<User>[];
    project: Link<Project>[];
    contacts: Link<Project>[];
    messages: ThreadMessage[];
};

export function calcThreadLastMessageDate(thread: Thread): Date | null {
    return lastItem(thread.messages, (message) => message.datetime);
}

export function calcThreadVisibleTo(thread: Thread): Link<User>[] {
    return setDifference(thread.to, thread.hidden);
}

// BEGIN MAGIC -- DO NOT EDIT
export type ThreadMessageJSON = {
    author: string | null;
    datetime: string | null;
    message: string;
};

export function JSONToThreadMessage(json: ThreadMessageJSON): ThreadMessage {
    return {
        author: json.author,
        datetime: json.datetime !== null ? dateParse(json.datetime) : null,
        message: json.message,
    };
}
export type ThreadMessageBrokenJSON = {
    author?: string | null;
    datetime?: string | null;
    message?: string;
};

export function newThreadMessage(): ThreadMessage {
    return JSONToThreadMessage(repairThreadMessageJSON(undefined));
}
export function repairThreadMessageJSON(
    json: ThreadMessageBrokenJSON | undefined
): ThreadMessageJSON {
    if (json) {
        return {
            author: json.author || null,
            datetime: json.datetime
                ? new Date(json.datetime!).toISOString()
                : null,
            message: json.message || "",
        };
    } else {
        return {
            author: undefined || null,
            datetime: undefined ? new Date(undefined!).toISOString() : null,
            message: undefined || "",
        };
    }
}

export function ThreadMessageToJSON(value: ThreadMessage): ThreadMessageJSON {
    return {
        author: value.author,
        datetime: value.datetime !== null ? value.datetime.toISOString() : null,
        message: value.message,
    };
}

export const THREAD_MESSAGE_META: RecordMeta<
    ThreadMessage,
    ThreadMessageJSON,
    ThreadMessageBrokenJSON
> & { name: "ThreadMessage" } = {
    name: "ThreadMessage",
    type: "record",
    repair: repairThreadMessageJSON,
    toJSON: ThreadMessageToJSON,
    fromJSON: JSONToThreadMessage,
    fields: {
        author: { type: "uuid", linkTo: "User" },
        datetime: { type: "datetime" },
        message: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type ThreadJSON = {
    id: string;
    recordVersion: number | null;
    to: (string | null)[];
    subject: string;
    hidden: (string | null)[];
    read: (string | null)[];
    project: (string | null)[];
    contacts: (string | null)[];
    messages: ThreadMessageJSON[];
};

export function JSONToThread(json: ThreadJSON): Thread {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        to: json.to.map((inner) => inner),
        subject: json.subject,
        hidden: json.hidden.map((inner) => inner),
        read: json.read.map((inner) => inner),
        project: json.project.map((inner) => inner),
        contacts: json.contacts.map((inner) => inner),
        messages: json.messages.map((inner) => JSONToThreadMessage(inner)),
    };
}
export type ThreadBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    to?: (string | null)[];
    subject?: string;
    hidden?: (string | null)[];
    read?: (string | null)[];
    project?: (string | null)[];
    contacts?: (string | null)[];
    messages?: ThreadMessageJSON[];
};

export function newThread(): Thread {
    return JSONToThread(repairThreadJSON(undefined));
}
export function repairThreadJSON(
    json: ThreadBrokenJSON | undefined
): ThreadJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            to: (json.to || []).map((inner) => inner || null),
            subject: json.subject || "",
            hidden: (json.hidden || []).map((inner) => inner || null),
            read: (json.read || []).map((inner) => inner || null),
            project: (json.project || []).map((inner) => inner || null),
            contacts: (json.contacts || []).map((inner) => inner || null),
            messages: (json.messages || []).map((inner) =>
                repairThreadMessageJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            to: (undefined || []).map((inner) => inner || null),
            subject: undefined || "",
            hidden: (undefined || []).map((inner) => inner || null),
            read: (undefined || []).map((inner) => inner || null),
            project: (undefined || []).map((inner) => inner || null),
            contacts: (undefined || []).map((inner) => inner || null),
            messages: (undefined || []).map((inner) =>
                repairThreadMessageJSON(inner)
            ),
        };
    }
}

export function ThreadToJSON(value: Thread): ThreadJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        to: value.to.map((inner) => inner),
        subject: value.subject,
        hidden: value.hidden.map((inner) => inner),
        read: value.read.map((inner) => inner),
        project: value.project.map((inner) => inner),
        contacts: value.contacts.map((inner) => inner),
        messages: value.messages.map((inner) => ThreadMessageToJSON(inner)),
    };
}

export const THREAD_META: RecordMeta<Thread, ThreadJSON, ThreadBrokenJSON> & {
    name: "Thread";
} = {
    name: "Thread",
    type: "record",
    repair: repairThreadJSON,
    toJSON: ThreadToJSON,
    fromJSON: JSONToThread,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        to: { type: "array", items: { type: "uuid", linkTo: "User" } },
        subject: { type: "string" },
        hidden: { type: "array", items: { type: "uuid", linkTo: "User" } },
        read: { type: "array", items: { type: "uuid", linkTo: "User" } },
        project: { type: "array", items: { type: "uuid", linkTo: "Project" } },
        contacts: { type: "array", items: { type: "uuid", linkTo: "Project" } },
        messages: { type: "array", items: THREAD_MESSAGE_META },
    },
    userFacingKey: null,
    functions: {
        lastMessageDate: {
            fn: calcThreadLastMessageDate,
            parameterTypes: () => [THREAD_META],
            returnType: { type: "datetime" },
        },
        visibleTo: {
            fn: calcThreadVisibleTo,
            parameterTypes: () => [THREAD_META],
            returnType: {
                type: "array",
                items: { type: "uuid", linkTo: "User" },
            },
        },
    },
    segments: {},
};

// END MAGIC -- DO NOT EDIT
