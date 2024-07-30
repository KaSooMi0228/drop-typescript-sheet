import { fromPairs } from "lodash";
import * as React from "react";
import { Table } from "react-bootstrap";
import { useQuery } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import componentId from "../../clay/componentId";
import { useTransDrop } from "../../clay/dnd";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { StaticDateTimeWidget } from "../../clay/widgets/DateTimeWidget";
import {
    FormField,
    Optional,
    OptionalFormField,
} from "../../clay/widgets/FormField";
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
import { FieldRow } from "../../clay/widgets/layout";
import { insertIndex, removeIndex } from "../../clay/widgets/ListWidget";
import { hasPermission } from "../../permissions";
import { ContactsWidget, ContactTypesContext } from "../contact/ContactsWidget";
import { SelectContactWidget } from "../contact/select-contact-widget";
import { useUser } from "../state";
import { UserLinkWidget } from "../user";
import { Project, PROJECT_META } from "./table";

export type Data = Project;

export const Fields = {
    billingContacts: ContactsWidget,
    contacts: Optional(ContactsWidget),
    quoteRequestedBy: FormField(SelectContactWidget),
    quoteRequestCompletedBy: OptionalFormField(UserLinkWidget),
    quoteRequestDate: FormField(StaticDateTimeWidget),
};

function actionMoveBillingToCustomer(
    state: State,
    data: Project,
    sourceIndex: number,
    destinationIndex: number
) {
    return {
        state: {
            ...state,
            billingContacts: {
                ...state.billingContacts,
                items: removeIndex(state.billingContacts.items, sourceIndex),
            },
            contacts: {
                ...state.contacts,
                items: insertIndex(
                    state.contacts.items,
                    destinationIndex,
                    state.billingContacts.items[sourceIndex]
                ),
            },
        },
        data: {
            ...data,
            billingContacts: removeIndex(data.billingContacts, sourceIndex),
            contacts: insertIndex(
                data.contacts,
                destinationIndex,
                data.billingContacts[sourceIndex]
            ),
        },
    };
}

function actionMoveCustomerToBilling(
    state: State,
    data: Project,
    sourceIndex: number,
    destinationIndex: number
) {
    return {
        state: {
            ...state,
            billingContacts: {
                ...state.billingContacts,
                items: [state.contacts.items[sourceIndex]],
            },
            contacts: {
                ...state.contacts,
                items: [
                    ...state.billingContacts.items,
                    ...removeIndex(state.contacts.items, sourceIndex),
                ],
            },
        },
        data: {
            ...data,
            billingContacts: [data.contacts[sourceIndex]],
            contacts: [
                ...data.billingContacts,
                ...removeIndex(data.contacts, sourceIndex),
            ],
        },
    };
}

function Component(props: Props) {
    const user = useUser();
    const types: Dictionary<string> = fromPairs(
        useQuery(
            {
                tableName: "ContactType",
                columns: ["id", "name"],
            },
            []
        ) || []
    );

    const selectedContacts = [
        ...props.data.billingContacts.map((contact) => contact.contact),
        ...props.data.contacts.map((contact) => contact.contact),
    ];

    const myId = componentId();

    useTransDrop(
        myId + "-billing",
        myId + "-customer",
        React.useCallback((sourceIndex, destinationIndex) => {
            props.dispatch({
                type: "MOVE_BILLING_TO_CUSTOMER",
                sourceIndex,
                destinationIndex,
            });
        }, [])
    );

    useTransDrop(
        myId + "-customer",
        myId + "-billing",
        React.useCallback((sourceIndex, destinationIndex) => {
            props.dispatch({
                type: "MOVE_CUSTOMER_TO_BILLING",
                sourceIndex,
                destinationIndex,
            });
        }, [])
    );

    return (
        <ContactTypesContext.Provider value={types}>
            <div style={{ minHeight: "2em" }} />

            <Table>
                <thead>
                    <tr>
                        <th />
                        <th>Billing Contact</th>
                        <th>Phone</th>
                        <th>Company</th>
                        <th>Title</th>
                    </tr>
                </thead>
                <widgets.billingContacts
                    forbiddenContactsToAdd={selectedContacts}
                    extraItemForAdd={
                        props.data.billingContacts.length === 0 ||
                        hasPermission(
                            user,
                            "Project",
                            "add-multiple-billing-contacts"
                        )
                    }
                    droppableId={myId + "-billing"}
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

                <widgets.contacts
                    forbiddenContactsToAdd={selectedContacts}
                    droppableId={myId + "-customer"}
                />
            </Table>
            <widgets.quoteRequestedBy
                contacts={[
                    ...props.data.billingContacts,
                    ...props.data.contacts,
                ]}
            />
            <FieldRow>
                <widgets.quoteRequestCompletedBy
                    readOnly
                    label="RFQ Entered By"
                />
                <widgets.quoteRequestDate />
            </FieldRow>
        </ContactTypesContext.Provider>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.billingContacts> &
    WidgetContext<typeof Fields.contacts> &
    WidgetContext<typeof Fields.quoteRequestedBy> &
    WidgetContext<typeof Fields.quoteRequestCompletedBy> &
    WidgetContext<typeof Fields.quoteRequestDate>;
type ExtraProps = {};
type BaseState = {
    billingContacts: WidgetState<typeof Fields.billingContacts>;
    contacts: WidgetState<typeof Fields.contacts>;
    quoteRequestedBy: WidgetState<typeof Fields.quoteRequestedBy>;
    quoteRequestCompletedBy: WidgetState<typeof Fields.quoteRequestCompletedBy>;
    quoteRequestDate: WidgetState<typeof Fields.quoteRequestDate>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "BILLING_CONTACTS";
          action: WidgetAction<typeof Fields.billingContacts>;
      }
    | { type: "CONTACTS"; action: WidgetAction<typeof Fields.contacts> }
    | {
          type: "QUOTE_REQUESTED_BY";
          action: WidgetAction<typeof Fields.quoteRequestedBy>;
      }
    | {
          type: "QUOTE_REQUEST_COMPLETED_BY";
          action: WidgetAction<typeof Fields.quoteRequestCompletedBy>;
      }
    | {
          type: "QUOTE_REQUEST_DATE";
          action: WidgetAction<typeof Fields.quoteRequestDate>;
      }
    | {
          type: "MOVE_BILLING_TO_CUSTOMER";
          sourceIndex: number;
          destinationIndex: number;
      }
    | {
          type: "MOVE_CUSTOMER_TO_BILLING";
          sourceIndex: number;
          destinationIndex: number;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.billingContacts,
        data.billingContacts,
        cache,
        "billingContacts",
        errors
    );
    subvalidate(Fields.contacts, data.contacts, cache, "contacts", errors);
    subvalidate(
        Fields.quoteRequestedBy,
        data.quoteRequestedBy,
        cache,
        "quoteRequestedBy",
        errors
    );
    subvalidate(
        Fields.quoteRequestCompletedBy,
        data.quoteRequestCompletedBy,
        cache,
        "quoteRequestCompletedBy",
        errors
    );
    subvalidate(
        Fields.quoteRequestDate,
        data.quoteRequestDate,
        cache,
        "quoteRequestDate",
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
        case "BILLING_CONTACTS": {
            const inner = Fields.billingContacts.reduce(
                state.billingContacts,
                data.billingContacts,
                action.action,
                subcontext
            );
            return {
                state: { ...state, billingContacts: inner.state },
                data: { ...data, billingContacts: inner.data },
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
        case "QUOTE_REQUESTED_BY": {
            const inner = Fields.quoteRequestedBy.reduce(
                state.quoteRequestedBy,
                data.quoteRequestedBy,
                action.action,
                subcontext
            );
            return {
                state: { ...state, quoteRequestedBy: inner.state },
                data: { ...data, quoteRequestedBy: inner.data },
            };
        }
        case "QUOTE_REQUEST_COMPLETED_BY": {
            const inner = Fields.quoteRequestCompletedBy.reduce(
                state.quoteRequestCompletedBy,
                data.quoteRequestCompletedBy,
                action.action,
                subcontext
            );
            return {
                state: { ...state, quoteRequestCompletedBy: inner.state },
                data: { ...data, quoteRequestCompletedBy: inner.data },
            };
        }
        case "QUOTE_REQUEST_DATE": {
            const inner = Fields.quoteRequestDate.reduce(
                state.quoteRequestDate,
                data.quoteRequestDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, quoteRequestDate: inner.state },
                data: { ...data, quoteRequestDate: inner.data },
            };
        }
        case "MOVE_BILLING_TO_CUSTOMER":
            return actionMoveBillingToCustomer(
                state,
                data,
                action.sourceIndex,
                action.destinationIndex
            );
        case "MOVE_CUSTOMER_TO_BILLING":
            return actionMoveCustomerToBilling(
                state,
                data,
                action.sourceIndex,
                action.destinationIndex
            );
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
    billingContacts: function (
        props: WidgetExtraProps<typeof Fields.billingContacts> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "BILLING_CONTACTS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "billingContacts", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.billingContacts.component
                state={context.state.billingContacts}
                data={context.data.billingContacts}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Billing Contacts"}
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
    quoteRequestedBy: function (
        props: WidgetExtraProps<typeof Fields.quoteRequestedBy> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "QUOTE_REQUESTED_BY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "quoteRequestedBy", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.quoteRequestedBy.component
                state={context.state.quoteRequestedBy}
                data={context.data.quoteRequestedBy}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Quote Requested By"}
            />
        );
    },
    quoteRequestCompletedBy: function (
        props: WidgetExtraProps<typeof Fields.quoteRequestCompletedBy> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "QUOTE_REQUEST_COMPLETED_BY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "quoteRequestCompletedBy",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.quoteRequestCompletedBy.component
                state={context.state.quoteRequestCompletedBy}
                data={context.data.quoteRequestCompletedBy}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Quote Request Completed By"}
            />
        );
    },
    quoteRequestDate: function (
        props: WidgetExtraProps<typeof Fields.quoteRequestDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "QUOTE_REQUEST_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "quoteRequestDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.quoteRequestDate.component
                state={context.state.quoteRequestDate}
                data={context.data.quoteRequestDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Quote Request Date"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PROJECT_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let billingContactsState;
        {
            const inner = Fields.billingContacts.initialize(
                data.billingContacts,
                subcontext,
                subparameters.billingContacts
            );
            billingContactsState = inner.state;
            data = { ...data, billingContacts: inner.data };
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
        let quoteRequestedByState;
        {
            const inner = Fields.quoteRequestedBy.initialize(
                data.quoteRequestedBy,
                subcontext,
                subparameters.quoteRequestedBy
            );
            quoteRequestedByState = inner.state;
            data = { ...data, quoteRequestedBy: inner.data };
        }
        let quoteRequestCompletedByState;
        {
            const inner = Fields.quoteRequestCompletedBy.initialize(
                data.quoteRequestCompletedBy,
                subcontext,
                subparameters.quoteRequestCompletedBy
            );
            quoteRequestCompletedByState = inner.state;
            data = { ...data, quoteRequestCompletedBy: inner.data };
        }
        let quoteRequestDateState;
        {
            const inner = Fields.quoteRequestDate.initialize(
                data.quoteRequestDate,
                subcontext,
                subparameters.quoteRequestDate
            );
            quoteRequestDateState = inner.state;
            data = { ...data, quoteRequestDate: inner.data };
        }
        let state = {
            initialParameters: parameters,
            billingContacts: billingContactsState,
            contacts: contactsState,
            quoteRequestedBy: quoteRequestedByState,
            quoteRequestCompletedBy: quoteRequestCompletedByState,
            quoteRequestDate: quoteRequestDateState,
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
                <RecordContext meta={PROJECT_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    billingContacts: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.billingContacts>
    >;
    contacts: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contacts>
    >;
    quoteRequestedBy: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.quoteRequestedBy>
    >;
    quoteRequestCompletedBy: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.quoteRequestCompletedBy>
    >;
    quoteRequestDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.quoteRequestDate>
    >;
};
// END MAGIC -- DO NOT EDIT
