import React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../clay/quick-cache";
import { Optional } from "../../clay/widgets/FormField";
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
import { MoneyStatic } from "../../clay/widgets/money-widget";
import {
    PercentageStatic,
    PercentageWidget,
} from "../../clay/widgets/percentage-widget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { ReactContext as ProjectInvoicesWidgetReactContext } from "../project/ProjectInvoicesWidget.widget";
import { QUOTATION_META } from "../quotation/table";
import { ReactContext as InvoiceMainWidgetReactContext } from "./InvoiceMainWidget.widget";
import {
    calcInvoiceOptionAmount,
    InvoiceOption,
    INVOICE_OPTION_META,
} from "./table";

export type Data = InvoiceOption;

const Fields = {
    completed: Optional(PercentageWidget),
    externalChangeOrderNumber: Optional(TextWidget),
};

function Component(props: Props) {
    const projectContext = React.useContext(ProjectInvoicesWidgetReactContext)!;
    const invoiceContext = React.useContext(InvoiceMainWidgetReactContext)!;
    const quotation = useQuickRecord(
        QUOTATION_META,
        props.data.quotations.length == 1 ? props.data.quotations[0] : null
    );
    return (
        <tr>
            <td>
                {props.data.description}
                {quotation &&
                    ` as per quotation ${
                        projectContext.data.projectNumber
                    }-${quotation.number.toString()}`}
            </td>
            <td>
                {props.data.number.isZero()
                    ? "N/A"
                    : props.data.number.toString()}
            </td>
            {invoiceContext.data.engineered && (
                <td>
                    {props.data.number.isZero() ? (
                        <div />
                    ) : (
                        <widgets.externalChangeOrderNumber />
                    )}
                </td>
            )}
            <td>
                <MoneyStatic value={props.data.total} />
            </td>
            <td>
                <PercentageStatic value={props.data.previous} />
            </td>
            <td>
                <widgets.completed />
            </td>
            <td>
                <MoneyStatic value={calcInvoiceOptionAmount(props.data)} />
            </td>
        </tr>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.completed> &
    WidgetContext<typeof Fields.externalChangeOrderNumber>;
type ExtraProps = {};
type BaseState = {
    completed: WidgetState<typeof Fields.completed>;
    externalChangeOrderNumber: WidgetState<
        typeof Fields.externalChangeOrderNumber
    >;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "COMPLETED"; action: WidgetAction<typeof Fields.completed> }
    | {
          type: "EXTERNAL_CHANGE_ORDER_NUMBER";
          action: WidgetAction<typeof Fields.externalChangeOrderNumber>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.completed, data.completed, cache, "completed", errors);
    subvalidate(
        Fields.externalChangeOrderNumber,
        data.externalChangeOrderNumber,
        cache,
        "externalChangeOrderNumber",
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
        case "COMPLETED": {
            const inner = Fields.completed.reduce(
                state.completed,
                data.completed,
                action.action,
                subcontext
            );
            return {
                state: { ...state, completed: inner.state },
                data: { ...data, completed: inner.data },
            };
        }
        case "EXTERNAL_CHANGE_ORDER_NUMBER": {
            const inner = Fields.externalChangeOrderNumber.reduce(
                state.externalChangeOrderNumber,
                data.externalChangeOrderNumber,
                action.action,
                subcontext
            );
            return {
                state: { ...state, externalChangeOrderNumber: inner.state },
                data: { ...data, externalChangeOrderNumber: inner.data },
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
    completed: function (
        props: WidgetExtraProps<typeof Fields.completed> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMPLETED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "completed", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.completed.component
                state={context.state.completed}
                data={context.data.completed}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Completed"}
            />
        );
    },
    externalChangeOrderNumber: function (
        props: WidgetExtraProps<typeof Fields.externalChangeOrderNumber> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "EXTERNAL_CHANGE_ORDER_NUMBER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "externalChangeOrderNumber",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.externalChangeOrderNumber.component
                state={context.state.externalChangeOrderNumber}
                data={context.data.externalChangeOrderNumber}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "External Change Order Number"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: INVOICE_OPTION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let completedState;
        {
            const inner = Fields.completed.initialize(
                data.completed,
                subcontext,
                subparameters.completed
            );
            completedState = inner.state;
            data = { ...data, completed: inner.data };
        }
        let externalChangeOrderNumberState;
        {
            const inner = Fields.externalChangeOrderNumber.initialize(
                data.externalChangeOrderNumber,
                subcontext,
                subparameters.externalChangeOrderNumber
            );
            externalChangeOrderNumberState = inner.state;
            data = { ...data, externalChangeOrderNumber: inner.data };
        }
        let state = {
            initialParameters: parameters,
            completed: completedState,
            externalChangeOrderNumber: externalChangeOrderNumberState,
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
                <RecordContext meta={INVOICE_OPTION_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    completed: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.completed>
    >;
    externalChangeOrderNumber: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.externalChangeOrderNumber>
    >;
};
// END MAGIC -- DO NOT EDIT
