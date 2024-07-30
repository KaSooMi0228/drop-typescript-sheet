import { faExchangeAlt } from "@fortawesome/free-solid-svg-icons";
import formatISO9075 from "date-fns/formatISO9075";
import Decimal from "decimal.js";
import { css } from "glamor";
import * as React from "react";
import { Alert, Button, Col, Row, Tab, Table, Tabs } from "react-bootstrap";
import { useQuery, useRecordQuery } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import componentId from "../../clay/componentId";
import { EditActionButton, useEditableContext } from "../../clay/edit-context";
import { Link } from "../../clay/link";
import { propCheck } from "../../clay/propCheck";
import {
    QuickCacheApi,
    useQuickCache,
    useQuickRecord,
} from "../../clay/quick-cache";
import { SaveDeleteButton } from "../../clay/save-delete-button";
import { newUUID } from "../../clay/uuid";
import { DateWidget } from "../../clay/widgets/DateWidget";
import {
    DropdownLinkWidget,
    useQuickAllRecordsSorted,
} from "../../clay/widgets/dropdown-link-widget";
import { EmailWidget } from "../../clay/widgets/EmailWidget";
import {
    FormField,
    FormWrapper,
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
import { ListWidget } from "../../clay/widgets/ListWidget";
import { StaticPhoneWidget } from "../../clay/widgets/phone";
import { SelectLinkWidget } from "../../clay/widgets/SelectLinkWidget";
import { SimpleListWrapper } from "../../clay/widgets/SimpleListWrapper";
import { TextAreaWidget } from "../../clay/widgets/TextAreaWidget";
import { StaticTextField, TextWidget } from "../../clay/widgets/TextWidget";
import { hasPermission } from "../../permissions";
import { calcAddressLineFormatted } from "../address";
import { CompanyLinkWidget } from "../company";
import { COMPANY_META } from "../company/table";
import { ContactTypeLinkWidget } from "../contact-type/index";
import DatedStringWidget from "../dated-strings/DatedStringWidget.widget";
import { formatMoney } from "../estimate/TotalsWidget.widget";
import { INDUSTRY_META } from "../industry/table";
import { calcSaltOrderTotal, SALT_ORDER_META } from "../salt/table";
import { useUser } from "../state";
import { CONTENT_AREA } from "../styles";
import { UserLinkWidget } from "../user";
import { User, USER_META } from "../user/table";
import ContactFollowUpWidget from "./ContactFollowUpWidget.widget";
import ContactPhoneWidget from "./ContactPhoneWidget.widget";
import { Contact, CONTACT_INACTIVE_REASON_META, CONTACT_META } from "./table";

export type Data = Contact;

export const Fields = {
    name: FormField(TextWidget),
    unitNumber: OptionalFormField(TextWidget),
    email: OptionalFormField(EmailWidget),
    emails: FormField(
        ListWidget(SimpleListWrapper(EmailWidget), { emptyOk: true })
    ),
    phones: Optional(ListWidget(ContactPhoneWidget)),
    type: FormField(ContactTypeLinkWidget),
    company: OptionalFormField(CompanyLinkWidget),

    spouseName: OptionalFormField(TextWidget),
    childrenNames: OptionalFormField(TextWidget),
    birthdate: OptionalFormField(DateWidget),
    bestTimeToCall: OptionalFormField(TextAreaWidget),
    preferredCommunication: OptionalFormField(TextAreaWidget),
    stayInTouchCycle: OptionalFormField(TextAreaWidget),
    personalityType: OptionalFormField(TextAreaWidget),

    notes: OptionalFormField(ListWidget(DatedStringWidget)),

    addedDate: OptionalFormField(DateWidget),
    addedBy: OptionalFormField(UserLinkWidget),
    modifiedDate: OptionalFormField(DateWidget),
    modifiedBy: OptionalFormField(UserLinkWidget),
    inactiveReason: OptionalFormField(
        SelectLinkWidget({
            meta: CONTACT_INACTIVE_REASON_META,
            label: (record) => record.name,
        })
    ),
    inactiveReasonDetail: TextWidget,
    industry: OptionalFormField(
        DropdownLinkWidget({
            meta: INDUSTRY_META,
            label: (record) => record.name,
        })
    ),
    followUps: ListWidget(ContactFollowUpWidget, { emptyOk: true }),
};

function actionAddFollowUp(state: State, data: Data, user: Link<User>) {
    const inner = ContactFollowUpWidget.initialize(
        {
            id: newUUID(),
            scheduled: null,
            actual: new Date(),
            user: user,
            message: "",
            activity: null,
            campaign: null,
        },
        {}
    );
    return {
        state: {
            ...state,
            followUps: {
                ...state.followUps,
                items: [...state.followUps.items, inner.state],
            },
        },
        data: {
            ...data,
            followUps: [...data.followUps, inner.data],
        },
    };
}

function actionScheduleFollowUp(state: State, data: Data, user: Link<User>) {
    const inner = ContactFollowUpWidget.initialize(
        {
            id: newUUID(),
            scheduled: null,
            actual: null,
            user: user,
            message: "",
            activity: null,
            campaign: null,
        },
        {}
    );
    return {
        state: {
            ...state,
            followUps: {
                ...state.followUps,
                items: [...state.followUps.items, inner.state],
            },
        },
        data: {
            ...data,
            followUps: [...data.followUps, inner.data],
        },
    };
}

function reduce(
    state: State,
    data: Data,
    action: Action,
    context: Context
): WidgetResult<State, Data> {
    if (
        action.type === "COMPANY" &&
        (action.action.type === "SELECT" ||
            action.action.type == "NEW_RECORD") &&
        action.action.id
    ) {
        data = {
            ...data,
            companyHistory: [
                ...data.companyHistory,
                {
                    company: action.action.id,
                    date: new Date(),
                    user: context.currentUserId,
                },
            ],
        };
    }
    return baseReduce(state, data, action, context);
}

function validate(data: Contact, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache).slice();
    if (data.email === "" && data.phones.length == 0) {
        errors.push({
            invalid: false,
            empty: true,
            field: "email",
            detail: [
                {
                    empty: true,
                    invalid: false,
                },
            ],
        });
        errors.push({
            invalid: false,
            empty: true,
            field: "phones",
            detail: [
                {
                    empty: true,
                    invalid: false,
                },
            ],
        });
    }

    if (
        data.inactiveReason === null ||
        cache.get(CONTACT_INACTIVE_REASON_META, data.inactiveReason)
            ?.requireDetail === false
    ) {
        return errors.filter((error) => error.field !== "inactiveReasonDetail");
    }
    return errors;
}

function useDuplicateQuery(data: Contact) {
    const filters = [];
    if (data.name.indexOf(" ") !== -1) {
        filters.push({
            column: "name",
            filter: {
                equal: data.name,
            },
        });
    }
    if (data.email !== "") {
        filters.push({
            column: "email",
            filter: {
                equal: data.email,
            },
        });
    }
    if (data.phones.length !== 0) {
        filters.push({
            column: "phones.number",
            filter: {
                intersects: data.phones.map((phone) => phone.number.phone),
            },
        });
    }

    const result = useQuery(
        {
            tableName: "Contact",
            columns: ["summary", "id"],
            filters: [
                {
                    or: filters,
                },
                {
                    column: "id",
                    filter: {
                        not_equal: data.id.uuid,
                    },
                },
            ],
            limit: filters.length == 0 ? 0 : undefined,
        },
        [data.id, data.phones, data.email, data.name]
    );

    return result || [];
}

const TABLE_STYLE = css({
    borderSpacing: "200px 10px",
    "& td": {
        padding: "2px 5px",
        border: "solid 1px #777",
    },
    "& th": {
        padding: "2px 5px",
    },
    "& thead th": {
        textAlign: "center",
    },
});

function Component(props: Props) {
    const user = useUser();
    const duplicates = useDuplicateQuery(props.data);
    const id = componentId();
    const saltOrders =
        useRecordQuery(
            SALT_ORDER_META,
            {
                filters: [
                    {
                        or: [
                            {
                                column: "deliveryContact.contact",
                                filter: {
                                    equal: props.data.id.uuid,
                                },
                            },
                            {
                                column: "billingContact.contact",
                                filter: {
                                    equal: props.data.id.uuid,
                                },
                            },
                        ],
                    },
                ],
                sorts: ["orderNumber"],
            },
            [props.data.id.uuid],
            hasPermission(user, "SaltOrder", "read")
        ) || [];

    const projects =
        useQuery(
            {
                tableName: "Project",
                columns: [
                    "id",
                    "projectNumber",
                    "stage",
                    "customer",
                    "siteAddress.lineFormatted",
                    "firstQuotationDate",
                    "total",
                    "color",
                ],
                filters: [
                    {
                        or: [
                            {
                                column: "contacts.contact",
                                filter: {
                                    intersects: [props.data.id.uuid],
                                },
                            },
                            {
                                column: "billingContacts.contact",
                                filter: {
                                    intersects: [props.data.id.uuid],
                                },
                            },
                        ],
                    },
                ],
                sorts: ["projectNumber"],
            },
            [props.data.id.uuid],
            hasPermission(user, "Project", "read")
        ) || [];

    const editContext = useEditableContext();
    const company = useQuickRecord(COMPANY_META, props.data.company);
    const cache = useQuickCache();
    const inactiveReason = useQuickRecord(
        CONTACT_INACTIVE_REASON_META,
        props.data.inactiveReason
    );
    const inactiveReasons =
        useQuickAllRecordsSorted(
            CONTACT_INACTIVE_REASON_META,
            (record) => record.name
        ) || [];
    const inactiveReasonRecords = [
        {
            id: { uuid: null as any as string },
            recordVersion: { version: null },
            name: "Active",
            requireDetail: false,
        },
        ...inactiveReasons,
    ];

    return (
        <>
            <div {...CONTENT_AREA}>
                <Tabs defaultActiveKey="contact" id={id}>
                    <Tab eventKey="contact" title="Profile" {...CONTENT_AREA}>
                        <div style={{ display: "flex" }}>
                            <div style={{ width: "40em", padding: "10px" }}>
                                <FormWrapper label="Contact Number">
                                    <StaticTextField
                                        value={`${props.data.contactNumber}`}
                                    />
                                </FormWrapper>
                                <widgets.name />
                                <widgets.type label="Title" />
                                <widgets.industry clearable />
                                <widgets.inactiveReason
                                    records={inactiveReasonRecords}
                                    label="Status"
                                    readOnly={
                                        !hasPermission(
                                            user,
                                            "Contact",
                                            "change-status"
                                        )
                                    }
                                />
                                {inactiveReason?.requireDetail && (
                                    <widgets.inactiveReasonDetail />
                                )}
                                <widgets.company />
                                {company && (
                                    <>
                                        <FormWrapper label="Company Phone #">
                                            <StaticPhoneWidget
                                                data={company.phone}
                                            />
                                        </FormWrapper>
                                    </>
                                )}

                                <widgets.unitNumber />
                                <widgets.email label="Primary Email" />
                                <widgets.emails
                                    label="Secondary Emails"
                                    addButtonText="Add Email"
                                />

                                <table>
                                    <thead>
                                        <tr>
                                            <th />
                                            <th>Type</th>
                                            <th>Number</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <widgets.phones
                                        containerClass="tbody"
                                        addButtonText="Add Phone Number"
                                    />
                                </table>
                            </div>
                            <div style={{ width: "40em", padding: "10px" }}>
                                {duplicates.length > 0 && (
                                    <Alert
                                        variant="danger"
                                        style={{ position: "fixed" }}
                                    >
                                        This contact appears to be a duplicate
                                        of these contacts:
                                        <ul>
                                            {duplicates.map(
                                                (row: any, index: number) => (
                                                    <li key={index}>
                                                        {row[0]}{" "}
                                                        <EditActionButton
                                                            variant="primary"
                                                            action={
                                                                editContext.substitute
                                                            }
                                                            onClick={() =>
                                                                editContext.substitute &&
                                                                editContext.substitute.onClick(
                                                                    row[1]
                                                                )
                                                            }
                                                            icon={faExchangeAlt}
                                                            label="Use This Contact"
                                                        />
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </Alert>
                                )}
                            </div>
                        </div>
                    </Tab>
                    <Tab eventKey="personal" title="Personal Details">
                        <widgets.spouseName />
                        <widgets.childrenNames />
                        <widgets.birthdate />
                        <widgets.bestTimeToCall />
                        <widgets.preferredCommunication />
                        <widgets.stayInTouchCycle />
                        <widgets.personalityType />

                        <widgets.notes extraItemForAdd />
                    </Tab>
                    <Tab eventKey="history" title="Company History">
                        <Table striped bordered>
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Date</th>
                                    <th>User</th>
                                </tr>
                            </thead>
                            <tbody>
                                {props.data.companyHistory.map(
                                    (entry, index) => (
                                        <tr key={index}>
                                            <td>
                                                {
                                                    cache.get(
                                                        COMPANY_META,
                                                        entry.company
                                                    )?.name
                                                }
                                            </td>
                                            <td>
                                                {entry.date &&
                                                    formatISO9075(entry.date)}
                                            </td>
                                            <td>
                                                {
                                                    cache.get(
                                                        USER_META,
                                                        entry.user
                                                    )?.name
                                                }
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </Table>
                    </Tab>
                    <Tab
                        eventKey="salt"
                        title="Salt Order History"
                        disabled={!hasPermission(user, "SaltOrder", "read")}
                    >
                        <Table striped bordered>
                            <thead>
                                <tr>
                                    <th>Order Number</th>
                                    <th>Order Date</th>
                                    <th>Address</th>
                                    <th style={{ textAlign: "right" }}>
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {saltOrders.map((order) => (
                                    <tr key={order.id.uuid}>
                                        <td>
                                            <a
                                                href={
                                                    "#/salt/edit/" +
                                                    order.id.uuid
                                                }
                                                target="_blank"
                                            >
                                                {order.orderNumber}
                                            </a>
                                        </td>
                                        <td>
                                            {order.orderDate &&
                                                order.orderDate.toString()}
                                        </td>
                                        <td>
                                            {calcAddressLineFormatted(
                                                order.deliveryAddress
                                            )}
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            $
                                            {calcSaltOrderTotal(order).toFixed(
                                                2
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Tab>
                    <Tab
                        eventKey="projects"
                        title="Project History"
                        disabled={!hasPermission(user, "Project", "read")}
                    >
                        <Table striped bordered>
                            <thead>
                                <tr>
                                    <th>Project #</th>
                                    <th>Stage</th>
                                    <th>Client</th>
                                    <th>Site Address</th>
                                    <th>Quotation Date</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((project) => (
                                    <tr key={project[0] as string}>
                                        <td>
                                            <a
                                                href={
                                                    "#/project/edit/" +
                                                    project[0]
                                                }
                                                target="_blank"
                                            >
                                                {project[1]}
                                            </a>
                                        </td>
                                        <td
                                            style={{
                                                backgroundColor:
                                                    project[7] as string,
                                            }}
                                        >
                                            {project[2]}
                                        </td>
                                        <td>{project[3]}</td>
                                        <td>{project[4]}</td>
                                        <td>
                                            {project[5]
                                                ? formatISO9075(
                                                      new Date(
                                                          project[5] as string
                                                      ),
                                                      { representation: "date" }
                                                  )
                                                : "n/a"}
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            {project[6] &&
                                                formatMoney(
                                                    new Decimal(
                                                        project[6] as string
                                                    )
                                                )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Tab>

                    <Tab
                        eventKey="followup"
                        title="Activities"
                        style={{ flex: 1 }}
                    >
                        <Button
                            onClick={() => {
                                props.dispatch({
                                    type: "SCHEDULE_FOLLOW_UP",
                                    user: user.id,
                                });
                            }}
                        >
                            Schedule Follow Up
                        </Button>
                        <Button
                            onClick={() => {
                                props.dispatch({
                                    type: "ADD_FOLLOW_UP",
                                    user: user.id,
                                });
                            }}
                        >
                            Add Activity
                        </Button>
                        <widgets.followUps
                            reversed
                            itemProps={{ contact: props.data }}
                        />
                    </Tab>
                    <Tab eventKey="meta" title="Meta">
                        <Row>
                            <Col>
                                <widgets.addedBy readOnly />
                            </Col>
                            <Col>
                                <widgets.addedDate
                                    readOnly
                                    label="Date Added"
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <widgets.modifiedBy readOnly />
                            </Col>
                            <Col>
                                <widgets.modifiedDate
                                    readOnly
                                    label="Last Date Modified"
                                />
                            </Col>
                        </Row>
                    </Tab>
                </Tabs>
            </div>

            <SaveDeleteButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.unitNumber> &
    WidgetContext<typeof Fields.email> &
    WidgetContext<typeof Fields.emails> &
    WidgetContext<typeof Fields.phones> &
    WidgetContext<typeof Fields.type> &
    WidgetContext<typeof Fields.company> &
    WidgetContext<typeof Fields.spouseName> &
    WidgetContext<typeof Fields.childrenNames> &
    WidgetContext<typeof Fields.birthdate> &
    WidgetContext<typeof Fields.bestTimeToCall> &
    WidgetContext<typeof Fields.preferredCommunication> &
    WidgetContext<typeof Fields.stayInTouchCycle> &
    WidgetContext<typeof Fields.personalityType> &
    WidgetContext<typeof Fields.notes> &
    WidgetContext<typeof Fields.addedDate> &
    WidgetContext<typeof Fields.addedBy> &
    WidgetContext<typeof Fields.modifiedDate> &
    WidgetContext<typeof Fields.modifiedBy> &
    WidgetContext<typeof Fields.inactiveReason> &
    WidgetContext<typeof Fields.inactiveReasonDetail> &
    WidgetContext<typeof Fields.industry> &
    WidgetContext<typeof Fields.followUps>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    unitNumber: WidgetState<typeof Fields.unitNumber>;
    email: WidgetState<typeof Fields.email>;
    emails: WidgetState<typeof Fields.emails>;
    phones: WidgetState<typeof Fields.phones>;
    type: WidgetState<typeof Fields.type>;
    company: WidgetState<typeof Fields.company>;
    spouseName: WidgetState<typeof Fields.spouseName>;
    childrenNames: WidgetState<typeof Fields.childrenNames>;
    birthdate: WidgetState<typeof Fields.birthdate>;
    bestTimeToCall: WidgetState<typeof Fields.bestTimeToCall>;
    preferredCommunication: WidgetState<typeof Fields.preferredCommunication>;
    stayInTouchCycle: WidgetState<typeof Fields.stayInTouchCycle>;
    personalityType: WidgetState<typeof Fields.personalityType>;
    notes: WidgetState<typeof Fields.notes>;
    addedDate: WidgetState<typeof Fields.addedDate>;
    addedBy: WidgetState<typeof Fields.addedBy>;
    modifiedDate: WidgetState<typeof Fields.modifiedDate>;
    modifiedBy: WidgetState<typeof Fields.modifiedBy>;
    inactiveReason: WidgetState<typeof Fields.inactiveReason>;
    inactiveReasonDetail: WidgetState<typeof Fields.inactiveReasonDetail>;
    industry: WidgetState<typeof Fields.industry>;
    followUps: WidgetState<typeof Fields.followUps>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "UNIT_NUMBER"; action: WidgetAction<typeof Fields.unitNumber> }
    | { type: "EMAIL"; action: WidgetAction<typeof Fields.email> }
    | { type: "EMAILS"; action: WidgetAction<typeof Fields.emails> }
    | { type: "PHONES"; action: WidgetAction<typeof Fields.phones> }
    | { type: "TYPE"; action: WidgetAction<typeof Fields.type> }
    | { type: "COMPANY"; action: WidgetAction<typeof Fields.company> }
    | { type: "SPOUSE_NAME"; action: WidgetAction<typeof Fields.spouseName> }
    | {
          type: "CHILDREN_NAMES";
          action: WidgetAction<typeof Fields.childrenNames>;
      }
    | { type: "BIRTHDATE"; action: WidgetAction<typeof Fields.birthdate> }
    | {
          type: "BEST_TIME_TO_CALL";
          action: WidgetAction<typeof Fields.bestTimeToCall>;
      }
    | {
          type: "PREFERRED_COMMUNICATION";
          action: WidgetAction<typeof Fields.preferredCommunication>;
      }
    | {
          type: "STAY_IN_TOUCH_CYCLE";
          action: WidgetAction<typeof Fields.stayInTouchCycle>;
      }
    | {
          type: "PERSONALITY_TYPE";
          action: WidgetAction<typeof Fields.personalityType>;
      }
    | { type: "NOTES"; action: WidgetAction<typeof Fields.notes> }
    | { type: "ADDED_DATE"; action: WidgetAction<typeof Fields.addedDate> }
    | { type: "ADDED_BY"; action: WidgetAction<typeof Fields.addedBy> }
    | {
          type: "MODIFIED_DATE";
          action: WidgetAction<typeof Fields.modifiedDate>;
      }
    | { type: "MODIFIED_BY"; action: WidgetAction<typeof Fields.modifiedBy> }
    | {
          type: "INACTIVE_REASON";
          action: WidgetAction<typeof Fields.inactiveReason>;
      }
    | {
          type: "INACTIVE_REASON_DETAIL";
          action: WidgetAction<typeof Fields.inactiveReasonDetail>;
      }
    | { type: "INDUSTRY"; action: WidgetAction<typeof Fields.industry> }
    | { type: "FOLLOW_UPS"; action: WidgetAction<typeof Fields.followUps> }
    | { type: "ADD_FOLLOW_UP"; user: Link<User> }
    | { type: "SCHEDULE_FOLLOW_UP"; user: Link<User> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(
        Fields.unitNumber,
        data.unitNumber,
        cache,
        "unitNumber",
        errors
    );
    subvalidate(Fields.email, data.email, cache, "email", errors);
    subvalidate(Fields.emails, data.emails, cache, "emails", errors);
    subvalidate(Fields.phones, data.phones, cache, "phones", errors);
    subvalidate(Fields.type, data.type, cache, "type", errors);
    subvalidate(Fields.company, data.company, cache, "company", errors);
    subvalidate(
        Fields.spouseName,
        data.spouseName,
        cache,
        "spouseName",
        errors
    );
    subvalidate(
        Fields.childrenNames,
        data.childrenNames,
        cache,
        "childrenNames",
        errors
    );
    subvalidate(Fields.birthdate, data.birthdate, cache, "birthdate", errors);
    subvalidate(
        Fields.bestTimeToCall,
        data.bestTimeToCall,
        cache,
        "bestTimeToCall",
        errors
    );
    subvalidate(
        Fields.preferredCommunication,
        data.preferredCommunication,
        cache,
        "preferredCommunication",
        errors
    );
    subvalidate(
        Fields.stayInTouchCycle,
        data.stayInTouchCycle,
        cache,
        "stayInTouchCycle",
        errors
    );
    subvalidate(
        Fields.personalityType,
        data.personalityType,
        cache,
        "personalityType",
        errors
    );
    subvalidate(Fields.notes, data.notes, cache, "notes", errors);
    subvalidate(Fields.addedDate, data.addedDate, cache, "addedDate", errors);
    subvalidate(Fields.addedBy, data.addedBy, cache, "addedBy", errors);
    subvalidate(
        Fields.modifiedDate,
        data.modifiedDate,
        cache,
        "modifiedDate",
        errors
    );
    subvalidate(
        Fields.modifiedBy,
        data.modifiedBy,
        cache,
        "modifiedBy",
        errors
    );
    subvalidate(
        Fields.inactiveReason,
        data.inactiveReason,
        cache,
        "inactiveReason",
        errors
    );
    subvalidate(
        Fields.inactiveReasonDetail,
        data.inactiveReasonDetail,
        cache,
        "inactiveReasonDetail",
        errors
    );
    subvalidate(Fields.industry, data.industry, cache, "industry", errors);
    subvalidate(Fields.followUps, data.followUps, cache, "followUps", errors);
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
        case "UNIT_NUMBER": {
            const inner = Fields.unitNumber.reduce(
                state.unitNumber,
                data.unitNumber,
                action.action,
                subcontext
            );
            return {
                state: { ...state, unitNumber: inner.state },
                data: { ...data, unitNumber: inner.data },
            };
        }
        case "EMAIL": {
            const inner = Fields.email.reduce(
                state.email,
                data.email,
                action.action,
                subcontext
            );
            return {
                state: { ...state, email: inner.state },
                data: { ...data, email: inner.data },
            };
        }
        case "EMAILS": {
            const inner = Fields.emails.reduce(
                state.emails,
                data.emails,
                action.action,
                subcontext
            );
            return {
                state: { ...state, emails: inner.state },
                data: { ...data, emails: inner.data },
            };
        }
        case "PHONES": {
            const inner = Fields.phones.reduce(
                state.phones,
                data.phones,
                action.action,
                subcontext
            );
            return {
                state: { ...state, phones: inner.state },
                data: { ...data, phones: inner.data },
            };
        }
        case "TYPE": {
            const inner = Fields.type.reduce(
                state.type,
                data.type,
                action.action,
                subcontext
            );
            return {
                state: { ...state, type: inner.state },
                data: { ...data, type: inner.data },
            };
        }
        case "COMPANY": {
            const inner = Fields.company.reduce(
                state.company,
                data.company,
                action.action,
                subcontext
            );
            return {
                state: { ...state, company: inner.state },
                data: { ...data, company: inner.data },
            };
        }
        case "SPOUSE_NAME": {
            const inner = Fields.spouseName.reduce(
                state.spouseName,
                data.spouseName,
                action.action,
                subcontext
            );
            return {
                state: { ...state, spouseName: inner.state },
                data: { ...data, spouseName: inner.data },
            };
        }
        case "CHILDREN_NAMES": {
            const inner = Fields.childrenNames.reduce(
                state.childrenNames,
                data.childrenNames,
                action.action,
                subcontext
            );
            return {
                state: { ...state, childrenNames: inner.state },
                data: { ...data, childrenNames: inner.data },
            };
        }
        case "BIRTHDATE": {
            const inner = Fields.birthdate.reduce(
                state.birthdate,
                data.birthdate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, birthdate: inner.state },
                data: { ...data, birthdate: inner.data },
            };
        }
        case "BEST_TIME_TO_CALL": {
            const inner = Fields.bestTimeToCall.reduce(
                state.bestTimeToCall,
                data.bestTimeToCall,
                action.action,
                subcontext
            );
            return {
                state: { ...state, bestTimeToCall: inner.state },
                data: { ...data, bestTimeToCall: inner.data },
            };
        }
        case "PREFERRED_COMMUNICATION": {
            const inner = Fields.preferredCommunication.reduce(
                state.preferredCommunication,
                data.preferredCommunication,
                action.action,
                subcontext
            );
            return {
                state: { ...state, preferredCommunication: inner.state },
                data: { ...data, preferredCommunication: inner.data },
            };
        }
        case "STAY_IN_TOUCH_CYCLE": {
            const inner = Fields.stayInTouchCycle.reduce(
                state.stayInTouchCycle,
                data.stayInTouchCycle,
                action.action,
                subcontext
            );
            return {
                state: { ...state, stayInTouchCycle: inner.state },
                data: { ...data, stayInTouchCycle: inner.data },
            };
        }
        case "PERSONALITY_TYPE": {
            const inner = Fields.personalityType.reduce(
                state.personalityType,
                data.personalityType,
                action.action,
                subcontext
            );
            return {
                state: { ...state, personalityType: inner.state },
                data: { ...data, personalityType: inner.data },
            };
        }
        case "NOTES": {
            const inner = Fields.notes.reduce(
                state.notes,
                data.notes,
                action.action,
                subcontext
            );
            return {
                state: { ...state, notes: inner.state },
                data: { ...data, notes: inner.data },
            };
        }
        case "ADDED_DATE": {
            const inner = Fields.addedDate.reduce(
                state.addedDate,
                data.addedDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, addedDate: inner.state },
                data: { ...data, addedDate: inner.data },
            };
        }
        case "ADDED_BY": {
            const inner = Fields.addedBy.reduce(
                state.addedBy,
                data.addedBy,
                action.action,
                subcontext
            );
            return {
                state: { ...state, addedBy: inner.state },
                data: { ...data, addedBy: inner.data },
            };
        }
        case "MODIFIED_DATE": {
            const inner = Fields.modifiedDate.reduce(
                state.modifiedDate,
                data.modifiedDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, modifiedDate: inner.state },
                data: { ...data, modifiedDate: inner.data },
            };
        }
        case "MODIFIED_BY": {
            const inner = Fields.modifiedBy.reduce(
                state.modifiedBy,
                data.modifiedBy,
                action.action,
                subcontext
            );
            return {
                state: { ...state, modifiedBy: inner.state },
                data: { ...data, modifiedBy: inner.data },
            };
        }
        case "INACTIVE_REASON": {
            const inner = Fields.inactiveReason.reduce(
                state.inactiveReason,
                data.inactiveReason,
                action.action,
                subcontext
            );
            return {
                state: { ...state, inactiveReason: inner.state },
                data: { ...data, inactiveReason: inner.data },
            };
        }
        case "INACTIVE_REASON_DETAIL": {
            const inner = Fields.inactiveReasonDetail.reduce(
                state.inactiveReasonDetail,
                data.inactiveReasonDetail,
                action.action,
                subcontext
            );
            return {
                state: { ...state, inactiveReasonDetail: inner.state },
                data: { ...data, inactiveReasonDetail: inner.data },
            };
        }
        case "INDUSTRY": {
            const inner = Fields.industry.reduce(
                state.industry,
                data.industry,
                action.action,
                subcontext
            );
            return {
                state: { ...state, industry: inner.state },
                data: { ...data, industry: inner.data },
            };
        }
        case "FOLLOW_UPS": {
            const inner = Fields.followUps.reduce(
                state.followUps,
                data.followUps,
                action.action,
                subcontext
            );
            return {
                state: { ...state, followUps: inner.state },
                data: { ...data, followUps: inner.data },
            };
        }
        case "ADD_FOLLOW_UP":
            return actionAddFollowUp(state, data, action.user);
        case "SCHEDULE_FOLLOW_UP":
            return actionScheduleFollowUp(state, data, action.user);
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
    unitNumber: function (
        props: WidgetExtraProps<typeof Fields.unitNumber> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "UNIT_NUMBER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "unitNumber", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.unitNumber.component
                state={context.state.unitNumber}
                data={context.data.unitNumber}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Unit Number"}
            />
        );
    },
    email: function (
        props: WidgetExtraProps<typeof Fields.email> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "EMAIL", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "email", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.email.component
                state={context.state.email}
                data={context.data.email}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Email"}
            />
        );
    },
    emails: function (
        props: WidgetExtraProps<typeof Fields.emails> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "EMAILS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "emails", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.emails.component
                state={context.state.emails}
                data={context.data.emails}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Emails"}
            />
        );
    },
    phones: function (
        props: WidgetExtraProps<typeof Fields.phones> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PHONES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "phones", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.phones.component
                state={context.state.phones}
                data={context.data.phones}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Phones"}
            />
        );
    },
    type: function (
        props: WidgetExtraProps<typeof Fields.type> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "TYPE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "type", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.type.component
                state={context.state.type}
                data={context.data.type}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Type"}
            />
        );
    },
    company: function (
        props: WidgetExtraProps<typeof Fields.company> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMPANY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "company", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.company.component
                state={context.state.company}
                data={context.data.company}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Company"}
            />
        );
    },
    spouseName: function (
        props: WidgetExtraProps<typeof Fields.spouseName> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SPOUSE_NAME",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "spouseName", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.spouseName.component
                state={context.state.spouseName}
                data={context.data.spouseName}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Spouse Name"}
            />
        );
    },
    childrenNames: function (
        props: WidgetExtraProps<typeof Fields.childrenNames> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CHILDREN_NAMES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "childrenNames", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.childrenNames.component
                state={context.state.childrenNames}
                data={context.data.childrenNames}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Children Names"}
            />
        );
    },
    birthdate: function (
        props: WidgetExtraProps<typeof Fields.birthdate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "BIRTHDATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "birthdate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.birthdate.component
                state={context.state.birthdate}
                data={context.data.birthdate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Birthdate"}
            />
        );
    },
    bestTimeToCall: function (
        props: WidgetExtraProps<typeof Fields.bestTimeToCall> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "BEST_TIME_TO_CALL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "bestTimeToCall", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.bestTimeToCall.component
                state={context.state.bestTimeToCall}
                data={context.data.bestTimeToCall}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Best Time to Call"}
            />
        );
    },
    preferredCommunication: function (
        props: WidgetExtraProps<typeof Fields.preferredCommunication> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PREFERRED_COMMUNICATION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "preferredCommunication",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.preferredCommunication.component
                state={context.state.preferredCommunication}
                data={context.data.preferredCommunication}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Preferred Communication"}
            />
        );
    },
    stayInTouchCycle: function (
        props: WidgetExtraProps<typeof Fields.stayInTouchCycle> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "STAY_IN_TOUCH_CYCLE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "stayInTouchCycle", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.stayInTouchCycle.component
                state={context.state.stayInTouchCycle}
                data={context.data.stayInTouchCycle}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Stay in Touch Cycle"}
            />
        );
    },
    personalityType: function (
        props: WidgetExtraProps<typeof Fields.personalityType> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PERSONALITY_TYPE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "personalityType", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.personalityType.component
                state={context.state.personalityType}
                data={context.data.personalityType}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Personality Type"}
            />
        );
    },
    notes: function (
        props: WidgetExtraProps<typeof Fields.notes> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "NOTES", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "notes", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.notes.component
                state={context.state.notes}
                data={context.data.notes}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Notes"}
            />
        );
    },
    addedDate: function (
        props: WidgetExtraProps<typeof Fields.addedDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ADDED_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "addedDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.addedDate.component
                state={context.state.addedDate}
                data={context.data.addedDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Added Date"}
            />
        );
    },
    addedBy: function (
        props: WidgetExtraProps<typeof Fields.addedBy> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ADDED_BY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "addedBy", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.addedBy.component
                state={context.state.addedBy}
                data={context.data.addedBy}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Added By"}
            />
        );
    },
    modifiedDate: function (
        props: WidgetExtraProps<typeof Fields.modifiedDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MODIFIED_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "modifiedDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.modifiedDate.component
                state={context.state.modifiedDate}
                data={context.data.modifiedDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Modified Date"}
            />
        );
    },
    modifiedBy: function (
        props: WidgetExtraProps<typeof Fields.modifiedBy> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MODIFIED_BY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "modifiedBy", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.modifiedBy.component
                state={context.state.modifiedBy}
                data={context.data.modifiedBy}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Modified By"}
            />
        );
    },
    inactiveReason: function (
        props: WidgetExtraProps<typeof Fields.inactiveReason> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INACTIVE_REASON",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "inactiveReason", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.inactiveReason.component
                state={context.state.inactiveReason}
                data={context.data.inactiveReason}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Inactive Reason"}
            />
        );
    },
    inactiveReasonDetail: function (
        props: WidgetExtraProps<typeof Fields.inactiveReasonDetail> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INACTIVE_REASON_DETAIL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "inactiveReasonDetail",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.inactiveReasonDetail.component
                state={context.state.inactiveReasonDetail}
                data={context.data.inactiveReasonDetail}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Inactive Reason Detail"}
            />
        );
    },
    industry: function (
        props: WidgetExtraProps<typeof Fields.industry> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INDUSTRY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "industry", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.industry.component
                state={context.state.industry}
                data={context.data.industry}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Industry"}
            />
        );
    },
    followUps: function (
        props: WidgetExtraProps<typeof Fields.followUps> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "FOLLOW_UPS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "followUps", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.followUps.component
                state={context.state.followUps}
                data={context.data.followUps}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Follow Ups"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: CONTACT_META,
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
        let unitNumberState;
        {
            const inner = Fields.unitNumber.initialize(
                data.unitNumber,
                subcontext,
                subparameters.unitNumber
            );
            unitNumberState = inner.state;
            data = { ...data, unitNumber: inner.data };
        }
        let emailState;
        {
            const inner = Fields.email.initialize(
                data.email,
                subcontext,
                subparameters.email
            );
            emailState = inner.state;
            data = { ...data, email: inner.data };
        }
        let emailsState;
        {
            const inner = Fields.emails.initialize(
                data.emails,
                subcontext,
                subparameters.emails
            );
            emailsState = inner.state;
            data = { ...data, emails: inner.data };
        }
        let phonesState;
        {
            const inner = Fields.phones.initialize(
                data.phones,
                subcontext,
                subparameters.phones
            );
            phonesState = inner.state;
            data = { ...data, phones: inner.data };
        }
        let typeState;
        {
            const inner = Fields.type.initialize(
                data.type,
                subcontext,
                subparameters.type
            );
            typeState = inner.state;
            data = { ...data, type: inner.data };
        }
        let companyState;
        {
            const inner = Fields.company.initialize(
                data.company,
                subcontext,
                subparameters.company
            );
            companyState = inner.state;
            data = { ...data, company: inner.data };
        }
        let spouseNameState;
        {
            const inner = Fields.spouseName.initialize(
                data.spouseName,
                subcontext,
                subparameters.spouseName
            );
            spouseNameState = inner.state;
            data = { ...data, spouseName: inner.data };
        }
        let childrenNamesState;
        {
            const inner = Fields.childrenNames.initialize(
                data.childrenNames,
                subcontext,
                subparameters.childrenNames
            );
            childrenNamesState = inner.state;
            data = { ...data, childrenNames: inner.data };
        }
        let birthdateState;
        {
            const inner = Fields.birthdate.initialize(
                data.birthdate,
                subcontext,
                subparameters.birthdate
            );
            birthdateState = inner.state;
            data = { ...data, birthdate: inner.data };
        }
        let bestTimeToCallState;
        {
            const inner = Fields.bestTimeToCall.initialize(
                data.bestTimeToCall,
                subcontext,
                subparameters.bestTimeToCall
            );
            bestTimeToCallState = inner.state;
            data = { ...data, bestTimeToCall: inner.data };
        }
        let preferredCommunicationState;
        {
            const inner = Fields.preferredCommunication.initialize(
                data.preferredCommunication,
                subcontext,
                subparameters.preferredCommunication
            );
            preferredCommunicationState = inner.state;
            data = { ...data, preferredCommunication: inner.data };
        }
        let stayInTouchCycleState;
        {
            const inner = Fields.stayInTouchCycle.initialize(
                data.stayInTouchCycle,
                subcontext,
                subparameters.stayInTouchCycle
            );
            stayInTouchCycleState = inner.state;
            data = { ...data, stayInTouchCycle: inner.data };
        }
        let personalityTypeState;
        {
            const inner = Fields.personalityType.initialize(
                data.personalityType,
                subcontext,
                subparameters.personalityType
            );
            personalityTypeState = inner.state;
            data = { ...data, personalityType: inner.data };
        }
        let notesState;
        {
            const inner = Fields.notes.initialize(
                data.notes,
                subcontext,
                subparameters.notes
            );
            notesState = inner.state;
            data = { ...data, notes: inner.data };
        }
        let addedDateState;
        {
            const inner = Fields.addedDate.initialize(
                data.addedDate,
                subcontext,
                subparameters.addedDate
            );
            addedDateState = inner.state;
            data = { ...data, addedDate: inner.data };
        }
        let addedByState;
        {
            const inner = Fields.addedBy.initialize(
                data.addedBy,
                subcontext,
                subparameters.addedBy
            );
            addedByState = inner.state;
            data = { ...data, addedBy: inner.data };
        }
        let modifiedDateState;
        {
            const inner = Fields.modifiedDate.initialize(
                data.modifiedDate,
                subcontext,
                subparameters.modifiedDate
            );
            modifiedDateState = inner.state;
            data = { ...data, modifiedDate: inner.data };
        }
        let modifiedByState;
        {
            const inner = Fields.modifiedBy.initialize(
                data.modifiedBy,
                subcontext,
                subparameters.modifiedBy
            );
            modifiedByState = inner.state;
            data = { ...data, modifiedBy: inner.data };
        }
        let inactiveReasonState;
        {
            const inner = Fields.inactiveReason.initialize(
                data.inactiveReason,
                subcontext,
                subparameters.inactiveReason
            );
            inactiveReasonState = inner.state;
            data = { ...data, inactiveReason: inner.data };
        }
        let inactiveReasonDetailState;
        {
            const inner = Fields.inactiveReasonDetail.initialize(
                data.inactiveReasonDetail,
                subcontext,
                subparameters.inactiveReasonDetail
            );
            inactiveReasonDetailState = inner.state;
            data = { ...data, inactiveReasonDetail: inner.data };
        }
        let industryState;
        {
            const inner = Fields.industry.initialize(
                data.industry,
                subcontext,
                subparameters.industry
            );
            industryState = inner.state;
            data = { ...data, industry: inner.data };
        }
        let followUpsState;
        {
            const inner = Fields.followUps.initialize(
                data.followUps,
                subcontext,
                subparameters.followUps
            );
            followUpsState = inner.state;
            data = { ...data, followUps: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            unitNumber: unitNumberState,
            email: emailState,
            emails: emailsState,
            phones: phonesState,
            type: typeState,
            company: companyState,
            spouseName: spouseNameState,
            childrenNames: childrenNamesState,
            birthdate: birthdateState,
            bestTimeToCall: bestTimeToCallState,
            preferredCommunication: preferredCommunicationState,
            stayInTouchCycle: stayInTouchCycleState,
            personalityType: personalityTypeState,
            notes: notesState,
            addedDate: addedDateState,
            addedBy: addedByState,
            modifiedDate: modifiedDateState,
            modifiedBy: modifiedByState,
            inactiveReason: inactiveReasonState,
            inactiveReasonDetail: inactiveReasonDetailState,
            industry: industryState,
            followUps: followUpsState,
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
                <RecordContext meta={CONTACT_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
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
    unitNumber: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.unitNumber>
    >;
    email: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.email>
    >;
    emails: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.emails>
    >;
    phones: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.phones>
    >;
    type: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.type>
    >;
    company: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.company>
    >;
    spouseName: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.spouseName>
    >;
    childrenNames: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.childrenNames>
    >;
    birthdate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.birthdate>
    >;
    bestTimeToCall: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.bestTimeToCall>
    >;
    preferredCommunication: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.preferredCommunication>
    >;
    stayInTouchCycle: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.stayInTouchCycle>
    >;
    personalityType: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.personalityType>
    >;
    notes: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.notes>
    >;
    addedDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.addedDate>
    >;
    addedBy: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.addedBy>
    >;
    modifiedDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.modifiedDate>
    >;
    modifiedBy: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.modifiedBy>
    >;
    inactiveReason: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.inactiveReason>
    >;
    inactiveReasonDetail: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.inactiveReasonDetail>
    >;
    industry: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.industry>
    >;
    followUps: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.followUps>
    >;
};
// END MAGIC -- DO NOT EDIT
