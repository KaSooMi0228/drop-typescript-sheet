import * as React from "react";
import { Col, Row, Tab, Tabs } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import componentId from "../../clay/componentId";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { SaveDeleteButton } from "../../clay/save-delete-button";
import { DateWidget } from "../../clay/widgets/DateWidget";
import { EmailWidget } from "../../clay/widgets/EmailWidget";
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
import { PhoneWidget } from "../../clay/widgets/phone";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { TermLinkWidget } from "../../terms";
import AddressWidget from "../AddressWidget.widget";
import { ServiceRepresentativeLinkWidget, UserLinkWidget } from "../user";
import { Company, COMPANY_META } from "./table";

export type Data = Company;

export const Fields = {
    name: FormField(TextWidget),
    email: OptionalFormField(EmailWidget),
    address: Optional(AddressWidget),
    website: OptionalFormField(TextWidget),
    phone: OptionalFormField(PhoneWidget),
    fax: OptionalFormField(PhoneWidget),

    addedDate: OptionalFormField(DateWidget),
    addedBy: OptionalFormField(UserLinkWidget),
    modifiedDate: OptionalFormField(DateWidget),
    modifiedBy: OptionalFormField(UserLinkWidget),
    billingContactEmail: OptionalFormField(TextWidget),

    serviceRepresentative: OptionalFormField(ServiceRepresentativeLinkWidget),
    terms: OptionalFormField(TermLinkWidget),
};

function Component(props: Props) {
    const id = componentId();

    return (
        <>
            <Tabs defaultActiveKey="contact" id={id}>
                <Tab eventKey="contact" title="Profile">
                    <FieldRow>
                        <widgets.name />
                    </FieldRow>
                    <widgets.address />
                    <widgets.website />
                    <FieldRow>
                        <widgets.email />
                        <widgets.phone />
                        <widgets.fax />
                    </FieldRow>
                </Tab>
                <Tab eventKey="meta" title="Meta">
                    <Row>
                        <Col>
                            <widgets.addedBy readOnly />
                        </Col>
                        <Col>
                            <widgets.addedDate readOnly label="Date Added" />
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
                    <Row>
                        <Col>
                            <widgets.serviceRepresentative />
                        </Col>
                        <Col>
                            <widgets.terms />
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <widgets.billingContactEmail />
                        </Col>
                        <Col />
                    </Row>
                </Tab>
            </Tabs>
            <SaveDeleteButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.email> &
    WidgetContext<typeof Fields.address> &
    WidgetContext<typeof Fields.website> &
    WidgetContext<typeof Fields.phone> &
    WidgetContext<typeof Fields.fax> &
    WidgetContext<typeof Fields.addedDate> &
    WidgetContext<typeof Fields.addedBy> &
    WidgetContext<typeof Fields.modifiedDate> &
    WidgetContext<typeof Fields.modifiedBy> &
    WidgetContext<typeof Fields.billingContactEmail> &
    WidgetContext<typeof Fields.serviceRepresentative> &
    WidgetContext<typeof Fields.terms>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    email: WidgetState<typeof Fields.email>;
    address: WidgetState<typeof Fields.address>;
    website: WidgetState<typeof Fields.website>;
    phone: WidgetState<typeof Fields.phone>;
    fax: WidgetState<typeof Fields.fax>;
    addedDate: WidgetState<typeof Fields.addedDate>;
    addedBy: WidgetState<typeof Fields.addedBy>;
    modifiedDate: WidgetState<typeof Fields.modifiedDate>;
    modifiedBy: WidgetState<typeof Fields.modifiedBy>;
    billingContactEmail: WidgetState<typeof Fields.billingContactEmail>;
    serviceRepresentative: WidgetState<typeof Fields.serviceRepresentative>;
    terms: WidgetState<typeof Fields.terms>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "EMAIL"; action: WidgetAction<typeof Fields.email> }
    | { type: "ADDRESS"; action: WidgetAction<typeof Fields.address> }
    | { type: "WEBSITE"; action: WidgetAction<typeof Fields.website> }
    | { type: "PHONE"; action: WidgetAction<typeof Fields.phone> }
    | { type: "FAX"; action: WidgetAction<typeof Fields.fax> }
    | { type: "ADDED_DATE"; action: WidgetAction<typeof Fields.addedDate> }
    | { type: "ADDED_BY"; action: WidgetAction<typeof Fields.addedBy> }
    | {
          type: "MODIFIED_DATE";
          action: WidgetAction<typeof Fields.modifiedDate>;
      }
    | { type: "MODIFIED_BY"; action: WidgetAction<typeof Fields.modifiedBy> }
    | {
          type: "BILLING_CONTACT_EMAIL";
          action: WidgetAction<typeof Fields.billingContactEmail>;
      }
    | {
          type: "SERVICE_REPRESENTATIVE";
          action: WidgetAction<typeof Fields.serviceRepresentative>;
      }
    | { type: "TERMS"; action: WidgetAction<typeof Fields.terms> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.email, data.email, cache, "email", errors);
    subvalidate(Fields.address, data.address, cache, "address", errors);
    subvalidate(Fields.website, data.website, cache, "website", errors);
    subvalidate(Fields.phone, data.phone, cache, "phone", errors);
    subvalidate(Fields.fax, data.fax, cache, "fax", errors);
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
        Fields.billingContactEmail,
        data.billingContactEmail,
        cache,
        "billingContactEmail",
        errors
    );
    subvalidate(
        Fields.serviceRepresentative,
        data.serviceRepresentative,
        cache,
        "serviceRepresentative",
        errors
    );
    subvalidate(Fields.terms, data.terms, cache, "terms", errors);
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
        case "ADDRESS": {
            const inner = Fields.address.reduce(
                state.address,
                data.address,
                action.action,
                subcontext
            );
            return {
                state: { ...state, address: inner.state },
                data: { ...data, address: inner.data },
            };
        }
        case "WEBSITE": {
            const inner = Fields.website.reduce(
                state.website,
                data.website,
                action.action,
                subcontext
            );
            return {
                state: { ...state, website: inner.state },
                data: { ...data, website: inner.data },
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
        case "FAX": {
            const inner = Fields.fax.reduce(
                state.fax,
                data.fax,
                action.action,
                subcontext
            );
            return {
                state: { ...state, fax: inner.state },
                data: { ...data, fax: inner.data },
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
        case "BILLING_CONTACT_EMAIL": {
            const inner = Fields.billingContactEmail.reduce(
                state.billingContactEmail,
                data.billingContactEmail,
                action.action,
                subcontext
            );
            return {
                state: { ...state, billingContactEmail: inner.state },
                data: { ...data, billingContactEmail: inner.data },
            };
        }
        case "SERVICE_REPRESENTATIVE": {
            const inner = Fields.serviceRepresentative.reduce(
                state.serviceRepresentative,
                data.serviceRepresentative,
                action.action,
                subcontext
            );
            return {
                state: { ...state, serviceRepresentative: inner.state },
                data: { ...data, serviceRepresentative: inner.data },
            };
        }
        case "TERMS": {
            const inner = Fields.terms.reduce(
                state.terms,
                data.terms,
                action.action,
                subcontext
            );
            return {
                state: { ...state, terms: inner.state },
                data: { ...data, terms: inner.data },
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
    address: function (
        props: WidgetExtraProps<typeof Fields.address> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ADDRESS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "address", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.address.component
                state={context.state.address}
                data={context.data.address}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Address"}
            />
        );
    },
    website: function (
        props: WidgetExtraProps<typeof Fields.website> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "WEBSITE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "website", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.website.component
                state={context.state.website}
                data={context.data.website}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Website"}
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
    fax: function (
        props: WidgetExtraProps<typeof Fields.fax> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "FAX", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "fax", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.fax.component
                state={context.state.fax}
                data={context.data.fax}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Fax"}
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
    billingContactEmail: function (
        props: WidgetExtraProps<typeof Fields.billingContactEmail> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "BILLING_CONTACT_EMAIL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "billingContactEmail",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.billingContactEmail.component
                state={context.state.billingContactEmail}
                data={context.data.billingContactEmail}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Billing Contact Email"}
            />
        );
    },
    serviceRepresentative: function (
        props: WidgetExtraProps<typeof Fields.serviceRepresentative> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SERVICE_REPRESENTATIVE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "serviceRepresentative",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.serviceRepresentative.component
                state={context.state.serviceRepresentative}
                data={context.data.serviceRepresentative}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Service Representative"}
            />
        );
    },
    terms: function (
        props: WidgetExtraProps<typeof Fields.terms> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "TERMS", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "terms", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.terms.component
                state={context.state.terms}
                data={context.data.terms}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Terms"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: COMPANY_META,
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
        let addressState;
        {
            const inner = Fields.address.initialize(
                data.address,
                subcontext,
                subparameters.address
            );
            addressState = inner.state;
            data = { ...data, address: inner.data };
        }
        let websiteState;
        {
            const inner = Fields.website.initialize(
                data.website,
                subcontext,
                subparameters.website
            );
            websiteState = inner.state;
            data = { ...data, website: inner.data };
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
        let faxState;
        {
            const inner = Fields.fax.initialize(
                data.fax,
                subcontext,
                subparameters.fax
            );
            faxState = inner.state;
            data = { ...data, fax: inner.data };
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
        let billingContactEmailState;
        {
            const inner = Fields.billingContactEmail.initialize(
                data.billingContactEmail,
                subcontext,
                subparameters.billingContactEmail
            );
            billingContactEmailState = inner.state;
            data = { ...data, billingContactEmail: inner.data };
        }
        let serviceRepresentativeState;
        {
            const inner = Fields.serviceRepresentative.initialize(
                data.serviceRepresentative,
                subcontext,
                subparameters.serviceRepresentative
            );
            serviceRepresentativeState = inner.state;
            data = { ...data, serviceRepresentative: inner.data };
        }
        let termsState;
        {
            const inner = Fields.terms.initialize(
                data.terms,
                subcontext,
                subparameters.terms
            );
            termsState = inner.state;
            data = { ...data, terms: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            email: emailState,
            address: addressState,
            website: websiteState,
            phone: phoneState,
            fax: faxState,
            addedDate: addedDateState,
            addedBy: addedByState,
            modifiedDate: modifiedDateState,
            modifiedBy: modifiedByState,
            billingContactEmail: billingContactEmailState,
            serviceRepresentative: serviceRepresentativeState,
            terms: termsState,
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
                <RecordContext meta={COMPANY_META} value={props.data}>
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
    email: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.email>
    >;
    address: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.address>
    >;
    website: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.website>
    >;
    phone: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.phone>
    >;
    fax: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.fax>
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
    billingContactEmail: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.billingContactEmail>
    >;
    serviceRepresentative: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.serviceRepresentative>
    >;
    terms: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.terms>
    >;
};
// END MAGIC -- DO NOT EDIT
