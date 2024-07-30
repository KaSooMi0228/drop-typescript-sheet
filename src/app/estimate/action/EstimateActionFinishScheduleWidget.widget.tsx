import { find } from "lodash";
import * as React from "react";
import { Badge, Col, Row } from "react-bootstrap";
import Select from "react-select";
import { useRecordQuery } from "../../../clay/api";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../../clay/quick-cache";
import { FormField, FormWrapper } from "../../../clay/widgets/FormField";
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
import { MoneyWidget } from "../../../clay/widgets/money-widget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { FinishSchedule, FINISH_SCHEDULE_META } from "../finish-schedule/table";
import { formatMoney } from "../TotalsWidget.widget";
import { ApplicationTypeLinkWidget, ApplicationWidget } from "../types";
import { APPLICATION_TYPE_META, ITEM_TYPE_META } from "../types/table";
import { MySelectContainer } from "./estimate-widgets";
import {
    Props as EstimateActionDetailsWidgetProps,
    ReactContext as EstimateActionDetailsWidgetReactContext,
    SELECT_STYLES,
    widgets as EstimateActionDetailsWidgetWidgets,
} from "./EstimateActionDetailsWidget.widget";
import { EstimateAction, ESTIMATE_ACTION_META } from "./table";

export type Data = EstimateAction;
export type ExtraProps = {
    contingency: boolean;
};

export const Fields = {
    finishSchedule: FormField(TextWidget),
    materialsRate: MoneyWidget,
    application: FormField(ApplicationWidget),
    applicationType: FormField(ApplicationTypeLinkWidget),
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

export function ShowFinishSchedule(
    props: Props | EstimateActionDetailsWidgetProps
) {
    const itemType = useQuickRecord(ITEM_TYPE_META, props.data.itemType);
    const [menuIsOpen, setMenuIsOpen] = React.useState(false);

    const onMenuOpen = React.useCallback(() => {
        setMenuIsOpen(true);
    }, [setMenuIsOpen]);

    const onMenuClose = React.useCallback(() => {
        setMenuIsOpen(false);
    }, [setMenuIsOpen]);

    const [nameFocus, setNameFocus] = React.useState(false);
    const onNameFocus = React.useCallback(() => {
        setNameFocus(true);
        setMenuIsOpen(true);
    }, [setNameFocus, setMenuIsOpen]);

    const onNameBlur = React.useCallback(() => {
        setNameFocus(false);
        setMenuIsOpen(false);
    }, [setNameFocus, setMenuIsOpen]);
    const allFinishSchedules = useRecordQuery(
        FINISH_SCHEDULE_META,
        {
            filters: [
                {
                    column: "substrates",
                    filter: {
                        intersects:
                            itemType !== undefined && itemType !== null
                                ? [itemType.substrate]
                                : [],
                    },
                },
            ],
            sorts: ["name"],
        },
        [itemType]
    );
    const finishSchedules = React.useCallback(
        (action: EstimateAction) =>
            (allFinishSchedules || []).filter(
                (finishSchedule) =>
                    !nameFocus ||
                    finishSchedule.name
                        .toLowerCase()
                        .indexOf(action.finishSchedule.toLowerCase()) !== -1
            ),
        [allFinishSchedules]
    );

    const sourceFinishSchedule = find(
        finishSchedules(props.data),
        (schedule) => schedule.name === props.data.finishSchedule
    );

    const ScheduleInput = React.useCallback(() => {
        const context1 = React.useContext(ReactContext);
        const context2 = React.useContext(
            EstimateActionDetailsWidgetReactContext
        );
        const context = (context1 || context2)!;
        const w = context1 ? widgets : EstimateActionDetailsWidgetWidgets;
        const applicationType = useQuickRecord(
            APPLICATION_TYPE_META,
            context.data.applicationType
        );
        const sourceFinishSchedule = find(
            finishSchedules(context.data),
            (schedule) => schedule.name === context.data.finishSchedule
        );

        const badge =
            sourceFinishSchedule &&
            !sourceFinishSchedule.rate.equals(context.data.materialsRate) ? (
                <Badge style={{ marginLeft: ".5em" }} variant="danger">
                    Modified
                </Badge>
            ) : (
                <></>
            );

        return (
            <Row style={{ width: "95%", padding: "1em" }} className="inside">
                <Col>
                    <w.finishSchedule
                        onBlur={onNameBlur}
                        onFocus={onNameFocus}
                        clearable
                    />
                </Col>
                <Col style={{ maxWidth: "10em" }}>
                    <w.applicationType />
                </Col>
                <Col style={{ maxWidth: "15em" }}>
                    <w.application records={applicationType?.options || []} />
                </Col>
                <Col style={{ maxWidth: "12.5em" }}>
                    <FormWrapper label={<>Materials Rate{badge}</>}>
                        <w.materialsRate />
                    </FormWrapper>
                </Col>
            </Row>
        );
    }, [onMenuOpen, onMenuClose, finishSchedules]);

    return {
        component: (
            <Select
                className="big-dropdown"
                options={finishSchedules(props.data)}
                getOptionLabel={(schedule) =>
                    schedule.name + " " + formatMoney(schedule.rate)
                }
                getOptionValue={(schedule) => schedule.id.uuid}
                components={{
                    SelectContainer: MySelectContainer,
                    ValueContainer: ScheduleInput,
                }}
                filterOption={() => true}
                onChange={(selected) => {
                    if (selected) {
                        props.dispatch({
                            type: "SELECT_FINISH_SCHEDULE",
                            schedule: selected as FinishSchedule,
                        });
                    }
                }}
                styles={SELECT_STYLES}
                inputValue="."
                menuIsOpen={menuIsOpen}
                onMenuOpen={onMenuOpen}
                onMenuClose={onMenuClose}
                menuPlacement="auto"
            />
        ),
        content: sourceFinishSchedule ? sourceFinishSchedule.content : "",
    };
}

function Component(props: Props) {
    const { component, content } = ShowFinishSchedule(props);
    return (
        <>
            {component}
            <div
                style={{ overflow: "auto", flexGrow: 1, flexBasis: 0 }}
                dangerouslySetInnerHTML={{
                    __html: content,
                }}
            />
        </>
    );
}
/*<widgets.hourRate label="Dollars Per Hour" />
            <widgets.gallonRate label="Default Gallons Per Hour" />*/

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.finishSchedule> &
    WidgetContext<typeof Fields.materialsRate> &
    WidgetContext<typeof Fields.application> &
    WidgetContext<typeof Fields.applicationType>;
type BaseState = {
    finishSchedule: WidgetState<typeof Fields.finishSchedule>;
    materialsRate: WidgetState<typeof Fields.materialsRate>;
    application: WidgetState<typeof Fields.application>;
    applicationType: WidgetState<typeof Fields.applicationType>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "FINISH_SCHEDULE";
          action: WidgetAction<typeof Fields.finishSchedule>;
      }
    | {
          type: "MATERIALS_RATE";
          action: WidgetAction<typeof Fields.materialsRate>;
      }
    | { type: "APPLICATION"; action: WidgetAction<typeof Fields.application> }
    | {
          type: "APPLICATION_TYPE";
          action: WidgetAction<typeof Fields.applicationType>;
      }
    | { type: "SELECT_FINISH_SCHEDULE"; schedule: FinishSchedule };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
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
        Fields.application,
        data.application,
        cache,
        "application",
        errors
    );
    subvalidate(
        Fields.applicationType,
        data.applicationType,
        cache,
        "applicationType",
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
        case "SELECT_FINISH_SCHEDULE":
            return actionSelectFinishSchedule(state, data, action.schedule);
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
        let state = {
            initialParameters: parameters,
            finishSchedule: finishScheduleState,
            materialsRate: materialsRateState,
            application: applicationState,
            applicationType: applicationTypeState,
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
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
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
    application: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.application>
    >;
    applicationType: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.applicationType>
    >;
};
// END MAGIC -- DO NOT EDIT
