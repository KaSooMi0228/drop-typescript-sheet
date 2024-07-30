import Decimal from "decimal.js";
import * as React from "react";
import { Table } from "react-bootstrap";
import { Dictionary, Money } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { sumMap } from "../../clay/queryFuncs";
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
import { ListWidget } from "../../clay/widgets/ListWidget";
import { MoneyStatic } from "../../clay/widgets/money-widget";
import { PayoutPercentageWidget } from "./payout-percentage-widget";
import PayoutExpenseWidget from "./PayoutExpenseWidget.widget";
import { usePreviousPayouts } from "./previous-payouts";
import {
    calcPayoutAmountTotal,
    calcPayoutEmployeeProfitShare,
    calcPayoutExpensesTotal,
    calcPayoutHrPayrollSafetyAdmin,
    calcPayoutTotalNonCertifiedForemanExpenses,
    Payout,
    PAYOUT_META,
} from "./table";

export type Data = Payout;

export const Fields = {
    expenses: ListWidget(PayoutExpenseWidget, { emptyOk: true }),
    employeeProfitShare: PayoutPercentageWidget,
};

export function actionFinalize(state: State, data: Payout) {
    return {
        state,
        data: {
            ...data,
            date: data.date || new Date(),
        },
    };
}

function Component(props: Props) {
    const previousPayouts = usePreviousPayouts();

    const hasPreviousPayouts = previousPayouts.length > 0;

    function cells(
        f: (payout: Payout) => Money,
        style: React.CSSProperties,
        widget: React.ReactElement | null
    ) {
        const current = f(props.data);
        const previous = sumMap(previousPayouts, f);
        return (
            <>
                <td style={{ width: "12em" }}>
                    {widget || <MoneyStatic style={style} value={current} />}
                </td>
                {hasPreviousPayouts && (
                    <td style={{ width: "12em" }}>
                        <MoneyStatic style={style} value={previous} />
                    </td>
                )}
                {hasPreviousPayouts && (
                    <td style={{ width: "12em" }}>
                        <MoneyStatic
                            style={style}
                            value={previous.plus(current)}
                        />
                    </td>
                )}
            </>
        );
    }
    return (
        <>
            <Table>
                {hasPreviousPayouts && (
                    <thead>
                        <tr>
                            <th />
                            <th />
                            <th>Current Payout</th>
                            <th>Previous Payouts</th>
                            <th>Total Project to Date</th>
                        </tr>
                    </thead>
                )}

                <tbody>
                    <tr>
                        <td style={{ width: "1em" }} />
                        <td style={{ fontWeight: "bold" }}>
                            Total Revenue from Job Cost Report
                        </td>
                        {cells(calcPayoutAmountTotal, {}, null)}
                    </tr>
                    <tr>
                        <th />
                        <th style={{ fontWeight: "bold" }}>
                            Expenses not attributable to CF
                        </th>
                        <th style={{ fontWeight: "bold" }}>Cost</th>
                    </tr>
                </tbody>
                <widgets.expenses extraItemForAdd containerClass="tbody" />
                <tbody>
                    <tr>
                        <th />
                        <th>Total</th>
                        {cells(calcPayoutExpensesTotal, {}, null)}
                    </tr>
                    <tr>
                        <th />
                        <th>Office Deductions</th>
                    </tr>
                    <tr>
                        <td />
                        <td>HR/Payroll/Safety Admin</td>
                        {cells(
                            calcPayoutHrPayrollSafetyAdmin,
                            { color: "red" },
                            null
                        )}
                    </tr>
                    <tr>
                        <td />
                        <td>
                            <widgets.employeeProfitShare
                                permission="override-employee-profit-share"
                                value={new Decimal("0.0075")}
                            />
                            Employee Profit Share
                        </td>
                        {cells(calcPayoutEmployeeProfitShare, {}, null)}
                    </tr>
                    <tr>
                        <td />
                        <th>Total Non-CF Expenses</th>
                        {cells(
                            calcPayoutTotalNonCertifiedForemanExpenses,
                            {},
                            null
                        )}
                    </tr>
                </tbody>
            </Table>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.expenses> &
    WidgetContext<typeof Fields.employeeProfitShare>;
type ExtraProps = {};
type BaseState = {
    expenses: WidgetState<typeof Fields.expenses>;
    employeeProfitShare: WidgetState<typeof Fields.employeeProfitShare>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "EXPENSES"; action: WidgetAction<typeof Fields.expenses> }
    | {
          type: "EMPLOYEE_PROFIT_SHARE";
          action: WidgetAction<typeof Fields.employeeProfitShare>;
      }
    | { type: "FINALIZE" };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.expenses, data.expenses, cache, "expenses", errors);
    subvalidate(
        Fields.employeeProfitShare,
        data.employeeProfitShare,
        cache,
        "employeeProfitShare",
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
        case "EXPENSES": {
            const inner = Fields.expenses.reduce(
                state.expenses,
                data.expenses,
                action.action,
                subcontext
            );
            return {
                state: { ...state, expenses: inner.state },
                data: { ...data, expenses: inner.data },
            };
        }
        case "EMPLOYEE_PROFIT_SHARE": {
            const inner = Fields.employeeProfitShare.reduce(
                state.employeeProfitShare,
                data.employeeProfitShare,
                action.action,
                subcontext
            );
            return {
                state: { ...state, employeeProfitShare: inner.state },
                data: { ...data, employeeProfitShare: inner.data },
            };
        }
        case "FINALIZE":
            return actionFinalize(state, data);
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
    expenses: function (
        props: WidgetExtraProps<typeof Fields.expenses> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "EXPENSES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "expenses", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.expenses.component
                state={context.state.expenses}
                data={context.data.expenses}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Expenses"}
            />
        );
    },
    employeeProfitShare: function (
        props: WidgetExtraProps<typeof Fields.employeeProfitShare> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "EMPLOYEE_PROFIT_SHARE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "employeeProfitShare",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.employeeProfitShare.component
                state={context.state.employeeProfitShare}
                data={context.data.employeeProfitShare}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Employee Profit Share"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PAYOUT_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let expensesState;
        {
            const inner = Fields.expenses.initialize(
                data.expenses,
                subcontext,
                subparameters.expenses
            );
            expensesState = inner.state;
            data = { ...data, expenses: inner.data };
        }
        let employeeProfitShareState;
        {
            const inner = Fields.employeeProfitShare.initialize(
                data.employeeProfitShare,
                subcontext,
                subparameters.employeeProfitShare
            );
            employeeProfitShareState = inner.state;
            data = { ...data, employeeProfitShare: inner.data };
        }
        let state = {
            initialParameters: parameters,
            expenses: expensesState,
            employeeProfitShare: employeeProfitShareState,
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
                <RecordContext meta={PAYOUT_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    expenses: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.expenses>
    >;
    employeeProfitShare: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.employeeProfitShare>
    >;
};
// END MAGIC -- DO NOT EDIT
