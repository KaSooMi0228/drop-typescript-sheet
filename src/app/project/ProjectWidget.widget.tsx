import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { addDays } from "date-fns";
import { keyBy, some } from "lodash";
import * as React from "react";
import { Button, ModalBody, ModalTitle, Nav } from "react-bootstrap";
import Modal from "react-modal";
import { useDraftProjectRecordQuery } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { Link } from "../../clay/link";
import { LocalDate, longDate } from "../../clay/LocalDate";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickCache } from "../../clay/quick-cache";
import { SaveButton } from "../../clay/save-button";
import { forceReload } from "../../clay/service";
import { FormWrapper, OptionalFormField } from "../../clay/widgets/FormField";
import {
    InitializeResult,
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
import { TextAreaWidget } from "../../clay/widgets/TextAreaWidget";
import { StaticTextField } from "../../clay/widgets/TextWidget";
import { hasPermission } from "../../permissions";
import { ContactDetail } from "../contact/table";
import AcceptRoleWidget, {
    AcceptRoleProjectDetailsWidget,
    rejectRoles,
    RoleName,
} from "../inbox/AcceptRoleWidget.widget";
import { useLocalWidget } from "../inbox/useLocalWidget";
import ModalHeader from "../ModalHeader";
import { Quotation } from "../quotation/table";
import { useUser } from "../state";
import { CONTENT_AREA } from "../styles";
import { ROLE_ESTIMATOR, User, USER_META } from "../user/table";
import ContractDetailsWidget from "./ContractDetailsWidget.widget";
import { CustomerSurveyPopup } from "./customer-survey/popup";
import { CUSTOMER_SURVEY_META } from "./customer-survey/table";
import EstimateDelayWidget from "./estimate-delay.widget";
import ProjectAwardWidget from "./ProjectAwardWidget.widget";
import ProjectCertifiedForemenCommunicationWidget from "./ProjectCertifiedForemenCommunicationWidget.widget";
import ProjectEstimatesWidget from "./ProjectEstimatesWidget.widget";
import ProjectInvoicesWidget from "./ProjectInvoicesWidget.widget";
import ProjectLostTabWidget from "./ProjectLostTabWidget.widget";
import ProjectMessagesWidget from "./ProjectMessagesWidget.widget";
import ProjectQuotationsWidget from "./ProjectQuotationsWidget.widget";
import ProjectRolesWidget from "./ProjectRolesWidget.widget";
import ProjectWrapUpWidget from "./ProjectWrapUpWidget.widget";
import { QuoteRequestWidget } from "./quoteRequestWidgets";
import { SummaryTabsWidget } from "./summary";
import {
    calcProjectIsEstimateLate,
    EstimateDelay,
    Project,
    PROJECT_META,
} from "./table";

export type Data = Project;
export const PROJECT_WIDGET_META = PROJECT_META;
export type ExtraState = {
    tab: keyof typeof Subs;
    customerSurveyTriggered: boolean;
};
export const Fields = {
    customerSurveyMissingReason: OptionalFormField(TextAreaWidget),
};
export const Subs = {
    summary: SummaryTabsWidget,
    quoting: QuoteRequestWidget,
    roles: ProjectRolesWidget,
    messages: ProjectMessagesWidget,
    estimates: ProjectEstimatesWidget,
    quotations: ProjectQuotationsWidget,
    projectLost: ProjectLostTabWidget,
    contractAward: ProjectAwardWidget,
    contractDetails: ContractDetailsWidget,
    certifiedForemenCommunication: ProjectCertifiedForemenCommunicationWidget,
    invoices: ProjectInvoicesWidget,
    wrapup: ProjectWrapUpWidget,
};

type ExtraActions =
    | {
          type: "SELECT_TAB";
          tab: keyof typeof Subs;
      }
    | {
          type: "SELECT_QUOTATION";
          quotation: Link<Quotation>;
          lost: boolean;
          user: Link<User>;
      }
    | {
          type: "CANCEL_AWARD_LOST";
      }
    | {
          type: "CANCEL_CONTRACT_DETAILS";
      }
    | {
          type: "ACCEPT_ROLES";
          user: Link<User>;
      }
    | {
          type: "UPDATE_CUSTOMER_SURVEY_MISSING";
          value: boolean;
      }
    | {
          type: "UPDATE_CUSTOMER_SURVEY_TRIGGERED";
          value: boolean;
      };

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);

    return errors.filter(
        (error) =>
            TAB_BY_KEY[error.field!].accessible(data, errors) &&
            (TAB_BY_KEY[error.field!].enforced == undefined ||
                TAB_BY_KEY[error.field!].enforced!(data))
    );
}

function initialize(
    data: Project,
    context: Context,
    parameters: string[] = []
): InitializeResult<ExtraState, Project> {
    let state: ExtraState = {
        tab:
            (parameters[0] as any) ||
            (data.quoteRequestDate ? "summary" : "quoting"),
        customerSurveyTriggered: false,
    };
    return {
        state,
        data,
        parameters: {
            [state.tab]: parameters.slice(1),
        },
    };
}

function encodeState(state: State) {
    const sub = Subs[state.tab];
    const innerEncoded = sub.encodeState
        ? sub.encodeState(state[state.tab] as any)
        : [];
    return [state.tab, ...innerEncoded];
}

function reduce(state: State, data: Project, action: Action, context: Context) {
    switch (action.type) {
        case "ACCEPT_ROLES":
            return {
                state,
                data: {
                    ...data,
                    personnel: data.personnel.map((row) => ({
                        ...row,
                        accepted: row.accepted || row.user === action.user,
                        acceptedDate:
                            row.acceptedDate || row.user == action.user
                                ? new Date()
                                : null,
                    })),
                },
            };

        case "SELECT_TAB":
            const tabConfig = TAB_BY_KEY[action.tab];
            return {
                state: {
                    ...state,
                    tab: action.tab,
                },
                data: tabConfig.onOpen ? tabConfig.onOpen(data) : data,
            };
        case "SELECT_QUOTATION":
            return {
                state: {
                    ...state,
                    tab: action.lost
                        ? ("projectLost" as const)
                        : ("contractAward" as const),
                },
                data: {
                    ...data,
                    selectedQuotation: action.quotation,
                    projectLostDate: action.lost ? new Date() : null,
                    projectAwardDate: action.lost ? null : new Date(),
                    projectLostUser: action.lost ? action.user : null,
                    projectProceededWithoutRemdal: action.lost
                        ? true
                        : data.projectProceededWithoutRemdal,
                },
            };
        case "CANCEL_AWARD_LOST":
            return {
                state: {
                    ...state,
                    tab: "quotations" as const,
                    projectLost: {
                        ...state.projectLost,
                        competitors: {
                            ...state.projectLost.competitors,
                            items: [],
                        },
                    },
                    contractAward: {
                        ...state.contractAward,
                        competitors: {
                            ...state.contractAward.competitors,
                            items: [],
                        },
                    },
                },
                data: {
                    ...data,
                    selectedQuotation: null,
                    projectLostDate: null,
                    projectAwardDate: null,
                    customerPurchaseOrderNumber: "",
                    competitors: [],
                    approvalType: null,
                    anticipatedDuration: null,
                    contractAwardSpecialNeedsAndNotes: "",
                    projectLostNotes: "",
                    projectProceededWithoutRemdal: false,
                    season: "",
                },
            };
        case "CANCEL_CONTRACT_DETAILS":
            return {
                state: {
                    ...state,
                    tab: "contractAward" as const,
                    contractDetails: {
                        ...state.contractDetails,
                        projectSchedules: {
                            ...state.contractDetails.projectSchedules,
                            items: [],
                        },
                        preferredCertifiedForemen: {
                            ...state.contractDetails.preferredCertifiedForemen,
                            items: [],
                        },
                    },
                },
                data: {
                    ...data,
                    contractDetailsDate: null,
                    selectedOptions: [],
                    projectSchedules: [],
                    projectSchedulesDividedDescription: false,
                    projectDescription: {
                        category: null,
                        description: null,
                        custom: "",
                    },
                    preferredCertifiedForemen: [],
                },
            };
        case "UPDATE_CUSTOMER_SURVEY_MISSING":
            return {
                state,
                data: {
                    ...data,
                    customerSurveyMissing: action.value,
                },
            };
        case "UPDATE_CUSTOMER_SURVEY_TRIGGERED":
            return {
                state: {
                    ...state,
                    customerSurveyTriggered: action.value,
                },
                data,
            };
        default:
            return baseReduce(state, data, action, context);
    }
}

const TABS: {
    key: keyof typeof Subs;
    title: string;
    accessible: (project: Project, validation: ValidationError[]) => boolean;
    hidden?: (project: Project) => boolean;
    enforced?: (project: Project) => boolean;
    onOpen?: (project: Project) => Project;
    permission?: string;
}[] = [
    {
        key: "summary",
        title: "Overview",
        accessible: (project) => project.quoteRequestDate != null,
        enforced: () => true,
    },
    {
        key: "quoting",
        title: "Quote Request",
        accessible: () => true,
    },
    {
        key: "messages",
        title: "Project Notes",
        accessible: () => true,
    },
    {
        key: "roles",
        title: "Project Roles",
        accessible: (project) => project.quoteRequestDate != null,
    },
    {
        key: "estimates",
        title: "Estimates",
        accessible: (project) => project.quoteRequestDate != null,
        permission: "Estimate-read",
    },
    {
        key: "quotations",
        title: "Proposals",
        accessible: (project) => project.quoteRequestDate != null,
        permission: "Quotation-read",
    },
    {
        key: "projectLost",
        title: "Project Lost",
        accessible: (project) => project.projectLostDate !== null,
        hidden: (project) => project.projectLostDate === null,
    },
    {
        key: "contractAward",
        title: "Project Awarded",
        accessible: (project) => project.projectAwardDate !== null,
        hidden: (project) => project.projectAwardDate === null,
    },
    {
        key: "contractDetails",
        title: "Contract Details",
        accessible: (project, errors) =>
            project.projectAwardDate !== null &&
            !some(errors, (error) => error.field == "contractAward"),
        hidden: (project) => project.projectAwardDate === null,
        enforced: (project) => project.contractDetailsDate !== null,
        onOpen: (project) => ({
            ...project,
            contractDetailsDate: project.contractDetailsDate || new Date(),
        }),
    },
    {
        key: "certifiedForemenCommunication",
        title: "CF Communication",
        accessible: () => true,
    },
    {
        key: "invoices",
        title: "Invoices",
        accessible: (project, errors) =>
            project.projectAwardDate !== null &&
            !some(errors, (error) => error.field == "contractAward"),
        hidden: (project) => project.projectAwardDate === null,
        permission: "Invoice-read",
    },
    {
        key: "wrapup",
        title: "Wrap-Up",
        accessible: (project, errors) =>
            project.projectAwardDate !== null &&
            !some(errors, (error) => error.field == "contractAward"),
        hidden: (project) => project.projectAwardDate === null,
    },
];

export const PROJECT_TABS = TABS;

const TAB_BY_KEY = keyBy(TABS, (tab) => tab.key);

function actionExplainDelayedEstimate(
    state: State,
    data: Data,
    detail: EstimateDelay
) {
    return {
        state,
        data: {
            ...data,
            estimateDelays: [...data.estimateDelays, detail],
        },
    };
}

function LateEstimate({
    project,
    dispatch,
}: {
    project: Project;
    dispatch: (action: Action) => void;
}) {
    const user = useUser();
    const cache = useQuickCache();

    const delayWidget = useLocalWidget(EstimateDelayWidget, {
        user: user.id,
        addedDate: new Date(),
        message: "",
        delayUntil: new LocalDate(addDays(new Date(), 7)),
        dismissed: [],
    });

    const onContinue = React.useCallback(() => {
        dispatch({
            type: "EXPLAIN_DELAYED_ESTIMATE",
            detail: delayWidget.data,
        });
    }, [dispatch, delayWidget.data]);

    if (
        calcProjectIsEstimateLate(project) &&
        some(
            project.personnel,
            (entry) => entry.role == ROLE_ESTIMATOR && entry.user == user.id
        )
    ) {
        return (
            <Modal isOpen={true} onRequestClose={() => {}}>
                <ModalHeader>
                    <ModalTitle>Late Estimate</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <FieldRow>
                        <FormWrapper label="RFQ Entered By">
                            <StaticTextField
                                value={
                                    cache.get(
                                        USER_META,
                                        project.quoteRequestCompletedBy
                                    )?.name || ""
                                }
                            />
                        </FormWrapper>
                        <FormWrapper label="Quote Request Date">
                            <StaticTextField
                                value={longDate(project.quoteRequestDate) || ""}
                            />
                        </FormWrapper>
                    </FieldRow>
                    <FormWrapper label="Client's request">
                        <div
                            dangerouslySetInnerHTML={{
                                __html: project.customersRequest.value,
                            }}
                        />
                        {project.additionalCustomersRequests.map((request) => (
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: request.value,
                                }}
                            />
                        ))}
                    </FormWrapper>
                    {delayWidget.component}
                    <Button
                        onClick={onContinue}
                        disabled={!delayWidget.isValid}
                    >
                        Continue
                    </Button>
                </ModalBody>
            </Modal>
        );
    } else {
        return null;
    }
}

function UnacceptedRole({
    project,
    dispatch,
}: {
    project: Project;
    dispatch: (action: Action) => void;
}) {
    const user = useUser();
    const roles = project.personnel.filter(
        (row) => !row.accepted && row.user === user.id
    );

    const form = useLocalWidget(AcceptRoleWidget);

    const onAccept = React.useCallback(() => {
        dispatch({
            type: "ACCEPT_ROLES",
            user: user.id,
        });
    }, [dispatch, user.id]);
    const onReject = React.useCallback(async () => {
        await rejectRoles(user, project, form.data.message);
        forceReload("rejected roles");
    }, [user, project, form.data.message]);

    if (roles.length == 0) {
        return null;
    } else {
        return (
            <Modal isOpen={true} onRequestClose={() => {}}>
                <ModalHeader>
                    <ModalTitle>Unaccepted Role</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <p>You have been assigned as:</p>
                    <ul>
                        {roles.map((row, index) => (
                            <li key={index}>
                                <RoleName roleId={row.role} />
                            </li>
                        ))}
                    </ul>
                    <p>Please Accept to Continue</p>
                    <AcceptRoleProjectDetailsWidget project={project} />
                    <FormWrapper label="Reason for Rejection">
                        {form.component}
                    </FormWrapper>
                    <Button onClick={onAccept}>Accept</Button>
                    <Button onClick={onReject}>Reject</Button>
                </ModalBody>
            </Modal>
        );
    }
}

function actionUpdateContacts(
    state: State,
    data: Data,
    billingContacts: ContactDetail[],
    contacts: ContactDetail[]
) {
    return {
        state,
        data: {
            ...data,
            contacts,
            billingContacts,
            customerSurveyMissing: false,
        },
    };
}

function Component(props: Props) {
    const user = useUser();
    const onSelectTab = React.useCallback(
        (tab: string | null) => {
            return props.dispatch({
                type: "SELECT_TAB",
                tab: tab as any,
            });
        },
        [props.dispatch]
    );

    const TabComponent = widgets[props.state.tab];

    const closeCustomerSurvey = React.useCallback(() => {
        props.dispatch({
            type: "UPDATE_CUSTOMER_SURVEY_TRIGGERED",
            value: false,
        });
    }, [props.dispatch]);

    const updateContacts = React.useCallback(
        (contacts, billingContacts) => {
            props.dispatch({
                type: "UPDATE_CONTACTS",
                contacts,
                billingContacts,
            });
        },
        [props.dispatch]
    );

    const customerSurveys = useDraftProjectRecordQuery(
        CUSTOMER_SURVEY_META,
        props.data.id.uuid
    );

    React.useEffect(() => {
        if (
            customerSurveys &&
            customerSurveys.length == 0 &&
            props.data.customerSurveyMissing &&
            props.data.customerSurveyMissingReason === "" &&
            !props.state.customerSurveyTriggered
        ) {
            props.dispatch({
                type: "UPDATE_CUSTOMER_SURVEY_TRIGGERED",
                value: true,
            });
        }
    }, [
        customerSurveys,
        props.data.customerSurveyMissing,
        props.data.customerSurveyMissingReason,
        props.dispatch,
        props.state.customerSurveyTriggered,
    ]);

    console.log("HELLO", props.status);

    return (
        <div
            style={{
                display: "flex",
                flexGrow: 1,
                overflowY: "auto",
            }}
        >
            {props.state.customerSurveyTriggered && (
                <CustomerSurveyPopup
                    project={props.data}
                    requestClose={closeCustomerSurvey}
                    updateContacts={updateContacts}
                />
            )}
            <LateEstimate project={props.data} dispatch={props.dispatch} />
            <UnacceptedRole project={props.data} dispatch={props.dispatch} />
            <Nav
                variant="pills"
                activeKey={props.state.tab}
                className="flex-column"
                onSelect={onSelectTab}
                style={{ flexWrap: "nowrap", width: "10em" }}
            >
                {TABS.filter(
                    (tab) =>
                        (!tab.hidden || !tab.hidden(props.data)) &&
                        hasPermission(user, "Project", "tab-" + tab.key) &&
                        (!tab.permission ||
                            user.permissions.indexOf(tab.permission) !== -1)
                ).map((tab) => (
                    <Nav.Item key={tab.key}>
                        <Nav.Link
                            eventKey={tab.key}
                            disabled={
                                !tab.accessible(
                                    props.data,
                                    props.status.validation
                                )
                            }
                            style={{
                                whiteSpace: "nowrap",
                            }}
                        >
                            {tab.title}{" "}
                            {subStatus(props.status, tab.key).validation
                                .length > 0 && (
                                <FontAwesomeIcon
                                    icon={faTimes}
                                    style={{ color: "red" }}
                                />
                            )}
                        </Nav.Link>
                    </Nav.Item>
                ))}
                <SaveButton style={{ marginTop: "auto", width: "100%" }} />
            </Nav>
            <div {...CONTENT_AREA} style={{ marginLeft: "10px" }}>
                <TabComponent />
            </div>
        </div>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.customerSurveyMissingReason> &
    WidgetContext<typeof Subs.summary> &
    WidgetContext<typeof Subs.quoting> &
    WidgetContext<typeof Subs.roles> &
    WidgetContext<typeof Subs.messages> &
    WidgetContext<typeof Subs.estimates> &
    WidgetContext<typeof Subs.quotations> &
    WidgetContext<typeof Subs.projectLost> &
    WidgetContext<typeof Subs.contractAward> &
    WidgetContext<typeof Subs.contractDetails> &
    WidgetContext<typeof Subs.certifiedForemenCommunication> &
    WidgetContext<typeof Subs.invoices> &
    WidgetContext<typeof Subs.wrapup>;
type ExtraProps = {};
type BaseState = {
    customerSurveyMissingReason: WidgetState<
        typeof Fields.customerSurveyMissingReason
    >;
    summary: WidgetState<typeof Subs.summary>;
    quoting: WidgetState<typeof Subs.quoting>;
    roles: WidgetState<typeof Subs.roles>;
    messages: WidgetState<typeof Subs.messages>;
    estimates: WidgetState<typeof Subs.estimates>;
    quotations: WidgetState<typeof Subs.quotations>;
    projectLost: WidgetState<typeof Subs.projectLost>;
    contractAward: WidgetState<typeof Subs.contractAward>;
    contractDetails: WidgetState<typeof Subs.contractDetails>;
    certifiedForemenCommunication: WidgetState<
        typeof Subs.certifiedForemenCommunication
    >;
    invoices: WidgetState<typeof Subs.invoices>;
    wrapup: WidgetState<typeof Subs.wrapup>;
    initialParameters?: string[];
};
export type State = BaseState & ExtraState;

type BaseAction =
    | {
          type: "CUSTOMER_SURVEY_MISSING_REASON";
          action: WidgetAction<typeof Fields.customerSurveyMissingReason>;
      }
    | { type: "SUMMARY"; action: WidgetAction<typeof Subs.summary> }
    | { type: "QUOTING"; action: WidgetAction<typeof Subs.quoting> }
    | { type: "ROLES"; action: WidgetAction<typeof Subs.roles> }
    | { type: "MESSAGES"; action: WidgetAction<typeof Subs.messages> }
    | { type: "ESTIMATES"; action: WidgetAction<typeof Subs.estimates> }
    | { type: "QUOTATIONS"; action: WidgetAction<typeof Subs.quotations> }
    | { type: "PROJECT_LOST"; action: WidgetAction<typeof Subs.projectLost> }
    | {
          type: "CONTRACT_AWARD";
          action: WidgetAction<typeof Subs.contractAward>;
      }
    | {
          type: "CONTRACT_DETAILS";
          action: WidgetAction<typeof Subs.contractDetails>;
      }
    | {
          type: "CERTIFIED_FOREMEN_COMMUNICATION";
          action: WidgetAction<typeof Subs.certifiedForemenCommunication>;
      }
    | { type: "INVOICES"; action: WidgetAction<typeof Subs.invoices> }
    | { type: "WRAPUP"; action: WidgetAction<typeof Subs.wrapup> }
    | { type: "EXPLAIN_DELAYED_ESTIMATE"; detail: EstimateDelay }
    | {
          type: "UPDATE_CONTACTS";
          billingContacts: ContactDetail[];
          contacts: ContactDetail[];
      };

export type Action = ExtraActions | BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.customerSurveyMissingReason,
        data.customerSurveyMissingReason,
        cache,
        "customerSurveyMissingReason",
        errors
    );
    subvalidate(Subs.summary, data, cache, "summary", errors);
    subvalidate(Subs.quoting, data, cache, "quoting", errors);
    subvalidate(Subs.roles, data, cache, "roles", errors);
    subvalidate(Subs.messages, data, cache, "messages", errors);
    subvalidate(Subs.estimates, data, cache, "estimates", errors);
    subvalidate(Subs.quotations, data, cache, "quotations", errors);
    subvalidate(Subs.projectLost, data, cache, "projectLost", errors);
    subvalidate(Subs.contractAward, data, cache, "contractAward", errors);
    subvalidate(Subs.contractDetails, data, cache, "contractDetails", errors);
    subvalidate(
        Subs.certifiedForemenCommunication,
        data,
        cache,
        "certifiedForemenCommunication",
        errors
    );
    subvalidate(Subs.invoices, data, cache, "invoices", errors);
    subvalidate(Subs.wrapup, data, cache, "wrapup", errors);
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
        case "CUSTOMER_SURVEY_MISSING_REASON": {
            const inner = Fields.customerSurveyMissingReason.reduce(
                state.customerSurveyMissingReason,
                data.customerSurveyMissingReason,
                action.action,
                subcontext
            );
            return {
                state: { ...state, customerSurveyMissingReason: inner.state },
                data: { ...data, customerSurveyMissingReason: inner.data },
            };
        }
        case "SUMMARY": {
            const inner = Subs.summary.reduce(
                state.summary,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, summary: inner.state },
                data: inner.data,
            };
        }
        case "QUOTING": {
            const inner = Subs.quoting.reduce(
                state.quoting,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, quoting: inner.state },
                data: inner.data,
            };
        }
        case "ROLES": {
            const inner = Subs.roles.reduce(
                state.roles,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, roles: inner.state },
                data: inner.data,
            };
        }
        case "MESSAGES": {
            const inner = Subs.messages.reduce(
                state.messages,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, messages: inner.state },
                data: inner.data,
            };
        }
        case "ESTIMATES": {
            const inner = Subs.estimates.reduce(
                state.estimates,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, estimates: inner.state },
                data: inner.data,
            };
        }
        case "QUOTATIONS": {
            const inner = Subs.quotations.reduce(
                state.quotations,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, quotations: inner.state },
                data: inner.data,
            };
        }
        case "PROJECT_LOST": {
            const inner = Subs.projectLost.reduce(
                state.projectLost,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectLost: inner.state },
                data: inner.data,
            };
        }
        case "CONTRACT_AWARD": {
            const inner = Subs.contractAward.reduce(
                state.contractAward,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contractAward: inner.state },
                data: inner.data,
            };
        }
        case "CONTRACT_DETAILS": {
            const inner = Subs.contractDetails.reduce(
                state.contractDetails,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contractDetails: inner.state },
                data: inner.data,
            };
        }
        case "CERTIFIED_FOREMEN_COMMUNICATION": {
            const inner = Subs.certifiedForemenCommunication.reduce(
                state.certifiedForemenCommunication,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, certifiedForemenCommunication: inner.state },
                data: inner.data,
            };
        }
        case "INVOICES": {
            const inner = Subs.invoices.reduce(
                state.invoices,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, invoices: inner.state },
                data: inner.data,
            };
        }
        case "WRAPUP": {
            const inner = Subs.wrapup.reduce(
                state.wrapup,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, wrapup: inner.state },
                data: inner.data,
            };
        }
        case "EXPLAIN_DELAYED_ESTIMATE":
            return actionExplainDelayedEstimate(state, data, action.detail);
        case "UPDATE_CONTACTS":
            return actionUpdateContacts(
                state,
                data,
                action.billingContacts,
                action.contacts
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
    customerSurveyMissingReason: function (
        props: WidgetExtraProps<typeof Fields.customerSurveyMissingReason> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CUSTOMER_SURVEY_MISSING_REASON",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "customerSurveyMissingReason",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.customerSurveyMissingReason.component
                state={context.state.customerSurveyMissingReason}
                data={context.data.customerSurveyMissingReason}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Customer Survey Missing Reason"}
            />
        );
    },
    summary: function (
        props: WidgetExtraProps<typeof Subs.summary> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SUMMARY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "summary", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.summary.component
                state={context.state.summary}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Summary"}
            />
        );
    },
    quoting: function (
        props: WidgetExtraProps<typeof Subs.quoting> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "QUOTING",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "quoting", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.quoting.component
                state={context.state.quoting}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Quoting"}
            />
        );
    },
    roles: function (
        props: WidgetExtraProps<typeof Subs.roles> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "ROLES", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "roles", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.roles.component
                state={context.state.roles}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Roles"}
            />
        );
    },
    messages: function (
        props: WidgetExtraProps<typeof Subs.messages> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MESSAGES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "messages", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.messages.component
                state={context.state.messages}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Messages"}
            />
        );
    },
    estimates: function (
        props: WidgetExtraProps<typeof Subs.estimates> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ESTIMATES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "estimates", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.estimates.component
                state={context.state.estimates}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Estimates"}
            />
        );
    },
    quotations: function (
        props: WidgetExtraProps<typeof Subs.quotations> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "QUOTATIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "quotations", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.quotations.component
                state={context.state.quotations}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Quotations"}
            />
        );
    },
    projectLost: function (
        props: WidgetExtraProps<typeof Subs.projectLost> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_LOST",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "projectLost", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.projectLost.component
                state={context.state.projectLost}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Lost"}
            />
        );
    },
    contractAward: function (
        props: WidgetExtraProps<typeof Subs.contractAward> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTRACT_AWARD",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "contractAward", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.contractAward.component
                state={context.state.contractAward}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contract Award"}
            />
        );
    },
    contractDetails: function (
        props: WidgetExtraProps<typeof Subs.contractDetails> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTRACT_DETAILS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "contractDetails", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.contractDetails.component
                state={context.state.contractDetails}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contract Details"}
            />
        );
    },
    certifiedForemenCommunication: function (
        props: WidgetExtraProps<typeof Subs.certifiedForemenCommunication> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CERTIFIED_FOREMEN_COMMUNICATION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "certifiedForemenCommunication",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Subs.certifiedForemenCommunication.component
                state={context.state.certifiedForemenCommunication}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Certified Foremen Communication"}
            />
        );
    },
    invoices: function (
        props: WidgetExtraProps<typeof Subs.invoices> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INVOICES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "invoices", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.invoices.component
                state={context.state.invoices}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Invoices"}
            />
        );
    },
    wrapup: function (
        props: WidgetExtraProps<typeof Subs.wrapup> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "WRAPUP",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "wrapup", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.wrapup.component
                state={context.state.wrapup}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Wrapup"}
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
        const result = initialize(data, context, parameters);
        data = result.data;
        let subparameters: Dictionary<string[]> =
            (result as any).parameters || {};
        let subcontext = context;
        let customerSurveyMissingReasonState;
        {
            const inner = Fields.customerSurveyMissingReason.initialize(
                data.customerSurveyMissingReason,
                subcontext,
                subparameters.customerSurveyMissingReason
            );
            customerSurveyMissingReasonState = inner.state;
            data = { ...data, customerSurveyMissingReason: inner.data };
        }
        let summaryState;
        {
            const inner = Subs.summary.initialize(
                data,
                subcontext,
                subparameters.summary
            );
            summaryState = inner.state;
            data = inner.data;
        }
        let quotingState;
        {
            const inner = Subs.quoting.initialize(
                data,
                subcontext,
                subparameters.quoting
            );
            quotingState = inner.state;
            data = inner.data;
        }
        let rolesState;
        {
            const inner = Subs.roles.initialize(
                data,
                subcontext,
                subparameters.roles
            );
            rolesState = inner.state;
            data = inner.data;
        }
        let messagesState;
        {
            const inner = Subs.messages.initialize(
                data,
                subcontext,
                subparameters.messages
            );
            messagesState = inner.state;
            data = inner.data;
        }
        let estimatesState;
        {
            const inner = Subs.estimates.initialize(
                data,
                subcontext,
                subparameters.estimates
            );
            estimatesState = inner.state;
            data = inner.data;
        }
        let quotationsState;
        {
            const inner = Subs.quotations.initialize(
                data,
                subcontext,
                subparameters.quotations
            );
            quotationsState = inner.state;
            data = inner.data;
        }
        let projectLostState;
        {
            const inner = Subs.projectLost.initialize(
                data,
                subcontext,
                subparameters.projectLost
            );
            projectLostState = inner.state;
            data = inner.data;
        }
        let contractAwardState;
        {
            const inner = Subs.contractAward.initialize(
                data,
                subcontext,
                subparameters.contractAward
            );
            contractAwardState = inner.state;
            data = inner.data;
        }
        let contractDetailsState;
        {
            const inner = Subs.contractDetails.initialize(
                data,
                subcontext,
                subparameters.contractDetails
            );
            contractDetailsState = inner.state;
            data = inner.data;
        }
        let certifiedForemenCommunicationState;
        {
            const inner = Subs.certifiedForemenCommunication.initialize(
                data,
                subcontext,
                subparameters.certifiedForemenCommunication
            );
            certifiedForemenCommunicationState = inner.state;
            data = inner.data;
        }
        let invoicesState;
        {
            const inner = Subs.invoices.initialize(
                data,
                subcontext,
                subparameters.invoices
            );
            invoicesState = inner.state;
            data = inner.data;
        }
        let wrapupState;
        {
            const inner = Subs.wrapup.initialize(
                data,
                subcontext,
                subparameters.wrapup
            );
            wrapupState = inner.state;
            data = inner.data;
        }
        let state = {
            initialParameters: parameters,
            ...result.state,
            customerSurveyMissingReason: customerSurveyMissingReasonState,
            summary: summaryState,
            quoting: quotingState,
            roles: rolesState,
            messages: messagesState,
            estimates: estimatesState,
            quotations: quotationsState,
            projectLost: projectLostState,
            contractAward: contractAwardState,
            contractDetails: contractDetailsState,
            certifiedForemenCommunication: certifiedForemenCommunicationState,
            invoices: invoicesState,
            wrapup: wrapupState,
        };
        return {
            state,
            data,
        };
    },
    validate: validate,
    encodeState: encodeState,
    component: React.memo((props: Props) => {
        return (
            <ReactContext.Provider value={props}>
                <RecordContext meta={PROJECT_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
};
export default Widget;
type Widgets = {
    customerSurveyMissingReason: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.customerSurveyMissingReason>
    >;
    summary: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.summary>
    >;
    quoting: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.quoting>
    >;
    roles: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.roles>
    >;
    messages: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.messages>
    >;
    estimates: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.estimates>
    >;
    quotations: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.quotations>
    >;
    projectLost: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.projectLost>
    >;
    contractAward: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.contractAward>
    >;
    contractDetails: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.contractDetails>
    >;
    certifiedForemenCommunication: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.certifiedForemenCommunication>
    >;
    invoices: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.invoices>
    >;
    wrapup: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.wrapup>
    >;
};
// END MAGIC -- DO NOT EDIT
