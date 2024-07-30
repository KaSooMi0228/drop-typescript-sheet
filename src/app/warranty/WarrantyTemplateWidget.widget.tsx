import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { SaveDeleteButton } from "../../clay/save-delete-button";
import { DropdownLinkWidget } from "../../clay/widgets/dropdown-link-widget";
import { FormField, OptionalFormField } from "../../clay/widgets/FormField";
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
import { LinkSetWidget } from "../../clay/widgets/link-set-widget";
import { SwitchWidget } from "../../clay/widgets/SwitchWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { PROJECT_DESCRIPTION_META } from "../project-description/table";
import { RichTextWidget } from "../rich-text-widget";
import {
    WarrantyTemplate,
    WARRANTY_LENGTH_META,
    WARRANTY_TEMPLATE_META,
} from "./table";

export type Data = WarrantyTemplate;

export const Fields = {
    name: FormField(TextWidget),
    content: FormField(RichTextWidget),
    length: FormField(
        DropdownLinkWidget({
            meta: WARRANTY_LENGTH_META,
            label: (length) => length.name,
        })
    ),
    scheduleReview: FormField(SwitchWidget),
    projectDescriptions: OptionalFormField(
        LinkSetWidget({
            meta: PROJECT_DESCRIPTION_META,
            name: (description) => description.name,
        })
    ),
};

function Component(props: Props) {
    return (
        <>
            <widgets.name />
            <widgets.content />
            <widgets.length />
            <widgets.scheduleReview label="Schedule Warranty Review?" />
            <widgets.projectDescriptions />
            <SaveDeleteButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.content> &
    WidgetContext<typeof Fields.length> &
    WidgetContext<typeof Fields.scheduleReview> &
    WidgetContext<typeof Fields.projectDescriptions>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    content: WidgetState<typeof Fields.content>;
    length: WidgetState<typeof Fields.length>;
    scheduleReview: WidgetState<typeof Fields.scheduleReview>;
    projectDescriptions: WidgetState<typeof Fields.projectDescriptions>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "CONTENT"; action: WidgetAction<typeof Fields.content> }
    | { type: "LENGTH"; action: WidgetAction<typeof Fields.length> }
    | {
          type: "SCHEDULE_REVIEW";
          action: WidgetAction<typeof Fields.scheduleReview>;
      }
    | {
          type: "PROJECT_DESCRIPTIONS";
          action: WidgetAction<typeof Fields.projectDescriptions>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.content, data.content, cache, "content", errors);
    subvalidate(Fields.length, data.length, cache, "length", errors);
    subvalidate(
        Fields.scheduleReview,
        data.scheduleReview,
        cache,
        "scheduleReview",
        errors
    );
    subvalidate(
        Fields.projectDescriptions,
        data.projectDescriptions,
        cache,
        "projectDescriptions",
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
        case "LENGTH": {
            const inner = Fields.length.reduce(
                state.length,
                data.length,
                action.action,
                subcontext
            );
            return {
                state: { ...state, length: inner.state },
                data: { ...data, length: inner.data },
            };
        }
        case "SCHEDULE_REVIEW": {
            const inner = Fields.scheduleReview.reduce(
                state.scheduleReview,
                data.scheduleReview,
                action.action,
                subcontext
            );
            return {
                state: { ...state, scheduleReview: inner.state },
                data: { ...data, scheduleReview: inner.data },
            };
        }
        case "PROJECT_DESCRIPTIONS": {
            const inner = Fields.projectDescriptions.reduce(
                state.projectDescriptions,
                data.projectDescriptions,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectDescriptions: inner.state },
                data: { ...data, projectDescriptions: inner.data },
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
    length: function (
        props: WidgetExtraProps<typeof Fields.length> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "LENGTH",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "length", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.length.component
                state={context.state.length}
                data={context.data.length}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Length"}
            />
        );
    },
    scheduleReview: function (
        props: WidgetExtraProps<typeof Fields.scheduleReview> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SCHEDULE_REVIEW",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "scheduleReview", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.scheduleReview.component
                state={context.state.scheduleReview}
                data={context.data.scheduleReview}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Schedule Review"}
            />
        );
    },
    projectDescriptions: function (
        props: WidgetExtraProps<typeof Fields.projectDescriptions> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_DESCRIPTIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "projectDescriptions",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectDescriptions.component
                state={context.state.projectDescriptions}
                data={context.data.projectDescriptions}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Descriptions"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WARRANTY_TEMPLATE_META,
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
        let lengthState;
        {
            const inner = Fields.length.initialize(
                data.length,
                subcontext,
                subparameters.length
            );
            lengthState = inner.state;
            data = { ...data, length: inner.data };
        }
        let scheduleReviewState;
        {
            const inner = Fields.scheduleReview.initialize(
                data.scheduleReview,
                subcontext,
                subparameters.scheduleReview
            );
            scheduleReviewState = inner.state;
            data = { ...data, scheduleReview: inner.data };
        }
        let projectDescriptionsState;
        {
            const inner = Fields.projectDescriptions.initialize(
                data.projectDescriptions,
                subcontext,
                subparameters.projectDescriptions
            );
            projectDescriptionsState = inner.state;
            data = { ...data, projectDescriptions: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            content: contentState,
            length: lengthState,
            scheduleReview: scheduleReviewState,
            projectDescriptions: projectDescriptionsState,
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
                <RecordContext meta={WARRANTY_TEMPLATE_META} value={props.data}>
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
    content: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.content>
    >;
    length: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.length>
    >;
    scheduleReview: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.scheduleReview>
    >;
    projectDescriptions: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectDescriptions>
    >;
};
// END MAGIC -- DO NOT EDIT
