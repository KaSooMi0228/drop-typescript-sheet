import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
    faSave,
    faSortDown,
    faSortUp,
    faWindowClose,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { addDays, format as formatDate, startOfDay } from "date-fns";
import formatISO9075 from "date-fns/formatISO9075";
import dateParse from "date-fns/parse";
import { Decimal } from "decimal.js";
import { Cell, Column, Table } from "fixed-data-table-2";
import { css } from "glamor";
import { debounce, fromPairs, zip } from "lodash";
import * as React from "react";
import { Button, ButtonGroup, Form, FormControl } from "react-bootstrap";
import DatePicker from "react-date-picker";
import RelativePortal from "react-relative-portal";
import { useResizeDetector } from "react-resize-detector";
import Select, { components } from "react-select";
import tinyColor from "tinycolor2";
import * as XLSX from "xlsx";
import { formatMoney } from "../../app/estimate/TotalsWidget.widget";
import { View } from "../../app/views/table";
import COLUMNS from "../../columns.json";
import { Dictionary } from "../common";
import { LocalDate } from "../LocalDate";
import { Meta, RecordMeta } from "../meta";
import { PageContext, ReduceResult } from "../Page";
import { Phone } from "../phone";
import { useQuickCache } from "../quick-cache";
import { castRequest, QueryRequest, Request, RequestHandle } from "../requests";
import {
    ColumnFilter,
    FilterDetail,
    QueryTableResult,
    UserPermissions,
} from "../server/api";
import { RecordWidget } from "../widgets";
import { toPattern } from "./patterns";

export interface BulkActionState {
    index: number;
    state: any;
    data: any;
    selected: Set<string>;
    pending: number;
}

export interface DataGridState {
    view: View;
    widths: Dictionary<number>;
    filters: Dictionary<string>;
    data: Array<Array<{} | null>> | null;
    sort?: string;
    reversed?: boolean;
    isAddingColumn: boolean;
    rowCount: number;
    fetchRowCount: number;
    currentRequestId: number;
    bulkAction: BulkActionState | null;
}

export type DataGridAction =
    | {
          type: "REFRESH";
      }
    | {
          type: "DATA_FETCHED";
          data: QueryTableResult;
          requestId: number;
      }
    | {
          type: "RESIZE_COLUMN";
          column: string;
          width: number;
      }
    | {
          type: "UPDATE_FILTER";
          column: string;
          filter: string;
      }
    | {
          type: "CLICK_HEADER";
          column: string;
      }
    | {
          type: "INCREASE_FETCH";
      }
    | {
          type: "EXCEL_EXPORT";
      }
    | {
          type: "EXPORT_FETCHED";
          data: QueryTableResult;
          requestId: number;
      }
    | {
          type: "RESET_WIDTHS";
      }
    | {
          type: "START_BULK_ACTION";
          index: number;
      }
    | {
          type: "BULK_ACTION_ACTION";
          action: any;
      }
    | {
          type: "BULK_SET_SELECTED";
          id: string;
          value: boolean;
      }
    | {
          type: "CLOSE_BULK";
      }
    | {
          type: "APPLY_BULK";
      }
    | {
          type: "BULK_FETCHED";
          data: QueryTableResult;
      }
    | {
          type: "BULK_DONE";
      };

function reorder<T>(items: Array<T>, oldIndex: number, newIndex: number) {
    items = items.slice(0);
    const item = items[oldIndex];
    items.splice(oldIndex, 1);
    items.splice(newIndex, 0, item);
    return items;
}

function removeElement<T>(items: Array<T>, index: number) {
    items = items.slice(0);
    items.splice(index, 1);
    return items;
}

function replaceElement<T>(items: Array<T>, index: number, element: T) {
    items = items.slice(0);
    items[index] = element;
    return items;
}

const NUMERIC_STYLE = css({
    display: "block",
    width: "100%",
    textAlign: "right",
});

const TEXT_STYLE = css({
    whiteSpace: "pre",
});

function renderColumn(meta: Meta, value: {} | null) {
    if (value === null) {
        return <div />;
    }
    switch (meta.type) {
        case "string":
        case "enum":
        case "uuid":
            return <span {...TEXT_STYLE}>{value}</span>;
        case "quantity":
        case "quantity?":
        case "serial":
            return <span {...NUMERIC_STYLE}>{value}</span>;
        case "money":
        case "money?":
            return (
                <span {...NUMERIC_STYLE}>
                    {formatMoney(new Decimal(value as string))}
                </span>
            );
        case "percentage":
        case "percentage?":
            return (
                <span {...NUMERIC_STYLE}>
                    {new Decimal(value as string).times(100).toString()}%
                </span>
            );

        case "phone":
            return <span>{new Phone(value as string).format()}</span>;
        case "boolean":
            return <span>{value ? "yes" : "no"}</span>;
        case "date":
            return (
                <span>
                    {value
                        ? LocalDate.parse(value as string).toString()
                        : "n/a"}
                </span>
            );
        case "datetime":
            return (
                <span>
                    {value ? formatISO9075(new Date(value as string)) : "n/a"}
                </span>
            );
        case "array":
            switch (meta.items.type) {
                case "string":
                    return (value as string[]).join(",");
            }
        default:
            return <div>?</div>;
    }
}

function dateParseFunc(text: string, adjust: number): string | undefined {
    const parsed = dateParse(text, "y-M-d", new Date());

    if (isNaN(parsed.getTime())) {
        return undefined;
    } else {
        return formatDate(startOfDay(parsed), "yyyy-MM-dd");
    }
}

function datetimeParseFunc(text: string, adjust: number): string | undefined {
    const parsed = dateParse(text, "y-M-d", new Date());

    if (isNaN(parsed.getTime())) {
        return undefined;
    } else {
        return (
            formatDate(addDays(startOfDay(parsed), adjust), "yyyy-MM-dd") +
            "UTC8"
        );
    }
}

function numberParseFunc(text: string, adjust: number): string | undefined {
    const parsed = parseInt(text, 10);
    if (/^[-+]?(\d+)$/.test(text)) {
        return text;
    } else {
        return undefined;
    }
}

function parseStringFilter(filter: string): ColumnFilter | null {
    filter = filter.trim();
    if (filter === "") {
        return null;
    } else if (filter.startsWith(">")) {
        return {
            greater: filter.slice(1).trim(),
        };
    } else if (filter.startsWith("<")) {
        return {
            lesser: filter.slice(1).trim(),
        };
    } else if (filter.startsWith("=")) {
        if (filter === "=") {
            return {
                equal: null,
            };
        } else {
            return {
                equal: filter.slice(1),
                ignore_case: true,
            };
        }
    } else if (filter.startsWith("!")) {
        return {
            not_equal: filter.slice(1),
            ignore_case: true,
        };
    } else {
        return {
            like: toPattern(filter),
        };
    }
}

function parseTextFilter(
    filter: string,
    parser: (text: string, adjust: number) => any
): ColumnFilter | null | undefined {
    filter = filter.trim();
    if (filter === "") {
        return null;
    } else if (filter.startsWith(">")) {
        const parsed = parser(filter.slice(1).trim(), 1);
        if (parsed == undefined) {
            return undefined;
        }
        return {
            greater: parsed,
        };
    } else if (filter.startsWith("<")) {
        const parsed = parser(filter.slice(1).trim(), 0);
        if (parsed == undefined) {
            return undefined;
        }
        return {
            lesser: parsed,
        };
    } else if (filter.indexOf(" to ") != -1) {
        const [lhs, rhs] = filter.split(" to ", 2);
        const lhsParsed = parser(lhs.trim(), 0);
        if (lhsParsed === undefined) {
            return undefined;
        }

        const rhsParsed = parser(rhs.trim(), 1);
        if (rhsParsed === undefined) {
            return undefined;
        }

        return {
            greater: lhsParsed,
            lesser: rhsParsed,
        };
    } else if (filter.startsWith("=")) {
        if (filter === "=") {
            return {
                equal: null,
            };
        } else {
            const parsed = parser(filter.slice(1), 0);
            if (parsed === undefined) {
                return undefined;
            }
            return {
                equal: parsed,
            };
        }
    } else if (filter.startsWith("!")) {
        const parsed = parser(filter, 0);
        if (parsed === undefined) {
            return undefined;
        }

        return {
            not_equal: parsed,
        };
    } else {
        const parsed = parser(filter, 0);
        if (parsed === undefined) {
            return undefined;
        }
        return {
            equal: parsed,
        };
    }
}

function makeFilter(meta: Meta, filter: string): ColumnFilter | null {
    switch (meta.type) {
        case "string":
            return parseStringFilter(filter);
        case "enum":
            return {
                equal: filter,
            };
        case "date":
            return parseTextFilter(filter, dateParseFunc) || null;
        case "datetime":
            return parseTextFilter(filter, datetimeParseFunc) || null;
        case "serial":
        case "money":
        case "quantity":
        case "percentage":
            return parseTextFilter(filter, numberParseFunc) || null;
        case "boolean":
            switch (filter) {
                case "true":
                    return {
                        equal: true,
                    };
                case "false":
                    return {
                        equal: false,
                    };
                default:
                    return null;
            }
        case "array":
            switch (meta.items.type) {
                case "string":
                    return parseStringFilter(filter);
            }
        default:
            throw new Error("not supported");
    }
}

function ShowBulkAction(props: {
    state: BulkActionState;
    options: GridOptions;
    dispatch: (action: DataGridAction) => void;
}) {
    const onApply = React.useCallback(
        () =>
            props.dispatch({
                type: "APPLY_BULK",
            }),
        [props.dispatch]
    );

    const onClose = React.useCallback(
        () =>
            props.dispatch({
                type: "CLOSE_BULK",
            }),
        [props.dispatch]
    );

    const cache = useQuickCache();

    if (!props.options.bulkActions) {
        throw new Error("unreachable");
    }

    const bulkAction = props.options.bulkActions[props.state.index];

    const validation = bulkAction.detail.validate(props.state.data, cache);

    return (
        <div style={{ margin: "5px" }}>
            <bulkAction.detail.component
                state={props.state.state}
                data={props.state.data}
                requests={{}}
                status={{
                    mutable: props.state.pending === 0,
                    validation,
                }}
                dispatch={(action: any) =>
                    props.dispatch({
                        type: "BULK_ACTION_ACTION",
                        action,
                    })
                }
            />

            <div>
                <Button
                    variant="primary"
                    onClick={onApply}
                    disabled={
                        props.state.pending > 0 ||
                        validation.length > 0 ||
                        props.state.selected.size == 0
                    }
                >
                    <FontAwesomeIcon icon={faSave} /> Apply{" "}
                    {props.state.pending > 0 && `(${props.state.pending})`}
                </Button>{" "}
                <Button variant="primary" onClick={onClose}>
                    <FontAwesomeIcon icon={faWindowClose} /> Close
                </Button>
            </div>
        </div>
    );
}

class HeaderDatePicker extends (DatePicker as any) {
    portalRef: any;

    constructor(props: any) {
        super(props);

        this.portalRef = React.createRef();
    }

    renderCalendar() {
        const inner = super.renderCalendar();
        return (
            <RelativePortal className="relative-portal">
                <div ref={this.portalRef}>{inner}</div>
            </RelativePortal>
        );
    }

    onOutsideAction = (event: any) => {
        if (
            this.portalRef.current &&
            this.wrapper &&
            !this.wrapper.contains(event.target) &&
            !this.portalRef.current.contains(event.target)
        ) {
            this.setState({
                isOpen: false,
            });
        }
    };
}

const EnumOption = (
    filter: string,
    updateFilter: (filter: string) => void,
    props: any
) => {
    if (props.data.x == "") {
        return (
            <div>
                <components.Option {...props}>
                    <label>(all)</label>
                </components.Option>
            </div>
        );
    }
    return (
        <div>
            <components.Option {...props}>
                <input
                    type="checkbox"
                    checked={filter.split(";").indexOf(props.label) !== -1}
                    onChange={(event) => {
                        if (event.target.checked) {
                            if (filter == "") {
                                updateFilter(props.label);
                            } else {
                                updateFilter(filter + ";" + props.label);
                            }
                        } else {
                            updateFilter(
                                filter
                                    .split(";")
                                    .filter((x) => x != props.label)
                                    .join(";")
                            );
                        }
                        event.preventDefault();
                    }}
                    onClick={(event) => event.stopPropagation()}
                />{" "}
                <label>{props.label}</label>
            </components.Option>
        </div>
    );
};

export function renderFilter(
    meta: Meta,
    filter: string,
    updateFilter: (c: string) => void,
    width: number
) {
    switch (meta.type) {
        case "string":
            return (
                <FormControl
                    type="text"
                    value={filter}
                    onChange={(event: any) => {
                        updateFilter((event.target as HTMLInputElement).value);
                    }}
                />
            );
        case "date":
        case "datetime": {
            return (
                <FormControl
                    type="text"
                    value={filter}
                    onChange={(event: any) =>
                        updateFilter((event.target as HTMLInputElement).value)
                    }
                    className={
                        parseTextFilter(filter, dateParseFunc) === undefined
                            ? "is-invalid"
                            : ""
                    }
                />
            );
        }
        case "serial":
        case "percentage":
        case "money":
        case "quantity": {
            return (
                <FormControl
                    type="text"
                    value={filter}
                    onChange={(event: React.SyntheticEvent<{}>) =>
                        updateFilter((event.target as HTMLInputElement).value)
                    }
                    className={
                        parseTextFilter(filter, numberParseFunc) === undefined
                            ? "is-invalid"
                            : ""
                    }
                />
            );
        }
        case "boolean": {
            const makeButton = (id: string, label: string) => {
                return (
                    <Button
                        variant={filter === id ? "primary" : "secondary"}
                        onClick={() => updateFilter(id)}
                    >
                        {label}
                    </Button>
                );
            };

            return (
                <ButtonGroup>
                    {makeButton("", "All")}
                    {makeButton("true", "Yes")}
                    {makeButton("false", "No")}
                </ButtonGroup>
            );
        }
        case "array":
            switch (meta.items.type) {
                case "string":
                    return (
                        <FormControl
                            type="text"
                            value={filter}
                            onChange={(event: any) => {
                                updateFilter(
                                    (event.target as HTMLInputElement).value
                                );
                            }}
                        />
                    );
            }
            return <div />;
        case "enum":
            const parts = filter.split(";");
            return (
                <div style={{ width: width - 20, zIndex: 10000 }}>
                    <Select
                        value={{ x: filter }}
                        options={["", ...meta.values].map((x) => ({ x }))}
                        getOptionLabel={(x) =>
                            x.x ||
                            (filter.indexOf(";") !== -1
                                ? "(multiple)"
                                : "(all)")
                        }
                        getOptionValue={(x) => x.x}
                        onChange={(event) => {
                            if (event) {
                                updateFilter(event.x);
                            } else {
                                updateFilter("");
                            }
                        }}
                        components={{
                            Option: EnumOption.bind(
                                undefined,
                                filter,
                                updateFilter
                            ),
                        }}
                        hideSelectedOptions={false}
                    />
                </div>
            );

        default:
            return <div />;
    }
}

export interface BulkAction {
    name: string;
    icon: IconProp;
    meta: RecordMeta<any, any, any>;
    detail: RecordWidget<any, any, any, any, any>;
    extraFilters: FilterDetail[];
    apply: (record: any, detail: any) => any;
}

export interface GridOptions {
    table: string;
    actionCellWidth?: number;
    actionCell?: (values: Array<{} | null>) => React.ReactElement<{}>;
    topActionCell?: () => React.ReactElement<{}>;
    colorColumn?: string;
    textColorColumn?: string;
    colorAppliedColumn?: string;
    fallbackSorts: Array<string>;
    bulkActions?: Array<BulkAction>;
    extraFilters?: (user: UserPermissions) => FilterDetail[];
    dataSection?: boolean;
    extraColumns?: string[];
}

export function resolveType(
    table: string,
    segment: string,
    column: string
): Meta {
    const columnKey = column.split("@")[0];
    const desc = (COLUMNS as any)[table + (segment ? "@" + segment : "")][
        columnKey
    ];
    if (desc) {
        return desc.meta;
    } else {
        return {
            type: "null",
        };
    }
}

function makeRequest(
    options: GridOptions,
    user: UserPermissions,
    state: DataGridState,
    includeLimit: boolean,
    includeExtra: boolean,
    type: "DATA_FETCHED" | "EXPORT_FETCHED"
): RequestHandle<QueryRequest, DataGridAction> {
    const filters: FilterDetail[] = [];

    includeLimit = includeLimit && state.bulkAction === null;

    if (options.extraFilters) {
        filters.push(...options.extraFilters(user));
    }

    for (const column of state.view.columns) {
        const filter = state.filters[column.column];
        if (filter) {
            const filterConfig = filter
                .split(";")
                .map((x) =>
                    makeFilter(
                        resolveType(
                            options.table,
                            state.view.segment,
                            column.column
                        ),
                        x
                    )
                )
                .filter((x) => x)
                .map((x) => x!);
            switch (filterConfig.length) {
                case 0:
                    break;
                case 1:
                    filters.push({
                        column: column.column,
                        filter: filterConfig[0],
                    });
                    break;
                default:
                    filters.push({
                        or: filterConfig.map((x) => ({
                            column: column.column,
                            filter: x,
                        })),
                    });
                    break;
            }
        }
    }

    if (state.bulkAction) {
        for (const filter of (options.bulkActions as BulkAction[])[
            state.bulkAction.index
        ].extraFilters) {
            filters.push(filter);
        }
    }

    return Request(
        "QUERY",
        {
            tableName: options.table,
            segment: state.view.segment,
            filters: state.bulkAction
                ? [
                      {
                          or: [
                              {
                                  and: filters,
                              },
                              {
                                  column: "id",
                                  filter: {
                                      in: Array.from(state.bulkAction.selected),
                                  },
                              },
                          ],
                      },
                  ]
                : filters,
            columns: [
                ...state.view.columns.map((column) => column.column),
                ...(includeExtra
                    ? [
                          options.colorColumn || "null",
                          options.textColorColumn || "null",
                          "id",
                          ...(options.extraColumns || []),
                      ]
                    : []),
            ],
            sorts: state.sort
                ? [
                      (state.reversed ? "-" : "") + state.sort,
                      ...options.fallbackSorts,
                  ]
                : options.fallbackSorts,
            limit: includeLimit ? state.fetchRowCount : undefined,
        },
        (response) =>
            ({
                type,
                data: response,
                requestId: state.currentRequestId,
            } as DataGridAction)
    );
}

function withRequest(
    options: GridOptions,
    user: UserPermissions,
    state: DataGridState
): ReduceResult<DataGridState, DataGridAction> {
    if (user.id === "") {
        throw new Error("User id not available");
    }

    state = {
        ...state,
        currentRequestId: state.currentRequestId + 1,
    };
    return {
        state,
        requests: [
            castRequest(
                makeRequest(options, user, state, true, true, "DATA_FETCHED")
            ),
        ],
    };
}

export function dataGridInitialize(
    options: GridOptions,
    user: UserPermissions,
    view: View,
    previous: any
): ReduceResult<DataGridState, DataGridAction> {
    const widths: Dictionary<number> = {};
    const oldWidths = previous.widths || {};
    const filters = previous.filters || {};

    for (const column of view.columns) {
        widths[column.column] =
            oldWidths[column.column] === undefined
                ? column.width.toNumber()
                : oldWidths[column.column];
    }

    return withRequest(options, user, {
        filters,
        widths,
        data: null,
        view,
        isAddingColumn: false,
        sort: previous.sort || undefined,
        reversed: previous.reversed || false,
        rowCount: 0,
        fetchRowCount: 100,
        currentRequestId: 0,
        bulkAction: null,
    });
}

export function dataGridReducer(
    options: GridOptions,
    state: DataGridState,
    action: DataGridAction,
    context: PageContext
): ReduceResult<DataGridState, DataGridAction> {
    switch (action.type) {
        case "REFRESH":
            return withRequest(options, context.user, state);
        case "DATA_FETCHED":
            if (action.requestId == state.currentRequestId) {
                return {
                    state: {
                        ...state,
                        data: action.data.rows,
                        rowCount: action.data.full_count,
                    },
                    requests: [],
                };
            } else {
                return {
                    state,
                    requests: [],
                };
            }
        case "RESET_WIDTHS": {
            return {
                state: {
                    ...state,
                    widths: fromPairs(
                        state.view.columns.map((column) => [
                            column.column,
                            column.width.toNumber(),
                        ])
                    ),
                },
                requests: [],
            };
        }
        case "RESIZE_COLUMN": {
            return {
                state: {
                    ...state,
                    widths: {
                        ...state.widths,
                        [action.column]: action.width,
                    },
                },
                requests: [],
            };
        }
        case "UPDATE_FILTER":
            return withRequest(options, context.user, {
                ...state,
                data: null,
                filters: {
                    ...state.filters,
                    [action.column]: action.filter,
                },
            });
        case "CLICK_HEADER":
            return withRequest(options, context.user, {
                ...state,
                data: null,
                sort: action.column,
                reversed: !state.reversed,
            });
        case "INCREASE_FETCH":
            return withRequest(options, context.user, {
                ...state,
                fetchRowCount: state.fetchRowCount + 100,
            });
        case "START_BULK_ACTION": {
            if (!options.bulkActions) {
                throw new Error("unreachable");
            }
            const bulkAction = options.bulkActions[action.index];

            const bulkData = bulkAction.detail.dataMeta.repair(undefined);
            const bulk = bulkAction.detail.initialize(bulkData, context);

            return withRequest(options, context.user, {
                ...state,
                bulkAction: {
                    index: action.index,
                    state: bulk.state,
                    data: bulk.data,
                    selected: new Set(),
                    pending: 0,
                },
            });
        }
        case "BULK_ACTION_ACTION": {
            if (!options.bulkActions || !state.bulkAction) {
                throw new Error("unreachable");
            }

            const bulkAction = options.bulkActions[state.bulkAction.index];
            const bulk = bulkAction.detail.reduce(
                state.bulkAction.state,
                state.bulkAction.data,
                action.action,
                context
            );

            return {
                state: {
                    ...state,
                    bulkAction: {
                        ...state.bulkAction,
                        state: bulk.state,
                        data: bulk.data,
                    },
                },
                requests: [],
            };
        }
        case "BULK_SET_SELECTED":
            if (!options.bulkActions || !state.bulkAction) {
                throw new Error("unreachable");
            }
            let selected = new Set(state.bulkAction.selected);
            if (action.value) {
                selected.add(action.id);
            } else {
                selected.delete(action.id);
            }
            return {
                state: {
                    ...state,
                    bulkAction: {
                        ...state.bulkAction,
                        selected,
                    },
                },
                requests: [],
            };
        case "CLOSE_BULK":
            return withRequest(options, context.user, {
                ...state,
                bulkAction: null,
            });
        case "APPLY_BULK": {
            if (!options.bulkActions || !state.bulkAction || !state.data) {
                throw new Error("unreachable");
            }

            const ids = Array.from(state.bulkAction.selected);
            return {
                state,
                requests: [
                    Request(
                        "QUERY",
                        {
                            tableName: options.table,
                            filters: [
                                {
                                    column: "id",
                                    filter: {
                                        in: ids,
                                    },
                                },
                            ],
                            columns: ["."],
                        },
                        (response) => ({
                            type: "BULK_FETCHED",
                            data: response,
                        })
                    ),
                ],
            };
        }
        case "BULK_FETCHED": {
            if (!options.bulkActions || !state.bulkAction || !state.data) {
                throw new Error("unreachable");
            }

            const bulkAction = options.bulkActions[state.bulkAction.index];
            const requests = action.data.rows.map((row) => {
                const data = bulkAction.meta.fromJSON(row[0]);
                const newData = bulkAction.apply(
                    data,
                    (state.bulkAction as BulkActionState).data
                );
                return castRequest(
                    Request(
                        "STORE",
                        {
                            tableName: options.table,
                            form: "Bulk " + bulkAction.name,
                            record: bulkAction.meta.toJSON(newData),
                        },
                        (response) =>
                            ({
                                type: "BULK_DONE",
                            } as DataGridAction)
                    )
                ) as any;
            });
            return {
                state: {
                    ...state,
                    bulkAction: {
                        ...state.bulkAction,
                        pending: requests.length,
                    },
                },
                requests,
            };
        }
        case "BULK_DONE":
            if (!options.bulkActions || !state.bulkAction || !state.data) {
                throw new Error("unreachable");
            }

            if (state.bulkAction.pending == 1) {
                return withRequest(options, context.user, {
                    ...state,
                    bulkAction: null,
                });
            } else {
                return {
                    state: {
                        ...state,
                        bulkAction: {
                            ...state.bulkAction,
                            pending: state.bulkAction.pending - 1,
                        },
                    },
                    requests: [],
                };
            }
        case "EXCEL_EXPORT":
            return {
                state,
                requests: [
                    castRequest(
                        makeRequest(
                            options,
                            context.user,
                            state,
                            false,
                            false,
                            "EXPORT_FETCHED"
                        )
                    ),
                ],
            };
        case "EXPORT_FETCHED":
            const aoa = [
                state.view.columns.map((column) => column.name),
                ...action.data.rows.map((row) =>
                    zip(state.view.columns, row).map(([column, value]) => {
                        if (!column) {
                            throw new Error();
                        }
                        const columnType = resolveType(
                            options.table,
                            state.view.segment,
                            column.column
                        );
                        if (value === null) {
                            return null;
                        }
                        switch (columnType.type) {
                            case "money":
                            case "percentage":
                            case "quantity":
                                if (value === null) {
                                    return null;
                                } else {
                                    return parseFloat(value as string);
                                }
                            case "datetime":
                                return new Date(value as string);
                            case "array":
                                switch (columnType.items.type) {
                                    case "string":
                                        return (value as string[]).join(", ");
                                    default:
                                        return "(not supported)";
                                }
                            default:
                                return value;
                        }
                    })
                ),
            ];

            const workbook = XLSX.utils.book_new();
            const sheet = XLSX.utils.aoa_to_sheet(aoa);
            XLSX.utils.book_append_sheet(workbook, sheet);

            XLSX.writeFile(
                workbook,
                `${new LocalDate(new Date()).toString()} - ${
                    state.view.name
                }.xlsx`
            );

            return {
                state,
                requests: [],
            };
    }
}

interface Props {
    dispatch: (action: DataGridAction) => void;
    state: DataGridState;
    options: GridOptions;
}

function columnResizeEnd(
    props: Props,
    newColumnWidth: number,
    columnKey: string
) {
    props.dispatch({
        type: "RESIZE_COLUMN",
        column: columnKey,
        width: newColumnWidth,
    });
}

function onHeaderClick(props: Props, column: string) {
    props.dispatch({
        type: "CLICK_HEADER",
        column,
    });
}

const HEADER_NAME_STYLE = css({
    fontSize: "14pt",
    whiteSpace: "nowrap",
});

export default function DataGrid(props: Props) {
    const increaseFetch = debounce(() => {
        props.dispatch({
            type: "INCREASE_FETCH",
        });
    });

    function getData(rowIndex: number, cellIndex: number) {
        if (props.state.fetchRowCount < rowIndex + 20) {
            increaseFetch();
        }

        if (!props.state.data) {
            return null;
        }
        if (props.state.data.length <= rowIndex) {
            return null;
        }
        return props.state.data[rowIndex][cellIndex];
    }

    function getId(rowIndex: number): string {
        return getData(rowIndex, props.state.view.columns.length + 2) as string;
    }

    function getRowClassName(index: number) {
        if (props.options.colorColumn || props.options.textColorColumn) {
            const color = getData(index, props.state.view.columns.length) as
                | string
                | "red";
            const textColor = getData(
                index,
                props.state.view.columns.length + 1
            ) as string | null;
            const target = props.options.colorAppliedColumn
                ? " .colored-column"
                : " .public_fixedDataTableCell_main";
            if (color) {
                return css({
                    ["& .public_fixedDataTableCell_main" + target]: {
                        backgroundColor: "inherit",
                    },
                    [".public_fixedDataTableRow_even" + target]: {
                        backgroundColor: color,
                        color: textColor || "black",
                    },
                    [".public_fixedDataTableRow_odd" + target]: {
                        backgroundColor: (tinyColor as any)(color)
                            .darken(10)
                            .toHexString(),
                        color: textColor || "black",
                    },
                }).toString();
            }
        }
        return "";
    }

    const portalContainerRef = React.useRef(null);

    const { width, height, ref } = useResizeDetector();

    return (
        <div
            style={{
                display: "flex",
                flexGrow: 1,
                flexDirection: "column",
            }}
        >
            <div ref={portalContainerRef} />
            {props.state.bulkAction && (
                <ShowBulkAction
                    state={props.state.bulkAction}
                    options={props.options}
                    dispatch={props.dispatch}
                />
            )}

            <div
                style={{
                    flexGrow: 1,
                    overflowY: "auto",
                    overflowX: "auto",
                    display: "flex",
                }}
                className="f-datagrid"
                ref={ref}
            >
                <Table
                    width={width || 10}
                    height={height || 10 - 20}
                    rowsCount={props.state.rowCount}
                    rowHeight={40}
                    headerHeight={100}
                    isColumnResizing={false}
                    isColumnReordering={false}
                    rowClassNameGetter={getRowClassName}
                    onColumnResizeEndCallback={(newColumnWidth, columnKey) =>
                        columnResizeEnd(props, newColumnWidth, columnKey)
                    }
                >
                    {props.state.bulkAction && (
                        <Column
                            allowCellsRecycling={true}
                            columnKey={"bulk"}
                            isResizable={true}
                            isReorderable={false}
                            header={<Cell />}
                            cell={(cellProps) => (
                                <Cell {...cellProps}>
                                    <Form.Check
                                        type="checkbox"
                                        checked={(
                                            props.state
                                                .bulkAction as BulkActionState
                                        ).selected.has(
                                            getId(cellProps.rowIndex)
                                        )}
                                        onChange={(
                                            event: React.ChangeEvent<HTMLInputElement>
                                        ) =>
                                            props.dispatch({
                                                type: "BULK_SET_SELECTED",
                                                id: getId(cellProps.rowIndex),
                                                value: (
                                                    event.target as HTMLInputElement
                                                ).checked,
                                            })
                                        }
                                    />
                                </Cell>
                            )}
                            width={50}
                        />
                    )}
                    {props.state.view.columns.map((column, index) => (
                        <Column
                            allowCellsRecycling={true}
                            columnKey={column.column}
                            isResizable={true}
                            isReorderable={false}
                            fixed={column.fixed}
                            key={column.column}
                            header={
                                <Cell
                                    onClick={(event) => {
                                        onHeaderClick(props, column.column);
                                    }}
                                >
                                    <span {...HEADER_NAME_STYLE}>
                                        {column.name}
                                    </span>{" "}
                                    {props.state.sort === column.column && (
                                        <FontAwesomeIcon
                                            style={{
                                                float: "right",
                                            }}
                                            icon={
                                                props.state.reversed
                                                    ? faSortDown
                                                    : faSortUp
                                            }
                                        />
                                    )}
                                    <div
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                        style={{
                                            paddingTop: "10px",
                                        }}
                                    >
                                        {renderFilter(
                                            resolveType(
                                                props.options.table,
                                                props.state.view.segment,
                                                column.column
                                            ),
                                            props.state.filters[
                                                column.column
                                            ] || "",
                                            (filter) =>
                                                props.dispatch({
                                                    type: "UPDATE_FILTER",
                                                    column: column.column,
                                                    filter: filter,
                                                }),
                                            Math.max(
                                                10,
                                                props.state.widths[
                                                    column.column
                                                ]
                                            )
                                        )}
                                    </div>
                                </Cell>
                            }
                            cell={(cellProps) => (
                                <Cell
                                    {...cellProps}
                                    className={
                                        column.column ===
                                        props.options.colorAppliedColumn
                                            ? "colored-column"
                                            : ""
                                    }
                                >
                                    {renderColumn(
                                        resolveType(
                                            props.options.table,
                                            props.state.view.segment,
                                            column.column
                                        ),
                                        getData(cellProps.rowIndex, index)
                                    )}
                                </Cell>
                            )}
                            width={Math.max(
                                10,
                                props.state.widths[column.column]
                            )}
                        />
                    ))}

                    <Column
                        header={
                            <Cell className="f-topaction">
                                {props.options.topActionCell &&
                                    props.options.topActionCell()}
                            </Cell>
                        }
                        fixedRight={true}
                        cell={(cellProps) => (
                            <Cell {...cellProps} className="f-sideaction">
                                {props.options.actionCell &&
                                    props.state.data &&
                                    props.state.data.length >
                                        cellProps.rowIndex &&
                                    props.options.actionCell(
                                        props.state.data[
                                            cellProps.rowIndex
                                        ].slice(
                                            props.state.view.columns.length + 2
                                        )
                                    )}
                            </Cell>
                        )}
                        width={props.options.actionCellWidth || 0}
                    />
                </Table>
            </div>
        </div>
    );
}
