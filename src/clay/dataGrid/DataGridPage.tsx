import {
    faBars,
    faCogs,
    faColumns,
    faFileExcel,
    faSave,
    faTrash,
    faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { css } from "glamor";
import { find, fromPairs, omit, some } from "lodash";
import { plural } from "pluralize";
import { ParsedUrlQuery } from "querystring";
import * as React from "react";
import {
    Breadcrumb,
    Button,
    Dropdown,
    FormControl,
    ListGroup,
    ListGroupItem,
    Modal,
} from "react-bootstrap";
import { useUser } from "../../app/state";
import { JSONToView, View, ViewJSON } from "../../app/views/table";
import { hasPermission } from "../../permissions";
import { Dictionary } from "../common";
import {
    Filter,
    FilterJSON,
    FilterToJSON,
    JSONToFilter,
} from "../filters/table";
import {
    BaseAction,
    Page,
    PageContext,
    PageRequest,
    ReduceResult,
} from "../Page";
import {
    castRequest,
    DeleteRequest,
    QueryRequest,
    Request,
    RequestHandle,
    StoreRequest,
} from "../requests";
import { QueryTableResult } from "../server/api";
import { titleCase } from "../title-case";
import { genUUID } from "../uuid";
import { FormWrapper } from "../widgets/FormField";
import DataGrid, {
    DataGridAction,
    dataGridInitialize,
    dataGridReducer,
    DataGridState,
    GridOptions,
} from "./DataGrid";

interface Props {
    dispatch: (action: DataGridAction) => void;
    state: DataGridState;
}

const LABEL_STYLE = css({
    paddingLeft: "5px",
    paddingRight: "5px",
});

type ManagingFilterState = {
    names: Dictionary<string>;
    default: string | null;
    deleted: string[];
};

type DataGridPageState = {
    gridState: DataGridState | null;
    viewId: string | null;
    filterId: string | null;
    views: View[] | null;
    filters: Filter[] | null;
    parameters: ParsedUrlQuery | null;
    savingFilter: boolean;
    savingFilterName: string;
    managingFilters: ManagingFilterState | null;
};

type DataGridPageAction =
    | BaseAction
    | {
          type: "GRID";
          action: DataGridAction;
      }
    | {
          type: "LOAD_VIEWS";
          response: QueryTableResult;
      }
    | {
          type: "LOAD_FILTERS";
          response: QueryTableResult;
      }
    | {
          type: "SELECT_VIEW";
          view: string;
      }
    | {
          type: "SELECT_FILTER";
          filter: string;
      }
    | {
          type: "SAVE_FILTER";
      }
    | {
          type: "DELETE_FILTER";
      }
    | {
          type: "SAVE_FILTER_NAME";
          value: string;
      }
    | {
          type: "SAVE_FILTER_SAVE";
      }
    | {
          type: "SAVE_FILTER_CANCEL";
      }
    | {
          type: "SAVED_FILTER";
          record: FilterJSON;
      }
    | {
          type: "DELETED_FILTER";
          filter: string;
      }
    | {
          type: "MANAGE_FILTERS";
      }
    | {
          type: "HIDE_MANAGE_FILTERS";
      }
    | {
          type: "SAVE_MANAGE_FILTERS";
      }
    | {
          type: "MANAGE_FILTER_DELETE";
          filter: string;
      }
    | {
          type: "MANAGE_FILTER_RENAME";
          filter: string;
          name: string;
      }
    | {
          type: "MANAGE_FILTER_SET_DEFAULT";
          filter: string | null;
      };

const SAVE_FILTER_STYLE = css({
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: "-50px",
    marginTop: "-50px",
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
});

const MANAGE_FILTER_STYLE = css({
    position: "absolute",
    left: "50%",
    top: "50%",
    backgroundColor: "white",
    borderRadius: "10px",
});

export default function DataGridPage(
    options: GridOptions & {
        pageTitle?: string;
    }
): Page<DataGridPageState, DataGridPageAction> {
    function initialize(
        segments: string[],
        parameters: ParsedUrlQuery,
        context: PageContext
    ): ReduceResult<DataGridPageState, DataGridPageAction> {
        return {
            state: {
                gridState: null,
                viewId: segments[0] || null,
                filterId: (parameters.filter as string) || null,
                views: null,
                filters: null,
                parameters: parameters,
                savingFilter: false,
                savingFilterName: "",
                managingFilters: null,
            },
            requests: [
                castRequest(
                    Request<QueryRequest, DataGridPageAction>(
                        "QUERY",
                        {
                            tableName: "View",
                            columns: ["."],
                            filters: [
                                {
                                    column: "table",
                                    filter: {
                                        equal: options.table,
                                    },
                                },
                            ],
                            sorts: ["name"],
                        },
                        (response) => ({
                            type: "LOAD_VIEWS",
                            response,
                        })
                    )
                ),
                castRequest(
                    Request<QueryRequest, DataGridPageAction>(
                        "QUERY",
                        {
                            tableName: "Filter",
                            columns: ["."],
                            filters: [
                                {
                                    column: "table",
                                    filter: {
                                        equal: options.table,
                                    },
                                },
                                {
                                    column: "user",
                                    filter: {
                                        equal: context.currentUserId,
                                    },
                                },
                            ],
                            sorts: ["name"],
                        },
                        (response) => ({
                            type: "LOAD_FILTERS",
                            response,
                        })
                    )
                ),
            ],
        };
    }

    function innerReduce(
        state: DataGridPageState,
        inner: ReduceResult<DataGridState, DataGridAction>
    ): ReduceResult<DataGridPageState, DataGridPageAction> {
        return {
            state: {
                ...state,
                gridState: inner.state,
            },
            requests: inner.requests.map((request) => ({
                type: request.type,
                request: request.request,
                decorator: (result: any) => ({
                    type: "GRID" as "GRID",
                    action: request.decorator(result),
                }),
            })),
        };
    }

    function selectView(context: PageContext, state: DataGridPageState) {
        let viewId = state.viewId;

        if (viewId === null) {
            viewId =
                localStorage.getItem(
                    `dropsheet-view-selected-${options.table}`
                ) || null;
        }

        if (viewId === null) {
            const defaultView = find(state.views, (view) => view.default);
            if (defaultView) {
                viewId = defaultView.id.uuid;
            }
        }

        if (viewId === null && state.views) {
            viewId = state.views[0].id.uuid;
        }

        let view = find(state.views, (view) => view.id.uuid === viewId);
        if (!view) {
            if (state.views) {
                viewId = state.views[0].id.uuid;
                view = state.views[0];
            } else {
                throw new Error("view not found");
            }
        }
        const previous = JSON.parse(
            localStorage.getItem(`dropsheet-view-${viewId}`) || "{}"
        );
        previous.filters = {};

        let filterId = state.filterId;

        if (filterId === null) {
            const defaultFilter = find(
                state.filters,
                (filter) => filter.view === viewId && filter.default
            );
            if (defaultFilter) {
                filterId = defaultFilter.id.uuid;
            }
        }

        if (filterId === null) {
            for (const column of view.columns) {
                previous.filters[column.column] = column.filter;
            }
        } else {
            const filter = find(
                state.filters,
                (filter) => filter.id.uuid === filterId
            );
            if (filter) {
                for (const column of filter.columns) {
                    previous.filters[column.column] = column.filter;
                }
            }
        }

        previous.sort = view.defaultSortColumn;
        previous.reversed = view.defaultSortDirection;

        if (state.parameters) {
            for (const [key, value] of Object.entries(state.parameters)) {
                switch (key) {
                    case "sort":
                        previous.sort = value;
                        break;
                    case "sort_reversed":
                        previous.reversed = value;
                        break;
                    case "filter":
                        break;
                    default:
                        previous.filters[key] = value;
                        break;
                }
            }
        }
        const inner = dataGridInitialize(options, context.user, view, previous);
        return innerReduce(
            {
                ...state,
                viewId,
                filterId,
            },
            inner
        );
    }

    function baseReduce(
        state: DataGridPageState,
        action: DataGridPageAction,
        context: PageContext
    ): ReduceResult<DataGridPageState, DataGridPageAction> {
        switch (action.type) {
            case "GRID": {
                if (state.gridState !== null) {
                    const inner = dataGridReducer(
                        options,
                        state.gridState,
                        action.action,
                        context
                    );

                    const stored = {
                        widths: inner.state.widths,
                    };
                    localStorage.setItem(
                        `dropsheet-view-${state.viewId}`,
                        JSON.stringify(stored)
                    );

                    return innerReduce(state, inner);
                } else {
                    return { state, requests: [] };
                }
            }
            case "SELECT_VIEW":
                localStorage.setItem(
                    `dropsheet-view-selected-${options.table}`,
                    action.view
                );
                return {
                    state: {
                        ...state,
                        viewId: action.view,
                        filterId: null,
                        gridState: null,
                        parameters: null,
                    },
                    requests: [],
                };
            case "SELECT_FILTER":
                return {
                    state: {
                        ...state,
                        filterId:
                            action.filter === "default" ? null : action.filter,
                        gridState: null,
                        parameters: null,
                    },
                    requests: [],
                };
            case "LOAD_FILTERS": {
                const filters = action.response.rows.map((row) =>
                    JSONToFilter(row[0] as FilterJSON)
                );
                return {
                    state: {
                        ...state,
                        filters,
                    },
                    requests: [],
                };
            }
            case "LOAD_VIEWS":
                const views = action.response.rows.map((row) =>
                    JSONToView(row[0] as ViewJSON)
                );
                return {
                    state: {
                        ...state,
                        views,
                    },
                    requests: [],
                };
            case "UPDATE_PARAMETERS":
                return initialize(action.segments, action.parameters, context);
            case "HEARTBEAT":
                return { state, requests: [] };
            case "PAGE_ACTIVATED":
                if (state.gridState) {
                    return innerReduce(
                        state,
                        dataGridReducer(
                            options,
                            state.gridState,
                            {
                                type: "REFRESH",
                            },
                            context
                        )
                    );
                } else {
                    return { state, requests: [] };
                }
            case "DELETE_FILTER": {
                return {
                    state: {
                        ...state,
                        filters:
                            state.filters &&
                            state.filters.filter(
                                (filter) => filter.id.uuid !== state.filterId
                            ),
                        filterId: null,
                    },
                    requests: [
                        castRequest(
                            Request<DeleteRequest, DataGridPageAction>(
                                "DELETE" as "DELETE",
                                {
                                    tableName: "Filter",
                                    form: options.table,
                                    recordId: state.filterId as string,
                                },
                                (response) => ({
                                    type: "DELETE_FILTER",
                                    filter: state.filterId as string,
                                })
                            )
                        ),
                    ],
                };
            }
            case "SAVE_FILTER":
                return {
                    state: {
                        ...state,
                        savingFilter: true,
                        savingFilterName: "",
                    },
                    requests: [],
                };
            case "SAVE_FILTER_NAME":
                return {
                    state: {
                        ...state,
                        savingFilterName: action.value,
                    },
                    requests: [],
                };
            case "SAVED_FILTER":
                if (!state.filters) {
                    throw new Error("Explode");
                }
                const filters = state.filters.filter(
                    (filter) => filter.id.uuid !== action.record.id
                );
                filters.push(JSONToFilter(action.record));
                filters.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));
                return {
                    state: {
                        ...state,
                        filters,
                    },
                    requests: [],
                };

            case "DELETED_FILTER":
                return {
                    state: {
                        ...state,
                        filters:
                            state.filters &&
                            state.filters.filter(
                                (filter) => filter.id.uuid !== action.filter
                            ),
                    },
                    requests: [],
                };

            case "SAVE_FILTER_CANCEL":
                return {
                    state: {
                        ...state,
                        savingFilter: false,
                    },
                    requests: [],
                };

            case "SAVE_FILTER_SAVE": {
                const filterId = genUUID();
                if (!state.gridState) {
                    throw new Error("invalid");
                }
                const filter: FilterJSON = {
                    id: filterId,
                    recordVersion: null,
                    view: state.viewId,
                    default: false,
                    name: state.savingFilterName,
                    user: context.currentUserId,
                    table: options.table,
                    columns: Object.entries(state.gridState.filters).map(
                        (entry) => ({
                            column: entry[0],
                            filter: entry[1],
                        })
                    ),
                };

                return {
                    state: {
                        ...state,
                        savingFilter: false,
                        filterId,
                        filters: [
                            ...(state.filters || []),
                            JSONToFilter(filter),
                        ],
                    },
                    requests: [
                        castRequest(
                            Request<StoreRequest, DataGridPageAction>(
                                "STORE" as "STORE",
                                {
                                    tableName: "Filter",
                                    form: options.table,
                                    record: filter,
                                },
                                (response) => ({
                                    type: "SAVED_FILTER",
                                    record: response.record as FilterJSON,
                                })
                            )
                        ),
                    ],
                };
            }
            case "MANAGE_FILTERS": {
                const defaultFilter =
                    find(
                        state.filters || [],
                        (filter) =>
                            filter.view === state.viewId && filter.default
                    ) || null;
                return {
                    state: {
                        ...state,
                        managingFilters: {
                            names: fromPairs(
                                (state.filters || [])
                                    .filter(
                                        (filter) => filter.view === state.viewId
                                    )
                                    .map((filter) => [
                                        filter.id.uuid,
                                        filter.name,
                                    ])
                            ),
                            deleted: [],
                            default: defaultFilter
                                ? defaultFilter.id.uuid
                                : null,
                        },
                    },
                    requests: [],
                };
            }
            case "HIDE_MANAGE_FILTERS": {
                return {
                    state: {
                        ...state,
                        managingFilters: null,
                    },
                    requests: [],
                };
            }
            case "SAVE_MANAGE_FILTERS": {
                const requests: RequestHandle<
                    PageRequest,
                    DataGridPageAction
                >[] = [];
                if (state.managingFilters && state.filters) {
                    for (const filter of state.managingFilters.deleted) {
                        requests.push(
                            castRequest(
                                Request<DeleteRequest, DataGridPageAction>(
                                    "DELETE" as "DELETE",
                                    {
                                        tableName: "Filter",
                                        form: options.table,
                                        recordId: filter,
                                    },
                                    (response) => ({
                                        type: "DELETED_FILTER",
                                        filter,
                                    })
                                )
                            )
                        );
                    }
                    for (const filter of state.filters) {
                        if (filter.view === state.viewId) {
                            const name =
                                state.managingFilters.names[filter.id.uuid];
                            if (name === undefined) {
                                continue;
                            }
                            const defaultFilter =
                                state.managingFilters.default ===
                                filter.id.uuid;
                            if (
                                name !== filter.name ||
                                defaultFilter !== filter.default
                            ) {
                                requests.push(
                                    castRequest(
                                        Request<
                                            StoreRequest,
                                            DataGridPageAction
                                        >(
                                            "STORE" as "STORE",
                                            {
                                                tableName: "Filter",
                                                form: options.table,
                                                record: FilterToJSON({
                                                    ...filter,
                                                    name: name,
                                                    default: defaultFilter,
                                                }),
                                            },
                                            (response) => ({
                                                type: "SAVED_FILTER",
                                                record: response.record as FilterJSON,
                                            })
                                        )
                                    )
                                );
                            }
                        }
                    }
                }

                return {
                    state: {
                        ...state,
                        managingFilters: null,
                    },
                    requests,
                };
            }
            case "MANAGE_FILTER_DELETE": {
                return {
                    state: {
                        ...state,
                        managingFilters: state.managingFilters && {
                            ...state.managingFilters,
                            names: omit(
                                state.managingFilters.names,
                                action.filter
                            ),
                            deleted: [
                                ...state.managingFilters.deleted,
                                action.filter,
                            ],
                        },
                    },
                    requests: [],
                };
            }
            case "MANAGE_FILTER_RENAME": {
                return {
                    state: {
                        ...state,
                        managingFilters: state.managingFilters && {
                            ...state.managingFilters,
                            names: {
                                ...state.managingFilters.names,
                                [action.filter]: action.name,
                            },
                        },
                    },
                    requests: [],
                };
            }
            case "MANAGE_FILTER_SET_DEFAULT": {
                return {
                    state: {
                        ...state,
                        managingFilters: state.managingFilters && {
                            ...state.managingFilters,
                            default: action.filter,
                        },
                    },
                    requests: [],
                };
            }
            default:
                throw new Error((action as any).type);
        }
    }

    return {
        initialize,
        reduce: (
            state: DataGridPageState,
            action: DataGridPageAction,
            context: PageContext
        ) => {
            const inner = baseReduce(state, action, context);
            if (
                inner.state.views !== null &&
                inner.state.filters !== null &&
                inner.state.gridState === null
            ) {
                return selectView(context, inner.state);
            } else {
                return inner;
            }
        },
        component: ({ state, dispatch }) => {
            const gridDispatch = React.useCallback(
                (action) =>
                    dispatch({
                        type: "GRID",
                        action,
                    }),
                [dispatch]
            );

            const onHideManagerFilters = React.useCallback(
                () =>
                    dispatch({
                        type: "HIDE_MANAGE_FILTERS",
                    }),
                [dispatch]
            );

            if (state.gridState !== null && state.viewId !== null) {
                return (
                    <>
                        <DataGrid
                            state={state.gridState}
                            dispatch={gridDispatch}
                            options={options}
                        />
                        <Modal
                            show={state.managingFilters !== null}
                            onHide={onHideManagerFilters}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <Modal.Header closeButton>
                                <Modal.Title>Manage Filters</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <ListGroup>
                                    <ListGroupItem style={{ display: "flex" }}>
                                        <FormWrapper label="Default Filter">
                                            <select
                                                className="form-control"
                                                value={
                                                    (state.managingFilters &&
                                                        state.managingFilters
                                                            .default) ||
                                                    ""
                                                }
                                                onChange={(event) =>
                                                    dispatch({
                                                        type: "MANAGE_FILTER_SET_DEFAULT",
                                                        filter:
                                                            event.target
                                                                .value || null,
                                                    })
                                                }
                                            >
                                                <option value="">
                                                    Default
                                                </option>

                                                {state.managingFilters &&
                                                    Object.entries(
                                                        state.managingFilters
                                                            .names
                                                    ).map(([id, name]) => (
                                                        <option
                                                            value={id}
                                                            key={id}
                                                        >
                                                            {name}
                                                        </option>
                                                    ))}
                                            </select>
                                        </FormWrapper>
                                    </ListGroupItem>
                                    {state.managingFilters &&
                                        Object.entries(
                                            state.managingFilters.names
                                        ).map(([id, name]) => (
                                            <ListGroupItem
                                                key={id}
                                                style={{ display: "flex" }}
                                            >
                                                <FormControl
                                                    type="text"
                                                    value={name}
                                                    onChange={(event: any) =>
                                                        dispatch({
                                                            type: "MANAGE_FILTER_RENAME",
                                                            filter: id,
                                                            name: event.target
                                                                .value,
                                                        })
                                                    }
                                                />{" "}
                                                <div
                                                    style={{
                                                        width: "125px",
                                                        marginLeft: "25px",
                                                    }}
                                                >
                                                    <Button
                                                        variant="danger"
                                                        onClick={() =>
                                                            window.confirm(
                                                                "Are you sure you want to delete this filter?"
                                                            ) &&
                                                            dispatch({
                                                                type: "MANAGE_FILTER_DELETE",
                                                                filter: id,
                                                            })
                                                        }
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faTrashAlt}
                                                        />{" "}
                                                        Delete
                                                    </Button>
                                                </div>
                                            </ListGroupItem>
                                        ))}
                                </ListGroup>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button
                                    onClick={() =>
                                        dispatch({
                                            type: "SAVE_MANAGE_FILTERS",
                                        })
                                    }
                                >
                                    <FontAwesomeIcon icon={faSave} /> Save
                                </Button>
                            </Modal.Footer>
                        </Modal>
                        {state.savingFilter && (
                            <div {...SAVE_FILTER_STYLE}>
                                <FormWrapper label="Name">
                                    <input
                                        className="form-control"
                                        type="text"
                                        value={state.savingFilterName}
                                        onChange={(event) => {
                                            dispatch({
                                                type: "SAVE_FILTER_NAME",
                                                value: event.target.value,
                                            });
                                        }}
                                    />
                                </FormWrapper>
                                <Button
                                    variant="primary"
                                    disabled={state.savingFilterName === ""}
                                    onClick={() =>
                                        dispatch({
                                            type: "SAVE_FILTER_SAVE",
                                        })
                                    }
                                >
                                    <FontAwesomeIcon icon={faSave} /> Save
                                </Button>{" "}
                                <Button
                                    onClick={() =>
                                        dispatch({
                                            type: "SAVE_FILTER_CANCEL",
                                        })
                                    }
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </>
                );
            } else {
                return <div />;
            }
        },
        encodeState: (state) => {
            return {
                segments: state.viewId ? [state.viewId] : [],
                parameters: state.gridState
                    ? {
                          ...state.gridState.filters,
                          sort: state.gridState.sort,
                          sort_reversed: state.gridState.reversed,
                          filter: state.filterId,
                      }
                    : {},
            };
        },
        hasUnsavedChanges() {
            return false;
        },
        headerComponent(props) {
            const user = useUser();
            const onExcelClick = React.useCallback(() => {
                props.dispatch({
                    type: "GRID",
                    action: {
                        type: "EXCEL_EXPORT",
                    },
                });
            }, [props.dispatch]);
            const onViewChange = React.useCallback(
                (event) => {
                    props.dispatch({
                        type: "SELECT_VIEW",
                        view: event.target.value,
                    });
                },
                [props.dispatch]
            );

            const onFilterChange = React.useCallback(
                (event) => {
                    props.dispatch({
                        type: "SELECT_FILTER",
                        filter: event.target.value,
                    });
                },
                [props.dispatch]
            );

            const onSaveFilter = React.useCallback(
                () =>
                    props.dispatch({
                        type: "SAVE_FILTER",
                    }),
                [props.dispatch]
            );

            const onDeleteFilter = React.useCallback(
                () =>
                    props.dispatch({
                        type: "DELETE_FILTER",
                    }),
                [props.dispatch]
            );

            const onResetWidths = React.useCallback(
                () =>
                    props.dispatch({
                        type: "GRID",
                        action: {
                            type: "RESET_WIDTHS",
                        },
                    }),
                [props.dispatch]
            );

            const onManageFilters = React.useCallback(
                () =>
                    props.dispatch({
                        type: "MANAGE_FILTERS",
                    }),
                [props.dispatch]
            );

            const onStartBulkAction = React.useCallback(
                (index: number) =>
                    props.dispatch({
                        type: "GRID",
                        action: {
                            type: "START_BULK_ACTION",
                            index,
                        },
                    }),
                [props.dispatch]
            );

            let isCustomFilter = false;
            let hasDefaultFilter = false;
            let isDefaultFilter = false;
            if (props.state.gridState) {
                const view = find(
                    props.state.views,
                    (view) => view.id.uuid == props.state.viewId
                );
                if (view) {
                    hasDefaultFilter = isDefaultFilter = some(
                        view.columns,
                        (view) => view.filter != ""
                    );

                    for (const column of view.columns) {
                        if (
                            props.state.gridState.filters[column.column] !==
                            column.filter
                        ) {
                            isDefaultFilter = false;
                            break;
                        }
                    }
                }

                if (!isDefaultFilter) {
                    const selectedFilter = find(
                        props.state.filters,
                        (filter) => filter.id.uuid === props.state.filterId
                    );
                    const selectedFilters = selectedFilter
                        ? selectedFilter.columns.filter(
                              (column) => column.filter != ""
                          )
                        : [];
                    const currentFilters = Object.entries(
                        props.state.gridState.filters
                    ).filter((column) => column[1] != "");

                    if (selectedFilters.length != currentFilters.length) {
                        isCustomFilter = true;
                    } else {
                        for (const filter of selectedFilters) {
                            if (
                                props.state.gridState.filters[filter.column] !==
                                filter.filter
                            ) {
                                isCustomFilter = true;
                                break;
                            }
                        }
                    }
                }
            }
            return (
                <>
                    <Breadcrumb>
                        <Breadcrumb.Item href="#/">Dashboard</Breadcrumb.Item>
                        {options.dataSection && (
                            <Breadcrumb.Item href="#/data/">
                                Data
                            </Breadcrumb.Item>
                        )}
                        <Breadcrumb.Item active>
                            {options.pageTitle ||
                                plural(titleCase(options.table))}
                        </Breadcrumb.Item>
                    </Breadcrumb>
                    <div style={{ flexGrow: 1 }} />
                    <span {...LABEL_STYLE}>View</span>
                    {props.state.views && (
                        <select
                            onChange={onViewChange}
                            className="form-control"
                            style={{ display: "inline-block", width: "2in" }}
                            value={props.state.viewId || undefined}
                        >
                            {props.state.views.map((view) => (
                                <option key={view.id.uuid} value={view.id.uuid}>
                                    {view.name}
                                </option>
                            ))}
                        </select>
                    )}
                    <span {...LABEL_STYLE}>Filter</span>
                    {props.state.filters !== null && (
                        <select
                            onChange={onFilterChange}
                            className="form-control"
                            style={{ display: "inline-block", width: "2in" }}
                            value={
                                isDefaultFilter
                                    ? "default"
                                    : isCustomFilter
                                    ? "custom"
                                    : props.state.filterId || "none"
                            }
                        >
                            <option value="none">None</option>
                            {isCustomFilter && (
                                <option value="custom" disabled>
                                    Custom
                                </option>
                            )}
                            {hasDefaultFilter && (
                                <option value="default">Default</option>
                            )}
                            {props.state.filters
                                .filter(
                                    (filter) =>
                                        filter.view === props.state.viewId
                                )
                                .map((filter) => (
                                    <option
                                        key={filter.id.uuid}
                                        value={filter.id.uuid}
                                    >
                                        {filter.name}
                                    </option>
                                ))}
                        </select>
                    )}
                    <Dropdown style={{ paddingLeft: "10px" }}>
                        <Dropdown.Toggle id="hamburger-toggle">
                            <FontAwesomeIcon icon={faBars} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={onResetWidths}>
                                <FontAwesomeIcon icon={faColumns} /> Reset
                                Column Widths
                            </Dropdown.Item>
                            {hasPermission(user, options.table, "export") && (
                                <Dropdown.Item onClick={onExcelClick}>
                                    <FontAwesomeIcon icon={faFileExcel} />{" "}
                                    Export to Excel
                                </Dropdown.Item>
                            )}
                            {isCustomFilter && (
                                <Dropdown.Item onClick={onSaveFilter}>
                                    <FontAwesomeIcon icon={faSave} /> Save
                                    Filter
                                </Dropdown.Item>
                            )}
                            {!isCustomFilter && props.state.filterId && (
                                <Dropdown.Item onClick={onDeleteFilter}>
                                    <FontAwesomeIcon icon={faTrash} /> Delete
                                    Current Filter
                                </Dropdown.Item>
                            )}
                            <Dropdown.Item onClick={onManageFilters}>
                                <FontAwesomeIcon icon={faCogs} /> Manage Filters
                            </Dropdown.Item>
                            {options.bulkActions &&
                                options.bulkActions.map((bulkAction, index) => (
                                    <Dropdown.Item
                                        key={index}
                                        onClick={onStartBulkAction.bind(
                                            null,
                                            index
                                        )}
                                    >
                                        <FontAwesomeIcon
                                            icon={bulkAction.icon}
                                        />{" "}
                                        {bulkAction.name}
                                    </Dropdown.Item>
                                ))}
                        </Dropdown.Menu>
                    </Dropdown>
                </>
            );
        },
        title() {
            return options.pageTitle || titleCase(plural(options.table));
        },
        beforeUnload() {
            return false;
        },
    };
}
