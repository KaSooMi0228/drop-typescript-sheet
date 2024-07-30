import { faComments } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import { useRecordQuery } from "../../clay/api";
import { Link } from "../../clay/link";
import { RecordMeta } from "../../clay/meta";
import { UUID } from "../../clay/uuid";
import { hasPermission } from "../../permissions";
import { Contact } from "../contact/table";
import { Project } from "../project/table";
import { useUser } from "../state";
import {
    JSONToThreadMessage,
    repairThreadMessageJSON,
    ThreadMessage,
    ThreadMessageJSON,
    ThreadMessageToJSON,
    THREAD_MESSAGE_META,
    THREAD_META,
} from "../thread";
import { User } from "../user/table";

export function useItems(project?: UUID) {
    const user = useUser();

    const threads = useRecordQuery(
        THREAD_META,
        {
            filters: project
                ? [
                      {
                          column: "project",
                          filter: {
                              intersects: [project.uuid],
                          },
                      },
                  ]
                : [
                      {
                          column: "to",
                          filter: {
                              intersects: [user.id],
                          },
                      },
                      {
                          not: {
                              column: "hidden",
                              filter: {
                                  intersects: [user.id],
                              },
                          },
                      },
                  ],
        },
        [],
        hasPermission(user, "Thread", "read")
    );

    return React.useMemo(() => {
        if (!threads) {
            return [];
        }

        return threads.map((thread) => ({
            projects: undefined,
            label: thread.subject,
            unread: thread.read.indexOf(user.id) === -1,
            icon: faComments,
            type: "thread" as const,
            id: thread.id.uuid,
            color: "green",
            date: thread.messages[thread.messages.length - 1].datetime,
            priority: 0,
        }));
    }, [threads]);
}

//!Data
export type OldThreadData = {
    to: Link<User>[];
    subject: string;
    message: string;
    messages: ThreadMessage[];
    projects: Link<Project>[];
    contacts: Link<Contact>[];
};

// BEGIN MAGIC -- DO NOT EDIT
export type OldThreadDataJSON = {
    to: (string | null)[];
    subject: string;
    message: string;
    messages: ThreadMessageJSON[];
    projects: (string | null)[];
    contacts: (string | null)[];
};

export function JSONToOldThreadData(json: OldThreadDataJSON): OldThreadData {
    return {
        to: json.to.map((inner) => inner),
        subject: json.subject,
        message: json.message,
        messages: json.messages.map((inner) => JSONToThreadMessage(inner)),
        projects: json.projects.map((inner) => inner),
        contacts: json.contacts.map((inner) => inner),
    };
}
export type OldThreadDataBrokenJSON = {
    to?: (string | null)[];
    subject?: string;
    message?: string;
    messages?: ThreadMessageJSON[];
    projects?: (string | null)[];
    contacts?: (string | null)[];
};

export function newOldThreadData(): OldThreadData {
    return JSONToOldThreadData(repairOldThreadDataJSON(undefined));
}
export function repairOldThreadDataJSON(
    json: OldThreadDataBrokenJSON | undefined
): OldThreadDataJSON {
    if (json) {
        return {
            to: (json.to || []).map((inner) => inner || null),
            subject: json.subject || "",
            message: json.message || "",
            messages: (json.messages || []).map((inner) =>
                repairThreadMessageJSON(inner)
            ),
            projects: (json.projects || []).map((inner) => inner || null),
            contacts: (json.contacts || []).map((inner) => inner || null),
        };
    } else {
        return {
            to: (undefined || []).map((inner) => inner || null),
            subject: undefined || "",
            message: undefined || "",
            messages: (undefined || []).map((inner) =>
                repairThreadMessageJSON(inner)
            ),
            projects: (undefined || []).map((inner) => inner || null),
            contacts: (undefined || []).map((inner) => inner || null),
        };
    }
}

export function OldThreadDataToJSON(value: OldThreadData): OldThreadDataJSON {
    return {
        to: value.to.map((inner) => inner),
        subject: value.subject,
        message: value.message,
        messages: value.messages.map((inner) => ThreadMessageToJSON(inner)),
        projects: value.projects.map((inner) => inner),
        contacts: value.contacts.map((inner) => inner),
    };
}

export const OLD_THREAD_DATA_META: RecordMeta<
    OldThreadData,
    OldThreadDataJSON,
    OldThreadDataBrokenJSON
> & { name: "OldThreadData" } = {
    name: "OldThreadData",
    type: "record",
    repair: repairOldThreadDataJSON,
    toJSON: OldThreadDataToJSON,
    fromJSON: JSONToOldThreadData,
    fields: {
        to: { type: "array", items: { type: "uuid", linkTo: "User" } },
        subject: { type: "string" },
        message: { type: "string" },
        messages: { type: "array", items: THREAD_MESSAGE_META },
        projects: { type: "array", items: { type: "uuid", linkTo: "Project" } },
        contacts: { type: "array", items: { type: "uuid", linkTo: "Contact" } },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
