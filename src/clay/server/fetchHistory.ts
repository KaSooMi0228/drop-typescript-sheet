import { snakeCase } from "change-case";
import addDays from "date-fns/addDays";
import { ClientBase } from "pg";
import { plural } from "pluralize";
import { HistoryRequest, HistoryResult, UserPermissions } from "./api";
import { Context } from "./context";
import { verifyPermission } from "./error";
import { rstr, select, sqlCase } from "./squel";

export default async function fetchHistory(
    client: ClientBase,
    context: Context,
    user: UserPermissions,
    request: HistoryRequest
): Promise<HistoryResult> {
    verifyPermission(user, "RecordHistory", "read");

    let userKey = sqlCase();

    for (const [tableName, meta] of Object.entries(context.metas)) {
        if (meta.userFacingKey) {
            if (meta.fields.project) {
                userKey.when("record_history.tablename = ?", tableName).then(
                    rstr(
                        "coalesce((?),(?))",
                        select()
                            .from(snakeCase(plural(tableName)))
                            .join(
                                "projects",
                                undefined,
                                "projects.id = " +
                                    snakeCase(plural(tableName)) +
                                    ".project"
                            )
                            .where(
                                snakeCase(plural(tableName)) +
                                    ".id = record_history.id"
                            )
                            .field(
                                rstr(
                                    "concat(projects.project_number, '-'," +
                                        snakeCase(meta.userFacingKey) +
                                        "::text)"
                                )
                            ),
                        select()
                            .from("record_history", "rr")
                            .where("rr.tablename = ?", tableName)
                            .where("rr.id = record_history.id")
                            .field(
                                rstr(
                                    "max((diff -> ? -> 1)::text)",
                                    meta.userFacingKey
                                )
                            )
                    )
                );
            } else {
                userKey.when("record_history.tablename = ?", tableName).then(
                    rstr(
                        "coalesce((?),(?))",
                        select()
                            .from(snakeCase(plural(tableName)))
                            .where(
                                snakeCase(plural(tableName)) +
                                    ".id = record_history.id"
                            )
                            .field(
                                rstr(snakeCase(meta.userFacingKey) + "::text")
                            ),
                        select()
                            .from("record_history", "rr")
                            .where("rr.tablename = ?", tableName)
                            .where("rr.id = record_history.id")
                            .field(
                                rstr(
                                    "max((diff -> ? -> 1)::text)",
                                    meta.userFacingKey
                                )
                            )
                    )
                );
            }
        }
    }

    const baseQuery = select()
        .from("record_history")
        .order("changed_time", false)
        .field("tablename")
        .field("id")
        .field("version")
        .field("user_id")
        .field(
            rstr(
                "?",
                select()
                    .from("users")
                    .field("name")
                    .where("users.id = record_history.user_id")
            ),
            "username"
        )
        .field("form")
        .field("changed_time")
        .field("diff")
        .field(rstr("diff -> 1 = 'null'::jsonb"), "deleted")
        .field(userKey, "userKey");

    const query = select().from(baseQuery, "data");

    if (request.recordId) {
        query.where("id = ?", request.recordId);
    }
    if (request.tableName) {
        query.where("tablename =?", request.tableName);
    }
    if (request.userId) {
        query.where("user_id = ?", request.userId);
    }
    if (request.fromDate) {
        query.where("changed_time >= ?", request.fromDate);
    }
    if (request.toDate) {
        query.where("changed_time <= ?", addDays(new Date(request.toDate), 1));
    }
    if (request.userKey) {
        query.where("userkey = ?", request.userKey);
    }
    if (request.id) {
        query.where("id = ?", request.id);
    }

    query.limit(200);

    const result = await client.query(query.toParam());

    return {
        changes: result.rows.map((row) => ({
            recordVersion: row.version,
            userName: row.username,
            form: row.form,
            diff: row.diff,
            changedTime: row.changed_time.toISOString(),
            tableName: row.tablename,
            id: row.id,
            userKey: row.userkey,
            deleted: row.deleted,
        })),
    };
}
