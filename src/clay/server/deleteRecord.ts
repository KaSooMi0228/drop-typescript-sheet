import { snakeCase } from "change-case";
import { diff } from "jsondiffpatch";
import { ClientBase } from "pg";
import { plural } from "pluralize";
import { DeleteRecordResult, UserPermissions } from "./api";
import { Context } from "./context";
import { ServerError, verifyPermission } from "./error";
import { EVENTS } from "./events";
import readRecord from "./readRecord";
import { insert, remove, select } from "./squel";

type DeleteRecord = {
    client: ClientBase;
    context: Context;
    tableName: string;
    id: string;
    user: UserPermissions;
    form: string;
    dateTime: Date;
};

export default async function deleteRecord(
    parameters: DeleteRecord
): Promise<DeleteRecordResult> {
    verifyPermission(parameters.user, parameters.tableName, "delete");

    const { client, context, tableName, id } = parameters;
    const meta = context.metas[tableName];

    const current = await readRecord(
        client,
        context,
        parameters.user,
        tableName,
        id
    );

    if (current.record === null) {
        throw new ServerError({
            status: "NOT_FOUND",
        });
    } else {
        if (current.record.recordVersion === null) {
            throw new Error("unreachable");
        }

        if (tableName === "Project") {
            for (const relatedTable of [
                "Quotation",
                "Invoice",
                "DetailSheet",
                "SiteVisitReport",
                "CoreValueNotice",
                "Payout",
            ]) {
                const query = await client.query(
                    select()
                        .from(snakeCase(plural(relatedTable)))
                        .field("id")
                        .where("project = ?", id)
                        .toParam()
                );
                for (const row of query.rows) {
                    await deleteRecord({
                        ...parameters,
                        tableName: relatedTable,
                        id: row.id,
                    });
                }
            }
        }

        const query = remove()
            .from(snakeCase(plural(tableName)))
            .where("id = ?", id);

        const { text, values } = query.toParam();
        await client.query({ text, values });

        let difference = diff(current.record, null);
        if (difference) {
            if (Object.keys(difference).length === 0) {
                difference = undefined;
            }
        }

        await client.query(
            insert()
                .into("record_history")
                .set("tablename", parameters.tableName)
                .set("id", id)
                .set("diff", JSON.stringify(difference))
                .set("version", current.record.recordVersion + 1)
                .set("user_id", parameters.user.id)
                .set("form", parameters.form)
                .set("changed_time", parameters.dateTime.toISOString())
                .toParam()
        );

        EVENTS.emit(
            parameters.tableName,
            parameters.user.id,
            parameters.id,
            current,
            null
        );

        return {
            recordId: id,
        };
    }
}
