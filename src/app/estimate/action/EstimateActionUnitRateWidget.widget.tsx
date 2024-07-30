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
    customUnitRate: DecimalDefaultWidget,
};

function Component(props: Props) {
    const resolvedEstimateAction = resolveEstimateAction(
        props.data,
        useRecordContext(ESTIMATE_META),
        true
    );
    return (
        <widgets.customUnitRate
            defaultData={resolvedEstimateAction.unitRate}
            money
            hideStatus
            readOnly={!props.contingency}
        />
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.customUnitRate>;
type BaseState = {
    customUnitRate: WidgetState<typeof Fields.customUnitRate>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "CUSTOM_UNIT_RATE";
    action: WidgetAction<typeof Fields.customUnitRate>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
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
    customUnitRate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.customUnitRate>
    >;
};
// END MAGIC -- DO NOT EDIT
