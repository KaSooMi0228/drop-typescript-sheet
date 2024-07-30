import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
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
import { MoneyWidget } from "../../clay/widgets/money-widget";
import { QuantityWidget } from "../../clay/widgets/number-widget";
import { TableRow } from "../../clay/widgets/TableRow";
import { Targets, TARGETS_META } from "./table";

export type Data = Targets;

const Fields = {
    fiscalYear: QuantityWidget,
    quotingTarget: Optional(MoneyWidget),
    landingTarget: Optional(MoneyWidget),
    managingTarget: Optional(MoneyWidget),
};

function Component(props: Props) {
    return (
        <TableRow flexSizes>
            <widgets.fiscalYear suppressCommas />
            <widgets.quotingTarget style={{ width: "10em" }} />
            <widgets.landingTarget style={{ width: "10em" }} />
            <widgets.managingTarget style={{ width: "10em" }} />
        </TableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.fiscalYear> &
    WidgetContext<typeof Fields.quotingTarget> &
    WidgetContext<typeof Fields.landingTarget> &
    WidgetContext<typeof Fields.managingTarget>;
type ExtraProps = {};
type BaseState = {
    fiscalYear: WidgetState<typeof Fields.fiscalYear>;
    quotingTarget: WidgetState<typeof Fields.quotingTarget>;
    landingTarget: WidgetState<typeof Fields.landingTarget>;
    managingTarget: WidgetState<typeof Fields.managingTarget>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "FISCAL_YEAR"; action: WidgetAction<typeof Fields.fiscalYear> }
    | {
          type: "QUOTING_TARGET";
          action: WidgetAction<typeof Fields.quotingTarget>;
      }
    | {
          type: "LANDING_TARGET";
          action: WidgetAction<typeof Fields.landingTarget>;
      }
    | {
          type: "MANAGING_TARGET";
          action: WidgetAction<typeof Fields.managingTarget>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.fiscalYear,
        data.fiscalYear,
        cache,
        "fiscalYear",
        errors
    );
    subvalidate(
        Fields.quotingTarget,
        data.quotingTarget,
        cache,
        "quotingTarget",
        errors
    );
    subvalidate(
        Fields.landingTarget,
        data.landingTarget,
        cache,
        "landingTarget",
        errors
    );
    subvalidate(
        Fields.managingTarget,
        data.managingTarget,
        cache,
        "managingTarget",
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
        case "FISCAL_YEAR": {
            const inner = Fields.fiscalYear.reduce(
                state.fiscalYear,
                data.fiscalYear,
                action.action,
                subcontext
            );
            return {
                state: { ...state, fiscalYear: inner.state },
                data: { ...data, fiscalYear: inner.data },
            };
        }
        case "QUOTING_TARGET": {
            const inner = Fields.quotingTarget.reduce(
                state.quotingTarget,
                data.quotingTarget,
                action.action,
                subcontext
            );
            return {
                state: { ...state, quotingTarget: inner.state },
                data: { ...data, quotingTarget: inner.data },
            };
        }
        case "LANDING_TARGET": {
            const inner = Fields.landingTarget.reduce(
                state.landingTarget,
                data.landingTarget,
                action.action,
                subcontext
            );
            return {
                state: { ...state, landingTarget: inner.state },
                data: { ...data, landingTarget: inner.data },
            };
        }
        case "MANAGING_TARGET": {
            const inner = Fields.managingTarget.reduce(
                state.managingTarget,
                data.managingTarget,
                action.action,
                subcontext
            );
            return {
                state: { ...state, managingTarget: inner.state },
                data: { ...data, managingTarget: inner.data },
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
    fiscalYear: function (
        props: WidgetExtraProps<typeof Fields.fiscalYear> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "FISCAL_YEAR",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "fiscalYear", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.fiscalYear.component
                state={context.state.fiscalYear}
                data={context.data.fiscalYear}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Fiscal Year"}
            />
        );
    },
    quotingTarget: function (
        props: WidgetExtraProps<typeof Fields.quotingTarget> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "QUOTING_TARGET",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "quotingTarget", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.quotingTarget.component
                state={context.state.quotingTarget}
                data={context.data.quotingTarget}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Quoting Target"}
            />
        );
    },
    landingTarget: function (
        props: WidgetExtraProps<typeof Fields.landingTarget> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "LANDING_TARGET",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "landingTarget", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.landingTarget.component
                state={context.state.landingTarget}
                data={context.data.landingTarget}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Landing Target"}
            />
        );
    },
    managingTarget: function (
        props: WidgetExtraProps<typeof Fields.managingTarget> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MANAGING_TARGET",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "managingTarget", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.managingTarget.component
                state={context.state.managingTarget}
                data={context.data.managingTarget}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Managing Target"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: TARGETS_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let fiscalYearState;
        {
            const inner = Fields.fiscalYear.initialize(
                data.fiscalYear,
                subcontext,
                subparameters.fiscalYear
            );
            fiscalYearState = inner.state;
            data = { ...data, fiscalYear: inner.data };
        }
        let quotingTargetState;
        {
            const inner = Fields.quotingTarget.initialize(
                data.quotingTarget,
                subcontext,
                subparameters.quotingTarget
            );
            quotingTargetState = inner.state;
            data = { ...data, quotingTarget: inner.data };
        }
        let landingTargetState;
        {
            const inner = Fields.landingTarget.initialize(
                data.landingTarget,
                subcontext,
                subparameters.landingTarget
            );
            landingTargetState = inner.state;
            data = { ...data, landingTarget: inner.data };
        }
        let managingTargetState;
        {
            const inner = Fields.managingTarget.initialize(
                data.managingTarget,
                subcontext,
                subparameters.managingTarget
            );
            managingTargetState = inner.state;
            data = { ...data, managingTarget: inner.data };
        }
        let state = {
            initialParameters: parameters,
            fiscalYear: fiscalYearState,
            quotingTarget: quotingTargetState,
            landingTarget: landingTargetState,
            managingTarget: managingTargetState,
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
                <RecordContext meta={TARGETS_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    fiscalYear: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.fiscalYear>
    >;
    quotingTarget: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.quotingTarget>
    >;
    landingTarget: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.landingTarget>
    >;
    managingTarget: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.managingTarget>
    >;
};
// END MAGIC -- DO NOT EDIT
