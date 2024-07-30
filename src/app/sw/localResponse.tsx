import { encode as b64encode } from "base64-arraybuffer";
import Decimal from "decimal.js";
import EventEmitter from "events";
import { IDBPDatabase, IDBPTransaction } from "idb";
import { isEqual, omit, some, zip } from "lodash";
import ReconnectingWebSocket from "reconnecting-websocket";
import { CACHE_CONFIG } from "../../cache";
import { Meta } from "../../clay/meta";
import { applyPatch } from "../../clay/patch";
import { FilterDetail, Request } from "../../clay/server/api";
import { genUUID } from "../../clay/uuid";
import { TABLES_META } from "../tables";
import { openDatabase } from "./cache";
import * as React from "react";

export const PENDING_RESOLVED = new EventEmitter();
export const CHANNEL = new BroadcastChannel("dropsheet");

function valueIsEqual(lhs: any, rhs: any): boolean {
    if (lhs instanceof Decimal && typeof rhs == "string") {
        return lhs.equals(new Decimal(rhs));
    } else if (typeof lhs === "number" && typeof rhs === "string") {
        return lhs === parseFloat(rhs);
    } else {
        return isEqual(lhs, rhs);
    }
}

const TABLES = new Set(Object.keys(CACHE_CONFIG));

function jsonify(meta: Meta, value: any) {
    if (value === null) {
        return null;
    }
    switch (meta.type) {
        case "array":
        case "array?":
            return value.map((item: any) => jsonify(meta.items, item));
        case "binary":
            return b64encode(value);
        case "boolean":
        case "enum":
        case "phone":
        case "serial":
        case "string":
        case "version":
            return value;
        case "date":
            return value.toString();
        case "datetime":
            return value.toISOString();
        case "money":
        case "percentage":
        case "quantity":
        case "money?":
        case "quantity?":
        case "percentage?":
            return value.toString();
        case "null":
            return null;
        case "uuid":
            return value.uuid || value;
        case "record":
            return meta.toJSON(value);
        default:
            throw new Error("not implemented");
    }
}

async function resolveValue(
    meta: Meta,
    value: any,
    column: string[],
    key?: string
): Promise<any> {
    if (value == null) {
        return null;
    }
    switch (meta.type) {
        case "record":
            const field = column[0];
            if (field in meta.fields) {
                return resolveValue(
                    meta.fields[field],
                    value[field],
                    column.slice(1),
                    key
                );
            } else if (
                field in meta.functions &&
                meta.functions[field].parameterTypes().length == 1
            ) {
                return resolveValue(
                    meta.functions[field].returnType,
                    jsonify(
                        meta.functions[field].returnType,
                        meta.functions[field].fn(meta.fromJSON(value))
                    ),
                    column.slice(1),
                    key
                );
            } else if (
                field in meta.functions &&
                meta.functions[field].parameterTypes().length == 2 &&
                key
            ) {
                return resolveValue(
                    meta.functions[field].returnType,
                    jsonify(
                        meta.functions[field].returnType,
                        meta.functions[field].fn(meta.fromJSON(value), key)
                    ),
                    column.slice(1),
                    key
                );
            } else if (field === "" && column[1] == "") {
                return value;
            } else if (field === "null") {
                return null;
            } else {
                return null;
            }
        case "array":
            return Promise.all(
                value.map((item: any) =>
                    resolveValue(meta.items, item, column, key)
                )
            );
        case "string":
        case "money":
        case "percentage":
        case "quantity":
        case "money?":
        case "percentage?":
        case "quantity?":
        case "boolean":
        case "version":
        case "date":
        case "datetime":
        case "phone":
        case "serial":
        case "enum":
            return value;
        case "uuid":
            if (column.length == 0) {
                return value;
            } else {
                if (meta.linkTo && TABLES.has(meta.linkTo)) {
                    const database = await openDatabase();
                    if (value === null) {
                        return null;
                    }
                    const record =
                        (await database.get(meta.linkTo, value)) || null;

                    return resolveValue(
                        TABLES_META[meta.linkTo],
                        record,
                        column,
                        key
                    );
                } else {
                    return null;
                }
            }
    }
}

function resolveColumn(tableName: string, record: any, column: string) {
    const meta = TABLES_META[tableName];
    const [columnPart, keyPart] = column.split("@");
    return resolveValue(meta, record, columnPart.split("."), keyPart);
}

function patternToRegex(pattern: string) {
    return new RegExp(
        "^" +
            pattern.replace(/(\\%|\\\\|%|[.*+?^${}()|[\]\\])/g, (value) => {
                switch (value) {
                    case "\\%":
                        return "%";
                    case "\\\\":
                        return "\\\\";
                    case "%":
                        return ".*";
                    default:
                        return "\\" + value;
                }
            }) +
            "$",
        "i"
    );
}

function pendingKeyFor(message: any): string {
    switch (message.type) {
        case "STORE":
            return message.tableName + "@" + message.record.id;
        case "DELETE":
        case "RECORD":
            return message.tableName + "@" + message.recordId;
        case "PATCH":
            return message.tableName + "@" + message.id;
        case "GENERATE":
            return "GENERATE@" + message.id;
        default:
            throw new Error(message);
    }
}

export async function localResponsePeek(
    message: Request["request"],
    response: any
) {
    switch (message.type) {
        case "PATCH":
            if (TABLES.has(message.tableName)) {
                const database = await openDatabase();
                const transaction = database.transaction(
                    [message.tableName],
                    "readwrite"
                );
                const recordStore = transaction.objectStore(message.tableName);

                const current = await recordStore.get(message.id);
                if (current) {
                    recordStore.put(response.record, message.id);
                }

                await transaction.done;
            }
            break;
        case "STORE":
            if (TABLES.has(message.tableName)) {
                const database = await openDatabase();
                const transaction = database.transaction(
                    [message.tableName],
                    "readwrite"
                );
                const recordStore = transaction.objectStore(message.tableName);

                const current = await recordStore.get(message.record.id);
                if (current) {
                    await recordStore.put(response.record, message.record.id);
                }

                await transaction.done;
            }
            break;
        case "RECORD":
            if (TABLES.has(message.tableName)) {
                const database = await openDatabase();
                const transaction = database.transaction(
                    [message.tableName],
                    "readwrite"
                );
                const recordStore = transaction.objectStore(message.tableName);

                const current = await recordStore.get(message.recordId);
                if (current) {
                    await recordStore.put(response.record, message.recordId);
                }
                await transaction.done;
            }
            break;
        case "RECORDS":
            if (TABLES.has(message.tableName)) {
                const database = await openDatabase();
                const transaction = database.transaction(
                    [message.tableName],
                    "readwrite"
                );
                const recordStore = transaction.objectStore(message.tableName);
                for (const record of response.records) {
                    const current = await recordStore.get(record.id);
                    if (current) {
                        await recordStore.put(record, record.id);
                    }
                }

                await transaction.done;
            }
            break;
        case "QUERY":
            if (
                TABLES.has(message.tableName) &&
                message.columns.indexOf(".") !== -1
            ) {
                const database = await openDatabase();
                const transaction = database.transaction(
                    [message.tableName],
                    "readwrite"
                );
                const recordStore = transaction.objectStore(message.tableName);
                const recordIndex = message.columns.indexOf(".");
                for (const row of response.rows) {
                    const record = row[recordIndex];
                    const current = await recordStore.get(record.id);
                    if (current) {
                        await recordStore.put(record, record.id);
                    }
                }
                await transaction.done;
            }
            break;
        case "DELETE":
            if (TABLES.has(message.tableName)) {
                const database = await openDatabase();
                await database.delete(message.tableName, message.recordId);
            }
            break;
    }
}

function pendingRequestData(pending: any) {
    return pending.type;
}

function preparePending(pending: any) {
    return omit(
        pending,
        pending.type === "GENERATE"
            ? ["id", "__previousSend"]
            : ["__previousSend"]
    );
}

function sendPending(
    socket: ReconnectingWebSocket,
    transaction: IDBPTransaction<unknown, string[], "readwrite">,
    pending: any
) {
    const key = pendingKeyFor(pending);

    const previousSend = pending.__previousSend;
    if (
        previousSend === undefined ||
        previousSend + 5000 < new Date().getTime()
    ) {
        const id = "pending@" + key + "@" + pendingRequestData(pending);
        socket.send(
            JSON.stringify({
                id,
                request: preparePending(pending),
            })
        );
        transaction
            .objectStore("pending")
            .put({ ...pending, __previousSend: new Date().getTime() }, key);
    }
}

function waitForPending(key: string) {
    return new Promise((resolve, reject) => {
        PENDING_RESOLVED.once(key, resolve);
        setTimeout(resolve, 10000);
    });
}

export async function localResponseOnline(
    socket: ReconnectingWebSocket,
    message: Request["request"]
) {
    const database = await openDatabase();

    let waiting = true;

    while (waiting) {
        waiting = false;
        const transaction = database.transaction(
            ["pending", "patches"],
            "readwrite"
        );
        const pendingKeys = [];

        switch (message.type) {
            case "RECORD":
            case "DELETE":
            case "PATCH":
            case "STORE": {
                const key = pendingKeyFor(message);
                const pending = await transaction
                    .objectStore("pending")
                    .get(key);
                if (pending) {
                    sendPending(socket, transaction, pending);
                    pendingKeys.push(key);
                    waiting = true;
                }
                break;
            }
            case "QUERY":
            case "RECORDS": {
                const pendingStore = transaction.objectStore("pending");
                for (const record of await pendingStore.getAll()) {
                    if (record.tableName === message.tableName) {
                        waiting = true;
                        sendPending(socket, transaction, record);
                        pendingKeys.push(pendingKeyFor(record));
                    }
                }
                break;
            }
        }
        await Promise.all([
            transaction.done,
            ...pendingKeys.map(waitForPending),
        ]);
    }
}

async function checkFilter(
    filter: FilterDetail,
    record: any,
    tableName: string
): Promise<boolean> {
    if ("or" in filter) {
        for (const subFilter of filter["or"]) {
            if (await checkFilter(subFilter, record, tableName)) {
                return true;
            }
        }
        return false;
    } else if ("and" in filter) {
        for (const subFilter of filter["and"]) {
            if (!(await checkFilter(subFilter, record, tableName))) {
                return false;
            }
        }
        return true;
    } else if ("not" in filter) {
        return !(await checkFilter(filter["not"], record, tableName));
    } else {
        const columnValue = await resolveColumn(
            tableName,
            record,
            filter.column
        );

        if (columnValue === undefined) {
            console.error(
                await resolveColumn(tableName, record, filter.column)
            );
        }

        if (filter.filter.like) {
            if (!patternToRegex(filter.filter.like).test(columnValue)) {
                return false;
            }
        }
        if (filter.filter.equal !== undefined) {
            if (!valueIsEqual(columnValue, filter.filter.equal)) {
                return false;
            }
        }
        if (filter.filter.in !== undefined) {
            if (
                !some(filter.filter.in, (value) =>
                    valueIsEqual(value, columnValue)
                )
            ) {
                return false;
            }
        }
        if (filter.filter.intersects !== undefined) {
            if (
                !some(
                    columnValue,
                    (value) => filter.filter.intersects?.indexOf(value) !== -1
                )
            ) {
                return false;
            }
        }
        return true;
    }
}

export async function recordLocalPatch(
    message: Request["request"],
    updateCache: boolean
) {
    if (message.type !== "PATCH") {
        throw new Error();
    }
    const key = pendingKeyFor(message);
    const database = await openDatabase();
    const transaction = database.transaction(
        ["pending", message.tableName],
        "readwrite"
    );

    try {
        const patchStore = transaction.objectStore("pending");
        const current = await patchStore.get(key);
        if (!current || current.type !== "PATCH") {
            await patchStore.put(message, key);
        } else {
            await patchStore.put(
                {
                    ...current,
                    patchIds: [...current.patchIds, ...message.patchIds],
                    patches: [...current.patches, ...message.patches],
                },
                key
            );
        }
        if (updateCache) {
            const localStore = transaction.objectStore(message.tableName);
            let current = await localStore.get(message.id);
            if (!current) {
                current = TABLES_META[message.tableName].repair({
                    id: message.id,
                });
            }
            for (const p of message.patches) {
                current = applyPatch(current, p, message.override);
            }
            await localStore.put(current, message.id);
        }

        await transaction.done;
    } catch (error) {
        transaction.abort();
        throw error;
    }
}

async function resolveRecords(
    database: IDBPDatabase,
    tableName: string,
    records: any[]
) {
    return Promise.all(records.filter((x) => x !== null));
}

export async function localResponse(message: Request["request"]): Promise<any> {
    switch (message.type) {
        case "QUERY": {
            if (TABLES.has(message.tableName)) {
                const database = await openDatabase();
                const allRecords = await resolveRecords(
                    database,
                    message.tableName,
                    await database.getAll(message.tableName)
                );

                let rows: { row: any[]; sortColumns: any[] }[] = [];
                for (const record of allRecords) {
                    let accept = true;
                    if (message.filters) {
                        for (const filter of message.filters as any) {
                            if (
                                !(await checkFilter(
                                    filter,
                                    record,
                                    message.tableName
                                ))
                            ) {
                                accept = false;
                                break;
                            }
                        }
                    }
                    if (!accept) {
                        continue;
                    }
                    const row = [];
                    for (const column of message.columns) {
                        switch (column) {
                            case ".":
                                row.push(record);
                                break;
                            case "null":
                                row.push(null);
                                break;
                            default:
                                row.push(
                                    await resolveColumn(
                                        message.tableName,
                                        record,
                                        column
                                    )
                                );
                        }
                    }
                    const sortColumns = [];
                    if (message.sorts) {
                        for (const sort of message.sorts) {
                            if (sort.startsWith("-")) {
                                sortColumns.push(
                                    await resolveColumn(
                                        message.tableName,
                                        record,
                                        sort.substr(1)
                                    )
                                );
                            } else {
                                sortColumns.push(
                                    await resolveColumn(
                                        message.tableName,
                                        record,
                                        sort
                                    )
                                );
                            }
                        }
                    }

                    rows.push({ row, sortColumns });
                }
                rows.sort((a, b) => {
                    for (let [x, y, name] of zip(
                        a.sortColumns,
                        b.sortColumns,
                        message.sorts
                    )) {
                        if (typeof x == "string") {
                            x = x.toLocaleLowerCase();
                        }
                        if (typeof y === "string") {
                            y = y.toLocaleLowerCase();
                        }
                        if (name.startsWith("-")) {
                            if (x < y) {
                                return 1;
                            } else if (x > y) {
                                return -1;
                            }
                        } else {
                            if (x < y) {
                                return -1;
                            } else if (x > y) {
                                return 1;
                            }
                        }
                    }
                    return 0;
                });
                const full_count = rows.length;

                if (message.limit) {
                    rows = rows.slice(0, message.limit);
                }
                return {
                    status: "OK",
                    rows: rows.map((row) => row.row),
                    full_count,
                };
            } else {
                return {
                    status: "OK",
                    rows: [],
                    full_count: 0,
                };
            }
        }
        case "RECORD": {
            if (TABLES.has(message.tableName)) {
                const database = await openDatabase();
                const rawRecord = await database.get(
                    message.tableName,
                    message.recordId
                );

                const record = rawRecord || null;

                return {
                    status: "OK",
                    record,
                };
            } else {
                return {
                    status: "OK",
                    record: null,
                };
            }
        }
        case "RECORDS": {
            if (TABLES.has(message.tableName)) {
                const database = await openDatabase();
                const records = await resolveRecords(
                    database,
                    message.tableName,
                    await database.getAll(message.tableName)
                );
                return {
                    status: "OK",
                    records,
                };
            } else {
                return {
                    status: "OK",
                    records: [],
                };
            }
        }
        case "EDIT": {
        }
        case "REVERT":
        case "FETCH_HISTORY": {
            throw new Error("Should never happen");
        }
        case "PATCH": {
            await recordLocalPatch(message, true);
            return await localResponse({
                type: "RECORD",
                tableName: message.tableName,
                recordId: message.id,
            });
        }
        case "GENERATE": {
            const id = genUUID();

            const database = await openDatabase();
            database.put("pending", { id, ...message }, "GENERATE@" + id);
            return {
                url: null,
                target: [],
                error: null,
                offline: true,
            };
        }
        case "STORE":
        case "DELETE": {
            const key = pendingKeyFor(message);
            const database = await openDatabase();
            if (TABLES.has(message.tableName)) {
                const transaction = await database.transaction(
                    ["pending", message.tableName],
                    "readwrite"
                );
                const pendingStore = await transaction.objectStore("pending");
                await pendingStore.put(message, key);
                const recordStore = await transaction.objectStore(
                    message.tableName
                );
                switch (message.type) {
                    case "STORE":
                        await recordStore.put(
                            message.record,
                            message.record.id
                        );
                        break;
                    case "DELETE":
                        await recordStore.delete(message.recordId);
                        break;
                }
                await transaction.done;
            } else {
                await database.put("pending", message, key);
            }

            switch (message.type) {
                case "STORE":
                    return {
                        status: "OK",
                        record: message.record,
                    };
                case "DELETE":
                    return {
                        status: "OK",
                        recordId: message.recordId,
                    };
                default:
                    throw new Error();
            }
        }
    }
}

export async function resolvePending(socket: ReconnectingWebSocket) {
    const database = await openDatabase();

    const transaction = database.transaction(["pending"], "readwrite");
    const pending = transaction.objectStore("pending");

    const allPending = await pending.getAll();

    const nonGenerate = allPending.filter(
        (record) => record.type !== "GENERATE"
    );

    if (nonGenerate.length > 0) {
        await Promise.all(
            nonGenerate.map((record) =>
                sendPending(socket, transaction, record)
            )
        );
    } else {
        await Promise.all(
            allPending.map((record) => sendPending(socket, transaction, record))
        );
    }

    await transaction.done;
}

export async function pendingReturn(
    socket: ReconnectingWebSocket,
    message: any
) {
    const id = message.id.substring(8);
    const [table, record, kind, detail] = id.split("@");
    const key = table + "@" + record;
    if (message.type !== "ERROR") {
        const database = await openDatabase();
        const transaction = database.transaction(["pending"], "readwrite");
        const pendingStore = transaction.objectStore("pending");

        const pending = await pendingStore.get(key);

        if (pending?.type === kind) {
            switch (kind) {
                case "DELETE":
                case "GENERATE":
                    pendingStore.delete(key);
                    break;
                case "PATCH":
                    const newPatchIds = [];
                    const newPatches = [];
                    for (
                        let index = 0;
                        index < pending.patches.length;
                        index++
                    ) {
                        if (
                            message.response.appliedPatches.indexOf(
                                pending.patchIds[index]
                            ) == -1
                        ) {
                            newPatchIds.push(pending.patchIds[index]);
                            newPatches.push(pending.patches[index]);
                        }
                    }

                    if (newPatches.length > 0) {
                        pendingStore.put(
                            {
                                ...pending,
                                patches: newPatches,
                                patchIds: newPatchIds,
                                __previousSend: undefined,
                            },
                            key
                        );
                    } else {
                        pendingStore.delete(key);
                    }
                    break;
            }
        }

        await transaction.done;
        CHANNEL.postMessage({
            type: "PENDING_RESOLVED",
            key,
        });
        PENDING_RESOLVED.emit(key);
    } else {
        // Some change
        const database = await openDatabase();
        const transaction = database.transaction(["pending"], "readwrite");
        const pendingStore = transaction.objectStore("pending");
        const pending = await pendingStore.get(key);
        await pendingStore.delete(key);
        const id = genUUID();
        socket.send(
            JSON.stringify({
                id: "pending@" + id,
                request: {
                    type: "STORE",
                    tableName: "ChangeRejected",
                    form: "pending change",
                    record: {
                        id,
                        recordVersion: null,
                        addedBy: null,
                        addedDateTime: null,
                        tableName: "",
                        recordId: null,
                        detail: JSON.stringify(pending) || "",
                    },
                },
            })
        );
        CHANNEL.postMessage({
            type: "PENDING_RESOLVED",
            key,
        });
        PENDING_RESOLVED.emit(key);
    }
}

export async function pendingCount() {
    const database = await openDatabase();
    return database.count("pending");
}
