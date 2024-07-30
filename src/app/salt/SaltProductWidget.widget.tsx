import { css } from "glamor";
import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { SaveDeleteButton } from "../../clay/save-delete-button";
import { FormField, FormWrapper, Optional } from "../../clay/widgets/FormField";
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
import { LabelledBoolWidget } from "../../clay/widgets/labelled-bool-widget";
import { ListWidget } from "../../clay/widgets/ListWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import SaltPriceWidget from "./SaltPriceWidget.widget";
import { SaltProduct, SALT_PRODUCT_META } from "./table";

export type Data = SaltProduct;

const Fields = {
    name: FormField(TextWidget),
    noUnits: FormField(LabelledBoolWidget("Items", "Pails/Bags")),
    prices: Optional(ListWidget(SaltPriceWidget)),
    pailPrices: Optional(ListWidget(SaltPriceWidget)),
    bagPrices: Optional(ListWidget(SaltPriceWidget)),
};

const PRICE_TABLE = css({
    maxWidth: "6in",
});

function Component(props: Props) {
    return (
        <>
            <widgets.name />
            <widgets.noUnits label="Comes In" />
            {props.data.noUnits ? (
                <FormWrapper label="Prices">
                    <table {...PRICE_TABLE}>
                        <thead>
                            <tr>
                                <th />
                                <th>Min Qty</th>
                                <th>Early Bird Price</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        <widgets.prices
                            extraItemForAdd
                            containerClass="tbody"
                        />
                    </table>
                </FormWrapper>
            ) : (
                <>
                    <FormWrapper label="Pail Prices">
                        <table {...PRICE_TABLE}>
                            <thead>
                                <tr>
                                    <th />
                                    <th>Min Qty</th>
                                    <th>Early Bird Price</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <widgets.pailPrices
                                extraItemForAdd
                                containerClass="tbody"
                            />
                        </table>
                    </FormWrapper>
                    <FormWrapper label="Bag Prices">
                        <table {...PRICE_TABLE}>
                            <thead>
                                <tr>
                                    <th />
                                    <th>Min Qty</th>
                                    <th>Early Bird Price</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <widgets.bagPrices
                                extraItemForAdd
                                containerClass="tbody"
                            />
                        </table>
                    </FormWrapper>
                </>
            )}

            <SaveDeleteButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.noUnits> &
    WidgetContext<typeof Fields.prices> &
    WidgetContext<typeof Fields.pailPrices> &
    WidgetContext<typeof Fields.bagPrices>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    noUnits: WidgetState<typeof Fields.noUnits>;
    prices: WidgetState<typeof Fields.prices>;
    pailPrices: WidgetState<typeof Fields.pailPrices>;
    bagPrices: WidgetState<typeof Fields.bagPrices>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "NO_UNITS"; action: WidgetAction<typeof Fields.noUnits> }
    | { type: "PRICES"; action: WidgetAction<typeof Fields.prices> }
    | { type: "PAIL_PRICES"; action: WidgetAction<typeof Fields.pailPrices> }
    | { type: "BAG_PRICES"; action: WidgetAction<typeof Fields.bagPrices> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.noUnits, data.noUnits, cache, "noUnits", errors);
    subvalidate(Fields.prices, data.prices, cache, "prices", errors);
    subvalidate(
        Fields.pailPrices,
        data.pailPrices,
        cache,
        "pailPrices",
        errors
    );
    subvalidate(Fields.bagPrices, data.bagPrices, cache, "bagPrices", errors);
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
        case "NO_UNITS": {
            const inner = Fields.noUnits.reduce(
                state.noUnits,
                data.noUnits,
                action.action,
                subcontext
            );
            return {
                state: { ...state, noUnits: inner.state },
                data: { ...data, noUnits: inner.data },
            };
        }
        case "PRICES": {
            const inner = Fields.prices.reduce(
                state.prices,
                data.prices,
                action.action,
                subcontext
            );
            return {
                state: { ...state, prices: inner.state },
                data: { ...data, prices: inner.data },
            };
        }
        case "PAIL_PRICES": {
            const inner = Fields.pailPrices.reduce(
                state.pailPrices,
                data.pailPrices,
                action.action,
                subcontext
            );
            return {
                state: { ...state, pailPrices: inner.state },
                data: { ...data, pailPrices: inner.data },
            };
        }
        case "BAG_PRICES": {
            const inner = Fields.bagPrices.reduce(
                state.bagPrices,
                data.bagPrices,
                action.action,
                subcontext
            );
            return {
                state: { ...state, bagPrices: inner.state },
                data: { ...data, bagPrices: inner.data },
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
    noUnits: function (
        props: WidgetExtraProps<typeof Fields.noUnits> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "NO_UNITS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "noUnits", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.noUnits.component
                state={context.state.noUnits}
                data={context.data.noUnits}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "No Units"}
            />
        );
    },
    prices: function (
        props: WidgetExtraProps<typeof Fields.prices> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PRICES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "prices", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.prices.component
                state={context.state.prices}
                data={context.data.prices}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Prices"}
            />
        );
    },
    pailPrices: function (
        props: WidgetExtraProps<typeof Fields.pailPrices> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PAIL_PRICES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "pailPrices", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.pailPrices.component
                state={context.state.pailPrices}
                data={context.data.pailPrices}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Pail Prices"}
            />
        );
    },
    bagPrices: function (
        props: WidgetExtraProps<typeof Fields.bagPrices> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "BAG_PRICES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "bagPrices", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.bagPrices.component
                state={context.state.bagPrices}
                data={context.data.bagPrices}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Bag Prices"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: SALT_PRODUCT_META,
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
        let noUnitsState;
        {
            const inner = Fields.noUnits.initialize(
                data.noUnits,
                subcontext,
                subparameters.noUnits
            );
            noUnitsState = inner.state;
            data = { ...data, noUnits: inner.data };
        }
        let pricesState;
        {
            const inner = Fields.prices.initialize(
                data.prices,
                subcontext,
                subparameters.prices
            );
            pricesState = inner.state;
            data = { ...data, prices: inner.data };
        }
        let pailPricesState;
        {
            const inner = Fields.pailPrices.initialize(
                data.pailPrices,
                subcontext,
                subparameters.pailPrices
            );
            pailPricesState = inner.state;
            data = { ...data, pailPrices: inner.data };
        }
        let bagPricesState;
        {
            const inner = Fields.bagPrices.initialize(
                data.bagPrices,
                subcontext,
                subparameters.bagPrices
            );
            bagPricesState = inner.state;
            data = { ...data, bagPrices: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            noUnits: noUnitsState,
            prices: pricesState,
            pailPrices: pailPricesState,
            bagPrices: bagPricesState,
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
                <RecordContext meta={SALT_PRODUCT_META} value={props.data}>
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
    noUnits: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.noUnits>
    >;
    prices: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.prices>
    >;
    pailPrices: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.pailPrices>
    >;
    bagPrices: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.bagPrices>
    >;
};
// END MAGIC -- DO NOT EDIT
