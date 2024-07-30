import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { DateWidget } from "../../clay/widgets/DateWidget";
import { FormField } from "../../clay/widgets/FormField";
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
import { TextAreaWidget } from "../../clay/widgets/TextAreaWidget";
import { EstimateDelay, ESTIMATE_DELAY_META } from "./table";

export type Data = EstimateDelay;

export const Fields = {
    message: FormField(TextAreaWidget),
    delayUntil: FormField(DateWidget),
};

function Component(props: Props) {
    return (
        <>
            <widgets.message label="Reason for delay" />
            <widgets.delayUntil />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.message> &
    WidgetContext<typeof Fields.delayUntil>;
type ExtraProps = {};
type BaseState = {
    message: WidgetState<typeof Fields.message>;
    delayUntil: WidgetState<typeof Fields.delayUntil>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "MESSAGE"; action: WidgetAction<typeof Fields.message> }
    | { type: "DELAY_UNTIL"; action: WidgetAction<typeof Fields.delayUntil> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.message, data.message, cache, "message", errors);
    subvalidate(
        Fields.delayUntil,
        data.delayUntil,
        cache,
        "delayUntil",
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
        case "MESSAGE": {
            const inner = Fields.message.reduce(
                state.message,
                data.message,
                action.action,
                subcontext
            );
            return {
                state: { ...state, message: inner.state },
                data: { ...data, message: inner.data },
            };
        }
        case "DELAY_UNTIL": {
            const inner = Fields.delayUntil.reduce(
                state.delayUntil,
                data.delayUntil,
                action.action,
                subcontext
            );
            return {
                state: { ...state, delayUntil: inner.state },
                data: { ...data, delayUntil: inner.data },
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
    message: function (
        props: WidgetExtraProps<typeof Fields.message> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MESSAGE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "message", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.message.component
                state={context.state.message}
                data={context.data.message}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Message"}
            />
        );
    },
    delayUntil: function (
        props: WidgetExtraProps<typeof Fields.delayUntil> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DELAY_UNTIL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "delayUntil", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.delayUntil.component
                state={context.state.delayUntil}
                data={context.data.delayUntil}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Delay Until"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ESTIMATE_DELAY_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let messageState;
        {
            const inner = Fields.message.initialize(
                data.message,
                subcontext,
                subparameters.message
            );
            messageState = inner.state;
            data = { ...data, message: inner.data };
        }
        let delayUntilState;
        {
            const inner = Fields.delayUntil.initialize(
                data.delayUntil,
                subcontext,
                subparameters.delayUntil
            );
            delayUntilState = inner.state;
            data = { ...data, delayUntil: inner.data };
        }
        let state = {
            initialParameters: parameters,
            message: messageState,
            delayUntil: delayUntilState,
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
                <RecordContext meta={ESTIMATE_DELAY_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    message: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.message>
    >;
    delayUntil: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.delayUntil>
    >;
};
// END MAGIC -- DO NOT EDIT
