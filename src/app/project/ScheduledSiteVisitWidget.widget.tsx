import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import {
    DateTimeWidget,
    StaticDateTimeWidget,
} from "../../clay/widgets/DateTimeWidget";
import {
    RecordContext,
    RecordWidget,
    subStatus,
    subvalidate,
    useRecordContext,
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
import { BaseTableRow } from "../../clay/widgets/TableRow";
import { SelectContactWidget } from "../contact/select-contact-widget";
import { UserLinkWidget } from "../user";
import {
    PROJECT_META,
    ScheduledSiteVisit,
    SCHEDULED_SITE_VISIT_META,
} from "./table";

export type Data = ScheduledSiteVisit;

export const Fields = {
    addedDateTime: StaticDateTimeWidget,
    user: UserLinkWidget,
    scheduledDateTime: DateTimeWidget,
    contact: SelectContactWidget,
};

function Component(props: Props) {
    const project = useRecordContext(PROJECT_META);

    return (
        <BaseTableRow disableMove>
            <th>Site Visit Scheduled</th>
            <td>
                <widgets.user readOnly={true} />
            </td>
            <td>
                <widgets.addedDateTime />
            </td>
            <td>
                <widgets.scheduledDateTime />
            </td>
            <td width="20em">
                <widgets.contact
                    contacts={[...project.billingContacts, ...project.contacts]}
                />
            </td>
        </BaseTableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.addedDateTime> &
    WidgetContext<typeof Fields.user> &
    WidgetContext<typeof Fields.scheduledDateTime> &
    WidgetContext<typeof Fields.contact>;
type ExtraProps = {};
type BaseState = {
    addedDateTime: WidgetState<typeof Fields.addedDateTime>;
    user: WidgetState<typeof Fields.user>;
    scheduledDateTime: WidgetState<typeof Fields.scheduledDateTime>;
    contact: WidgetState<typeof Fields.contact>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "ADDED_DATE_TIME";
          action: WidgetAction<typeof Fields.addedDateTime>;
      }
    | { type: "USER"; action: WidgetAction<typeof Fields.user> }
    | {
          type: "SCHEDULED_DATE_TIME";
          action: WidgetAction<typeof Fields.scheduledDateTime>;
      }
    | { type: "CONTACT"; action: WidgetAction<typeof Fields.contact> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.addedDateTime,
        data.addedDateTime,
        cache,
        "addedDateTime",
        errors
    );
    subvalidate(Fields.user, data.user, cache, "user", errors);
    subvalidate(
        Fields.scheduledDateTime,
        data.scheduledDateTime,
        cache,
        "scheduledDateTime",
        errors
    );
    subvalidate(Fields.contact, data.contact, cache, "contact", errors);
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
        case "ADDED_DATE_TIME": {
            const inner = Fields.addedDateTime.reduce(
                state.addedDateTime,
                data.addedDateTime,
                action.action,
                subcontext
            );
            return {
                state: { ...state, addedDateTime: inner.state },
                data: { ...data, addedDateTime: inner.data },
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
        case "SCHEDULED_DATE_TIME": {
            const inner = Fields.scheduledDateTime.reduce(
                state.scheduledDateTime,
                data.scheduledDateTime,
                action.action,
                subcontext
            );
            return {
                state: { ...state, scheduledDateTime: inner.state },
                data: { ...data, scheduledDateTime: inner.data },
            };
        }
        case "CONTACT": {
            const inner = Fields.contact.reduce(
                state.contact,
                data.contact,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contact: inner.state },
                data: { ...data, contact: inner.data },
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
    addedDateTime: function (
        props: WidgetExtraProps<typeof Fields.addedDateTime> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ADDED_DATE_TIME",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "addedDateTime", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.addedDateTime.component
                state={context.state.addedDateTime}
                data={context.data.addedDateTime}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Added Date Time"}
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
    scheduledDateTime: function (
        props: WidgetExtraProps<typeof Fields.scheduledDateTime> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SCHEDULED_DATE_TIME",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "scheduledDateTime",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.scheduledDateTime.component
                state={context.state.scheduledDateTime}
                data={context.data.scheduledDateTime}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Scheduled Date Time"}
            />
        );
    },
    contact: function (
        props: WidgetExtraProps<typeof Fields.contact> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTACT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "contact", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contact.component
                state={context.state.contact}
                data={context.data.contact}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contact"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: SCHEDULED_SITE_VISIT_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let addedDateTimeState;
        {
            const inner = Fields.addedDateTime.initialize(
                data.addedDateTime,
                subcontext,
                subparameters.addedDateTime
            );
            addedDateTimeState = inner.state;
            data = { ...data, addedDateTime: inner.data };
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
        let scheduledDateTimeState;
        {
            const inner = Fields.scheduledDateTime.initialize(
                data.scheduledDateTime,
                subcontext,
                subparameters.scheduledDateTime
            );
            scheduledDateTimeState = inner.state;
            data = { ...data, scheduledDateTime: inner.data };
        }
        let contactState;
        {
            const inner = Fields.contact.initialize(
                data.contact,
                subcontext,
                subparameters.contact
            );
            contactState = inner.state;
            data = { ...data, contact: inner.data };
        }
        let state = {
            initialParameters: parameters,
            addedDateTime: addedDateTimeState,
            user: userState,
            scheduledDateTime: scheduledDateTimeState,
            contact: contactState,
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
                    meta={SCHEDULED_SITE_VISIT_META}
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
    addedDateTime: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.addedDateTime>
    >;
    user: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.user>
    >;
    scheduledDateTime: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.scheduledDateTime>
    >;
    contact: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contact>
    >;
};
// END MAGIC -- DO NOT EDIT
