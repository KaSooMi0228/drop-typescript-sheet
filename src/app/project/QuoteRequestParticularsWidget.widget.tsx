import * as React from "react";
import { useRecordQuery } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { Link } from "../../clay/link";
import { LocalDate } from "../../clay/LocalDate";
import { PageContext } from "../../clay/Page";
import { propCheck } from "../../clay/propCheck";
import {
    QuickCacheApi,
    useQuickCache,
    useQuickRecord,
} from "../../clay/quick-cache";
import { SaveButton } from "../../clay/save-button";
import { DateWidget } from "../../clay/widgets/DateWidget";
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
import { ListWidget } from "../../clay/widgets/ListWidget";
import { SelectLinkWidget } from "../../clay/widgets/SelectLinkWidget";
import { SelectWidget } from "../../clay/widgets/SelectWidget";
import { SwitchWidget } from "../../clay/widgets/SwitchWidget";
import { TagsWidget } from "../../clay/widgets/tags-widget";
import { CAMPAIGN_META } from "../campaign/table";
import { COMPANY_META } from "../company/table";
import { useUser } from "../state";
import { CONTENT_AREA } from "../styles";
import {
    ROLE_ESTIMATOR,
    ROLE_SERVICE_REPRESENTATIVE,
    User,
    USER_META,
} from "../user/table";
import LockedWidget from "./locked/LockedWidget.widget";
import ProjectDescriptionCategoryWidget from "./projectDescriptionDetail/ProjectDescriptionCategoryWidget.widget";
import QualityRfqWidget from "./qualityRFQ/QualityRfqWidget.widget";
import QuoteSourceWidget from "./quoteSource/QuoteSourceWidget.widget";
import { calcProjectHasThirdPartyTender, Project, PROJECT_META } from "./table";
import { ThirdPartySpecifierLinkWidget } from "./types/link";

export type Data = Project;
export const Fields = {
    source: QuoteSourceWidget,
    nextMeetingDate: OptionalFormField(DateWidget),
    qualityRFQ: Optional(QualityRfqWidget),
    customersRequest: LockedWidget,
    additionalCustomersRequests: ListWidget(LockedWidget, {
        emptyOk: true,
    }),
    specialInstructions: Optional(LockedWidget),
    thirdPartySpecifierInvolved: FormField(ThirdPartySpecifierLinkWidget),
    projectDescription: FormField(ProjectDescriptionCategoryWidget),
    tags: OptionalFormField(TagsWidget),
    campaign: OptionalFormField(
        SelectLinkWidget({
            meta: CAMPAIGN_META,
            label: (campaign) => campaign.name,
        })
    ),
    hazmatSurveyAvailable: FormField(
        SelectWidget([
            {
                value: "" as const,
                label: "N/A",
            },
            {
                value: "yes" as const,
                label: "Yes",
            },
            {
                value: "no" as const,
                label: "No",
            },
            {
                value: "unknown" as const,
                label: "Unknown",
            },
        ])
    ),
    hazmatSurveyOnFile: FormField(SwitchWidget),
};

function validate(data: Project, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);
    return errors.filter(
        (error) =>
            error.field !== "hazmatSurveyAvailable" ||
            data.yearConstructed.lessThan(1990)
    );
}

type Context = PageContext;

export function actionSetQuoteRequestDate(
    state: State,
    data: Project,
    user: Link<User>,
    serviceRepresentative: Link<User>,
    self: User
) {
    if (!data.quoteRequestDate) {
        const personnel = [...data.personnel];
        if (serviceRepresentative) {
            personnel.push({
                role: ROLE_SERVICE_REPRESENTATIVE,
                user: serviceRepresentative,
                assignedBy: null,
                assignedDate: new Date(),
                accepted: true,
                acceptedDate: new Date(),
            });
        }

        if (self.roles.indexOf(ROLE_ESTIMATOR) !== -1) {
            personnel.push({
                role: ROLE_ESTIMATOR,
                user: self.id.uuid,
                assignedBy: null,
                assignedDate: new Date(),
                accepted: true,
                acceptedDate: new Date(),
            });
        }

        return {
            state,
            data: {
                ...data,
                quoteRequestDate: new Date(),
                quoteRequestCompletedBy: user,
                personnel,
            },
        };
    } else {
        return { state, data };
    }
}

function Component(props: Props) {
    const user = useUser();
    const self = useQuickRecord(USER_META, user.id);
    const cache = useQuickCache();
    for (const billingContact of props.data.billingContacts) {
        cache.get(COMPANY_META, billingContact.company.company);
    }

    const setQuoteRequestDate = React.useCallback(() => {
        props.dispatch({
            type: "SET_QUOTE_REQUEST_DATE",
            user: user.id,
            self: self!,
            serviceRepresentative:
                props.data.billingContacts
                    .map(
                        (contact) =>
                            cache.get(COMPANY_META, contact.company.company)
                                ?.serviceRepresentative
                    )
                    .filter((x) => x)[0] || null,
        });
    }, [props.dispatch, user.id, cache, props.data.billingContacts]);

    const campaigns =
        useRecordQuery(
            CAMPAIGN_META,
            {
                filters: [
                    {
                        column: "contacts.contact",
                        filter: {
                            intersects: [
                                ...props.data.contacts.map(
                                    (contact) => contact.contact
                                ),
                                ...props.data.billingContacts.map(
                                    (contact) => contact.contact
                                ),
                            ],
                        },
                    },
                    {
                        column: "startDate",
                        filter: {
                            lesser: new LocalDate(new Date()).toString(),
                        },
                    },
                ],
            },
            [props.data.contacts, props.data.billingContacts]
        ) || [];

    return (
        <>
            <div {...CONTENT_AREA}>
                <FieldRow>
                    <widgets.source />
                    <widgets.nextMeetingDate />
                </FieldRow>
                <FieldRow>
                    <widgets.projectDescription label="Project Category" />
                    <widgets.thirdPartySpecifierInvolved label="Third-Party Specifier Involved?" />
                </FieldRow>
                <FieldRow>
                    <widgets.hazmatSurveyAvailable />
                    <widgets.hazmatSurveyOnFile />
                </FieldRow>
                <widgets.campaign records={campaigns} clearable />
                <widgets.customersRequest label="Client's Request" />
                <div style={{ marginBottom: "1em" }}>
                    <widgets.additionalCustomersRequests addButtonText="Additional Notes" />
                </div>
                <widgets.tags />
                <widgets.specialInstructions />
                <widgets.qualityRFQ />
            </div>
            {!calcProjectHasThirdPartyTender(props.data) && (
                <SaveButton
                    label="Generate RFQ"
                    preSave={setQuoteRequestDate}
                    printTemplate="quoteRequest"
                />
            )}
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type SubContext = WidgetContext<typeof Fields.source> &
    WidgetContext<typeof Fields.nextMeetingDate> &
    WidgetContext<typeof Fields.qualityRFQ> &
    WidgetContext<typeof Fields.customersRequest> &
    WidgetContext<typeof Fields.additionalCustomersRequests> &
    WidgetContext<typeof Fields.specialInstructions> &
    WidgetContext<typeof Fields.thirdPartySpecifierInvolved> &
    WidgetContext<typeof Fields.projectDescription> &
    WidgetContext<typeof Fields.tags> &
    WidgetContext<typeof Fields.campaign> &
    WidgetContext<typeof Fields.hazmatSurveyAvailable> &
    WidgetContext<typeof Fields.hazmatSurveyOnFile>;
type ExtraProps = {};
type BaseState = {
    source: WidgetState<typeof Fields.source>;
    nextMeetingDate: WidgetState<typeof Fields.nextMeetingDate>;
    qualityRFQ: WidgetState<typeof Fields.qualityRFQ>;
    customersRequest: WidgetState<typeof Fields.customersRequest>;
    additionalCustomersRequests: WidgetState<
        typeof Fields.additionalCustomersRequests
    >;
    specialInstructions: WidgetState<typeof Fields.specialInstructions>;
    thirdPartySpecifierInvolved: WidgetState<
        typeof Fields.thirdPartySpecifierInvolved
    >;
    projectDescription: WidgetState<typeof Fields.projectDescription>;
    tags: WidgetState<typeof Fields.tags>;
    campaign: WidgetState<typeof Fields.campaign>;
    hazmatSurveyAvailable: WidgetState<typeof Fields.hazmatSurveyAvailable>;
    hazmatSurveyOnFile: WidgetState<typeof Fields.hazmatSurveyOnFile>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "SOURCE"; action: WidgetAction<typeof Fields.source> }
    | {
          type: "NEXT_MEETING_DATE";
          action: WidgetAction<typeof Fields.nextMeetingDate>;
      }
    | { type: "QUALITY_RFQ"; action: WidgetAction<typeof Fields.qualityRFQ> }
    | {
          type: "CUSTOMERS_REQUEST";
          action: WidgetAction<typeof Fields.customersRequest>;
      }
    | {
          type: "ADDITIONAL_CUSTOMERS_REQUESTS";
          action: WidgetAction<typeof Fields.additionalCustomersRequests>;
      }
    | {
          type: "SPECIAL_INSTRUCTIONS";
          action: WidgetAction<typeof Fields.specialInstructions>;
      }
    | {
          type: "THIRD_PARTY_SPECIFIER_INVOLVED";
          action: WidgetAction<typeof Fields.thirdPartySpecifierInvolved>;
      }
    | {
          type: "PROJECT_DESCRIPTION";
          action: WidgetAction<typeof Fields.projectDescription>;
      }
    | { type: "TAGS"; action: WidgetAction<typeof Fields.tags> }
    | { type: "CAMPAIGN"; action: WidgetAction<typeof Fields.campaign> }
    | {
          type: "HAZMAT_SURVEY_AVAILABLE";
          action: WidgetAction<typeof Fields.hazmatSurveyAvailable>;
      }
    | {
          type: "HAZMAT_SURVEY_ON_FILE";
          action: WidgetAction<typeof Fields.hazmatSurveyOnFile>;
      }
    | {
          type: "SET_QUOTE_REQUEST_DATE";
          user: Link<User>;
          serviceRepresentative: Link<User>;
          self: User;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.source, data.source, cache, "source", errors);
    subvalidate(
        Fields.nextMeetingDate,
        data.nextMeetingDate,
        cache,
        "nextMeetingDate",
        errors
    );
    subvalidate(
        Fields.qualityRFQ,
        data.qualityRFQ,
        cache,
        "qualityRFQ",
        errors
    );
    subvalidate(
        Fields.customersRequest,
        data.customersRequest,
        cache,
        "customersRequest",
        errors
    );
    subvalidate(
        Fields.additionalCustomersRequests,
        data.additionalCustomersRequests,
        cache,
        "additionalCustomersRequests",
        errors
    );
    subvalidate(
        Fields.specialInstructions,
        data.specialInstructions,
        cache,
        "specialInstructions",
        errors
    );
    subvalidate(
        Fields.thirdPartySpecifierInvolved,
        data.thirdPartySpecifierInvolved,
        cache,
        "thirdPartySpecifierInvolved",
        errors
    );
    subvalidate(
        Fields.projectDescription,
        data.projectDescription,
        cache,
        "projectDescription",
        errors
    );
    subvalidate(Fields.tags, data.tags, cache, "tags", errors);
    subvalidate(Fields.campaign, data.campaign, cache, "campaign", errors);
    subvalidate(
        Fields.hazmatSurveyAvailable,
        data.hazmatSurveyAvailable,
        cache,
        "hazmatSurveyAvailable",
        errors
    );
    subvalidate(
        Fields.hazmatSurveyOnFile,
        data.hazmatSurveyOnFile,
        cache,
        "hazmatSurveyOnFile",
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
        case "SOURCE": {
            const inner = Fields.source.reduce(
                state.source,
                data.source,
                action.action,
                subcontext
            );
            return {
                state: { ...state, source: inner.state },
                data: { ...data, source: inner.data },
            };
        }
        case "NEXT_MEETING_DATE": {
            const inner = Fields.nextMeetingDate.reduce(
                state.nextMeetingDate,
                data.nextMeetingDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, nextMeetingDate: inner.state },
                data: { ...data, nextMeetingDate: inner.data },
            };
        }
        case "QUALITY_RFQ": {
            const inner = Fields.qualityRFQ.reduce(
                state.qualityRFQ,
                data.qualityRFQ,
                action.action,
                subcontext
            );
            return {
                state: { ...state, qualityRFQ: inner.state },
                data: { ...data, qualityRFQ: inner.data },
            };
        }
        case "CUSTOMERS_REQUEST": {
            const inner = Fields.customersRequest.reduce(
                state.customersRequest,
                data.customersRequest,
                action.action,
                subcontext
            );
            return {
                state: { ...state, customersRequest: inner.state },
                data: { ...data, customersRequest: inner.data },
            };
        }
        case "ADDITIONAL_CUSTOMERS_REQUESTS": {
            const inner = Fields.additionalCustomersRequests.reduce(
                state.additionalCustomersRequests,
                data.additionalCustomersRequests,
                action.action,
                subcontext
            );
            return {
                state: { ...state, additionalCustomersRequests: inner.state },
                data: { ...data, additionalCustomersRequests: inner.data },
            };
        }
        case "SPECIAL_INSTRUCTIONS": {
            const inner = Fields.specialInstructions.reduce(
                state.specialInstructions,
                data.specialInstructions,
                action.action,
                subcontext
            );
            return {
                state: { ...state, specialInstructions: inner.state },
                data: { ...data, specialInstructions: inner.data },
            };
        }
        case "THIRD_PARTY_SPECIFIER_INVOLVED": {
            const inner = Fields.thirdPartySpecifierInvolved.reduce(
                state.thirdPartySpecifierInvolved,
                data.thirdPartySpecifierInvolved,
                action.action,
                subcontext
            );
            return {
                state: { ...state, thirdPartySpecifierInvolved: inner.state },
                data: { ...data, thirdPartySpecifierInvolved: inner.data },
            };
        }
        case "PROJECT_DESCRIPTION": {
            const inner = Fields.projectDescription.reduce(
                state.projectDescription,
                data.projectDescription,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectDescription: inner.state },
                data: { ...data, projectDescription: inner.data },
            };
        }
        case "TAGS": {
            const inner = Fields.tags.reduce(
                state.tags,
                data.tags,
                action.action,
                subcontext
            );
            return {
                state: { ...state, tags: inner.state },
                data: { ...data, tags: inner.data },
            };
        }
        case "CAMPAIGN": {
            const inner = Fields.campaign.reduce(
                state.campaign,
                data.campaign,
                action.action,
                subcontext
            );
            return {
                state: { ...state, campaign: inner.state },
                data: { ...data, campaign: inner.data },
            };
        }
        case "HAZMAT_SURVEY_AVAILABLE": {
            const inner = Fields.hazmatSurveyAvailable.reduce(
                state.hazmatSurveyAvailable,
                data.hazmatSurveyAvailable,
                action.action,
                subcontext
            );
            return {
                state: { ...state, hazmatSurveyAvailable: inner.state },
                data: { ...data, hazmatSurveyAvailable: inner.data },
            };
        }
        case "HAZMAT_SURVEY_ON_FILE": {
            const inner = Fields.hazmatSurveyOnFile.reduce(
                state.hazmatSurveyOnFile,
                data.hazmatSurveyOnFile,
                action.action,
                subcontext
            );
            return {
                state: { ...state, hazmatSurveyOnFile: inner.state },
                data: { ...data, hazmatSurveyOnFile: inner.data },
            };
        }
        case "SET_QUOTE_REQUEST_DATE":
            return actionSetQuoteRequestDate(
                state,
                data,
                action.user,
                action.serviceRepresentative,
                action.self
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
    source: function (
        props: WidgetExtraProps<typeof Fields.source> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SOURCE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "source", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.source.component
                state={context.state.source}
                data={context.data.source}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Source"}
            />
        );
    },
    nextMeetingDate: function (
        props: WidgetExtraProps<typeof Fields.nextMeetingDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "NEXT_MEETING_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "nextMeetingDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.nextMeetingDate.component
                state={context.state.nextMeetingDate}
                data={context.data.nextMeetingDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Next Meeting Date"}
            />
        );
    },
    qualityRFQ: function (
        props: WidgetExtraProps<typeof Fields.qualityRFQ> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "QUALITY_RFQ",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "qualityRFQ", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.qualityRFQ.component
                state={context.state.qualityRFQ}
                data={context.data.qualityRFQ}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Quality Rfq"}
            />
        );
    },
    customersRequest: function (
        props: WidgetExtraProps<typeof Fields.customersRequest> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CUSTOMERS_REQUEST",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "customersRequest", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.customersRequest.component
                state={context.state.customersRequest}
                data={context.data.customersRequest}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Customers Request"}
            />
        );
    },
    additionalCustomersRequests: function (
        props: WidgetExtraProps<typeof Fields.additionalCustomersRequests> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ADDITIONAL_CUSTOMERS_REQUESTS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "additionalCustomersRequests",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.additionalCustomersRequests.component
                state={context.state.additionalCustomersRequests}
                data={context.data.additionalCustomersRequests}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Additional Customers Requests"}
            />
        );
    },
    specialInstructions: function (
        props: WidgetExtraProps<typeof Fields.specialInstructions> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SPECIAL_INSTRUCTIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "specialInstructions",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.specialInstructions.component
                state={context.state.specialInstructions}
                data={context.data.specialInstructions}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Special Instructions"}
            />
        );
    },
    thirdPartySpecifierInvolved: function (
        props: WidgetExtraProps<typeof Fields.thirdPartySpecifierInvolved> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "THIRD_PARTY_SPECIFIER_INVOLVED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "thirdPartySpecifierInvolved",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.thirdPartySpecifierInvolved.component
                state={context.state.thirdPartySpecifierInvolved}
                data={context.data.thirdPartySpecifierInvolved}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Third Party Specifier Involved"}
            />
        );
    },
    projectDescription: function (
        props: WidgetExtraProps<typeof Fields.projectDescription> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_DESCRIPTION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "projectDescription",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectDescription.component
                state={context.state.projectDescription}
                data={context.data.projectDescription}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Description"}
            />
        );
    },
    tags: function (
        props: WidgetExtraProps<typeof Fields.tags> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "TAGS", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "tags", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.tags.component
                state={context.state.tags}
                data={context.data.tags}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Tags"}
            />
        );
    },
    campaign: function (
        props: WidgetExtraProps<typeof Fields.campaign> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CAMPAIGN",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "campaign", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.campaign.component
                state={context.state.campaign}
                data={context.data.campaign}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Campaign"}
            />
        );
    },
    hazmatSurveyAvailable: function (
        props: WidgetExtraProps<typeof Fields.hazmatSurveyAvailable> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "HAZMAT_SURVEY_AVAILABLE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "hazmatSurveyAvailable",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.hazmatSurveyAvailable.component
                state={context.state.hazmatSurveyAvailable}
                data={context.data.hazmatSurveyAvailable}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Hazmat Survey Available"}
            />
        );
    },
    hazmatSurveyOnFile: function (
        props: WidgetExtraProps<typeof Fields.hazmatSurveyOnFile> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "HAZMAT_SURVEY_ON_FILE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "hazmatSurveyOnFile",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.hazmatSurveyOnFile.component
                state={context.state.hazmatSurveyOnFile}
                data={context.data.hazmatSurveyOnFile}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Hazmat Survey on File"}
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
        let sourceState;
        {
            const inner = Fields.source.initialize(
                data.source,
                subcontext,
                subparameters.source
            );
            sourceState = inner.state;
            data = { ...data, source: inner.data };
        }
        let nextMeetingDateState;
        {
            const inner = Fields.nextMeetingDate.initialize(
                data.nextMeetingDate,
                subcontext,
                subparameters.nextMeetingDate
            );
            nextMeetingDateState = inner.state;
            data = { ...data, nextMeetingDate: inner.data };
        }
        let qualityRFQState;
        {
            const inner = Fields.qualityRFQ.initialize(
                data.qualityRFQ,
                subcontext,
                subparameters.qualityRFQ
            );
            qualityRFQState = inner.state;
            data = { ...data, qualityRFQ: inner.data };
        }
        let customersRequestState;
        {
            const inner = Fields.customersRequest.initialize(
                data.customersRequest,
                subcontext,
                subparameters.customersRequest
            );
            customersRequestState = inner.state;
            data = { ...data, customersRequest: inner.data };
        }
        let additionalCustomersRequestsState;
        {
            const inner = Fields.additionalCustomersRequests.initialize(
                data.additionalCustomersRequests,
                subcontext,
                subparameters.additionalCustomersRequests
            );
            additionalCustomersRequestsState = inner.state;
            data = { ...data, additionalCustomersRequests: inner.data };
        }
        let specialInstructionsState;
        {
            const inner = Fields.specialInstructions.initialize(
                data.specialInstructions,
                subcontext,
                subparameters.specialInstructions
            );
            specialInstructionsState = inner.state;
            data = { ...data, specialInstructions: inner.data };
        }
        let thirdPartySpecifierInvolvedState;
        {
            const inner = Fields.thirdPartySpecifierInvolved.initialize(
                data.thirdPartySpecifierInvolved,
                subcontext,
                subparameters.thirdPartySpecifierInvolved
            );
            thirdPartySpecifierInvolvedState = inner.state;
            data = { ...data, thirdPartySpecifierInvolved: inner.data };
        }
        let projectDescriptionState;
        {
            const inner = Fields.projectDescription.initialize(
                data.projectDescription,
                subcontext,
                subparameters.projectDescription
            );
            projectDescriptionState = inner.state;
            data = { ...data, projectDescription: inner.data };
        }
        let tagsState;
        {
            const inner = Fields.tags.initialize(
                data.tags,
                subcontext,
                subparameters.tags
            );
            tagsState = inner.state;
            data = { ...data, tags: inner.data };
        }
        let campaignState;
        {
            const inner = Fields.campaign.initialize(
                data.campaign,
                subcontext,
                subparameters.campaign
            );
            campaignState = inner.state;
            data = { ...data, campaign: inner.data };
        }
        let hazmatSurveyAvailableState;
        {
            const inner = Fields.hazmatSurveyAvailable.initialize(
                data.hazmatSurveyAvailable,
                subcontext,
                subparameters.hazmatSurveyAvailable
            );
            hazmatSurveyAvailableState = inner.state;
            data = { ...data, hazmatSurveyAvailable: inner.data };
        }
        let hazmatSurveyOnFileState;
        {
            const inner = Fields.hazmatSurveyOnFile.initialize(
                data.hazmatSurveyOnFile,
                subcontext,
                subparameters.hazmatSurveyOnFile
            );
            hazmatSurveyOnFileState = inner.state;
            data = { ...data, hazmatSurveyOnFile: inner.data };
        }
        let state = {
            initialParameters: parameters,
            source: sourceState,
            nextMeetingDate: nextMeetingDateState,
            qualityRFQ: qualityRFQState,
            customersRequest: customersRequestState,
            additionalCustomersRequests: additionalCustomersRequestsState,
            specialInstructions: specialInstructionsState,
            thirdPartySpecifierInvolved: thirdPartySpecifierInvolvedState,
            projectDescription: projectDescriptionState,
            tags: tagsState,
            campaign: campaignState,
            hazmatSurveyAvailable: hazmatSurveyAvailableState,
            hazmatSurveyOnFile: hazmatSurveyOnFileState,
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
    source: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.source>
    >;
    nextMeetingDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.nextMeetingDate>
    >;
    qualityRFQ: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.qualityRFQ>
    >;
    customersRequest: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.customersRequest>
    >;
    additionalCustomersRequests: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.additionalCustomersRequests>
    >;
    specialInstructions: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.specialInstructions>
    >;
    thirdPartySpecifierInvolved: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.thirdPartySpecifierInvolved>
    >;
    projectDescription: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectDescription>
    >;
    tags: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.tags>
    >;
    campaign: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.campaign>
    >;
    hazmatSurveyAvailable: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.hazmatSurveyAvailable>
    >;
    hazmatSurveyOnFile: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.hazmatSurveyOnFile>
    >;
};
// END MAGIC -- DO NOT EDIT
