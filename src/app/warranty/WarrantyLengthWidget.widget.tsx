import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
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
import { QuantityWidget } from "../../clay/widgets/number-widget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { WarrantyLength, WARRANTY_LENGTH_META } from "./table";

export type Data = WarrantyLength;
export const Fields = {
    name: TextWidget,
    legal: TextWidget,
    number: QuantityWidget,
};
function Component(props: Props) {
    return <></>;
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.legal> &
    WidgetContext<typeof Fields.number>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    legal: WidgetState<typeof Fields.legal>;
    number: WidgetState<typeof Fields.number>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "LEGAL"; action: WidgetAction<typeof Fields.legal> }
    | { type: "NUMBER"; action: WidgetAction<typeof Fields.number> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.legal, data.legal, cache, "legal", errors);
    subvalidate(Fields.number, data.number, cache, "number", errors);
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
        case "LEGAL": {
            const inner = Fields.legal.reduce(
                state.legal,
                data.legal,
                action.action,
                subcontext
            );
            return {
                state: { ...state, legal: inner.state },
                data: { ...data, legal: inner.data },
            };
        }
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
    legal: function (
        props: WidgetExtraProps<typeof Fields.legal> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "LEGAL", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "legal", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.legal.component
                state={context.state.legal}
                data={context.data.legal}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Legal"}
            />
        );
    },
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WARRANTY_LENGTH_META,
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
        let legalState;
        {
            const inner = Fields.legal.initialize(
                data.legal,
                subcontext,
                subparameters.legal
            );
            legalState = inner.state;
            data = { ...data, legal: inner.data };
        }
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
        let state = {
            initialParameters: parameters,
            name: nameState,
            legal: legalState,
            number: numberState,
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
                <RecordContext meta={WARRANTY_LENGTH_META} value={props.data}>
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
    legal: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.legal>
    >;
    number: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.number>
    >;
};
// END MAGIC -- DO NOT EDIT
