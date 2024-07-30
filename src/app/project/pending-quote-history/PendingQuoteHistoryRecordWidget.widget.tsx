import { User } from "@sentry/node";
import { differenceInDays } from "date-fns";
import * as React from "react";
import { Card } from "react-bootstrap";
import { LandingLikelihoodLinkWidget } from ".";
import { Dictionary } from "../../../clay/common";
import { Link } from "../../../clay/link";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { RemoveButton } from "../../../clay/remove-button";
import { ValidationError } from "../../../clay/widgets";
import { StaticDateTimeWidget } from "../../../clay/widgets/DateTimeWidget";
import { DateWidget } from "../../../clay/widgets/DateWidget";
import {
    FormField,
    FormWrapper,
    Optional,
} from "../../../clay/widgets/FormField";
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
import { FieldRow } from "../../../clay/widgets/layout";
import { useListItemContext } from "../../../clay/widgets/ListWidget";
import { RichTextWidget } from "../../rich-text-widget";
import { UserLinkWidget } from "../../user";
import {
    PendingQuoteHistoryRecord,
    PENDING_QUOTE_HISTORY_RECORD_META,
    REVISING_QUOTE_ID,
} from "./table";

export type Data = PendingQuoteHistoryRecord;

export const Fields = {
    date: FormField(StaticDateTimeWidget),
    followupDate: FormField(DateWidget),
    landingLikelihood: FormField(LandingLikelihoodLinkWidget),
    message: RichTextWidget,
    user: Optional(UserLinkWidget),
};

function validate(data: Data, cache: QuickCacheApi) {
    if (data.date !== null && differenceInDays(new Date(), data.date) >= 1) {
        return [];
    } else {
        const errors = baseValidate(data, cache);
        return errors.filter(
            (error) =>
                error.field !== "followupDate" ||
                data.landingLikelihood != REVISING_QUOTE_ID
        );
    }
}
export function actionPrepare(
    state: State,
    data: PendingQuoteHistoryRecord,
    user: Link<User>
) {
    return {
        state,
        data: {
            ...data,
            date: new Date(),
            user,
        },
    };
}

function Component(props: Props) {
    const listItemContext = useListItemContext();
    const isMutable =
        props.status.mutable &&
        (props.data.date === null ||
            differenceInDays(new Date(), props.data.date) < 1);

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
                        <widgets.landingLikelihood />
                        <widgets.followupDate label="Next Follow-Up Date" />
                        <widgets.date style={{ maxWidth: "12em" }} />
                        <FormWrapper label="User" style={{ maxWidth: "12em" }}>
                            <widgets.user readOnly />
                        </FormWrapper>
                        <FormWrapper label="" style={{ maxWidth: "4em" }}>
                            <div>{isMutable && <RemoveButton />}</div>
                        </FormWrapper>
                    </FieldRow>
                    <widgets.message />
                </Card.Body>
            </Card>
        </ReactContext.Provider>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.date> &
    WidgetContext<typeof Fields.followupDate> &
    WidgetContext<typeof Fields.landingLikelihood> &
    WidgetContext<typeof Fields.message> &
    WidgetContext<typeof Fields.user>;
type ExtraProps = {};
type BaseState = {
    date: WidgetState<typeof Fields.date>;
    followupDate: WidgetState<typeof Fields.followupDate>;
    landingLikelihood: WidgetState<typeof Fields.landingLikelihood>;
    message: WidgetState<typeof Fields.message>;
    user: WidgetState<typeof Fields.user>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "DATE"; action: WidgetAction<typeof Fields.date> }
    | {
          type: "FOLLOWUP_DATE";
          action: WidgetAction<typeof Fields.followupDate>;
      }
    | {
          type: "LANDING_LIKELIHOOD";
          action: WidgetAction<typeof Fields.landingLikelihood>;
      }
    | { type: "MESSAGE"; action: WidgetAction<typeof Fields.message> }
    | { type: "USER"; action: WidgetAction<typeof Fields.user> }
    | { type: "PREPARE"; user: Link<User> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.date, data.date, cache, "date", errors);
    subvalidate(
        Fields.followupDate,
        data.followupDate,
        cache,
        "followupDate",
        errors
    );
    subvalidate(
        Fields.landingLikelihood,
        data.landingLikelihood,
        cache,
        "landingLikelihood",
        errors
    );
    subvalidate(Fields.message, data.message, cache, "message", errors);
    subvalidate(Fields.user, data.user, cache, "user", errors);
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
        case "DATE": {
            const inner = Fields.date.reduce(
                state.date,
                data.date,
                action.action,
                subcontext
            );
            return {
                state: { ...state, date: inner.state },
                data: { ...data, date: inner.data },
            };
        }
        case "FOLLOWUP_DATE": {
            const inner = Fields.followupDate.reduce(
                state.followupDate,
                data.followupDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, followupDate: inner.state },
                data: { ...data, followupDate: inner.data },
            };
        }
        case "LANDING_LIKELIHOOD": {
            const inner = Fields.landingLikelihood.reduce(
                state.landingLikelihood,
                data.landingLikelihood,
                action.action,
                subcontext
            );
            return {
                state: { ...state, landingLikelihood: inner.state },
                data: { ...data, landingLikelihood: inner.data },
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
        case "PREPARE":
            return actionPrepare(state, data, action.user);
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
    date: function (
        props: WidgetExtraProps<typeof Fields.date> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "DATE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "date", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.date.component
                state={context.state.date}
                data={context.data.date}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Date"}
            />
        );
    },
    followupDate: function (
        props: WidgetExtraProps<typeof Fields.followupDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "FOLLOWUP_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "followupDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.followupDate.component
                state={context.state.followupDate}
                data={context.data.followupDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Followup Date"}
            />
        );
    },
    landingLikelihood: function (
        props: WidgetExtraProps<typeof Fields.landingLikelihood> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "LANDING_LIKELIHOOD",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "landingLikelihood",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.landingLikelihood.component
                state={context.state.landingLikelihood}
                data={context.data.landingLikelihood}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Landing Likelihood"}
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PENDING_QUOTE_HISTORY_RECORD_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let dateState;
        {
            const inner = Fields.date.initialize(
                data.date,
                subcontext,
                subparameters.date
            );
            dateState = inner.state;
            data = { ...data, date: inner.data };
        }
        let followupDateState;
        {
            const inner = Fields.followupDate.initialize(
                data.followupDate,
                subcontext,
                subparameters.followupDate
            );
            followupDateState = inner.state;
            data = { ...data, followupDate: inner.data };
        }
        let landingLikelihoodState;
        {
            const inner = Fields.landingLikelihood.initialize(
                data.landingLikelihood,
                subcontext,
                subparameters.landingLikelihood
            );
            landingLikelihoodState = inner.state;
            data = { ...data, landingLikelihood: inner.data };
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
        let state = {
            initialParameters: parameters,
            date: dateState,
            followupDate: followupDateState,
            landingLikelihood: landingLikelihoodState,
            message: messageState,
            user: userState,
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
                <RecordContext
                    meta={PENDING_QUOTE_HISTORY_RECORD_META}
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
    date: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.date>
    >;
    followupDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.followupDate>
    >;
    landingLikelihood: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.landingLikelihood>
    >;
    message: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.message>
    >;
    user: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.user>
    >;
};
// END MAGIC -- DO NOT EDIT
