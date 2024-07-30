import * as React from "react";
import { Button, Table } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickCache } from "../../clay/quick-cache";
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
import { StaticTextField, TextWidget } from "../../clay/widgets/TextWidget";
import { hasPermission } from "../../permissions";
import AddressWidget from "../AddressWidget.widget";
import { useUser } from "../state";
import UserAndDateWidget from "../user-and-date/UserAndDateWidget.widget";
import {
    calcUserCodeName,
    ROLE_CERTIFIED_FOREMAN,
    ROLE_PROJECT_MANAGER,
    USER_META,
} from "../user/table";
import { PersonnelListWidget } from "./personnel/list-widget";
import ProcessedForPayoutWidget from "./ProcessedForPayoutWidget.widget";
import ProjectDescriptionCategoryWidget from "./projectDescriptionDetail/ProjectDescriptionCategoryWidget.widget";
import { Project, PROJECT_META } from "./table";

export type Data = Project;

export const Fields = {
    personnel: Optional(PersonnelListWidget),
    siteAddress: AddressWidget,
    customer: FormField(TextWidget),
    projectDescription: FormField(ProjectDescriptionCategoryWidget),
    addedToAccountingSoftware: Optional(UserAndDateWidget),
    quickbooksId: Optional(TextWidget),
    processedForPayouts: ListWidget(ProcessedForPayoutWidget, {
        emptyOk: true,
    }),
    completion: OptionalFormField(UserAndDateWidget),
};

function validate(data: Project, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);

    if (!/^\d*$/.test(data.quickbooksId)) {
        errors.push({
            invalid: true,
            empty: false,
            field: "quickbooksId",
        });
    }

    return errors;
}

function Component(props: Props) {
    const cache = useQuickCache();
    const user = useUser();

    return (
        <>
            <FieldRow>
                <FormWrapper label="Project #" style={{ maxWidth: "5em" }}>
                    <StaticTextField
                        value={props.data.projectNumber + "" || ""}
                    />
                </FormWrapper>
                <widgets.siteAddress readOnly />
            </FieldRow>
            {props.data.billingContacts.map((billingContact, index) => (
                <FieldRow key={index}>
                    <FormWrapper label="Billing Contact">
                        <StaticTextField value={billingContact.name} />
                    </FormWrapper>
                    <FormWrapper label="Billing Company">
                        <div style={{ display: "flex" }}>
                            <StaticTextField
                                value={
                                    billingContact.company.name ||
                                    "N/A - Personal Residence"
                                }
                            />
                            {billingContact.company.company && (
                                <Button
                                    style={{ width: "5em" }}
                                    onClick={() => {
                                        window.open(
                                            "#/company/edit/" +
                                                billingContact.company.company
                                        );
                                    }}
                                >
                                    Open
                                </Button>
                            )}
                        </div>
                    </FormWrapper>
                    <FormWrapper label="Billing Contact Email">
                        <StaticTextField
                            value={
                                billingContact.company.billingContactEmail ||
                                billingContact.email
                            }
                        />
                    </FormWrapper>
                </FieldRow>
            ))}

            <FieldRow>
                <widgets.customer readOnly label="Client's Name" />
                <widgets.projectDescription label="Project Category" readOnly />
            </FieldRow>

            <FieldRow>
                {props.data.personnel
                    .filter((entry) => entry.role === ROLE_PROJECT_MANAGER)
                    .map((entry) => (
                        <FormWrapper label="Project Manager">
                            <StaticTextField
                                value={
                                    cache.get(USER_META, entry.user)?.name || ""
                                }
                            />
                        </FormWrapper>
                    ))}
            </FieldRow>
            <FieldRow>
                {props.data.personnel
                    .filter((entry) => entry.role === ROLE_CERTIFIED_FOREMAN)
                    .map((entry) => (
                        <FormWrapper label="Certified Foreman">
                            <StaticTextField
                                value={
                                    cache.get(USER_META, entry.user)
                                        ? calcUserCodeName(
                                              cache.get(USER_META, entry.user)!
                                          )
                                        : ""
                                }
                            />
                        </FormWrapper>
                    ))}
            </FieldRow>
            <FieldRow>
                <FormWrapper label="Entered into QuickBooks">
                    <widgets.addedToAccountingSoftware />
                </FormWrapper>
                {props.data.addedToAccountingSoftware.date !== null && (
                    <FormWrapper label="QuickBooks ID">
                        <widgets.quickbooksId />
                    </FormWrapper>
                )}
            </FieldRow>
            <Table>
                <thead>
                    <tr>
                        <td></td>
                        <td>Processed for Payout</td>
                        <td>Payout</td>
                    </tr>
                </thead>
                <widgets.processedForPayouts
                    containerClass="tbody"
                    extraItemForAdd
                />
            </Table>
            <FieldRow>
                <widgets.completion
                    label="Final Calculation of Payout"
                    disableSet
                    enableReset={hasPermission(
                        user,
                        "Project",
                        "reset-completed-project"
                    )}
                />
            </FieldRow>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.personnel> &
    WidgetContext<typeof Fields.siteAddress> &
    WidgetContext<typeof Fields.customer> &
    WidgetContext<typeof Fields.projectDescription> &
    WidgetContext<typeof Fields.addedToAccountingSoftware> &
    WidgetContext<typeof Fields.quickbooksId> &
    WidgetContext<typeof Fields.processedForPayouts> &
    WidgetContext<typeof Fields.completion>;
type ExtraProps = {};
type BaseState = {
    personnel: WidgetState<typeof Fields.personnel>;
    siteAddress: WidgetState<typeof Fields.siteAddress>;
    customer: WidgetState<typeof Fields.customer>;
    projectDescription: WidgetState<typeof Fields.projectDescription>;
    addedToAccountingSoftware: WidgetState<
        typeof Fields.addedToAccountingSoftware
    >;
    quickbooksId: WidgetState<typeof Fields.quickbooksId>;
    processedForPayouts: WidgetState<typeof Fields.processedForPayouts>;
    completion: WidgetState<typeof Fields.completion>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "PERSONNEL"; action: WidgetAction<typeof Fields.personnel> }
    | { type: "SITE_ADDRESS"; action: WidgetAction<typeof Fields.siteAddress> }
    | { type: "CUSTOMER"; action: WidgetAction<typeof Fields.customer> }
    | {
          type: "PROJECT_DESCRIPTION";
          action: WidgetAction<typeof Fields.projectDescription>;
      }
    | {
          type: "ADDED_TO_ACCOUNTING_SOFTWARE";
          action: WidgetAction<typeof Fields.addedToAccountingSoftware>;
      }
    | {
          type: "QUICKBOOKS_ID";
          action: WidgetAction<typeof Fields.quickbooksId>;
      }
    | {
          type: "PROCESSED_FOR_PAYOUTS";
          action: WidgetAction<typeof Fields.processedForPayouts>;
      }
    | { type: "COMPLETION"; action: WidgetAction<typeof Fields.completion> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.personnel, data.personnel, cache, "personnel", errors);
    subvalidate(
        Fields.siteAddress,
        data.siteAddress,
        cache,
        "siteAddress",
        errors
    );
    subvalidate(Fields.customer, data.customer, cache, "customer", errors);
    subvalidate(
        Fields.projectDescription,
        data.projectDescription,
        cache,
        "projectDescription",
        errors
    );
    subvalidate(
        Fields.addedToAccountingSoftware,
        data.addedToAccountingSoftware,
        cache,
        "addedToAccountingSoftware",
        errors
    );
    subvalidate(
        Fields.quickbooksId,
        data.quickbooksId,
        cache,
        "quickbooksId",
        errors
    );
    subvalidate(
        Fields.processedForPayouts,
        data.processedForPayouts,
        cache,
        "processedForPayouts",
        errors
    );
    subvalidate(
        Fields.completion,
        data.completion,
        cache,
        "completion",
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
        case "PERSONNEL": {
            const inner = Fields.personnel.reduce(
                state.personnel,
                data.personnel,
                action.action,
                subcontext
            );
            return {
                state: { ...state, personnel: inner.state },
                data: { ...data, personnel: inner.data },
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
        case "ADDED_TO_ACCOUNTING_SOFTWARE": {
            const inner = Fields.addedToAccountingSoftware.reduce(
                state.addedToAccountingSoftware,
                data.addedToAccountingSoftware,
                action.action,
                subcontext
            );
            return {
                state: { ...state, addedToAccountingSoftware: inner.state },
                data: { ...data, addedToAccountingSoftware: inner.data },
            };
        }
        case "QUICKBOOKS_ID": {
            const inner = Fields.quickbooksId.reduce(
                state.quickbooksId,
                data.quickbooksId,
                action.action,
                subcontext
            );
            return {
                state: { ...state, quickbooksId: inner.state },
                data: { ...data, quickbooksId: inner.data },
            };
        }
        case "PROCESSED_FOR_PAYOUTS": {
            const inner = Fields.processedForPayouts.reduce(
                state.processedForPayouts,
                data.processedForPayouts,
                action.action,
                subcontext
            );
            return {
                state: { ...state, processedForPayouts: inner.state },
                data: { ...data, processedForPayouts: inner.data },
            };
        }
        case "COMPLETION": {
            const inner = Fields.completion.reduce(
                state.completion,
                data.completion,
                action.action,
                subcontext
            );
            return {
                state: { ...state, completion: inner.state },
                data: { ...data, completion: inner.data },
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
    personnel: function (
        props: WidgetExtraProps<typeof Fields.personnel> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PERSONNEL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "personnel", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.personnel.component
                state={context.state.personnel}
                data={context.data.personnel}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Personnel"}
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
    addedToAccountingSoftware: function (
        props: WidgetExtraProps<typeof Fields.addedToAccountingSoftware> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ADDED_TO_ACCOUNTING_SOFTWARE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "addedToAccountingSoftware",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.addedToAccountingSoftware.component
                state={context.state.addedToAccountingSoftware}
                data={context.data.addedToAccountingSoftware}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Added to Accounting Software"}
            />
        );
    },
    quickbooksId: function (
        props: WidgetExtraProps<typeof Fields.quickbooksId> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "QUICKBOOKS_ID",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "quickbooksId", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.quickbooksId.component
                state={context.state.quickbooksId}
                data={context.data.quickbooksId}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Quickbooks Id"}
            />
        );
    },
    processedForPayouts: function (
        props: WidgetExtraProps<typeof Fields.processedForPayouts> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROCESSED_FOR_PAYOUTS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "processedForPayouts",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.processedForPayouts.component
                state={context.state.processedForPayouts}
                data={context.data.processedForPayouts}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Processed for Payouts"}
            />
        );
    },
    completion: function (
        props: WidgetExtraProps<typeof Fields.completion> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMPLETION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "completion", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.completion.component
                state={context.state.completion}
                data={context.data.completion}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Completion"}
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
        let personnelState;
        {
            const inner = Fields.personnel.initialize(
                data.personnel,
                subcontext,
                subparameters.personnel
            );
            personnelState = inner.state;
            data = { ...data, personnel: inner.data };
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
        let addedToAccountingSoftwareState;
        {
            const inner = Fields.addedToAccountingSoftware.initialize(
                data.addedToAccountingSoftware,
                subcontext,
                subparameters.addedToAccountingSoftware
            );
            addedToAccountingSoftwareState = inner.state;
            data = { ...data, addedToAccountingSoftware: inner.data };
        }
        let quickbooksIdState;
        {
            const inner = Fields.quickbooksId.initialize(
                data.quickbooksId,
                subcontext,
                subparameters.quickbooksId
            );
            quickbooksIdState = inner.state;
            data = { ...data, quickbooksId: inner.data };
        }
        let processedForPayoutsState;
        {
            const inner = Fields.processedForPayouts.initialize(
                data.processedForPayouts,
                subcontext,
                subparameters.processedForPayouts
            );
            processedForPayoutsState = inner.state;
            data = { ...data, processedForPayouts: inner.data };
        }
        let completionState;
        {
            const inner = Fields.completion.initialize(
                data.completion,
                subcontext,
                subparameters.completion
            );
            completionState = inner.state;
            data = { ...data, completion: inner.data };
        }
        let state = {
            initialParameters: parameters,
            personnel: personnelState,
            siteAddress: siteAddressState,
            customer: customerState,
            projectDescription: projectDescriptionState,
            addedToAccountingSoftware: addedToAccountingSoftwareState,
            quickbooksId: quickbooksIdState,
            processedForPayouts: processedForPayoutsState,
            completion: completionState,
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
    personnel: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.personnel>
    >;
    siteAddress: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.siteAddress>
    >;
    customer: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.customer>
    >;
    projectDescription: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectDescription>
    >;
    addedToAccountingSoftware: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.addedToAccountingSoftware>
    >;
    quickbooksId: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.quickbooksId>
    >;
    processedForPayouts: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.processedForPayouts>
    >;
    completion: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.completion>
    >;
};
// END MAGIC -- DO NOT EDIT
