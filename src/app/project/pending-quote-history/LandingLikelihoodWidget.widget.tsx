import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { ValidationError } from "../../../clay/widgets";
import {
    RecordContext,
    RecordWidget,
    subStatus,
    subvalidate,
    Widget,
    WidgetAction,
    WidgetContext,
    WidgetExtraProps,
    WidgetProps,
    WidgetResult,
    WidgetState,
    WidgetStatus,
} from "../../../clay/widgets/index";
import { QuantityWidget } from "../../../clay/widgets/number-widget";
import { PercentageWidget } from "../../../clay/widgets/percentage-widget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { LandingLikelihood, LANDING_LIKELIHOOD_META } from "./table";

export type Data = LandingLikelihood;

export const Fields = {
    number: QuantityWidget,
    name: TextWidget,
    weighting: PercentageWidget,
};

function Component(props: Props) {
    return <></>;
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.number> &
    WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.weighting>;
type ExtraProps = {};
type BaseState = {
    number: WidgetState<typeof Fields.number>;
    name: WidgetState<typeof Fields.name>;
    weighting: WidgetState<typeof Fields.weighting>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NUMBER"; action: WidgetAction<typeof Fields.number> }
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "WEIGHTING"; action: WidgetAction<typeof Fields.weighting> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.number, data.number, cache, "number", errors);
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.weighting, data.weighting, cache, "weighting", errors);
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
        case "NUMBER": {
            const inner = Fields.number.reduce(
                state.number,
                data.number,
                action.action,
                subcontext
            );
            return {
                state: { ...state, number: inner.state },
                data: { ...data, number: inner.data },
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
        case "WEIGHTING": {
            const inner = Fields.weighting.reduce(
                state.weighting,
                data.weighting,
                action.action,
                subcontext
            );
            return {
                state: { ...state, weighting: inner.state },
                data: { ...data, weighting: inner.data },
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
    number: function (
        props: WidgetExtraProps<typeof Fields.number> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "NUMBER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "number", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.number.component
                state={context.state.number}
                data={context.data.number}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Number"}
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
    weighting: function (
        props: WidgetExtraProps<typeof Fields.weighting> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "WEIGHTING",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "weighting", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.weighting.component
                state={context.state.weighting}
                data={context.data.weighting}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Weighting"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: LANDING_LIKELIHOOD_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let numberState;
        {
            const inner = Fields.number.initialize(
                data.number,
                subcontext,
                subparameters.number
            );
            numberState = inner.state;
            data = { ...data, number: inner.data };
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
        let weightingState;
        {
            const inner = Fields.weighting.initialize(
                data.weighting,
                subcontext,
                subparameters.weighting
            );
            weightingState = inner.state;
            data = { ...data, weighting: inner.data };
        }
        let state = {
            initialParameters: parameters,
            number: numberState,
            name: nameState,
            weighting: weightingState,
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
                    meta={LANDING_LIKELIHOOD_META}
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
    number: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.number>
    >;
    name: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.name>
    >;
    weighting: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.weighting>
    >;
};
// END MAGIC -- DO NOT EDIT
