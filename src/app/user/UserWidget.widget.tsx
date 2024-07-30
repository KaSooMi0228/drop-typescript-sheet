import { some } from "lodash";
import * as React from "react";
import { Table } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { SaveDeleteButton } from "../../clay/save-delete-button";
import { DropdownLinkWidget } from "../../clay/widgets/dropdown-link-widget";
import { EmailWidget } from "../../clay/widgets/EmailWidget";
import { FormField, OptionalFormField } from "../../clay/widgets/FormField";
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
import { LinkSetWidget } from "../../clay/widgets/link-set-widget";
import { ListWidget } from "../../clay/widgets/ListWidget";
import { PercentageWidget } from "../../clay/widgets/percentage-widget";
import { PhoneWidget } from "../../clay/widgets/phone";
import { SwitchWidget } from "../../clay/widgets/SwitchWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { ROLE_META } from "../roles/table";
import {
    ROLE_CERTIFIED_FOREMAN,
    ROLE_ESTIMATOR,
    ROLE_PROJECT_MANAGER,
    SQUAD_META,
    User,
    USER_META,
} from "./table";
import TargetsWidget from "./targets.widget";

export type Data = User;

const Fields = {
    name: FormField(TextWidget),
    phone: OptionalFormField(PhoneWidget),
    code: FormField(TextWidget),
    accountEmail: OptionalFormField(EmailWidget),
    active: FormField(SwitchWidget),
    roles: OptionalFormField(
        LinkSetWidget({ meta: ROLE_META, name: (role) => role.name })
    ),
    includeWarrantyFund: FormField(SwitchWidget),
    includeTaxHoldback: FormField(SwitchWidget),
    includeGst: FormField(SwitchWidget),
    includeEmployeeProfitShare: FormField(SwitchWidget),
    postProjectSurvey: FormField(SwitchWidget),
    commissionsPercentage: OptionalFormField(PercentageWidget),
    companyRole: OptionalFormField(TextWidget),
    squad: OptionalFormField(
        DropdownLinkWidget({
            meta: SQUAD_META,
            label: (x) => x.name,
        })
    ),
    quickbooksId: OptionalFormField(TextWidget),

    targets: ListWidget(TargetsWidget, { emptyOk: true }),
};

function validate(data: User, cache: QuickCacheApi) {
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
    return (
        <>
            <FieldRow>
                <widgets.name />
                <widgets.code />
                <widgets.active />
            </FieldRow>
            <FieldRow>
                <widgets.phone />
                <widgets.accountEmail label="Account Email (for Login to Dropsheet)" />
            </FieldRow>
            <widgets.quickbooksId label="Quickbooks ID" />
            <widgets.squad clearable />
            <widgets.roles />
            <widgets.companyRole />
            {props.data.roles.indexOf(ROLE_CERTIFIED_FOREMAN) !== -1 && (
                <FieldRow>
                    <widgets.includeWarrantyFund label="Deduct for Warranty Fund" />
                    <widgets.includeTaxHoldback label="Deduct for Tax Holdback" />
                    <widgets.includeGst label="Deduct for GST" />
                    <widgets.includeEmployeeProfitShare label="Deduct for Profit Share" />
                    <widgets.postProjectSurvey label="Require Completion Survey" />
                </FieldRow>
            )}
            {some(
                props.data.roles,
                (role) =>
                    role === ROLE_PROJECT_MANAGER || role === ROLE_ESTIMATOR
            ) && (
                <>
                    <widgets.commissionsPercentage label="Commissions Percentage" />
                </>
            )}
            <Table>
                <thead>
                    <th style={{ width: "2em" }}></th>
                    <th style={{ width: "10em" }}>Fiscal Year</th>
                    <th style={{ width: "12em" }}>Quoting Target</th>
                    <th style={{ width: "12em" }}>Landing Target</th>
                    <th style={{ width: "12em" }}>Managing Target</th>
                </thead>
                <widgets.targets extraItemForAdd containerClass="tbody" />
            </Table>
            <SaveDeleteButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.phone> &
    WidgetContext<typeof Fields.code> &
    WidgetContext<typeof Fields.accountEmail> &
    WidgetContext<typeof Fields.active> &
    WidgetContext<typeof Fields.roles> &
    WidgetContext<typeof Fields.includeWarrantyFund> &
    WidgetContext<typeof Fields.includeTaxHoldback> &
    WidgetContext<typeof Fields.includeGst> &
    WidgetContext<typeof Fields.includeEmployeeProfitShare> &
    WidgetContext<typeof Fields.postProjectSurvey> &
    WidgetContext<typeof Fields.commissionsPercentage> &
    WidgetContext<typeof Fields.companyRole> &
    WidgetContext<typeof Fields.squad> &
    WidgetContext<typeof Fields.quickbooksId> &
    WidgetContext<typeof Fields.targets>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    phone: WidgetState<typeof Fields.phone>;
    code: WidgetState<typeof Fields.code>;
    accountEmail: WidgetState<typeof Fields.accountEmail>;
    active: WidgetState<typeof Fields.active>;
    roles: WidgetState<typeof Fields.roles>;
    includeWarrantyFund: WidgetState<typeof Fields.includeWarrantyFund>;
    includeTaxHoldback: WidgetState<typeof Fields.includeTaxHoldback>;
    includeGst: WidgetState<typeof Fields.includeGst>;
    includeEmployeeProfitShare: WidgetState<
        typeof Fields.includeEmployeeProfitShare
    >;
    postProjectSurvey: WidgetState<typeof Fields.postProjectSurvey>;
    commissionsPercentage: WidgetState<typeof Fields.commissionsPercentage>;
    companyRole: WidgetState<typeof Fields.companyRole>;
    squad: WidgetState<typeof Fields.squad>;
    quickbooksId: WidgetState<typeof Fields.quickbooksId>;
    targets: WidgetState<typeof Fields.targets>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "PHONE"; action: WidgetAction<typeof Fields.phone> }
    | { type: "CODE"; action: WidgetAction<typeof Fields.code> }
    | {
          type: "ACCOUNT_EMAIL";
          action: WidgetAction<typeof Fields.accountEmail>;
      }
    | { type: "ACTIVE"; action: WidgetAction<typeof Fields.active> }
    | { type: "ROLES"; action: WidgetAction<typeof Fields.roles> }
    | {
          type: "INCLUDE_WARRANTY_FUND";
          action: WidgetAction<typeof Fields.includeWarrantyFund>;
      }
    | {
          type: "INCLUDE_TAX_HOLDBACK";
          action: WidgetAction<typeof Fields.includeTaxHoldback>;
      }
    | { type: "INCLUDE_GST"; action: WidgetAction<typeof Fields.includeGst> }
    | {
          type: "INCLUDE_EMPLOYEE_PROFIT_SHARE";
          action: WidgetAction<typeof Fields.includeEmployeeProfitShare>;
      }
    | {
          type: "POST_PROJECT_SURVEY";
          action: WidgetAction<typeof Fields.postProjectSurvey>;
      }
    | {
          type: "COMMISSIONS_PERCENTAGE";
          action: WidgetAction<typeof Fields.commissionsPercentage>;
      }
    | { type: "COMPANY_ROLE"; action: WidgetAction<typeof Fields.companyRole> }
    | { type: "SQUAD"; action: WidgetAction<typeof Fields.squad> }
    | {
          type: "QUICKBOOKS_ID";
          action: WidgetAction<typeof Fields.quickbooksId>;
      }
    | { type: "TARGETS"; action: WidgetAction<typeof Fields.targets> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.phone, data.phone, cache, "phone", errors);
    subvalidate(Fields.code, data.code, cache, "code", errors);
    subvalidate(
        Fields.accountEmail,
        data.accountEmail,
        cache,
        "accountEmail",
        errors
    );
    subvalidate(Fields.active, data.active, cache, "active", errors);
    subvalidate(Fields.roles, data.roles, cache, "roles", errors);
    subvalidate(
        Fields.includeWarrantyFund,
        data.includeWarrantyFund,
        cache,
        "includeWarrantyFund",
        errors
    );
    subvalidate(
        Fields.includeTaxHoldback,
        data.includeTaxHoldback,
        cache,
        "includeTaxHoldback",
        errors
    );
    subvalidate(
        Fields.includeGst,
        data.includeGst,
        cache,
        "includeGst",
        errors
    );
    subvalidate(
        Fields.includeEmployeeProfitShare,
        data.includeEmployeeProfitShare,
        cache,
        "includeEmployeeProfitShare",
        errors
    );
    subvalidate(
        Fields.postProjectSurvey,
        data.postProjectSurvey,
        cache,
        "postProjectSurvey",
        errors
    );
    subvalidate(
        Fields.commissionsPercentage,
        data.commissionsPercentage,
        cache,
        "commissionsPercentage",
        errors
    );
    subvalidate(
        Fields.companyRole,
        data.companyRole,
        cache,
        "companyRole",
        errors
    );
    subvalidate(Fields.squad, data.squad, cache, "squad", errors);
    subvalidate(
        Fields.quickbooksId,
        data.quickbooksId,
        cache,
        "quickbooksId",
        errors
    );
    subvalidate(Fields.targets, data.targets, cache, "targets", errors);
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
        case "PHONE": {
            const inner = Fields.phone.reduce(
                state.phone,
                data.phone,
                action.action,
                subcontext
            );
            return {
                state: { ...state, phone: inner.state },
                data: { ...data, phone: inner.data },
            };
        }
        case "CODE": {
            const inner = Fields.code.reduce(
                state.code,
                data.code,
                action.action,
                subcontext
            );
            return {
                state: { ...state, code: inner.state },
                data: { ...data, code: inner.data },
            };
        }
        case "ACCOUNT_EMAIL": {
            const inner = Fields.accountEmail.reduce(
                state.accountEmail,
                data.accountEmail,
                action.action,
                subcontext
            );
            return {
                state: { ...state, accountEmail: inner.state },
                data: { ...data, accountEmail: inner.data },
            };
        }
        case "ACTIVE": {
            const inner = Fields.active.reduce(
                state.active,
                data.active,
                action.action,
                subcontext
            );
            return {
                state: { ...state, active: inner.state },
                data: { ...data, active: inner.data },
            };
        }
        case "ROLES": {
            const inner = Fields.roles.reduce(
                state.roles,
                data.roles,
                action.action,
                subcontext
            );
            return {
                state: { ...state, roles: inner.state },
                data: { ...data, roles: inner.data },
            };
        }
        case "INCLUDE_WARRANTY_FUND": {
            const inner = Fields.includeWarrantyFund.reduce(
                state.includeWarrantyFund,
                data.includeWarrantyFund,
                action.action,
                subcontext
            );
            return {
                state: { ...state, includeWarrantyFund: inner.state },
                data: { ...data, includeWarrantyFund: inner.data },
            };
        }
        case "INCLUDE_TAX_HOLDBACK": {
            const inner = Fields.includeTaxHoldback.reduce(
                state.includeTaxHoldback,
                data.includeTaxHoldback,
                action.action,
                subcontext
            );
            return {
                state: { ...state, includeTaxHoldback: inner.state },
                data: { ...data, includeTaxHoldback: inner.data },
            };
        }
        case "INCLUDE_GST": {
            const inner = Fields.includeGst.reduce(
                state.includeGst,
                data.includeGst,
                action.action,
                subcontext
            );
            return {
                state: { ...state, includeGst: inner.state },
                data: { ...data, includeGst: inner.data },
            };
        }
        case "INCLUDE_EMPLOYEE_PROFIT_SHARE": {
            const inner = Fields.includeEmployeeProfitShare.reduce(
                state.includeEmployeeProfitShare,
                data.includeEmployeeProfitShare,
                action.action,
                subcontext
            );
            return {
                state: { ...state, includeEmployeeProfitShare: inner.state },
                data: { ...data, includeEmployeeProfitShare: inner.data },
            };
        }
        case "POST_PROJECT_SURVEY": {
            const inner = Fields.postProjectSurvey.reduce(
                state.postProjectSurvey,
                data.postProjectSurvey,
                action.action,
                subcontext
            );
            return {
                state: { ...state, postProjectSurvey: inner.state },
                data: { ...data, postProjectSurvey: inner.data },
            };
        }
        case "COMMISSIONS_PERCENTAGE": {
            const inner = Fields.commissionsPercentage.reduce(
                state.commissionsPercentage,
                data.commissionsPercentage,
                action.action,
                subcontext
            );
            return {
                state: { ...state, commissionsPercentage: inner.state },
                data: { ...data, commissionsPercentage: inner.data },
            };
        }
        case "COMPANY_ROLE": {
            const inner = Fields.companyRole.reduce(
                state.companyRole,
                data.companyRole,
                action.action,
                subcontext
            );
            return {
                state: { ...state, companyRole: inner.state },
                data: { ...data, companyRole: inner.data },
            };
        }
        case "SQUAD": {
            const inner = Fields.squad.reduce(
                state.squad,
                data.squad,
                action.action,
                subcontext
            );
            return {
                state: { ...state, squad: inner.state },
                data: { ...data, squad: inner.data },
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
        case "TARGETS": {
            const inner = Fields.targets.reduce(
                state.targets,
                data.targets,
                action.action,
                subcontext
            );
            return {
                state: { ...state, targets: inner.state },
                data: { ...data, targets: inner.data },
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
    phone: function (
        props: WidgetExtraProps<typeof Fields.phone> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "PHONE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "phone", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.phone.component
                state={context.state.phone}
                data={context.data.phone}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Phone"}
            />
        );
    },
    code: function (
        props: WidgetExtraProps<typeof Fields.code> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "CODE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "code", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.code.component
                state={context.state.code}
                data={context.data.code}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Code"}
            />
        );
    },
    accountEmail: function (
        props: WidgetExtraProps<typeof Fields.accountEmail> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ACCOUNT_EMAIL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "accountEmail", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.accountEmail.component
                state={context.state.accountEmail}
                data={context.data.accountEmail}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Account Email"}
            />
        );
    },
    active: function (
        props: WidgetExtraProps<typeof Fields.active> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ACTIVE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "active", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.active.component
                state={context.state.active}
                data={context.data.active}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Active"}
            />
        );
    },
    roles: function (
        props: WidgetExtraProps<typeof Fields.roles> & {
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
            <Fields.roles.component
                state={context.state.roles}
                data={context.data.roles}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Roles"}
            />
        );
    },
    includeWarrantyFund: function (
        props: WidgetExtraProps<typeof Fields.includeWarrantyFund> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INCLUDE_WARRANTY_FUND",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "includeWarrantyFund",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.includeWarrantyFund.component
                state={context.state.includeWarrantyFund}
                data={context.data.includeWarrantyFund}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Include Warranty Fund"}
            />
        );
    },
    includeTaxHoldback: function (
        props: WidgetExtraProps<typeof Fields.includeTaxHoldback> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INCLUDE_TAX_HOLDBACK",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "includeTaxHoldback",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.includeTaxHoldback.component
                state={context.state.includeTaxHoldback}
                data={context.data.includeTaxHoldback}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Include Tax Holdback"}
            />
        );
    },
    includeGst: function (
        props: WidgetExtraProps<typeof Fields.includeGst> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INCLUDE_GST",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "includeGst", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.includeGst.component
                state={context.state.includeGst}
                data={context.data.includeGst}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Include Gst"}
            />
        );
    },
    includeEmployeeProfitShare: function (
        props: WidgetExtraProps<typeof Fields.includeEmployeeProfitShare> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INCLUDE_EMPLOYEE_PROFIT_SHARE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "includeEmployeeProfitShare",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.includeEmployeeProfitShare.component
                state={context.state.includeEmployeeProfitShare}
                data={context.data.includeEmployeeProfitShare}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Include Employee Profit Share"}
            />
        );
    },
    postProjectSurvey: function (
        props: WidgetExtraProps<typeof Fields.postProjectSurvey> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "POST_PROJECT_SURVEY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "postProjectSurvey",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.postProjectSurvey.component
                state={context.state.postProjectSurvey}
                data={context.data.postProjectSurvey}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Post Project Survey"}
            />
        );
    },
    commissionsPercentage: function (
        props: WidgetExtraProps<typeof Fields.commissionsPercentage> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMMISSIONS_PERCENTAGE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "commissionsPercentage",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.commissionsPercentage.component
                state={context.state.commissionsPercentage}
                data={context.data.commissionsPercentage}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Commissions Percentage"}
            />
        );
    },
    companyRole: function (
        props: WidgetExtraProps<typeof Fields.companyRole> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMPANY_ROLE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "companyRole", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.companyRole.component
                state={context.state.companyRole}
                data={context.data.companyRole}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Company Role"}
            />
        );
    },
    squad: function (
        props: WidgetExtraProps<typeof Fields.squad> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "SQUAD", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "squad", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.squad.component
                state={context.state.squad}
                data={context.data.squad}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Squad"}
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
    targets: function (
        props: WidgetExtraProps<typeof Fields.targets> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "TARGETS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "targets", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.targets.component
                state={context.state.targets}
                data={context.data.targets}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Targets"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: USER_META,
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
        let phoneState;
        {
            const inner = Fields.phone.initialize(
                data.phone,
                subcontext,
                subparameters.phone
            );
            phoneState = inner.state;
            data = { ...data, phone: inner.data };
        }
        let codeState;
        {
            const inner = Fields.code.initialize(
                data.code,
                subcontext,
                subparameters.code
            );
            codeState = inner.state;
            data = { ...data, code: inner.data };
        }
        let accountEmailState;
        {
            const inner = Fields.accountEmail.initialize(
                data.accountEmail,
                subcontext,
                subparameters.accountEmail
            );
            accountEmailState = inner.state;
            data = { ...data, accountEmail: inner.data };
        }
        let activeState;
        {
            const inner = Fields.active.initialize(
                data.active,
                subcontext,
                subparameters.active
            );
            activeState = inner.state;
            data = { ...data, active: inner.data };
        }
        let rolesState;
        {
            const inner = Fields.roles.initialize(
                data.roles,
                subcontext,
                subparameters.roles
            );
            rolesState = inner.state;
            data = { ...data, roles: inner.data };
        }
        let includeWarrantyFundState;
        {
            const inner = Fields.includeWarrantyFund.initialize(
                data.includeWarrantyFund,
                subcontext,
                subparameters.includeWarrantyFund
            );
            includeWarrantyFundState = inner.state;
            data = { ...data, includeWarrantyFund: inner.data };
        }
        let includeTaxHoldbackState;
        {
            const inner = Fields.includeTaxHoldback.initialize(
                data.includeTaxHoldback,
                subcontext,
                subparameters.includeTaxHoldback
            );
            includeTaxHoldbackState = inner.state;
            data = { ...data, includeTaxHoldback: inner.data };
        }
        let includeGstState;
        {
            const inner = Fields.includeGst.initialize(
                data.includeGst,
                subcontext,
                subparameters.includeGst
            );
            includeGstState = inner.state;
            data = { ...data, includeGst: inner.data };
        }
        let includeEmployeeProfitShareState;
        {
            const inner = Fields.includeEmployeeProfitShare.initialize(
                data.includeEmployeeProfitShare,
                subcontext,
                subparameters.includeEmployeeProfitShare
            );
            includeEmployeeProfitShareState = inner.state;
            data = { ...data, includeEmployeeProfitShare: inner.data };
        }
        let postProjectSurveyState;
        {
            const inner = Fields.postProjectSurvey.initialize(
                data.postProjectSurvey,
                subcontext,
                subparameters.postProjectSurvey
            );
            postProjectSurveyState = inner.state;
            data = { ...data, postProjectSurvey: inner.data };
        }
        let commissionsPercentageState;
        {
            const inner = Fields.commissionsPercentage.initialize(
                data.commissionsPercentage,
                subcontext,
                subparameters.commissionsPercentage
            );
            commissionsPercentageState = inner.state;
            data = { ...data, commissionsPercentage: inner.data };
        }
        let companyRoleState;
        {
            const inner = Fields.companyRole.initialize(
                data.companyRole,
                subcontext,
                subparameters.companyRole
            );
            companyRoleState = inner.state;
            data = { ...data, companyRole: inner.data };
        }
        let squadState;
        {
            const inner = Fields.squad.initialize(
                data.squad,
                subcontext,
                subparameters.squad
            );
            squadState = inner.state;
            data = { ...data, squad: inner.data };
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
        let targetsState;
        {
            const inner = Fields.targets.initialize(
                data.targets,
                subcontext,
                subparameters.targets
            );
            targetsState = inner.state;
            data = { ...data, targets: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            phone: phoneState,
            code: codeState,
            accountEmail: accountEmailState,
            active: activeState,
            roles: rolesState,
            includeWarrantyFund: includeWarrantyFundState,
            includeTaxHoldback: includeTaxHoldbackState,
            includeGst: includeGstState,
            includeEmployeeProfitShare: includeEmployeeProfitShareState,
            postProjectSurvey: postProjectSurveyState,
            commissionsPercentage: commissionsPercentageState,
            companyRole: companyRoleState,
            squad: squadState,
            quickbooksId: quickbooksIdState,
            targets: targetsState,
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
                <RecordContext meta={USER_META} value={props.data}>
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
    phone: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.phone>
    >;
    code: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.code>
    >;
    accountEmail: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.accountEmail>
    >;
    active: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.active>
    >;
    roles: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.roles>
    >;
    includeWarrantyFund: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.includeWarrantyFund>
    >;
    includeTaxHoldback: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.includeTaxHoldback>
    >;
    includeGst: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.includeGst>
    >;
    includeEmployeeProfitShare: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.includeEmployeeProfitShare>
    >;
    postProjectSurvey: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.postProjectSurvey>
    >;
    commissionsPercentage: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.commissionsPercentage>
    >;
    companyRole: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.companyRole>
    >;
    squad: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.squad>
    >;
    quickbooksId: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.quickbooksId>
    >;
    targets: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.targets>
    >;
};
// END MAGIC -- DO NOT EDIT
