import React from "react";
import { Col, Row } from "react-bootstrap";
import { useRecordQuery } from "../../../clay/api";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../../clay/quick-cache";
import { RemoveButton } from "../../../clay/remove-button";
import { DecimalDefaultWidget } from "../../../clay/widgets/DecimalDefaultWidget";
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
import { useListItemContext } from "../../../clay/widgets/ListWidget";
import { SelectLinkWidget } from "../../../clay/widgets/SelectLinkWidget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { CALCULATOR_WIDGET } from "../action/EstimateActionCalculatorWidget.widget";
import { FINISH_SCHEDULE_META } from "../finish-schedule/table";
import { RATE_META } from "../rate/table";
import { ItemTypeLinkWidget, UnitTypeLinkWidget } from "../types";
import { ITEM_TYPE_META } from "../types/table";
import {
    EstimateTemplate,
    EstimateTemplateAction,
    ESTIMATE_TEMPLATE_ACTION_META,
} from "./table";

export type Data = EstimateTemplateAction;

export const Fields = {
    name: FormField(TextWidget),
    itemType: FormField(ItemTypeLinkWidget),
    calculator: FormField(CALCULATOR_WIDGET),
    hourRate: FormField(DecimalDefaultWidget),
    finishSchedule: OptionalFormField(
        SelectLinkWidget({
            meta: FINISH_SCHEDULE_META,
            label: (finishSchedule) => finishSchedule.name,
        })
    ),
    rate: OptionalFormField(
        SelectLinkWidget({
            meta: RATE_META,
            label: (meta) => meta.name,
        })
    ),
    unitType: FormField(UnitTypeLinkWidget),
};

type ExtraProps = {
    template: EstimateTemplate;
};

function reduce(
    state: State,
    data: Data,
    action: BaseAction,
    context: Context
) {
    switch (action.type) {
        case "ITEM_TYPE": {
            if (action.action.type == "SET" && action.action.value != null) {
                const itemType = action.action.value;
                return {
                    state,
                    data: {
                        ...data,
                        itemType: itemType.id.uuid,
                        unitType: itemType.defaultUnitType,
                        calculator: itemType.calculator,
                        name: data.name || itemType.name,
                    },
                };
            }
        }
    }
    return baseReduce(state, data, action, context);
}

function Component(props: Props) {
    const listItemContext = useListItemContext();
    const itemType = useQuickRecord(ITEM_TYPE_META, props.data.itemType);
    const finishSchedules =
        useRecordQuery(
            FINISH_SCHEDULE_META,
            {
                filters: [
                    {
                        column: "substrates",
                        filter: {
                            intersects: itemType ? [itemType.substrate] : [],
                        },
                    },
                ],
                sorts: ["name"],
            },
            [itemType]
        ) || [];
    const rates = itemType
        ? itemType.rates.filter((rate) => rate.unitType === props.data.unitType)
        : [];

    return (
        <div
            {...listItemContext.draggableProps}
            style={{ marginBottom: "2em" }}
        >
            <Row>
                <Col style={{ flexGrow: 0 }}>{listItemContext.dragHandle}</Col>
                <Col>
                    <widgets.itemType />
                    <widgets.name />
                </Col>
                <Col>
                    <widgets.unitType />
                    <widgets.calculator />
                </Col>
                <Col>
                    <widgets.rate records={rates} clearable />
                    <widgets.finishSchedule
                        records={finishSchedules}
                        clearable
                    />
                </Col>
                <Col style={{ flexGrow: 0 }}>
                    <RemoveButton />
                </Col>
            </Row>
        </div>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.itemType> &
    WidgetContext<typeof Fields.calculator> &
    WidgetContext<typeof Fields.hourRate> &
    WidgetContext<typeof Fields.finishSchedule> &
    WidgetContext<typeof Fields.rate> &
    WidgetContext<typeof Fields.unitType>;
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    itemType: WidgetState<typeof Fields.itemType>;
    calculator: WidgetState<typeof Fields.calculator>;
    hourRate: WidgetState<typeof Fields.hourRate>;
    finishSchedule: WidgetState<typeof Fields.finishSchedule>;
    rate: WidgetState<typeof Fields.rate>;
    unitType: WidgetState<typeof Fields.unitType>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "ITEM_TYPE"; action: WidgetAction<typeof Fields.itemType> }
    | { type: "CALCULATOR"; action: WidgetAction<typeof Fields.calculator> }
    | { type: "HOUR_RATE"; action: WidgetAction<typeof Fields.hourRate> }
    | {
          type: "FINISH_SCHEDULE";
          action: WidgetAction<typeof Fields.finishSchedule>;
      }
    | { type: "RATE"; action: WidgetAction<typeof Fields.rate> }
    | { type: "UNIT_TYPE"; action: WidgetAction<typeof Fields.unitType> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.itemType, data.itemType, cache, "itemType", errors);
    subvalidate(
        Fields.calculator,
        data.calculator,
        cache,
        "calculator",
        errors
    );
    subvalidate(Fields.hourRate, data.hourRate, cache, "hourRate", errors);
    subvalidate(
        Fields.finishSchedule,
        data.finishSchedule,
        cache,
        "finishSchedule",
        errors
    );
    subvalidate(Fields.rate, data.rate, cache, "rate", errors);
    subvalidate(Fields.unitType, data.unitType, cache, "unitType", errors);
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
        case "ITEM_TYPE": {
            const inner = Fields.itemType.reduce(
                state.itemType,
                data.itemType,
                action.action,
                subcontext
            );
            return {
                state: { ...state, itemType: inner.state },
                data: { ...data, itemType: inner.data },
            };
        }
        case "CALCULATOR": {
            const inner = Fields.calculator.reduce(
                state.calculator,
                data.calculator,
                action.action,
                subcontext
            );
            return {
                state: { ...state, calculator: inner.state },
                data: { ...data, calculator: inner.data },
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
        case "FINISH_SCHEDULE": {
            const inner = Fields.finishSchedule.reduce(
                state.finishSchedule,
                data.finishSchedule,
                action.action,
                subcontext
            );
            return {
                state: { ...state, finishSchedule: inner.state },
                data: { ...data, finishSchedule: inner.data },
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
    itemType: function (
        props: WidgetExtraProps<typeof Fields.itemType> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ITEM_TYPE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "itemType", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.itemType.component
                state={context.state.itemType}
                data={context.data.itemType}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Item Type"}
            />
        );
    },
    calculator: function (
        props: WidgetExtraProps<typeof Fields.calculator> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CALCULATOR",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "calculator", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.calculator.component
                state={context.state.calculator}
                data={context.data.calculator}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Calculator"}
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
    finishSchedule: function (
        props: WidgetExtraProps<typeof Fields.finishSchedule> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "FINISH_SCHEDULE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "finishSchedule", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.finishSchedule.component
                state={context.state.finishSchedule}
                data={context.data.finishSchedule}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Finish Schedule"}
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ESTIMATE_TEMPLATE_ACTION_META,
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
        let itemTypeState;
        {
            const inner = Fields.itemType.initialize(
                data.itemType,
                subcontext,
                subparameters.itemType
            );
            itemTypeState = inner.state;
            data = { ...data, itemType: inner.data };
        }
        let calculatorState;
        {
            const inner = Fields.calculator.initialize(
                data.calculator,
                subcontext,
                subparameters.calculator
            );
            calculatorState = inner.state;
            data = { ...data, calculator: inner.data };
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
        let finishScheduleState;
        {
            const inner = Fields.finishSchedule.initialize(
                data.finishSchedule,
                subcontext,
                subparameters.finishSchedule
            );
            finishScheduleState = inner.state;
            data = { ...data, finishSchedule: inner.data };
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
        let state = {
            initialParameters: parameters,
            name: nameState,
            itemType: itemTypeState,
            calculator: calculatorState,
            hourRate: hourRateState,
            finishSchedule: finishScheduleState,
            rate: rateState,
            unitType: unitTypeState,
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
                    meta={ESTIMATE_TEMPLATE_ACTION_META}
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
    itemType: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.itemType>
    >;
    calculator: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.calculator>
    >;
    hourRate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.hourRate>
    >;
    finishSchedule: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.finishSchedule>
    >;
    rate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.rate>
    >;
    unitType: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.unitType>
    >;
};
// END MAGIC -- DO NOT EDIT
