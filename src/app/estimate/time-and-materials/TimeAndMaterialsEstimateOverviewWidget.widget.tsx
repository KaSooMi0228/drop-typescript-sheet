import * as React from "react";
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
import EstimateCommonWidget from "../EstimateCommonWidget.widget";
import {
    TimeAndMaterialsEstimate,
    TIME_AND_MATERIALS_ESTIMATE_META,
} from "./table";

export type Data = TimeAndMaterialsEstimate;
export const Fields = {
    common: EstimateCommonWidget,
};

function Component(props: Props) {
    return <widgets.common hideMaterials />;
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.common>;
type ExtraProps = {};
type BaseState = {
    common: WidgetState<typeof Fields.common>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "COMMON";
    action: WidgetAction<typeof Fields.common>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
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
    dataMeta: TIME_AND_MATERIALS_ESTIMATE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
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
                <RecordContext
                    meta={TIME_AND_MATERIALS_ESTIMATE_META}
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
    common: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.common>
    >;
};
// END MAGIC -- DO NOT EDIT
