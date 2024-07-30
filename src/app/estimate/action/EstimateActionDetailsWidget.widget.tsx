import * as React from "react";
import { Col, Row } from "react-bootstrap";
import Select, { OptionProps } from "react-select";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../../clay/quick-cache";
import { DecimalDefaultWidget } from "../../../clay/widgets/DecimalDefaultWidget";
import { DecimalWidget } from "../../../clay/widgets/DecimalWidget";
import {
    FormField,
    FormWrapper,
    OptionalFormField,
} from "../../../clay/widgets/FormField";
import {
    RecordContext,
    RecordWidget,
    subStatus,
    subvalidate,
    useRecordContext,
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
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { FinishSchedule } from "../finish-schedule/table";
import { Rate } from "../rate/table";
import { ESTIMATE_META } from "../table";
import {
    ApplicationTypeLinkWidget,
    ApplicationWidget,
    ItemTypeLinkWidget,
    UnitTypeLinkWidget,
} from "../types";
import { ITEM_TYPE_META, UNIT_TYPE_META } from "../types/table";
import { MySelectContainer } from "./estimate-widgets";
import { ShowFinishSchedule } from "./EstimateActionFinishScheduleWidget.widget";
import Option from "./Option";
import {
    EstimateAction,
    ESTIMATE_ACTION_META,
    resolveEstimateAction,
} from "./table";

export type Data = EstimateAction;

export type ExtraProps = {
    contingency: boolean;
};

export const Fields = {
    name: FormField(TextWidget),
    itemType: FormField(ItemTypeLinkWidget),
    unitType: FormField(UnitTypeLinkWidget),
    hourRate: OptionalFormField(DecimalDefaultWidget),

    rateName: FormField(TextWidget),
    unitIncrement: FormField(DecimalWidget),
    hourRatio: FormField(DecimalWidget),
    materialsRatio: FormField(DecimalWidget),

    customUnitRate: FormField(DecimalDefaultWidget),
    finishSchedule: FormField(TextWidget),
    materialsRate: MoneyWidget,

    applicationType: FormField(ApplicationTypeLinkWidget),
    application: FormField(ApplicationWidget),
};

function actionSelectFinishSchedule(
    state: State,
    data: EstimateAction,
    schedule: FinishSchedule
) {
    return {
        state,
        data: {
            ...data,
            finishSchedule: schedule.name,
            materialsRate: schedule.rate,
            applicationType: schedule.applicationType,
            application: schedule.defaultApplication,
        },
    };
}
function actionSelectRate(state: State, data: EstimateAction, rate: Rate) {
    return {
        state,
        data: {
            ...data,
            rateName: rate.name,
            hourRatio: rate.hours,
            materialsRatio: rate.materials,
            unitIncrement: rate.unitIncrement,
        },
    };
}

function reduce(
    state: State,
    data: EstimateAction,
    action: Action,
    context: Context
) {
    switch (action.type) {
        case "ITEM_TYPE":
            switch (action.action.type) {
                case "SET":
                    if (action.action.value !== null) {
                        return {
                            state,
                            data: {
                                ...data,
                                itemType: action.action.value.id.uuid,
                                unitType: action.action.value.defaultUnitType,
                                calculator: action.action.value.calculator,
                            },
                        };
                    }
            }
    }
    return baseReduce(state, data, action, context);
}

export const SELECT_STYLES = {
    container: (provided: any) => ({
        ...provided,
        height: "100%",
    }),
    control: (provided: any) => ({
        ...provided,
        height: "100%",
    }),
    menu: (provided: any) => ({
        ...provided,
        zIndex: 100,
    }),
};

const CustomOption = (props: OptionProps<Rate, false>) => {
    const unitType = useQuickRecord(UNIT_TYPE_META, props.data.unitType);
    return (
        <Option {...props}>
            <b>{props.data.name}</b> | {props.data.hours.toString()} hours and{" "}
            {props.data.materials.toString()} per{" "}
            {props.data.unitIncrement.toString()} {unitType?.name}
        </Option>
    );
};

function Component(props: Props) {
    const estimateContext = useRecordContext(ESTIMATE_META);
    if (!estimateContext) {
        throw new Error("Expected to be used in estimate");
    }
    const [nameFocus, setNameFocus] = React.useState(false);

    const resolvedEstimateAction = resolveEstimateAction(
        props.data,
        estimateContext,
        props.contingency
    );

    const itemType = useQuickRecord(ITEM_TYPE_META, props.data.itemType);

    const rates = itemType
        ? itemType.rates.filter(
              (rate) =>
                  rate.unitType === props.data.unitType &&
                  (!nameFocus ||
                      rate.name
                          .toLowerCase()
                          .indexOf(props.data.rateName.toLowerCase()) !== -1)
          )
        : [];

    const [menuIsOpen, setMenuIsOpen] = React.useState(false);

    const onMenuOpen = React.useCallback(() => {
        setMenuIsOpen(true);
    }, [setMenuIsOpen]);

    const onMenuClose = React.useCallback(() => {
        setMenuIsOpen(false);
    }, [setMenuIsOpen]);

    const onNameFocus = React.useCallback(() => {
        setMenuIsOpen(true);
        setNameFocus(true);
    }, [setMenuIsOpen, setNameFocus]);

    const onNameBlur = React.useCallback(() => {
        setMenuIsOpen(false);
        setNameFocus(false);
    }, [setMenuIsOpen, setNameFocus]);

    const RateInput = React.useCallback(() => {
        return (
            <Row style={{ flexGrow: 1, padding: "1em" }}>
                <Col>
                    <widgets.rateName
                        label="Unit Rate Name"
                        onBlur={onNameBlur}
                        onFocus={onNameFocus}
                    />
                </Col>
                <Col style={{ maxWidth: "8em" }}>
                    <widgets.hourRatio label="Hours" />
                </Col>
                <Col style={{ maxWidth: "8em" }}>
                    <widgets.materialsRatio label="Materials" />
                </Col>
                <Col style={{ maxWidth: "10em" }}>
                    <widgets.unitIncrement />
                </Col>
            </Row>
        );
    }, [onMenuOpen, onMenuClose]);

    const finishSchedule = ShowFinishSchedule(props);

    return (
        <>
            <Row style={{ marginBottom: "1em" }}>
                <Col>
                    <widgets.name />
                </Col>
                <Col>
                    <widgets.hourRate
                        label="Hourly Rate"
                        money
                        showDiff
                        clearable
                        defaultData={estimateContext.baseHourRate}
                    />
                </Col>
                <Col>
                    <widgets.itemType
                        include={(x) =>
                            props.contingency ? x.contingency : x.regular
                        }
                    />
                </Col>
                <Col>
                    <widgets.unitType label="Unit of Measure" />
                </Col>
            </Row>
            <Row style={{ marginBottom: "1em" }}>
                <Col>
                    <Select
                        className="big-dropdown"
                        options={rates}
                        getOptionLabel={(rate) =>
                            `${rate.name} ${rate.hours} hours and ${rate.materials} materials per ${rate.unitIncrement}`
                        }
                        getOptionValue={(rate) => rate.id.uuid}
                        components={{
                            SelectContainer: MySelectContainer,
                            ValueContainer: RateInput,
                            Option: CustomOption,
                        }}
                        filterOption={() => true}
                        styles={SELECT_STYLES}
                        inputValue="."
                        menuIsOpen={menuIsOpen}
                        onMenuOpen={onMenuOpen}
                        onMenuClose={onMenuClose}
                        onChange={(selected) => {
                            if (selected) {
                                props.dispatch({
                                    type: "SELECT_RATE",
                                    rate: selected as Rate,
                                });
                            }
                        }}
                        tabSelectsValue={false}
                    />
                </Col>

                <Col style={{ maxWidth: "15em" }}>
                    <widgets.customUnitRate
                        label="Unit Rate Cost"
                        defaultData={resolvedEstimateAction.unitRate}
                        money
                        clearable
                    />
                    <FormWrapper label="Unit Rate with Markup">
                        <MoneyStatic
                            value={resolvedEstimateAction.rateWithMarkup}
                        />
                    </FormWrapper>
                </Col>
            </Row>
            <Row>
                <Col>{finishSchedule.component}</Col>
            </Row>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.itemType> &
    WidgetContext<typeof Fields.unitType> &
    WidgetContext<typeof Fields.hourRate> &
    WidgetContext<typeof Fields.rateName> &
    WidgetContext<typeof Fields.unitIncrement> &
    WidgetContext<typeof Fields.hourRatio> &
    WidgetContext<typeof Fields.materialsRatio> &
    WidgetContext<typeof Fields.customUnitRate> &
    WidgetContext<typeof Fields.finishSchedule> &
    WidgetContext<typeof Fields.materialsRate> &
    WidgetContext<typeof Fields.applicationType> &
    WidgetContext<typeof Fields.application>;
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    itemType: WidgetState<typeof Fields.itemType>;
    unitType: WidgetState<typeof Fields.unitType>;
    hourRate: WidgetState<typeof Fields.hourRate>;
    rateName: WidgetState<typeof Fields.rateName>;
    unitIncrement: WidgetState<typeof Fields.unitIncrement>;
    hourRatio: WidgetState<typeof Fields.hourRatio>;
    materialsRatio: WidgetState<typeof Fields.materialsRatio>;
    customUnitRate: WidgetState<typeof Fields.customUnitRate>;
    finishSchedule: WidgetState<typeof Fields.finishSchedule>;
    materialsRate: WidgetState<typeof Fields.materialsRate>;
    applicationType: WidgetState<typeof Fields.applicationType>;
    application: WidgetState<typeof Fields.application>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "ITEM_TYPE"; action: WidgetAction<typeof Fields.itemType> }
    | { type: "UNIT_TYPE"; action: WidgetAction<typeof Fields.unitType> }
    | { type: "HOUR_RATE"; action: WidgetAction<typeof Fields.hourRate> }
    | { type: "RATE_NAME"; action: WidgetAction<typeof Fields.rateName> }
    | {
          type: "UNIT_INCREMENT";
          action: WidgetAction<typeof Fields.unitIncrement>;
      }
    | { type: "HOUR_RATIO"; action: WidgetAction<typeof Fields.hourRatio> }
    | {
          type: "MATERIALS_RATIO";
          action: WidgetAction<typeof Fields.materialsRatio>;
      }
    | {
          type: "CUSTOM_UNIT_RATE";
          action: WidgetAction<typeof Fields.customUnitRate>;
      }
    | {
          type: "FINISH_SCHEDULE";
          action: WidgetAction<typeof Fields.finishSchedule>;
      }
    | {
          type: "MATERIALS_RATE";
          action: WidgetAction<typeof Fields.materialsRate>;
      }
    | {
          type: "APPLICATION_TYPE";
          action: WidgetAction<typeof Fields.applicationType>;
      }
    | { type: "APPLICATION"; action: WidgetAction<typeof Fields.application> }
    | { type: "SELECT_FINISH_SCHEDULE"; schedule: FinishSchedule }
    | { type: "SELECT_RATE"; rate: Rate };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.itemType, data.itemType, cache, "itemType", errors);
    subvalidate(Fields.unitType, data.unitType, cache, "unitType", errors);
    subvalidate(Fields.hourRate, data.hourRate, cache, "hourRate", errors);
    subvalidate(Fields.rateName, data.rateName, cache, "rateName", errors);
    subvalidate(
        Fields.unitIncrement,
        data.unitIncrement,
        cache,
        "unitIncrement",
        errors
    );
    subvalidate(Fields.hourRatio, data.hourRatio, cache, "hourRatio", errors);
    subvalidate(
        Fields.materialsRatio,
        data.materialsRatio,
        cache,
        "materialsRatio",
        errors
    );
    subvalidate(
        Fields.customUnitRate,
        data.customUnitRate,
        cache,
        "customUnitRate",
        errors
    );
    subvalidate(
        Fields.finishSchedule,
        data.finishSchedule,
        cache,
        "finishSchedule",
        errors
    );
    subvalidate(
        Fields.materialsRate,
        data.materialsRate,
        cache,
        "materialsRate",
        errors
    );
    subvalidate(
        Fields.applicationType,
        data.applicationType,
        cache,
        "applicationType",
        errors
    );
    subvalidate(
        Fields.application,
        data.application,
        cache,
        "application",
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
        case "RATE_NAME": {
            const inner = Fields.rateName.reduce(
                state.rateName,
                data.rateName,
                action.action,
                subcontext
            );
            return {
                state: { ...state, rateName: inner.state },
                data: { ...data, rateName: inner.data },
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
        case "HOUR_RATIO": {
            const inner = Fields.hourRatio.reduce(
                state.hourRatio,
                data.hourRatio,
                action.action,
                subcontext
            );
            return {
                state: { ...state, hourRatio: inner.state },
                data: { ...data, hourRatio: inner.data },
            };
        }
        case "MATERIALS_RATIO": {
            const inner = Fields.materialsRatio.reduce(
                state.materialsRatio,
                data.materialsRatio,
                action.action,
                subcontext
            );
            return {
                state: { ...state, materialsRatio: inner.state },
                data: { ...data, materialsRatio: inner.data },
            };
        }
        case "CUSTOM_UNIT_RATE": {
            const inner = Fields.customUnitRate.reduce(
                state.customUnitRate,
                data.customUnitRate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, customUnitRate: inner.state },
                data: { ...data, customUnitRate: inner.data },
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
        case "APPLICATION_TYPE": {
            const inner = Fields.applicationType.reduce(
                state.applicationType,
                data.applicationType,
                action.action,
                subcontext
            );
            return {
                state: { ...state, applicationType: inner.state },
                data: { ...data, applicationType: inner.data },
            };
        }
        case "APPLICATION": {
            const inner = Fields.application.reduce(
                state.application,
                data.application,
                action.action,
                subcontext
            );
            return {
                state: { ...state, application: inner.state },
                data: { ...data, application: inner.data },
            };
        }
        case "SELECT_FINISH_SCHEDULE":
            return actionSelectFinishSchedule(state, data, action.schedule);
        case "SELECT_RATE":
            return actionSelectRate(state, data, action.rate);
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
    rateName: function (
        props: WidgetExtraProps<typeof Fields.rateName> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "RATE_NAME",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "rateName", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.rateName.component
                state={context.state.rateName}
                data={context.data.rateName}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Rate Name"}
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
    hourRatio: function (
        props: WidgetExtraProps<typeof Fields.hourRatio> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "HOUR_RATIO",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "hourRatio", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.hourRatio.component
                state={context.state.hourRatio}
                data={context.data.hourRatio}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Hour Ratio"}
            />
        );
    },
    materialsRatio: function (
        props: WidgetExtraProps<typeof Fields.materialsRatio> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MATERIALS_RATIO",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "materialsRatio", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.materialsRatio.component
                state={context.state.materialsRatio}
                data={context.data.materialsRatio}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Materials Ratio"}
            />
        );
    },
    customUnitRate: function (
        props: WidgetExtraProps<typeof Fields.customUnitRate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CUSTOM_UNIT_RATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "customUnitRate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.customUnitRate.component
                state={context.state.customUnitRate}
                data={context.data.customUnitRate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Custom Unit Rate"}
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
    applicationType: function (
        props: WidgetExtraProps<typeof Fields.applicationType> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "APPLICATION_TYPE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "applicationType", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.applicationType.component
                state={context.state.applicationType}
                data={context.data.applicationType}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Application Type"}
            />
        );
    },
    application: function (
        props: WidgetExtraProps<typeof Fields.application> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "APPLICATION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "application", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.application.component
                state={context.state.application}
                data={context.data.application}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Application"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ESTIMATE_ACTION_META,
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
        let rateNameState;
        {
            const inner = Fields.rateName.initialize(
                data.rateName,
                subcontext,
                subparameters.rateName
            );
            rateNameState = inner.state;
            data = { ...data, rateName: inner.data };
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
        let hourRatioState;
        {
            const inner = Fields.hourRatio.initialize(
                data.hourRatio,
                subcontext,
                subparameters.hourRatio
            );
            hourRatioState = inner.state;
            data = { ...data, hourRatio: inner.data };
        }
        let materialsRatioState;
        {
            const inner = Fields.materialsRatio.initialize(
                data.materialsRatio,
                subcontext,
                subparameters.materialsRatio
            );
            materialsRatioState = inner.state;
            data = { ...data, materialsRatio: inner.data };
        }
        let customUnitRateState;
        {
            const inner = Fields.customUnitRate.initialize(
                data.customUnitRate,
                subcontext,
                subparameters.customUnitRate
            );
            customUnitRateState = inner.state;
            data = { ...data, customUnitRate: inner.data };
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
        let applicationTypeState;
        {
            const inner = Fields.applicationType.initialize(
                data.applicationType,
                subcontext,
                subparameters.applicationType
            );
            applicationTypeState = inner.state;
            data = { ...data, applicationType: inner.data };
        }
        let applicationState;
        {
            const inner = Fields.application.initialize(
                data.application,
                subcontext,
                subparameters.application
            );
            applicationState = inner.state;
            data = { ...data, application: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            itemType: itemTypeState,
            unitType: unitTypeState,
            hourRate: hourRateState,
            rateName: rateNameState,
            unitIncrement: unitIncrementState,
            hourRatio: hourRatioState,
            materialsRatio: materialsRatioState,
            customUnitRate: customUnitRateState,
            finishSchedule: finishScheduleState,
            materialsRate: materialsRateState,
            applicationType: applicationTypeState,
            application: applicationState,
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
                <RecordContext meta={ESTIMATE_ACTION_META} value={props.data}>
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
    unitType: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.unitType>
    >;
    hourRate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.hourRate>
    >;
    rateName: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.rateName>
    >;
    unitIncrement: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.unitIncrement>
    >;
    hourRatio: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.hourRatio>
    >;
    materialsRatio: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.materialsRatio>
    >;
    customUnitRate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.customUnitRate>
    >;
    finishSchedule: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.finishSchedule>
    >;
    materialsRate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.materialsRate>
    >;
    applicationType: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.applicationType>
    >;
    application: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.application>
    >;
};
// END MAGIC -- DO NOT EDIT
