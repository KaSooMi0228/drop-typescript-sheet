import { snakeCase } from "change-case";
import { diff, patch } from "jsondiffpatch";
import { mapValues } from "lodash";
import { plural } from "pluralize";
import { promisify } from "util";
import { databasePool } from "../clay/server/databasePool";
import { databaseDecode } from "../clay/server/readRecord";
import { insert, rstr, select, update } from "../clay/server/squel";
import { makeBase } from "../clay/server/storeRecord";
const Cursor = require("pg-cursor") as any;
Cursor.prototype.readAsync = promisify(Cursor.prototype.read);

async function fixupHistory() {
    console.log("Connecting");
    const { pool, context } = await databasePool;
    const client = await pool.connect();
    const client_update = await pool.connect();
    try {
        console.log("Connected");

        for (const [table, meta] of Object.entries(context.metas)) {
            console.log(table);
            const query = select()
                .from(snakeCase(plural(table)))
                .field("record_version")
                .field(
                    select()
                        .from("record_history")
                        .where("tablename = ?", table)
                        .where(
                            "record_history.id = " +
                                snakeCase(plural(table)) +
                                ".id"
                        )
                        .field(rstr("array_agg(diff order by version)")),
                    "diffs"
                );

            for (const key of Object.keys(meta.fields)) {
                query.field(snakeCase(key));
            }

            const { text, values } = query.toParam();
            const cursor = client.query(new Cursor(text, values));

            let nextRows = cursor.readAsync(100);
            while (1) {
                const rows = await nextRows;
                console.log(rows.length);
                if (rows.length == 0) {
                    console.log("Finished");
                    break;
                }
                nextRows = cursor.readAsync(100);
                for (const row of rows) {
                    let currentRecord = makeBase(meta, row.id);
                    let broken = false;
                    for (const difference of row.diffs) {
                        if (difference != null) {
                            try {
                                patch(currentRecord, difference);
                            } catch (error) {
                                console.log(difference);
                                broken = true;
                                break;
                            }
                            currentRecord = meta.repair(currentRecord);
                        }
                    }

                    const storedRecord = mapValues(
                        meta.fields,
                        (fieldMeta, fieldName) =>
                            databaseDecode(
                                context,
                                fieldMeta,
                                row[snakeCase(fieldName)]
                            )
                    );
                    if (broken) {
                        console.log("SR", storedRecord.id);
                    }
                    delete storedRecord.recordVersion;

                    const difference = diff(currentRecord, storedRecord);
                    if (difference && !broken) {
                        delete difference.recordVersion;
                        if (Object.keys(difference).length > 0) {
                            console.log(storedRecord);
                            console.log(currentRecord);
                            console.log(JSON.stringify(difference, null, 4));
                            await client_update.query(
                                insert()
                                    .into("record_history")
                                    .set("tablename", table)
                                    .set("id", row.id)
                                    .set("diff", JSON.stringify(difference))
                                    .set("version", row.record_version + 1)
                                    .set("form", "database reconciliation")
                                    .set(
                                        "changed_time",
                                        new Date().toISOString()
                                    )
                                    .set(
                                        "user_id",
                                        "c7d4d727-276d-43b0-8449-8c13d905887b"
                                    )
                                    .toParam()
                            );
                            await client_update.query(
                                update()
                                    .set(
                                        "record_version",
                                        row.record_version + 1
                                    )
                                    .table(snakeCase(plural(table)))
                                    .where("id = ?", row.id)
                                    .toParam()
                            );
                        }
                    }
                }
            }
        }
    } finally {
        await client.release();
        await client_update.release();
        await pool.end();
    }
}

fixupHistory();
