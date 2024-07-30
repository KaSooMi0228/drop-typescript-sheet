import * as React from "react";
import { Button } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { DropdownLinkWidget } from "../../clay/widgets/dropdown-link-widget";
import { FormWrapper, OptionalFormField } from "../../clay/widgets/FormField";
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
import { SwitchWidget } from "../../clay/widgets/SwitchWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { hasPermission } from "../../permissions";
import { RichTextWidget } from "../rich-text-widget";
import { useUser } from "../state";
import { Warranty, WARRANTY_LENGTH_META, WARRANTY_META } from "./table";

export type Data = Warranty;

export const Fields = {
    name: TextWidget,
    content: RichTextWidget,
    length: DropdownLinkWidget({
        meta: WARRANTY_LENGTH_META,
        label: (length) => length.name,
    }),
    scheduleReview: SwitchWidget,
    active: SwitchWidget,
    exceptions: OptionalFormField(RichTextWidget),
};

function Component(props: Props) {
    const user = useUser();
    const [showContent, setShowContent] = React.useState(false);

    if (!props.status.mutable && !props.data.active) {
        return <></>;
    }

    return (
        <>
            <tr>
                <td style={{ display: "flex" }}>
                    {props.status.mutable && <widgets.active />}
                    <widgets.name readOnly={!props.data.active} />
                </td>
                <td>
                    <widgets.length readOnly={!props.data.active} />
                </td>
                <td>
                    <widgets.scheduleReview readOnly={!props.data.active} />
                </td>
            </tr>
            {props.data.active && (
                <>
                    <tr>
                        <td colSpan={3}>
                            <FormWrapper
                                label={
                                    <>
                                        Content{" "}
                                        {showContent ? (
                                            <Button
                                                onClick={() =>
                                                    setShowContent(false)
                                                }
                                                size="sm"
                                            >
                                                Hide
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    setShowContent(true)
                                                }
                                            >
                                                Show
                                            </Button>
                                        )}
                                    </>
                                }
                            >
                                {showContent && (
                                    <widgets.content
                                        readOnly={
                                            !hasPermission(
                                                user,
                                                "WarrantyTemplate",
                                                "alter-warranty-text"
                                            )
                                        }
                                    />
                                )}
                            </FormWrapper>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={3}>
                            <widgets.exceptions label="Exceptions and Special Considerations" />
                        </td>
                    </tr>
                </>
            )}
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.content> &
    WidgetContext<typeof Fields.length> &
    WidgetContext<typeof Fields.scheduleReview> &
    WidgetContext<typeof Fields.active> &
    WidgetContext<typeof Fields.exceptions>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    content: WidgetState<typeof Fields.content>;
    length: WidgetState<typeof Fields.length>;
    scheduleReview: WidgetState<typeof Fields.scheduleReview>;
    active: WidgetState<typeof Fields.active>;
    exceptions: WidgetState<typeof Fields.exceptions>;
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
    | { type: "ACTIVE"; action: WidgetAction<typeof Fields.active> }
    | { type: "EXCEPTIONS"; action: WidgetAction<typeof Fields.exceptions> };

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
    subvalidate(Fields.active, data.active, cache, "active", errors);
    subvalidate(
        Fields.exceptions,
        data.exceptions,
        cache,
        "exceptions",
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
        case "ACTIVE": {
            const inner = Fields.active.reduce(
                state.active,
                data.active,
                action.action,
                subcontext
            );
            return {
                state: { ...state, active: inner.state },
                data: { ...data, active: inner.data },
            };
        }
        case "EXCEPTIONS": {
            const inner = Fields.exceptions.reduce(
                state.exceptions,
                data.exceptions,
                action.action,
                subcontext
            );
            return {
                state: { ...state, exceptions: inner.state },
                data: { ...data, exceptions: inner.data },
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
    active: function (
        props: WidgetExtraProps<typeof Fields.active> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ACTIVE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "active", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.active.component
                state={context.state.active}
                data={context.data.active}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Active"}
            />
        );
    },
    exceptions: function (
        props: WidgetExtraProps<typeof Fields.exceptions> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "EXCEPTIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "exceptions", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.exceptions.component
                state={context.state.exceptions}
                data={context.data.exceptions}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Exceptions"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WARRANTY_META,
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
        let activeState;
        {
            const inner = Fields.active.initialize(
                data.active,
                subcontext,
                subparameters.active
            );
            activeState = inner.state;
            data = { ...data, active: inner.data };
        }
        let exceptionsState;
        {
            const inner = Fields.exceptions.initialize(
                data.exceptions,
                subcontext,
                subparameters.exceptions
            );
            exceptionsState = inner.state;
            data = { ...data, exceptions: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            content: contentState,
            length: lengthState,
            scheduleReview: scheduleReviewState,
            active: activeState,
            exceptions: exceptionsState,
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
                <RecordContext meta={WARRANTY_META} value={props.data}>
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
    active: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.active>
    >;
    exceptions: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.exceptions>
    >;
};
// END MAGIC -- DO NOT EDIT
