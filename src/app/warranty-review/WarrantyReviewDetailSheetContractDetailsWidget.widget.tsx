import * as React from "react";
import { Dictionary } from "../../clay/common";
import { GenerateButton } from "../../clay/generate-button";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { FormField, FormWrapper } from "../../clay/widgets/FormField";
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
import { MoneyWidget } from "../../clay/widgets/money-widget";
import { SelectWidget } from "../../clay/widgets/SelectWidget";
import { SimpleListWrapper } from "../../clay/widgets/SimpleListWrapper";
import { SwitchWidget } from "../../clay/widgets/SwitchWidget";
import { TextAreaWidget } from "../../clay/widgets/TextAreaWidget";
import { RichTextWidget } from "../rich-text-widget";
import {
    WarrantyReviewDetailSheet,
    WARRANTY_REVIEW_DETAIL_SHEET_META,
} from "./table";

type Data = WarrantyReviewDetailSheet;

const TextsWidget = ListWidget(SimpleListWrapper(TextAreaWidget), {
    emptyOk: true,
});

function validate(detailSheet: Data, cache: QuickCacheApi) {
    return baseValidate(detailSheet, cache).filter(
        (error) =>
            (error.field !== "cfPaymentAmount" ||
                detailSheet.cfPayment === "LumpSum") &&
            (error.field !== "nonWarrantyItems" ||
                detailSheet.hasNonWarrantyItems)
    );
}

const Fields = {
    paymentSource: SelectWidget([
        {
            value: "Remdal",
            label: "Remdal",
        },
        {
            value: "WarrantyFund",
            label: "Warranty Fund",
        },
    ]),
    cfPayment: SelectWidget([
        {
            value: "None",
            label: "None",
        },
        {
            value: "Hourly",
            label: "$50 per hour",
        },
        {
            value: "LumpSum",
            label: "Amount",
        },
    ]),
    cfPaymentAmount: MoneyWidget,
    nonWarrantyItems: RichTextWidget,
    hasNonWarrantyItems: FormField(SwitchWidget),
};

function Component(props: Props) {
    return (
        <>
            <FormWrapper label="Work Paid For By">
                <widgets.paymentSource />
            </FormWrapper>
            <FormWrapper label="CF Paid">
                <div style={{ display: "flex" }}>
                    <div style={{ flexGrow: 1 }}>
                        <widgets.cfPayment />
                    </div>

                    {props.data.cfPayment === "LumpSum" && (
                        <widgets.cfPaymentAmount />
                    )}
                </div>
            </FormWrapper>
            <widgets.hasNonWarrantyItems label="Are there any additional items to be completed as a T&M extra?" />
            {props.data.hasNonWarrantyItems && (
                <FormWrapper label="The following non-warranty item(s) will be billed to the customer at the completion of this work. CF is responsible to track labour and material costs for the item(s) detailed below:">
                    <widgets.nonWarrantyItems />
                </FormWrapper>
            )}

            <GenerateButton label="Generate Detail Sheet" />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.paymentSource> &
    WidgetContext<typeof Fields.cfPayment> &
    WidgetContext<typeof Fields.cfPaymentAmount> &
    WidgetContext<typeof Fields.nonWarrantyItems> &
    WidgetContext<typeof Fields.hasNonWarrantyItems>;
type ExtraProps = {};
type BaseState = {
    paymentSource: WidgetState<typeof Fields.paymentSource>;
    cfPayment: WidgetState<typeof Fields.cfPayment>;
    cfPaymentAmount: WidgetState<typeof Fields.cfPaymentAmount>;
    nonWarrantyItems: WidgetState<typeof Fields.nonWarrantyItems>;
    hasNonWarrantyItems: WidgetState<typeof Fields.hasNonWarrantyItems>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "PAYMENT_SOURCE";
          action: WidgetAction<typeof Fields.paymentSource>;
      }
    | { type: "CF_PAYMENT"; action: WidgetAction<typeof Fields.cfPayment> }
    | {
          type: "CF_PAYMENT_AMOUNT";
          action: WidgetAction<typeof Fields.cfPaymentAmount>;
      }
    | {
          type: "NON_WARRANTY_ITEMS";
          action: WidgetAction<typeof Fields.nonWarrantyItems>;
      }
    | {
          type: "HAS_NON_WARRANTY_ITEMS";
          action: WidgetAction<typeof Fields.hasNonWarrantyItems>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.paymentSource,
        data.paymentSource,
        cache,
        "paymentSource",
        errors
    );
    subvalidate(Fields.cfPayment, data.cfPayment, cache, "cfPayment", errors);
    subvalidate(
        Fields.cfPaymentAmount,
        data.cfPaymentAmount,
        cache,
        "cfPaymentAmount",
        errors
    );
    subvalidate(
        Fields.nonWarrantyItems,
        data.nonWarrantyItems,
        cache,
        "nonWarrantyItems",
        errors
    );
    subvalidate(
        Fields.hasNonWarrantyItems,
        data.hasNonWarrantyItems,
        cache,
        "hasNonWarrantyItems",
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
        case "PAYMENT_SOURCE": {
            const inner = Fields.paymentSource.reduce(
                state.paymentSource,
                data.paymentSource,
                action.action,
                subcontext
            );
            return {
                state: { ...state, paymentSource: inner.state },
                data: { ...data, paymentSource: inner.data },
            };
        }
        case "CF_PAYMENT": {
            const inner = Fields.cfPayment.reduce(
                state.cfPayment,
                data.cfPayment,
                action.action,
                subcontext
            );
            return {
                state: { ...state, cfPayment: inner.state },
                data: { ...data, cfPayment: inner.data },
            };
        }
        case "CF_PAYMENT_AMOUNT": {
            const inner = Fields.cfPaymentAmount.reduce(
                state.cfPaymentAmount,
                data.cfPaymentAmount,
                action.action,
                subcontext
            );
            return {
                state: { ...state, cfPaymentAmount: inner.state },
                data: { ...data, cfPaymentAmount: inner.data },
            };
        }
        case "NON_WARRANTY_ITEMS": {
            const inner = Fields.nonWarrantyItems.reduce(
                state.nonWarrantyItems,
                data.nonWarrantyItems,
                action.action,
                subcontext
            );
            return {
                state: { ...state, nonWarrantyItems: inner.state },
                data: { ...data, nonWarrantyItems: inner.data },
            };
        }
        case "HAS_NON_WARRANTY_ITEMS": {
            const inner = Fields.hasNonWarrantyItems.reduce(
                state.hasNonWarrantyItems,
                data.hasNonWarrantyItems,
                action.action,
                subcontext
            );
            return {
                state: { ...state, hasNonWarrantyItems: inner.state },
                data: { ...data, hasNonWarrantyItems: inner.data },
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
    paymentSource: function (
        props: WidgetExtraProps<typeof Fields.paymentSource> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PAYMENT_SOURCE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "paymentSource", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.paymentSource.component
                state={context.state.paymentSource}
                data={context.data.paymentSource}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Payment Source"}
            />
        );
    },
    cfPayment: function (
        props: WidgetExtraProps<typeof Fields.cfPayment> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CF_PAYMENT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "cfPayment", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.cfPayment.component
                state={context.state.cfPayment}
                data={context.data.cfPayment}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Cf Payment"}
            />
        );
    },
    cfPaymentAmount: function (
        props: WidgetExtraProps<typeof Fields.cfPaymentAmount> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CF_PAYMENT_AMOUNT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "cfPaymentAmount", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.cfPaymentAmount.component
                state={context.state.cfPaymentAmount}
                data={context.data.cfPaymentAmount}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Cf Payment Amount"}
            />
        );
    },
    nonWarrantyItems: function (
        props: WidgetExtraProps<typeof Fields.nonWarrantyItems> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "NON_WARRANTY_ITEMS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "nonWarrantyItems", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.nonWarrantyItems.component
                state={context.state.nonWarrantyItems}
                data={context.data.nonWarrantyItems}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Non Warranty Items"}
            />
        );
    },
    hasNonWarrantyItems: function (
        props: WidgetExtraProps<typeof Fields.hasNonWarrantyItems> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "HAS_NON_WARRANTY_ITEMS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "hasNonWarrantyItems",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.hasNonWarrantyItems.component
                state={context.state.hasNonWarrantyItems}
                data={context.data.hasNonWarrantyItems}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Has Non Warranty Items"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WARRANTY_REVIEW_DETAIL_SHEET_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let paymentSourceState;
        {
            const inner = Fields.paymentSource.initialize(
                data.paymentSource,
                subcontext,
                subparameters.paymentSource
            );
            paymentSourceState = inner.state;
            data = { ...data, paymentSource: inner.data };
        }
        let cfPaymentState;
        {
            const inner = Fields.cfPayment.initialize(
                data.cfPayment,
                subcontext,
                subparameters.cfPayment
            );
            cfPaymentState = inner.state;
            data = { ...data, cfPayment: inner.data };
        }
        let cfPaymentAmountState;
        {
            const inner = Fields.cfPaymentAmount.initialize(
                data.cfPaymentAmount,
                subcontext,
                subparameters.cfPaymentAmount
            );
            cfPaymentAmountState = inner.state;
            data = { ...data, cfPaymentAmount: inner.data };
        }
        let nonWarrantyItemsState;
        {
            const inner = Fields.nonWarrantyItems.initialize(
                data.nonWarrantyItems,
                subcontext,
                subparameters.nonWarrantyItems
            );
            nonWarrantyItemsState = inner.state;
            data = { ...data, nonWarrantyItems: inner.data };
        }
        let hasNonWarrantyItemsState;
        {
            const inner = Fields.hasNonWarrantyItems.initialize(
                data.hasNonWarrantyItems,
                subcontext,
                subparameters.hasNonWarrantyItems
            );
            hasNonWarrantyItemsState = inner.state;
            data = { ...data, hasNonWarrantyItems: inner.data };
        }
        let state = {
            initialParameters: parameters,
            paymentSource: paymentSourceState,
            cfPayment: cfPaymentState,
            cfPaymentAmount: cfPaymentAmountState,
            nonWarrantyItems: nonWarrantyItemsState,
            hasNonWarrantyItems: hasNonWarrantyItemsState,
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
                <RecordContext
                    meta={WARRANTY_REVIEW_DETAIL_SHEET_META}
                    value={props.data}
                >
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    paymentSource: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.paymentSource>
    >;
    cfPayment: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.cfPayment>
    >;
    cfPaymentAmount: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.cfPaymentAmount>
    >;
    nonWarrantyItems: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.nonWarrantyItems>
    >;
    hasNonWarrantyItems: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.hasNonWarrantyItems>
    >;
};
// END MAGIC -- DO NOT EDIT
