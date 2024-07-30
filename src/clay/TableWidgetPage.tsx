import {
    faLock,
    faLockOpen,
    faRedo,
    faUndo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import deepEqual from "fast-deep-equal";
import { diff } from "jsondiffpatch";
import { isEqual } from "lodash";
import { ParsedUrlQuery } from "querystring";
import * as React from "react";
import { Alert, Breadcrumb, Button } from "react-bootstrap";
import Modal from "react-modal";
import uuidValidate from "uuid-validate";
import { CHANNEL, SERVICE } from "../app/service";
import { useUser } from "../app/state";
import { Dictionary } from "../clay/common";
import { Editable } from "../clay/edit-context";
import { RecordMeta } from "../clay/meta";
import {
    BaseAction,
    Page,
    PageContext,
    PageRequest,
    ReduceResult,
    usePageContext,
} from "../clay/Page";
import { DeleteRecordResult, StoreRecordResult } from "../clay/server/api";
import { Widget, WidgetRequest } from "../clay/widgets";
import { hasPermission } from "../permissions";
import { fetchRawRecord, useRequest } from "./api";
import { EditorsContext } from "./editors";
import { QuickCacheApi, useQuickCache } from "./quick-cache";
import {
    castRequest,
    DeleteRequest,
    EditingRecordRequest,
    FinishedRequest,
    LocalPatchRequest,
    PatchRequest,
    PrintRequest,
    Request,
    RequestHandle,
    StoreRequest,
} from "./requests";
import { titleCase } from "./title-case";
import { genUUID, newUUID, UUID } from "./uuid";

function isMoreChange(oldAction: any, newAction: any): boolean {
    if (!oldAction || !newAction) {
        return false;
    }
    if (Object.keys(oldAction).length !== Object.keys(newAction).length) {
        return false;
    }
    for (const key in oldAction) {
        if (key === "value" && oldAction.type === "SET") {
            // ok
        } else if (key != "action") {
            if (!deepEqual(oldAction[key], newAction[key])) {
                return false;
            }
        } else {
            if (!isMoreChange(oldAction.action, newAction.action)) {
                return false;
            }
        }
    }
    return true;
}

function isBlur(action: any): boolean {
    if ("action" in action) {
        return isBlur(action.action);
    }
    return action.type === "BLUR";
}

function isBoring(oldAction: any, newAction: any): boolean {
    return isMoreChange(oldAction, newAction) || isBlur(newAction);
}

type State<StateType, DataType, ActionType> = {
    baseRecord: any;
    currentRecordId: string | null;
    currentRecord: null | DataType;
    saved: null | DataType;
    loaded: null | DataType;
    autosaving: boolean;
    state:
        | "editing"
        | "saving"
        | "saved"
        | "deleting"
        | "deleted"
        | "printing"
        | "printed"
        | "duplicating"
        | "duplicated";
    ui: StateType | null;
    sentRequests: Dictionary<WidgetRequest>;
    resolvedValues: Dictionary<WidgetRequest>;
    scheduledPrint: {
        template: string;
        parameters: string[];
    } | null;
    tail: string[];
    category: string | null;
    lock: "nolock" | "locked" | "unlocked";
    watching: boolean;
    editors: {
        id: string;
        username: string;
        timestamp: Date;
    }[];
    parameters: ParsedUrlQuery;
    undos: { data: DataType; state: StateType }[];
    redos: { data: DataType; state: StateType }[];
    lastUndoAction: ActionType | null;
};
export type TableWidgetPageState<StateType, DataType, ActionType> = State<
    StateType,
    DataType,
    ActionType
>;

export type Action<ActionType, DataType> =
    | {
          type: "LOAD";
          base: any;
          record: DataType | null;
      }
    | {
          type: "RECORD";
          action: ActionType;
      }
    | {
          type: "SAVE";
          printTemplate: string | null;
          templateParameters: string[];
      }
    | {
          type: "PRINT";
          printTemplate: string;
          templateParameters: string[];
      }
    | {
          type: "SAVED";
          response: StoreRecordResult;
      }
    | {
          type: "DUPLICATED";
          response: StoreRecordResult;
      }
    | {
          type: "DUPLICATE";
      }
    | {
          type: "DELETE";
      }
    | {
          type: "DELETED";
          response: DeleteRecordResult;
      }
    | {
          type: "AUTOSAVED";
      }
    | {
          type: "RESOLVE_REQUEST";
          request: WidgetRequest;
          key: string;
          response: any;
      }
    | {
          type: "TOGGLE_LOCK";
      }
    | {
          type: "SUBSTITUTE";
          key: string;
      }
    | {
          type: "EDITING_UPDATED";
          editors: {
              userId: string;
              username: string;
              timestamp: string;
          }[];
      }
    | {
          type: "UNDO";
      }
    | {
          type: "REDO";
      }
    | BaseAction;

export type TableWidgetPageAction<ActionType, DataType> = Action<
    ActionType,
    DataType
>;

type Props<StateType, DataType, ActionType> = {
    state: State<StateType, DataType, ActionType>;
    dispatch: (action: Action<ActionType, DataType>) => void;
};

export type TableWidgetOptions<
    StateType,
    DataType,
    ContextType,
    ActionType,
    JsonType,
    BrokenJsonType
> = {
    meta: Widget<StateType, DataType, ContextType, ActionType, {}> & {
        dataMeta: RecordMeta<DataType, JsonType, BrokenJsonType>;
    };
    makeContext: (context: PageContext) => ContextType;
    applyName?: (record: DataType, name: string) => DataType;
    applyCategory?: (record: DataType, name: string) => DataType;
    updater?: (record: DataType, requests: Dictionary<any>) => DataType;
    locked?: (record: DataType) => boolean;
    requests?: (
        state: StateType,
        record: DataType
    ) => Dictionary<WidgetRequest>;
    initialize?: (record: DataType, context: ContextType) => DataType;
    autoSave?: boolean;
    title: (record: DataType, cache: QuickCacheApi) => string;
    name?: string;
    postSave?: (record: DataType) => void;
    preSave?: (record: DataType) => DataType;
    disableFinish?: boolean;
    print?: (
        record: DataType,
        template: string,
        parameters: string[],
        sendEmails: boolean
    ) => void;
};

export function TableWidgetPage<
    StateType,
    DataType extends { id: UUID },
    ContextType,
    ActionType,
    ThisRequestType extends PageRequest,
    JsonType,
    BrokenJsonType
>(
    options: TableWidgetOptions<
        StateType,
        DataType,
        ContextType,
        ActionType,
        JsonType,
        BrokenJsonType
    >
): Page<State<StateType, DataType, ActionType>, Action<ActionType, DataType>> {
    const meta = options.meta;

    const updater = options.updater || ((data, requests) => data);
    const locked = options.locked || ((data) => false);

    const table = options.meta.dataMeta.name;

    const name = options.name || titleCase(table);

    function initialize(
        segments: string[],
        parameters: ParsedUrlQuery,
        context: PageContext
    ): ReduceResult<
        State<StateType, DataType, ActionType>,
        Action<ActionType, DataType>
    > {
        const { state, requests } = reduce(
            {
                baseRecord: null,
                scheduledPrint: null,
                currentRecordId: null,
                currentRecord: null,
                saved: null,
                loaded: null,
                state: "editing",
                ui: null,
                sentRequests: {},
                resolvedValues: {},
                tail: [],
                category: null,
                lock: "nolock",
                watching: false,
                editors: [],
                parameters,
                undos: [],
                redos: [],
                lastUndoAction: null,
                autosaving: false,
            },
            {
                type: "UPDATE_PARAMETERS",
                segments,
                parameters,
            },
            context
        );

        return {
            state,
            requests,
        };
    }

    function component(props: Props<StateType, DataType, ActionType>) {
        const user = useUser();
        const context = usePageContext();
        const record = useRequest(async () => {
            if (props.state.currentRecord === null) {
                if (props.state.currentRecordId === "new") {
                    let base = options.meta.dataMeta.repair(undefined);
                    let record = options.meta.dataMeta.fromJSON(base);
                    if (options.initialize) {
                        record = options.initialize(
                            record,
                            options.makeContext(context)
                        );
                    }
                    if (options.applyName && props.state.parameters.name) {
                        record = options.applyName(
                            record,
                            decodeURIComponent(
                                props.state.parameters.name as string
                            )
                        );
                    }
                    if (options.applyCategory) {
                        let category = props.state.parameters
                            .category as string;
                        record = options.applyCategory(
                            record,
                            decodeURIComponent(category)
                        );
                    }

                    props.dispatch({
                        type: "LOAD",
                        base,
                        record: record,
                    });
                } else {
                    const base1 = await fetchRawRecord(
                        options.meta.dataMeta,
                        props.state.currentRecordId || ""
                    );

                    const base = base1
                        ? base1
                        : options.meta.dataMeta.repair({
                              id: props.state.currentRecordId,
                          } as any);

                    props.dispatch({
                        type: "LOAD",
                        base,
                        record: options.meta.dataMeta.fromJSON(base),
                    });
                }
            }
        }, [
            options.meta.dataMeta,
            props.state.currentRecordId,
            props.state.currentRecord,
        ]);

        const cache = useQuickCache();

        const [isProtested, setProtested] = React.useState(false);

        React.useEffect(() => {
            setProtested(false);
            if (props.state.currentRecord && props.state.currentRecord.id) {
                CHANNEL.postMessage({
                    type: "DECLARE_EDIT",
                    table: options.meta.dataMeta.name,
                    id: props.state.currentRecord.id.uuid,
                });

                const currentRecordId = props.state.currentRecord.id.uuid;

                const onMessage = (event: MessageEvent<any>) => {
                    const message = event.data;
                    if (
                        message.type === "DECLARE_EDIT" &&
                        message.table === options.meta.dataMeta.name &&
                        message.id === currentRecordId
                    ) {
                        CHANNEL.postMessage({
                            type: "PROTEST_EDIT",
                            table: message.table,
                            id: message.id,
                        });
                    } else if (
                        message.type === "PROTEST_EDIT" &&
                        message.table === options.meta.dataMeta.name &&
                        message.id === currentRecordId
                    ) {
                        setProtested(true);
                    }
                };
                CHANNEL.addEventListener("message", onMessage);
                return () => {
                    CHANNEL.removeEventListener("message", onMessage);
                };
            } else {
                return undefined;
            }
        }, [
            options.meta.dataMeta.name,
            props.state.currentRecord?.id?.uuid,
            setProtested,
        ]);

        const [badPatch, setBadPatch] = React.useState(false);

        React.useEffect(() => {
            const callback = (message: any) => {
                if (
                    message.type == "ERROR" &&
                    message.status == "BAD_PATCH" &&
                    message.tableName == options.meta.dataMeta.name &&
                    message.recordId == props.state.currentRecord?.id?.uuid
                ) {
                    setBadPatch(true);
                }
            };
            SERVICE.addListener("message", callback);
            return () => {
                SERVICE.removeListener("message", callback);
            };
        }, [
            options.meta.dataMeta.name,
            props.state.currentRecord?.id?.uuid,
            setBadPatch,
        ]);

        if (!hasPermission(user, options.meta.dataMeta.name, "read")) {
            throw new Error("User does not have permission");
        }

        const subdispatch = React.useCallback(
            (action) => props.dispatch({ type: "RECORD", action }),
            [props.dispatch]
        );

        if (!props.state.ui || !props.state.currentRecord) {
            return <div />;
        }

        const validation = meta.validate(props.state.currentRecord, cache);

        const isLocked =
            props.state.lock === "locked" ||
            !hasPermission(user, options.meta.dataMeta.name, "write");

        const isBusy =
            props.state.state == "saving" ||
            props.state.state == "deleting" ||
            props.state.state == "printing" ||
            props.state.state == "duplicating";

        return (
            <div
                style={{
                    margin: "10px",
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "auto",
                    flexGrow: 1,
                }}
            >
                {badPatch && (
                    <Modal
                        isOpen={true}
                        style={{
                            content: {
                                zIndex: 200,
                                width: "20em",
                                height: "20em",
                                top: "50%",
                                left: "50%",
                                right: "auto",
                                bottom: "auto",
                                marginRight: "-50%",
                                transform: "translate(-50%, -50%)",
                                textAlign: "center",
                            },
                        }}
                    >
                        <Alert variant="danger">
                            There was a problem saving your data. Please refresh
                            and try again.
                        </Alert>
                    </Modal>
                )}
                {isProtested && (
                    <Modal
                        isOpen={true}
                        style={{
                            content: {
                                zIndex: 200,
                                width: "20em",
                                height: "20em",
                                top: "50%",
                                left: "50%",
                                right: "auto",
                                bottom: "auto",
                                marginRight: "-50%",
                                transform: "translate(-50%, -50%)",
                                textAlign: "center",
                            },
                        }}
                    >
                        <h1>
                            This record is already open in another tab or
                            window.
                        </h1>
                    </Modal>
                )}
                <Editable
                    save={
                        hasPermission(user, options.meta.dataMeta.name, "write")
                            ? {
                                  onClick: (template, parameters) =>
                                      props.dispatch({
                                          type: "SAVE",
                                          printTemplate: template,
                                          templateParameters: parameters || [],
                                      }),
                                  disabled:
                                      isBusy ||
                                      validation.length > 0 ||
                                      isLocked,
                                  active: props.state.state === "saving",
                                  completed: props.state.state === "saved",
                              }
                            : undefined
                    }
                    print={
                        hasPermission(user, options.meta.dataMeta.name, "write")
                            ? {
                                  onClick: (template, parameters) =>
                                      props.dispatch({
                                          type: "PRINT",
                                          printTemplate: template,
                                          templateParameters: parameters || [],
                                      }),
                                  disabled:
                                      isBusy ||
                                      (!isLocked && validation.length > 0),
                                  active: props.state.state === "printing",
                                  completed: props.state.state === "printed",
                              }
                            : undefined
                    }
                    delete={
                        hasPermission(
                            user,
                            options.meta.dataMeta.name,
                            "delete"
                        ) && props.state.currentRecordId !== "new"
                            ? {
                                  onClick: () => {
                                      if (
                                          confirm(
                                              "Are you sure you want to delete?"
                                          )
                                      ) {
                                          props.dispatch({
                                              type: "DELETE",
                                          });
                                      }
                                  },
                                  disabled: isBusy || isLocked,
                                  active: props.state.state === "deleting",
                                  completed: props.state.state === "deleted",
                              }
                            : undefined
                    }
                    duplicate={
                        hasPermission(user, options.meta.dataMeta.name, "new")
                            ? {
                                  onClick: () => {
                                      props.dispatch({ type: "DUPLICATE" });
                                  },
                                  disabled: isBusy || validation.length > 0,
                                  active: props.state.state === "duplicating",
                                  completed: props.state.state === "duplicated",
                              }
                            : undefined
                    }
                    substitute={
                        props.state.watching
                            ? {
                                  onClick: (key) => {
                                      props.dispatch({
                                          type: "SUBSTITUTE",
                                          key,
                                      });
                                  },
                                  disabled: false,
                                  active: false,
                                  completed: false,
                              }
                            : undefined
                    }
                >
                    <EditorsContext.Provider value={props.state.editors}>
                        <meta.component
                            data={props.state.currentRecord}
                            state={props.state.ui}
                            dispatch={subdispatch}
                            status={{
                                mutable: !isBusy && !isLocked,
                                validation,
                            }}
                        />
                    </EditorsContext.Provider>
                </Editable>
            </div>
        );
    }

    function reduce(
        state: State<StateType, DataType, ActionType>,
        action: Action<ActionType, DataType>,
        context: PageContext
    ): ReduceResult<
        State<StateType, DataType, ActionType>,
        Action<ActionType, DataType>
    > {
        let inner = baseReduce(state, action, context);

        if (inner.state.currentRecord && inner.state.ui) {
            const newData = updater(
                inner.state.currentRecord,
                inner.state.resolvedValues
            );

            const newRequests = [...inner.requests];
            let requests: Dictionary<WidgetRequest> = {};
            let values: Dictionary<any> = {};

            const innerReq = {
                ...(options.requests
                    ? options.requests(
                          inner.state.ui,
                          inner.state.currentRecord
                      )
                    : {}),
            };

            Object.entries(innerReq).forEach(([requestKey, requestValue]) => {
                if (
                    !isEqual(requestValue, inner.state.sentRequests[requestKey])
                ) {
                    newRequests.push({
                        type: requestValue.type,
                        request: requestValue.request,
                        decorator: (response: any) => ({
                            type: "RESOLVE_REQUEST",
                            key: requestKey,
                            request: requestValue,
                            response,
                        }),
                    });
                    values[requestKey] = null;
                } else {
                    values[requestKey] = inner.state.resolvedValues[requestKey];
                }

                requests[requestKey] = requestValue;
            });

            return {
                state: {
                    ...inner.state,
                    sentRequests: requests,
                    resolvedValues: values,
                    currentRecord: newData,
                },
                requests: newRequests,
            };
        } else {
            return inner;
        }
    }

    function beforeUnload(state: State<StateType, DataType, ActionType>) {
        return false;
    }

    function maybeAutosave(
        result: ReduceResult<
            State<StateType, DataType, ActionType>,
            Action<ActionType, DataType>
        >
    ): ReduceResult<
        State<StateType, DataType, ActionType>,
        Action<ActionType, DataType>
    > {
        if (
            options.autoSave &&
            result.state.state === "editing" &&
            !result.state.autosaving
        ) {
            const jsonRecord = options.meta.dataMeta.toJSON(
                result.state.currentRecord!
            );
            const patch = diff(result.state.baseRecord, jsonRecord);
            if (patch !== undefined) {
                return {
                    state: {
                        ...result.state,
                        autosaving: true,
                        baseRecord: jsonRecord,
                    },
                    requests: [
                        ...result.requests,
                        castRequest(
                            Request<
                                LocalPatchRequest,
                                Action<ActionType, DataType>
                            >(
                                "LOCAL_PATCH",
                                {
                                    tableName: table,
                                    form: name,
                                    id: jsonRecord.id,
                                    patches: [patch],
                                    patchIds: [genUUID()],
                                },
                                () => ({
                                    type: "AUTOSAVED",
                                })
                            )
                        ),
                    ],
                };
            }
        }
        return result;
    }

    function baseReduce(
        state: State<StateType, DataType, ActionType>,
        action: Action<ActionType, DataType>,
        context: PageContext
    ): ReduceResult<
        State<StateType, DataType, ActionType>,
        Action<ActionType, DataType>
    > {
        switch (action.type) {
            case "LOAD": {
                let record: DataType;
                if (action.record === null) {
                    record = options.meta.dataMeta.fromJSON(
                        options.meta.dataMeta.repair({
                            id: state.currentRecordId,
                            recordVersion: null,
                        } as any)
                    );
                } else {
                    record = action.record;
                }

                const inner = meta.initialize(
                    options.initialize
                        ? options.initialize(
                              record,
                              options.makeContext(context)
                          )
                        : record,
                    options.makeContext(context),
                    state.tail
                );
                return {
                    state: {
                        ...state,
                        baseRecord: action.base,
                        currentRecord: inner.data,
                        saved: null,
                        loaded: record,
                        state: "editing",
                        ui: inner.state,
                        lock: locked(record) ? "locked" : "nolock",
                    },

                    requests:
                        state.currentRecordId !== "new"
                            ? [
                                  castRequest(
                                      Request<
                                          EditingRecordRequest,
                                          Action<ActionType, DataType>
                                      >(
                                          "EDIT",
                                          {
                                              tableName: table,
                                              id: state.currentRecordId as string,
                                          },
                                          (response) => ({
                                              type: "EDITING_UPDATED",
                                              editors: response.editors,
                                          })
                                      )
                                  ),
                              ]
                            : [],
                };
            }
            case "UPDATE_PARAMETERS": {
                const recordKeyId = action.segments[0];
                let tail = action.segments.slice(1);
                if (
                    !recordKeyId.startsWith("new") &&
                    !uuidValidate(recordKeyId)
                ) {
                    throw new Error("invalid path");
                }

                return {
                    state: {
                        ...state,
                        currentRecordId: recordKeyId,
                        currentRecord: null,
                        state: "editing",
                        ui: null,
                        tail,
                        category: null,
                        parameters: action.parameters,
                        watching: action.parameters.watching !== undefined,
                    },
                    requests: [],
                };
            }
            case "RESOLVE_REQUEST": {
                if (
                    isEqual(action.request, state.sentRequests[action.key]) &&
                    state.ui &&
                    state.currentRecord
                ) {
                    const resolvedValues = {
                        ...state.resolvedValues,
                        [action.key]: action.response,
                    };

                    return {
                        state: {
                            ...state,
                            resolvedValues,
                        },
                        requests: [],
                    };
                } else {
                    return { state, requests: [] };
                }
            }
            case "PAGE_ACTIVATED": {
                return { state, requests: [] };
            }
            case "HEARTBEAT": {
                return {
                    state,
                    requests:
                        state.currentRecordId && state.currentRecordId !== "new"
                            ? [
                                  castRequest(
                                      Request<
                                          EditingRecordRequest,
                                          Action<ActionType, DataType>
                                      >(
                                          "EDIT",
                                          {
                                              tableName: table,
                                              id: state.currentRecordId,
                                          },
                                          (response) => ({
                                              type: "EDITING_UPDATED",
                                              editors: response.editors,
                                          })
                                      )
                                  ),
                              ]
                            : [],
                };
            }
            case "EDITING_UPDATED": {
                return {
                    state: {
                        ...state,
                        editors: action.editors.map((row) => ({
                            id: row.userId,
                            username: row.username,
                            timestamp: new Date(row.timestamp),
                        })),
                    },
                    requests: [],
                };
            }
            case "DUPLICATE":
                if (!state.currentRecord) {
                    throw new Error();
                }
                const newRecord = {
                    ...state.currentRecord,
                    id: newUUID(),
                };
                return {
                    state: {
                        ...state,
                        currentRecordId: "new",
                        currentRecord: newRecord,
                        state: "duplicating",
                    },
                    requests: [
                        castRequest(
                            Request<StoreRequest, Action<ActionType, DataType>>(
                                "STORE",
                                {
                                    tableName: table,
                                    form: name,
                                    record: options.meta.dataMeta.toJSON(
                                        newRecord
                                    ),
                                },
                                (response) => ({
                                    type: "DUPLICATED",
                                    response,
                                })
                            )
                        ),
                    ],
                };
            case "SAVE": {
                if (state.currentRecord === null) {
                    throw new Error("not expected");
                }
                const record = options.preSave
                    ? options.preSave(state.currentRecord)
                    : state.currentRecord;
                return {
                    state: {
                        ...state,
                        currentRecord: record,
                        state: "saving",
                        scheduledPrint: action.printTemplate
                            ? {
                                  template: action.printTemplate,
                                  parameters: action.templateParameters,
                              }
                            : null,
                    },
                    requests: [
                        castRequest(
                            Request<PatchRequest, Action<ActionType, DataType>>(
                                "PATCH",
                                {
                                    tableName: table,
                                    form: name,
                                    id: (record as any).id.uuid,
                                    patches: [
                                        diff(
                                            state.baseRecord,
                                            options.meta.dataMeta.toJSON(record)
                                        ),
                                    ],
                                    patchIds: [genUUID()],
                                    override: false,
                                },
                                (response) => ({
                                    type: "SAVED",
                                    response,
                                })
                            )
                        ),
                    ],
                };
            }
            case "PRINT": {
                const requests = [];
                if (options.print) {
                    options.print(
                        state.currentRecord!,
                        action.printTemplate,
                        [
                            state.currentRecordId as string,
                            ...action.templateParameters,
                        ],
                        false
                    );
                } else {
                    requests.push(
                        castRequest(
                            Request<PrintRequest, Action<ActionType, DataType>>(
                                "PRINT",
                                {
                                    template: action.printTemplate,
                                    id: state.currentRecordId as string,
                                    parameters: action.templateParameters,
                                },
                                () => {
                                    throw new Error();
                                }
                            )
                        ) as any
                    );
                }

                if (!options.disableFinish) {
                    requests.push(
                        castRequest(
                            Request<
                                FinishedRequest,
                                Action<ActionType, DataType>
                            >("FINISHED", state.currentRecordId, () => {
                                throw new Error();
                            })
                        )
                    );
                }

                return {
                    state,
                    requests,
                };
            }
            case "SUBSTITUTE": {
                if (options.disableFinish) {
                    throw new Error("Unworkable");
                }
                return {
                    state,
                    requests: [
                        castRequest(
                            Request<
                                FinishedRequest,
                                Action<ActionType, DataType>
                            >("FINISHED", action.key, () => {
                                throw new Error();
                            })
                        ),
                    ],
                };
            }
            case "AUTOSAVED": {
                return maybeAutosave({
                    state: {
                        ...state,
                        autosaving: false,
                    },
                    requests: [],
                });
            }
            case "SAVED":
            case "DUPLICATED": {
                const response = action.response;

                const record = options.meta.dataMeta.fromJSON(
                    response.record as any as JsonType
                );

                if (options.postSave) {
                    options.postSave(record);
                }

                const requests = [];

                if (state.scheduledPrint) {
                    if (options.print) {
                        options.print(
                            record,
                            state.scheduledPrint.template,
                            [
                                response.record.id,
                                ...state.scheduledPrint.parameters,
                            ],
                            false
                        );
                    } else {
                        requests.push(
                            castRequest(
                                Request<
                                    PrintRequest,
                                    Action<ActionType, DataType>
                                >(
                                    "PRINT",
                                    {
                                        template: state.scheduledPrint.template,
                                        id: response.record.id,
                                        parameters:
                                            state.scheduledPrint.parameters,
                                    },
                                    () => {
                                        throw new Error();
                                    }
                                )
                            ) as any
                        );
                    }
                }

                if (action.type === "SAVED" && !options.disableFinish) {
                    requests.push(
                        castRequest(
                            Request<
                                FinishedRequest,
                                Action<ActionType, DataType>
                            >("FINISHED", response.record.id, () => {
                                throw new Error();
                            })
                        )
                    );
                }

                return {
                    state: {
                        ...state,
                        state:
                            action.type === "DUPLICATED"
                                ? "duplicated"
                                : "saved",
                        currentRecordId: response.record.id,
                        currentRecord: record,
                        baseRecord: response.record,
                        saved: record,
                        loaded: record,
                    },
                    requests,
                };
            }
            case "DELETE": {
                if (state.currentRecord === null) {
                    throw new Error("not expected");
                }
                return {
                    state: {
                        ...state,
                        state: "deleting",
                    },
                    requests: [
                        castRequest(
                            Request<
                                DeleteRequest,
                                Action<ActionType, DataType>
                            >(
                                "DELETE",
                                {
                                    tableName: table,
                                    form: name,
                                    recordId: state.currentRecordId as string,
                                },
                                (response) => ({
                                    type: "DELETED",
                                    response,
                                })
                            )
                        ),
                    ],
                };
            }
            case "DELETED": {
                const response = action.response;

                const requests: RequestHandle<
                    PageRequest,
                    Action<ActionType, DataType>
                >[] = [];
                requests.push(
                    castRequest(
                        Request<FinishedRequest, Action<ActionType, DataType>>(
                            "FINISHED",
                            "",
                            () => {
                                throw new Error();
                            }
                        )
                    )
                );

                return {
                    state: {
                        ...state,
                        state: "deleted",
                    },
                    requests,
                };
            }
            case "TOGGLE_LOCK":
                return {
                    state: {
                        ...state,
                        lock: state.lock === "locked" ? "unlocked" : "locked",
                    },
                    requests: [],
                };
            case "UNDO": {
                const undos = state.undos.slice();
                const undo = undos.pop()!;
                const redos = state.redos.slice();
                redos.push({
                    data: state.currentRecord!,
                    state: state.ui!,
                });
                return {
                    state: {
                        ...state,
                        currentRecord: undo.data,
                        ui: undo.state,
                        undos,
                        redos,
                    },
                    requests: [],
                };
            }
            case "REDO": {
                const undos = state.undos.slice();
                const redos = state.redos.slice();
                const redo = redos.pop()!;
                undos.push({
                    data: state.currentRecord!,
                    state: state.ui!,
                });
                return {
                    state: {
                        ...state,
                        currentRecord: redo.data,
                        ui: redo.state,
                        undos,
                        redos,
                    },
                    requests: [],
                };
            }

            case "RECORD": {
                if (state.currentRecord == null) {
                    throw new Error("missing company");
                }
                if (state.ui == null) {
                    throw new Error("missing company");
                }
                const inner = meta.reduce(
                    state.ui,
                    state.currentRecord,
                    action.action,
                    options.makeContext(context)
                );
                const boring = isBoring(state.lastUndoAction, action.action);

                let undos = [];
                if (boring) {
                    undos = state.undos;
                } else {
                    undos = state.undos.slice(
                        state.undos.length > 1000 ? 1 : 0
                    );
                    undos.push({ data: state.currentRecord, state: state.ui });
                }
                const result: ReduceResult<
                    State<StateType, DataType, ActionType>,
                    Action<ActionType, DataType>
                > = {
                    state: {
                        ...state,
                        state: "editing" as const,
                        currentRecord: inner.data,
                        ui: inner.state,
                        undos,
                        redos: [],
                        lastUndoAction: boring
                            ? state.lastUndoAction
                            : action.action,
                    },
                    requests: [],
                };

                return maybeAutosave(result);
            }
        }
    }

    function encodeState(state: State<StateType, DataType, ActionType>): {
        segments: string[];
        parameters: Dictionary<string>;
    } {
        return state.currentRecordId === null
            ? {
                  segments: [],
                  parameters: {},
              }
            : {
                  segments: [
                      state.currentRecordId,
                      ...(meta.encodeState && state.ui
                          ? meta.encodeState(state.ui)
                          : []),
                  ],
                  parameters:
                      state.currentRecordId === "new" && state.category !== null
                          ? { category: state.category }
                          : {},
              };
    }

    return {
        initialize,
        component,
        reduce,
        encodeState,
        title(state, cache) {
            if (state.currentRecord) {
                return options.title(state.currentRecord, cache);
            } else {
                return "Loading...";
            }
        },
        hasUnsavedChanges(state) {
            return (
                !options.autoSave &&
                !isEqual(state.currentRecord, state.loaded) &&
                state.state !== "deleted"
            );
        },
        beforeUnload,
        headerComponent(props) {
            const user = useUser();
            const cache = useQuickCache();

            const onUndo = React.useCallback(
                () => props.dispatch({ type: "UNDO" }),
                [props.dispatch]
            );
            const onRedo = React.useCallback(
                () => props.dispatch({ type: "REDO" }),
                [props.dispatch]
            );

            let title = "Loading...";
            if (props.state.currentRecord) {
                title = options.title(props.state.currentRecord, cache);
            }

            let lock = <div />;
            if (props.state.lock != "nolock") {
                lock = (
                    <div
                        style={{ padding: "5px", display: "inline-block" }}
                        onClick={() => {
                            hasPermission(user, table, "unlock") &&
                                props.dispatch({
                                    type: "TOGGLE_LOCK",
                                });
                        }}
                    >
                        <FontAwesomeIcon
                            icon={
                                props.state.lock == "locked"
                                    ? faLock
                                    : faLockOpen
                            }
                        />
                    </div>
                );
            }
            return (
                <>
                    <Breadcrumb>
                        <Breadcrumb.Item active>
                            {lock}
                            {title}
                        </Breadcrumb.Item>
                    </Breadcrumb>
                    <div style={{ flexGrow: 1 }} />
                    <Button
                        disabled={props.state.undos.length == 0}
                        onClick={onUndo}
                    >
                        <FontAwesomeIcon icon={faUndo} />
                    </Button>
                    <Button
                        disabled={props.state.redos.length === 0}
                        onClick={onRedo}
                    >
                        <FontAwesomeIcon icon={faRedo} />
                    </Button>
                </>
            );
        },
    };
}
