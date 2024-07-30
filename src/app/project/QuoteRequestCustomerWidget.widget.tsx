import { some } from "lodash";
import * as React from "react";
import { Accordion, Button, Card } from "react-bootstrap";
import { patchRecord, useRecordQuery } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { longDate } from "../../clay/LocalDate";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickCache } from "../../clay/quick-cache";
import { DecimalWidget } from "../../clay/widgets/DecimalWidget";
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
import { FieldRow } from "../../clay/widgets/layout";
import { ListWidget } from "../../clay/widgets/ListWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { hasPermission } from "../../permissions";
import AddressWidget from "../AddressWidget.widget";
import { COMPANY_META } from "../company/table";
import {
    buildContactDetail,
    ContactDetail,
    CONTACT_META,
} from "../contact/table";
import { formatMoney } from "../estimate/TotalsWidget.widget";
import {
    PROJECT_DESCRIPTION_CATEGORY_META,
    PROJECT_DESCRIPTION_META,
} from "../project-description/table";
import {
    calcQuotationExpectedContractValue,
    QUOTATION_META,
} from "../quotation/table";
import { ROLE_META } from "../roles/table";
import { useUser } from "../state";
import { USER_META } from "../user/table";
import {
    calcProjectDescriptions,
    calcProjectStage,
    calcProjectSummary,
    calcProjectTotalContractValue,
    Project,
    PROJECT_META,
} from "./table";

export type Data = Project;

export const Fields = {
    yearConstructed: FormField(DecimalWidget),
    unitCount: OptionalFormField(DecimalWidget),
    projectNameOrNumber: OptionalFormField(TextWidget),
    customer: FormField(TextWidget),
    siteAddress: AddressWidget,
    additionalSiteAddresses: Optional(
        ListWidget(AddressWidget, {
            emptyOk: true,
        })
    ),
};

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);

    if (
        data.yearConstructed.lessThan(1800) ||
        data.yearConstructed.greaterThan(2100)
    ) {
        errors.push({
            invalid: true,
            empty: false,
            field: "yearConstructed",
            detail: [
                {
                    invalid: true,
                    empty: false,
                },
            ],
        });
    }
    return errors;
}

function actionCopyDetails(
    state: State,
    data: Project,
    project: Project,
    updatedBillingContacts: ContactDetail[]
) {
    return {
        state,
        data: {
            ...data,
            customer: project.customer,
            yearConstructed: project.yearConstructed,
            unitCount: project.unitCount,
            billingContacts: updatedBillingContacts,
            contacts: project.contacts,
            source: {
                category: "55e8c576-b3a6-5693-be0a-e9ba27f8f1b1", // repeat client
                detail: "",
            },
        },
    };
}

export function useRelatedProjectsFilter(prefix: string, project: Project) {
    return React.useMemo(() => {
        const conditions = [];
        if (project.customer) {
            conditions.push({
                column: prefix + "customer",
                filter: {
                    equal: project.customer,
                },
            });
        }
        if (project.siteAddress.line1) {
            conditions.push({
                column: prefix + "siteAddress.line1",
                filter: {
                    equal: project.siteAddress.line1,
                },
            });
        }

        if (conditions.length == 0) {
            return null;
        }

        return [
            {
                or: conditions,
            },
            {
                column: prefix + "id",
                filter: {
                    not_equal: project.id.uuid,
                },
            },
        ];
    }, [project.customer, project.id.uuid, project.siteAddress.line1]);
}

function Component(props: Props) {
    const user = useUser();
    const filters = useRelatedProjectsFilter("", props.data);

    const projects =
        useRecordQuery(
            PROJECT_META,
            {
                filters: filters || [],
                sorts: ["-projectNumber"],
            },
            [filters],
            filters !== null
        ) || [];

    const onRequestAccess = React.useCallback(
        (project: Project) => {
            patchRecord(PROJECT_META, "Project", project.id.uuid, {
                accessRequests: {
                    _t: "a",
                    append: user.id,
                },
            });
        },
        [user.id]
    );

    const onCancelRequestAccess = React.useCallback(
        (project: Project) => {
            const index = project.accessRequests.indexOf(user.id);
            patchRecord(PROJECT_META, "Project", project.id.uuid, {
                accessRequests: {
                    _t: "a",
                    ["_" + index]: [user.id, 0, 0],
                },
            });
        },
        [user.id]
    );

    const cache = useQuickCache();

    return (
        <>
            <FieldRow>
                <widgets.customer label="Client's Name" />
                <widgets.projectNameOrNumber label="Project Name and/or Number" />
                <widgets.yearConstructed
                    fallbackText="(not specified)"
                    suppressCommas={true}
                    style={{ textAlign: "left", width: "20em" }}
                />
                <widgets.unitCount
                    label="# of Units in Building"
                    fallbackText="N/A"
                    style={{ textAlign: "left", width: "20em" }}
                />
            </FieldRow>
            <FieldRow>
                <widgets.siteAddress />
            </FieldRow>
            <widgets.additionalSiteAddresses addButtonText="Add Additional Address" />
            <FormWrapper label="Previous Projects for This Client">
                <Accordion>
                    {projects.map((project) => {
                        const updatedBillingContacts =
                            project.billingContacts.map((billingContact) => {
                                const contact =
                                    cache.get(
                                        CONTACT_META,
                                        billingContact.contact
                                    ) || null;
                                const company =
                                    cache.get(
                                        COMPANY_META,
                                        contact?.company || null
                                    ) || null;

                                return buildContactDetail(contact, company);
                            });

                        return (
                            <Card key={project.id.uuid}>
                                <Card.Header>
                                    <Accordion.Toggle
                                        as={Button}
                                        variant="Link"
                                        eventKey={project.id.uuid}
                                    >
                                        {calcProjectSummary(project)}
                                    </Accordion.Toggle>
                                </Card.Header>
                                <Accordion.Collapse eventKey={project.id.uuid}>
                                    <div
                                        style={{
                                            display: "flex",
                                            margin: "1em",
                                        }}
                                    >
                                        <div
                                            style={{
                                                flexGrow: 1,
                                                flexBasis: 0,
                                            }}
                                        >
                                            Project #{project.projectNumber}
                                            <br />
                                            <b>Request Quote Date:</b>{" "}
                                            {longDate(project.quoteRequestDate)}
                                            <ul>
                                                {calcProjectDescriptions(
                                                    project
                                                ).map((description, index) => (
                                                    <li key={index}>
                                                        {
                                                            cache.get(
                                                                PROJECT_DESCRIPTION_CATEGORY_META,
                                                                description.category
                                                            )?.name
                                                        }
                                                        :{" "}
                                                        {
                                                            cache.get(
                                                                PROJECT_DESCRIPTION_META,
                                                                description.description
                                                            )?.name
                                                        }
                                                    </li>
                                                ))}
                                            </ul>
                                            <Button
                                                onClick={() =>
                                                    props.dispatch({
                                                        type: "COPY_DETAILS",
                                                        project,
                                                        updatedBillingContacts,
                                                    })
                                                }
                                            >
                                                Copy Project Details
                                            </Button>
                                        </div>
                                        <div
                                            style={{
                                                flexGrow: 1,
                                                flexBasis: 0,
                                            }}
                                        >
                                            <b>Stage:</b>{" "}
                                            {calcProjectStage(project)}
                                            <br />
                                            {project.projectAwardDate ? (
                                                <>
                                                    <b>Contract Value:</b>{" "}
                                                    {formatMoney(
                                                        calcProjectTotalContractValue(
                                                            project
                                                        )
                                                    )}
                                                    <br />
                                                </>
                                            ) : (
                                                hasPermission(
                                                    user,
                                                    "Quotation",
                                                    "read"
                                                ) &&
                                                cache.get(
                                                    QUOTATION_META,
                                                    project.lastQuotation
                                                ) && (
                                                    <>
                                                        <b>
                                                            Expected Contract
                                                            Value:
                                                        </b>{" "}
                                                        {formatMoney(
                                                            calcQuotationExpectedContractValue(
                                                                cache.get(
                                                                    QUOTATION_META,
                                                                    project.lastQuotation
                                                                )!
                                                            )
                                                        )}
                                                        <br />
                                                    </>
                                                )
                                            )}
                                            {hasPermission(
                                                user,
                                                "Quotation",
                                                "read"
                                            ) &&
                                                cache.get(
                                                    QUOTATION_META,
                                                    project.lastQuotation
                                                ) &&
                                                cache.get(
                                                    QUOTATION_META,
                                                    project.lastQuotation
                                                ) && (
                                                    <>
                                                        <b>
                                                            Last Quotation Date:
                                                        </b>{" "}
                                                        {longDate(
                                                            cache.get(
                                                                QUOTATION_META,
                                                                project.lastQuotation
                                                            )!.date
                                                        )}
                                                        <br />
                                                    </>
                                                )}
                                        </div>
                                        <div
                                            style={{
                                                flexGrow: 1,
                                                flexBasis: 0,
                                            }}
                                        >
                                            <ul>
                                                {project.personnel.map(
                                                    (entry) => (
                                                        <li>
                                                            {
                                                                cache.get(
                                                                    ROLE_META,
                                                                    entry.role
                                                                )?.name
                                                            }
                                                            :{" "}
                                                            {
                                                                cache.get(
                                                                    USER_META,
                                                                    entry.user
                                                                )?.name
                                                            }
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                            {!some(
                                                project.personnel,
                                                (entry) =>
                                                    entry.user === user.id
                                            ) &&
                                                (project.accessRequests.indexOf(
                                                    user.id
                                                ) === -1 ? (
                                                    <Button
                                                        onClick={() =>
                                                            onRequestAccess(
                                                                project
                                                            )
                                                        }
                                                    >
                                                        Request Access
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() =>
                                                            onCancelRequestAccess(
                                                                project
                                                            )
                                                        }
                                                    >
                                                        Cancel Access Request
                                                    </Button>
                                                ))}
                                        </div>
                                    </div>
                                </Accordion.Collapse>
                            </Card>
                        );
                    })}
                </Accordion>
            </FormWrapper>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.yearConstructed> &
    WidgetContext<typeof Fields.unitCount> &
    WidgetContext<typeof Fields.projectNameOrNumber> &
    WidgetContext<typeof Fields.customer> &
    WidgetContext<typeof Fields.siteAddress> &
    WidgetContext<typeof Fields.additionalSiteAddresses>;
type ExtraProps = {};
type BaseState = {
    yearConstructed: WidgetState<typeof Fields.yearConstructed>;
    unitCount: WidgetState<typeof Fields.unitCount>;
    projectNameOrNumber: WidgetState<typeof Fields.projectNameOrNumber>;
    customer: WidgetState<typeof Fields.customer>;
    siteAddress: WidgetState<typeof Fields.siteAddress>;
    additionalSiteAddresses: WidgetState<typeof Fields.additionalSiteAddresses>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "YEAR_CONSTRUCTED";
          action: WidgetAction<typeof Fields.yearConstructed>;
      }
    | { type: "UNIT_COUNT"; action: WidgetAction<typeof Fields.unitCount> }
    | {
          type: "PROJECT_NAME_OR_NUMBER";
          action: WidgetAction<typeof Fields.projectNameOrNumber>;
      }
    | { type: "CUSTOMER"; action: WidgetAction<typeof Fields.customer> }
    | { type: "SITE_ADDRESS"; action: WidgetAction<typeof Fields.siteAddress> }
    | {
          type: "ADDITIONAL_SITE_ADDRESSES";
          action: WidgetAction<typeof Fields.additionalSiteAddresses>;
      }
    | {
          type: "COPY_DETAILS";
          project: Project;
          updatedBillingContacts: ContactDetail[];
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.yearConstructed,
        data.yearConstructed,
        cache,
        "yearConstructed",
        errors
    );
    subvalidate(Fields.unitCount, data.unitCount, cache, "unitCount", errors);
    subvalidate(
        Fields.projectNameOrNumber,
        data.projectNameOrNumber,
        cache,
        "projectNameOrNumber",
        errors
    );
    subvalidate(Fields.customer, data.customer, cache, "customer", errors);
    subvalidate(
        Fields.siteAddress,
        data.siteAddress,
        cache,
        "siteAddress",
        errors
    );
    subvalidate(
        Fields.additionalSiteAddresses,
        data.additionalSiteAddresses,
        cache,
        "additionalSiteAddresses",
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
        case "YEAR_CONSTRUCTED": {
            const inner = Fields.yearConstructed.reduce(
                state.yearConstructed,
                data.yearConstructed,
                action.action,
                subcontext
            );
            return {
                state: { ...state, yearConstructed: inner.state },
                data: { ...data, yearConstructed: inner.data },
            };
        }
        case "UNIT_COUNT": {
            const inner = Fields.unitCount.reduce(
                state.unitCount,
                data.unitCount,
                action.action,
                subcontext
            );
            return {
                state: { ...state, unitCount: inner.state },
                data: { ...data, unitCount: inner.data },
            };
        }
        case "PROJECT_NAME_OR_NUMBER": {
            const inner = Fields.projectNameOrNumber.reduce(
                state.projectNameOrNumber,
                data.projectNameOrNumber,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectNameOrNumber: inner.state },
                data: { ...data, projectNameOrNumber: inner.data },
            };
        }
        case "CUSTOMER": {
            const inner = Fields.customer.reduce(
                state.customer,
                data.customer,
                action.action,
                subcontext
            );
            return {
                state: { ...state, customer: inner.state },
                data: { ...data, customer: inner.data },
            };
        }
        case "SITE_ADDRESS": {
            const inner = Fields.siteAddress.reduce(
                state.siteAddress,
                data.siteAddress,
                action.action,
                subcontext
            );
            return {
                state: { ...state, siteAddress: inner.state },
                data: { ...data, siteAddress: inner.data },
            };
        }
        case "ADDITIONAL_SITE_ADDRESSES": {
            const inner = Fields.additionalSiteAddresses.reduce(
                state.additionalSiteAddresses,
                data.additionalSiteAddresses,
                action.action,
                subcontext
            );
            return {
                state: { ...state, additionalSiteAddresses: inner.state },
                data: { ...data, additionalSiteAddresses: inner.data },
            };
        }
        case "COPY_DETAILS":
            return actionCopyDetails(
                state,
                data,
                action.project,
                action.updatedBillingContacts
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
    yearConstructed: function (
        props: WidgetExtraProps<typeof Fields.yearConstructed> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "YEAR_CONSTRUCTED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "yearConstructed", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.yearConstructed.component
                state={context.state.yearConstructed}
                data={context.data.yearConstructed}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Year Constructed"}
            />
        );
    },
    unitCount: function (
        props: WidgetExtraProps<typeof Fields.unitCount> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "UNIT_COUNT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "unitCount", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.unitCount.component
                state={context.state.unitCount}
                data={context.data.unitCount}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Unit Count"}
            />
        );
    },
    projectNameOrNumber: function (
        props: WidgetExtraProps<typeof Fields.projectNameOrNumber> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_NAME_OR_NUMBER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "projectNameOrNumber",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectNameOrNumber.component
                state={context.state.projectNameOrNumber}
                data={context.data.projectNameOrNumber}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Name or Number"}
            />
        );
    },
    customer: function (
        props: WidgetExtraProps<typeof Fields.customer> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CUSTOMER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "customer", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.customer.component
                state={context.state.customer}
                data={context.data.customer}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Customer"}
            />
        );
    },
    siteAddress: function (
        props: WidgetExtraProps<typeof Fields.siteAddress> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SITE_ADDRESS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "siteAddress", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.siteAddress.component
                state={context.state.siteAddress}
                data={context.data.siteAddress}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Site Address"}
            />
        );
    },
    additionalSiteAddresses: function (
        props: WidgetExtraProps<typeof Fields.additionalSiteAddresses> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ADDITIONAL_SITE_ADDRESSES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "additionalSiteAddresses",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.additionalSiteAddresses.component
                state={context.state.additionalSiteAddresses}
                data={context.data.additionalSiteAddresses}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Additional Site Addresses"}
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
        let yearConstructedState;
        {
            const inner = Fields.yearConstructed.initialize(
                data.yearConstructed,
                subcontext,
                subparameters.yearConstructed
            );
            yearConstructedState = inner.state;
            data = { ...data, yearConstructed: inner.data };
        }
        let unitCountState;
        {
            const inner = Fields.unitCount.initialize(
                data.unitCount,
                subcontext,
                subparameters.unitCount
            );
            unitCountState = inner.state;
            data = { ...data, unitCount: inner.data };
        }
        let projectNameOrNumberState;
        {
            const inner = Fields.projectNameOrNumber.initialize(
                data.projectNameOrNumber,
                subcontext,
                subparameters.projectNameOrNumber
            );
            projectNameOrNumberState = inner.state;
            data = { ...data, projectNameOrNumber: inner.data };
        }
        let customerState;
        {
            const inner = Fields.customer.initialize(
                data.customer,
                subcontext,
                subparameters.customer
            );
            customerState = inner.state;
            data = { ...data, customer: inner.data };
        }
        let siteAddressState;
        {
            const inner = Fields.siteAddress.initialize(
                data.siteAddress,
                subcontext,
                subparameters.siteAddress
            );
            siteAddressState = inner.state;
            data = { ...data, siteAddress: inner.data };
        }
        let additionalSiteAddressesState;
        {
            const inner = Fields.additionalSiteAddresses.initialize(
                data.additionalSiteAddresses,
                subcontext,
                subparameters.additionalSiteAddresses
            );
            additionalSiteAddressesState = inner.state;
            data = { ...data, additionalSiteAddresses: inner.data };
        }
        let state = {
            initialParameters: parameters,
            yearConstructed: yearConstructedState,
            unitCount: unitCountState,
            projectNameOrNumber: projectNameOrNumberState,
            customer: customerState,
            siteAddress: siteAddressState,
            additionalSiteAddresses: additionalSiteAddressesState,
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
    yearConstructed: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.yearConstructed>
    >;
    unitCount: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.unitCount>
    >;
    projectNameOrNumber: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectNameOrNumber>
    >;
    customer: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.customer>
    >;
    siteAddress: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.siteAddress>
    >;
    additionalSiteAddresses: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.additionalSiteAddresses>
    >;
};
// END MAGIC -- DO NOT EDIT
