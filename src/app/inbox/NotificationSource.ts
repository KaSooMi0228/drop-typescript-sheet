import { Link } from "../../clay/link";
import { LocalDate } from "../../clay/LocalDate";
import { Meta, RecordMeta } from "../../clay/meta";
import { UUID } from "../../clay/uuid";
import { User } from "../user/table";
import { InboxSource, InboxThreadTable, ITEM_TYPE } from "./types";

export type NotificationSourceComponentProps = {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
    project?: UUID;
};
type NotificationSourceOptions<RecordType, JsonType, BrokenJsonType> = {
    key: string;
    Component: React.FC<NotificationSourceComponentProps>;
    label: string | ((record: RecordType) => string);
    table: RecordMeta<RecordType, JsonType, BrokenJsonType> & {
        name: InboxThreadTable;
    };
    sendToUsers?: (record: RecordType) => Link<User>[];
    sendToUser?: (record: RecordType) => Link<User>;
    sendToCategoryManager?: boolean;
    sendToQuoteRequestor?: boolean;
    sendToProjectRoleWithPermission?: string;
    sendToUsersWithPermission?: string;
    sendToUserColumnIfPermission?: string;
    read?: (record: RecordType) => Link<User>[];
    dismissed?: (record: RecordType) => Link<User>[];
    active?: string | ((record: RecordType) => boolean);
    date:
        | ((record: RecordType) => Date | null)
        | ((record: RecordType) => LocalDate | null)
        | null;

    dated?: boolean;
    priority?: boolean | ((record: RecordType) => boolean);
};

export default function NotificationSource<
    RecordType,
    JsonType,
    BrokenJsonType
>(options: NotificationSourceOptions<RecordType, JsonType, BrokenJsonType>) {
    const notificationId = "__notification__" + options.key + "__";

    const sources: InboxSource[] = [];

    const installFunction = (name: string, fn: any, returnType: Meta) => {
        if (!fn) {
            return undefined;
        } else {
            options.table.functions[notificationId + name] = {
                fn,
                returnType,
                parameterTypes() {
                    return [options.table];
                },
            };
            return notificationId + name;
        }
    };

    const sendToUsers = installFunction("users", options.sendToUsers, {
        type: "array",
        items: {
            type: "uuid",
            linkTo: "User",
        },
    });

    const sendToUser = installFunction("user", options.sendToUser, {
        type: "uuid",
        linkTo: "User",
    });

    const date = installFunction("date", options.date, {
        type: "datetime",
    });

    const label =
        typeof options.label === "string"
            ? undefined
            : installFunction("label", options.label, {
                  type: "string",
              });

    const active =
        typeof options.active === "string"
            ? options.active
            : installFunction("active", options.active, {
                  type: "boolean",
              });

    const read = installFunction("read", options.read, {
        type: "array",
        items: {
            type: "uuid",
            linkTo: "User",
        },
    });

    const dismissed = installFunction("dismissed", options.dismissed, {
        type: "array",
        items: {
            type: "uuid",
            linkTo: "User",
        },
    });

    const priority =
        typeof options.priority === "function"
            ? installFunction("priority", options.priority, {
                  type: "boolean",
              })!
            : !!options.priority;

    const common = {
        type: options.key,
        table: options.table.name,
        date: date,
        dated: !!options.dated,
        priority,
        label: label,
        read,
        dismissed,
    };

    if (sendToUsers) {
        if (active) {
            throw new Error("Not implemented");
        }
        sources.push({
            ...common,
            target: "column",
            column: sendToUsers,
        });
    }
    if (sendToUser) {
        if (active) {
            throw new Error("Not implemented");
        }
        sources.push({
            ...common,
            target: "column-single",
            column: sendToUser,
        });
    }
    if (options.sendToCategoryManager) {
        if (!active) {
            throw new Error("Unsupported");
        }

        sources.push({
            ...common,
            target: "category-manager",
            column: active,
        });
    }
    if (options.sendToProjectRoleWithPermission) {
        if (!active) {
            throw new Error("Unsupported");
        }

        sources.push({
            ...common,
            target: "project-role",
            column: active,
            permission: options.sendToProjectRoleWithPermission,
        });
    }

    if (options.sendToQuoteRequestor) {
        if (!active) {
            throw new Error("Unsupported");
        }

        sources.push({
            ...common,
            target: "quote-requested-by",
            column: active,
        });
    }

    if (options.sendToUsersWithPermission) {
        if (!active) {
            throw new Error("Unsupported");
        }

        sources.push({
            ...common,
            target: "permission",
            permission: options.sendToUsersWithPermission,
            column: active,
        });
    }

    if (options.sendToUserColumnIfPermission) {
        if (!active) {
            throw new Error("Unsupported");
        }

        sources.push({
            ...common,
            target: "user-column",
            permission: options.sendToUserColumnIfPermission,
            column: active,
        });
    }

    return {
        key: options.key,
        label: typeof options.label === "string" ? options.label : "",
        meta: options.table,
        sources,
        Component: options.Component,
    };
}
