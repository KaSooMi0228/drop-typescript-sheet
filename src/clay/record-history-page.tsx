import { faSearch, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dateFormat from "date-fns/format";
import dateParse from "date-fns/parseISO";
import { Cell, Column, Table } from "fixed-data-table-2";
import { formatters } from "jsondiffpatch";
import { sortBy } from "lodash";
import { plural } from "pluralize";
import { ParsedUrlQuery } from "querystring";
import * as React from "react";
import { Breadcrumb, Button, FormControl } from "react-bootstrap";
import DatePicker from "react-date-picker";
import Modal from "react-modal";
import { SizeMe, SizeMeProps } from "react-sizeme";
import { TABLES_META } from "../app/tables";
import { LocalDate } from "./LocalDate";
import { BaseAction, PageContext, PageRequest, ReduceResult } from "./Page";
import {
    castRequest,
    FetchHistoryRequest,
    QueryRequest,
    Request,
    RequestHandle,
    RevertRecordRequest,
} from "./requests";
import { HistoryResult, QueryTableResult } from "./server/api";
import { titleCase } from "./title-case";
import { FormWrapper } from "./widgets/FormField";

type State = {
    fromDate?: LocalDate;
    toDate?: LocalDate;
    user: string;
    table: string;
    id: string;
    changes: HistoryResult["changes"];
    key: string;
    users: { id: string; name: string }[];
};

type Action =
    | BaseAction
    | {
          type: "SET_FROM";
          value: LocalDate | undefined;
      }
    | {
          type: "SET_TO";
          value: LocalDate | undefined;
      }
    | {
          type: "LOAD_HISTORY";
          data: HistoryResult;
      }
    | {
          type: "LOAD_USERS";
          data: QueryTableResult;
      }
    | {
          type: "SET_TABLE";
          value: string;
      }
    | {
          type: "SET_KEY";
          value: string;
      }
    | {
          type: "SET_ID";
          value: string;
      }
    | {
          type: "SET_USER";
          value: string;
      }
    | {
          type: "SHOW_RECORD";
          table: string;
          id: string;
      }
    | {
          type: "REVERT_RECORD";
          table: string;
          id: string;
          recordVersion: number;
      }
    | {
          type: "REVERTED";
      };

function withRequest(
    state: State,
    users: boolean = false
): ReduceResult<State, Action> {
    const requests: RequestHandle<PageRequest, Action>[] = [
        castRequest(
            Request<FetchHistoryRequest, Action>(
                "FETCH_HISTORY",
                {
                    fromDate: state.fromDate
                        ? state.fromDate.toString()
                        : undefined,
                    toDate: state.toDate ? state.toDate.toString() : undefined,
                    tableName: state.table || undefined,
                    userKey: state.key || undefined,
                    userId: state.user || undefined,
                    id: state.id || undefined,
                },
                (data) => ({
                    type: "LOAD_HISTORY",
                    data,
                })
            )
        ),
    ];

    if (users) {
        requests.push(
            castRequest(
                Request<QueryRequest, Action>(
                    "QUERY",
                    {
                        tableName: "User",
                        columns: ["name", "id"],
                        sorts: ["name"],
                    },
                    (data) => ({
                        type: "LOAD_USERS",
                        data,
                    })
                )
            )
        );
    }

    return {
        state,
        requests,
    };
}

function initialize(
    segments: string[],
    parameters: ParsedUrlQuery,
    context: PageContext
): ReduceResult<State, Action> {
    return withRequest(
        {
            fromDate: undefined,
            toDate: undefined,
            table: "",
            key: "",
            id: "",
            user: "",
            changes: [],
            users: [],
        },
        true
    );
}

function reduce(
    state: State,
    action: Action,
    context: PageContext
): ReduceResult<State, Action> {
    switch (action.type) {
        case "PAGE_ACTIVATED":
        case "UPDATE_PARAMETERS":
        case "HEARTBEAT":
            return {
                state,
                requests: [],
            };
        case "SET_FROM":
            return withRequest({
                ...state,
                fromDate: action.value,
            });
        case "SET_TO":
            return withRequest({
                ...state,
                toDate: action.value,
            });
        case "SET_TABLE": {
            return withRequest({
                ...state,
                table: action.value,
            });
        }
        case "SET_KEY": {
            return withRequest({
                ...state,
                key: action.value,
            });
        }
        case "SET_ID": {
            return withRequest({
                ...state,
                id: action.value,
            });
        }
        case "SET_USER": {
            return withRequest({
                ...state,
                user: action.value,
            });
        }
        case "LOAD_HISTORY":
            return {
                state: {
                    ...state,
                    changes: action.data.changes,
                },
                requests: [],
            };
        case "LOAD_USERS":
            return {
                state: {
                    ...state,
                    users: action.data.rows.map((row) => ({
                        id: row[1] as string,
                        name: row[0] as string,
                    })),
                },
                requests: [],
            };
        case "SHOW_RECORD":
            return withRequest({
                ...state,
                fromDate: undefined,
                toDate: undefined,
                user: "",
                table: action.table,
                key: "",
                id: action.id,
            });
        case "REVERT_RECORD":
            return {
                state,
                requests: [
                    castRequest(
                        Request<RevertRecordRequest, Action>(
                            "REVERT",
                            {
                                tableName: action.table,
                                id: action.id,
                                recordVersion: action.recordVersion,
                            },
                            (data) => ({
                                type: "REVERTED",
                            })
                        )
                    ),
                ],
            };
        case "REVERTED":
            return withRequest(state);
    }
}

type Props = {
    state: State;
    dispatch: (action: Action) => void;
};

function component(props: Props) {
    const [currentDiff, setCurrentDiff] = React.useState<any>(undefined);

    return (
        <>
            <Modal
                isOpen={currentDiff !== undefined}
                onRequestClose={() => setCurrentDiff(undefined)}
            >
                <div
                    dangerouslySetInnerHTML={{
                        __html: formatters.html.format(currentDiff, {}),
                    }}
                />
            </Modal>
            <div
                style={{
                    display: "flex",
                    padding: "25px",
                }}
            >
                <FormWrapper label="From">
                    <div>
                        <DatePicker
                            value={
                                props.state.fromDate &&
                                props.state.fromDate.asDate()
                            }
                            onChange={(date: Date | Date[]) =>
                                props.dispatch({
                                    type: "SET_FROM",
                                    value: date && new LocalDate(date as Date),
                                })
                            }
                        />
                    </div>
                </FormWrapper>
                <div
                    style={{
                        width: "5px",
                    }}
                />

                <FormWrapper label="To">
                    <div>
                        <DatePicker
                            value={
                                props.state.toDate &&
                                props.state.toDate.asDate()
                            }
                            onChange={(date: Date | Date[]) =>
                                props.dispatch({
                                    type: "SET_TO",
                                    value: date && new LocalDate(date as Date),
                                })
                            }
                        />
                    </div>
                </FormWrapper>
                <div
                    style={{
                        width: "5px",
                    }}
                />
                <FormWrapper label="Table">
                    <div>
                        <select
                            value={props.state.table}
                            onChange={(event) =>
                                props.dispatch({
                                    type: "SET_TABLE",
                                    value: event.target.value,
                                })
                            }
                        >
                            <option value="">All</option>
                            {sortBy(Object.keys(TABLES_META)).map((key) => (
                                <option key={key} value={key}>
                                    {titleCase(plural(key))}
                                </option>
                            ))}
                        </select>
                    </div>
                </FormWrapper>
                <div
                    style={{
                        width: "5px",
                    }}
                />
                <FormWrapper label="Key">
                    <FormControl
                        type="text"
                        value={props.state.key}
                        onChange={(event: any) => {
                            props.dispatch({
                                type: "SET_KEY",
                                value: event.target.value,
                            });
                        }}
                    />
                </FormWrapper>
                <FormWrapper label="Id">
                    <FormControl
                        type="text"
                        value={props.state.id}
                        onChange={(event: any) => {
                            props.dispatch({
                                type: "SET_ID",
                                value: event.target.value,
                            });
                        }}
                    />
                </FormWrapper>
                <div
                    style={{
                        width: "5px",
                    }}
                />
                <FormWrapper label="User">
                    <div>
                        <select
                            value={props.state.user}
                            onChange={(event) =>
                                props.dispatch({
                                    type: "SET_USER",
                                    value: event.target.value,
                                })
                            }
                        >
                            <option value="">All</option>
                            {props.state.users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </FormWrapper>
            </div>
            <div style={{ flexGrow: 1 }} className="f-datagrid">
                <SizeMe monitorHeight={true}>
                    {({ size }: SizeMeProps) => (
                        <div style={{}}>
                            {" "}
                            <Table
                                width={size.width || 10}
                                height={size.height || 10}
                                rowsCount={props.state.changes.length}
                                rowHeight={40}
                                headerHeight={40}
                                isColumnResizing={false}
                                isColumnReordering={false}
                            >
                                <Column
                                    allowCellsRecycling={true}
                                    columnKey={"tableName"}
                                    isResizable={false}
                                    isReorderable={false}
                                    header={
                                        <Cell>
                                            <span>Table</span>
                                        </Cell>
                                    }
                                    cell={(cellProps) => (
                                        <Cell {...cellProps}>
                                            {titleCase(
                                                props.state.changes[
                                                    cellProps.rowIndex
                                                ].tableName
                                            )}
                                        </Cell>
                                    )}
                                    width={200}
                                />
                                <Column
                                    allowCellsRecycling={true}
                                    columnKey={"userKey"}
                                    isResizable={false}
                                    isReorderable={false}
                                    header={
                                        <Cell>
                                            <span>Key</span>
                                        </Cell>
                                    }
                                    cell={(cellProps) => (
                                        <Cell {...cellProps}>
                                            {
                                                props.state.changes[
                                                    cellProps.rowIndex
                                                ].userKey
                                            }
                                            <Button
                                                onClick={() =>
                                                    props.dispatch({
                                                        type: "SHOW_RECORD",
                                                        table: props.state
                                                            .changes[
                                                            cellProps.rowIndex
                                                        ].tableName,
                                                        id: props.state.changes[
                                                            cellProps.rowIndex
                                                        ].id,
                                                    })
                                                }
                                                size="sm"
                                                variant="outline-secondary"
                                                style={{
                                                    width: "20px",
                                                    height: "24px",
                                                    padding: "0px",
                                                }}
                                            >
                                                <FontAwesomeIcon
                                                    icon={faSearch}
                                                />
                                            </Button>
                                        </Cell>
                                    )}
                                    width={400}
                                />
                                <Column
                                    allowCellsRecycling={true}
                                    columnKey={"recordVersion"}
                                    isResizable={false}
                                    isReorderable={false}
                                    header={
                                        <Cell>
                                            <span>Version</span>
                                        </Cell>
                                    }
                                    cell={(cellProps) => (
                                        <Cell {...cellProps}>
                                            {
                                                props.state.changes[
                                                    cellProps.rowIndex
                                                ].recordVersion
                                            }
                                        </Cell>
                                    )}
                                    width={100}
                                />
                                <Column
                                    allowCellsRecycling={true}
                                    columnKey={"userName"}
                                    isResizable={false}
                                    isReorderable={false}
                                    header={
                                        <Cell>
                                            <span>User</span>
                                        </Cell>
                                    }
                                    cell={(cellProps) => (
                                        <Cell {...cellProps}>
                                            {
                                                props.state.changes[
                                                    cellProps.rowIndex
                                                ].userName
                                            }
                                        </Cell>
                                    )}
                                    width={200}
                                />
                                <Column
                                    allowCellsRecycling={true}
                                    columnKey={"form"}
                                    isResizable={false}
                                    isReorderable={false}
                                    header={
                                        <Cell>
                                            <span>Form</span>
                                        </Cell>
                                    }
                                    cell={(cellProps) => (
                                        <Cell {...cellProps}>
                                            {
                                                props.state.changes[
                                                    cellProps.rowIndex
                                                ].form
                                            }
                                            {props.state.changes[
                                                cellProps.rowIndex
                                            ].deleted && (
                                                <FontAwesomeIcon
                                                    icon={faTrashAlt}
                                                />
                                            )}
                                        </Cell>
                                    )}
                                    width={200}
                                />

                                <Column
                                    allowCellsRecycling={true}
                                    columnKey={"date"}
                                    isResizable={false}
                                    isReorderable={false}
                                    header={
                                        <Cell>
                                            <span>Date</span>
                                        </Cell>
                                    }
                                    cell={(cellProps) => (
                                        <Cell {...cellProps}>
                                            {dateFormat(
                                                dateParse(
                                                    props.state.changes[
                                                        cellProps.rowIndex
                                                    ].changedTime
                                                ),
                                                "yyyy-MM-dd HH:mm"
                                            )}
                                        </Cell>
                                    )}
                                    width={200}
                                />

                                <Column
                                    allowCellsRecycling={true}
                                    columnKey={"revert"}
                                    isResizable={false}
                                    isReorderable={false}
                                    header={<Cell />}
                                    cell={(cellProps) => (
                                        <Cell {...cellProps}>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                style={{
                                                    width: "80px",
                                                    height: "24px",
                                                    padding: "0px",
                                                }}
                                                onClick={() => {
                                                    if (
                                                        window.confirm(
                                                            "Are you sure that you want to revert this record?"
                                                        )
                                                    ) {
                                                        props.dispatch({
                                                            type: "REVERT_RECORD",
                                                            table: props.state
                                                                .changes[
                                                                cellProps
                                                                    .rowIndex
                                                            ].tableName,
                                                            id: props.state
                                                                .changes[
                                                                cellProps
                                                                    .rowIndex
                                                            ].id,
                                                            recordVersion:
                                                                props.state
                                                                    .changes[
                                                                    cellProps
                                                                        .rowIndex
                                                                ].recordVersion,
                                                        });
                                                    }
                                                }}
                                            >
                                                Revert
                                            </Button>

                                            <Button
                                                size="sm"
                                                style={{
                                                    width: "80px",
                                                    height: "24px",
                                                    padding: "0px",
                                                }}
                                                onClick={() => {
                                                    setCurrentDiff(
                                                        props.state.changes[
                                                            cellProps.rowIndex
                                                        ].diff
                                                    );
                                                }}
                                            >
                                                Changes
                                            </Button>
                                        </Cell>
                                    )}
                                    width={200}
                                />
                                <Column
                                    allowCellsRecycling={true}
                                    columnKey={"id"}
                                    isResizable={false}
                                    isReorderable={false}
                                    header={<Cell />}
                                    cell={(cellProps) => (
                                        <Cell {...cellProps}>
                                            {
                                                props.state.changes[
                                                    cellProps.rowIndex
                                                ].id
                                            }
                                        </Cell>
                                    )}
                                    width={200}
                                />
                            </Table>
                        </div>
                    )}
                </SizeMe>
            </div>
        </>
    );
}

function encodeState(state: State) {
    return {
        segments: [],
        parameters: {},
    };
}

export const RecordHistoryPage = {
    initialize,
    reduce,
    component,
    encodeState,
    hasUnsavedChanges(state: State) {
        return false;
    },
    headerComponent() {
        return (
            <>
                <Breadcrumb>
                    <Breadcrumb.Item href="#/">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item href="#/admin/">Settings</Breadcrumb.Item>
                    <Breadcrumb.Item href="#/general/">General</Breadcrumb.Item>
                    <Breadcrumb.Item active>Record History</Breadcrumb.Item>
                </Breadcrumb>
                <div style={{ flexGrow: 1 }} />
            </>
        );
    },
    title() {
        return "Record History";
    },
    beforeUnload() {
        return false;
    },
};
