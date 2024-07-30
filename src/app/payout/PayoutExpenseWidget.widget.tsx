import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
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
import { MoneyWidget } from "../../clay/widgets/money-widget";
import { BaseTableRow } from "../../clay/widgets/TableRow";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { PayoutExpense, PAYOUT_EXPENSE_META } from "./table";

export type Data = PayoutExpense;

export const Fields = {
    name: TextWidget,
    amount: MoneyWidget,
};

function Component(props: Props) {
    return (
        <BaseTableRow>
            <td>
                <widgets.name />
            </td>
            <td>
                <widgets.amount style={{ color: "red" }} />
            </td>
        </BaseTableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.amount>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    amount: WidgetState<typeof Fields.amount>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "AMOUNT"; action: WidgetAction<typeof Fields.amount> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.amount, data.amount, cache, "amount", errors);
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PAYOUT_EXPENSE_META,
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
        let state = {
            initialParameters: parameters,
            name: nameState,
            amount: amountState,
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
                <RecordContext meta={PAYOUT_EXPENSE_META} value={props.data}>
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
    amount: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.amount>
    >;
};
// END MAGIC -- DO NOT EDIT
