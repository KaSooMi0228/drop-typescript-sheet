import { faSuperpowers } from "@fortawesome/free-brands-svg-icons";
import {
    faCalendarTimes,
    faComments,
    faHandHoldingUsd,
    IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { fromPairs, zip } from "lodash";
import * as React from "react";
import { useQuery } from "../../clay/api";
import { LocalDate } from "../../clay/LocalDate";
import {
    QuickCacheApi,
    useQuickAllRecords,
    useQuickCache,
} from "../../clay/quick-cache";
import { UserPermissions } from "../../clay/server/api";
import { hasPermission } from "../../permissions";
import { Company, COMPANY_META } from "../company/table";
import { Contact, CONTACT_META } from "../contact/table";
import { Role, ROLE_META } from "../roles/table";
import { useUser } from "../state";
import { INBOX_SOURCES, LABELS } from "./sources";
import { InboxSource, InboxThreadTable } from "./types";

function inferIcon(source: InboxSource) {
    switch (source.type) {
        case "thread":
            return faComments;
        default:
            switch (source.target) {
                case "category-manager":
                    return faSuperpowers;
                case "project-role":
                case "column":
                case "quote-requested-by":
                case "user-column":
                case "column-single":
                    return faCalendarTimes;
                case "permission":
                    return faHandHoldingUsd;
                default:
                    throw new Error(
                        "Not Supported: " +
                            source.target +
                            " for " +
                            source.type
                    );
            }
    }
}

function projectColumnPrefix(source: InboxSource) {
    switch (source.table) {
        case "Project":
            return "";
        default:
            return projectColumn(source.table) + ".";
    }
}

function filterStrip(data: string[], prefix: string) {
    return data
        .filter((x) => x.startsWith(prefix))
        .map((x) => x.substring(prefix.length));
}

function projectColumn(table: InboxThreadTable) {
    switch (table) {
        case "Project":
            return "id";
        case "Invoice":
        case "Payout":
        case "DetailSheet":
        case "ProjectUnlockRequest":
        case "Quotation":
        case "CoreValueNotice":
        case "SiteVisitReport":
        case "CompletionSurvey":
        case "WarrantyReview":
        case "CustomerSurvey":
            return "project";
        case "EstimateCopyRequest":
            return "estimate.common.project";
        case "QuotationCopyRequest":
            return "quotation.project";
        case "Thread":
        case "Contact":
            return "null";
    }
}

function createFilter(
    roles: Role[],
    user: UserPermissions,
    source: InboxSource
) {
    const filter = createBasicFilter(roles, user, source);
    if (source.dismissed) {
        return [
            ...filter,
            {
                not: {
                    column: source.dismissed,
                    filter: {
                        intersects: [user.id],
                    },
                },
            },
        ];
    } else {
        return filter;
    }
}

function createBasicFilter(
    roles: Role[],
    user: UserPermissions,
    source: InboxSource
) {
    switch (source.target) {
        case "column":
            return [
                {
                    column: source.column,
                    filter: {
                        intersects: [user.id],
                    },
                },
            ];
        case "quote-requested-by":
            return [
                {
                    column: source.column,
                    filter: {
                        equal: true,
                    },
                },
                {
                    column: "quoteRequestCompletedBy",
                    filter: {
                        equal: user.id,
                    },
                },
            ];
        case "column-single":
            return [
                {
                    column: source.column,
                    filter: {
                        equal: user.id,
                    },
                },
            ];
        case "user-column": {
            const candidateRoles = roles
                .filter(
                    (role) => role.permissions.indexOf(source.permission!) != -1
                )
                .map((role) => role.id.uuid);
            return [
                {
                    or: [
                        ...candidateRoles.map((role) => ({
                            column:
                                projectColumnPrefix(source) +
                                "personnelByRole@" +
                                role,
                            filter: {
                                intersects: [user.id],
                            },
                        })),
                        {
                            column: "user",
                            filter: {
                                equal: user.id,
                            },
                        },
                    ],
                },
                {
                    column: source.column,
                    filter: {
                        equal: true,
                    },
                },
            ];
        }
        case "category-manager":
            const categoryIds = filterStrip(
                user.permissions,
                "Inbox-show-unassigned-"
            );
            if (categoryIds.length > 0) {
                return [
                    {
                        column:
                            projectColumnPrefix(source) +
                            "descriptionCategories",
                        filter: {
                            intersects: categoryIds,
                        },
                    },
                    {
                        column: source.column,
                        filter: {
                            equal: true,
                        },
                    },
                ];
            } else {
                return [
                    {
                        column: "null",
                        filter: {
                            not_equal: null,
                        },
                    },
                ];
            }
        case "project-role":
            const candidateRoles = roles
                .filter(
                    (role) => role.permissions.indexOf(source.permission!) != -1
                )
                .map((role) => role.id.uuid);

            return [
                {
                    or: candidateRoles.map((role) => ({
                        column:
                            projectColumnPrefix(source) +
                            "personnelByRole@" +
                            role,
                        filter: {
                            intersects: [user.id],
                        },
                    })),
                },
                {
                    column: source.column,
                    filter: {
                        equal: true,
                    },
                },
            ];
        case "permission":
            return [
                {
                    column: source.column,
                    filter: {
                        equal: true,
                    },
                },
            ];
    }
}

export type InboxItem = {
    id: string;
    type: string;
    label: string;
    datetime: Date | null;
    date: LocalDate | null;
    color: string;
    icon: IconDefinition;
    unread: boolean;
    project_id: string | null;
    project: string | null;
    contact: Contact | null;
    company: Company | null;
};

function cacheKey(cache: QuickCacheApi) {
    return cache.getAll(ROLE_META);
}

export function useInboxItems() {
    const user = useUser();
    return useInboxItemsFor(user);
}

export function useInboxItemsFor(user: UserPermissions) {
    const cache = useQuickCache();
    const roles = useQuickAllRecords(ROLE_META);

    const queries = INBOX_SOURCES.map((source) => {
        const query = {
            tableName: source.table,
            columns: [
                "id",
                source.date || "null",
                source.label || "null",
                source.read || "null",
                projectColumn(source.table),
                typeof source.priority === "string" ? source.priority : "null",
            ],
            filters: createFilter(roles || [], user, source),
        };
        return useQuery(
            query,
            [source, roles, user],
            (!source.permission ||
                user.permissions.indexOf(source.permission) !== -1 ||
                source.target === "user-column") &&
                hasPermission(user, source.table, "read")
        );
    });

    const rawItems = React.useMemo(() => {
        const items: InboxItem[] = [];
        const seen = new Set<String>();
        for (const [source_, query] of zip(INBOX_SOURCES, queries)) {
            let source = source_!;

            if (query) {
                for (const row of query) {
                    const [id, date, label, read, project_id, priority] =
                        row as [
                            string,
                            string | null,
                            string | null,
                            string[] | null,
                            string | null,
                            boolean | null
                        ];
                    const key = source!.type + "@" + id;
                    if (!seen.has(key)) {
                        seen.add(key);
                        const item = {
                            id,
                            type: source!.type,
                            label: label || LABELS[source!.type],
                            datetime: date === null ? null : new Date(date),
                            date:
                                date === null
                                    ? null
                                    : date.indexOf("T") === -1
                                    ? LocalDate.parse(date)
                                    : null,
                            color: (
                                typeof source.priority === "string"
                                    ? priority
                                    : source.priority
                            )
                                ? "red"
                                : "green",
                            icon: inferIcon(source),
                            unread:
                                read !== null && read.indexOf(user.id) === -1,
                            project_id: project_id,
                            project: null,
                            contact:
                                (source.table == "Contact" &&
                                    cache.get(CONTACT_META, id)) ||
                                null,
                            company:
                                (source.table == "Contact" &&
                                    cache.get(
                                        COMPANY_META,
                                        cache.get(CONTACT_META, id)?.company ||
                                            null
                                    )) ||
                                null,
                        };
                        if (!item.label) {
                            throw new Error("missing label:" + item.id);
                        }
                        items.push(item);
                    }
                }
            }
        }

        items.sort((a, b) => {
            if (a.datetime) {
                if (b.datetime) {
                    return a.datetime.getTime() - b.datetime.getTime();
                } else {
                    return 1;
                }
            } else {
                return -1;
            }
        });

        return items;
    }, [...queries, cache]);

    const projectIds = rawItems.map((item) => item.project_id).filter((x) => x);

    const projectQuery =
        useQuery(
            {
                tableName: "Project",
                columns: ["id", "summary"],
                filters: [
                    {
                        column: "id",
                        filter: {
                            in: projectIds,
                        },
                    },
                ],
            },
            [JSON.stringify(projectIds)]
        ) || [];

    const items = React.useMemo(() => {
        const projectIdToSummary = fromPairs(projectQuery);
        const items = rawItems.map((item) => ({
            ...item,
            project: item.project_id
                ? projectIdToSummary[item.project_id] || null
                : null,
        }));
        return items;
    }, [projectQuery, rawItems]);

    return items;

    return items;
}
