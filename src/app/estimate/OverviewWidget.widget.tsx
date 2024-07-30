import * as React from "react";
import { Button } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { FormField, FormWrapper } from "../../clay/widgets/FormField";
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
import EstimateCommonWidget from "./EstimateCommonWidget.widget";
import { Estimate, ESTIMATE_META } from "./table";

export type Data = Estimate;

export const Fields = {
    baseHourRate: FormField(MoneyWidget),
    common: EstimateCommonWidget,
};

export function actionResetAllHourlyRates(state: State, data: Estimate) {
    return {
        state,
        data: {
            ...data,
            actions: data.actions.map((action) => ({
                ...action,
                hourRate: null,
            })),
        },
    };
}

function Component(props: Props) {
    const onClearAllHourRates = React.useCallback(() => {
        if (
            window.confirm(
                "Are you sure you want to revert all hourly rates to the base rate?"
            )
        ) {
            props.dispatch({
                type: "RESET_ALL_HOURLY_RATES",
            });
        }
    }, [props.dispatch]);
    return (
        <>
            <div>
                <span style={{ display: "inline-block" }}>
                    <widgets.baseHourRate label="Base Hourly Rate" />
                </span>
                <span style={{ display: "inline-block", marginLeft: "1em" }}>
                    <FormWrapper label={<>&nbsp;</>}>
                        <Button variant="danger" onClick={onClearAllHourRates}>
                            Revert All
                        </Button>
                    </FormWrapper>
                </span>
            </div>
            <widgets.common />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.baseHourRate> &
    WidgetContext<typeof Fields.common>;
type ExtraProps = {};
type BaseState = {
    baseHourRate: WidgetState<typeof Fields.baseHourRate>;
    common: WidgetState<typeof Fields.common>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "BASE_HOUR_RATE";
          action: WidgetAction<typeof Fields.baseHourRate>;
      }
    | { type: "COMMON"; action: WidgetAction<typeof Fields.common> }
    | { type: "RESET_ALL_HOURLY_RATES" };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.baseHourRate,
        data.baseHourRate,
        cache,
        "baseHourRate",
        errors
    );
    subvalidate(Fields.common, data.common, cache, "common", errors);
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
        case "BASE_HOUR_RATE": {
            const inner = Fields.baseHourRate.reduce(
                state.baseHourRate,
                data.baseHourRate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, baseHourRate: inner.state },
                data: { ...data, baseHourRate: inner.data },
            };
        }
        case "COMMON": {
            const inner = Fields.common.reduce(
                state.common,
                data.common,
                action.action,
                subcontext
            );
            return {
                state: { ...state, common: inner.state },
                data: { ...data, common: inner.data },
            };
        }
        case "RESET_ALL_HOURLY_RATES":
            return actionResetAllHourlyRates(state, data);
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
    baseHourRate: function (
        props: WidgetExtraProps<typeof Fields.baseHourRate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "BASE_HOUR_RATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "baseHourRate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.baseHourRate.component
                state={context.state.baseHourRate}
                data={context.data.baseHourRate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Base Hour Rate"}
            />
        );
    },
    common: function (
        props: WidgetExtraProps<typeof Fields.common> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMMON",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "common", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.common.component
                state={context.state.common}
                data={context.data.common}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Common"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ESTIMATE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let baseHourRateState;
        {
            const inner = Fields.baseHourRate.initialize(
                data.baseHourRate,
                subcontext,
                subparameters.baseHourRate
            );
            baseHourRateState = inner.state;
            data = { ...data, baseHourRate: inner.data };
        }
        let commonState;
        {
            const inner = Fields.common.initialize(
                data.common,
                subcontext,
                subparameters.common
            );
            commonState = inner.state;
            data = { ...data, common: inner.data };
        }
        let state = {
            initialParameters: parameters,
            baseHourRate: baseHourRateState,
            common: commonState,
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
                <RecordContext meta={ESTIMATE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    baseHourRate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.baseHourRate>
    >;
    common: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.common>
    >;
};
// END MAGIC -- DO NOT EDIT
