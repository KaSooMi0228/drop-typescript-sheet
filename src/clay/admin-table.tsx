import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isEqual, keyBy, zip } from "lodash";
import { plural } from "pluralize";
import { ParsedUrlQuery } from "querystring";
import * as React from "react";
import { Breadcrumb, Button, Table } from "react-bootstrap";
import RelativePortal from "react-relative-portal";
import { useUser } from "../app/state";
import { CONTENT_AREA } from "../app/styles";
import { hasPermission } from "../permissions";
import { Dictionary } from "./common";
import { Editable } from "./edit-context";
import { BaseAction, PageContext, PageRequest, ReduceResult } from "./Page";
import {
    castRequest,
    DeleteRequest,
    RecordsRequest,
    Request,
    RequestHandle,
    StoreRequest,
} from "./requests";
import { SaveButton } from "./save-button";
import {
    DeleteRecordResult,
    ReadRecordsResult,
    StoreRecordResult,
} from "./server/api";
import { titleCase } from "./title-case";
import { UUID } from "./uuid";
import { RecordWidget, Widget, WidgetAction, WidgetState } from "./widgets";
import { ListWidget } from "./widgets/ListWidget";

type ColumnDetail = {
    id: string;
    label: string;
    width?: number;
};

type AdminTableOptions<StateType, DataType, JsonType> = {
    rowWidget: RecordWidget<StateType, DataType, any, any, any>;
    columns: ColumnDetail[];
    compare: (lhs: DataType, rhs: DataType) => number;
    extraRequests?: Dictionary<{
        type: string;
        request: PageRequest["request"];
    }>;
    wrapper?: React.SFC<{ requests: Dictionary<any> }>;
    adminCategory?: string;
    title?: string;
};

function assertNotNull<T>(value: T | null): T {
    if (value == null) {
        throw new Error("null not expected");
    }
    return value;
}

export function AdminTablePage<
    StateType,
    DataType extends { id: UUID },
    JsonType
>(options: AdminTableOptions<StateType, DataType, JsonType>) {
    const RowsWidget = ListWidget(options.rowWidget);

    const tableName = options.rowWidget.dataMeta.name;
    const title =
        options.title || plural(titleCase(options.rowWidget.dataMeta.name));

    type State = {
        originals: Dictionary<DataType> | null;
        records: DataType[] | null;
        ui_state: WidgetState<typeof RowsWidget> | null;
        pendingSaves: number | null;
        extra_requests: Dictionary<any>;
    };

    type Action =
        | BaseAction
        | {
              type: "LOAD_RECORDS";
              records: ReadRecordsResult;
          }
        | {
              type: "SAVE";
          }
        | {
              type: "RECORD_SAVED";
              response: StoreRecordResult;
          }
        | {
              type: "RECORD_DELETED";
              response: DeleteRecordResult;
          }
        | {
              type: "DATA";
              action: WidgetAction<any>;
          }
        | {
              type: "LOAD_EXTRA_REQUEST";
              key: string;
              response: any;
          };

    function initialize(
        segments: string[],
        parameters: ParsedUrlQuery,
        context: PageContext
    ): ReduceResult<State, Action> {
        return {
            state: {
                originals: null,
                records: null,
                ui_state: null,
                pendingSaves: null,
                extra_requests: {},
            },
            requests: [
                castRequest(
                    Request<RecordsRequest, Action>(
                        "RECORDS",
                        {
                            tableName: tableName,
                        },
                        (records) => ({
                            type: "LOAD_RECORDS",
                            records,
                        })
                    )
                ),
                ...Object.entries(options.extraRequests || {}).map(
                    ([key, request]) =>
                        Request<any, Action>(
                            request.type,
                            request.request,
                            (response) => ({
                                type: "LOAD_EXTRA_REQUEST",
                                key,
                                response,
                            })
                        )
                ),
            ],
        };
    }

    function reduce(
        state: State,
        action: Action,
        context: PageContext
    ): ReduceResult<State, Action> {
        switch (action.type) {
            case "LOAD_RECORDS": {
                const parsed = action.records.records.map((record) =>
                    options.rowWidget.dataMeta.fromJSON(record as any)
                );
                parsed.sort((a, b) =>
                    a.active === b.active
                        ? options.compare(a, b)
                        : a.active < b.active
                        ? 1
                        : -1
                );

                const inner = RowsWidget.initialize(parsed, context);

                return {
                    state: {
                        ...state,
                        originals: keyBy(
                            inner.data,
                            (record) => record.id.uuid
                        ),
                        records: inner.data,
                        ui_state: inner.state,
                    },
                    requests: [],
                };
            }
            case "DATA": {
                if (!state.records || !state.ui_state) {
                    throw new Error("unexpected");
                }

                const inner = RowsWidget.reduce(
                    state.ui_state,
                    state.records,
                    action.action as any,
                    context
                );

                return {
                    state: {
                        ...state,
                        records: inner.data,
                        ui_state: inner.state,
                    },
                    requests: [],
                };
            }
            case "SAVE": {
                const requests: RequestHandle<PageRequest, Action>[] = [];
                if (state.records && state.originals) {
                    const deadRecords: Dictionary<boolean> = {};
                    for (const id of Object.keys(state.originals)) {
                        deadRecords[id] = true;
                    }
                    for (const record of state.records) {
                        delete deadRecords[record.id.uuid];

                        if (!isEqual(record, state.originals[record.id.uuid])) {
                            requests.push(
                                castRequest(
                                    Request<StoreRequest, Action>(
                                        "STORE",
                                        {
                                            tableName: tableName,
                                            form: titleCase(tableName),
                                            record: options.rowWidget.dataMeta.toJSON(
                                                record
                                            ) as any,
                                        },
                                        (response) => ({
                                            type: "RECORD_SAVED" as "RECORD_SAVED",
                                            response,
                                        })
                                    )
                                )
                            );
                        }
                    }

                    for (const recordId of Object.keys(deadRecords)) {
                        requests.push(
                            castRequest(
                                Request<DeleteRequest, Action>(
                                    "DELETE",
                                    {
                                        tableName: tableName,
                                        form: titleCase(tableName),
                                        recordId,
                                    },
                                    (response) => ({
                                        type: "RECORD_DELETED",
                                        response,
                                    })
                                )
                            )
                        );
                    }
                }

                return {
                    state: {
                        ...state,
                        pendingSaves: requests.length,
                    },
                    requests,
                };
            }
            case "RECORD_SAVED": {
                if (!state.records || !state.originals || !state.pendingSaves) {
                    throw new Error("unreachable");
                }

                const records = state.records.slice();
                const parsed = options.rowWidget.dataMeta.fromJSON(
                    action.response.record as any
                );
                return {
                    state: {
                        ...state,
                        originals: {
                            ...state.originals,
                            [action.response.record.id]: parsed,
                        },
                        records: records.map((record) =>
                            record.id === parsed.id ? parsed : record
                        ),
                        pendingSaves: state.pendingSaves - 1,
                    },
                    requests: [],
                };
            }
            case "RECORD_DELETED": {
                if (!state.records || !state.originals || !state.pendingSaves) {
                    throw new Error("unreachable");
                }

                const originals = { ...state.originals };
                delete originals[action.response.recordId];
                return {
                    state: {
                        ...state,
                        originals,
                        pendingSaves: state.pendingSaves - 1,
                    },
                    requests: [],
                };
            }
            case "LOAD_EXTRA_REQUEST":
                return {
                    state: {
                        ...state,
                        extra_requests: {
                            ...state.extra_requests,
                            [action.key]: action.response,
                        },
                    },
                    requests: [],
                };

            case "PAGE_ACTIVATED":
            case "UPDATE_PARAMETERS":
            case "HEARTBEAT":
                return {
                    state,
                    requests: [],
                };
        }
    }

    type Props = {
        state: State;
        dispatch: (action: Action) => void;
    };

    function CellComponent(props: {
        column: ColumnDetail;
        record: DataType;
        state: StateType;
        index: number;
        ui_state: State["ui_state"];
        dispatch: (action: Action) => void;
    }) {
        const Component = options.rowWidget.fieldWidgets[props.column.id];
        const dispatch = React.useCallback(
            (action: any) =>
                props.dispatch(
                    props.record === props.ui_state!.empty
                        ? {
                              type: "DATA",
                              action: {
                                  type: "NEW",
                                  actions: [action],
                              },
                          }
                        : {
                              type: "DATA",
                              action: {
                                  type: "ITEM",
                                  index: props.index,
                                  action,
                              },
                          }
                ),
            [props.dispatch, props.index, props.ui_state!.empty == props.record]
        );
        return (
            <td>
                <options.rowWidget.reactContext.Provider
                    value={{
                        state: props.state,
                        data: props.record,
                        status: {
                            mutable: true,
                            validation: [],
                        },
                        dispatch,
                    }}
                >
                    <Component />
                </options.rowWidget.reactContext.Provider>
            </td>
        );
    }

    function component(props: Props) {
        const user = useUser();

        const records = props.state.records;
        const ui_state = props.state.ui_state;
        if (records === null) {
            return <div />;
        }
        if (ui_state === null) {
            return <div />;
        }

        const items: [DataType, StateType][] = [
            ...zip(records, ui_state.items),
            [ui_state.empty, ui_state.emptyState],
        ] as any;

        return (
            <div {...CONTENT_AREA} className="sticky-headers">
                <Table>
                    <thead>
                        <tr>
                            {options.columns.map((column, index) => (
                                <th key={index}>{column.label}</th>
                            ))}
                            <th>
                                <Editable
                                    save={{
                                        disabled: !!props.state.pendingSaves,
                                        onClick: () =>
                                            props.dispatch({
                                                type: "SAVE",
                                            }),
                                        active: !!props.state.pendingSaves,
                                        completed:
                                            props.state.pendingSaves === 0,
                                    }}
                                >
                                    <SaveButton />
                                </Editable>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(([record, state], index) => (
                            <tr
                                key={record.id.uuid}
                                style={{
                                    backgroundColor:
                                        (record as any).active === false
                                            ? "#bbb"
                                            : undefined,
                                }}
                            >
                                {options.columns.map((column, columnIndex) => (
                                    <CellComponent
                                        ui_state={props.state.ui_state}
                                        key={columnIndex}
                                        column={column}
                                        record={record}
                                        state={state}
                                        dispatch={props.dispatch}
                                        index={index}
                                    />
                                ))}

                                <td
                                    key={
                                        assertNotNull(props.state.ui_state)
                                            .empty.id.uuid
                                    }
                                >
                                    {hasPermission(user, tableName, "delete") &&
                                        record != ui_state.empty && (
                                            <Button
                                                variant="danger"
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            "Are you sure you want to delete?"
                                                        )
                                                    ) {
                                                        props.dispatch({
                                                            type: "DATA",
                                                            action: {
                                                                type: "REMOVE",
                                                                index,
                                                            },
                                                        });
                                                    }
                                                }}
                                            >
                                                <FontAwesomeIcon
                                                    icon={faTrashAlt}
                                                />{" "}
                                                Remove
                                            </Button>
                                        )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        );
    }

    function outerComponent(props: Props) {
        const inner = component(props);
        if (options.wrapper) {
            return (
                <options.wrapper requests={props.state.extra_requests}>
                    {inner}
                </options.wrapper>
            );
        } else {
            return inner;
        }
    }

    function encodeState(state: State) {
        return {
            segments: [],
            parameters: {},
        };
    }

    return {
        initialize,
        reduce,
        component: outerComponent,
        encodeState,
        hasUnsavedChanges(state: State) {
            if (state.pendingSaves) {
                return true;
            }

            if (state.records && state.originals) {
                const deadRecords: Dictionary<boolean> = {};
                for (const id of Object.keys(state.originals)) {
                    deadRecords[id] = true;
                }
                for (const record of state.records) {
                    delete deadRecords[record.id.uuid];

                    if (!isEqual(record, state.originals[record.id.uuid])) {
                        return true;
                    }
                }

                for (const recordId of Object.keys(deadRecords)) {
                    return true;
                }
            }

            return false;
        },
        headerComponent() {
            return (
                <>
                    <Breadcrumb>
                        <Breadcrumb.Item href="#/">Dashboard</Breadcrumb.Item>
                        <Breadcrumb.Item href="#/admin/">
                            Settings
                        </Breadcrumb.Item>
                        {options.adminCategory && (
                            <Breadcrumb.Item
                                href={"#/admin/" + options.adminCategory + "/"}
                            >
                                {titleCase(options.adminCategory)}
                            </Breadcrumb.Item>
                        )}
                        <Breadcrumb.Item active>{title}</Breadcrumb.Item>
                    </Breadcrumb>
                    <div style={{ flexGrow: 1 }} />
                </>
            );
        },
        title() {
            return title;
        },
        beforeUnload() {
            return false;
        },
    };
}

export function PortalCell<
    StateType,
    ContextType,
    DataType,
    ActionType,
    ExtraPropsType
>(
    widget: Widget<StateType, DataType, ContextType, ActionType, ExtraPropsType>
): Widget<StateType, DataType, ContextType, ActionType, ExtraPropsType> {
    return {
        ...widget,
        component: (props) => {
            return (
                <RelativePortal>
                    <widget.component {...props} />
                </RelativePortal>
            );
        },
    };
}
