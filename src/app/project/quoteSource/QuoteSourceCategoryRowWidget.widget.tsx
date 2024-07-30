import { ColumnCellProps } from "fixed-data-table-2";
import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { CheckboxWidget } from "../../../clay/widgets/CheckboxWidget";
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
} from "../../../clay/widgets/index";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { QuoteSourceCategory, QUOTE_SOURCE_CATEGORY_META } from "./table";

export type Data = QuoteSourceCategory;

export const Fields = {
    name: TextWidget,
    active: CheckboxWidget,
    requireDetail: CheckboxWidget,
};

export type ExtraProps = ColumnCellProps;

function Component(props: Props): React.Component {
    throw new Error("not supported");
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.active> &
    WidgetContext<typeof Fields.requireDetail>;
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    active: WidgetState<typeof Fields.active>;
    requireDetail: WidgetState<typeof Fields.requireDetail>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "ACTIVE"; action: WidgetAction<typeof Fields.active> }
    | {
          type: "REQUIRE_DETAIL";
          action: WidgetAction<typeof Fields.requireDetail>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.active, data.active, cache, "active", errors);
    subvalidate(
        Fields.requireDetail,
        data.requireDetail,
        cache,
        "requireDetail",
        errors
    );
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
        case "ACTIVE": {
            const inner = Fields.active.reduce(
                state.active,
                data.active,
                action.action,
                subcontext
            );
            return {
                state: { ...state, active: inner.state },
                data: { ...data, active: inner.data },
            };
        }
        case "REQUIRE_DETAIL": {
            const inner = Fields.requireDetail.reduce(
                state.requireDetail,
                data.requireDetail,
                action.action,
                subcontext
            );
            return {
                state: { ...state, requireDetail: inner.state },
                data: { ...data, requireDetail: inner.data },
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
    active: function (
        props: WidgetExtraProps<typeof Fields.active> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ACTIVE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "active", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.active.component
                state={context.state.active}
                data={context.data.active}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Active"}
            />
        );
    },
    requireDetail: function (
        props: WidgetExtraProps<typeof Fields.requireDetail> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "REQUIRE_DETAIL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "requireDetail", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.requireDetail.component
                state={context.state.requireDetail}
                data={context.data.requireDetail}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Require Detail"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: QUOTE_SOURCE_CATEGORY_META,
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
        let activeState;
        {
            const inner = Fields.active.initialize(
                data.active,
                subcontext,
                subparameters.active
            );
            activeState = inner.state;
            data = { ...data, active: inner.data };
        }
        let requireDetailState;
        {
            const inner = Fields.requireDetail.initialize(
                data.requireDetail,
                subcontext,
                subparameters.requireDetail
            );
            requireDetailState = inner.state;
            data = { ...data, requireDetail: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            active: activeState,
            requireDetail: requireDetailState,
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
                <RecordContext
                    meta={QUOTE_SOURCE_CATEGORY_META}
                    value={props.data}
                >
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
    active: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.active>
    >;
    requireDetail: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.requireDetail>
    >;
};
// END MAGIC -- DO NOT EDIT
