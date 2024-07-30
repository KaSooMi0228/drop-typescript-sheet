import { EventEmitter } from "events";
import { diff } from "jsondiffpatch";
import { uniqueId } from "lodash";
import * as React from "react";
import usePromise from "react-use-promise";
import { Project } from "ts-morph";
import { SERVICE } from "../app/service";
import { VisibilityContext } from "../app/visibility";
import { RecordMeta } from "../clay/meta";
import { FilterDetail, QueryTableResult } from "../clay/server/api";
import { Link } from "./link";
import { genUUID, UUID } from "./uuid";

export async function rawRequest(request: any): Promise<any> {
    return SERVICE.send({
        request,
        id: uniqueId("p"),
    });
}

export async function fetchRecord<RecordType, JsonType, BrokenJsonType>(
    meta: RecordMeta<RecordType, JsonType, BrokenJsonType>,
    id: string
): Promise<RecordType | null> {
    const response = await rawRequest({
        type: "RECORD",
        tableName: meta.name,
        recordId: id,
    });
    if (response.record == null) {
        return null;
    }

    return meta.fromJSON(response.record);
}

export async function fetchRawRecordByTable(
    tableName: string,
    id: string
): Promise<any> {
    const response = await rawRequest({
        type: "RECORD",
        tableName: tableName,
        recordId: id,
    });

    return response.record;
}

export async function fetchRawRecord<RecordType, JsonType, BrokenJsonType>(
    meta: RecordMeta<RecordType, JsonType, BrokenJsonType>,
    id: string
): Promise<JsonType | null> {
    const response = await rawRequest({
        type: "RECORD",
        tableName: meta.name,
        recordId: id,
    });

    return response.record;
}

export async function maybeFetchRecord<RecordType, JsonType, BrokenJsonType>(
    meta: RecordMeta<RecordType, JsonType, BrokenJsonType>,
    id: string | null
): Promise<RecordType | null> {
    if (id === null) {
        return null;
    } else {
        return fetchRecord(meta, id);
    }
}

export async function fetchRecords<RecordType, JsonType, BrokenJsonType>(
    meta: RecordMeta<RecordType, JsonType, BrokenJsonType>
): Promise<RecordType | null> {
    const response = await rawRequest({
        type: "RECORDS",
        tableName: meta.name,
    });

    return response.records.map(meta.fromJSON);
}

export const PRINT_EVENTS = new EventEmitter();

export async function generateDocument(
    template: string,
    parameters: string[],
    sendEmails: boolean
): Promise<void> {
    await Promise.resolve();
    const id = genUUID();
    PRINT_EVENTS.emit("started", {
        id,
        template,
    });
    try {
        const response = await rawRequest({
            type: "GENERATE",
            template,
            parameters,
            sendEmails,
        });

        PRINT_EVENTS.emit("finished", {
            id,
            url: response.url,
            target: response.target,
            error: response.error,
            offline: response.offline,
        });
    } catch (error) {
        PRINT_EVENTS.emit("finished", {
            id,
            url: null,
            target: [],
            error: "Failed",
            offline: false,
        });
    }
}

export async function storeRecord<
    RecordType extends { id: UUID },
    JsonType,
    BrokenJsonType extends { id: string }
>(
    meta: RecordMeta<RecordType, JsonType, BrokenJsonType>,
    form: string,
    record: RecordType
): Promise<RecordType | null> {
    const original = meta.repair({
        id: record.id.uuid,
    } as any);

    const current = meta.toJSON(record);

    const patch = diff(original, current);

    return patchRecord(meta, form, record.id.uuid, patch);
}

export async function replaceRecord<
    RecordType extends { id: UUID },
    JsonType,
    BrokenJsonType extends { id: string }
>(
    meta: RecordMeta<RecordType, JsonType, BrokenJsonType>,
    form: string,
    record: RecordType
): Promise<RecordType | null> {
    const original = meta.repair({
        id: record.id.uuid,
    } as any);

    const current = meta.toJSON(record);

    const patch = diff(original, current);

    return patchRecord(meta, form, record.id.uuid, patch, true);
}

export async function patchRecord<RecordType, JsonType, BrokenJsonType>(
    meta: RecordMeta<RecordType, JsonType, BrokenJsonType>,
    form: string,
    id: string,
    patch: any,
    override: boolean = false
): Promise<RecordType | null> {
    const response = await rawRequest({
        type: "PATCH",
        tableName: meta.name,
        form,
        id,
        override,
        patches: [patch],
        patchIds: [genUUID()],
    });

    return meta.fromJSON(response.record);
}

export async function localPatchRecord<RecordType, JsonType, BrokenJsonType>(
    meta: RecordMeta<RecordType, JsonType, BrokenJsonType>,
    form: string,
    id: string,
    patch: any
) {
    return SERVICE.send({
        type: "LOCAL_PATCH",
        request: {
            tableName: meta.name,
            form,
            id,
            patches: [patch],
            patchIds: [genUUID()],
        },
        id: uniqueId("p"),
    });
}

export async function deleteRecord<RecordType, JsonType, BrokenJsonType>(
    meta: RecordMeta<RecordType, JsonType, BrokenJsonType>,
    form: string,
    recordId: string
): Promise<undefined> {
    const response = await rawRequest({
        type: "DELETE",
        tableName: meta.name,
        form,
        recordId: recordId,
    });

    return undefined;
}

export function doQuery(options: {
    tableName: string;
    columns: string[];
    sorts?: string[];
    filters?: FilterDetail[];
    limit?: number;
}): Promise<QueryTableResult> {
    return rawRequest({
        type: "QUERY",
        ...options,
    });
}

export function useQuery(
    options: {
        tableName: string;
        columns: string[];
        sorts?: string[];
        filters?: FilterDetail[];
        limit?: number;
    },
    depends: React.DependencyList,
    active = true
) {
    const visible = React.useContext(VisibilityContext);
    const [lastChange, setLastChange] = React.useState(new Date());

    React.useEffect(() => {
        function callback(message: any) {
            if (message.table === options.tableName) {
                setLastChange(new Date());
            }
        }
        SERVICE.addListener("cache-change", callback);
        return () => {
            SERVICE.removeListener("cache-change", callback);
        };
    }, [options.tableName, setLastChange]);

    return useRequest<QueryTableResult["rows"] | undefined>(async () => {
        if (active && visible) {
            return (await doQuery(options)).rows;
        } else {
            return undefined;
        }
    }, [...depends, lastChange, active, visible]);
}

export function useIdQuery<RecordType, JsonType, BrokenJsonType>(
    meta: RecordMeta<RecordType, JsonType, BrokenJsonType>,
    options: {
        sorts?: string[];
        filters?: FilterDetail[];
        limit?: number;
    },
    depends: React.DependencyList
): string[] | undefined {
    const rows = useQuery(
        {
            tableName: meta.name,
            columns: ["id"],
            ...options,
        },
        depends
    );

    return React.useMemo(() => {
        if (rows === undefined) {
            return undefined;
        } else {
            return rows.map((row) => row[0] as string);
        }
    }, [rows]);
}

export function useRawRecordQuery<RecordType, JsonType, BrokenJsonType>(
    meta: RecordMeta<RecordType, JsonType, BrokenJsonType>,
    options: {
        sorts?: string[];
        filters?: FilterDetail[];
        limit?: number;
    },
    depends: React.DependencyList,
    active = true
) {
    const rows = useQuery(
        {
            tableName: meta.name,
            columns: ["."],
            ...options,
        },
        depends,
        active
    );

    return React.useMemo(() => {
        if (rows === undefined) {
            return undefined;
        } else {
            return rows.map((row) => row[0] as JsonType);
        }
    }, [rows]);
}

export function useDraftProjectRecordQuery<
    RecordType,
    JsonType,
    BrokenJsonType
>(
    meta: RecordMeta<RecordType, JsonType, BrokenJsonType>,
    project: Link<Project>
) {
    return useRecordQuery(
        meta,
        {
            filters: [
                {
                    column: "project",
                    filter: {
                        equal: project,
                    },
                },
            ],
            sorts: ["number", "addedDateTime"].filter((x) => x in meta.fields),
        },
        [project]
    );
}

export function useProjectRecordQuery<RecordType, JsonType, BrokenJsonType>(
    meta: RecordMeta<RecordType, JsonType, BrokenJsonType>,
    project: Link<Project>
) {
    return useRecordQuery(
        meta,
        {
            filters: [
                {
                    column: "project",
                    filter: {
                        equal: project,
                    },
                },
                {
                    column: "date",
                    filter: {
                        not_equal: null,
                    },
                },
            ],
            sorts: ["number", "addedDateTime"].filter((x) => x in meta.fields),
        },
        [project]
    );
}

export async function doRecordQuery<RecordType, JsonType, BrokenJsonType>(
    meta: RecordMeta<RecordType, JsonType, BrokenJsonType>,
    options: {
        sorts?: string[];
        filters?: FilterDetail[];
        limit?: number;
    }
) {
    const rows = await doQuery({
        tableName: meta.name,
        columns: ["."],
        ...options,
    });

    return rows.rows.map((row) => meta.fromJSON(row[0] as JsonType));
}

export function useRecordQuery<RecordType, JsonType, BrokenJsonType>(
    meta: RecordMeta<RecordType, JsonType, BrokenJsonType>,
    options: {
        sorts?: string[];
        filters?: FilterDetail[];
        limit?: number;
    },
    depends: React.DependencyList,
    active = true
) {
    const rows = useQuery(
        {
            tableName: meta.name,
            columns: ["."],
            ...options,
        },
        depends,
        active
    );

    return React.useMemo(() => {
        if (rows === undefined) {
            return undefined;
        } else {
            return rows.map((row) => meta.fromJSON(row[0] as JsonType));
        }
    }, [rows]);
}

export function useRequest<T>(
    fn: () => Promise<T>,
    depends: React.DependencyList
) {
    const [result, error, state] = usePromise(fn, depends as any);
    return result;
}
