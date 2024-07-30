import Decimal from "decimal.js";
import * as React from "react";
import { Button } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { SaveButton } from "../../clay/save-button";
import { CheckboxWidget } from "../../clay/widgets/CheckboxWidget";
import { Optional } from "../../clay/widgets/FormField";
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
import { MoneyStatic } from "../../clay/widgets/money-widget";
import {
    PercentageStatic,
    PercentageWidget,
} from "../../clay/widgets/percentage-widget";
import { hasPermission } from "../../permissions";
import { useUser } from "../state";
import { CONTENT_AREA, TABLE_STYLE } from "../styles";
import SaltOrderExtraWidget from "./SaltOrderExtraWidget.widget";
import SaltOrderLineWidget from "./SaltOrderLineWidget.widget";
import {
    calcSaltOrderDiscountAmount,
    calcSaltOrderGst,
    calcSaltOrderPreTaxTotal,
    calcSaltOrderPst,
    calcSaltOrderSubTotal,
    calcSaltOrderTotal,
    SaltOrder,
    SaltOrderLine,
    SALT_ORDER_META,
} from "./table";
import { LastOrderContext } from "./widget";

export type Data = SaltOrder;
export const Fields = {
    lines: ListWidget(SaltOrderLineWidget),
    extras: ListWidget(SaltOrderExtraWidget),
    discount: Optional(PercentageWidget),
    pstExempt: CheckboxWidget,
};

function validate(data: SaltOrder, cache: QuickCacheApi) {
    let errors = baseValidate(data, cache);

    return atLeastOneOf(errors, "lines", "extras");
}

type ExtraActions = {
    type: "COPY_ORDER_LINES";
    lines: SaltOrderLine[];
};

function reduce(
    state: State,
    data: SaltOrder,
    action: Action,
    context: Context
) {
    switch (action.type) {
        case "COPY_ORDER_LINES":
            const inner = Fields.lines.initialize(action.lines, context);
            return {
                state: {
                    ...state,
                    lines: inner.state,
                },
                data: {
                    ...data,
                    lines: inner.data,
                },
            };
        default:
            return baseReduce(state, data, action, context);
    }
}

function Component(props: Props) {
    const lastOrder = React.useContext(LastOrderContext);
    const user = useUser();
    const onCopyClick = React.useCallback(() => {
        lastOrder &&
            props.dispatch({
                type: "COPY_ORDER_LINES",
                lines: lastOrder.lines,
            });
    }, [props.dispatch, lastOrder && lastOrder.lines]);

    return (
        <>
            {lastOrder && lastOrder.lines && props.data.lines.length === 0 && (
                <Button onClick={onCopyClick}>Copy Last Order</Button>
            )}
            <div {...CONTENT_AREA}>
                <table {...TABLE_STYLE}>
                    <thead>
                        <tr>
                            <th style={{ width: "25px" }} />
                            <th style={{ width: "250px" }}>Product</th>
                            <th style={{ width: "125px" }}>Type</th>
                            <th style={{ width: "100px" }}>Quantity</th>
                            <th style={{ width: "150px" }}>Price</th>
                            <th style={{ width: "175px" }}>Total</th>
                            <th />
                        </tr>
                    </thead>
                    <widgets.lines
                        containerClass="tbody"
                        extraItemForAdd
                        readOnly={props.data.deliveredDate != null}
                    />
                    <tr>
                        <th />
                        <th colSpan={4}>Extras</th>
                    </tr>

                    <widgets.extras
                        containerClass="tbody"
                        extraItemForAdd
                        readOnly={props.data.deliveredDate != null}
                    />
                    <tfoot>
                        <tr>
                            <th />
                            <th>Subtotal</th>
                            <th />
                            <th />
                            <th />
                            <th>
                                <MoneyStatic
                                    value={calcSaltOrderSubTotal(props.data)}
                                />
                            </th>
                        </tr>
                        <tr>
                            <th />
                            <th>Discount</th>
                            <th />
                            <th />
                            <th>
                                <widgets.discount
                                    readOnly={props.data.deliveredDate !== null}
                                />
                            </th>
                            <th>
                                <MoneyStatic
                                    value={calcSaltOrderDiscountAmount(
                                        props.data
                                    ).negated()}
                                />
                            </th>
                        </tr>
                        <tr>
                            <th />
                            <th>Pre-Tax Total</th>
                            <th />
                            <th />
                            <th />
                            <th>
                                <MoneyStatic
                                    value={calcSaltOrderPreTaxTotal(props.data)}
                                />
                            </th>
                        </tr>
                        <tr>
                            <th />
                            <th>PST</th>
                            <th colSpan={2}>
                                <div style={{ display: "flex" }}>
                                    <widgets.pstExempt
                                        checkLabel="Exempt"
                                        readOnly={
                                            !hasPermission(
                                                user,
                                                "SaltOrder",
                                                "pst-exempt"
                                            )
                                        }
                                    />
                                </div>
                            </th>
                            <th>
                                <PercentageStatic value={new Decimal(0.07)} />
                            </th>
                            <th>
                                <MoneyStatic
                                    value={calcSaltOrderPst(props.data)}
                                />
                            </th>
                        </tr>
                        <tr>
                            <th />
                            <th>GST</th>
                            <th />
                            <th />
                            <th>
                                <PercentageStatic value={new Decimal(0.05)} />
                            </th>
                            <th>
                                <MoneyStatic
                                    value={calcSaltOrderGst(props.data)}
                                />
                            </th>
                        </tr>
                        <tr>
                            <th />
                            <th>Total</th>
                            <th />
                            <th />
                            <th />
                            <th>
                                <MoneyStatic
                                    value={calcSaltOrderTotal(props.data)}
                                />
                            </th>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div style={{ display: "flex" }}>
                <SaveButton />{" "}
                <SaveButton
                    label={"Save & Generate Order"}
                    printTemplate="saltOrder"
                />
            </div>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.lines> &
    WidgetContext<typeof Fields.extras> &
    WidgetContext<typeof Fields.discount> &
    WidgetContext<typeof Fields.pstExempt>;
type ExtraProps = {};
type BaseState = {
    lines: WidgetState<typeof Fields.lines>;
    extras: WidgetState<typeof Fields.extras>;
    discount: WidgetState<typeof Fields.discount>;
    pstExempt: WidgetState<typeof Fields.pstExempt>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "LINES"; action: WidgetAction<typeof Fields.lines> }
    | { type: "EXTRAS"; action: WidgetAction<typeof Fields.extras> }
    | { type: "DISCOUNT"; action: WidgetAction<typeof Fields.discount> }
    | { type: "PST_EXEMPT"; action: WidgetAction<typeof Fields.pstExempt> };

export type Action = ExtraActions | BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.lines, data.lines, cache, "lines", errors);
    subvalidate(Fields.extras, data.extras, cache, "extras", errors);
    subvalidate(Fields.discount, data.discount, cache, "discount", errors);
    subvalidate(Fields.pstExempt, data.pstExempt, cache, "pstExempt", errors);
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
        case "LINES": {
            const inner = Fields.lines.reduce(
                state.lines,
                data.lines,
                action.action,
                subcontext
            );
            return {
                state: { ...state, lines: inner.state },
                data: { ...data, lines: inner.data },
            };
        }
        case "EXTRAS": {
            const inner = Fields.extras.reduce(
                state.extras,
                data.extras,
                action.action,
                subcontext
            );
            return {
                state: { ...state, extras: inner.state },
                data: { ...data, extras: inner.data },
            };
        }
        case "DISCOUNT": {
            const inner = Fields.discount.reduce(
                state.discount,
                data.discount,
                action.action,
                subcontext
            );
            return {
                state: { ...state, discount: inner.state },
                data: { ...data, discount: inner.data },
            };
        }
        case "PST_EXEMPT": {
            const inner = Fields.pstExempt.reduce(
                state.pstExempt,
                data.pstExempt,
                action.action,
                subcontext
            );
            return {
                state: { ...state, pstExempt: inner.state },
                data: { ...data, pstExempt: inner.data },
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
    lines: function (
        props: WidgetExtraProps<typeof Fields.lines> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "LINES", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "lines", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.lines.component
                state={context.state.lines}
                data={context.data.lines}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Lines"}
            />
        );
    },
    extras: function (
        props: WidgetExtraProps<typeof Fields.extras> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "EXTRAS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "extras", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.extras.component
                state={context.state.extras}
                data={context.data.extras}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Extras"}
            />
        );
    },
    discount: function (
        props: WidgetExtraProps<typeof Fields.discount> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DISCOUNT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "discount", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.discount.component
                state={context.state.discount}
                data={context.data.discount}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Discount"}
            />
        );
    },
    pstExempt: function (
        props: WidgetExtraProps<typeof Fields.pstExempt> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PST_EXEMPT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "pstExempt", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.pstExempt.component
                state={context.state.pstExempt}
                data={context.data.pstExempt}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Pst Exempt"}
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
        let linesState;
        {
            const inner = Fields.lines.initialize(
                data.lines,
                subcontext,
                subparameters.lines
            );
            linesState = inner.state;
            data = { ...data, lines: inner.data };
        }
        let extrasState;
        {
            const inner = Fields.extras.initialize(
                data.extras,
                subcontext,
                subparameters.extras
            );
            extrasState = inner.state;
            data = { ...data, extras: inner.data };
        }
        let discountState;
        {
            const inner = Fields.discount.initialize(
                data.discount,
                subcontext,
                subparameters.discount
            );
            discountState = inner.state;
            data = { ...data, discount: inner.data };
        }
        let pstExemptState;
        {
            const inner = Fields.pstExempt.initialize(
                data.pstExempt,
                subcontext,
                subparameters.pstExempt
            );
            pstExemptState = inner.state;
            data = { ...data, pstExempt: inner.data };
        }
        let state = {
            initialParameters: parameters,
            lines: linesState,
            extras: extrasState,
            discount: discountState,
            pstExempt: pstExemptState,
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
    lines: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.lines>
    >;
    extras: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.extras>
    >;
    discount: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.discount>
    >;
    pstExempt: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.pstExempt>
    >;
};
// END MAGIC -- DO NOT EDIT
