import { Dictionary } from "../../clay/common";
import { NOTIFICATION_SOURCES } from "./notification-sources";
import { InboxSource } from "./types";

export const LABELS: Dictionary<string> = {};

for (const source of NOTIFICATION_SOURCES) {
    LABELS[source.key] = source.label;
}

export const INBOX_SOURCES: InboxSource[] = [];

for (const source of NOTIFICATION_SOURCES) {
    INBOX_SOURCES.push(...source.sources);
}
