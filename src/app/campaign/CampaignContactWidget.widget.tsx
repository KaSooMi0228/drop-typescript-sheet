import * as React from "react";
import { Button } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { Link } from "../../clay/link";
import { LocalDate } from "../../clay/LocalDate";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../clay/quick-cache";
import { RemoveButton } from "../../clay/remove-button";
import { DateWidget } from "../../clay/widgets/DateWidget";
import { Optional } from "../../clay/widgets/FormField";
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
import { useListItemContext } from "../../clay/widgets/ListWidget";
import { COMPANY_META } from "../company/table";
import { ContactLinkWidget } from "../contact/link";
import { CONTACT_META } from "../contact/table";
import { UserLinkWidget } from "../user";
import { User } from "../user/table";
import { CampaignContactDetail, CAMPAIGN_CONTACT_DETAIL_META } from "./table";

type Data = CampaignContactDetail;

const Fields = {
    contact: ContactLinkWidget,
    user: Optional(UserLinkWidget),
    date: Optional(DateWidget),
};

type ExtraProps = {
    defaultUser: Link<User>;
    defaultDate: LocalDate | null;
};

export function Component(props: Props) {
    const contact = useQuickRecord(CONTACT_META, props.data.contact);
    const company = useQuickRecord(COMPANY_META, contact?.company || null);
    const listItemContext = useListItemContext();
    return (
        <tr {...listItemContext.draggableProps}>
            <td>{listItemContext.dragHandle}</td>
            <td>
                {contact?.name}{" "}
                <Button
                    onClick={() =>
                        window.open("#/contact/edit/" + props.data.contact)
                    }
                >
                    Open
                </Button>
            </td>
            <td>{company?.name}</td>
            <td>{contact?.email}</td>
            <td>
                <widgets.user fallback={props.defaultUser} />
            </td>
            <td>
                <widgets.date fallback={props.defaultDate} />
            </td>
            <td>
                <RemoveButton />
            </td>
        </tr>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.contact> &
    WidgetContext<typeof Fields.user> &
    WidgetContext<typeof Fields.date>;
type BaseState = {
    contact: WidgetState<typeof Fields.contact>;
    user: WidgetState<typeof Fields.user>;
    date: WidgetState<typeof Fields.date>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "CONTACT"; action: WidgetAction<typeof Fields.contact> }
    | { type: "USER"; action: WidgetAction<typeof Fields.user> }
    | { type: "DATE"; action: WidgetAction<typeof Fields.date> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.contact, data.contact, cache, "contact", errors);
    subvalidate(Fields.user, data.user, cache, "user", errors);
    subvalidate(Fields.date, data.date, cache, "date", errors);
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: CAMPAIGN_CONTACT_DETAIL_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
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
        let state = {
            initialParameters: parameters,
            contact: contactState,
            user: userState,
            date: dateState,
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
                    meta={CAMPAIGN_CONTACT_DETAIL_META}
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
    contact: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contact>
    >;
    user: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.user>
    >;
    date: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.date>
    >;
};
// END MAGIC -- DO NOT EDIT
