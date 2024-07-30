import { Decimal } from "decimal.js";
import { css } from "glamor";
import * as React from "react";
import { Table } from "react-bootstrap";
import { Dictionary, Money } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { sumMap } from "../../clay/queryFuncs";
import { QuickCacheApi } from "../../clay/quick-cache";
import { SaveButton } from "../../clay/save-button";
import { Optional } from "../../clay/widgets/FormField";
import {
    RecordContext,
    RecordWidget,
    subStatus,
    subvalidate,
    useRecordContext,
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
import { MoneyStatic, MoneyWidget } from "../../clay/widgets/money-widget";
import { PercentageStatic } from "../../clay/widgets/percentage-widget";
import { SelectBoolWidget } from "../../clay/widgets/SelectBoolWidget";
import { TextAreaWidget } from "../../clay/widgets/TextAreaWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { hasPermission } from "../../permissions";
import { useUser } from "../state";
import { CertifiedForemanLinkWidget } from "../user";
import { PayoutPercentageWidget } from "./payout-percentage-widget";
import { usePreviousPayouts } from "./previous-payouts";
import {
    calcPayoutCertifiedForemanBudgetAmountSubtotal,
    calcPayoutCertifiedForemanGst,
    calcPayoutCertifiedForemanProfitMargin,
    calcPayoutCertifiedForemanSubtotal,
    calcPayoutCertifiedForemanTaxHoldbackPayable,
    calcPayoutCertifiedForemanTotalBonus,
    calcPayoutCertifiedForemanTotalDeductions,
    calcPayoutCertifiedForemanTotalToCertifiedForeman,
    calcPayoutCertifiedForemanWarrantyFundContribution,
    Payout,
    PayoutCertifiedForeman,
    PAYOUT_CERTIFIED_FOREMAN_META,
    PAYOUT_META,
} from "./table";

function sd(a: Money, b: Money) {
    if (a.isZero()) {
        return new Decimal(0);
    } else {
        return a.dividedBy(b);
    }
}

export type Data = PayoutCertifiedForeman;

export const Fields = {
    certifiedForeman: CertifiedForemanLinkWidget,
    certifiedForemanExpenses: MoneyWidget,
    certifiedForemanExpensesNote: TextWidget,
    topUp: Optional(MoneyWidget),
    topUpDescription: TextAreaWidget,
    warrantyFundPercentage: PayoutPercentageWidget,
    progressPayoutFoundsAlreadyPaid: MoneyWidget,
    hasProgressPayout: SelectBoolWidget(
        "No Progress Payment",
        "Has Progress Payment"
    ),
};

export type ExtraProps = {
    payout: Payout;
};

function validate(data: Data, cache: QuickCacheApi) {
    let errors = baseValidate(data, cache);

    if (data.topUp.isZero()) {
        errors = errors.filter((error) => error.field !== "topUpDescription");
    }

    if (!data.hasProgressPayout) {
        errors = errors.filter(
            (error) => error.field !== "progressPayoutFoundsAlreadyPaid"
        );
    }

    if (!data.certifiedForemanExpenses.isZero()) {
        return errors.filter(
            (error) => error.field !== "certifiedForemanExpensesNote"
        );
    } else if (data.certifiedForemanExpensesNote !== "") {
        return errors.filter(
            (error) => error.field !== "certifiedForemanExpenses"
        );
    } else {
        return errors;
    }
}

const ROW_BELOW = css({
    "& td": {
        borderBottom: "solid 2px black",
        marginBottom: "1em",
    },
});

function Component(props: Props) {
    const payout = useRecordContext(PAYOUT_META);
    const previousPayouts = usePreviousPayouts();

    const hasPreviousPayouts = previousPayouts.length > 0;

    const previousPayoutCfs = previousPayouts.flatMap((payout) =>
        payout.certifiedForemen
            .filter((x) => x.certifiedForeman == props.data.certifiedForeman)
            .map((x) => ({ ...x, payout }))
    );

    function cells(
        f: (payout: Payout, cf: PayoutCertifiedForeman) => Money,
        style: React.CSSProperties,
        widget: React.ReactElement | null
    ) {
        const current = f(payout, props.data);
        const previous = sumMap(previousPayoutCfs, (x) => f(x.payout, x));
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

    const user = useUser();
    return (
        <>
            <div style={{ display: "flex", borderBottom: "solid 1px black" }}>
                <Table style={{ width: "auto" }}>
                    <thead>
                        <tr>
                            <th style={{ width: "15em" }}></th>
                            <th
                                style={{
                                    width: "15em",
                                }}
                            >
                                Contract Amount Subtotal
                            </th>
                            <th
                                style={{
                                    width: "12em",
                                }}
                            >
                                CF Profit Margin
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th>
                                <widgets.certifiedForeman readOnly />
                            </th>
                            <td>
                                <MoneyStatic
                                    style={{
                                        fontWeight: "bold",
                                    }}
                                    value={calcPayoutCertifiedForemanBudgetAmountSubtotal(
                                        props.data,
                                        props.payout
                                    )}
                                />
                            </td>
                            <td>
                                <PercentageStatic
                                    value={calcPayoutCertifiedForemanProfitMargin(
                                        props.data,
                                        props.payout
                                    )}
                                />
                            </td>
                        </tr>
                        {hasPreviousPayouts && (
                            <tr>
                                <th>Previous Payouts</th>
                                <td>
                                    <MoneyStatic
                                        style={{
                                            fontWeight: "bold",
                                        }}
                                        value={sumMap(previousPayoutCfs, (x) =>
                                            calcPayoutCertifiedForemanBudgetAmountSubtotal(
                                                x,
                                                x.payout
                                            )
                                        )}
                                    />
                                </td>
                                <td>
                                    <PercentageStatic
                                        value={sd(
                                            sumMap(previousPayoutCfs, (x) =>
                                                calcPayoutCertifiedForemanSubtotal(
                                                    x,
                                                    x.payout
                                                )
                                            ),
                                            sumMap(previousPayoutCfs, (x) =>
                                                calcPayoutCertifiedForemanBudgetAmountSubtotal(
                                                    x,
                                                    x.payout
                                                )
                                            )
                                        )}
                                    />
                                </td>
                            </tr>
                        )}
                        {hasPreviousPayouts && (
                            <tr>
                                <th>Total Project to Date</th>
                                <td>
                                    <MoneyStatic
                                        style={{
                                            fontWeight: "bold",
                                        }}
                                        value={sumMap(previousPayoutCfs, (x) =>
                                            calcPayoutCertifiedForemanBudgetAmountSubtotal(
                                                x,
                                                x.payout
                                            )
                                        ).plus(
                                            calcPayoutCertifiedForemanBudgetAmountSubtotal(
                                                props.data,
                                                payout
                                            )
                                        )}
                                    />
                                </td>
                                <td>
                                    <PercentageStatic
                                        value={sd(
                                            sumMap(previousPayoutCfs, (x) =>
                                                calcPayoutCertifiedForemanSubtotal(
                                                    x,
                                                    x.payout
                                                )
                                            ).plus(
                                                calcPayoutCertifiedForemanSubtotal(
                                                    props.data,
                                                    payout
                                                )
                                            ),
                                            sumMap(previousPayoutCfs, (x) =>
                                                calcPayoutCertifiedForemanBudgetAmountSubtotal(
                                                    x,
                                                    x.payout
                                                ).plus(
                                                    calcPayoutCertifiedForemanBudgetAmountSubtotal(
                                                        props.data,
                                                        payout
                                                    )
                                                )
                                            )
                                        )}
                                    />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
            <Table>
                {hasPreviousPayouts && (
                    <thead>
                        <tr>
                            <th />
                            <th>Current Payout</th>
                            <th>Previous Payouts</th>
                            <th>Total Project to Date</th>
                        </tr>
                    </thead>
                )}
                <tbody>
                    <tr>
                        <td style={{ display: "flex", whiteSpace: "nowrap" }}>
                            <div
                                style={{
                                    marginRight: "1em",
                                    alignSelf: "center",
                                }}
                            >
                                CF's Project Expenses
                            </div>
                            <widgets.certifiedForemanExpensesNote />
                        </td>
                        {cells(
                            (payout, cf) => cf.certifiedForemanExpenses,
                            { color: "red" },
                            <widgets.certifiedForemanExpenses />
                        )}
                    </tr>
                    <tr>
                        <td>
                            <widgets.warrantyFundPercentage
                                permission="override-warranty-fund"
                                value={new Decimal("0.02")}
                            />
                            CF's Warranty Fund Contribution
                        </td>

                        {cells(
                            (payout, cf) =>
                                calcPayoutCertifiedForemanWarrantyFundContribution(
                                    cf,
                                    payout
                                ),
                            { color: "red" },
                            null
                        )}
                    </tr>
                    <tr>
                        <td>Total Deductions</td>
                        {cells(
                            (payout, cf) =>
                                calcPayoutCertifiedForemanTotalDeductions(
                                    cf,
                                    payout
                                ),
                            { color: "red" },
                            null
                        )}
                    </tr>
                    <tr>
                        <td style={{ display: "flex", whiteSpace: "nowrap" }}>
                            <div
                                style={{
                                    marginRight: "1em",
                                    alignSelf: "center",
                                }}
                            >
                                Top Up
                            </div>
                            <widgets.topUpDescription />
                        </td>
                        {cells((payout, cf) => cf.topUp, {}, <widgets.topUp />)}
                    </tr>
                    <tr>
                        <td>Subtotal</td>

                        {cells(
                            (payout, cf) =>
                                calcPayoutCertifiedForemanSubtotal(cf, payout),
                            {},
                            null
                        )}
                    </tr>
                    <tr>
                        <td>Tax Holdback Payable</td>

                        {cells(
                            (payout, cf) =>
                                calcPayoutCertifiedForemanTaxHoldbackPayable(
                                    cf,
                                    payout
                                ),
                            {},
                            null
                        )}
                    </tr>
                    <tr>
                        <td>Total to be Paid to CF</td>
                        {cells(
                            (payout, cf) =>
                                calcPayoutCertifiedForemanTotalToCertifiedForeman(
                                    cf,
                                    payout
                                ),
                            {},
                            null
                        )}
                    </tr>
                    <tr>
                        <td>GST Payable to CF</td>

                        {cells(
                            (payout, cf) =>
                                calcPayoutCertifiedForemanGst(cf, payout),
                            {},
                            null
                        )}
                    </tr>
                    <tr>
                        <td>
                            Progress Payout Funds Already Paid
                            <div
                                style={{
                                    display: "inline-block",
                                    marginLeft: "1em",
                                }}
                            >
                                <widgets.hasProgressPayout />
                            </div>
                        </td>

                        {cells(
                            (payout, cf) => cf.progressPayoutFoundsAlreadyPaid,
                            {},
                            <widgets.progressPayoutFoundsAlreadyPaid />
                        )}
                    </tr>
                    <tr>
                        <td style={{ fontWeight: "bold" }}>Total Bonus</td>

                        {cells(
                            (payout, cf) =>
                                calcPayoutCertifiedForemanTotalBonus(
                                    cf,
                                    payout
                                ),
                            {},
                            null
                        )}
                    </tr>
                </tbody>
            </Table>
            {hasPermission(user, "Payout", "print-cf-payout") &&
                props.payout.addedToAccountingSoftware.date !== null && (
                    <SaveButton
                        printTemplate="certifiedForemanPayout"
                        printParameters={[props.data.certifiedForeman!]}
                        label={"Generate CF Payout"}
                    />
                )}
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.certifiedForeman> &
    WidgetContext<typeof Fields.certifiedForemanExpenses> &
    WidgetContext<typeof Fields.certifiedForemanExpensesNote> &
    WidgetContext<typeof Fields.topUp> &
    WidgetContext<typeof Fields.topUpDescription> &
    WidgetContext<typeof Fields.warrantyFundPercentage> &
    WidgetContext<typeof Fields.progressPayoutFoundsAlreadyPaid> &
    WidgetContext<typeof Fields.hasProgressPayout>;
type BaseState = {
    certifiedForeman: WidgetState<typeof Fields.certifiedForeman>;
    certifiedForemanExpenses: WidgetState<
        typeof Fields.certifiedForemanExpenses
    >;
    certifiedForemanExpensesNote: WidgetState<
        typeof Fields.certifiedForemanExpensesNote
    >;
    topUp: WidgetState<typeof Fields.topUp>;
    topUpDescription: WidgetState<typeof Fields.topUpDescription>;
    warrantyFundPercentage: WidgetState<typeof Fields.warrantyFundPercentage>;
    progressPayoutFoundsAlreadyPaid: WidgetState<
        typeof Fields.progressPayoutFoundsAlreadyPaid
    >;
    hasProgressPayout: WidgetState<typeof Fields.hasProgressPayout>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "CERTIFIED_FOREMAN";
          action: WidgetAction<typeof Fields.certifiedForeman>;
      }
    | {
          type: "CERTIFIED_FOREMAN_EXPENSES";
          action: WidgetAction<typeof Fields.certifiedForemanExpenses>;
      }
    | {
          type: "CERTIFIED_FOREMAN_EXPENSES_NOTE";
          action: WidgetAction<typeof Fields.certifiedForemanExpensesNote>;
      }
    | { type: "TOP_UP"; action: WidgetAction<typeof Fields.topUp> }
    | {
          type: "TOP_UP_DESCRIPTION";
          action: WidgetAction<typeof Fields.topUpDescription>;
      }
    | {
          type: "WARRANTY_FUND_PERCENTAGE";
          action: WidgetAction<typeof Fields.warrantyFundPercentage>;
      }
    | {
          type: "PROGRESS_PAYOUT_FOUNDS_ALREADY_PAID";
          action: WidgetAction<typeof Fields.progressPayoutFoundsAlreadyPaid>;
      }
    | {
          type: "HAS_PROGRESS_PAYOUT";
          action: WidgetAction<typeof Fields.hasProgressPayout>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.certifiedForeman,
        data.certifiedForeman,
        cache,
        "certifiedForeman",
        errors
    );
    subvalidate(
        Fields.certifiedForemanExpenses,
        data.certifiedForemanExpenses,
        cache,
        "certifiedForemanExpenses",
        errors
    );
    subvalidate(
        Fields.certifiedForemanExpensesNote,
        data.certifiedForemanExpensesNote,
        cache,
        "certifiedForemanExpensesNote",
        errors
    );
    subvalidate(Fields.topUp, data.topUp, cache, "topUp", errors);
    subvalidate(
        Fields.topUpDescription,
        data.topUpDescription,
        cache,
        "topUpDescription",
        errors
    );
    subvalidate(
        Fields.warrantyFundPercentage,
        data.warrantyFundPercentage,
        cache,
        "warrantyFundPercentage",
        errors
    );
    subvalidate(
        Fields.progressPayoutFoundsAlreadyPaid,
        data.progressPayoutFoundsAlreadyPaid,
        cache,
        "progressPayoutFoundsAlreadyPaid",
        errors
    );
    subvalidate(
        Fields.hasProgressPayout,
        data.hasProgressPayout,
        cache,
        "hasProgressPayout",
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
        case "CERTIFIED_FOREMAN": {
            const inner = Fields.certifiedForeman.reduce(
                state.certifiedForeman,
                data.certifiedForeman,
                action.action,
                subcontext
            );
            return {
                state: { ...state, certifiedForeman: inner.state },
                data: { ...data, certifiedForeman: inner.data },
            };
        }
        case "CERTIFIED_FOREMAN_EXPENSES": {
            const inner = Fields.certifiedForemanExpenses.reduce(
                state.certifiedForemanExpenses,
                data.certifiedForemanExpenses,
                action.action,
                subcontext
            );
            return {
                state: { ...state, certifiedForemanExpenses: inner.state },
                data: { ...data, certifiedForemanExpenses: inner.data },
            };
        }
        case "CERTIFIED_FOREMAN_EXPENSES_NOTE": {
            const inner = Fields.certifiedForemanExpensesNote.reduce(
                state.certifiedForemanExpensesNote,
                data.certifiedForemanExpensesNote,
                action.action,
                subcontext
            );
            return {
                state: { ...state, certifiedForemanExpensesNote: inner.state },
                data: { ...data, certifiedForemanExpensesNote: inner.data },
            };
        }
        case "TOP_UP": {
            const inner = Fields.topUp.reduce(
                state.topUp,
                data.topUp,
                action.action,
                subcontext
            );
            return {
                state: { ...state, topUp: inner.state },
                data: { ...data, topUp: inner.data },
            };
        }
        case "TOP_UP_DESCRIPTION": {
            const inner = Fields.topUpDescription.reduce(
                state.topUpDescription,
                data.topUpDescription,
                action.action,
                subcontext
            );
            return {
                state: { ...state, topUpDescription: inner.state },
                data: { ...data, topUpDescription: inner.data },
            };
        }
        case "WARRANTY_FUND_PERCENTAGE": {
            const inner = Fields.warrantyFundPercentage.reduce(
                state.warrantyFundPercentage,
                data.warrantyFundPercentage,
                action.action,
                subcontext
            );
            return {
                state: { ...state, warrantyFundPercentage: inner.state },
                data: { ...data, warrantyFundPercentage: inner.data },
            };
        }
        case "PROGRESS_PAYOUT_FOUNDS_ALREADY_PAID": {
            const inner = Fields.progressPayoutFoundsAlreadyPaid.reduce(
                state.progressPayoutFoundsAlreadyPaid,
                data.progressPayoutFoundsAlreadyPaid,
                action.action,
                subcontext
            );
            return {
                state: {
                    ...state,
                    progressPayoutFoundsAlreadyPaid: inner.state,
                },
                data: { ...data, progressPayoutFoundsAlreadyPaid: inner.data },
            };
        }
        case "HAS_PROGRESS_PAYOUT": {
            const inner = Fields.hasProgressPayout.reduce(
                state.hasProgressPayout,
                data.hasProgressPayout,
                action.action,
                subcontext
            );
            return {
                state: { ...state, hasProgressPayout: inner.state },
                data: { ...data, hasProgressPayout: inner.data },
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
    certifiedForeman: function (
        props: WidgetExtraProps<typeof Fields.certifiedForeman> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CERTIFIED_FOREMAN",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "certifiedForeman", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.certifiedForeman.component
                state={context.state.certifiedForeman}
                data={context.data.certifiedForeman}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Certified Foreman"}
            />
        );
    },
    certifiedForemanExpenses: function (
        props: WidgetExtraProps<typeof Fields.certifiedForemanExpenses> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CERTIFIED_FOREMAN_EXPENSES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "certifiedForemanExpenses",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.certifiedForemanExpenses.component
                state={context.state.certifiedForemanExpenses}
                data={context.data.certifiedForemanExpenses}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Certified Foreman Expenses"}
            />
        );
    },
    certifiedForemanExpensesNote: function (
        props: WidgetExtraProps<typeof Fields.certifiedForemanExpensesNote> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CERTIFIED_FOREMAN_EXPENSES_NOTE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "certifiedForemanExpensesNote",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.certifiedForemanExpensesNote.component
                state={context.state.certifiedForemanExpensesNote}
                data={context.data.certifiedForemanExpensesNote}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Certified Foreman Expenses Note"}
            />
        );
    },
    topUp: function (
        props: WidgetExtraProps<typeof Fields.topUp> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "TOP_UP",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "topUp", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.topUp.component
                state={context.state.topUp}
                data={context.data.topUp}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Top Up"}
            />
        );
    },
    topUpDescription: function (
        props: WidgetExtraProps<typeof Fields.topUpDescription> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "TOP_UP_DESCRIPTION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "topUpDescription", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.topUpDescription.component
                state={context.state.topUpDescription}
                data={context.data.topUpDescription}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Top up Description"}
            />
        );
    },
    warrantyFundPercentage: function (
        props: WidgetExtraProps<typeof Fields.warrantyFundPercentage> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "WARRANTY_FUND_PERCENTAGE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "warrantyFundPercentage",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.warrantyFundPercentage.component
                state={context.state.warrantyFundPercentage}
                data={context.data.warrantyFundPercentage}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Warranty Fund Percentage"}
            />
        );
    },
    progressPayoutFoundsAlreadyPaid: function (
        props: WidgetExtraProps<
            typeof Fields.progressPayoutFoundsAlreadyPaid
        > & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROGRESS_PAYOUT_FOUNDS_ALREADY_PAID",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "progressPayoutFoundsAlreadyPaid",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.progressPayoutFoundsAlreadyPaid.component
                state={context.state.progressPayoutFoundsAlreadyPaid}
                data={context.data.progressPayoutFoundsAlreadyPaid}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Progress Payout Founds Already Paid"}
            />
        );
    },
    hasProgressPayout: function (
        props: WidgetExtraProps<typeof Fields.hasProgressPayout> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "HAS_PROGRESS_PAYOUT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "hasProgressPayout",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.hasProgressPayout.component
                state={context.state.hasProgressPayout}
                data={context.data.hasProgressPayout}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Has Progress Payout"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PAYOUT_CERTIFIED_FOREMAN_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let certifiedForemanState;
        {
            const inner = Fields.certifiedForeman.initialize(
                data.certifiedForeman,
                subcontext,
                subparameters.certifiedForeman
            );
            certifiedForemanState = inner.state;
            data = { ...data, certifiedForeman: inner.data };
        }
        let certifiedForemanExpensesState;
        {
            const inner = Fields.certifiedForemanExpenses.initialize(
                data.certifiedForemanExpenses,
                subcontext,
                subparameters.certifiedForemanExpenses
            );
            certifiedForemanExpensesState = inner.state;
            data = { ...data, certifiedForemanExpenses: inner.data };
        }
        let certifiedForemanExpensesNoteState;
        {
            const inner = Fields.certifiedForemanExpensesNote.initialize(
                data.certifiedForemanExpensesNote,
                subcontext,
                subparameters.certifiedForemanExpensesNote
            );
            certifiedForemanExpensesNoteState = inner.state;
            data = { ...data, certifiedForemanExpensesNote: inner.data };
        }
        let topUpState;
        {
            const inner = Fields.topUp.initialize(
                data.topUp,
                subcontext,
                subparameters.topUp
            );
            topUpState = inner.state;
            data = { ...data, topUp: inner.data };
        }
        let topUpDescriptionState;
        {
            const inner = Fields.topUpDescription.initialize(
                data.topUpDescription,
                subcontext,
                subparameters.topUpDescription
            );
            topUpDescriptionState = inner.state;
            data = { ...data, topUpDescription: inner.data };
        }
        let warrantyFundPercentageState;
        {
            const inner = Fields.warrantyFundPercentage.initialize(
                data.warrantyFundPercentage,
                subcontext,
                subparameters.warrantyFundPercentage
            );
            warrantyFundPercentageState = inner.state;
            data = { ...data, warrantyFundPercentage: inner.data };
        }
        let progressPayoutFoundsAlreadyPaidState;
        {
            const inner = Fields.progressPayoutFoundsAlreadyPaid.initialize(
                data.progressPayoutFoundsAlreadyPaid,
                subcontext,
                subparameters.progressPayoutFoundsAlreadyPaid
            );
            progressPayoutFoundsAlreadyPaidState = inner.state;
            data = { ...data, progressPayoutFoundsAlreadyPaid: inner.data };
        }
        let hasProgressPayoutState;
        {
            const inner = Fields.hasProgressPayout.initialize(
                data.hasProgressPayout,
                subcontext,
                subparameters.hasProgressPayout
            );
            hasProgressPayoutState = inner.state;
            data = { ...data, hasProgressPayout: inner.data };
        }
        let state = {
            initialParameters: parameters,
            certifiedForeman: certifiedForemanState,
            certifiedForemanExpenses: certifiedForemanExpensesState,
            certifiedForemanExpensesNote: certifiedForemanExpensesNoteState,
            topUp: topUpState,
            topUpDescription: topUpDescriptionState,
            warrantyFundPercentage: warrantyFundPercentageState,
            progressPayoutFoundsAlreadyPaid:
                progressPayoutFoundsAlreadyPaidState,
            hasProgressPayout: hasProgressPayoutState,
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
                    meta={PAYOUT_CERTIFIED_FOREMAN_META}
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
    certifiedForeman: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.certifiedForeman>
    >;
    certifiedForemanExpenses: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.certifiedForemanExpenses>
    >;
    certifiedForemanExpensesNote: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.certifiedForemanExpensesNote>
    >;
    topUp: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.topUp>
    >;
    topUpDescription: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.topUpDescription>
    >;
    warrantyFundPercentage: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.warrantyFundPercentage>
    >;
    progressPayoutFoundsAlreadyPaid: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.progressPayoutFoundsAlreadyPaid>
    >;
    hasProgressPayout: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.hasProgressPayout>
    >;
};
// END MAGIC -- DO NOT EDIT
