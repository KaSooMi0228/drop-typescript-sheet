import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { Optional } from "../../../clay/widgets/FormField";
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
import { MoneyStatic, MoneyWidget } from "../../../clay/widgets/money-widget";
import { QuantityWidget } from "../../../clay/widgets/number-widget";
import { BaseTableRow } from "../../../clay/widgets/TableRow";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { BudgetLine, BUDGET_LINE_META, calcBudgetLineTotal } from "./table";

export type Data = BudgetLine;

const Fields = {
    name: TextWidget,
    hours: Optional(QuantityWidget),
    materials: Optional(QuantityWidget),
    hourRate: Optional(MoneyWidget),
    materialsRate: Optional(MoneyWidget),
};

function Component(props: Props) {
    return (
        <BaseTableRow>
            <td>
                <widgets.name />
            </td>
            <td>
                <widgets.hours />
            </td>
            <td>
                <widgets.materials />
            </td>
            <td>
                <widgets.hourRate />
            </td>
            <td>
                <widgets.materialsRate
                    badge={
                        (props.data.originalMaterialsRate != null &&
                            !props.data.originalMaterialsRate.equals(
                                props.data.materialsRate
                            ) &&
                            "M") ||
                        undefined
                    }
                />
            </td>
            <td>
                <MoneyStatic value={calcBudgetLineTotal(props.data)} />
            </td>
        </BaseTableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.hours> &
    WidgetContext<typeof Fields.materials> &
    WidgetContext<typeof Fields.hourRate> &
    WidgetContext<typeof Fields.materialsRate>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    hours: WidgetState<typeof Fields.hours>;
    materials: WidgetState<typeof Fields.materials>;
    hourRate: WidgetState<typeof Fields.hourRate>;
    materialsRate: WidgetState<typeof Fields.materialsRate>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "HOURS"; action: WidgetAction<typeof Fields.hours> }
    | { type: "MATERIALS"; action: WidgetAction<typeof Fields.materials> }
    | { type: "HOUR_RATE"; action: WidgetAction<typeof Fields.hourRate> }
    | {
          type: "MATERIALS_RATE";
          action: WidgetAction<typeof Fields.materialsRate>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.hours, data.hours, cache, "hours", errors);
    subvalidate(Fields.materials, data.materials, cache, "materials", errors);
    subvalidate(Fields.hourRate, data.hourRate, cache, "hourRate", errors);
    subvalidate(
        Fields.materialsRate,
        data.materialsRate,
        cache,
        "materialsRate",
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
        case "HOURS": {
            const inner = Fields.hours.reduce(
                state.hours,
                data.hours,
                action.action,
                subcontext
            );
            return {
                state: { ...state, hours: inner.state },
                data: { ...data, hours: inner.data },
            };
        }
        case "MATERIALS": {
            const inner = Fields.materials.reduce(
                state.materials,
                data.materials,
                action.action,
                subcontext
            );
            return {
                state: { ...state, materials: inner.state },
                data: { ...data, materials: inner.data },
            };
        }
        case "HOUR_RATE": {
            const inner = Fields.hourRate.reduce(
                state.hourRate,
                data.hourRate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, hourRate: inner.state },
                data: { ...data, hourRate: inner.data },
            };
        }
        case "MATERIALS_RATE": {
            const inner = Fields.materialsRate.reduce(
                state.materialsRate,
                data.materialsRate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, materialsRate: inner.state },
                data: { ...data, materialsRate: inner.data },
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
    hours: function (
        props: WidgetExtraProps<typeof Fields.hours> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "HOURS", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "hours", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.hours.component
                state={context.state.hours}
                data={context.data.hours}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Hours"}
            />
        );
    },
    materials: function (
        props: WidgetExtraProps<typeof Fields.materials> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MATERIALS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "materials", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.materials.component
                state={context.state.materials}
                data={context.data.materials}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Materials"}
            />
        );
    },
    hourRate: function (
        props: WidgetExtraProps<typeof Fields.hourRate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "HOUR_RATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "hourRate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.hourRate.component
                state={context.state.hourRate}
                data={context.data.hourRate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Hour Rate"}
            />
        );
    },
    materialsRate: function (
        props: WidgetExtraProps<typeof Fields.materialsRate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MATERIALS_RATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "materialsRate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.materialsRate.component
                state={context.state.materialsRate}
                data={context.data.materialsRate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Materials Rate"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: BUDGET_LINE_META,
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
        let hoursState;
        {
            const inner = Fields.hours.initialize(
                data.hours,
                subcontext,
                subparameters.hours
            );
            hoursState = inner.state;
            data = { ...data, hours: inner.data };
        }
        let materialsState;
        {
            const inner = Fields.materials.initialize(
                data.materials,
                subcontext,
                subparameters.materials
            );
            materialsState = inner.state;
            data = { ...data, materials: inner.data };
        }
        let hourRateState;
        {
            const inner = Fields.hourRate.initialize(
                data.hourRate,
                subcontext,
                subparameters.hourRate
            );
            hourRateState = inner.state;
            data = { ...data, hourRate: inner.data };
        }
        let materialsRateState;
        {
            const inner = Fields.materialsRate.initialize(
                data.materialsRate,
                subcontext,
                subparameters.materialsRate
            );
            materialsRateState = inner.state;
            data = { ...data, materialsRate: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            hours: hoursState,
            materials: materialsState,
            hourRate: hourRateState,
            materialsRate: materialsRateState,
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
                <RecordContext meta={BUDGET_LINE_META} value={props.data}>
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
    hours: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.hours>
    >;
    materials: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.materials>
    >;
    hourRate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.hourRate>
    >;
    materialsRate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.materialsRate>
    >;
};
// END MAGIC -- DO NOT EDIT
