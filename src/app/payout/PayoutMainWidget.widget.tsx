import { css } from "glamor";
import { memoize, some } from "lodash";
import * as React from "react";
import { Dictionary } from "../../clay/common";
import { DeleteButton } from "../../clay/delete-button";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickCache } from "../../clay/quick-cache";
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
import { StaticListWidget } from "../../clay/widgets/StaticListWidget";
import { CONTENT_AREA, TABLE_FIXED } from "../styles";
import { USER_META } from "../user/table";
import PayoutCertifiedForemanWidget, {
    Action as PayoutCertifiedForemanWidgetAction,
    State as PayoutCertifiedForemanWidgetState,
} from "./PayoutCertifiedForemanWidget.widget";
import PayoutOptionWidget from "./PayoutOptionWidget.widget";
import {
    calcPayoutAmountAllTimeTotal,
    calcPayoutAmountPreviousTotal,
    calcPayoutAmountTotal,
    calcPayoutCertifiedForemanAllTimeAmountTotal,
    calcPayoutCertifiedForemanAmountTotal,
    calcPayoutCertifiedForemanPreviousAmountTotal,
    calcPayoutIsComplete,
    Payout,
    PAYOUT_META,
} from "./table";

export type Data = Payout;

export const Fields = {
    options: StaticListWidget(PayoutOptionWidget),
};

function Component(props: Props) {
    const cache = useQuickCache();
    const hasPreviousPayouts = some(
        props.data.options,
        (option) => !option.previous.isZero()
    );
    const isPartial = hasPreviousPayouts || !calcPayoutIsComplete(props.data);

    const tableStyle = css({
        width: "100%",
        "& td:nth-child(5),& th:nth-child(5)": {
            display: hasPreviousPayouts ? undefined : "none",
        },
        "& td:nth-child(6),& th:nth-child(6)": {
            display: isPartial ? undefined : "none",
        },
        maxWidth: isPartial ? undefined : "64em",
    });

    return (
        <>
            <div style={{ marginBottom: "1em" }}>
                <table {...tableStyle} {...TABLE_FIXED}>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th style={{ whiteSpace: "nowrap", width: "10em" }}>
                                Change Order #
                            </th>
                            <th style={{ textAlign: "center", width: "10em" }}>
                                Remdal Revenue
                            </th>
                            <th style={{ textAlign: "center", width: "10em" }}>
                                CF Contract
                            </th>
                            <th style={{ textAlign: "center", width: "10em" }}>
                                Previously Paid Out
                            </th>
                            <th style={{ textAlign: "center", width: "10em" }}>
                                Invoiced
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <widgets.options />
                        {props.data.certifiedForemen
                            .filter((x) => !x.topUp.isZero())
                            .map((x) => (
                                <tr>
                                    <td>
                                        CF Top-up Amount:{" "}
                                        {
                                            cache.get(
                                                USER_META,
                                                x.certifiedForeman
                                            )?.code
                                        }{" "}
                                        {
                                            cache.get(
                                                USER_META,
                                                x.certifiedForeman
                                            )?.name
                                        }
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td>
                                        <MoneyStatic value={x.topUp} />
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Total</th>
                            <th />
                            <th>
                                <MoneyStatic
                                    value={calcPayoutAmountTotal(props.data)}
                                />
                            </th>
                            <th>
                                <MoneyStatic
                                    value={calcPayoutCertifiedForemanAmountTotal(
                                        props.data
                                    )}
                                />
                            </th>
                            <th />
                            <th />
                        </tr>
                    </tfoot>
                </table>
            </div>
            {hasPreviousPayouts && (
                <div>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: "10em" }}></th>
                                <th
                                    style={{
                                        width: "10em",
                                        textAlign: "center",
                                    }}
                                >
                                    Remdal
                                </th>
                                <th
                                    style={{
                                        width: "10em",
                                        textAlign: "center",
                                    }}
                                >
                                    CF
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th>Total Project Revenue</th>
                                <td>
                                    <MoneyStatic
                                        value={calcPayoutAmountAllTimeTotal(
                                            props.data
                                        )}
                                    />
                                </td>
                                <td>
                                    <MoneyStatic
                                        value={calcPayoutCertifiedForemanAllTimeAmountTotal(
                                            props.data
                                        )}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <th>Previous Payout(s)</th>
                                <td>
                                    <MoneyStatic
                                        value={calcPayoutAmountPreviousTotal(
                                            props.data
                                        )}
                                    />
                                </td>
                                <td>
                                    <MoneyStatic
                                        value={calcPayoutCertifiedForemanPreviousAmountTotal(
                                            props.data
                                        )}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <th>Current Payout</th>
                                <td>
                                    <MoneyStatic
                                        value={calcPayoutAmountTotal(
                                            props.data
                                        )}
                                    />
                                </td>
                                <td>
                                    <MoneyStatic
                                        value={calcPayoutCertifiedForemanAmountTotal(
                                            props.data
                                        )}
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
            <DeleteButton label="Delete Payout" />
        </>
    );
}
function PayoutCFWidget(
    index: number
): RecordWidget<
    PayoutCertifiedForemanWidgetState,
    Payout,
    {},
    PayoutCertifiedForemanWidgetAction,
    {}
> {
    return {
        dataMeta: PAYOUT_META,
        reactContext: undefined as any,
        fieldWidgets: undefined as any,
        initialize(data: Payout, context) {
            const inner = PayoutCertifiedForemanWidget.initialize(
                data.certifiedForemen[index],
                context
            );
            const items = data.certifiedForemen.slice();
            items[index] = inner.data;
            return {
                data: {
                    ...data,
                    certifiedForemen: items,
                },
                state: inner.state,
            };
        },
        component(props) {
            return (
                <div {...CONTENT_AREA}>
                    <PayoutCertifiedForemanWidget.component
                        {...props}
                        payout={props.data}
                        data={props.data.certifiedForemen[index]}
                    />
                </div>
            );
        },
        reduce(state, data, action, context) {
            const inner = PayoutCertifiedForemanWidget.reduce(
                state,
                data.certifiedForemen[index],
                action,
                context
            );
            const items = data.certifiedForemen.slice();
            items[index] = inner.data;
            return {
                state: inner.state,
                data: {
                    ...data,
                    certifiedForemen: items,
                },
            };
        },
        validate(data, cache) {
            return PayoutCertifiedForemanWidget.validate(
                data.certifiedForemen[index],
                cache
            );
        },
    };
}

export const PayoutCFWidgetFactory = memoize(PayoutCFWidget);

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.options>;
type ExtraProps = {};
type BaseState = {
    options: WidgetState<typeof Fields.options>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "OPTIONS";
    action: WidgetAction<typeof Fields.options>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.options, data.options, cache, "options", errors);
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
        let state = {
            initialParameters: parameters,
            options: optionsState,
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
    options: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.options>
    >;
};
// END MAGIC -- DO NOT EDIT
