import React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { DropdownLinkWidget } from "../../clay/widgets/dropdown-link-widget";
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
import { TableRow } from "../../clay/widgets/TableRow";
import { TextAreaWidget } from "../../clay/widgets/TextAreaWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { FinishScheduleLine, FINISH_SCHEDULE_LINE_META } from "./table";
import { MANUFACTURER_META } from "./types/table";

export type Data = FinishScheduleLine;

const Fields = {
    substrate: TextWidget,
    manufacturer: DropdownLinkWidget({
        meta: MANUFACTURER_META,
        label: (item) => item.name,
    }),
    productName: TextWidget,
    productSizeAndBase: TextWidget,
    colourName: Optional(TextWidget),
    colourFormula: TextAreaWidget,
};

function Component(props: Props) {
    return (
        <TableRow>
            <widgets.substrate />
            <widgets.manufacturer />
            <widgets.productName />
            <widgets.productSizeAndBase />
            <widgets.colourName placeholder="Not Applicable" />
            <widgets.colourFormula />
        </TableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.substrate> &
    WidgetContext<typeof Fields.manufacturer> &
    WidgetContext<typeof Fields.productName> &
    WidgetContext<typeof Fields.productSizeAndBase> &
    WidgetContext<typeof Fields.colourName> &
    WidgetContext<typeof Fields.colourFormula>;
type ExtraProps = {};
type BaseState = {
    substrate: WidgetState<typeof Fields.substrate>;
    manufacturer: WidgetState<typeof Fields.manufacturer>;
    productName: WidgetState<typeof Fields.productName>;
    productSizeAndBase: WidgetState<typeof Fields.productSizeAndBase>;
    colourName: WidgetState<typeof Fields.colourName>;
    colourFormula: WidgetState<typeof Fields.colourFormula>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "SUBSTRATE"; action: WidgetAction<typeof Fields.substrate> }
    | { type: "MANUFACTURER"; action: WidgetAction<typeof Fields.manufacturer> }
    | { type: "PRODUCT_NAME"; action: WidgetAction<typeof Fields.productName> }
    | {
          type: "PRODUCT_SIZE_AND_BASE";
          action: WidgetAction<typeof Fields.productSizeAndBase>;
      }
    | { type: "COLOUR_NAME"; action: WidgetAction<typeof Fields.colourName> }
    | {
          type: "COLOUR_FORMULA";
          action: WidgetAction<typeof Fields.colourFormula>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.substrate, data.substrate, cache, "substrate", errors);
    subvalidate(
        Fields.manufacturer,
        data.manufacturer,
        cache,
        "manufacturer",
        errors
    );
    subvalidate(
        Fields.productName,
        data.productName,
        cache,
        "productName",
        errors
    );
    subvalidate(
        Fields.productSizeAndBase,
        data.productSizeAndBase,
        cache,
        "productSizeAndBase",
        errors
    );
    subvalidate(
        Fields.colourName,
        data.colourName,
        cache,
        "colourName",
        errors
    );
    subvalidate(
        Fields.colourFormula,
        data.colourFormula,
        cache,
        "colourFormula",
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
        case "MANUFACTURER": {
            const inner = Fields.manufacturer.reduce(
                state.manufacturer,
                data.manufacturer,
                action.action,
                subcontext
            );
            return {
                state: { ...state, manufacturer: inner.state },
                data: { ...data, manufacturer: inner.data },
            };
        }
        case "PRODUCT_NAME": {
            const inner = Fields.productName.reduce(
                state.productName,
                data.productName,
                action.action,
                subcontext
            );
            return {
                state: { ...state, productName: inner.state },
                data: { ...data, productName: inner.data },
            };
        }
        case "PRODUCT_SIZE_AND_BASE": {
            const inner = Fields.productSizeAndBase.reduce(
                state.productSizeAndBase,
                data.productSizeAndBase,
                action.action,
                subcontext
            );
            return {
                state: { ...state, productSizeAndBase: inner.state },
                data: { ...data, productSizeAndBase: inner.data },
            };
        }
        case "COLOUR_NAME": {
            const inner = Fields.colourName.reduce(
                state.colourName,
                data.colourName,
                action.action,
                subcontext
            );
            return {
                state: { ...state, colourName: inner.state },
                data: { ...data, colourName: inner.data },
            };
        }
        case "COLOUR_FORMULA": {
            const inner = Fields.colourFormula.reduce(
                state.colourFormula,
                data.colourFormula,
                action.action,
                subcontext
            );
            return {
                state: { ...state, colourFormula: inner.state },
                data: { ...data, colourFormula: inner.data },
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
    manufacturer: function (
        props: WidgetExtraProps<typeof Fields.manufacturer> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MANUFACTURER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "manufacturer", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.manufacturer.component
                state={context.state.manufacturer}
                data={context.data.manufacturer}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Manufacturer"}
            />
        );
    },
    productName: function (
        props: WidgetExtraProps<typeof Fields.productName> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PRODUCT_NAME",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "productName", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.productName.component
                state={context.state.productName}
                data={context.data.productName}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Product Name"}
            />
        );
    },
    productSizeAndBase: function (
        props: WidgetExtraProps<typeof Fields.productSizeAndBase> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PRODUCT_SIZE_AND_BASE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "productSizeAndBase",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.productSizeAndBase.component
                state={context.state.productSizeAndBase}
                data={context.data.productSizeAndBase}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Product Size and Base"}
            />
        );
    },
    colourName: function (
        props: WidgetExtraProps<typeof Fields.colourName> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COLOUR_NAME",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "colourName", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.colourName.component
                state={context.state.colourName}
                data={context.data.colourName}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Colour Name"}
            />
        );
    },
    colourFormula: function (
        props: WidgetExtraProps<typeof Fields.colourFormula> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COLOUR_FORMULA",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "colourFormula", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.colourFormula.component
                state={context.state.colourFormula}
                data={context.data.colourFormula}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Colour Formula"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: FINISH_SCHEDULE_LINE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
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
        let manufacturerState;
        {
            const inner = Fields.manufacturer.initialize(
                data.manufacturer,
                subcontext,
                subparameters.manufacturer
            );
            manufacturerState = inner.state;
            data = { ...data, manufacturer: inner.data };
        }
        let productNameState;
        {
            const inner = Fields.productName.initialize(
                data.productName,
                subcontext,
                subparameters.productName
            );
            productNameState = inner.state;
            data = { ...data, productName: inner.data };
        }
        let productSizeAndBaseState;
        {
            const inner = Fields.productSizeAndBase.initialize(
                data.productSizeAndBase,
                subcontext,
                subparameters.productSizeAndBase
            );
            productSizeAndBaseState = inner.state;
            data = { ...data, productSizeAndBase: inner.data };
        }
        let colourNameState;
        {
            const inner = Fields.colourName.initialize(
                data.colourName,
                subcontext,
                subparameters.colourName
            );
            colourNameState = inner.state;
            data = { ...data, colourName: inner.data };
        }
        let colourFormulaState;
        {
            const inner = Fields.colourFormula.initialize(
                data.colourFormula,
                subcontext,
                subparameters.colourFormula
            );
            colourFormulaState = inner.state;
            data = { ...data, colourFormula: inner.data };
        }
        let state = {
            initialParameters: parameters,
            substrate: substrateState,
            manufacturer: manufacturerState,
            productName: productNameState,
            productSizeAndBase: productSizeAndBaseState,
            colourName: colourNameState,
            colourFormula: colourFormulaState,
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
                    meta={FINISH_SCHEDULE_LINE_META}
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
    substrate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.substrate>
    >;
    manufacturer: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.manufacturer>
    >;
    productName: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.productName>
    >;
    productSizeAndBase: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.productSizeAndBase>
    >;
    colourName: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.colourName>
    >;
    colourFormula: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.colourFormula>
    >;
};
// END MAGIC -- DO NOT EDIT
