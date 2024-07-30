import { ClientBase } from "pg";
import { EditingRequest, EditingResponse, UserPermissions } from "./api";
import { Context } from "./context";
import { verifyPermission } from "./error";
import { remove, select } from "./squel";

export default async function editRecord(
    client: ClientBase,
    context: Context,
    user: UserPermissions,
    dateTime: Date,
    request: EditingRequest
): Promise<EditingResponse> {
    verifyPermission(user, request.tableName, "write");

    await client.query(
        remove()
            .from("editing")
            .where("time < current_timestamp - '1 hour'::interval")
            .toParam()
    );

    await client.query({
        text: "INSERT INTO editing VALUES ($1,$2,$3,$4) ON CONFLICT (tablename, id, user_id) DO UPDATE SET time = EXCLUDED.time",
        values: [request.tableName, request.id, user.id, dateTime],
    });

    const editors = await client.query(
        select()
            .from("editing")
            .where("tablename = ?", request.tableName)
            .where("editing.id = ?", request.id)
            .join("users", undefined, "users.id = editing.user_id")
            .field("user_id")
            .field("time")
            .field("users.name")
            .toParam()
    );

    return {
        editors: editors.rows.map((row) => ({
            userId: row.user_id,
            username: row.name,
            timestamp: row.time.toISOString(),
        })),
    };
}
