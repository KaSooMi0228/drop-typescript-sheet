import React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
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
import EstimateActionCalculatorWidget from "./EstimateActionCalculatorWidget.widget";
import EstimateActionDetailsWidget from "./EstimateActionDetailsWidget.widget";
import EstimateActionFinishScheduleWidget from "./EstimateActionFinishScheduleWidget.widget";
import EstimateActionMarkupWidget from "./EstimateActionMarkupWidget.widget";
import EstimateActionUnitRateWidget from "./EstimateActionUnitRateWidget.widget";
import EstimateActionUnitRateWithMarkupWidget from "./EstimateActionUnitRateWithMarkupWidget.widget";
import { EstimateAction, ESTIMATE_ACTION_META } from "./table";

export type Data = EstimateAction;
export const ESTIMATE_ACTION_WIDGET_META = ESTIMATE_ACTION_META;

export type EstimateActionWidgetTypes = keyof typeof Subs;

export type ExtraProps = {
    widget: EstimateActionWidgetTypes;
    contingency: boolean;
};

export const Subs = {
    details: EstimateActionDetailsWidget,
    calculator: EstimateActionCalculatorWidget,
    finishSchedule: EstimateActionFinishScheduleWidget,
    markup: EstimateActionMarkupWidget,
    unitRate: EstimateActionUnitRateWidget,
    unitRateWithMarkup: EstimateActionUnitRateWithMarkupWidget,
};

function Component(props: Props) {
    const Component = widgets[props.widget];
    return <Component contingency={props.contingency} />;
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Subs.details> &
    WidgetContext<typeof Subs.calculator> &
    WidgetContext<typeof Subs.finishSchedule> &
    WidgetContext<typeof Subs.markup> &
    WidgetContext<typeof Subs.unitRate> &
    WidgetContext<typeof Subs.unitRateWithMarkup>;
type BaseState = {
    details: WidgetState<typeof Subs.details>;
    calculator: WidgetState<typeof Subs.calculator>;
    finishSchedule: WidgetState<typeof Subs.finishSchedule>;
    markup: WidgetState<typeof Subs.markup>;
    unitRate: WidgetState<typeof Subs.unitRate>;
    unitRateWithMarkup: WidgetState<typeof Subs.unitRateWithMarkup>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "DETAILS"; action: WidgetAction<typeof Subs.details> }
    | { type: "CALCULATOR"; action: WidgetAction<typeof Subs.calculator> }
    | {
          type: "FINISH_SCHEDULE";
          action: WidgetAction<typeof Subs.finishSchedule>;
      }
    | { type: "MARKUP"; action: WidgetAction<typeof Subs.markup> }
    | { type: "UNIT_RATE"; action: WidgetAction<typeof Subs.unitRate> }
    | {
          type: "UNIT_RATE_WITH_MARKUP";
          action: WidgetAction<typeof Subs.unitRateWithMarkup>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Subs.details, data, cache, "details", errors);
    subvalidate(Subs.calculator, data, cache, "calculator", errors);
    subvalidate(Subs.finishSchedule, data, cache, "finishSchedule", errors);
    subvalidate(Subs.markup, data, cache, "markup", errors);
    subvalidate(Subs.unitRate, data, cache, "unitRate", errors);
    subvalidate(
        Subs.unitRateWithMarkup,
        data,
        cache,
        "unitRateWithMarkup",
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
        case "DETAILS": {
            const inner = Subs.details.reduce(
                state.details,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, details: inner.state },
                data: inner.data,
            };
        }
        case "CALCULATOR": {
            const inner = Subs.calculator.reduce(
                state.calculator,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, calculator: inner.state },
                data: inner.data,
            };
        }
        case "FINISH_SCHEDULE": {
            const inner = Subs.finishSchedule.reduce(
                state.finishSchedule,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, finishSchedule: inner.state },
                data: inner.data,
            };
        }
        case "MARKUP": {
            const inner = Subs.markup.reduce(
                state.markup,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, markup: inner.state },
                data: inner.data,
            };
        }
        case "UNIT_RATE": {
            const inner = Subs.unitRate.reduce(
                state.unitRate,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, unitRate: inner.state },
                data: inner.data,
            };
        }
        case "UNIT_RATE_WITH_MARKUP": {
            const inner = Subs.unitRateWithMarkup.reduce(
                state.unitRateWithMarkup,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, unitRateWithMarkup: inner.state },
                data: inner.data,
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
    details: function (
        props: WidgetExtraProps<typeof Subs.details> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DETAILS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "details", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.details.component
                state={context.state.details}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Details"}
            />
        );
    },
    calculator: function (
        props: WidgetExtraProps<typeof Subs.calculator> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CALCULATOR",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "calculator", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.calculator.component
                state={context.state.calculator}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Calculator"}
            />
        );
    },
    finishSchedule: function (
        props: WidgetExtraProps<typeof Subs.finishSchedule> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "FINISH_SCHEDULE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "finishSchedule", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.finishSchedule.component
                state={context.state.finishSchedule}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Finish Schedule"}
            />
        );
    },
    markup: function (
        props: WidgetExtraProps<typeof Subs.markup> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MARKUP",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "markup", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.markup.component
                state={context.state.markup}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Markup"}
            />
        );
    },
    unitRate: function (
        props: WidgetExtraProps<typeof Subs.unitRate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "UNIT_RATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "unitRate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.unitRate.component
                state={context.state.unitRate}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Unit Rate"}
            />
        );
    },
    unitRateWithMarkup: function (
        props: WidgetExtraProps<typeof Subs.unitRateWithMarkup> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "UNIT_RATE_WITH_MARKUP",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "unitRateWithMarkup",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Subs.unitRateWithMarkup.component
                state={context.state.unitRateWithMarkup}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Unit Rate with Markup"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ESTIMATE_ACTION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let detailsState;
        {
            const inner = Subs.details.initialize(
                data,
                subcontext,
                subparameters.details
            );
            detailsState = inner.state;
            data = inner.data;
        }
        let calculatorState;
        {
            const inner = Subs.calculator.initialize(
                data,
                subcontext,
                subparameters.calculator
            );
            calculatorState = inner.state;
            data = inner.data;
        }
        let finishScheduleState;
        {
            const inner = Subs.finishSchedule.initialize(
                data,
                subcontext,
                subparameters.finishSchedule
            );
            finishScheduleState = inner.state;
            data = inner.data;
        }
        let markupState;
        {
            const inner = Subs.markup.initialize(
                data,
                subcontext,
                subparameters.markup
            );
            markupState = inner.state;
            data = inner.data;
        }
        let unitRateState;
        {
            const inner = Subs.unitRate.initialize(
                data,
                subcontext,
                subparameters.unitRate
            );
            unitRateState = inner.state;
            data = inner.data;
        }
        let unitRateWithMarkupState;
        {
            const inner = Subs.unitRateWithMarkup.initialize(
                data,
                subcontext,
                subparameters.unitRateWithMarkup
            );
            unitRateWithMarkupState = inner.state;
            data = inner.data;
        }
        let state = {
            initialParameters: parameters,
            details: detailsState,
            calculator: calculatorState,
            finishSchedule: finishScheduleState,
            markup: markupState,
            unitRate: unitRateState,
            unitRateWithMarkup: unitRateWithMarkupState,
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
                <RecordContext meta={ESTIMATE_ACTION_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    details: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.details>
    >;
    calculator: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.calculator>
    >;
    finishSchedule: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.finishSchedule>
    >;
    markup: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.markup>
    >;
    unitRate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.unitRate>
    >;
    unitRateWithMarkup: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.unitRateWithMarkup>
    >;
};
// END MAGIC -- DO NOT EDIT
