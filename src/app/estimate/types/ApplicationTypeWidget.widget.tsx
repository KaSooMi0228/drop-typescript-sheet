import * as React from "react";
import { ApplicationWidget } from ".";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { SaveDeleteButton } from "../../../clay/save-delete-button";
import { FormField, FormWrapper } from "../../../clay/widgets/FormField";
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
import { ListWidget } from "../../../clay/widgets/ListWidget";
import { SwitchWidget } from "../../../clay/widgets/SwitchWidget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { TABLE_STYLE } from "../../styles";
import ApplicationTypeOptionWidget from "./ApplicationTypeOptionWidget.widget";
import { ApplicationType, APPLICATION_TYPE_META } from "./table";

export type Data = ApplicationType;

export const Fields = {
    name: FormField(TextWidget),
    options: ListWidget(ApplicationTypeOptionWidget),
    default: FormField(ApplicationWidget),
    hidden: FormField(SwitchWidget),
};

function Component(props: Props) {
    return (
        <>
            <widgets.name />
            <FormWrapper label="Options">
                <table {...TABLE_STYLE}>
                    <thead></thead>
                    <widgets.options extraItemForAdd containerClass="tbody" />
                </table>
            </FormWrapper>
            <widgets.hidden />
            <widgets.default records={props.data.options} />
            <SaveDeleteButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.options> &
    WidgetContext<typeof Fields.default> &
    WidgetContext<typeof Fields.hidden>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    options: WidgetState<typeof Fields.options>;
    default: WidgetState<typeof Fields.default>;
    hidden: WidgetState<typeof Fields.hidden>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "OPTIONS"; action: WidgetAction<typeof Fields.options> }
    | { type: "DEFAULT"; action: WidgetAction<typeof Fields.default> }
    | { type: "HIDDEN"; action: WidgetAction<typeof Fields.hidden> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.options, data.options, cache, "options", errors);
    subvalidate(Fields.default, data.default, cache, "default", errors);
    subvalidate(Fields.hidden, data.hidden, cache, "hidden", errors);
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
        case "OPTIONS": {
            const inner = Fields.options.reduce(
                state.options,
                data.options,
                action.action,
                subcontext
            );
            return {
                state: { ...state, options: inner.state },
                data: { ...data, options: inner.data },
            };
        }
        case "DEFAULT": {
            const inner = Fields.default.reduce(
                state.default,
                data.default,
                action.action,
                subcontext
            );
            return {
                state: { ...state, default: inner.state },
                data: { ...data, default: inner.data },
            };
        }
        case "HIDDEN": {
            const inner = Fields.hidden.reduce(
                state.hidden,
                data.hidden,
                action.action,
                subcontext
            );
            return {
                state: { ...state, hidden: inner.state },
                data: { ...data, hidden: inner.data },
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
    options: function (
        props: WidgetExtraProps<typeof Fields.options> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "OPTIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "options", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.options.component
                state={context.state.options}
                data={context.data.options}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Options"}
            />
        );
    },
    default: function (
        props: WidgetExtraProps<typeof Fields.default> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DEFAULT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "default", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.default.component
                state={context.state.default}
                data={context.data.default}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Default"}
            />
        );
    },
    hidden: function (
        props: WidgetExtraProps<typeof Fields.hidden> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "HIDDEN",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "hidden", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.hidden.component
                state={context.state.hidden}
                data={context.data.hidden}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Hidden"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: APPLICATION_TYPE_META,
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
        let optionsState;
        {
            const inner = Fields.options.initialize(
                data.options,
                subcontext,
                subparameters.options
            );
            optionsState = inner.state;
            data = { ...data, options: inner.data };
        }
        let defaultState;
        {
            const inner = Fields.default.initialize(
                data.default,
                subcontext,
                subparameters.default
            );
            defaultState = inner.state;
            data = { ...data, default: inner.data };
        }
        let hiddenState;
        {
            const inner = Fields.hidden.initialize(
                data.hidden,
                subcontext,
                subparameters.hidden
            );
            hiddenState = inner.state;
            data = { ...data, hidden: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            options: optionsState,
            default: defaultState,
            hidden: hiddenState,
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
                <RecordContext meta={APPLICATION_TYPE_META} value={props.data}>
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
    options: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.options>
    >;
    default: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.default>
    >;
    hidden: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.hidden>
    >;
};
// END MAGIC -- DO NOT EDIT
