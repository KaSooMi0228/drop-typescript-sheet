import Decimal from "decimal.js";
import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { DecimalDefaultWidget } from "../../../clay/widgets/DecimalDefaultWidget";
import {
    RecordContext,
    RecordWidget,
    subStatus,
    subvalidate,
    useRecordContext,
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
import { MoneyWidget } from "../../../clay/widgets/money-widget";
import { NumberWidgetAction } from "../../../clay/widgets/number-widget";
import { ESTIMATE_META } from "../table";
import {
    EstimateAction,
    ESTIMATE_ACTION_META,
    resolveEstimateAction,
} from "./table";

export type Data = EstimateAction;

export type ExtraProps = {
    contingency: boolean;
};

const Fields = {
    hourRate: DecimalDefaultWidget,
    customUnitRate: DecimalDefaultWidget,
};

function Component(props: Props) {
    const resolvedEstimateAction = resolveEstimateAction(
        props.data,
        useRecordContext(ESTIMATE_META),
        true
    );

    const [state, setState] = React.useState<string | null>(null);
    const valueDispatch = React.useCallback(
        (action: NumberWidgetAction) => {
            switch (action.type) {
                case "BLUR":
                    setState(null);
                    break;
                case "RESET":
                    setState(null);
                    break;
                case "SET":
                    setState(action.value);
                    try {
                        const filtered = action.value.replace(/,/g, "");
                        const rateWithMarkup = new Decimal(filtered);
                        const rate = rateWithMarkup.dividedBy(
                            resolvedEstimateAction.markups.materials.plus(
                                new Decimal("1")
                            )
                        );
                        const baseUnitRate = rate.times(
                            props.data.unitIncrement
                        );
                        const baseMaterialsRate =
                            props.data.materialsRate.times(
                                props.data.materialsRatio
                            );
                        const baseHoursUnitRate =
                            baseUnitRate.minus(baseMaterialsRate);
                        const hourRate = baseHoursUnitRate.dividedBy(
                            props.data.hourRatio
                        );

                        props.dispatch({
                            type: "CUSTOM_UNIT_RATE",
                            action: {
                                type: "CLEAR",
                            },
                        });
                        props.dispatch({
                            type: "HOUR_RATE",
                            action: {
                                type: "SET",
                                value: hourRate.toString(),
                            },
                        });
                    } catch (error) {}
            }
        },
        [resolvedEstimateAction, props.dispatch, setState]
    );

    return (
        <MoneyWidget.component
            data={resolvedEstimateAction.rateWithMarkup}
            dispatch={valueDispatch}
            state={state}
            status={props.status}
            hideStatus={true}
        />
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.hourRate> &
    WidgetContext<typeof Fields.customUnitRate>;
type BaseState = {
    hourRate: WidgetState<typeof Fields.hourRate>;
    customUnitRate: WidgetState<typeof Fields.customUnitRate>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "HOUR_RATE"; action: WidgetAction<typeof Fields.hourRate> }
    | {
          type: "CUSTOM_UNIT_RATE";
          action: WidgetAction<typeof Fields.customUnitRate>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.hourRate, data.hourRate, cache, "hourRate", errors);
    subvalidate(
        Fields.customUnitRate,
        data.customUnitRate,
        cache,
        "customUnitRate",
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
        case "HOUR_RATE": {
            const inner = Fields.hourRate.reduce(
                state.hourRate,
                data.hourRate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, hourRate: inner.state },
                data: { ...data, hourRate: inner.data },
            };
        }
        case "CUSTOM_UNIT_RATE": {
            const inner = Fields.customUnitRate.reduce(
                state.customUnitRate,
                data.customUnitRate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, customUnitRate: inner.state },
                data: { ...data, customUnitRate: inner.data },
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
    hourRate: function (
        props: WidgetExtraProps<typeof Fields.hourRate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "HOUR_RATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "hourRate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.hourRate.component
                state={context.state.hourRate}
                data={context.data.hourRate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Hour Rate"}
            />
        );
    },
    customUnitRate: function (
        props: WidgetExtraProps<typeof Fields.customUnitRate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CUSTOM_UNIT_RATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "customUnitRate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.customUnitRate.component
                state={context.state.customUnitRate}
                data={context.data.customUnitRate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Custom Unit Rate"}
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
        let hourRateState;
        {
            const inner = Fields.hourRate.initialize(
                data.hourRate,
                subcontext,
                subparameters.hourRate
            );
            hourRateState = inner.state;
            data = { ...data, hourRate: inner.data };
        }
        let customUnitRateState;
        {
            const inner = Fields.customUnitRate.initialize(
                data.customUnitRate,
                subcontext,
                subparameters.customUnitRate
            );
            customUnitRateState = inner.state;
            data = { ...data, customUnitRate: inner.data };
        }
        let state = {
            initialParameters: parameters,
            hourRate: hourRateState,
            customUnitRate: customUnitRateState,
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
    hourRate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.hourRate>
    >;
    customUnitRate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.customUnitRate>
    >;
};
// END MAGIC -- DO NOT EDIT
