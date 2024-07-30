import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { css } from "glamor";
import * as React from "react";
import { Button } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { COLUMNS, keyToLabel } from "../../clay/dataGrid/columns";
import { resolveType } from "../../clay/dataGrid/DataGrid";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickCache } from "../../clay/quick-cache";
import { Optional } from "../../clay/widgets/FormField";
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
import { useListItemContext } from "../../clay/widgets/ListWidget";
import { QuantityWidget } from "../../clay/widgets/number-widget";
import { SwitchWidget } from "../../clay/widgets/SwitchWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { ROLE_META } from "../roles/table";
import { SALT_PRODUCT_META } from "../salt/table";
import { FilterWidget } from "./filter-widget";
import { Column, COLUMN_META } from "./table";

export type Data = Column;

type ExtraActions = {
    type: "SELECT_COLUMN";
    key: string;
    label: string;
};

function reduce(state: State, data: Column, action: Action, context: Context) {
    switch (action.type) {
        case "SELECT_COLUMN":
            return {
                state,
                data: {
                    ...data,
                    column: action.key,
                    name: action.label,
                },
            };
        default:
            return baseReduce(state, data, action, context);
    }
}

export type ExtraProps = {
    table: string;
    segment: string;
};

export const Fields = {
    column: TextWidget,
    name: TextWidget,
    width: QuantityWidget,
    filter: Optional(FilterWidget),
    fixed: SwitchWidget,
};

const COLUMN_BOX = css({});

export function resolveColumnLabel(
    cache: QuickCacheApi,
    table: string,
    column: string
) {
    const [main, key] = column.split("@");

    const columnData = COLUMNS[table][main];
    let name = null;
    switch (columnData?.subkeyType) {
        case "Role":
            name = cache.get(ROLE_META, key)?.name;
            break;
        case "SaltProduct":
            name = cache.get(SALT_PRODUCT_META, key)?.name;
            break;
    }
    return keyToLabel(main) + (name ? " > " + name : "");
}

function Component(props: Props) {
    const cache = useQuickCache();

    const listItemContext = useListItemContext();
    return (
        <tr {...listItemContext.draggableProps} {...COLUMN_BOX}>
            <td>{listItemContext.dragHandle}</td>
            <td>{resolveColumnLabel(cache, props.table, props.data.column)}</td>
            <td>
                <widgets.name />
            </td>
            <td>
                <widgets.width />
            </td>
            <td>
                {props.data.column && (
                    <widgets.filter
                        meta={resolveType(
                            props.table,
                            props.segment,
                            props.data.column
                        )}
                    />
                )}
            </td>
            <td>
                <widgets.fixed />
            </td>
            <td>
                {listItemContext.remove && (
                    <Button variant="danger" onClick={listItemContext.remove}>
                        <FontAwesomeIcon icon={faTrashAlt} />
                    </Button>
                )}
            </td>
        </tr>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.column> &
    WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.width> &
    WidgetContext<typeof Fields.filter> &
    WidgetContext<typeof Fields.fixed>;
type BaseState = {
    column: WidgetState<typeof Fields.column>;
    name: WidgetState<typeof Fields.name>;
    width: WidgetState<typeof Fields.width>;
    filter: WidgetState<typeof Fields.filter>;
    fixed: WidgetState<typeof Fields.fixed>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "COLUMN"; action: WidgetAction<typeof Fields.column> }
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "WIDTH"; action: WidgetAction<typeof Fields.width> }
    | { type: "FILTER"; action: WidgetAction<typeof Fields.filter> }
    | { type: "FIXED"; action: WidgetAction<typeof Fields.fixed> };

export type Action = ExtraActions | BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.column, data.column, cache, "column", errors);
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.width, data.width, cache, "width", errors);
    subvalidate(Fields.filter, data.filter, cache, "filter", errors);
    subvalidate(Fields.fixed, data.fixed, cache, "fixed", errors);
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
        case "COLUMN": {
            const inner = Fields.column.reduce(
                state.column,
                data.column,
                action.action,
                subcontext
            );
            return {
                state: { ...state, column: inner.state },
                data: { ...data, column: inner.data },
            };
        }
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
        case "WIDTH": {
            const inner = Fields.width.reduce(
                state.width,
                data.width,
                action.action,
                subcontext
            );
            return {
                state: { ...state, width: inner.state },
                data: { ...data, width: inner.data },
            };
        }
        case "FILTER": {
            const inner = Fields.filter.reduce(
                state.filter,
                data.filter,
                action.action,
                subcontext
            );
            return {
                state: { ...state, filter: inner.state },
                data: { ...data, filter: inner.data },
            };
        }
        case "FIXED": {
            const inner = Fields.fixed.reduce(
                state.fixed,
                data.fixed,
                action.action,
                subcontext
            );
            return {
                state: { ...state, fixed: inner.state },
                data: { ...data, fixed: inner.data },
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
    column: function (
        props: WidgetExtraProps<typeof Fields.column> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COLUMN",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "column", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.column.component
                state={context.state.column}
                data={context.data.column}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Column"}
            />
        );
    },
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
    width: function (
        props: WidgetExtraProps<typeof Fields.width> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "WIDTH", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "width", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.width.component
                state={context.state.width}
                data={context.data.width}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Width"}
            />
        );
    },
    filter: function (
        props: WidgetExtraProps<typeof Fields.filter> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "FILTER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "filter", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.filter.component
                state={context.state.filter}
                data={context.data.filter}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Filter"}
            />
        );
    },
    fixed: function (
        props: WidgetExtraProps<typeof Fields.fixed> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "FIXED", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "fixed", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.fixed.component
                state={context.state.fixed}
                data={context.data.fixed}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Fixed"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: COLUMN_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let columnState;
        {
            const inner = Fields.column.initialize(
                data.column,
                subcontext,
                subparameters.column
            );
            columnState = inner.state;
            data = { ...data, column: inner.data };
        }
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
        let widthState;
        {
            const inner = Fields.width.initialize(
                data.width,
                subcontext,
                subparameters.width
            );
            widthState = inner.state;
            data = { ...data, width: inner.data };
        }
        let filterState;
        {
            const inner = Fields.filter.initialize(
                data.filter,
                subcontext,
                subparameters.filter
            );
            filterState = inner.state;
            data = { ...data, filter: inner.data };
        }
        let fixedState;
        {
            const inner = Fields.fixed.initialize(
                data.fixed,
                subcontext,
                subparameters.fixed
            );
            fixedState = inner.state;
            data = { ...data, fixed: inner.data };
        }
        let state = {
            initialParameters: parameters,
            column: columnState,
            name: nameState,
            width: widthState,
            filter: filterState,
            fixed: fixedState,
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
                <RecordContext meta={COLUMN_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
};
export default Widget;
type Widgets = {
    column: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.column>
    >;
    name: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.name>
    >;
    width: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.width>
    >;
    filter: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.filter>
    >;
    fixed: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.fixed>
    >;
};
// END MAGIC -- DO NOT EDIT
