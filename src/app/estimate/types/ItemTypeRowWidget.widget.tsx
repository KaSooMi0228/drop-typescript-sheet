import * as React from "react";
import { SubstrateLinkWidget, UnitTypeLinkWidget } from ".";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { SaveDeleteButton } from "../../../clay/save-delete-button";
import { FormField, OptionalFormField } from "../../../clay/widgets/FormField";
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
import { FieldRow } from "../../../clay/widgets/layout";
import { ListWidget } from "../../../clay/widgets/ListWidget";
import { SwitchWidget } from "../../../clay/widgets/SwitchWidget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { TABLE_STYLE } from "../../styles";
import RateRowWidget from "../rate/RateRowWidget.widget";
import { ItemType, ITEM_TYPE_META } from "./table";

export type Data = ItemType;

export const Fields = {
    name: FormField(TextWidget),
    defaultUnitType: FormField(UnitTypeLinkWidget),
    substrate: FormField(SubstrateLinkWidget),
    defaultHidden: FormField(SwitchWidget),
    rates: ListWidget(RateRowWidget, { emptyOk: true }),
    contingency: FormField(SwitchWidget),
    regular: FormField(SwitchWidget),
    phaseCode: OptionalFormField(TextWidget),
};

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);

    if (!/^\d*$/.test(data.phaseCode)) {
        errors.push({
            invalid: true,
            empty: false,
            field: "phaseCode",
        });
    }

    return errors;
}

function actionSortRates(state: State, data: ItemType) {
    const rates = data.rates.slice();
    rates.sort((a, b) => {
        return a.name.localeCompare(b.name, undefined, {
            numeric: true,
            sensitivity: "base",
        });
    });
    return {
        state,
        data: {
            ...data,
            rates,
        },
    };
}

function Component(props: Props) {
    const preSave = React.useCallback(() => {
        props.dispatch({ type: "SORT_RATES" });
    }, [props.dispatch]);

    return (
        <>
            <widgets.name />
            <widgets.defaultUnitType />
            <widgets.substrate />
            <widgets.defaultHidden />
            <widgets.phaseCode />
            <FieldRow>
                <widgets.regular />
                <widgets.contingency />
            </FieldRow>
            <table {...TABLE_STYLE}>
                <thead>
                    <tr>
                        <th />
                        <th>Name</th>
                        <th style={{ width: "10em" }}>Hours</th>
                        <th style={{ width: "10em" }}>Materials</th>
                        <th style={{ width: "10em" }}>Unit Type</th>
                        <th style={{ width: "10em" }}>Unit Increment</th>
                    </tr>
                </thead>
                <widgets.rates containerClass="tbody" extraItemForAdd />
            </table>

            <SaveDeleteButton preSave={preSave} />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.defaultUnitType> &
    WidgetContext<typeof Fields.substrate> &
    WidgetContext<typeof Fields.defaultHidden> &
    WidgetContext<typeof Fields.rates> &
    WidgetContext<typeof Fields.contingency> &
    WidgetContext<typeof Fields.regular> &
    WidgetContext<typeof Fields.phaseCode>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    defaultUnitType: WidgetState<typeof Fields.defaultUnitType>;
    substrate: WidgetState<typeof Fields.substrate>;
    defaultHidden: WidgetState<typeof Fields.defaultHidden>;
    rates: WidgetState<typeof Fields.rates>;
    contingency: WidgetState<typeof Fields.contingency>;
    regular: WidgetState<typeof Fields.regular>;
    phaseCode: WidgetState<typeof Fields.phaseCode>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | {
          type: "DEFAULT_UNIT_TYPE";
          action: WidgetAction<typeof Fields.defaultUnitType>;
      }
    | { type: "SUBSTRATE"; action: WidgetAction<typeof Fields.substrate> }
    | {
          type: "DEFAULT_HIDDEN";
          action: WidgetAction<typeof Fields.defaultHidden>;
      }
    | { type: "RATES"; action: WidgetAction<typeof Fields.rates> }
    | { type: "CONTINGENCY"; action: WidgetAction<typeof Fields.contingency> }
    | { type: "REGULAR"; action: WidgetAction<typeof Fields.regular> }
    | { type: "PHASE_CODE"; action: WidgetAction<typeof Fields.phaseCode> }
    | { type: "SORT_RATES" };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(
        Fields.defaultUnitType,
        data.defaultUnitType,
        cache,
        "defaultUnitType",
        errors
    );
    subvalidate(Fields.substrate, data.substrate, cache, "substrate", errors);
    subvalidate(
        Fields.defaultHidden,
        data.defaultHidden,
        cache,
        "defaultHidden",
        errors
    );
    subvalidate(Fields.rates, data.rates, cache, "rates", errors);
    subvalidate(
        Fields.contingency,
        data.contingency,
        cache,
        "contingency",
        errors
    );
    subvalidate(Fields.regular, data.regular, cache, "regular", errors);
    subvalidate(Fields.phaseCode, data.phaseCode, cache, "phaseCode", errors);
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
        case "DEFAULT_UNIT_TYPE": {
            const inner = Fields.defaultUnitType.reduce(
                state.defaultUnitType,
                data.defaultUnitType,
                action.action,
                subcontext
            );
            return {
                state: { ...state, defaultUnitType: inner.state },
                data: { ...data, defaultUnitType: inner.data },
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
        case "DEFAULT_HIDDEN": {
            const inner = Fields.defaultHidden.reduce(
                state.defaultHidden,
                data.defaultHidden,
                action.action,
                subcontext
            );
            return {
                state: { ...state, defaultHidden: inner.state },
                data: { ...data, defaultHidden: inner.data },
            };
        }
        case "RATES": {
            const inner = Fields.rates.reduce(
                state.rates,
                data.rates,
                action.action,
                subcontext
            );
            return {
                state: { ...state, rates: inner.state },
                data: { ...data, rates: inner.data },
            };
        }
        case "CONTINGENCY": {
            const inner = Fields.contingency.reduce(
                state.contingency,
                data.contingency,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contingency: inner.state },
                data: { ...data, contingency: inner.data },
            };
        }
        case "REGULAR": {
            const inner = Fields.regular.reduce(
                state.regular,
                data.regular,
                action.action,
                subcontext
            );
            return {
                state: { ...state, regular: inner.state },
                data: { ...data, regular: inner.data },
            };
        }
        case "PHASE_CODE": {
            const inner = Fields.phaseCode.reduce(
                state.phaseCode,
                data.phaseCode,
                action.action,
                subcontext
            );
            return {
                state: { ...state, phaseCode: inner.state },
                data: { ...data, phaseCode: inner.data },
            };
        }
        case "SORT_RATES":
            return actionSortRates(state, data);
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
    defaultUnitType: function (
        props: WidgetExtraProps<typeof Fields.defaultUnitType> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DEFAULT_UNIT_TYPE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "defaultUnitType", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.defaultUnitType.component
                state={context.state.defaultUnitType}
                data={context.data.defaultUnitType}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Default Unit Type"}
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
    defaultHidden: function (
        props: WidgetExtraProps<typeof Fields.defaultHidden> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DEFAULT_HIDDEN",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "defaultHidden", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.defaultHidden.component
                state={context.state.defaultHidden}
                data={context.data.defaultHidden}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Default Hidden"}
            />
        );
    },
    rates: function (
        props: WidgetExtraProps<typeof Fields.rates> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "RATES", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "rates", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.rates.component
                state={context.state.rates}
                data={context.data.rates}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Rates"}
            />
        );
    },
    contingency: function (
        props: WidgetExtraProps<typeof Fields.contingency> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTINGENCY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "contingency", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contingency.component
                state={context.state.contingency}
                data={context.data.contingency}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contingency"}
            />
        );
    },
    regular: function (
        props: WidgetExtraProps<typeof Fields.regular> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "REGULAR",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "regular", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.regular.component
                state={context.state.regular}
                data={context.data.regular}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Regular"}
            />
        );
    },
    phaseCode: function (
        props: WidgetExtraProps<typeof Fields.phaseCode> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PHASE_CODE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "phaseCode", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.phaseCode.component
                state={context.state.phaseCode}
                data={context.data.phaseCode}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Phase Code"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ITEM_TYPE_META,
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
        let defaultUnitTypeState;
        {
            const inner = Fields.defaultUnitType.initialize(
                data.defaultUnitType,
                subcontext,
                subparameters.defaultUnitType
            );
            defaultUnitTypeState = inner.state;
            data = { ...data, defaultUnitType: inner.data };
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
        let defaultHiddenState;
        {
            const inner = Fields.defaultHidden.initialize(
                data.defaultHidden,
                subcontext,
                subparameters.defaultHidden
            );
            defaultHiddenState = inner.state;
            data = { ...data, defaultHidden: inner.data };
        }
        let ratesState;
        {
            const inner = Fields.rates.initialize(
                data.rates,
                subcontext,
                subparameters.rates
            );
            ratesState = inner.state;
            data = { ...data, rates: inner.data };
        }
        let contingencyState;
        {
            const inner = Fields.contingency.initialize(
                data.contingency,
                subcontext,
                subparameters.contingency
            );
            contingencyState = inner.state;
            data = { ...data, contingency: inner.data };
        }
        let regularState;
        {
            const inner = Fields.regular.initialize(
                data.regular,
                subcontext,
                subparameters.regular
            );
            regularState = inner.state;
            data = { ...data, regular: inner.data };
        }
        let phaseCodeState;
        {
            const inner = Fields.phaseCode.initialize(
                data.phaseCode,
                subcontext,
                subparameters.phaseCode
            );
            phaseCodeState = inner.state;
            data = { ...data, phaseCode: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            defaultUnitType: defaultUnitTypeState,
            substrate: substrateState,
            defaultHidden: defaultHiddenState,
            rates: ratesState,
            contingency: contingencyState,
            regular: regularState,
            phaseCode: phaseCodeState,
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
                <RecordContext meta={ITEM_TYPE_META} value={props.data}>
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
    defaultUnitType: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.defaultUnitType>
    >;
    substrate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.substrate>
    >;
    defaultHidden: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.defaultHidden>
    >;
    rates: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.rates>
    >;
    contingency: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contingency>
    >;
    regular: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.regular>
    >;
    phaseCode: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.phaseCode>
    >;
};
// END MAGIC -- DO NOT EDIT
