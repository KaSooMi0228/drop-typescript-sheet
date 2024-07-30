import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../clay/quick-cache";
import { RemoveButton } from "../../clay/remove-button";
import { DecimalWidget } from "../../clay/widgets/DecimalWidget";
import { DropdownLinkWidget } from "../../clay/widgets/dropdown-link-widget";
import { Readonly } from "../../clay/widgets/FormField";
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
import { MoneyStatic, MoneyWidget } from "../../clay/widgets/money-widget";
import { PailsBagsWidget } from "./pails-bucket-widget";
import {
    SaltOrderLine,
    SALT_ORDER_LINE_META,
    SALT_PRODUCT_META,
} from "./table";

export type Data = SaltOrderLine;

export const Fields = {
    product: DropdownLinkWidget({
        meta: SALT_PRODUCT_META,
        label: (product) => product.name,
        include: (product) =>
            (product.noUnits ? product.prices : product.bagPrices).length !== 0,
    }),
    quantity: DecimalWidget,
    unit: PailsBagsWidget,
    price: Readonly(MoneyWidget),
};

function Component(props: Props) {
    const listItemContext = useListItemContext();

    const saltProduct = useQuickRecord(SALT_PRODUCT_META, props.data.product);

    return (
        <tr {...listItemContext.draggableProps}>
            <td>{listItemContext.dragHandle}</td>
            <td>
                <widgets.product />
            </td>
            <td>{saltProduct && !saltProduct.noUnits && <widgets.unit />}</td>
            <td>
                <widgets.quantity />
            </td>
            <td>
                <widgets.price />
            </td>
            <td>
                <MoneyStatic
                    value={props.data.quantity.times(props.data.price)}
                />
            </td>
            <td>
                <RemoveButton />
            </td>
        </tr>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.product> &
    WidgetContext<typeof Fields.quantity> &
    WidgetContext<typeof Fields.unit> &
    WidgetContext<typeof Fields.price>;
type ExtraProps = {};
type BaseState = {
    product: WidgetState<typeof Fields.product>;
    quantity: WidgetState<typeof Fields.quantity>;
    unit: WidgetState<typeof Fields.unit>;
    price: WidgetState<typeof Fields.price>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "PRODUCT"; action: WidgetAction<typeof Fields.product> }
    | { type: "QUANTITY"; action: WidgetAction<typeof Fields.quantity> }
    | { type: "UNIT"; action: WidgetAction<typeof Fields.unit> }
    | { type: "PRICE"; action: WidgetAction<typeof Fields.price> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.product, data.product, cache, "product", errors);
    subvalidate(Fields.quantity, data.quantity, cache, "quantity", errors);
    subvalidate(Fields.unit, data.unit, cache, "unit", errors);
    subvalidate(Fields.price, data.price, cache, "price", errors);
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
        case "UNIT": {
            const inner = Fields.unit.reduce(
                state.unit,
                data.unit,
                action.action,
                subcontext
            );
            return {
                state: { ...state, unit: inner.state },
                data: { ...data, unit: inner.data },
            };
        }
        case "PRICE": {
            const inner = Fields.price.reduce(
                state.price,
                data.price,
                action.action,
                subcontext
            );
            return {
                state: { ...state, price: inner.state },
                data: { ...data, price: inner.data },
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
    unit: function (
        props: WidgetExtraProps<typeof Fields.unit> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "UNIT", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "unit", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.unit.component
                state={context.state.unit}
                data={context.data.unit}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Unit"}
            />
        );
    },
    price: function (
        props: WidgetExtraProps<typeof Fields.price> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "PRICE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "price", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.price.component
                state={context.state.price}
                data={context.data.price}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Price"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: SALT_ORDER_LINE_META,
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
        let unitState;
        {
            const inner = Fields.unit.initialize(
                data.unit,
                subcontext,
                subparameters.unit
            );
            unitState = inner.state;
            data = { ...data, unit: inner.data };
        }
        let priceState;
        {
            const inner = Fields.price.initialize(
                data.price,
                subcontext,
                subparameters.price
            );
            priceState = inner.state;
            data = { ...data, price: inner.data };
        }
        let state = {
            initialParameters: parameters,
            product: productState,
            quantity: quantityState,
            unit: unitState,
            price: priceState,
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
                <RecordContext meta={SALT_ORDER_LINE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
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
    unit: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.unit>
    >;
    price: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.price>
    >;
};
// END MAGIC -- DO NOT EDIT
