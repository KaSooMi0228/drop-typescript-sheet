import * as Sentry from "@sentry/node";
import { ErrorObject } from "ajv";
import { snakeCase } from "change-case";
import { ClientBase } from "pg";
import { plural } from "pluralize";
import { recordPatch, recordPatches } from "../../server/sqlite";
import { LocalDate } from "../LocalDate";
import { applyPatch } from "../patch";
import { StoreRecordResult, UserPermissions } from "./api";
import { Context } from "./context";
import { ServerError, verifyPermission } from "./error";
import readRecord from "./readRecord";
import { insert, rstr, select, update } from "./squel";
import { makeBase, updateDatabase } from "./storeRecord";

type FF<T, S> = (arg: T) => Promise<S>;
function lockify<T, S>(f: FF<T, S>): FF<T, S> {
    let lock = Promise.resolve() as Promise<any>;

    return (arg: T) => {
        const result = lock.then(() => f(arg));
        lock = result.catch(() => {});

        return result.then((value) => value);
    };
}

interface Record {
    id: string;
    recordVersion: number | null;
    [key: string]: any;
}
type PatchRecord = {
    client: ClientBase;
    context: Context;
    tableName: string;
    id: string;
    patchIds: string[];
    patches: any[];
    user: UserPermissions;
    form: string;
    dateTime: Date;
    system?: boolean;
    override: boolean;
};

export default lockify(async function patchRecord(
    parameters: PatchRecord
): Promise<StoreRecordResult & { appliedPatches: string[] }> {
    return recordPatches(async () => {
        verifyPermission(parameters.user, parameters.tableName, "write");

        const { client, context, tableName } = parameters;

        const current = await readRecord(
            client,
            context,
            parameters.user,
            tableName,
            parameters.id,
            true
        );

        const meta = context.metas[tableName];

        if (current.record === null) {
        }

        const base = current.record || makeBase(meta, parameters.id);

        const appliedPatches: any[] = [];
        let record = base;
        let index = 0;
        if (parameters.patchIds.length != parameters.patches.length) {
            throw new ServerError({
                status: "INVALID_PATCH",
            });
        }
        for (const patch of parameters.patches) {
            try {
                const patchId = parameters.patchIds[index];
                index += 1;
                appliedPatches.push(patchId);
                if (!recordPatch(patchId)) {
                    // this patch already record, skip it
                    continue;
                }
                record = applyPatch(record, patch, parameters.override);
            } catch (error) {
                if (process.env.NODE_ENV !== "production") {
                    console.error(record);
                    console.error(patch);
                    console.error(error);
                }
                Sentry.captureException(error, {
                    contexts: {
                        details: {
                            record: JSON.stringify(record),
                            patch: JSON.stringify(patch),
                        },
                    },
                });
                throw new ServerError({
                    status: "BAD_PATCH",
                    tableName: parameters.tableName,
                    recordId: parameters.id,
                    id: parameters.id,
                });
            }
        }

        if (parameters.override) {
            record = meta.repair(record);
        }

        if (!parameters.system) {
            if ("modifiedBy" in meta.fields) {
                record = { ...record, modifiedBy: parameters.user.id };
            }
            if ("modifiedDate" in meta.fields) {
                record = {
                    ...record,
                    modifiedDate: new LocalDate(parameters.dateTime).toString(),
                };
            }
            if ("modifiedDateTime" in meta.fields) {
                record = {
                    ...record,
                    modifiedDateTime: parameters.dateTime.toISOString(),
                };
            }
        }

        if (!context.validator.validate(tableName, record)) {
            console.log(JSON.stringify(record, undefined, 4));
            console.error(context.validator.errors);
            throw new ServerError({
                status: "INVALID_RECORD",
                errors: context.validator.errors as ErrorObject[],
            });
        } else {
            if (current.record === null) {
                let recordVersion = 0;

                if (!parameters.system) {
                    const recordVersionQuery = await client.query(
                        select()
                            .from("record_history")
                            .where("tablename = ?", tableName)
                            .where("id = ?", record.id)
                            .field(
                                rstr("coalesce(max(version)+1,0)"),
                                "version"
                            )
                            .toParam()
                    );
                    recordVersion = recordVersionQuery.rows[0].version;

                    if (recordVersion != 0) {
                        throw new ServerError({
                            status: "DELETED_RECORD",
                        });
                    }

                    if ("addedBy" in meta.fields) {
                        record = { ...record, addedBy: parameters.user.id };
                    }
                    if ("addedDate" in meta.fields) {
                        record = {
                            ...record,
                            addedDate: new LocalDate(
                                parameters.dateTime
                            ).toString(),
                        };
                    }
                    if ("addedDateTime" in meta.fields) {
                        record = {
                            ...record,
                            addedDateTime: parameters.dateTime.toISOString(),
                        };
                    }
                }

                verifyPermission(parameters.user, parameters.tableName, "new");
                return {
                    ...(await updateDatabase(
                        client,
                        context,
                        parameters,
                        insert().into(snakeCase(plural(tableName))),
                        recordVersion,
                        meta,
                        base,
                        record
                    )),
                    appliedPatches,
                };
            } else {
                if (current.record.recordVersion === null) {
                    throw new Error("this cannot happen");
                }

                if (!parameters.system) {
                    if ("addedBy" in meta.fields) {
                        record = { ...record, addedBy: current.record.addedBy };
                    }
                    if ("addedDate" in meta.fields) {
                        record = {
                            ...record,
                            addedDate: current.record.addedDate,
                        };
                    }
                    if ("addedDateTime" in meta.fields) {
                        record = {
                            ...record,
                            addedDateTime: current.record.addedDateTime,
                        };
                    }
                }

                return {
                    ...(await updateDatabase(
                        client,
                        context,
                        parameters,
                        update()
                            .table(snakeCase(plural(tableName)))
                            .where("id = ?", record.id),
                        current.record.recordVersion + 1,
                        meta,
                        base,
                        record
                    )),
                    appliedPatches,
                };
            }
        }
    });
});
