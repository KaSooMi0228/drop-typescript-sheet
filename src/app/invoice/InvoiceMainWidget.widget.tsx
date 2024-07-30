import { Decimal } from "decimal.js";
import { css } from "glamor";
import * as React from "react";
import { Table } from "react-bootstrap";
import ReactSwitch from "react-switch";
import { Dictionary } from "../../clay/common";
import { DeleteButton } from "../../clay/delete-button";
import { GenerateButton } from "../../clay/generate-button";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../clay/quick-cache";
import {
    RecordWidget,
    subStatus,
    subvalidate,
    useRecordContext,
    ValidationError,
    WidgetAction,
    WidgetContext,
    WidgetExtraProps,
    WidgetProps,
    WidgetResult,
    WidgetState,
    WidgetStatus,
} from "../../clay/widgets";
import { StaticDateTimeWidget } from "../../clay/widgets/DateTimeWidget";
import {
    FormField,
    FormWrapper,
    OptionalFormField,
} from "../../clay/widgets/FormField";
import { RecordContext, Widget } from "../../clay/widgets/index";
import { FieldRow } from "../../clay/widgets/layout";
import { duplicateIndex, ListWidget } from "../../clay/widgets/ListWidget";
import { MoneyStatic } from "../../clay/widgets/money-widget";
import { PercentageStatic } from "../../clay/widgets/percentage-widget";
import { SelectWidget } from "../../clay/widgets/SelectWidget";
import { StaticListWidget } from "../../clay/widgets/StaticListWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import ExportableTable from "../../ExportableTable";
import { TermLinkWidget } from "../../terms";
import { TERM_META } from "../../terms/table";
import { COMPANY_META } from "../company/table";
import { SelectContactWidget } from "../contact/select-contact-widget";
import { useLocalFieldWidget } from "../inbox/useLocalWidget";
import { ReactContext as ProjectInvoicesWidgetReactContext } from "../project/ProjectInvoicesWidget.widget";
import {
    getFiscalYear,
    projectIsFromPreviousFiscalYear,
    PROJECT_META,
} from "../project/table";
import { RichTextWidget } from "../rich-text-widget";
import { useUser } from "../state";
import { CONTENT_AREA } from "../styles";
import InvoiceContingencyItemWidget from "./InvoiceContingencyItemWidget.widget";
import InvoiceOptionWidget from "./InvoiceOptionWidget.widget";
import {
    calcInvoiceAmountTotal,
    calcInvoiceContingencyItemsTotal,
    calcInvoiceContractTotal,
    calcInvoiceGst,
    calcInvoiceHoldback,
    calcInvoiceInvoicedTotal,
    calcInvoiceIsComplete,
    calcInvoiceNetClaim,
    calcInvoicePaymentRequested,
    Invoice,
    INVOICE_META,
} from "./table";

export type Data = Invoice;

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);

    if (data.engineered) {
        return errors;
    } else {
        return errors.filter((error) => error.field != "externalInvoiceNumber");
    }
}

export const Fields = {
    date: FormField(StaticDateTimeWidget),
    contact: FormField(SelectContactWidget),
    options: StaticListWidget(InvoiceOptionWidget),
    specialInstructions: OptionalFormField(RichTextWidget),
    term: FormField(TermLinkWidget),
    contingencyItems: ListWidget(InvoiceContingencyItemWidget, {
        emptyOk: true,
    }),
    externalInvoiceNumber: FormField(TextWidget),
};

function actionAddContingencyItem(state: State, data: Invoice, index: number) {
    return {
        state: {
            ...state,
            contingencyItems: {
                ...state.contingencyItems,
                items: duplicateIndex(state.contingencyItems.items, index),
            },
        },
        data: {
            ...data,
            contingencyItems: duplicateIndex(
                data.contingencyItems,
                index,
                (item) => ({
                    ...item,
                    quantity: new Decimal(0.0),
                    previousQuantity: new Decimal(0.0),
                    previousMoney: new Decimal(0.0),
                    description: "",
                })
            ),
        },
    };
}

const INVOICE_STYLE = css({
    "& input.decimal-widget": {
        maxWidth: "inherit",
    },
});

function Component(props: Props) {
    const project = useRecordContext(PROJECT_META);
    const invoiceContext = React.useContext(ProjectInvoicesWidgetReactContext)!;

    const company = useQuickRecord(
        COMPANY_META,
        props.data.contact.company.company
    );
    const targetTerms =
        company?.terms || "b18a5ef8-7098-4709-adc1-b2dc2ac8bef7";
    const targetTermsRecord = useQuickRecord(TERM_META, targetTerms);

    const user = useUser();

    React.useEffect(() => {
        if (
            props.status.mutable &&
            props.data.term != targetTerms &&
            targetTermsRecord !== undefined
        ) {
            props.dispatch({
                type: "TERM",
                action: {
                    type: "SET",
                    value: targetTermsRecord,
                },
            });
        }
    }, [
        props.status.mutable,
        props.data.term,
        props.dispatch,
        targetTerms,
        targetTermsRecord,
    ]);

    const maybeBackdate =
        projectIsFromPreviousFiscalYear(project) && props.data.date === null;
    const backdateYear = getFiscalYear(new Date()) - 1;

    const backdateWidget = useLocalFieldWidget(
        SelectWidget([
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ]),
        "",
        {}
    );

    const generateDisabled = maybeBackdate && backdateWidget.data === "";
    const generatilDetail =
        maybeBackdate && backdateWidget.data === "yes"
            ? "backdate-" + backdateYear
            : "";

    return (
        <>
            <div {...CONTENT_AREA} {...INVOICE_STYLE}>
                {" "}
                {props.data.engineered && <widgets.externalInvoiceNumber />}
                <widgets.date />
                <FieldRow>
                    <widgets.contact
                        label="Billing Contact"
                        contacts={invoiceContext.data.billingContacts}
                        readOnly={
                            invoiceContext.data.billingContacts.length == 1
                        }
                    />
                    <widgets.term label="Terms" readOnly={true} />
                </FieldRow>
                <ExportableTable name="Invoice Details">
                    <div
                        style={{
                            marginTop: "1em",
                            marginBottom: "1em",
                        }}
                    >
                        <table>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th
                                        style={{
                                            whiteSpace: "nowrap",
                                            width: "8em",
                                        }}
                                    >
                                        Change Order #
                                    </th>
                                    {props.data.engineered && (
                                        <th
                                            style={{
                                                whiteSpace: "nowrap",
                                                width: "8em",
                                            }}
                                        >
                                            External Change Order #
                                        </th>
                                    )}
                                    <th
                                        style={{
                                            textAlign: "center",
                                            width: "12em",
                                        }}
                                    >
                                        Total
                                    </th>
                                    <th
                                        style={{
                                            textAlign: "center",
                                            width: "6em",
                                        }}
                                    >
                                        Previously Invoiced
                                    </th>
                                    <th
                                        style={{
                                            textAlign: "center",
                                            width: "6em",
                                        }}
                                    >
                                        Completed
                                    </th>
                                    <th
                                        style={{
                                            textAlign: "center",
                                            width: "12em",
                                        }}
                                    >
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <widgets.options />
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th colSpan={props.data.engineered ? 3 : 2}>
                                        Total
                                    </th>
                                    <th>
                                        <MoneyStatic
                                            value={calcInvoiceContractTotal(
                                                props.data
                                            )}
                                        />
                                    </th>
                                    <th>
                                        <PercentageStatic
                                            value={props.data.previousTotal
                                                .dividedBy(
                                                    calcInvoiceContractTotal(
                                                        props.data
                                                    )
                                                )
                                                .toDecimalPlaces(2)}
                                        />
                                    </th>
                                    <th>
                                        <PercentageStatic
                                            value={calcInvoiceInvoicedTotal(
                                                props.data
                                            )
                                                .dividedBy(
                                                    calcInvoiceContractTotal(
                                                        props.data
                                                    )
                                                )
                                                .toDecimalPlaces(2)}
                                        />
                                    </th>
                                    <th>
                                        <MoneyStatic
                                            value={calcInvoiceInvoicedTotal(
                                                props.data
                                            )}
                                        />
                                    </th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    {props.data.contingencyItems.length > 0 && (
                        <Table>
                            <thead>
                                <th>Contingency Item</th>
                                {props.data.engineered && (
                                    <th style={{ width: "10em" }}>
                                        External Change Order #
                                    </th>
                                )}
                                <th style={{ width: "10em" }}>Quantity</th>
                                <th style={{ width: "10em" }}>
                                    Previous/Total
                                </th>
                                <th style={{ width: "10em" }}>Unit Type</th>
                                <th style={{ width: "10em" }}>Unit Rate</th>
                                <th style={{ width: "10em" }}>CF Rate</th>
                                <th style={{ width: "10em" }}>Total</th>
                            </thead>
                            <widgets.contingencyItems containerClass="tbody" />
                            <tfoot>
                                <tr>
                                    <th colSpan={6}>Total</th>
                                    <th>
                                        <MoneyStatic
                                            value={calcInvoiceContingencyItemsTotal(
                                                props.data
                                            )}
                                        />
                                    </th>
                                </tr>
                            </tfoot>
                        </Table>
                    )}
                </ExportableTable>
                <FieldRow>
                    <FormWrapper
                        label="Previously Invoiced"
                        style={{ maxWidth: "12em" }}
                    >
                        <MoneyStatic value={props.data.previousTotal} />
                    </FormWrapper>
                    <FormWrapper
                        label="Current Invoice Amount"
                        style={{ maxWidth: "12em" }}
                    >
                        <MoneyStatic
                            value={calcInvoiceAmountTotal(props.data)}
                        />
                    </FormWrapper>
                    <div />
                    <div />
                </FieldRow>
                <FieldRow>
                    <FormWrapper
                        label="Holdback on Current Invoice"
                        align="center"
                        style={{ maxWidth: "12em" }}
                    >
                        <MoneyStatic value={calcInvoiceHoldback(props.data)} />
                    </FormWrapper>
                    <FormWrapper
                        label="Current Net Claim"
                        align="center"
                        style={{ maxWidth: "12em" }}
                    >
                        <MoneyStatic value={calcInvoiceNetClaim(props.data)} />
                    </FormWrapper>
                    <FormWrapper
                        label="GST"
                        align="center"
                        style={{ maxWidth: "12em" }}
                    >
                        <MoneyStatic value={calcInvoiceGst(props.data)} />
                    </FormWrapper>
                    <FormWrapper
                        label="Payment Requested"
                        align="center"
                        style={{ maxWidth: "12em" }}
                    >
                        <MoneyStatic
                            value={calcInvoicePaymentRequested(props.data)}
                        />
                    </FormWrapper>
                </FieldRow>
                <widgets.specialInstructions />
                <FormWrapper label="Final Invoice">
                    <ReactSwitch
                        checked={calcInvoiceIsComplete(props.data)}
                        onChange={() => {}}
                        disabled={true}
                    />
                </FormWrapper>
            </div>
            {maybeBackdate && (
                <FormWrapper
                    label={
                        "Should this invoice be back-dated to " +
                        backdateYear +
                        "?"
                    }
                >
                    {backdateWidget.component}
                </FormWrapper>
            )}
            <div style={{ display: "flex" }}>
                <GenerateButton
                    label="Generate Invoice"
                    disabled={generateDisabled}
                    detail={generatilDetail}
                />
                <DeleteButton
                    label={
                        props.data.firstDate == null
                            ? "Cancel Invoice"
                            : "Delete Invoice"
                    }
                />
            </div>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.date> &
    WidgetContext<typeof Fields.contact> &
    WidgetContext<typeof Fields.options> &
    WidgetContext<typeof Fields.specialInstructions> &
    WidgetContext<typeof Fields.term> &
    WidgetContext<typeof Fields.contingencyItems> &
    WidgetContext<typeof Fields.externalInvoiceNumber>;
type ExtraProps = {};
type BaseState = {
    date: WidgetState<typeof Fields.date>;
    contact: WidgetState<typeof Fields.contact>;
    options: WidgetState<typeof Fields.options>;
    specialInstructions: WidgetState<typeof Fields.specialInstructions>;
    term: WidgetState<typeof Fields.term>;
    contingencyItems: WidgetState<typeof Fields.contingencyItems>;
    externalInvoiceNumber: WidgetState<typeof Fields.externalInvoiceNumber>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "DATE"; action: WidgetAction<typeof Fields.date> }
    | { type: "CONTACT"; action: WidgetAction<typeof Fields.contact> }
    | { type: "OPTIONS"; action: WidgetAction<typeof Fields.options> }
    | {
          type: "SPECIAL_INSTRUCTIONS";
          action: WidgetAction<typeof Fields.specialInstructions>;
      }
    | { type: "TERM"; action: WidgetAction<typeof Fields.term> }
    | {
          type: "CONTINGENCY_ITEMS";
          action: WidgetAction<typeof Fields.contingencyItems>;
      }
    | {
          type: "EXTERNAL_INVOICE_NUMBER";
          action: WidgetAction<typeof Fields.externalInvoiceNumber>;
      }
    | { type: "ADD_CONTINGENCY_ITEM"; index: number };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.date, data.date, cache, "date", errors);
    subvalidate(Fields.contact, data.contact, cache, "contact", errors);
    subvalidate(Fields.options, data.options, cache, "options", errors);
    subvalidate(
        Fields.specialInstructions,
        data.specialInstructions,
        cache,
        "specialInstructions",
        errors
    );
    subvalidate(Fields.term, data.term, cache, "term", errors);
    subvalidate(
        Fields.contingencyItems,
        data.contingencyItems,
        cache,
        "contingencyItems",
        errors
    );
    subvalidate(
        Fields.externalInvoiceNumber,
        data.externalInvoiceNumber,
        cache,
        "externalInvoiceNumber",
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
        case "DATE": {
            const inner = Fields.date.reduce(
                state.date,
                data.date,
                action.action,
                subcontext
            );
            return {
                state: { ...state, date: inner.state },
                data: { ...data, date: inner.data },
            };
        }
        case "CONTACT": {
            const inner = Fields.contact.reduce(
                state.contact,
                data.contact,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contact: inner.state },
                data: { ...data, contact: inner.data },
            };
        }
        case "OPTIONS": {
            const inner = Fields.options.reduce(
                state.options,
                data.options,
                action.action,
                subcontext
            );
            return {
                state: { ...state, options: inner.state },
                data: { ...data, options: inner.data },
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
        case "TERM": {
            const inner = Fields.term.reduce(
                state.term,
                data.term,
                action.action,
                subcontext
            );
            return {
                state: { ...state, term: inner.state },
                data: { ...data, term: inner.data },
            };
        }
        case "CONTINGENCY_ITEMS": {
            const inner = Fields.contingencyItems.reduce(
                state.contingencyItems,
                data.contingencyItems,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contingencyItems: inner.state },
                data: { ...data, contingencyItems: inner.data },
            };
        }
        case "EXTERNAL_INVOICE_NUMBER": {
            const inner = Fields.externalInvoiceNumber.reduce(
                state.externalInvoiceNumber,
                data.externalInvoiceNumber,
                action.action,
                subcontext
            );
            return {
                state: { ...state, externalInvoiceNumber: inner.state },
                data: { ...data, externalInvoiceNumber: inner.data },
            };
        }
        case "ADD_CONTINGENCY_ITEM":
            return actionAddContingencyItem(state, data, action.index);
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
    date: function (
        props: WidgetExtraProps<typeof Fields.date> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "DATE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "date", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.date.component
                state={context.state.date}
                data={context.data.date}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Date"}
            />
        );
    },
    contact: function (
        props: WidgetExtraProps<typeof Fields.contact> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTACT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "contact", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contact.component
                state={context.state.contact}
                data={context.data.contact}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contact"}
            />
        );
    },
    options: function (
        props: WidgetExtraProps<typeof Fields.options> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "OPTIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "options", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.options.component
                state={context.state.options}
                data={context.data.options}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Options"}
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
    term: function (
        props: WidgetExtraProps<typeof Fields.term> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "TERM", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "term", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.term.component
                state={context.state.term}
                data={context.data.term}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Term"}
            />
        );
    },
    contingencyItems: function (
        props: WidgetExtraProps<typeof Fields.contingencyItems> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTINGENCY_ITEMS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "contingencyItems", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contingencyItems.component
                state={context.state.contingencyItems}
                data={context.data.contingencyItems}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contingency Items"}
            />
        );
    },
    externalInvoiceNumber: function (
        props: WidgetExtraProps<typeof Fields.externalInvoiceNumber> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "EXTERNAL_INVOICE_NUMBER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "externalInvoiceNumber",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.externalInvoiceNumber.component
                state={context.state.externalInvoiceNumber}
                data={context.data.externalInvoiceNumber}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "External Invoice Number"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: INVOICE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let dateState;
        {
            const inner = Fields.date.initialize(
                data.date,
                subcontext,
                subparameters.date
            );
            dateState = inner.state;
            data = { ...data, date: inner.data };
        }
        let contactState;
        {
            const inner = Fields.contact.initialize(
                data.contact,
                subcontext,
                subparameters.contact
            );
            contactState = inner.state;
            data = { ...data, contact: inner.data };
        }
        let optionsState;
        {
            const inner = Fields.options.initialize(
                data.options,
                subcontext,
                subparameters.options
            );
            optionsState = inner.state;
            data = { ...data, options: inner.data };
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
        let termState;
        {
            const inner = Fields.term.initialize(
                data.term,
                subcontext,
                subparameters.term
            );
            termState = inner.state;
            data = { ...data, term: inner.data };
        }
        let contingencyItemsState;
        {
            const inner = Fields.contingencyItems.initialize(
                data.contingencyItems,
                subcontext,
                subparameters.contingencyItems
            );
            contingencyItemsState = inner.state;
            data = { ...data, contingencyItems: inner.data };
        }
        let externalInvoiceNumberState;
        {
            const inner = Fields.externalInvoiceNumber.initialize(
                data.externalInvoiceNumber,
                subcontext,
                subparameters.externalInvoiceNumber
            );
            externalInvoiceNumberState = inner.state;
            data = { ...data, externalInvoiceNumber: inner.data };
        }
        let state = {
            initialParameters: parameters,
            date: dateState,
            contact: contactState,
            options: optionsState,
            specialInstructions: specialInstructionsState,
            term: termState,
            contingencyItems: contingencyItemsState,
            externalInvoiceNumber: externalInvoiceNumberState,
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
                <RecordContext meta={INVOICE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    date: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.date>
    >;
    contact: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contact>
    >;
    options: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.options>
    >;
    specialInstructions: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.specialInstructions>
    >;
    term: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.term>
    >;
    contingencyItems: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contingencyItems>
    >;
    externalInvoiceNumber: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.externalInvoiceNumber>
    >;
};
// END MAGIC -- DO NOT EDIT
