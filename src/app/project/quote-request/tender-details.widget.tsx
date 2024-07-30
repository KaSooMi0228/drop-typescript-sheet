import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { Link } from "../../../clay/link";
import { PageContext } from "../../../clay/Page";
import { propCheck } from "../../../clay/propCheck";
import {
    QuickCacheApi,
    useQuickCache,
    useQuickRecord,
} from "../../../clay/quick-cache";
import { SaveButton } from "../../../clay/save-button";
import {
    FormField,
    FormWrapper,
    OptionalFormField,
} from "../../../clay/widgets/FormField";
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
} from "../../../clay/widgets/index";
import { ListWidget } from "../../../clay/widgets/ListWidget";
import { TextAreaWidget } from "../../../clay/widgets/TextAreaWidget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { COMPANY_META } from "../../company/table";
import { useUser } from "../../state";
import { CONTENT_AREA, TABLE_STYLE } from "../../styles";
import {
    ROLE_ESTIMATOR,
    ROLE_SERVICE_REPRESENTATIVE,
    User,
    USER_META,
} from "../../user/table";
import { Project, PROJECT_META } from "../table";

import { Table } from "react-bootstrap";
import { DateTimeWidget } from "../../../clay/widgets/DateTimeWidget";
import { DateWidget } from "../../../clay/widgets/DateWidget";
import { FieldRow } from "../../../clay/widgets/layout";
import { MoneyWidget } from "../../../clay/widgets/money-widget";
import { PercentageWidget } from "../../../clay/widgets/percentage-widget";
import { SelectWidget } from "../../../clay/widgets/SelectWidget";
import { SwitchWidget } from "../../../clay/widgets/SwitchWidget";
import { TextSuggestionWidget } from "../../../clay/widgets/text-suggestions-widget";
import CompetitorMiniWidget from "../CompetitorMiniWidget.widget";

export type Data = Project;
export const Fields = {
    projectNameOrNumber: FormField(TextWidget),
    tenderDetailsProjectDetails: FormField(TextAreaWidget),
    competitors: ListWidget(CompetitorMiniWidget, { emptyOk: true }),
    tenderDue: FormField(DateTimeWidget),
    tenderDeliveryMethod: FormField(
        SelectWidget([
            {
                value: "email" as const,
                label: "Email",
            },
            {
                value: "hard-copy" as const,
                label: "Hard Copy",
            },
        ])
    ),
    tenderAcceptancePeriod: FormField(TextSuggestionWidget),
    bidBondRequired: FormField(SwitchWidget),
    bidBondType: FormField(
        SelectWidget([
            {
                value: "physical" as const,
                label: "Physical",
            },
            {
                label: "Electronic",
                value: "electronic" as const,
            },
        ])
    ),
    bidBidAmount: FormField(PercentageWidget),
    consentOfSurety: FormField(SwitchWidget),
    tenderEstimatedContractPrice: OptionalFormField(MoneyWidget),
    tenderEstimatedStartDate: OptionalFormField(DateWidget),
    tenderEstimatedCompletionDate: OptionalFormField(DateWidget),
};

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

    return (
        <>
            <div {...CONTENT_AREA}>
                <widgets.projectNameOrNumber />
                <widgets.tenderDetailsProjectDetails label="Project Details" />

                <FormWrapper label="Competitors">
                    <Table {...TABLE_STYLE}>
                        <widgets.competitors
                            containerClass="tbody"
                            addButtonText="Add Competitor"
                        />
                    </Table>
                </FormWrapper>
                <FieldRow>
                    <widgets.tenderDue />
                    <widgets.tenderDeliveryMethod label="Delivery Method" />
                </FieldRow>
                <widgets.bidBondRequired />
                <widgets.bidBondType label="Bond Type" />
                <widgets.bidBidAmount />
                <widgets.consentOfSurety />
                <widgets.tenderAcceptancePeriod
                    label="Acceptance Period"
                    suggestions={["30 days", "45 days", "60 days", "90 days"]}
                />
                <widgets.tenderEstimatedContractPrice label="Estimated Contract Price" />
                <widgets.tenderEstimatedStartDate label="Estimated Start Date" />
                <widgets.tenderEstimatedCompletionDate label="Estimated Completion Date" />
            </div>
            <SaveButton
                label="Generate RFQ"
                preSave={setQuoteRequestDate}
                printTemplate="quoteRequest"
            />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type SubContext = WidgetContext<typeof Fields.projectNameOrNumber> &
    WidgetContext<typeof Fields.tenderDetailsProjectDetails> &
    WidgetContext<typeof Fields.competitors> &
    WidgetContext<typeof Fields.tenderDue> &
    WidgetContext<typeof Fields.tenderDeliveryMethod> &
    WidgetContext<typeof Fields.tenderAcceptancePeriod> &
    WidgetContext<typeof Fields.bidBondRequired> &
    WidgetContext<typeof Fields.bidBondType> &
    WidgetContext<typeof Fields.bidBidAmount> &
    WidgetContext<typeof Fields.consentOfSurety> &
    WidgetContext<typeof Fields.tenderEstimatedContractPrice> &
    WidgetContext<typeof Fields.tenderEstimatedStartDate> &
    WidgetContext<typeof Fields.tenderEstimatedCompletionDate>;
type ExtraProps = {};
type BaseState = {
    projectNameOrNumber: WidgetState<typeof Fields.projectNameOrNumber>;
    tenderDetailsProjectDetails: WidgetState<
        typeof Fields.tenderDetailsProjectDetails
    >;
    competitors: WidgetState<typeof Fields.competitors>;
    tenderDue: WidgetState<typeof Fields.tenderDue>;
    tenderDeliveryMethod: WidgetState<typeof Fields.tenderDeliveryMethod>;
    tenderAcceptancePeriod: WidgetState<typeof Fields.tenderAcceptancePeriod>;
    bidBondRequired: WidgetState<typeof Fields.bidBondRequired>;
    bidBondType: WidgetState<typeof Fields.bidBondType>;
    bidBidAmount: WidgetState<typeof Fields.bidBidAmount>;
    consentOfSurety: WidgetState<typeof Fields.consentOfSurety>;
    tenderEstimatedContractPrice: WidgetState<
        typeof Fields.tenderEstimatedContractPrice
    >;
    tenderEstimatedStartDate: WidgetState<
        typeof Fields.tenderEstimatedStartDate
    >;
    tenderEstimatedCompletionDate: WidgetState<
        typeof Fields.tenderEstimatedCompletionDate
    >;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "PROJECT_NAME_OR_NUMBER";
          action: WidgetAction<typeof Fields.projectNameOrNumber>;
      }
    | {
          type: "TENDER_DETAILS_PROJECT_DETAILS";
          action: WidgetAction<typeof Fields.tenderDetailsProjectDetails>;
      }
    | { type: "COMPETITORS"; action: WidgetAction<typeof Fields.competitors> }
    | { type: "TENDER_DUE"; action: WidgetAction<typeof Fields.tenderDue> }
    | {
          type: "TENDER_DELIVERY_METHOD";
          action: WidgetAction<typeof Fields.tenderDeliveryMethod>;
      }
    | {
          type: "TENDER_ACCEPTANCE_PERIOD";
          action: WidgetAction<typeof Fields.tenderAcceptancePeriod>;
      }
    | {
          type: "BID_BOND_REQUIRED";
          action: WidgetAction<typeof Fields.bidBondRequired>;
      }
    | { type: "BID_BOND_TYPE"; action: WidgetAction<typeof Fields.bidBondType> }
    | {
          type: "BID_BID_AMOUNT";
          action: WidgetAction<typeof Fields.bidBidAmount>;
      }
    | {
          type: "CONSENT_OF_SURETY";
          action: WidgetAction<typeof Fields.consentOfSurety>;
      }
    | {
          type: "TENDER_ESTIMATED_CONTRACT_PRICE";
          action: WidgetAction<typeof Fields.tenderEstimatedContractPrice>;
      }
    | {
          type: "TENDER_ESTIMATED_START_DATE";
          action: WidgetAction<typeof Fields.tenderEstimatedStartDate>;
      }
    | {
          type: "TENDER_ESTIMATED_COMPLETION_DATE";
          action: WidgetAction<typeof Fields.tenderEstimatedCompletionDate>;
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
    subvalidate(
        Fields.projectNameOrNumber,
        data.projectNameOrNumber,
        cache,
        "projectNameOrNumber",
        errors
    );
    subvalidate(
        Fields.tenderDetailsProjectDetails,
        data.tenderDetailsProjectDetails,
        cache,
        "tenderDetailsProjectDetails",
        errors
    );
    subvalidate(
        Fields.competitors,
        data.competitors,
        cache,
        "competitors",
        errors
    );
    subvalidate(Fields.tenderDue, data.tenderDue, cache, "tenderDue", errors);
    subvalidate(
        Fields.tenderDeliveryMethod,
        data.tenderDeliveryMethod,
        cache,
        "tenderDeliveryMethod",
        errors
    );
    subvalidate(
        Fields.tenderAcceptancePeriod,
        data.tenderAcceptancePeriod,
        cache,
        "tenderAcceptancePeriod",
        errors
    );
    subvalidate(
        Fields.bidBondRequired,
        data.bidBondRequired,
        cache,
        "bidBondRequired",
        errors
    );
    subvalidate(
        Fields.bidBondType,
        data.bidBondType,
        cache,
        "bidBondType",
        errors
    );
    subvalidate(
        Fields.bidBidAmount,
        data.bidBidAmount,
        cache,
        "bidBidAmount",
        errors
    );
    subvalidate(
        Fields.consentOfSurety,
        data.consentOfSurety,
        cache,
        "consentOfSurety",
        errors
    );
    subvalidate(
        Fields.tenderEstimatedContractPrice,
        data.tenderEstimatedContractPrice,
        cache,
        "tenderEstimatedContractPrice",
        errors
    );
    subvalidate(
        Fields.tenderEstimatedStartDate,
        data.tenderEstimatedStartDate,
        cache,
        "tenderEstimatedStartDate",
        errors
    );
    subvalidate(
        Fields.tenderEstimatedCompletionDate,
        data.tenderEstimatedCompletionDate,
        cache,
        "tenderEstimatedCompletionDate",
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
        case "TENDER_DETAILS_PROJECT_DETAILS": {
            const inner = Fields.tenderDetailsProjectDetails.reduce(
                state.tenderDetailsProjectDetails,
                data.tenderDetailsProjectDetails,
                action.action,
                subcontext
            );
            return {
                state: { ...state, tenderDetailsProjectDetails: inner.state },
                data: { ...data, tenderDetailsProjectDetails: inner.data },
            };
        }
        case "COMPETITORS": {
            const inner = Fields.competitors.reduce(
                state.competitors,
                data.competitors,
                action.action,
                subcontext
            );
            return {
                state: { ...state, competitors: inner.state },
                data: { ...data, competitors: inner.data },
            };
        }
        case "TENDER_DUE": {
            const inner = Fields.tenderDue.reduce(
                state.tenderDue,
                data.tenderDue,
                action.action,
                subcontext
            );
            return {
                state: { ...state, tenderDue: inner.state },
                data: { ...data, tenderDue: inner.data },
            };
        }
        case "TENDER_DELIVERY_METHOD": {
            const inner = Fields.tenderDeliveryMethod.reduce(
                state.tenderDeliveryMethod,
                data.tenderDeliveryMethod,
                action.action,
                subcontext
            );
            return {
                state: { ...state, tenderDeliveryMethod: inner.state },
                data: { ...data, tenderDeliveryMethod: inner.data },
            };
        }
        case "TENDER_ACCEPTANCE_PERIOD": {
            const inner = Fields.tenderAcceptancePeriod.reduce(
                state.tenderAcceptancePeriod,
                data.tenderAcceptancePeriod,
                action.action,
                subcontext
            );
            return {
                state: { ...state, tenderAcceptancePeriod: inner.state },
                data: { ...data, tenderAcceptancePeriod: inner.data },
            };
        }
        case "BID_BOND_REQUIRED": {
            const inner = Fields.bidBondRequired.reduce(
                state.bidBondRequired,
                data.bidBondRequired,
                action.action,
                subcontext
            );
            return {
                state: { ...state, bidBondRequired: inner.state },
                data: { ...data, bidBondRequired: inner.data },
            };
        }
        case "BID_BOND_TYPE": {
            const inner = Fields.bidBondType.reduce(
                state.bidBondType,
                data.bidBondType,
                action.action,
                subcontext
            );
            return {
                state: { ...state, bidBondType: inner.state },
                data: { ...data, bidBondType: inner.data },
            };
        }
        case "BID_BID_AMOUNT": {
            const inner = Fields.bidBidAmount.reduce(
                state.bidBidAmount,
                data.bidBidAmount,
                action.action,
                subcontext
            );
            return {
                state: { ...state, bidBidAmount: inner.state },
                data: { ...data, bidBidAmount: inner.data },
            };
        }
        case "CONSENT_OF_SURETY": {
            const inner = Fields.consentOfSurety.reduce(
                state.consentOfSurety,
                data.consentOfSurety,
                action.action,
                subcontext
            );
            return {
                state: { ...state, consentOfSurety: inner.state },
                data: { ...data, consentOfSurety: inner.data },
            };
        }
        case "TENDER_ESTIMATED_CONTRACT_PRICE": {
            const inner = Fields.tenderEstimatedContractPrice.reduce(
                state.tenderEstimatedContractPrice,
                data.tenderEstimatedContractPrice,
                action.action,
                subcontext
            );
            return {
                state: { ...state, tenderEstimatedContractPrice: inner.state },
                data: { ...data, tenderEstimatedContractPrice: inner.data },
            };
        }
        case "TENDER_ESTIMATED_START_DATE": {
            const inner = Fields.tenderEstimatedStartDate.reduce(
                state.tenderEstimatedStartDate,
                data.tenderEstimatedStartDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, tenderEstimatedStartDate: inner.state },
                data: { ...data, tenderEstimatedStartDate: inner.data },
            };
        }
        case "TENDER_ESTIMATED_COMPLETION_DATE": {
            const inner = Fields.tenderEstimatedCompletionDate.reduce(
                state.tenderEstimatedCompletionDate,
                data.tenderEstimatedCompletionDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, tenderEstimatedCompletionDate: inner.state },
                data: { ...data, tenderEstimatedCompletionDate: inner.data },
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
    tenderDetailsProjectDetails: function (
        props: WidgetExtraProps<typeof Fields.tenderDetailsProjectDetails> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "TENDER_DETAILS_PROJECT_DETAILS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "tenderDetailsProjectDetails",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.tenderDetailsProjectDetails.component
                state={context.state.tenderDetailsProjectDetails}
                data={context.data.tenderDetailsProjectDetails}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Tender Details Project Details"}
            />
        );
    },
    competitors: function (
        props: WidgetExtraProps<typeof Fields.competitors> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMPETITORS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "competitors", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.competitors.component
                state={context.state.competitors}
                data={context.data.competitors}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Competitors"}
            />
        );
    },
    tenderDue: function (
        props: WidgetExtraProps<typeof Fields.tenderDue> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "TENDER_DUE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "tenderDue", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.tenderDue.component
                state={context.state.tenderDue}
                data={context.data.tenderDue}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Tender Due"}
            />
        );
    },
    tenderDeliveryMethod: function (
        props: WidgetExtraProps<typeof Fields.tenderDeliveryMethod> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "TENDER_DELIVERY_METHOD",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "tenderDeliveryMethod",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.tenderDeliveryMethod.component
                state={context.state.tenderDeliveryMethod}
                data={context.data.tenderDeliveryMethod}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Tender Delivery Method"}
            />
        );
    },
    tenderAcceptancePeriod: function (
        props: WidgetExtraProps<typeof Fields.tenderAcceptancePeriod> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "TENDER_ACCEPTANCE_PERIOD",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "tenderAcceptancePeriod",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.tenderAcceptancePeriod.component
                state={context.state.tenderAcceptancePeriod}
                data={context.data.tenderAcceptancePeriod}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Tender Acceptance Period"}
            />
        );
    },
    bidBondRequired: function (
        props: WidgetExtraProps<typeof Fields.bidBondRequired> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "BID_BOND_REQUIRED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "bidBondRequired", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.bidBondRequired.component
                state={context.state.bidBondRequired}
                data={context.data.bidBondRequired}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Bid Bond Required"}
            />
        );
    },
    bidBondType: function (
        props: WidgetExtraProps<typeof Fields.bidBondType> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "BID_BOND_TYPE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "bidBondType", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.bidBondType.component
                state={context.state.bidBondType}
                data={context.data.bidBondType}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Bid Bond Type"}
            />
        );
    },
    bidBidAmount: function (
        props: WidgetExtraProps<typeof Fields.bidBidAmount> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "BID_BID_AMOUNT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "bidBidAmount", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.bidBidAmount.component
                state={context.state.bidBidAmount}
                data={context.data.bidBidAmount}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Bid Bid Amount"}
            />
        );
    },
    consentOfSurety: function (
        props: WidgetExtraProps<typeof Fields.consentOfSurety> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONSENT_OF_SURETY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "consentOfSurety", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.consentOfSurety.component
                state={context.state.consentOfSurety}
                data={context.data.consentOfSurety}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Consent of Surety"}
            />
        );
    },
    tenderEstimatedContractPrice: function (
        props: WidgetExtraProps<typeof Fields.tenderEstimatedContractPrice> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "TENDER_ESTIMATED_CONTRACT_PRICE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "tenderEstimatedContractPrice",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.tenderEstimatedContractPrice.component
                state={context.state.tenderEstimatedContractPrice}
                data={context.data.tenderEstimatedContractPrice}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Tender Estimated Contract Price"}
            />
        );
    },
    tenderEstimatedStartDate: function (
        props: WidgetExtraProps<typeof Fields.tenderEstimatedStartDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "TENDER_ESTIMATED_START_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "tenderEstimatedStartDate",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.tenderEstimatedStartDate.component
                state={context.state.tenderEstimatedStartDate}
                data={context.data.tenderEstimatedStartDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Tender Estimated Start Date"}
            />
        );
    },
    tenderEstimatedCompletionDate: function (
        props: WidgetExtraProps<typeof Fields.tenderEstimatedCompletionDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "TENDER_ESTIMATED_COMPLETION_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "tenderEstimatedCompletionDate",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.tenderEstimatedCompletionDate.component
                state={context.state.tenderEstimatedCompletionDate}
                data={context.data.tenderEstimatedCompletionDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Tender Estimated Completion Date"}
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
        let tenderDetailsProjectDetailsState;
        {
            const inner = Fields.tenderDetailsProjectDetails.initialize(
                data.tenderDetailsProjectDetails,
                subcontext,
                subparameters.tenderDetailsProjectDetails
            );
            tenderDetailsProjectDetailsState = inner.state;
            data = { ...data, tenderDetailsProjectDetails: inner.data };
        }
        let competitorsState;
        {
            const inner = Fields.competitors.initialize(
                data.competitors,
                subcontext,
                subparameters.competitors
            );
            competitorsState = inner.state;
            data = { ...data, competitors: inner.data };
        }
        let tenderDueState;
        {
            const inner = Fields.tenderDue.initialize(
                data.tenderDue,
                subcontext,
                subparameters.tenderDue
            );
            tenderDueState = inner.state;
            data = { ...data, tenderDue: inner.data };
        }
        let tenderDeliveryMethodState;
        {
            const inner = Fields.tenderDeliveryMethod.initialize(
                data.tenderDeliveryMethod,
                subcontext,
                subparameters.tenderDeliveryMethod
            );
            tenderDeliveryMethodState = inner.state;
            data = { ...data, tenderDeliveryMethod: inner.data };
        }
        let tenderAcceptancePeriodState;
        {
            const inner = Fields.tenderAcceptancePeriod.initialize(
                data.tenderAcceptancePeriod,
                subcontext,
                subparameters.tenderAcceptancePeriod
            );
            tenderAcceptancePeriodState = inner.state;
            data = { ...data, tenderAcceptancePeriod: inner.data };
        }
        let bidBondRequiredState;
        {
            const inner = Fields.bidBondRequired.initialize(
                data.bidBondRequired,
                subcontext,
                subparameters.bidBondRequired
            );
            bidBondRequiredState = inner.state;
            data = { ...data, bidBondRequired: inner.data };
        }
        let bidBondTypeState;
        {
            const inner = Fields.bidBondType.initialize(
                data.bidBondType,
                subcontext,
                subparameters.bidBondType
            );
            bidBondTypeState = inner.state;
            data = { ...data, bidBondType: inner.data };
        }
        let bidBidAmountState;
        {
            const inner = Fields.bidBidAmount.initialize(
                data.bidBidAmount,
                subcontext,
                subparameters.bidBidAmount
            );
            bidBidAmountState = inner.state;
            data = { ...data, bidBidAmount: inner.data };
        }
        let consentOfSuretyState;
        {
            const inner = Fields.consentOfSurety.initialize(
                data.consentOfSurety,
                subcontext,
                subparameters.consentOfSurety
            );
            consentOfSuretyState = inner.state;
            data = { ...data, consentOfSurety: inner.data };
        }
        let tenderEstimatedContractPriceState;
        {
            const inner = Fields.tenderEstimatedContractPrice.initialize(
                data.tenderEstimatedContractPrice,
                subcontext,
                subparameters.tenderEstimatedContractPrice
            );
            tenderEstimatedContractPriceState = inner.state;
            data = { ...data, tenderEstimatedContractPrice: inner.data };
        }
        let tenderEstimatedStartDateState;
        {
            const inner = Fields.tenderEstimatedStartDate.initialize(
                data.tenderEstimatedStartDate,
                subcontext,
                subparameters.tenderEstimatedStartDate
            );
            tenderEstimatedStartDateState = inner.state;
            data = { ...data, tenderEstimatedStartDate: inner.data };
        }
        let tenderEstimatedCompletionDateState;
        {
            const inner = Fields.tenderEstimatedCompletionDate.initialize(
                data.tenderEstimatedCompletionDate,
                subcontext,
                subparameters.tenderEstimatedCompletionDate
            );
            tenderEstimatedCompletionDateState = inner.state;
            data = { ...data, tenderEstimatedCompletionDate: inner.data };
        }
        let state = {
            initialParameters: parameters,
            projectNameOrNumber: projectNameOrNumberState,
            tenderDetailsProjectDetails: tenderDetailsProjectDetailsState,
            competitors: competitorsState,
            tenderDue: tenderDueState,
            tenderDeliveryMethod: tenderDeliveryMethodState,
            tenderAcceptancePeriod: tenderAcceptancePeriodState,
            bidBondRequired: bidBondRequiredState,
            bidBondType: bidBondTypeState,
            bidBidAmount: bidBidAmountState,
            consentOfSurety: consentOfSuretyState,
            tenderEstimatedContractPrice: tenderEstimatedContractPriceState,
            tenderEstimatedStartDate: tenderEstimatedStartDateState,
            tenderEstimatedCompletionDate: tenderEstimatedCompletionDateState,
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
    projectNameOrNumber: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectNameOrNumber>
    >;
    tenderDetailsProjectDetails: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.tenderDetailsProjectDetails>
    >;
    competitors: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.competitors>
    >;
    tenderDue: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.tenderDue>
    >;
    tenderDeliveryMethod: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.tenderDeliveryMethod>
    >;
    tenderAcceptancePeriod: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.tenderAcceptancePeriod>
    >;
    bidBondRequired: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.bidBondRequired>
    >;
    bidBondType: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.bidBondType>
    >;
    bidBidAmount: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.bidBidAmount>
    >;
    consentOfSurety: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.consentOfSurety>
    >;
    tenderEstimatedContractPrice: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.tenderEstimatedContractPrice>
    >;
    tenderEstimatedStartDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.tenderEstimatedStartDate>
    >;
    tenderEstimatedCompletionDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.tenderEstimatedCompletionDate>
    >;
};
// END MAGIC -- DO NOT EDIT
