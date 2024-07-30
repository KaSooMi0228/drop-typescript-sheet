import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../../clay/quick-cache";
import { SaveDeleteButton } from "../../../clay/save-delete-button";
import {
    FormField,
    Optional,
    OptionalFormField,
} from "../../../clay/widgets/FormField";
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
import { LinkSetWidget } from "../../../clay/widgets/link-set-widget";
import { MoneyWidget } from "../../../clay/widgets/money-widget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { RichTextWidget } from "../../rich-text-widget";
import { ApplicationTypeLinkWidget, ApplicationWidget } from "../types";
import { APPLICATION_TYPE_META, SUBSTRATE_META } from "../types/table";
import { FinishSchedule, FINISH_SCHEDULE_META } from "./table";

export type Data = FinishSchedule;

export const Fields = {
    name: FormField(TextWidget),
    rate: FormField(MoneyWidget),
    substrates: OptionalFormField(
        LinkSetWidget({
            meta: SUBSTRATE_META,
            name: (item_type) => item_type.name,
        })
    ),
    content: Optional(RichTextWidget),
    applicationType: FormField(ApplicationTypeLinkWidget),
    defaultApplication: FormField(ApplicationWidget),
};

function reduce(
    state: State,
    data: FinishSchedule,
    action: Action,
    context: Context
) {
    if (
        action.type == "APPLICATION_TYPE" &&
        action.action.type == "SET" &&
        action.action.value !== null
    ) {
        return {
            state,
            data: {
                ...data,
                applicationType: action.action.value.id.uuid,
                defaultApplication: action.action.value.default,
            },
        };
    }
    return baseReduce(state, data, action, context);
}

function Component(props: Props) {
    const applicationType = useQuickRecord(
        APPLICATION_TYPE_META,
        props.data.applicationType
    );
    return (
        <>
            <widgets.name />
            <widgets.rate />
            <widgets.applicationType />
            <widgets.defaultApplication
                records={applicationType ? applicationType.options : []}
            />
            <widgets.substrates />
            <widgets.content />
            <SaveDeleteButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.rate> &
    WidgetContext<typeof Fields.substrates> &
    WidgetContext<typeof Fields.content> &
    WidgetContext<typeof Fields.applicationType> &
    WidgetContext<typeof Fields.defaultApplication>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    rate: WidgetState<typeof Fields.rate>;
    substrates: WidgetState<typeof Fields.substrates>;
    content: WidgetState<typeof Fields.content>;
    applicationType: WidgetState<typeof Fields.applicationType>;
    defaultApplication: WidgetState<typeof Fields.defaultApplication>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "RATE"; action: WidgetAction<typeof Fields.rate> }
    | { type: "SUBSTRATES"; action: WidgetAction<typeof Fields.substrates> }
    | { type: "CONTENT"; action: WidgetAction<typeof Fields.content> }
    | {
          type: "APPLICATION_TYPE";
          action: WidgetAction<typeof Fields.applicationType>;
      }
    | {
          type: "DEFAULT_APPLICATION";
          action: WidgetAction<typeof Fields.defaultApplication>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.rate, data.rate, cache, "rate", errors);
    subvalidate(
        Fields.substrates,
        data.substrates,
        cache,
        "substrates",
        errors
    );
    subvalidate(Fields.content, data.content, cache, "content", errors);
    subvalidate(
        Fields.applicationType,
        data.applicationType,
        cache,
        "applicationType",
        errors
    );
    subvalidate(
        Fields.defaultApplication,
        data.defaultApplication,
        cache,
        "defaultApplication",
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
        case "RATE": {
            const inner = Fields.rate.reduce(
                state.rate,
                data.rate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, rate: inner.state },
                data: { ...data, rate: inner.data },
            };
        }
        case "SUBSTRATES": {
            const inner = Fields.substrates.reduce(
                state.substrates,
                data.substrates,
                action.action,
                subcontext
            );
            return {
                state: { ...state, substrates: inner.state },
                data: { ...data, substrates: inner.data },
            };
        }
        case "CONTENT": {
            const inner = Fields.content.reduce(
                state.content,
                data.content,
                action.action,
                subcontext
            );
            return {
                state: { ...state, content: inner.state },
                data: { ...data, content: inner.data },
            };
        }
        case "APPLICATION_TYPE": {
            const inner = Fields.applicationType.reduce(
                state.applicationType,
                data.applicationType,
                action.action,
                subcontext
            );
            return {
                state: { ...state, applicationType: inner.state },
                data: { ...data, applicationType: inner.data },
            };
        }
        case "DEFAULT_APPLICATION": {
            const inner = Fields.defaultApplication.reduce(
                state.defaultApplication,
                data.defaultApplication,
                action.action,
                subcontext
            );
            return {
                state: { ...state, defaultApplication: inner.state },
                data: { ...data, defaultApplication: inner.data },
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
    rate: function (
        props: WidgetExtraProps<typeof Fields.rate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "RATE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "rate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.rate.component
                state={context.state.rate}
                data={context.data.rate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Rate"}
            />
        );
    },
    substrates: function (
        props: WidgetExtraProps<typeof Fields.substrates> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SUBSTRATES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "substrates", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.substrates.component
                state={context.state.substrates}
                data={context.data.substrates}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Substrates"}
            />
        );
    },
    content: function (
        props: WidgetExtraProps<typeof Fields.content> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTENT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "content", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.content.component
                state={context.state.content}
                data={context.data.content}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Content"}
            />
        );
    },
    applicationType: function (
        props: WidgetExtraProps<typeof Fields.applicationType> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "APPLICATION_TYPE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "applicationType", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.applicationType.component
                state={context.state.applicationType}
                data={context.data.applicationType}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Application Type"}
            />
        );
    },
    defaultApplication: function (
        props: WidgetExtraProps<typeof Fields.defaultApplication> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DEFAULT_APPLICATION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "defaultApplication",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.defaultApplication.component
                state={context.state.defaultApplication}
                data={context.data.defaultApplication}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Default Application"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: FINISH_SCHEDULE_META,
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
        let rateState;
        {
            const inner = Fields.rate.initialize(
                data.rate,
                subcontext,
                subparameters.rate
            );
            rateState = inner.state;
            data = { ...data, rate: inner.data };
        }
        let substratesState;
        {
            const inner = Fields.substrates.initialize(
                data.substrates,
                subcontext,
                subparameters.substrates
            );
            substratesState = inner.state;
            data = { ...data, substrates: inner.data };
        }
        let contentState;
        {
            const inner = Fields.content.initialize(
                data.content,
                subcontext,
                subparameters.content
            );
            contentState = inner.state;
            data = { ...data, content: inner.data };
        }
        let applicationTypeState;
        {
            const inner = Fields.applicationType.initialize(
                data.applicationType,
                subcontext,
                subparameters.applicationType
            );
            applicationTypeState = inner.state;
            data = { ...data, applicationType: inner.data };
        }
        let defaultApplicationState;
        {
            const inner = Fields.defaultApplication.initialize(
                data.defaultApplication,
                subcontext,
                subparameters.defaultApplication
            );
            defaultApplicationState = inner.state;
            data = { ...data, defaultApplication: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            rate: rateState,
            substrates: substratesState,
            content: contentState,
            applicationType: applicationTypeState,
            defaultApplication: defaultApplicationState,
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
                <RecordContext meta={FINISH_SCHEDULE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
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
    rate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.rate>
    >;
    substrates: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.substrates>
    >;
    content: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.content>
    >;
    applicationType: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.applicationType>
    >;
    defaultApplication: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.defaultApplication>
    >;
};
// END MAGIC -- DO NOT EDIT
