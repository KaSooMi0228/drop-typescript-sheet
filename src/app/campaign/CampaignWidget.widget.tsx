import { format as formatDate } from "date-fns";
import { diff } from "jsondiffpatch";
import { some } from "lodash";
import * as React from "react";
import {
    Button,
    Modal as BootstrapModal,
    ModalBody,
    ModalTitle,
    Table,
} from "react-bootstrap";
import Modal from "react-modal";
import {
    fetchRawRecord,
    patchRecord,
    storeRecord,
    useRecordQuery,
} from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { useEditableContext } from "../../clay/edit-context";
import { Link } from "../../clay/link";
import { propCheck } from "../../clay/propCheck";
import {
    QuickCacheApi,
    useQuickRecord,
    useQuickRecords,
} from "../../clay/quick-cache";
import { SaveDeleteButton } from "../../clay/save-delete-button";
import { newUUID } from "../../clay/uuid";
import { DateWidget } from "../../clay/widgets/DateWidget";
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
import { FieldRow } from "../../clay/widgets/layout";
import { ListWidget } from "../../clay/widgets/ListWidget";
import { SwitchWidget } from "../../clay/widgets/SwitchWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { CompanyLinkWidget } from "../company";
import { COMPANY_META } from "../company/table";
import {
    Contact,
    ContactFollowUp,
    ContactToJSON,
    CONTACT_FOLLOWUP_ACTIVITY_META,
    CONTACT_META,
    JSONToContact,
} from "../contact/table";
import { useLocalFieldWidget } from "../inbox/useLocalWidget";
import { useUser } from "../state";
import { CONTENT_AREA } from "../styles";
import { UserLinkWidget } from "../user";
import { USER_META } from "../user/table";
import CampaignContactWidget from "./CampaignContactWidget.widget";
import { Campaign, CAMPAIGN_META } from "./table";

export type Data = Campaign;

export const Fields = {
    name: FormField(TextWidget),
    startDate: FormField(DateWidget),
    endDate: FormField(DateWidget),
    contacts: ListWidget(CampaignContactWidget),
    defaultContactUser: FormField(UserLinkWidget),
    defaultContactDate: FormField(DateWidget),
    activated: SwitchWidget,
};

export function actionAddContact(
    state: State,
    data: Campaign,
    contact: Link<Contact>
) {
    const inner = Fields.contacts.initialize(
        [
            ...data.contacts,
            {
                contact,
                date: null,
                user: null,
            },
        ],
        {}
    );
    return {
        state: {
            ...state,
            contacts: inner.state,
        },
        data: {
            ...data,
            contacts: inner.data,
        },
    };
}

export function actionRemoveContact(
    state: State,
    data: Campaign,
    contact: Link<Contact>
) {
    const inner = Fields.contacts.initialize(
        data.contacts.filter((x) => x.contact !== contact),
        {}
    );
    return {
        state: {
            ...state,
            contacts: inner.state,
        },
        data: {
            ...data,
            contacts: inner.data,
        },
    };
}

function AddContactsWidget(props: {
    campaign: Campaign;
    setMode: (mode: string) => void;
    dispatch: (action: Action) => void;
}) {
    const companyLink = useLocalFieldWidget(CompanyLinkWidget, null, {});
    const user = useUser();

    const contacts =
        useRecordQuery(
            CONTACT_META,
            {
                filters: [
                    {
                        column: "company",
                        filter: {
                            equal: companyLink.data,
                        },
                    },
                    {
                        column: "active",
                        filter: {
                            equal: true,
                        },
                    },
                ],
                sorts: ["name"],
            },
            [companyLink.data],
            !!companyLink.data
        ) || [];

    return (
        <Modal isOpen={true} onRequestClose={() => props.setMode("")}>
            <BootstrapModal.Header>
                <ModalTitle>Add Contacts</ModalTitle>
            </BootstrapModal.Header>
            <ModalBody {...CONTENT_AREA}>
                <FormWrapper label="Company">
                    {companyLink.component}
                </FormWrapper>
                <div {...CONTENT_AREA}>
                    <Table>
                        <thead>
                            <tr>
                                <th>Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map((contact) => {
                                const hasContact = some(
                                    props.campaign.contacts,
                                    (campaign_contact) =>
                                        campaign_contact.contact ==
                                        contact.id.uuid
                                );
                                /*const campaignContact =
                                    props.contactMap &&
                                    props.contactMap[contact.id.uuid];*/

                                return (
                                    <tr key={contact.id.uuid}>
                                        <td>{contact.name}</td>
                                        <td>
                                            {!hasContact && (
                                                <Button
                                                    style={{
                                                        width: "10em",
                                                    }}
                                                    onClick={() => {
                                                        props.dispatch({
                                                            type: "ADD_CONTACT",
                                                            contact:
                                                                contact.id.uuid,
                                                        });
                                                    }}
                                                >
                                                    Add
                                                </Button>
                                            )}
                                            {hasContact && (
                                                <Button
                                                    style={{
                                                        width: "10em",
                                                    }}
                                                    variant="danger"
                                                    onClick={() => {
                                                        props.dispatch({
                                                            type: "REMOVE_CONTACT",
                                                            contact:
                                                                contact.id.uuid,
                                                        });
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>
            </ModalBody>
        </Modal>
    );
}
/*function FollowupModal(props: { id: string; requestClose: () => void }) {
    const { component, data, onSave, isValid } = useRecordWidget(
        FollowUpContactWidget,
        props.id,
        () => {
            props.requestClose();
        }
    );
    return (
        <Modal isOpen={true} onRequestClose={props.requestClose}>
            {component}
            <Button onClick={onSave}>Save</Button>
        </Modal>
    );
}*/

function FollowupRow(props: { contact: Contact; followUp: ContactFollowUp }) {
    const company = useQuickRecord(COMPANY_META, props.contact.company || null);
    const user = useQuickRecord(USER_META, props.followUp.user);
    const activity = useQuickRecord(
        CONTACT_FOLLOWUP_ACTIVITY_META,
        props.followUp.activity
    );
    const [modalOpen, setModalOpen] = React.useState(false);

    return (
        <tr>
            <td>
                {/*modalOpen && (
                    <FollowupModal
                        id={props.contact.id.uuid}
                        requestClose={() => setModalOpen(false)}
                    />
                )*/}
                {props.contact.name}{" "}
                <Button
                    onClick={() =>
                        window.open("#/contact/edit/" + props.contact.id.uuid)
                    }
                >
                    Open
                </Button>
            </td>
            <td>{company?.name}</td>
            <td>{props.contact.email}</td>
            <td>{user?.name}</td>
            <td>
                {formatDate(
                    props.followUp.actual ||
                        props.followUp.scheduled?.asDate()!,
                    "Y-M-d"
                )}
            </td>
            {props.followUp.actual && <td>{activity?.name}</td>}
            {props.followUp.actual && (
                <td
                    dangerouslySetInnerHTML={{ __html: props.followUp.message }}
                />
            )}
            {/*!props.followUp.actual && (
                <td colSpan={2}>
                    <Button onClick={() => setModalOpen(true)}>Record</Button>
                </td>
            )*/}
        </tr>
    );
}

function Component(props: Props) {
    const [mode, setMode] = React.useState("");
    const editContext = useEditableContext();

    const onActivate = React.useCallback(async () => {
        if (
            window.confirm(
                "Are you sure you want to activate this campaign? This cannot be undone."
            )
        ) {
            const contacts = await Promise.all(
                props.data.contacts.map(async (contact) => {
                    const currentContactRaw = (await fetchRawRecord(
                        CONTACT_META,
                        contact.contact!
                    ))!;
                    const currentContact = JSONToContact(currentContactRaw);
                    const newContact: Contact = {
                        ...currentContact,
                        followUps: [
                            ...currentContact.followUps.filter(
                                (followUp) => followUp.actual
                            ),
                            {
                                id: newUUID(),
                                scheduled:
                                    contact.date ||
                                    props.data.defaultContactDate,
                                user:
                                    contact.user ||
                                    props.data.defaultContactUser,
                                campaign: props.data.id.uuid,
                                message: "",
                                activity: null,
                                actual: null,
                            },
                        ],
                    };
                    const newContactRaw = ContactToJSON(newContact);
                    const patch = diff(currentContactRaw, newContactRaw);
                    await patchRecord(
                        CONTACT_META,
                        "Campaign",
                        contact.contact!,
                        patch
                    );
                })
            );

            props.dispatch({
                type: "ACTIVATED",
                action: {
                    type: "SET",
                    value: true,
                },
            });

            editContext.save!.onClick(null, []);
        }
    }, [props.data]);

    const contacts =
        useQuickRecords(
            CONTACT_META,
            props.data.contacts.map((x) => x.contact!)
        ) || [];

    const onDuplicate = React.useCallback(() => {
        const newId = newUUID();
        storeRecord(CAMPAIGN_META, "campaigns", {
            id: newId,
            added_date_time: null,
            recordVersion: { version: null },
            name: "",
            startDate: null,
            endDate: null,
            number: null,
            contacts: props.data.contacts.map((contact) => ({
                contact: contact.contact,
                date: null,
                user: contact.user,
            })),
            defaultContactDate: props.data.defaultContactDate,
            defaultContactUser: props.data.defaultContactUser,
            activated: false,
        }).then(() => {
            window.open("#/campaigns/edit/" + newId.uuid);
        });
    }, [props.data]);

    return (
        <>
            <FieldRow>
                <widgets.name />
                <widgets.startDate />
                <widgets.endDate />
            </FieldRow>
            {!props.data.activated && (
                <FieldRow>
                    <widgets.defaultContactDate />
                    <widgets.defaultContactUser />
                </FieldRow>
            )}
            {mode === "adding-contacts" && (
                <AddContactsWidget
                    campaign={props.data}
                    setMode={setMode}
                    dispatch={props.dispatch}
                />
            )}
            {!props.data.activated && (
                <div {...CONTENT_AREA}>
                    <Table>
                        <thead>
                            <tr>
                                <th />
                                <th>Name</th>
                                <th>Company</th>
                                <th>Email</th>
                                <th>User To Follow Up</th>
                            </tr>
                        </thead>
                        <widgets.contacts
                            itemProps={{
                                defaultUser: props.data.defaultContactUser,
                                defaultDate: props.data.defaultContactDate,
                            }}
                            containerClass="tbody"
                        />
                    </Table>
                </div>
            )}
            {props.data.activated && (
                <div {...CONTENT_AREA}>
                    <Table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Company</th>
                                <th>Email</th>
                                <th>User To Follow Up</th>
                                <th>Date</th>
                                <th>Activity</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.flatMap((contact) =>
                                contact.followUps
                                    .filter(
                                        (followUp) =>
                                            followUp.campaign ==
                                            props.data.id.uuid
                                    )
                                    .map((followUp) => (
                                        <FollowupRow
                                            key={followUp.id.uuid}
                                            contact={contact}
                                            followUp={followUp}
                                        />
                                    ))
                            )}
                        </tbody>
                    </Table>
                </div>
            )}

            {!props.data.activated && (
                <div>
                    <Button onClick={() => setMode("adding-contacts")}>
                        Add Contacts
                    </Button>
                    <Button
                        disabled={props.status.validation.length !== 0}
                        onClick={onActivate}
                    >
                        Activate
                    </Button>
                </div>
            )}
            <div>
                <Button onClick={onDuplicate}>Duplicate</Button>
            </div>
            <SaveDeleteButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.startDate> &
    WidgetContext<typeof Fields.endDate> &
    WidgetContext<typeof Fields.contacts> &
    WidgetContext<typeof Fields.defaultContactUser> &
    WidgetContext<typeof Fields.defaultContactDate> &
    WidgetContext<typeof Fields.activated>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    startDate: WidgetState<typeof Fields.startDate>;
    endDate: WidgetState<typeof Fields.endDate>;
    contacts: WidgetState<typeof Fields.contacts>;
    defaultContactUser: WidgetState<typeof Fields.defaultContactUser>;
    defaultContactDate: WidgetState<typeof Fields.defaultContactDate>;
    activated: WidgetState<typeof Fields.activated>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "START_DATE"; action: WidgetAction<typeof Fields.startDate> }
    | { type: "END_DATE"; action: WidgetAction<typeof Fields.endDate> }
    | { type: "CONTACTS"; action: WidgetAction<typeof Fields.contacts> }
    | {
          type: "DEFAULT_CONTACT_USER";
          action: WidgetAction<typeof Fields.defaultContactUser>;
      }
    | {
          type: "DEFAULT_CONTACT_DATE";
          action: WidgetAction<typeof Fields.defaultContactDate>;
      }
    | { type: "ACTIVATED"; action: WidgetAction<typeof Fields.activated> }
    | { type: "ADD_CONTACT"; contact: Link<Contact> }
    | { type: "REMOVE_CONTACT"; contact: Link<Contact> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.startDate, data.startDate, cache, "startDate", errors);
    subvalidate(Fields.endDate, data.endDate, cache, "endDate", errors);
    subvalidate(Fields.contacts, data.contacts, cache, "contacts", errors);
    subvalidate(
        Fields.defaultContactUser,
        data.defaultContactUser,
        cache,
        "defaultContactUser",
        errors
    );
    subvalidate(
        Fields.defaultContactDate,
        data.defaultContactDate,
        cache,
        "defaultContactDate",
        errors
    );
    subvalidate(Fields.activated, data.activated, cache, "activated", errors);
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
        case "START_DATE": {
            const inner = Fields.startDate.reduce(
                state.startDate,
                data.startDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, startDate: inner.state },
                data: { ...data, startDate: inner.data },
            };
        }
        case "END_DATE": {
            const inner = Fields.endDate.reduce(
                state.endDate,
                data.endDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, endDate: inner.state },
                data: { ...data, endDate: inner.data },
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
        case "DEFAULT_CONTACT_USER": {
            const inner = Fields.defaultContactUser.reduce(
                state.defaultContactUser,
                data.defaultContactUser,
                action.action,
                subcontext
            );
            return {
                state: { ...state, defaultContactUser: inner.state },
                data: { ...data, defaultContactUser: inner.data },
            };
        }
        case "DEFAULT_CONTACT_DATE": {
            const inner = Fields.defaultContactDate.reduce(
                state.defaultContactDate,
                data.defaultContactDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, defaultContactDate: inner.state },
                data: { ...data, defaultContactDate: inner.data },
            };
        }
        case "ACTIVATED": {
            const inner = Fields.activated.reduce(
                state.activated,
                data.activated,
                action.action,
                subcontext
            );
            return {
                state: { ...state, activated: inner.state },
                data: { ...data, activated: inner.data },
            };
        }
        case "ADD_CONTACT":
            return actionAddContact(state, data, action.contact);
        case "REMOVE_CONTACT":
            return actionRemoveContact(state, data, action.contact);
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
    startDate: function (
        props: WidgetExtraProps<typeof Fields.startDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "START_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "startDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.startDate.component
                state={context.state.startDate}
                data={context.data.startDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Start Date"}
            />
        );
    },
    endDate: function (
        props: WidgetExtraProps<typeof Fields.endDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "END_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "endDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.endDate.component
                state={context.state.endDate}
                data={context.data.endDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "End Date"}
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
    defaultContactUser: function (
        props: WidgetExtraProps<typeof Fields.defaultContactUser> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DEFAULT_CONTACT_USER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "defaultContactUser",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.defaultContactUser.component
                state={context.state.defaultContactUser}
                data={context.data.defaultContactUser}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Default Contact User"}
            />
        );
    },
    defaultContactDate: function (
        props: WidgetExtraProps<typeof Fields.defaultContactDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DEFAULT_CONTACT_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "defaultContactDate",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.defaultContactDate.component
                state={context.state.defaultContactDate}
                data={context.data.defaultContactDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Default Contact Date"}
            />
        );
    },
    activated: function (
        props: WidgetExtraProps<typeof Fields.activated> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ACTIVATED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "activated", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.activated.component
                state={context.state.activated}
                data={context.data.activated}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Activated"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: CAMPAIGN_META,
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
        let startDateState;
        {
            const inner = Fields.startDate.initialize(
                data.startDate,
                subcontext,
                subparameters.startDate
            );
            startDateState = inner.state;
            data = { ...data, startDate: inner.data };
        }
        let endDateState;
        {
            const inner = Fields.endDate.initialize(
                data.endDate,
                subcontext,
                subparameters.endDate
            );
            endDateState = inner.state;
            data = { ...data, endDate: inner.data };
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
        let defaultContactUserState;
        {
            const inner = Fields.defaultContactUser.initialize(
                data.defaultContactUser,
                subcontext,
                subparameters.defaultContactUser
            );
            defaultContactUserState = inner.state;
            data = { ...data, defaultContactUser: inner.data };
        }
        let defaultContactDateState;
        {
            const inner = Fields.defaultContactDate.initialize(
                data.defaultContactDate,
                subcontext,
                subparameters.defaultContactDate
            );
            defaultContactDateState = inner.state;
            data = { ...data, defaultContactDate: inner.data };
        }
        let activatedState;
        {
            const inner = Fields.activated.initialize(
                data.activated,
                subcontext,
                subparameters.activated
            );
            activatedState = inner.state;
            data = { ...data, activated: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            startDate: startDateState,
            endDate: endDateState,
            contacts: contactsState,
            defaultContactUser: defaultContactUserState,
            defaultContactDate: defaultContactDateState,
            activated: activatedState,
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
                <RecordContext meta={CAMPAIGN_META} value={props.data}>
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
    startDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.startDate>
    >;
    endDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.endDate>
    >;
    contacts: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contacts>
    >;
    defaultContactUser: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.defaultContactUser>
    >;
    defaultContactDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.defaultContactDate>
    >;
    activated: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.activated>
    >;
};
// END MAGIC -- DO NOT EDIT
