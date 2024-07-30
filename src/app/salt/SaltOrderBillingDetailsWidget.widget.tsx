import * as React from "react";
import { Button, Col, FormControl, Row } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { DateWidget } from "../../clay/widgets/DateWidget";
import {
    FormField,
    FormWrapper,
    OptionalFormField,
} from "../../clay/widgets/FormField";
import {
    atLeastOneOf,
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
import { TextWidget } from "../../clay/widgets/TextWidget";
import AddressWidget from "../AddressWidget.widget";
import { ContactDetailWidget, selectForId } from "../contact/contact-widget";
import DatedStringWidget from "../dated-strings/DatedStringWidget.widget";
import { UserLinkWidget } from "../user";
import { SaltOrder, SALT_ORDER_META } from "./table";
import { LastOrderContext } from "./widget";

export type Data = SaltOrder;
export const Fields = {
    orderDate: FormField(DateWidget),
    billingContact: FormField(ContactDetailWidget()),
    deliveryContact: FormField(ContactDetailWidget()),
    purchaseOrderNumber: OptionalFormField(TextWidget),
    terms: FormField(TextWidget),
    deliveryAddress: AddressWidget,
    specialInstructions: FormField(ListWidget(DatedStringWidget)),
    orderedBy: FormField(TextWidget),
    customer: FormField(TextWidget),
    enteredBy: OptionalFormField(UserLinkWidget),
};

function validate(data: SaltOrder, cache: QuickCacheApi) {
    let errors = baseValidate(data, cache);

    return atLeastOneOf(errors, "specialInstructions", "deliveryContact");
}

function Component(props: Props) {
    const lastOrder = React.useContext(LastOrderContext);

    const onCopyClick = React.useCallback(async () => {
        if (lastOrder) {
            if (lastOrder.billingContact && lastOrder.billingContact.contact) {
                props.dispatch({
                    type: "BILLING_CONTACT",
                    action: await selectForId(lastOrder.billingContact.contact),
                });
            }

            if (
                lastOrder.deliveryContact &&
                lastOrder.deliveryContact.contact
            ) {
                props.dispatch({
                    type: "DELIVERY_CONTACT",
                    action: await selectForId(
                        lastOrder.deliveryContact.contact
                    ),
                });
            }

            props.dispatch({
                type: "CUSTOMER",
                action: {
                    type: "SET",
                    value: lastOrder.customer,
                },
            });
        }
    }, [props.dispatch, lastOrder && lastOrder.lines]);
    return (
        <>
            <Row>
                <Col lg={3}>
                    <FormWrapper label="Order Number">
                        <FormControl
                            readOnly
                            type="number"
                            value={props.data.orderNumber as any}
                        />
                    </FormWrapper>
                </Col>
                <Col lg={3}>
                    <widgets.enteredBy readOnly />
                </Col>
                <Col lg={6}>
                    <widgets.orderDate />
                </Col>
            </Row>
            <Row>
                <Col>
                    <widgets.deliveryAddress />
                </Col>
                <Col />
            </Row>
            {lastOrder &&
                props.data.deliveryContact.contact === null &&
                props.data.billingContact.contact === null &&
                props.data.customer === "" && (
                    <Button onClick={onCopyClick}>Copy Last Order</Button>
                )}
            <Row>
                <Col>
                    <widgets.billingContact
                    /*TODO suggestions={
                            lastOrder && lastOrder.billingContactId
                                ? [
                                      {
                                          id: lastOrder.billingContactId,
                                          name:
                                              lastOrder.billingContactName || ""
                                      }
                                  ]
                                : undefined
                        }*/
                    />
                </Col>
                <Col>
                    <widgets.deliveryContact
                    /*TODO suggestions={
                            lastOrder && lastOrder.deliveryContactId
                                ? [
                                      {
                                          id: lastOrder.deliveryContactId,
                                          name:
                                              lastOrder.deliveryContactName ||
                                              ""
                                      }
                                  ]
                                : undefined
                        }*/
                    />
                </Col>
            </Row>
            <Row>
                <Col>
                    <widgets.purchaseOrderNumber />
                </Col>
                <Col>
                    <widgets.terms />
                </Col>
            </Row>
            <Row>
                <Col>
                    <widgets.customer label="Client's Name" />
                </Col>
                <Col>
                    <widgets.orderedBy />
                </Col>
            </Row>

            <widgets.specialInstructions extraItemForAdd />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.orderDate> &
    WidgetContext<typeof Fields.billingContact> &
    WidgetContext<typeof Fields.deliveryContact> &
    WidgetContext<typeof Fields.purchaseOrderNumber> &
    WidgetContext<typeof Fields.terms> &
    WidgetContext<typeof Fields.deliveryAddress> &
    WidgetContext<typeof Fields.specialInstructions> &
    WidgetContext<typeof Fields.orderedBy> &
    WidgetContext<typeof Fields.customer> &
    WidgetContext<typeof Fields.enteredBy>;
type ExtraProps = {};
type BaseState = {
    orderDate: WidgetState<typeof Fields.orderDate>;
    billingContact: WidgetState<typeof Fields.billingContact>;
    deliveryContact: WidgetState<typeof Fields.deliveryContact>;
    purchaseOrderNumber: WidgetState<typeof Fields.purchaseOrderNumber>;
    terms: WidgetState<typeof Fields.terms>;
    deliveryAddress: WidgetState<typeof Fields.deliveryAddress>;
    specialInstructions: WidgetState<typeof Fields.specialInstructions>;
    orderedBy: WidgetState<typeof Fields.orderedBy>;
    customer: WidgetState<typeof Fields.customer>;
    enteredBy: WidgetState<typeof Fields.enteredBy>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "ORDER_DATE"; action: WidgetAction<typeof Fields.orderDate> }
    | {
          type: "BILLING_CONTACT";
          action: WidgetAction<typeof Fields.billingContact>;
      }
    | {
          type: "DELIVERY_CONTACT";
          action: WidgetAction<typeof Fields.deliveryContact>;
      }
    | {
          type: "PURCHASE_ORDER_NUMBER";
          action: WidgetAction<typeof Fields.purchaseOrderNumber>;
      }
    | { type: "TERMS"; action: WidgetAction<typeof Fields.terms> }
    | {
          type: "DELIVERY_ADDRESS";
          action: WidgetAction<typeof Fields.deliveryAddress>;
      }
    | {
          type: "SPECIAL_INSTRUCTIONS";
          action: WidgetAction<typeof Fields.specialInstructions>;
      }
    | { type: "ORDERED_BY"; action: WidgetAction<typeof Fields.orderedBy> }
    | { type: "CUSTOMER"; action: WidgetAction<typeof Fields.customer> }
    | { type: "ENTERED_BY"; action: WidgetAction<typeof Fields.enteredBy> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.orderDate, data.orderDate, cache, "orderDate", errors);
    subvalidate(
        Fields.billingContact,
        data.billingContact,
        cache,
        "billingContact",
        errors
    );
    subvalidate(
        Fields.deliveryContact,
        data.deliveryContact,
        cache,
        "deliveryContact",
        errors
    );
    subvalidate(
        Fields.purchaseOrderNumber,
        data.purchaseOrderNumber,
        cache,
        "purchaseOrderNumber",
        errors
    );
    subvalidate(Fields.terms, data.terms, cache, "terms", errors);
    subvalidate(
        Fields.deliveryAddress,
        data.deliveryAddress,
        cache,
        "deliveryAddress",
        errors
    );
    subvalidate(
        Fields.specialInstructions,
        data.specialInstructions,
        cache,
        "specialInstructions",
        errors
    );
    subvalidate(Fields.orderedBy, data.orderedBy, cache, "orderedBy", errors);
    subvalidate(Fields.customer, data.customer, cache, "customer", errors);
    subvalidate(Fields.enteredBy, data.enteredBy, cache, "enteredBy", errors);
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
        case "ORDER_DATE": {
            const inner = Fields.orderDate.reduce(
                state.orderDate,
                data.orderDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, orderDate: inner.state },
                data: { ...data, orderDate: inner.data },
            };
        }
        case "BILLING_CONTACT": {
            const inner = Fields.billingContact.reduce(
                state.billingContact,
                data.billingContact,
                action.action,
                subcontext
            );
            return {
                state: { ...state, billingContact: inner.state },
                data: { ...data, billingContact: inner.data },
            };
        }
        case "DELIVERY_CONTACT": {
            const inner = Fields.deliveryContact.reduce(
                state.deliveryContact,
                data.deliveryContact,
                action.action,
                subcontext
            );
            return {
                state: { ...state, deliveryContact: inner.state },
                data: { ...data, deliveryContact: inner.data },
            };
        }
        case "PURCHASE_ORDER_NUMBER": {
            const inner = Fields.purchaseOrderNumber.reduce(
                state.purchaseOrderNumber,
                data.purchaseOrderNumber,
                action.action,
                subcontext
            );
            return {
                state: { ...state, purchaseOrderNumber: inner.state },
                data: { ...data, purchaseOrderNumber: inner.data },
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
        case "DELIVERY_ADDRESS": {
            const inner = Fields.deliveryAddress.reduce(
                state.deliveryAddress,
                data.deliveryAddress,
                action.action,
                subcontext
            );
            return {
                state: { ...state, deliveryAddress: inner.state },
                data: { ...data, deliveryAddress: inner.data },
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
        case "ORDERED_BY": {
            const inner = Fields.orderedBy.reduce(
                state.orderedBy,
                data.orderedBy,
                action.action,
                subcontext
            );
            return {
                state: { ...state, orderedBy: inner.state },
                data: { ...data, orderedBy: inner.data },
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
        case "ENTERED_BY": {
            const inner = Fields.enteredBy.reduce(
                state.enteredBy,
                data.enteredBy,
                action.action,
                subcontext
            );
            return {
                state: { ...state, enteredBy: inner.state },
                data: { ...data, enteredBy: inner.data },
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
    orderDate: function (
        props: WidgetExtraProps<typeof Fields.orderDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ORDER_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "orderDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.orderDate.component
                state={context.state.orderDate}
                data={context.data.orderDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Order Date"}
            />
        );
    },
    billingContact: function (
        props: WidgetExtraProps<typeof Fields.billingContact> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "BILLING_CONTACT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "billingContact", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.billingContact.component
                state={context.state.billingContact}
                data={context.data.billingContact}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Billing Contact"}
            />
        );
    },
    deliveryContact: function (
        props: WidgetExtraProps<typeof Fields.deliveryContact> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DELIVERY_CONTACT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "deliveryContact", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.deliveryContact.component
                state={context.state.deliveryContact}
                data={context.data.deliveryContact}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Delivery Contact"}
            />
        );
    },
    purchaseOrderNumber: function (
        props: WidgetExtraProps<typeof Fields.purchaseOrderNumber> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PURCHASE_ORDER_NUMBER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "purchaseOrderNumber",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.purchaseOrderNumber.component
                state={context.state.purchaseOrderNumber}
                data={context.data.purchaseOrderNumber}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Purchase Order Number"}
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
    deliveryAddress: function (
        props: WidgetExtraProps<typeof Fields.deliveryAddress> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DELIVERY_ADDRESS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "deliveryAddress", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.deliveryAddress.component
                state={context.state.deliveryAddress}
                data={context.data.deliveryAddress}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Delivery Address"}
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
    orderedBy: function (
        props: WidgetExtraProps<typeof Fields.orderedBy> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ORDERED_BY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "orderedBy", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.orderedBy.component
                state={context.state.orderedBy}
                data={context.data.orderedBy}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Ordered By"}
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
    enteredBy: function (
        props: WidgetExtraProps<typeof Fields.enteredBy> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ENTERED_BY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "enteredBy", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.enteredBy.component
                state={context.state.enteredBy}
                data={context.data.enteredBy}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Entered By"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: SALT_ORDER_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let orderDateState;
        {
            const inner = Fields.orderDate.initialize(
                data.orderDate,
                subcontext,
                subparameters.orderDate
            );
            orderDateState = inner.state;
            data = { ...data, orderDate: inner.data };
        }
        let billingContactState;
        {
            const inner = Fields.billingContact.initialize(
                data.billingContact,
                subcontext,
                subparameters.billingContact
            );
            billingContactState = inner.state;
            data = { ...data, billingContact: inner.data };
        }
        let deliveryContactState;
        {
            const inner = Fields.deliveryContact.initialize(
                data.deliveryContact,
                subcontext,
                subparameters.deliveryContact
            );
            deliveryContactState = inner.state;
            data = { ...data, deliveryContact: inner.data };
        }
        let purchaseOrderNumberState;
        {
            const inner = Fields.purchaseOrderNumber.initialize(
                data.purchaseOrderNumber,
                subcontext,
                subparameters.purchaseOrderNumber
            );
            purchaseOrderNumberState = inner.state;
            data = { ...data, purchaseOrderNumber: inner.data };
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
        let deliveryAddressState;
        {
            const inner = Fields.deliveryAddress.initialize(
                data.deliveryAddress,
                subcontext,
                subparameters.deliveryAddress
            );
            deliveryAddressState = inner.state;
            data = { ...data, deliveryAddress: inner.data };
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
        let orderedByState;
        {
            const inner = Fields.orderedBy.initialize(
                data.orderedBy,
                subcontext,
                subparameters.orderedBy
            );
            orderedByState = inner.state;
            data = { ...data, orderedBy: inner.data };
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
        let enteredByState;
        {
            const inner = Fields.enteredBy.initialize(
                data.enteredBy,
                subcontext,
                subparameters.enteredBy
            );
            enteredByState = inner.state;
            data = { ...data, enteredBy: inner.data };
        }
        let state = {
            initialParameters: parameters,
            orderDate: orderDateState,
            billingContact: billingContactState,
            deliveryContact: deliveryContactState,
            purchaseOrderNumber: purchaseOrderNumberState,
            terms: termsState,
            deliveryAddress: deliveryAddressState,
            specialInstructions: specialInstructionsState,
            orderedBy: orderedByState,
            customer: customerState,
            enteredBy: enteredByState,
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
                <RecordContext meta={SALT_ORDER_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    orderDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.orderDate>
    >;
    billingContact: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.billingContact>
    >;
    deliveryContact: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.deliveryContact>
    >;
    purchaseOrderNumber: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.purchaseOrderNumber>
    >;
    terms: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.terms>
    >;
    deliveryAddress: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.deliveryAddress>
    >;
    specialInstructions: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.specialInstructions>
    >;
    orderedBy: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.orderedBy>
    >;
    customer: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.customer>
    >;
    enteredBy: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.enteredBy>
    >;
};
// END MAGIC -- DO NOT EDIT
