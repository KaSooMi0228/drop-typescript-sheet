import * as React from "react";
import ReactDOM from "react-dom";
import { createSelector } from "reselect";
import { createContext, useContextSelector } from "use-context-selector";
import { recordLog } from "../app/logger";
import { SERVICE } from "../app/service";
import { TABLES_META } from "../app/tables";
import { doQuery, fetchRecord, fetchRecords, useRequest } from "./api";
import { Dictionary } from "./common";
import { RecordMeta } from "./meta";
import { QueryRequest } from "./requests";

const QuickCacheContext = createContext<
    [QuickCacheState, (action: QuickCacheAction) => void] | null
>(null);

type QuickCacheRecordState = {
    record: any;
    fetching: boolean;
    age: number;
    live: boolean;
};

type QuickCacheTableState = {
    records: Dictionary<QuickCacheRecordState>;
    age: number;
    fetching: boolean;
    live: boolean;
};

type QuickCacheState = {
    tables: Dictionary<QuickCacheTableState>;
    exists: Dictionary<boolean | undefined>;
    existsQuery: Dictionary<QueryRequest["request"]>;
};

type QuickCacheRecordAction =
    | {
          type: "LOAD";
          table: string;
          id: string;
          record: any;
          age: number;
      }
    | {
          type: "REQUEST";
          table: string;
          id: string;
      }
    | {
          type: "INVALIDATE_CACHE";
          table: string;
          id: string;
      };

type QuickCacheTableAction =
    | QuickCacheRecordAction
    | {
          type: "REQUEST_RECORDS";
          table: string;
      }
    | {
          type: "LOAD_RECORDS";
          table: string;
          records: any[];
          age: number;
      };

type QuickCacheAction =
    | QuickCacheTableAction
    | {
          type: "LOAD_EXISTS";
          key: string;
          value: boolean;
      }
    | {
          type: "REQUEST_EXISTS";
          key: string;
          query: QueryRequest["request"];
      }
    | {
          type: "REQUEST_EXISTS";
          key: string;
          query: QueryRequest["request"];
      };

function reduceRecord(
    state: QuickCacheRecordState = {
        record: undefined,
        fetching: false,
        age: 0,
        live: false,
    },
    action: QuickCacheRecordAction
): QuickCacheRecordState {
    switch (action.type) {
        case "REQUEST":
            return {
                ...state,
                fetching: true,
            };
        case "LOAD":
            if (action.age === state.age) {
                return {
                    ...state,
                    fetching: false,
                    live: true,
                    age: action.age,
                    record: action.record,
                };
            } else {
                return state;
            }
        case "INVALIDATE_CACHE":
            return {
                ...state,
                live: false,
                age: state.age + 1,
            };
    }
}

function reduceTable(
    state: QuickCacheTableState = {
        records: {},
        fetching: false,
        age: 0,
        live: false,
    },
    action: QuickCacheTableAction
): QuickCacheTableState {
    switch (action.type) {
        case "REQUEST":
        case "LOAD":
            return {
                ...state,
                records: {
                    ...state.records,
                    [action.id]: reduceRecord(state.records[action.id], action),
                },
            };
        case "REQUEST_RECORDS":
            return {
                ...state,
                fetching: true,
            };
        case "LOAD_RECORDS":
            if (action.age === state.age) {
                return {
                    ...state,
                    fetching: false,
                    live: true,
                    age: action.age,
                    records: Object.fromEntries(
                        action.records.map((record) => [
                            record.id.uuid,
                            {
                                record: record,
                                fetching: false,
                                live: true,
                            },
                        ])
                    ),
                };
            } else {
                return state;
            }
        case "INVALIDATE_CACHE":
            return {
                ...state,
                age: state.age + 1,
                live: false,
                records: {
                    ...state.records,
                    [action.id]: reduceRecord(state.records[action.id], action),
                },
            };
    }
}

function reducer(
    state: QuickCacheState,
    action: QuickCacheAction
): QuickCacheState {
    recordLog("cache-action", action);
    const newState = reducerImpl(state, action);
    recordLog("cache-state", newState);
    return newState;
}

function reducerImpl(
    state: QuickCacheState,
    action: QuickCacheAction
): QuickCacheState {
    switch (action.type) {
        case "LOAD":
        case "LOAD_RECORDS":
        case "REQUEST":
        case "REQUEST_RECORDS":
        case "INVALIDATE_CACHE":
            return {
                ...state,
                tables: {
                    ...state.tables,
                    [action.table]: reduceTable(
                        state.tables[action.table],
                        action
                    ),
                },
            };
        case "LOAD_EXISTS":
            return {
                ...state,
                exists: {
                    ...state.exists,
                    [action.key]: action.value,
                },
            };
        case "REQUEST_EXISTS":
            return {
                ...state,
                exists: {
                    ...state.exists,
                    [action.key]: undefined,
                },
                existsQuery: {
                    ...state.existsQuery,
                    [action.key]: action.query,
                },
            };
    }
}

function FetchQuickRecord(props: {
    table: string;
    id: string;
    dispatch: (action: QuickCacheAction) => void;
    age: number;
}) {
    useRequest(async () => {
        const record = await fetchRecord(TABLES_META[props.table], props.id);
        props.dispatch({
            type: "LOAD",
            table: props.table,
            id: props.id,
            record,
            age: props.age,
        });
    }, [props.table, props.id, props.dispatch]);
    return <></>;
}

function FetchQuickAllRecords(props: {
    table: string;
    dispatch: (action: QuickCacheAction) => void;
    age: number;
}) {
    useRequest(async () => {
        const records = await fetchRecords(TABLES_META[props.table]);
        if ("name" in TABLES_META[props.table].fields) {
            records.sort((a: any, b: any) => a.name.localeCompare(b.name));
        }
        props.dispatch({
            type: "LOAD_RECORDS",
            table: props.table,
            records,
            age: props.age,
        });
    }, [props.table, props.dispatch]);
    return <></>;
}

function FetchQuickExists(props: {
    requestKey: string;
    query: QueryRequest["request"];
    dispatch: (action: QuickCacheAction) => void;
}) {
    useRequest(async () => {
        const records = await doQuery(props.query);
        props.dispatch({
            type: "LOAD_EXISTS",
            key: props.requestKey,
            value: records.rows.length > 0,
        });
    }, [props.requestKey, props.query, props.dispatch]);
    return <></>;
}

export function QuickCache(props: { children: React.ReactNode }) {
    const [cacheState, dispatch] = React.useReducer(reducer, {
        tables: {},
        exists: {},
        existsQuery: {},
    });

    let dispatches: QuickCacheAction[] = [];

    let nextTick: Promise<void> | null = null;

    const delayedDispatch = (args: QuickCacheAction) => {
        dispatches.push(args);
        if (nextTick === null) {
            nextTick = Promise.resolve().then(() => {
                ReactDOM.unstable_batchedUpdates(() => {
                    const actions = dispatches;
                    dispatches = [];

                    for (const action of actions) {
                        dispatch(action);
                    }
                });
            });
        }
    };

    React.useEffect(() => {
        SERVICE.addListener("cache-change", dispatch);
    }, [dispatch]);

    return (
        <QuickCacheContext.Provider value={[cacheState, delayedDispatch]}>
            {Object.entries(cacheState.tables).map(([key, details]) => (
                <React.Fragment key={key}>
                    {Object.entries(details.records)
                        .filter(([key, value]) => value.fetching)
                        .map(([id, value]) => (
                            <FetchQuickRecord
                                key={id + ":" + value.age}
                                table={key}
                                id={id}
                                dispatch={dispatch}
                                age={value.age}
                            />
                        ))}
                    {details.fetching && (
                        <FetchQuickAllRecords
                            key={key + ":" + details.age}
                            table={key}
                            dispatch={dispatch}
                            age={details.age}
                        />
                    )}
                </React.Fragment>
            ))}

            {Object.entries(cacheState.exists).map(
                ([key, value]) =>
                    value === undefined && (
                        <FetchQuickExists
                            key={key}
                            requestKey={key}
                            query={cacheState.existsQuery[key]}
                            dispatch={dispatch}
                        />
                    )
            )}

            {props.children}
        </QuickCacheContext.Provider>
    );
}

export class QuickCacheApi {
    cache: QuickCacheState;
    dispatch: (action: QuickCacheAction) => void;

    constructor(cache: [QuickCacheState, (action: QuickCacheAction) => void]) {
        this.cache = cache[0];
        this.dispatch = cache[1];
    }

    get<RecordType, JsonType, BrokenJsonType>(
        table: RecordMeta<RecordType, JsonType, BrokenJsonType>,
        id: string | null
    ): RecordType | undefined | null {
        if (id == null) {
            return null;
        }
        const tableRecords = this.cache.tables[table.name]?.records || {};

        if (!tableRecords[id]?.live && !tableRecords[id]?.fetching) {
            this.dispatch({
                type: "REQUEST",
                table: table.name,
                id,
            });
        }
        return tableRecords[id]?.record;
    }

    getAll<RecordType, JsonType, BrokenJsonType>(
        table: RecordMeta<RecordType, JsonType, BrokenJsonType>
    ): RecordType[] | undefined {
        const tableDetails = this.cache.tables[table.name];
        if (!tableDetails?.live && !tableDetails?.fetching) {
            this.dispatch({
                type: "REQUEST_RECORDS",
                table: table.name,
            });
        }
        if (!tableDetails?.live) {
            return undefined;
        }
        return Object.values(tableDetails?.records || {})
            .map((detail) => detail.record)
            .filter((x) => x);
    }
    exists(key: string, query: QueryRequest["request"]) {
        if (!(key in this.cache.exists)) {
            this.dispatch({
                type: "REQUEST_EXISTS",
                key,
                query,
            });
        }
        return this.cache.exists[key];
    }
}

const quickCacheApi = createSelector(
    (x: [QuickCacheState, (action: QuickCacheAction) => void]) => x,
    (x: [QuickCacheState, (action: QuickCacheAction) => void]) =>
        new QuickCacheApi(x)
);

export function useQuickCache() {
    return useContextSelector(QuickCacheContext, (context) =>
        quickCacheApi(context!)
    );
}

export function useQuickCacheSelector<T>(
    selector: (context: QuickCacheApi) => T
) {
    return useContextSelector(QuickCacheContext, (context) =>
        selector(quickCacheApi(context!))
    );
}

export function useQuickRecord<RecordType, JsonType, BrokenJsonType>(
    table: RecordMeta<RecordType, JsonType, BrokenJsonType>,
    id: string | null
) {
    return useQuickCacheSelector((api) => api.get(table, id));
}

export function useQuickRecords<RecordType, JsonType, BrokenJsonType>(
    table: RecordMeta<RecordType, JsonType, BrokenJsonType>,
    ids: string[]
): RecordType[] {
    return useQuickCacheSelector((api) =>
        ids
            .map((id) => api.get(table, id))
            .filter((x) => x)
            .map((x) => x!)
    );
}

export function useQuickAllRecords<RecordType, JsonType, BrokenJsonType>(
    table: RecordMeta<RecordType, JsonType, BrokenJsonType>
) {
    const cache = useQuickCache();
    return React.useMemo(() => {
        return cache.getAll(table);
    }, [cache.cache.tables[table.name]]);
}
