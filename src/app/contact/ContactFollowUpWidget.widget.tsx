import { differenceInDays } from "date-fns";
import * as React from "react";
import { Button, Card } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { RemoveButton } from "../../clay/remove-button";
import { ValidationError } from "../../clay/widgets";
import { StaticDateTimeWidget } from "../../clay/widgets/DateTimeWidget";
import { DateWidget } from "../../clay/widgets/DateWidget";
import { DropdownLinkWidget } from "../../clay/widgets/dropdown-link-widget";
import {
    FormField,
    FormWrapper,
    OptionalFormField,
} from "../../clay/widgets/FormField";
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
} from "../../clay/widgets/index";
import { FieldRow } from "../../clay/widgets/layout";
import { useListItemContext } from "../../clay/widgets/ListWidget";
import { hasPermission } from "../../permissions";
import { CAMPAIGN_META } from "../campaign/table";
import { launchEmail } from "../project/email-popup";
import { RichTextWidget } from "../rich-text-widget";
import { useUser } from "../state";
import { UserLinkWidget } from "../user";
import {
    Contact,
    ContactFollowUp,
    CONTACT_FOLLOWUP_ACTIVITY_META,
    CONTACT_FOLLOW_UP_META,
} from "./table";

export type Data = ContactFollowUp;

export type ExtraProps = {
    contact: Contact;
};

export const Fields = {
    scheduled: FormField(DateWidget),
    actual: FormField(StaticDateTimeWidget),
    campaign: OptionalFormField(
        DropdownLinkWidget({
            meta: CAMPAIGN_META,
            label: (campaign) => campaign.name,
        })
    ),
    user: UserLinkWidget,
    message: RichTextWidget,
    activity: FormField(
        DropdownLinkWidget({
            meta: CONTACT_FOLLOWUP_ACTIVITY_META,
            label: (x) => x.name,
        })
    ),
};

function actionMakeActual(state: State, data: Data) {
    return {
        state,
        data: {
            ...data,
            actual: new Date(),
        },
    };
}

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);
    if (data.actual === null) {
        return errors.filter(
            (error) => error.field === "scheduled" || error.field === "user"
        );
    } else if (differenceInDays(new Date(), data.actual) >= 1) {
        return [];
    } else {
        return errors.filter((error) => error.field !== "scheduled");
    }
}

function Component(props: Props) {
    const user = useUser();
    const listItemContext = useListItemContext();
    const isMutable =
        props.status.mutable &&
        (props.data.actual === null ||
            differenceInDays(new Date(), props.data.actual) < 1);

    const isActive = props.data.actual !== null;

    return (
        <ReactContext.Provider
            value={{
                ...props,
                status: {
                    ...props.status,
                    mutable: isMutable,
                },
            }}
        >
            <Card {...listItemContext.draggableProps}>
                <Card.Body>
                    <div style={{ display: "none" }}>
                        {listItemContext.dragHandle}
                    </div>
                    <FieldRow>
                        <widgets.scheduled readOnly={isActive} />
                        {isActive && (
                            <widgets.actual
                                label="Date"
                                allowOverride={hasPermission(
                                    user,
                                    "Contact",
                                    "change-activity-date"
                                )}
                            />
                        )}
                        <FormWrapper label="User" style={{ maxWidth: "12em" }}>
                            <widgets.user />
                        </FormWrapper>
                        <widgets.campaign readOnly />
                        {isActive && <widgets.activity />}
                        <FormWrapper label="" style={{ maxWidth: "4em" }}>
                            <div>{isMutable && <RemoveButton />}</div>
                        </FormWrapper>
                    </FieldRow>
                    {isActive && <widgets.message />}
                    {!isActive && (
                        <>
                            <Button
                                onClick={() =>
                                    props.dispatch({ type: "MAKE_ACTUAL" })
                                }
                            >
                                Record Follow Up
                            </Button>
                            <Button
                                style={{ marginLeft: "1em" }}
                                onClick={() =>
                                    launchEmail({
                                        emails: [props.contact.email],
                                        subject: "",
                                        bcc: `contact-${props.contact.contactNumber}@dropsheet.remdal.com`,
                                    })
                                }
                            >
                                Start Email
                            </Button>
                        </>
                    )}
                </Card.Body>
            </Card>
        </ReactContext.Provider>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.scheduled> &
    WidgetContext<typeof Fields.actual> &
    WidgetContext<typeof Fields.campaign> &
    WidgetContext<typeof Fields.user> &
    WidgetContext<typeof Fields.message> &
    WidgetContext<typeof Fields.activity>;
type BaseState = {
    scheduled: WidgetState<typeof Fields.scheduled>;
    actual: WidgetState<typeof Fields.actual>;
    campaign: WidgetState<typeof Fields.campaign>;
    user: WidgetState<typeof Fields.user>;
    message: WidgetState<typeof Fields.message>;
    activity: WidgetState<typeof Fields.activity>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "SCHEDULED"; action: WidgetAction<typeof Fields.scheduled> }
    | { type: "ACTUAL"; action: WidgetAction<typeof Fields.actual> }
    | { type: "CAMPAIGN"; action: WidgetAction<typeof Fields.campaign> }
    | { type: "USER"; action: WidgetAction<typeof Fields.user> }
    | { type: "MESSAGE"; action: WidgetAction<typeof Fields.message> }
    | { type: "ACTIVITY"; action: WidgetAction<typeof Fields.activity> }
    | { type: "MAKE_ACTUAL" };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.scheduled, data.scheduled, cache, "scheduled", errors);
    subvalidate(Fields.actual, data.actual, cache, "actual", errors);
    subvalidate(Fields.campaign, data.campaign, cache, "campaign", errors);
    subvalidate(Fields.user, data.user, cache, "user", errors);
    subvalidate(Fields.message, data.message, cache, "message", errors);
    subvalidate(Fields.activity, data.activity, cache, "activity", errors);
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
        case "SCHEDULED": {
            const inner = Fields.scheduled.reduce(
                state.scheduled,
                data.scheduled,
                action.action,
                subcontext
            );
            return {
                state: { ...state, scheduled: inner.state },
                data: { ...data, scheduled: inner.data },
            };
        }
        case "ACTUAL": {
            const inner = Fields.actual.reduce(
                state.actual,
                data.actual,
                action.action,
                subcontext
            );
            return {
                state: { ...state, actual: inner.state },
                data: { ...data, actual: inner.data },
            };
        }
        case "CAMPAIGN": {
            const inner = Fields.campaign.reduce(
                state.campaign,
                data.campaign,
                action.action,
                subcontext
            );
            return {
                state: { ...state, campaign: inner.state },
                data: { ...data, campaign: inner.data },
            };
        }
        case "USER": {
            const inner = Fields.user.reduce(
                state.user,
                data.user,
                action.action,
                subcontext
            );
            return {
                state: { ...state, user: inner.state },
                data: { ...data, user: inner.data },
            };
        }
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
        case "ACTIVITY": {
            const inner = Fields.activity.reduce(
                state.activity,
                data.activity,
                action.action,
                subcontext
            );
            return {
                state: { ...state, activity: inner.state },
                data: { ...data, activity: inner.data },
            };
        }
        case "MAKE_ACTUAL":
            return actionMakeActual(state, data);
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
    scheduled: function (
        props: WidgetExtraProps<typeof Fields.scheduled> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SCHEDULED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "scheduled", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.scheduled.component
                state={context.state.scheduled}
                data={context.data.scheduled}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Scheduled"}
            />
        );
    },
    actual: function (
        props: WidgetExtraProps<typeof Fields.actual> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ACTUAL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "actual", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.actual.component
                state={context.state.actual}
                data={context.data.actual}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Actual"}
            />
        );
    },
    campaign: function (
        props: WidgetExtraProps<typeof Fields.campaign> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CAMPAIGN",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "campaign", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.campaign.component
                state={context.state.campaign}
                data={context.data.campaign}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Campaign"}
            />
        );
    },
    user: function (
        props: WidgetExtraProps<typeof Fields.user> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "USER", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "user", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.user.component
                state={context.state.user}
                data={context.data.user}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "User"}
            />
        );
    },
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
    activity: function (
        props: WidgetExtraProps<typeof Fields.activity> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ACTIVITY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "activity", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.activity.component
                state={context.state.activity}
                data={context.data.activity}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Activity"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: CONTACT_FOLLOW_UP_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let scheduledState;
        {
            const inner = Fields.scheduled.initialize(
                data.scheduled,
                subcontext,
                subparameters.scheduled
            );
            scheduledState = inner.state;
            data = { ...data, scheduled: inner.data };
        }
        let actualState;
        {
            const inner = Fields.actual.initialize(
                data.actual,
                subcontext,
                subparameters.actual
            );
            actualState = inner.state;
            data = { ...data, actual: inner.data };
        }
        let campaignState;
        {
            const inner = Fields.campaign.initialize(
                data.campaign,
                subcontext,
                subparameters.campaign
            );
            campaignState = inner.state;
            data = { ...data, campaign: inner.data };
        }
        let userState;
        {
            const inner = Fields.user.initialize(
                data.user,
                subcontext,
                subparameters.user
            );
            userState = inner.state;
            data = { ...data, user: inner.data };
        }
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
        let activityState;
        {
            const inner = Fields.activity.initialize(
                data.activity,
                subcontext,
                subparameters.activity
            );
            activityState = inner.state;
            data = { ...data, activity: inner.data };
        }
        let state = {
            initialParameters: parameters,
            scheduled: scheduledState,
            actual: actualState,
            campaign: campaignState,
            user: userState,
            message: messageState,
            activity: activityState,
        };
        return {
            state,
            data,
        };
    },
    validate: validate,
    component: React.memo((props: Props) => {
        return (
            <ReactContext.Provider value={props}>
                <RecordContext meta={CONTACT_FOLLOW_UP_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    scheduled: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.scheduled>
    >;
    actual: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.actual>
    >;
    campaign: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.campaign>
    >;
    user: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.user>
    >;
    message: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.message>
    >;
    activity: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.activity>
    >;
};
// END MAGIC -- DO NOT EDIT
