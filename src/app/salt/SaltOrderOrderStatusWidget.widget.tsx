import { faBan } from "@fortawesome/free-solid-svg-icons";
import { css } from "glamor";
import * as React from "react";
import { Button } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { LocalDate } from "../../clay/LocalDate";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { SaveButton } from "../../clay/save-button";
import { SaveDeleteButton } from "../../clay/save-delete-button";
import { DateWidget } from "../../clay/widgets/DateWidget";
import { Optional, OptionalFormField } from "../../clay/widgets/FormField";
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
import { MoneyStatic, MoneyWidget } from "../../clay/widgets/money-widget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { TABLE_STYLE } from "../styles";
import SaltOrderPaymentWidget from "./SaltOrderPaymentWidget.widget";
import {
    calcSaltOrderPendingAmount,
    calcSaltOrderTotalPayments,
    SaltOrder,
    SALT_ORDER_META,
} from "./table";

export type Data = SaltOrder;

type ExtraActions =
    | {
          type: "ADD_PAYMENT";
      }
    | {
          type: "CANCEL_ORDER";
      }
    | {
          type: "UNCANCEL_ORDER";
      }
    | {
          type: "WRITE_OFF_ORDER";
      };

function reduce(
    state: State,
    data: SaltOrder,
    action: Action,
    context: Context
) {
    switch (action.type) {
        case "ADD_PAYMENT":
            const newPayment = SaltOrderPaymentWidget.initialize(
                {
                    date: new LocalDate(new Date()),
                    amount: calcSaltOrderPendingAmount(data),
                    chequeNumber: "",
                },
                context
            );
            return {
                state: {
                    ...state,
                    payments: {
                        ...state.payments,
                        items: [...state.payments.items, newPayment.state],
                    },
                },
                data: {
                    ...data,
                    payments: [...data.payments, newPayment.data],
                },
            };
        case "CANCEL_ORDER":
            return {
                state: {
                    ...state,
                },
                data: {
                    ...data,
                    cancelled: true,
                },
            };
        case "UNCANCEL_ORDER":
            return {
                state: {
                    ...state,
                },
                data: {
                    ...data,
                    cancelled: false,
                },
            };
        case "WRITE_OFF_ORDER":
            return {
                state,
                data: {
                    ...data,
                    writeOff: calcSaltOrderPendingAmount(data),
                },
            };
        default:
            return baseReduce(state, data, action, context);
    }
}
export const Fields = {
    deliveredBy: OptionalFormField(TextWidget),
    deliveredDate: OptionalFormField(DateWidget),
    invoicedDate: OptionalFormField(DateWidget),
    payments: ListWidget(SaltOrderPaymentWidget, {
        emptyOk: true,
    }),
    writeOff: Optional(MoneyWidget),
};

const GROUP = css({
    border: "solid 1px gray",
    borderRadius: "5px",
    marginBottom: "10px",
    "& .title": {
        borderBottom: "solid 1px gray",
        borderRadius: "5px 5px 0px 0px",
        padding: "5px",
        fontSize: "14pt",
        fontWeight: "bold",
        backgroundColor: "#eee",
        paddingLeft: "15px",
    },
    "& .body": {
        padding: "5px",
        marginLeft: "10px",
    },
});

function Component(props: Props) {
    return (
        <>
            <div {...GROUP}>
                <div className="title">Delivery</div>
                <div className="body">
                    <widgets.deliveredBy />
                    <widgets.deliveredDate todayButton label="Delivery Date" />
                </div>
            </div>
            <div {...GROUP}>
                <div className="title">Invoice</div>
                <div className="body">
                    <widgets.invoicedDate label="Invoice Date" />
                    <SaveButton
                        label="Generate Invoice"
                        disabled={
                            props.data.deliveredBy === "" ||
                            props.data.deliveredDate === null
                        }
                        printTemplate="saltOrderInvoice"
                        preSave={() => {
                            if (props.data.invoicedDate === null) {
                                props.dispatch({
                                    type: "INVOICED_DATE",
                                    action: {
                                        type: "SET",
                                        value: new LocalDate(new Date()),
                                    },
                                });
                            }
                        }}
                    />
                </div>
            </div>
            <div {...GROUP}>
                <div className="title">Payment</div>
                <div className="body">
                    <table {...TABLE_STYLE}>
                        <thead>
                            {props.data.payments.length > 0 && (
                                <tr>
                                    <th />
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Cheque Number</th>
                                </tr>
                            )}
                        </thead>
                        <widgets.payments containerClass="tbody" />
                        <tfoot>
                            <tr>
                                <td colSpan={4} style={{ paddingTop: "10px" }}>
                                    <Button
                                        onClick={() =>
                                            props.dispatch({
                                                type: "ADD_PAYMENT",
                                            })
                                        }
                                        disabled={!props.status.mutable}
                                    >
                                        Add Payment
                                    </Button>
                                </td>
                            </tr>
                            <tr>
                                <th colSpan={3}>Total</th>
                                <th>
                                    <MoneyStatic
                                        value={calcSaltOrderTotalPayments(
                                            props.data
                                        )}
                                    />
                                </th>
                            </tr>
                            {(!props.data.writeOff.isZero() ||
                                (props.data.payments.length > 0 &&
                                    !calcSaltOrderPendingAmount(
                                        props.data
                                    ).isZero() &&
                                    calcSaltOrderPendingAmount(
                                        props.data
                                    ).lessThan(1))) && (
                                <tr>
                                    <th colSpan={3}>Write-Off</th>
                                    <th>
                                        {props.data.writeOff.isZero() ? (
                                            <Button
                                                onClick={() =>
                                                    props.dispatch({
                                                        type: "WRITE_OFF_ORDER",
                                                    })
                                                }
                                                disabled={!props.status.mutable}
                                            >
                                                Write Off Pending
                                            </Button>
                                        ) : (
                                            <widgets.writeOff />
                                        )}
                                    </th>
                                </tr>
                            )}
                            <tr>
                                <th colSpan={3}>Pending</th>
                                <th>
                                    <MoneyStatic
                                        value={calcSaltOrderPendingAmount(
                                            props.data
                                        )}
                                    />
                                </th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <SaveDeleteButton noun="Order">
                {props.data.cancelled ? (
                    <SaveButton
                        label="Uncancel & Save Order"
                        icon={faBan}
                        preSave={() => {
                            props.dispatch({
                                type: "UNCANCEL_ORDER",
                            });
                        }}
                    />
                ) : (
                    <SaveButton
                        label="Cancel Order"
                        disabled={
                            props.data.deliveredDate != null ||
                            props.data.invoicedDate != null
                        }
                        icon={faBan}
                        preSave={() => {
                            props.dispatch({
                                type: "CANCEL_ORDER",
                            });
                        }}
                    />
                )}
            </SaveDeleteButton>
        </>
    );
}

function validate(data: SaltOrder, cache: QuickCacheApi) {
    const basicErrors = baseValidate(data, cache);
    if (basicErrors.length === 0) {
        const errors: ValidationError[] = [];

        if (
            data.deliveredBy !== "" ||
            data.deliveredDate !== null ||
            data.invoicedDate !== null ||
            data.payments.length !== 0
        ) {
            if (data.deliveredBy === "") {
                errors.push({
                    empty: true,
                    invalid: false,
                    field: "deliveredBy",
                });
            }
            if (data.deliveredDate === null) {
                errors.push({
                    empty: true,
                    invalid: false,
                    field: "deliveredDate",
                });
            }
        }
        if (data.payments.length !== 0) {
            if (data.invoicedDate === null) {
                errors.push({
                    empty: true,
                    invalid: false,
                    field: "invoicedDate",
                });
            }
        }
        return errors;
    } else {
        return basicErrors;
    }
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.deliveredBy> &
    WidgetContext<typeof Fields.deliveredDate> &
    WidgetContext<typeof Fields.invoicedDate> &
    WidgetContext<typeof Fields.payments> &
    WidgetContext<typeof Fields.writeOff>;
type ExtraProps = {};
type BaseState = {
    deliveredBy: WidgetState<typeof Fields.deliveredBy>;
    deliveredDate: WidgetState<typeof Fields.deliveredDate>;
    invoicedDate: WidgetState<typeof Fields.invoicedDate>;
    payments: WidgetState<typeof Fields.payments>;
    writeOff: WidgetState<typeof Fields.writeOff>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "DELIVERED_BY"; action: WidgetAction<typeof Fields.deliveredBy> }
    | {
          type: "DELIVERED_DATE";
          action: WidgetAction<typeof Fields.deliveredDate>;
      }
    | {
          type: "INVOICED_DATE";
          action: WidgetAction<typeof Fields.invoicedDate>;
      }
    | { type: "PAYMENTS"; action: WidgetAction<typeof Fields.payments> }
    | { type: "WRITE_OFF"; action: WidgetAction<typeof Fields.writeOff> };

export type Action = ExtraActions | BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.deliveredBy,
        data.deliveredBy,
        cache,
        "deliveredBy",
        errors
    );
    subvalidate(
        Fields.deliveredDate,
        data.deliveredDate,
        cache,
        "deliveredDate",
        errors
    );
    subvalidate(
        Fields.invoicedDate,
        data.invoicedDate,
        cache,
        "invoicedDate",
        errors
    );
    subvalidate(Fields.payments, data.payments, cache, "payments", errors);
    subvalidate(Fields.writeOff, data.writeOff, cache, "writeOff", errors);
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
        case "DELIVERED_BY": {
            const inner = Fields.deliveredBy.reduce(
                state.deliveredBy,
                data.deliveredBy,
                action.action,
                subcontext
            );
            return {
                state: { ...state, deliveredBy: inner.state },
                data: { ...data, deliveredBy: inner.data },
            };
        }
        case "DELIVERED_DATE": {
            const inner = Fields.deliveredDate.reduce(
                state.deliveredDate,
                data.deliveredDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, deliveredDate: inner.state },
                data: { ...data, deliveredDate: inner.data },
            };
        }
        case "INVOICED_DATE": {
            const inner = Fields.invoicedDate.reduce(
                state.invoicedDate,
                data.invoicedDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, invoicedDate: inner.state },
                data: { ...data, invoicedDate: inner.data },
            };
        }
        case "PAYMENTS": {
            const inner = Fields.payments.reduce(
                state.payments,
                data.payments,
                action.action,
                subcontext
            );
            return {
                state: { ...state, payments: inner.state },
                data: { ...data, payments: inner.data },
            };
        }
        case "WRITE_OFF": {
            const inner = Fields.writeOff.reduce(
                state.writeOff,
                data.writeOff,
                action.action,
                subcontext
            );
            return {
                state: { ...state, writeOff: inner.state },
                data: { ...data, writeOff: inner.data },
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
    deliveredBy: function (
        props: WidgetExtraProps<typeof Fields.deliveredBy> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DELIVERED_BY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "deliveredBy", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.deliveredBy.component
                state={context.state.deliveredBy}
                data={context.data.deliveredBy}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Delivered By"}
            />
        );
    },
    deliveredDate: function (
        props: WidgetExtraProps<typeof Fields.deliveredDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DELIVERED_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "deliveredDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.deliveredDate.component
                state={context.state.deliveredDate}
                data={context.data.deliveredDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Delivered Date"}
            />
        );
    },
    invoicedDate: function (
        props: WidgetExtraProps<typeof Fields.invoicedDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INVOICED_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "invoicedDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.invoicedDate.component
                state={context.state.invoicedDate}
                data={context.data.invoicedDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Invoiced Date"}
            />
        );
    },
    payments: function (
        props: WidgetExtraProps<typeof Fields.payments> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PAYMENTS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "payments", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.payments.component
                state={context.state.payments}
                data={context.data.payments}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Payments"}
            />
        );
    },
    writeOff: function (
        props: WidgetExtraProps<typeof Fields.writeOff> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "WRITE_OFF",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "writeOff", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.writeOff.component
                state={context.state.writeOff}
                data={context.data.writeOff}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Write Off"}
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
        let deliveredByState;
        {
            const inner = Fields.deliveredBy.initialize(
                data.deliveredBy,
                subcontext,
                subparameters.deliveredBy
            );
            deliveredByState = inner.state;
            data = { ...data, deliveredBy: inner.data };
        }
        let deliveredDateState;
        {
            const inner = Fields.deliveredDate.initialize(
                data.deliveredDate,
                subcontext,
                subparameters.deliveredDate
            );
            deliveredDateState = inner.state;
            data = { ...data, deliveredDate: inner.data };
        }
        let invoicedDateState;
        {
            const inner = Fields.invoicedDate.initialize(
                data.invoicedDate,
                subcontext,
                subparameters.invoicedDate
            );
            invoicedDateState = inner.state;
            data = { ...data, invoicedDate: inner.data };
        }
        let paymentsState;
        {
            const inner = Fields.payments.initialize(
                data.payments,
                subcontext,
                subparameters.payments
            );
            paymentsState = inner.state;
            data = { ...data, payments: inner.data };
        }
        let writeOffState;
        {
            const inner = Fields.writeOff.initialize(
                data.writeOff,
                subcontext,
                subparameters.writeOff
            );
            writeOffState = inner.state;
            data = { ...data, writeOff: inner.data };
        }
        let state = {
            initialParameters: parameters,
            deliveredBy: deliveredByState,
            deliveredDate: deliveredDateState,
            invoicedDate: invoicedDateState,
            payments: paymentsState,
            writeOff: writeOffState,
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
    reduce: reduce,
};
export default Widget;
type Widgets = {
    deliveredBy: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.deliveredBy>
    >;
    deliveredDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.deliveredDate>
    >;
    invoicedDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.invoicedDate>
    >;
    payments: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.payments>
    >;
    writeOff: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.writeOff>
    >;
};
// END MAGIC -- DO NOT EDIT
