import Decimal from "decimal.js";
import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { RemoveButton } from "../../../clay/remove-button";
import { DecimalWidget } from "../../../clay/widgets/DecimalWidget";
import { DropdownLinkWidget } from "../../../clay/widgets/dropdown-link-widget";
import { Readonly } from "../../../clay/widgets/FormField";
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
} from "../../../clay/widgets/index";
import { useListItemContext } from "../../../clay/widgets/ListWidget";
import { MoneyStatic, MoneyWidget } from "../../../clay/widgets/money-widget";
import { useIsMobile } from "../../../useIsMobile";
import {
    TimeAndMaterialsEstimateLine,
    TIME_AND_MATERIALS_ESTIMATE_LINE_META,
    TIME_AND_MATERIALS_ESTIMATE_PRODUCT_META,
} from "./table";
import { ReactContext as TimeAndMaterialsEstimateMainWidgetReactContext } from "./TimeAndMaterialsEstimateMainWidget.widget";

export type Data = TimeAndMaterialsEstimateLine;

export const Fields = {
    product: DropdownLinkWidget({
        meta: TIME_AND_MATERIALS_ESTIMATE_PRODUCT_META,
        label: (product) => product.name,
    }),
    quantity: DecimalWidget,
    cost: Readonly(MoneyWidget),
};

function reduce(
    state: State,
    data: TimeAndMaterialsEstimateLine,
    action: Action,
    context: Context
) {
    if (
        action.type === "PRODUCT" &&
        action.action.type === "SET" &&
        action.action.value !== null
    ) {
        const product = action.action.value;
        return {
            state,
            data: {
                ...data,
                product: product.id.uuid,
                cost: product.cost,
            },
        };
    }
    return baseReduce(state, data, action, context);
}

function Component(props: Props) {
    const listItemContext = useListItemContext();
    const estimateContext = React.useContext(
        TimeAndMaterialsEstimateMainWidgetReactContext
    )!;
    const isMobile = useIsMobile();

    return (
        <tr {...listItemContext.draggableProps}>
            <td style={{ display: isMobile ? "none" : undefined }}>
                {listItemContext.dragHandle}
            </td>
            <td colSpan={isMobile ? 2 : 1}>
                <widgets.product />
            </td>
            <td>
                <widgets.quantity />
            </td>
            {!isMobile && (
                <td>
                    <widgets.cost />
                </td>
            )}
            {!isMobile && (
                <td>
                    <MoneyStatic
                        value={props.data.cost.times(
                            new Decimal(1)
                                .plus(estimateContext.data.common.markup)
                                .plus(
                                    estimateContext.data.common.additionalMarkup
                                )
                        )}
                    />
                </td>
            )}
            {!isMobile && (
                <td>
                    <MoneyStatic
                        value={props.data.quantity.times(
                            props.data.cost.times(
                                new Decimal(1)
                                    .plus(estimateContext.data.common.markup)
                                    .plus(
                                        estimateContext.data.common
                                            .additionalMarkup
                                    )
                            )
                        )}
                    />
                </td>
            )}

            <td>
                <RemoveButton />
            </td>
        </tr>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.product> &
    WidgetContext<typeof Fields.quantity> &
    WidgetContext<typeof Fields.cost>;
type ExtraProps = {};
type BaseState = {
    product: WidgetState<typeof Fields.product>;
    quantity: WidgetState<typeof Fields.quantity>;
    cost: WidgetState<typeof Fields.cost>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "PRODUCT"; action: WidgetAction<typeof Fields.product> }
    | { type: "QUANTITY"; action: WidgetAction<typeof Fields.quantity> }
    | { type: "COST"; action: WidgetAction<typeof Fields.cost> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.product, data.product, cache, "product", errors);
    subvalidate(Fields.quantity, data.quantity, cache, "quantity", errors);
    subvalidate(Fields.cost, data.cost, cache, "cost", errors);
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
        case "PRODUCT": {
            const inner = Fields.product.reduce(
                state.product,
                data.product,
                action.action,
                subcontext
            );
            return {
                state: { ...state, product: inner.state },
                data: { ...data, product: inner.data },
            };
        }
        case "QUANTITY": {
            const inner = Fields.quantity.reduce(
                state.quantity,
                data.quantity,
                action.action,
                subcontext
            );
            return {
                state: { ...state, quantity: inner.state },
                data: { ...data, quantity: inner.data },
            };
        }
        case "COST": {
            const inner = Fields.cost.reduce(
                state.cost,
                data.cost,
                action.action,
                subcontext
            );
            return {
                state: { ...state, cost: inner.state },
                data: { ...data, cost: inner.data },
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
    product: function (
        props: WidgetExtraProps<typeof Fields.product> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PRODUCT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "product", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.product.component
                state={context.state.product}
                data={context.data.product}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Product"}
            />
        );
    },
    quantity: function (
        props: WidgetExtraProps<typeof Fields.quantity> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "QUANTITY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "quantity", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.quantity.component
                state={context.state.quantity}
                data={context.data.quantity}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Quantity"}
            />
        );
    },
    cost: function (
        props: WidgetExtraProps<typeof Fields.cost> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "COST", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "cost", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.cost.component
                state={context.state.cost}
                data={context.data.cost}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Cost"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: TIME_AND_MATERIALS_ESTIMATE_LINE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let productState;
        {
            const inner = Fields.product.initialize(
                data.product,
                subcontext,
                subparameters.product
            );
            productState = inner.state;
            data = { ...data, product: inner.data };
        }
        let quantityState;
        {
            const inner = Fields.quantity.initialize(
                data.quantity,
                subcontext,
                subparameters.quantity
            );
            quantityState = inner.state;
            data = { ...data, quantity: inner.data };
        }
        let costState;
        {
            const inner = Fields.cost.initialize(
                data.cost,
                subcontext,
                subparameters.cost
            );
            costState = inner.state;
            data = { ...data, cost: inner.data };
        }
        let state = {
            initialParameters: parameters,
            product: productState,
            quantity: quantityState,
            cost: costState,
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
                    meta={TIME_AND_MATERIALS_ESTIMATE_LINE_META}
                    value={props.data}
                >
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
};
export default Widget;
type Widgets = {
    product: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.product>
    >;
    quantity: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.quantity>
    >;
    cost: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.cost>
    >;
};
// END MAGIC -- DO NOT EDIT
