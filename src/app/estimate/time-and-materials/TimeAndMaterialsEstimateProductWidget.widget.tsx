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
import { MoneyWidget } from "../../../clay/widgets/money-widget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import {
    TimeAndMaterialsEstimateProduct,
    TIME_AND_MATERIALS_ESTIMATE_PRODUCT_META,
} from "./table";

export type Data = TimeAndMaterialsEstimateProduct;

const Fields = {
    name: TextWidget,
    cost: MoneyWidget,
};

function Component(props: Props) {
    return <></>;
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.cost>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    cost: WidgetState<typeof Fields.cost>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "COST"; action: WidgetAction<typeof Fields.cost> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.cost, data.cost, cache, "cost", errors);
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
        case "COST": {
            const inner = Fields.cost.reduce(
                state.cost,
                data.cost,
                action.action,
                subcontext
            );
            return {
                state: { ...state, cost: inner.state },
                data: { ...data, cost: inner.data },
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
    cost: function (
        props: WidgetExtraProps<typeof Fields.cost> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "COST", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "cost", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.cost.component
                state={context.state.cost}
                data={context.data.cost}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Cost"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: TIME_AND_MATERIALS_ESTIMATE_PRODUCT_META,
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
        let costState;
        {
            const inner = Fields.cost.initialize(
                data.cost,
                subcontext,
                subparameters.cost
            );
            costState = inner.state;
            data = { ...data, cost: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            cost: costState,
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
                    meta={TIME_AND_MATERIALS_ESTIMATE_PRODUCT_META}
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
    cost: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.cost>
    >;
};
// END MAGIC -- DO NOT EDIT
