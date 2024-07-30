import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { RemoveButton } from "../../clay/remove-button";
import { DateWidget } from "../../clay/widgets/DateWidget";
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
import { useListItemContext } from "../../clay/widgets/ListWidget";
import { MoneyWidget } from "../../clay/widgets/money-widget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { SaltOrderPayment, SALT_ORDER_PAYMENT_META } from "./table";

export type Data = SaltOrderPayment;

export const Fields = {
    date: DateWidget,
    amount: MoneyWidget,
    chequeNumber: TextWidget,
};

function Component(props: Props) {
    const listItemContext = useListItemContext();

    return (
        <tr {...listItemContext.draggableProps}>
            <td>{listItemContext.dragHandle}</td>
            <td>
                <widgets.date />
            </td>
            <td>
                <widgets.amount />
            </td>
            <td>
                <widgets.chequeNumber />
            </td>
            <td>
                <RemoveButton />
            </td>
        </tr>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.date> &
    WidgetContext<typeof Fields.amount> &
    WidgetContext<typeof Fields.chequeNumber>;
type ExtraProps = {};
type BaseState = {
    date: WidgetState<typeof Fields.date>;
    amount: WidgetState<typeof Fields.amount>;
    chequeNumber: WidgetState<typeof Fields.chequeNumber>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "DATE"; action: WidgetAction<typeof Fields.date> }
    | { type: "AMOUNT"; action: WidgetAction<typeof Fields.amount> }
    | {
          type: "CHEQUE_NUMBER";
          action: WidgetAction<typeof Fields.chequeNumber>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.date, data.date, cache, "date", errors);
    subvalidate(Fields.amount, data.amount, cache, "amount", errors);
    subvalidate(
        Fields.chequeNumber,
        data.chequeNumber,
        cache,
        "chequeNumber",
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
        case "AMOUNT": {
            const inner = Fields.amount.reduce(
                state.amount,
                data.amount,
                action.action,
                subcontext
            );
            return {
                state: { ...state, amount: inner.state },
                data: { ...data, amount: inner.data },
            };
        }
        case "CHEQUE_NUMBER": {
            const inner = Fields.chequeNumber.reduce(
                state.chequeNumber,
                data.chequeNumber,
                action.action,
                subcontext
            );
            return {
                state: { ...state, chequeNumber: inner.state },
                data: { ...data, chequeNumber: inner.data },
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
    amount: function (
        props: WidgetExtraProps<typeof Fields.amount> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "AMOUNT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "amount", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.amount.component
                state={context.state.amount}
                data={context.data.amount}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Amount"}
            />
        );
    },
    chequeNumber: function (
        props: WidgetExtraProps<typeof Fields.chequeNumber> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CHEQUE_NUMBER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "chequeNumber", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.chequeNumber.component
                state={context.state.chequeNumber}
                data={context.data.chequeNumber}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Cheque Number"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: SALT_ORDER_PAYMENT_META,
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
        let amountState;
        {
            const inner = Fields.amount.initialize(
                data.amount,
                subcontext,
                subparameters.amount
            );
            amountState = inner.state;
            data = { ...data, amount: inner.data };
        }
        let chequeNumberState;
        {
            const inner = Fields.chequeNumber.initialize(
                data.chequeNumber,
                subcontext,
                subparameters.chequeNumber
            );
            chequeNumberState = inner.state;
            data = { ...data, chequeNumber: inner.data };
        }
        let state = {
            initialParameters: parameters,
            date: dateState,
            amount: amountState,
            chequeNumber: chequeNumberState,
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
                <RecordContext
                    meta={SALT_ORDER_PAYMENT_META}
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
    date: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.date>
    >;
    amount: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.amount>
    >;
    chequeNumber: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.chequeNumber>
    >;
};
// END MAGIC -- DO NOT EDIT
