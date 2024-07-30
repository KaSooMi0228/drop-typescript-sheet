import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { RemoveButton } from "../../clay/remove-button";
import { DateWidget } from "../../clay/widgets/DateWidget";
import { DecimalWidget } from "../../clay/widgets/DecimalWidget";
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
import { useListItemContext } from "../../clay/widgets/ListWidget";
import { MoneyWidget } from "../../clay/widgets/money-widget";
import { SaltPrice, SALT_PRICE_META } from "./table";

export type Data = SaltPrice;

const Fields = {
    firstDate: Optional(DateWidget),
    minQty: Optional(DecimalWidget),
    price: MoneyWidget,
    earlyPrice: MoneyWidget,
};

function Component(props: Props) {
    const listItemContext = useListItemContext();

    return (
        <tr {...listItemContext.draggableProps}>
            <td>{listItemContext.dragHandle}</td>
            <td>
                <widgets.minQty />
            </td>
            <td>
                <widgets.earlyPrice />
            </td>
            <td>
                <widgets.price />
            </td>
            <td>
                <RemoveButton />
            </td>
        </tr>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.firstDate> &
    WidgetContext<typeof Fields.minQty> &
    WidgetContext<typeof Fields.price> &
    WidgetContext<typeof Fields.earlyPrice>;
type ExtraProps = {};
type BaseState = {
    firstDate: WidgetState<typeof Fields.firstDate>;
    minQty: WidgetState<typeof Fields.minQty>;
    price: WidgetState<typeof Fields.price>;
    earlyPrice: WidgetState<typeof Fields.earlyPrice>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "FIRST_DATE"; action: WidgetAction<typeof Fields.firstDate> }
    | { type: "MIN_QTY"; action: WidgetAction<typeof Fields.minQty> }
    | { type: "PRICE"; action: WidgetAction<typeof Fields.price> }
    | { type: "EARLY_PRICE"; action: WidgetAction<typeof Fields.earlyPrice> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.firstDate, data.firstDate, cache, "firstDate", errors);
    subvalidate(Fields.minQty, data.minQty, cache, "minQty", errors);
    subvalidate(Fields.price, data.price, cache, "price", errors);
    subvalidate(
        Fields.earlyPrice,
        data.earlyPrice,
        cache,
        "earlyPrice",
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
        case "FIRST_DATE": {
            const inner = Fields.firstDate.reduce(
                state.firstDate,
                data.firstDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, firstDate: inner.state },
                data: { ...data, firstDate: inner.data },
            };
        }
        case "MIN_QTY": {
            const inner = Fields.minQty.reduce(
                state.minQty,
                data.minQty,
                action.action,
                subcontext
            );
            return {
                state: { ...state, minQty: inner.state },
                data: { ...data, minQty: inner.data },
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
        case "EARLY_PRICE": {
            const inner = Fields.earlyPrice.reduce(
                state.earlyPrice,
                data.earlyPrice,
                action.action,
                subcontext
            );
            return {
                state: { ...state, earlyPrice: inner.state },
                data: { ...data, earlyPrice: inner.data },
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
    firstDate: function (
        props: WidgetExtraProps<typeof Fields.firstDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "FIRST_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "firstDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.firstDate.component
                state={context.state.firstDate}
                data={context.data.firstDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "First Date"}
            />
        );
    },
    minQty: function (
        props: WidgetExtraProps<typeof Fields.minQty> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MIN_QTY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "minQty", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.minQty.component
                state={context.state.minQty}
                data={context.data.minQty}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Min Qty"}
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
    earlyPrice: function (
        props: WidgetExtraProps<typeof Fields.earlyPrice> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "EARLY_PRICE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "earlyPrice", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.earlyPrice.component
                state={context.state.earlyPrice}
                data={context.data.earlyPrice}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Early Price"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: SALT_PRICE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let firstDateState;
        {
            const inner = Fields.firstDate.initialize(
                data.firstDate,
                subcontext,
                subparameters.firstDate
            );
            firstDateState = inner.state;
            data = { ...data, firstDate: inner.data };
        }
        let minQtyState;
        {
            const inner = Fields.minQty.initialize(
                data.minQty,
                subcontext,
                subparameters.minQty
            );
            minQtyState = inner.state;
            data = { ...data, minQty: inner.data };
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
        let earlyPriceState;
        {
            const inner = Fields.earlyPrice.initialize(
                data.earlyPrice,
                subcontext,
                subparameters.earlyPrice
            );
            earlyPriceState = inner.state;
            data = { ...data, earlyPrice: inner.data };
        }
        let state = {
            initialParameters: parameters,
            firstDate: firstDateState,
            minQty: minQtyState,
            price: priceState,
            earlyPrice: earlyPriceState,
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
                <RecordContext meta={SALT_PRICE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    firstDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.firstDate>
    >;
    minQty: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.minQty>
    >;
    price: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.price>
    >;
    earlyPrice: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.earlyPrice>
    >;
};
// END MAGIC -- DO NOT EDIT
