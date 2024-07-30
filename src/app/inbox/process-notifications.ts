import * as Sentry from "@sentry/node";
import { config } from "dotenv";
import { Pool } from "pg";
import webpush, { WebPushError } from "web-push";
import { filterMap, setDifference } from "../../clay/queryFuncs";
import { UserPermissions } from "../../clay/server/api";
import { databasePool } from "../../clay/server/databasePool";
import queryTable from "../../clay/server/queryTable";
import { rstr, select } from "../../clay/server/squel";
import { ROOT_USER } from "../../server/root-user";
import { DetailSheetJSON } from "../project/detail-sheet/table";
import { ProjectPersonnelJSON } from "../project/personnel/table";
import {
    calcProjectDescriptionCategories,
    calcProjectSummary,
} from "../project/table";
import { TABLES_META } from "../tables";
import { INBOX_SOURCES, LABELS } from "./sources";
import { InboxSource } from "./types";

config();

webpush.setVapidDetails(
    "mailto:winstonewert@gmail.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

function resolveStringColumn(
    tableName: string,
    column: string | undefined,
    record: any
): string | null {
    if (column == undefined) {
        return null;
    } else {
        return record[column];
    }
}

async function resolveBoolColumn(
    tableName: string,
    column: string,
    record: any
): Promise<boolean> {
    const args: any[] = [];

    for (const parameter of TABLES_META[tableName].functions[
        column
    ].parameterTypes()) {
        if (parameter.type == "record" && parameter.name == tableName) {
            args.push(parameter.fromJSON(record));
        } else if (
            parameter.type == "array" &&
            parameter.items.type == "record" &&
            parameter.items.name == "DetailSheet"
        ) {
            const detailSheets = await getProjectDetailSheets(record.id);
            args.push(detailSheets.map(parameter.items.fromJSON));
        } else {
            throw new Error(parameter.type);
        }
    }

    return TABLES_META[tableName].functions[column].fn(...args);
}

function resolveArrayColumn(
    tableName: string,
    column: string,
    record: any
): string[] {
    return TABLES_META[tableName].functions[column].fn(record);
}

function resolveLinkColumn(
    tableName: string,
    column: string,
    record: any
): string[] {
    const result = TABLES_META[tableName].functions[column].fn(record);
    if (result) {
        return [result];
    } else {
        return [];
    }
}

async function getProjectDetailSheets(id: string): Promise<DetailSheetJSON[]> {
    const { pool, context } = await databasePool;

    const client = await pool.connect();
    try {
        const result = await queryTable({
            client,
            context,
            tableName: "DetailSheet",
            columns: ["."],
            user: ROOT_USER,
            filters: [
                {
                    column: "project",
                    filter: {
                        equal: id,
                    },
                },
            ],
            sorts: [],
        });
        return result.rows.map((row) => row[0] as DetailSheetJSON);
    } finally {
        client.release();
    }
}

async function getProjectRolesById(id: string): Promise<string | null> {
    const { pool, context } = await databasePool;

    const client = await pool.connect();
    try {
        const result = await queryTable({
            client,
            context,
            tableName: "Project",
            columns: ["roles"],
            user: ROOT_USER,
            filters: [
                {
                    column: "id",
                    filter: {
                        equal: id,
                    },
                },
            ],
            sorts: [],
        });
        return ((result.rows[0] && result.rows[0]) || null) as any;
    } finally {
        client.release();
    }
}

async function getProjectSummaryById(id: string): Promise<string | null> {
    const { pool, context } = await databasePool;

    const client = await pool.connect();
    try {
        const result = await queryTable({
            client,
            context,
            tableName: "Project",
            columns: ["summary"],
            user: ROOT_USER,
            filters: [
                {
                    column: "id",
                    filter: {
                        equal: id,
                    },
                },
            ],
            sorts: [],
        });
        return ((result.rows[0] && result.rows[0]) || null) as any;
    } finally {
        client.release();
    }
}

async function getProjectSummary(
    pool: Pool,
    source: InboxSource,
    record: any
): Promise<string | null> {
    switch (source.table) {
        case "Thread":
        case "Contact":
            return null;
        case "Invoice":
        case "Payout":
        case "ProjectUnlockRequest":
        case "Quotation":
        case "DetailSheet":
        case "SiteVisitReport":
        case "CoreValueNotice":
        case "CompletionSurvey":
        case "WarrantyReview":
        case "CustomerSurvey":
            return getProjectSummaryById(record.project);
        case "EstimateCopyRequest":
        case "QuotationCopyRequest":
            return getProjectSummaryById(record.target);
        case "Project":
            return calcProjectSummary(record);
    }
}

async function checkApplies(
    pool: Pool,
    user: UserPermissions,
    source: InboxSource,
    record: any
): Promise<string[]> {
    if (record.recordVersion == null) {
        return [];
    }
    switch (source.target) {
        case "column":
            const data = resolveArrayColumn(
                source.table,
                source.column,
                record
            );
            return data;
        case "column-single":
            return resolveLinkColumn(source.table, source.column, record);
        case "quote-requested-by":
        case "category-manager":
        case "permission":
        case "user-column":
            if (
                !(await resolveBoolColumn(source.table, source.column, record))
            ) {
                return [];
            }

            switch (source.target) {
                case "category-manager":
                    switch (source.table) {
                        case "Project":
                            const data = calcProjectDescriptionCategories(
                                record
                            ).map((x) => "Inbox-show-unassigned-" + x);
                            const query = await pool.query(
                                select()
                                    .from("users")
                                    .join(
                                        "roles",
                                        undefined,
                                        "roles.id = any(users.roles)"
                                    )
                                    .where(
                                        "roles.permissions && ARRAY[" +
                                            data.map((_) => "?").join(",") +
                                            "]",
                                        ...data
                                    )
                                    .field("users.id")
                                    .toParam()
                            );
                            return query.rows.map((row) => row.id);

                        case "Thread":
                            throw new Error("not");
                    }
                case "permission":
                    const query = await pool.query(
                        select()
                            .from("users")
                            .join(
                                "roles",
                                undefined,
                                "roles.id = any(users.roles)"
                            )
                            .where(
                                "roles.permissions && ARRAY[?]",
                                source.permission!
                            )
                            .field("users.id")
                            .toParam()
                    );
                    return query.rows.map((row) => row.id);
                case "user-column": {
                    const query = await pool.query(
                        select()
                            .from("users")
                            .join(
                                "roles",
                                undefined,
                                "roles.id = any(users.roles)"
                            )
                            .where(
                                "roles.permissions && ARRAY[?]",
                                source.permission!
                            )
                            .field("users.id")
                            .toParam()
                    );
                    return [...query.rows.map((row) => row.id), record.user];
                }
            }
        case "quote-requested-by":
            return [record.quoteRequestCompletedBy];
        case "project-role":
            if (
                !(await resolveBoolColumn(source.table, source.column, record))
            ) {
                return [];
            }
            switch (source.table) {
                case "Project": {
                    const rolesQuery = await pool.query(
                        select()
                            .from("roles")
                            .where("permissions && ARRAY[?]", source.permission)
                            .field("id")
                            .toParam()
                    );
                    const roles = rolesQuery.rows.map(
                        (row) => row.id
                    ) as string[];
                    return filterMap(
                        record.personnel,
                        (entry: ProjectPersonnelJSON) =>
                            roles.indexOf(entry.role!) !== -1,
                        (entry: ProjectPersonnelJSON) => entry.user!
                    );
                }
                case "CustomerSurvey": {
                    const query = select()
                        .from("projects")
                        .where("projects.id = ?", record.project)
                        .from("roles")
                        .from(rstr("unnest(projects.personnel)"), "p")
                        .where(
                            "roles.permissions && ARRAY[?]",
                            source.permission
                        )
                        .field("p.user")
                        .toParam();
                    const usersQuery = await pool.query(query);
                    return usersQuery.rows.map((row) => row.user) as string[];
                }
                default:
                    throw new Error("not");
            }
    }
}

export async function processNotifications(
    tableName: string,
    user: UserPermissions,
    id: string,
    oldRecord: any,
    newRecord: any
) {
    try {
        const { pool } = await databasePool;

        for (const source of INBOX_SOURCES) {
            if (tableName === source.table && !source.dated) {
                const currentApplies = await checkApplies(
                    pool,
                    user,
                    source,
                    newRecord
                );
                const oldApplies = await checkApplies(
                    pool,
                    user,
                    source,
                    oldRecord
                );
                const newApplies = setDifference(currentApplies, oldApplies);

                if (newApplies.length > 0) {
                    const projectSummary = await getProjectSummary(
                        pool,
                        source,
                        newRecord
                    );
                    const notification = JSON.stringify({
                        type: source.type,
                        id: newRecord.id,
                        label:
                            (projectSummary ? projectSummary + " " : "") +
                            (resolveStringColumn(
                                tableName,
                                source.label,
                                newRecord
                            ) || LABELS[source.type]),
                    });

                    for (const user of newApplies) {
                        const subscriptions = await pool.query(
                            select()
                                .from("subscriptions")
                                .where("modified_by = ?", user)
                                .field("endpoint")
                                .field("auth")
                                .field("p256dh")
                                .toParam()
                        );

                        for (const subscription of subscriptions.rows) {
                            try {
                                await webpush.sendNotification(
                                    {
                                        endpoint: subscription.endpoint,
                                        keys: {
                                            auth: subscription.auth,
                                            p256dh: subscription.p256dh,
                                        },
                                    },
                                    notification
                                );
                            } catch (error) {
                                if (error instanceof WebPushError) {
                                    Sentry.captureException(error, {
                                        contexts: {
                                            details: {
                                                record: JSON.stringify(error),
                                            },
                                        },
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        if (process.env.NODE_ENV !== "production") {
            console.error(error);
        }
        Sentry.captureException(error);
    }
}
