import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { DecimalWidget } from "../../../clay/widgets/DecimalWidget";
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
import { TableRow } from "../../../clay/widgets/TableRow";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { UnitTypeLinkWidget } from "../types";
import { Rate, RATE_META } from "./table";

export type Data = Rate;

export const Fields = {
    name: TextWidget,
    hours: Optional(DecimalWidget),
    materials: Optional(DecimalWidget),
    unitType: UnitTypeLinkWidget,
    unitIncrement: DecimalWidget,
};

function Component(props: Props) {
    return (
        <TableRow flexSizes>
            <widgets.name />
            <widgets.hours />
            <widgets.materials />
            <widgets.unitType />
            <widgets.unitIncrement />
        </TableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.hours> &
    WidgetContext<typeof Fields.materials> &
    WidgetContext<typeof Fields.unitType> &
    WidgetContext<typeof Fields.unitIncrement>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    hours: WidgetState<typeof Fields.hours>;
    materials: WidgetState<typeof Fields.materials>;
    unitType: WidgetState<typeof Fields.unitType>;
    unitIncrement: WidgetState<typeof Fields.unitIncrement>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "HOURS"; action: WidgetAction<typeof Fields.hours> }
    | { type: "MATERIALS"; action: WidgetAction<typeof Fields.materials> }
    | { type: "UNIT_TYPE"; action: WidgetAction<typeof Fields.unitType> }
    | {
          type: "UNIT_INCREMENT";
          action: WidgetAction<typeof Fields.unitIncrement>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.hours, data.hours, cache, "hours", errors);
    subvalidate(Fields.materials, data.materials, cache, "materials", errors);
    subvalidate(Fields.unitType, data.unitType, cache, "unitType", errors);
    subvalidate(
        Fields.unitIncrement,
        data.unitIncrement,
        cache,
        "unitIncrement",
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
        case "UNIT_TYPE": {
            const inner = Fields.unitType.reduce(
                state.unitType,
                data.unitType,
                action.action,
                subcontext
            );
            return {
                state: { ...state, unitType: inner.state },
                data: { ...data, unitType: inner.data },
            };
        }
        case "UNIT_INCREMENT": {
            const inner = Fields.unitIncrement.reduce(
                state.unitIncrement,
                data.unitIncrement,
                action.action,
                subcontext
            );
            return {
                state: { ...state, unitIncrement: inner.state },
                data: { ...data, unitIncrement: inner.data },
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
    unitType: function (
        props: WidgetExtraProps<typeof Fields.unitType> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "UNIT_TYPE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "unitType", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.unitType.component
                state={context.state.unitType}
                data={context.data.unitType}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Unit Type"}
            />
        );
    },
    unitIncrement: function (
        props: WidgetExtraProps<typeof Fields.unitIncrement> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "UNIT_INCREMENT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "unitIncrement", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.unitIncrement.component
                state={context.state.unitIncrement}
                data={context.data.unitIncrement}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Unit Increment"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: RATE_META,
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
        let unitTypeState;
        {
            const inner = Fields.unitType.initialize(
                data.unitType,
                subcontext,
                subparameters.unitType
            );
            unitTypeState = inner.state;
            data = { ...data, unitType: inner.data };
        }
        let unitIncrementState;
        {
            const inner = Fields.unitIncrement.initialize(
                data.unitIncrement,
                subcontext,
                subparameters.unitIncrement
            );
            unitIncrementState = inner.state;
            data = { ...data, unitIncrement: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            hours: hoursState,
            materials: materialsState,
            unitType: unitTypeState,
            unitIncrement: unitIncrementState,
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
                <RecordContext meta={RATE_META} value={props.data}>
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
    unitType: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.unitType>
    >;
    unitIncrement: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.unitIncrement>
    >;
};
// END MAGIC -- DO NOT EDIT
