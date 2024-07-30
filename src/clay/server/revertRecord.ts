import { patch } from "jsondiffpatch";
import { ClientBase } from "pg";
import {
    DeleteRecordResult,
    Record,
    RevertRecord,
    StoreRecordResult,
    UserPermissions,
} from "./api";
import { Context } from "./context";
import deleteRecord from "./deleteRecord";
import { verifyPermission } from "./error";
import { rstr, select } from "./squel";
import storeRecord, { makeBase } from "./storeRecord";

export default async function revertRecord(
    client: ClientBase,
    context: Context,
    user: UserPermissions,
    dateTime: Date,
    request: RevertRecord
): Promise<StoreRecordResult | DeleteRecordResult> {
    verifyPermission(user, "RecordHistory", "write");

    const latestVersion = client.query(
        select()
            .from("record_history", "rr")
            .where("rr.id = ?", request.id)
            .where("rr.tablename = ?", request.tableName)
            .field(rstr("max(version)"), "latest_version")
            .toParam()
    );

    const meta = context.metas[request.tableName];
    const query = select()
        .from("record_history")
        .where("tablename = ?", request.tableName)
        .where("id = ?", request.id)
        .where("version <= ?", request.recordVersion)
        .field("diff")
        .order("version");

    const history = await client.query(query.toParam());

    let currentRecord = makeBase(meta, request.id);

    for (const row of history.rows) {
        currentRecord = meta.repair(currentRecord);
        if (row.diff !== null) {
            currentRecord = patch(currentRecord, row.diff);
        }
    }
    currentRecord = meta.repair(currentRecord);

    if (currentRecord == null) {
        return await deleteRecord({
            client,
            context,
            tableName: request.tableName,
            id: request.id,
            form: "Request History",
            dateTime,
            user,
        });
    } else {
        currentRecord = {
            ...currentRecord,
            recordVersion: (await latestVersion).rows[0].latest_version,
        };

        return storeRecord({
            client,
            context,
            tableName: request.tableName,
            record: currentRecord as Record,
            user,
            form: "Record History",
            dateTime,
        });
    }
}
