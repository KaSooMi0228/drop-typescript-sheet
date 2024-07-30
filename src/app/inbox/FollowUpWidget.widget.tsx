import React from "react";
import { Button, Table } from "react-bootstrap";
import { patchRecord } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { daysAgo } from "../../clay/queryFuncs";
import {
    QuickCacheApi,
    useQuickCache,
    useQuickRecord,
} from "../../clay/quick-cache";
import { StaticDateTimeWidget } from "../../clay/widgets/DateTimeWidget";
import { DropdownLinkWidget } from "../../clay/widgets/dropdown-link-widget";
import { FormField, FormWrapper } from "../../clay/widgets/FormField";
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
import { hasPermission } from "../../permissions";
import { CAMPAIGN_META } from "../campaign/table";
import { COMPANY_META } from "../company/table";
import {
    calcContactPendingFollowUpDate,
    calcContactPendingFollowUpOverdue,
    calcContactPendingFollowUpUser,
    ContactFollowUp,
    CONTACT_FOLLOWUP_ACTIVITY_META,
    CONTACT_FOLLOW_UP_META,
    CONTACT_META,
} from "../contact/table";
import { launchEmail } from "../project/email-popup";
import { RichTextWidget } from "../rich-text-widget";
import { useUser } from "../state";
import { USER_META } from "../user/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource from "./NotificationSource";
import { ITEM_TYPE } from "./types";
import { useLocalWidget } from "./useLocalWidget";

export type Data = ContactFollowUp;

function Component(props: Props) {
    const user = useUser();

    return (
        <>
            <FormWrapper label="Override Date">
                <widgets.actual
                    label="Date"
                    allowOverride={hasPermission(
                        user,
                        "Contact",
                        "change-activity-date"
                    )}
                />
            </FormWrapper>
            <widgets.activity />
            <widgets.message />
        </>
    );
}

export const Fields = {
    actual: StaticDateTimeWidget,
    message: RichTextWidget,
    activity: FormField(
        DropdownLinkWidget({
            meta: CONTACT_FOLLOWUP_ACTIVITY_META,
            label: (x) => x.name,
        })
    ),
};

function PendingContactFollowup(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const cache = useQuickCache();
    const contact = useQuickRecord(CONTACT_META, props.id);
    const { component, data, isValid, dispatch } = useLocalWidget(Widget);

    const scheduledActivity =
        (contact && contact.followUps[contact.followUps.length - 1]) || null;

    const company = useQuickRecord(COMPANY_META, contact?.company || null);
    const campaign = useQuickRecord(
        CAMPAIGN_META,
        scheduledActivity?.campaign || null
    );

    const user = useUser();

    const onSave = React.useCallback(async () => {
        if (!scheduledActivity || !contact) {
            return;
        }

        await patchRecord(CONTACT_META, "inbox", props.id, {
            followUps: {
                _t: "a",
                [`${contact.followUps.length - 1}`]: {
                    actual: [
                        scheduledActivity?.actual,
                        data.actual || new Date(),
                    ],
                    activity: [scheduledActivity.activity, data.activity],
                    message: [scheduledActivity.message, data.message],
                },
            },
        });
        props.setOpenItem(null);
    }, [scheduledActivity, contact, props.setOpenItem, props.id, data]);

    if (!contact || !scheduledActivity) {
        return <></>;
    }

    const historicalActivites = contact.followUps.filter(
        (activity) => activity.actual && daysAgo(activity.actual)!.lessThan(365)
    );
    historicalActivites.reverse();

    return (
        <>
            <MessageHeader>{contact.name} Follow-Up</MessageHeader>
            <MessageBody>
                <Table>
                    <tbody>
                        <tr>
                            <th>Name:</th>
                            <td>{contact.name}</td>
                        </tr>
                        <tr>
                            <th>Company:</th>
                            <td>{company?.name}</td>
                        </tr>
                        {contact.phones.slice(0, 1).map((phone, index) => (
                            <tr key={index}>
                                <th>Phone #</th>
                                <td>{phone.number.format()}</td>
                            </tr>
                        ))}
                        {campaign && (
                            <tr>
                                <th>Campaign Name</th>
                                <td>{campaign.name}</td>
                            </tr>
                        )}
                        <tr>
                            <th>Scheduled Follow-up Date</th>
                            <td>{scheduledActivity.scheduled?.toString()}</td>
                        </tr>
                    </tbody>
                </Table>
                {component}
                <Table>
                    {historicalActivites.map((activity, index) => (
                        <tr key={index}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>User</th>
                                    <th>Activity</th>
                                </tr>
                            </thead>
                            <tbody>
                                <th>{activity.actual?.toString()}</th>
                                <td>
                                    {
                                        cache.get(
                                            CAMPAIGN_META,
                                            activity.campaign
                                        )?.name
                                    }
                                </td>
                                <td>
                                    {cache.get(USER_META, activity.user)?.name}
                                </td>
                                <td>
                                    {
                                        cache.get(
                                            CONTACT_FOLLOWUP_ACTIVITY_META,
                                            activity.activity
                                        )?.name
                                    }
                                </td>
                            </tbody>
                        </tr>
                    ))}
                </Table>
            </MessageBody>
            <MessageFooter>
                <Button
                    style={{ marginLeft: "1em" }}
                    onClick={() => {
                        launchEmail({
                            emails: [contact.email],
                            subject: "",
                            bcc: `contact-${contact.contactNumber}@dropsheet.remdal.com`,
                        });
                        props.setOpenItem(null);
                    }}
                >
                    Start Email
                </Button>
                <Button
                    onClick={() => {
                        window.open("#/contact/edit/" + props.id + "/");
                        props.setOpenItem(null);
                    }}
                    style={{ display: "block", marginLeft: "auto" }}
                >
                    Open Contact
                </Button>
                <Button
                    style={{ marginLeft: "auto", display: "block" }}
                    disabled={!isValid}
                    onClick={onSave}
                >
                    Save
                </Button>
            </MessageFooter>
        </>
    );
}

export const PENDING_CONTACT_FOLLOW_UP_SOURCE = NotificationSource({
    key: "contact-follow-up",
    label: "Follow Up With Campaign Contact",
    Component: PendingContactFollowup,
    table: CONTACT_META,
    priority: calcContactPendingFollowUpOverdue,
    date: calcContactPendingFollowUpDate,
    dated: true,
    sendToUser: calcContactPendingFollowUpUser,
});

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.actual> &
    WidgetContext<typeof Fields.message> &
    WidgetContext<typeof Fields.activity>;
type ExtraProps = {};
type BaseState = {
    actual: WidgetState<typeof Fields.actual>;
    message: WidgetState<typeof Fields.message>;
    activity: WidgetState<typeof Fields.activity>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "ACTUAL"; action: WidgetAction<typeof Fields.actual> }
    | { type: "MESSAGE"; action: WidgetAction<typeof Fields.message> }
    | { type: "ACTIVITY"; action: WidgetAction<typeof Fields.activity> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.actual, data.actual, cache, "actual", errors);
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
            actual: actualState,
            message: messageState,
            activity: activityState,
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
    actual: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.actual>
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
