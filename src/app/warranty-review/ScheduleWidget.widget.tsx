import * as React from "react";
import { Table } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { DateWidget } from "../../clay/widgets/DateWidget";
import { Optional, OptionalFormField } from "../../clay/widgets/FormField";
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
import { ContactsWidget } from "../contact/ContactsWidget";
import { useUser } from "../state";
import { WarrantyReview, WARRANTY_REVIEW_META } from "./table";

type Data = WarrantyReview;

const Fields = {
    ownersRepresentatives: Optional(ContactsWidget),
    contacts: Optional(ContactsWidget),
    scheduledDate: OptionalFormField(DateWidget),
};

function Component(props: Props) {
    const user = useUser();

    const selectedContacts = [
        ...props.data.contacts.map((contact) => contact.contact),
    ];

    return (
        <>
            <Table>
                <thead>
                    <tr>
                        <th />
                        <th>Owner's Representative</th>
                        <th>Phone</th>
                        <th>Company</th>
                        <th>Title</th>
                    </tr>
                </thead>
                <widgets.ownersRepresentatives
                    forbiddenContactsToAdd={selectedContacts}
                    extraItemForAdd={
                        props.data.ownersRepresentatives.length === 0 ||
                        hasPermission(
                            user,
                            "Project",
                            "add-multiple-billing-contacts"
                        )
                    }
                />
                <thead>
                    <tr>
                        <th />
                        <th>Customer Contact(s)</th>
                        <th>Phone</th>
                        <th>Company</th>
                        <th>Title</th>
                    </tr>
                </thead>

                <widgets.contacts forbiddenContactsToAdd={selectedContacts} />
            </Table>
            <widgets.scheduledDate label="Warranty Review Scheduled For" />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.ownersRepresentatives> &
    WidgetContext<typeof Fields.contacts> &
    WidgetContext<typeof Fields.scheduledDate>;
type ExtraProps = {};
type BaseState = {
    ownersRepresentatives: WidgetState<typeof Fields.ownersRepresentatives>;
    contacts: WidgetState<typeof Fields.contacts>;
    scheduledDate: WidgetState<typeof Fields.scheduledDate>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "OWNERS_REPRESENTATIVES";
          action: WidgetAction<typeof Fields.ownersRepresentatives>;
      }
    | { type: "CONTACTS"; action: WidgetAction<typeof Fields.contacts> }
    | {
          type: "SCHEDULED_DATE";
          action: WidgetAction<typeof Fields.scheduledDate>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.ownersRepresentatives,
        data.ownersRepresentatives,
        cache,
        "ownersRepresentatives",
        errors
    );
    subvalidate(Fields.contacts, data.contacts, cache, "contacts", errors);
    subvalidate(
        Fields.scheduledDate,
        data.scheduledDate,
        cache,
        "scheduledDate",
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
        case "OWNERS_REPRESENTATIVES": {
            const inner = Fields.ownersRepresentatives.reduce(
                state.ownersRepresentatives,
                data.ownersRepresentatives,
                action.action,
                subcontext
            );
            return {
                state: { ...state, ownersRepresentatives: inner.state },
                data: { ...data, ownersRepresentatives: inner.data },
            };
        }
        case "CONTACTS": {
            const inner = Fields.contacts.reduce(
                state.contacts,
                data.contacts,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contacts: inner.state },
                data: { ...data, contacts: inner.data },
            };
        }
        case "SCHEDULED_DATE": {
            const inner = Fields.scheduledDate.reduce(
                state.scheduledDate,
                data.scheduledDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, scheduledDate: inner.state },
                data: { ...data, scheduledDate: inner.data },
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
    ownersRepresentatives: function (
        props: WidgetExtraProps<typeof Fields.ownersRepresentatives> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "OWNERS_REPRESENTATIVES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "ownersRepresentatives",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.ownersRepresentatives.component
                state={context.state.ownersRepresentatives}
                data={context.data.ownersRepresentatives}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Owners Representatives"}
            />
        );
    },
    contacts: function (
        props: WidgetExtraProps<typeof Fields.contacts> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTACTS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "contacts", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contacts.component
                state={context.state.contacts}
                data={context.data.contacts}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contacts"}
            />
        );
    },
    scheduledDate: function (
        props: WidgetExtraProps<typeof Fields.scheduledDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SCHEDULED_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "scheduledDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.scheduledDate.component
                state={context.state.scheduledDate}
                data={context.data.scheduledDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Scheduled Date"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WARRANTY_REVIEW_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let ownersRepresentativesState;
        {
            const inner = Fields.ownersRepresentatives.initialize(
                data.ownersRepresentatives,
                subcontext,
                subparameters.ownersRepresentatives
            );
            ownersRepresentativesState = inner.state;
            data = { ...data, ownersRepresentatives: inner.data };
        }
        let contactsState;
        {
            const inner = Fields.contacts.initialize(
                data.contacts,
                subcontext,
                subparameters.contacts
            );
            contactsState = inner.state;
            data = { ...data, contacts: inner.data };
        }
        let scheduledDateState;
        {
            const inner = Fields.scheduledDate.initialize(
                data.scheduledDate,
                subcontext,
                subparameters.scheduledDate
            );
            scheduledDateState = inner.state;
            data = { ...data, scheduledDate: inner.data };
        }
        let state = {
            initialParameters: parameters,
            ownersRepresentatives: ownersRepresentativesState,
            contacts: contactsState,
            scheduledDate: scheduledDateState,
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
                <RecordContext meta={WARRANTY_REVIEW_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    ownersRepresentatives: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.ownersRepresentatives>
    >;
    contacts: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contacts>
    >;
    scheduledDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.scheduledDate>
    >;
};
// END MAGIC -- DO NOT EDIT
