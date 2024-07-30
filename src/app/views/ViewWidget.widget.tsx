import { Decimal } from "decimal.js";
import * as React from "react";
import { Button, Col, Row } from "react-bootstrap";
import ReactModal from "react-modal";
import { Dictionary } from "../../clay/common";
import { keyToLabel } from "../../clay/dataGrid/columns";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickCache } from "../../clay/quick-cache";
import { SaveDeleteButton } from "../../clay/save-delete-button";
import { FormField, OptionalFormField } from "../../clay/widgets/FormField";
import {
    RecordContext,
    RecordWidget,
    subStatus,
    subvalidate,
    ValidationError,
    Widget,
    WidgetAction,
    WidgetContext,
    WidgetExtraProps,
    WidgetProps,
    WidgetResult,
    WidgetState,
    WidgetStatus,
} from "../../clay/widgets/index";
import { LabelledBoolWidget } from "../../clay/widgets/labelled-bool-widget";
import { ListWidget } from "../../clay/widgets/ListWidget";
import { SelectWidget } from "../../clay/widgets/SelectWidget";
import { SwitchWidget } from "../../clay/widgets/SwitchWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { CONTENT_AREA, TABLE_STYLE } from "../styles";
import { TABLES_META } from "../tables";
import ColumnPicker from "./ColumnPicker";
import ColumnWidget, { resolveColumnLabel } from "./ColumnWidget.widget";
import { View, VIEW_META } from "./table";

export type Data = View;

export const Fields = {
    name: FormField(TextWidget),
    default: FormField(SwitchWidget),
    columns: ListWidget(ColumnWidget, {
        adaptEmpty: (column) => ({
            ...column,
            width: new Decimal("200"),
        }),
    }),
    defaultSortColumn: FormField(SelectWidget([])),
    defaultSortDirection: FormField(
        LabelledBoolWidget("Descending", "Ascending")
    ),
    segment: OptionalFormField(SelectWidget([])),
};

function prepareSaltProducts(response: any) {
    if (!response) {
        return [];
    }

    return response.map((row: any) => ({
        id: row[0],
        name: row[1],
        noUnits: row[2],
    }));
}

function Component(props: Props) {
    const [isAddingColumn, setAddingColumn] = React.useState(false);
    const showAddingColumn = React.useCallback(
        () => setAddingColumn(true),
        [setAddingColumn]
    );
    const hideAddingColumn = React.useCallback(
        () => setAddingColumn(false),
        [setAddingColumn]
    );

    const onSelectColumn = React.useCallback(
        (key, label) => {
            props.dispatch({
                type: "COLUMNS",
                action: {
                    type: "NEW",
                    actions: [
                        {
                            type: "COLUMN",
                            action: {
                                type: "SET",
                                value: key,
                            },
                        },
                        {
                            type: "NAME",
                            action: {
                                type: "SET",
                                value: label,
                            },
                        },
                    ],
                },
            });
            hideAddingColumn();
        },
        [props.dispatch, hideAddingColumn]
    );

    const cache = useQuickCache();

    return (
        <>
            <ReactModal
                isOpen={isAddingColumn}
                onRequestClose={hideAddingColumn}
                style={{
                    content: { display: "flex", flexDirection: "column" },
                }}
            >
                <ColumnPicker
                    table={props.data.table}
                    selectColumn={onSelectColumn}
                />
            </ReactModal>
            <Row>
                <Col>
                    <widgets.name />
                </Col>
                <Col>
                    <widgets.defaultSortColumn
                        options={props.data.columns.map((column) => ({
                            value: column.column,
                            label: resolveColumnLabel(
                                cache,
                                props.data.table,
                                column.column
                            ),
                        }))}
                    />
                </Col>
                <Col>
                    <widgets.segment
                        options={Object.keys(
                            TABLES_META[props.data.table].segments
                        ).map((key) => ({
                            value: key,
                            label: keyToLabel(key),
                        }))}
                        clearable
                    />
                </Col>
                <Col>
                    <widgets.defaultSortDirection />
                </Col>
                <Col>
                    <widgets.default label="Default View" />
                </Col>
            </Row>
            <div {...CONTENT_AREA}>
                <table {...TABLE_STYLE}>
                    <thead>
                        <tr>
                            <th />
                            <th>Column</th>
                            <th>Name</th>
                            <th style={{ width: "8em" }}>Width (pixels)</th>
                            <th>Filter</th>
                            <th>Fixed</th>
                        </tr>
                    </thead>

                    <widgets.columns
                        containerClass="tbody"
                        itemProps={{
                            table: props.data.table,
                            segment: props.data.segment,
                        }}
                    />
                    <tfoot>
                        <tr>
                            <td />
                            <td>
                                <Button onClick={showAddingColumn}>
                                    Add Column
                                </Button>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <SaveDeleteButton noun="View" duplicate />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.default> &
    WidgetContext<typeof Fields.columns> &
    WidgetContext<typeof Fields.defaultSortColumn> &
    WidgetContext<typeof Fields.defaultSortDirection> &
    WidgetContext<typeof Fields.segment>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    default: WidgetState<typeof Fields.default>;
    columns: WidgetState<typeof Fields.columns>;
    defaultSortColumn: WidgetState<typeof Fields.defaultSortColumn>;
    defaultSortDirection: WidgetState<typeof Fields.defaultSortDirection>;
    segment: WidgetState<typeof Fields.segment>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "DEFAULT"; action: WidgetAction<typeof Fields.default> }
    | { type: "COLUMNS"; action: WidgetAction<typeof Fields.columns> }
    | {
          type: "DEFAULT_SORT_COLUMN";
          action: WidgetAction<typeof Fields.defaultSortColumn>;
      }
    | {
          type: "DEFAULT_SORT_DIRECTION";
          action: WidgetAction<typeof Fields.defaultSortDirection>;
      }
    | { type: "SEGMENT"; action: WidgetAction<typeof Fields.segment> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.default, data.default, cache, "default", errors);
    subvalidate(Fields.columns, data.columns, cache, "columns", errors);
    subvalidate(
        Fields.defaultSortColumn,
        data.defaultSortColumn,
        cache,
        "defaultSortColumn",
        errors
    );
    subvalidate(
        Fields.defaultSortDirection,
        data.defaultSortDirection,
        cache,
        "defaultSortDirection",
        errors
    );
    subvalidate(Fields.segment, data.segment, cache, "segment", errors);
    return errors;
}
function baseReduce(
    state: State,
    data: Data,
    action: BaseAction,
    context: Context
): WidgetResult<State, Data> {
    let subcontext = context;
    switch (action.type) {
        case "NAME": {
            const inner = Fields.name.reduce(
                state.name,
                data.name,
                action.action,
                subcontext
            );
            return {
                state: { ...state, name: inner.state },
                data: { ...data, name: inner.data },
            };
        }
        case "DEFAULT": {
            const inner = Fields.default.reduce(
                state.default,
                data.default,
                action.action,
                subcontext
            );
            return {
                state: { ...state, default: inner.state },
                data: { ...data, default: inner.data },
            };
        }
        case "COLUMNS": {
            const inner = Fields.columns.reduce(
                state.columns,
                data.columns,
                action.action,
                subcontext
            );
            return {
                state: { ...state, columns: inner.state },
                data: { ...data, columns: inner.data },
            };
        }
        case "DEFAULT_SORT_COLUMN": {
            const inner = Fields.defaultSortColumn.reduce(
                state.defaultSortColumn,
                data.defaultSortColumn,
                action.action,
                subcontext
            );
            return {
                state: { ...state, defaultSortColumn: inner.state },
                data: { ...data, defaultSortColumn: inner.data },
            };
        }
        case "DEFAULT_SORT_DIRECTION": {
            const inner = Fields.defaultSortDirection.reduce(
                state.defaultSortDirection,
                data.defaultSortDirection,
                action.action,
                subcontext
            );
            return {
                state: { ...state, defaultSortDirection: inner.state },
                data: { ...data, defaultSortDirection: inner.data },
            };
        }
        case "SEGMENT": {
            const inner = Fields.segment.reduce(
                state.segment,
                data.segment,
                action.action,
                subcontext
            );
            return {
                state: { ...state, segment: inner.state },
                data: { ...data, segment: inner.data },
            };
        }
    }
}
export type ReactContextType = {
    state: State;
    data: Data;
    dispatch: (action: Action) => void;
    status: WidgetStatus;
};
export const ReactContext = React.createContext<ReactContextType | undefined>(
    undefined
);
export const widgets: Widgets = {
    name: function (
        props: WidgetExtraProps<typeof Fields.name> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "NAME", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "name", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.name.component
                state={context.state.name}
                data={context.data.name}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Name"}
            />
        );
    },
    default: function (
        props: WidgetExtraProps<typeof Fields.default> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DEFAULT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "default", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.default.component
                state={context.state.default}
                data={context.data.default}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Default"}
            />
        );
    },
    columns: function (
        props: WidgetExtraProps<typeof Fields.columns> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COLUMNS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "columns", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.columns.component
                state={context.state.columns}
                data={context.data.columns}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Columns"}
            />
        );
    },
    defaultSortColumn: function (
        props: WidgetExtraProps<typeof Fields.defaultSortColumn> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DEFAULT_SORT_COLUMN",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "defaultSortColumn",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.defaultSortColumn.component
                state={context.state.defaultSortColumn}
                data={context.data.defaultSortColumn}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Default Sort Column"}
            />
        );
    },
    defaultSortDirection: function (
        props: WidgetExtraProps<typeof Fields.defaultSortDirection> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DEFAULT_SORT_DIRECTION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "defaultSortDirection",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.defaultSortDirection.component
                state={context.state.defaultSortDirection}
                data={context.data.defaultSortDirection}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Default Sort Direction"}
            />
        );
    },
    segment: function (
        props: WidgetExtraProps<typeof Fields.segment> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SEGMENT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "segment", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.segment.component
                state={context.state.segment}
                data={context.data.segment}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Segment"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: VIEW_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let nameState;
        {
            const inner = Fields.name.initialize(
                data.name,
                subcontext,
                subparameters.name
            );
            nameState = inner.state;
            data = { ...data, name: inner.data };
        }
        let defaultState;
        {
            const inner = Fields.default.initialize(
                data.default,
                subcontext,
                subparameters.default
            );
            defaultState = inner.state;
            data = { ...data, default: inner.data };
        }
        let columnsState;
        {
            const inner = Fields.columns.initialize(
                data.columns,
                subcontext,
                subparameters.columns
            );
            columnsState = inner.state;
            data = { ...data, columns: inner.data };
        }
        let defaultSortColumnState;
        {
            const inner = Fields.defaultSortColumn.initialize(
                data.defaultSortColumn,
                subcontext,
                subparameters.defaultSortColumn
            );
            defaultSortColumnState = inner.state;
            data = { ...data, defaultSortColumn: inner.data };
        }
        let defaultSortDirectionState;
        {
            const inner = Fields.defaultSortDirection.initialize(
                data.defaultSortDirection,
                subcontext,
                subparameters.defaultSortDirection
            );
            defaultSortDirectionState = inner.state;
            data = { ...data, defaultSortDirection: inner.data };
        }
        let segmentState;
        {
            const inner = Fields.segment.initialize(
                data.segment,
                subcontext,
                subparameters.segment
            );
            segmentState = inner.state;
            data = { ...data, segment: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            default: defaultState,
            columns: columnsState,
            defaultSortColumn: defaultSortColumnState,
            defaultSortDirection: defaultSortDirectionState,
            segment: segmentState,
        };
        return {
            state,
            data,
        };
    },
    validate: baseValidate,
    component: React.memo((props: Props) => {
        return (
            <ReactContext.Provider value={props}>
                <RecordContext meta={VIEW_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    name: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.name>
    >;
    default: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.default>
    >;
    columns: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.columns>
    >;
    defaultSortColumn: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.defaultSortColumn>
    >;
    defaultSortDirection: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.defaultSortDirection>
    >;
    segment: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.segment>
    >;
};
// END MAGIC -- DO NOT EDIT
