import { Decimal } from "decimal.js";
import * as React from "react";
import { Button, ModalBody, ModalTitle } from "react-bootstrap";
import Modal from "react-modal";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { RemoveButton } from "../../clay/remove-button";
import { DropdownLinkWidget } from "../../clay/widgets/dropdown-link-widget";
import { FormField } from "../../clay/widgets/FormField";
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
import { FieldRow } from "../../clay/widgets/layout";
import { LinkSetWidget } from "../../clay/widgets/link-set-widget";
import { useListItemContext } from "../../clay/widgets/ListWidget";
import { MoneyStatic, MoneyWidget } from "../../clay/widgets/money-widget";
import { QuantityWidget } from "../../clay/widgets/number-widget";
import { PercentageWidget } from "../../clay/widgets/percentage-widget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { LUMP_SUM_CONTINGENCY_TYPE } from "../contingency/table";
import ModalHeader from "../ModalHeader";
import { AREA_META } from "./area/table";
import { ReactContext as EstimateWidgetReactContext } from "./EstimateWidget.widget";
import {
    calcEstimateContingencyItemCost,
    calcEstimateContingencyItemPrice,
    EstimateContingencyItem,
    ESTIMATE_CONTINGENCY_ITEM_META,
} from "./table";
import { SUBSTRATE_META, UNIT_TYPE_META } from "./types/table";

export type Data = EstimateContingencyItem;

export const Fields = {
    name: FormField(TextWidget),
    quantity: QuantityWidget,
    markup: PercentageWidget,
    substrate: FormField(
        DropdownLinkWidget({
            meta: SUBSTRATE_META,
            label: (record) => record.name,
        })
    ),
    rate: MoneyWidget,
    type: DropdownLinkWidget({
        meta: UNIT_TYPE_META,
        label: (record) => record.name,
        include: (record) => record.contingency,
    }),
    areas: LinkSetWidget({
        meta: AREA_META,
        name: (area) => area.name,
    }),
};

function reduce(
    state: State,
    data: Data,
    action: BaseAction,
    context: Context
) {
    const inner = baseReduce(state, data, action, context);

    if (inner.data.type === LUMP_SUM_CONTINGENCY_TYPE) {
        return {
            state: inner.state,
            data: {
                ...inner.data,
                rate: new Decimal(1),
            },
        };
    } else {
        return inner;
    }
}

function Component(props: Props) {
    const estimateContext = React.useContext(EstimateWidgetReactContext);
    if (!estimateContext) {
        throw new Error("Should be used in context");
    }
    const listItemContext = useListItemContext();

    const [modalOpen, setModalOpen] = React.useState(false);

    return (
        <tr {...listItemContext.draggableProps}>
            {modalOpen && (
                <Modal isOpen={true} onRequestClose={() => setModalOpen(false)}>
                    <ModalHeader>
                        <ModalTitle>{props.data.name}</ModalTitle>
                    </ModalHeader>
                    <ModalBody>
                        <FieldRow>
                            <widgets.name />
                            <widgets.substrate />
                        </FieldRow>
                    </ModalBody>
                </Modal>
            )}
            <td style={{ width: "1em" }}>{listItemContext.dragHandle} </td>
            <td>
                <Button
                    style={{ width: "100%" }}
                    onClick={() => setModalOpen(true)}
                >
                    {props.data.name}
                </Button>
            </td>
            <td>
                <widgets.quantity />
            </td>
            <td>
                <widgets.type />
            </td>
            <td>
                <widgets.rate
                    readOnly={props.data.type == LUMP_SUM_CONTINGENCY_TYPE}
                />
            </td>
            <td>
                <MoneyStatic
                    value={calcEstimateContingencyItemCost(props.data)}
                />
            </td>
            <td>
                <widgets.markup />
            </td>
            <td>
                <MoneyStatic
                    value={calcEstimateContingencyItemPrice(props.data)}
                />
            </td>
            {estimateContext.data.areas.length > 1 && (
                <td>
                    <widgets.areas
                        horizontal
                        records={estimateContext.data.areas}
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
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.quantity> &
    WidgetContext<typeof Fields.markup> &
    WidgetContext<typeof Fields.substrate> &
    WidgetContext<typeof Fields.rate> &
    WidgetContext<typeof Fields.type> &
    WidgetContext<typeof Fields.areas>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    quantity: WidgetState<typeof Fields.quantity>;
    markup: WidgetState<typeof Fields.markup>;
    substrate: WidgetState<typeof Fields.substrate>;
    rate: WidgetState<typeof Fields.rate>;
    type: WidgetState<typeof Fields.type>;
    areas: WidgetState<typeof Fields.areas>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "QUANTITY"; action: WidgetAction<typeof Fields.quantity> }
    | { type: "MARKUP"; action: WidgetAction<typeof Fields.markup> }
    | { type: "SUBSTRATE"; action: WidgetAction<typeof Fields.substrate> }
    | { type: "RATE"; action: WidgetAction<typeof Fields.rate> }
    | { type: "TYPE"; action: WidgetAction<typeof Fields.type> }
    | { type: "AREAS"; action: WidgetAction<typeof Fields.areas> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.quantity, data.quantity, cache, "quantity", errors);
    subvalidate(Fields.markup, data.markup, cache, "markup", errors);
    subvalidate(Fields.substrate, data.substrate, cache, "substrate", errors);
    subvalidate(Fields.rate, data.rate, cache, "rate", errors);
    subvalidate(Fields.type, data.type, cache, "type", errors);
    subvalidate(Fields.areas, data.areas, cache, "areas", errors);
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
        case "MARKUP": {
            const inner = Fields.markup.reduce(
                state.markup,
                data.markup,
                action.action,
                subcontext
            );
            return {
                state: { ...state, markup: inner.state },
                data: { ...data, markup: inner.data },
            };
        }
        case "SUBSTRATE": {
            const inner = Fields.substrate.reduce(
                state.substrate,
                data.substrate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, substrate: inner.state },
                data: { ...data, substrate: inner.data },
            };
        }
        case "RATE": {
            const inner = Fields.rate.reduce(
                state.rate,
                data.rate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, rate: inner.state },
                data: { ...data, rate: inner.data },
            };
        }
        case "TYPE": {
            const inner = Fields.type.reduce(
                state.type,
                data.type,
                action.action,
                subcontext
            );
            return {
                state: { ...state, type: inner.state },
                data: { ...data, type: inner.data },
            };
        }
        case "AREAS": {
            const inner = Fields.areas.reduce(
                state.areas,
                data.areas,
                action.action,
                subcontext
            );
            return {
                state: { ...state, areas: inner.state },
                data: { ...data, areas: inner.data },
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
    markup: function (
        props: WidgetExtraProps<typeof Fields.markup> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MARKUP",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "markup", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.markup.component
                state={context.state.markup}
                data={context.data.markup}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Markup"}
            />
        );
    },
    substrate: function (
        props: WidgetExtraProps<typeof Fields.substrate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SUBSTRATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "substrate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.substrate.component
                state={context.state.substrate}
                data={context.data.substrate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Substrate"}
            />
        );
    },
    rate: function (
        props: WidgetExtraProps<typeof Fields.rate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "RATE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "rate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.rate.component
                state={context.state.rate}
                data={context.data.rate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Rate"}
            />
        );
    },
    type: function (
        props: WidgetExtraProps<typeof Fields.type> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "TYPE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "type", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.type.component
                state={context.state.type}
                data={context.data.type}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Type"}
            />
        );
    },
    areas: function (
        props: WidgetExtraProps<typeof Fields.areas> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "AREAS", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "areas", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.areas.component
                state={context.state.areas}
                data={context.data.areas}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Areas"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ESTIMATE_CONTINGENCY_ITEM_META,
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
        let markupState;
        {
            const inner = Fields.markup.initialize(
                data.markup,
                subcontext,
                subparameters.markup
            );
            markupState = inner.state;
            data = { ...data, markup: inner.data };
        }
        let substrateState;
        {
            const inner = Fields.substrate.initialize(
                data.substrate,
                subcontext,
                subparameters.substrate
            );
            substrateState = inner.state;
            data = { ...data, substrate: inner.data };
        }
        let rateState;
        {
            const inner = Fields.rate.initialize(
                data.rate,
                subcontext,
                subparameters.rate
            );
            rateState = inner.state;
            data = { ...data, rate: inner.data };
        }
        let typeState;
        {
            const inner = Fields.type.initialize(
                data.type,
                subcontext,
                subparameters.type
            );
            typeState = inner.state;
            data = { ...data, type: inner.data };
        }
        let areasState;
        {
            const inner = Fields.areas.initialize(
                data.areas,
                subcontext,
                subparameters.areas
            );
            areasState = inner.state;
            data = { ...data, areas: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            quantity: quantityState,
            markup: markupState,
            substrate: substrateState,
            rate: rateState,
            type: typeState,
            areas: areasState,
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
                    meta={ESTIMATE_CONTINGENCY_ITEM_META}
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
    name: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.name>
    >;
    quantity: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.quantity>
    >;
    markup: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.markup>
    >;
    substrate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.substrate>
    >;
    rate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.rate>
    >;
    type: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.type>
    >;
    areas: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.areas>
    >;
};
// END MAGIC -- DO NOT EDIT
