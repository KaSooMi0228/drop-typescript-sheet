import {
    faCalculator,
    faCopy,
    faStickyNote,
    faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Decimal } from "decimal.js";
import { css } from "glamor";
import { find, some } from "lodash";
import * as React from "react";
import {
    Badge,
    Button,
    ModalBody,
    ModalTitle,
    Nav,
    Tab,
} from "react-bootstrap";
import ModalHeader from "react-bootstrap/ModalHeader";
import Modal from "react-modal";
import { useRecordQuery } from "../../../clay/api";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../../clay/quick-cache";
import { DecimalDefaultWidget } from "../../../clay/widgets/DecimalDefaultWidget";
import { DecimalWidget } from "../../../clay/widgets/DecimalWidget";
import { FormField, FormWrapper } from "../../../clay/widgets/FormField";
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
import {
    ListWidget,
    useListItemContext,
} from "../../../clay/widgets/ListWidget";
import { MoneyStatic } from "../../../clay/widgets/money-widget";
import {
    NumberWidgetAction,
    QuantityStatic,
    QuantityWidget,
} from "../../../clay/widgets/number-widget";
import { SwitchWidget } from "../../../clay/widgets/SwitchWidget";
import { CONTENT_AREA } from "../../styles";
import { FINISH_SCHEDULE_META } from "../finish-schedule/table";
import { widgets as SideWidgetWidgets } from "../side/SideWidget.widget";
import { SIDE_META } from "../side/table";
import { ESTIMATE_META, noteTags } from "../table";
import { ITEM_TYPE_META } from "../types/table";
import CalculatorRowWidget from "./CalculatorRowWidget.widget";
import { EstimateActionWidgetTypes } from "./EstimateActionWidget.widget";
import SealantCalculatorRowWidget from "./SealantCalculatorRowWidget.widget";
import {
    EstimateAction,
    extraUnitsAllowed,
    resolveAction,
    resolveUnits,
    SideAction,
    SIDE_ACTION_META,
} from "./table";

export type Data = SideAction;

export type ExtraProps = {
    estimateAction: EstimateAction;
    estimateActionWidget: (
        widget: EstimateActionWidgetTypes
    ) => React.ReactElement;
    onDuplicate: () => void;
    onRemove: () => void;
    contingency: boolean;
    areas?: React.ReactElement;
};

export type ActionModalTab = "DETAILS" | "CALCULATOR" | "FINISH_SCHEDULE";

export type ExtraState = {
    actionModal: ActionModalTab | null;
};

type ExtraActions =
    | {
          type: "SET_ACTION_MODAL";
          tab: ActionModalTab;
      }
    | {
          type: "CLOSE_ACTION_MODAL";
      }
    | {
          type: "SET_UNIT_RATE_CALCULATION";
      }
    | {
          type: "SET_HOURS_MATERIALS";
          hours: Decimal;
          materials: Decimal;
      };

export function initialize(data: SideAction, context: Context) {
    return {
        data,
        state: {
            actionModal: null,
        },
        parameters: {},
    };
}

function isDecimalChangeAction(
    action:
        | WidgetAction<typeof DecimalWidget>
        | WidgetAction<typeof DecimalDefaultWidget>
): boolean {
    switch (action.type) {
        case "SET":
        case "RESET":
        case "CLEAR":
            return true;
        case "BLUR":
            return false;
    }
}

function isCalculationUnitRowChangeAction(
    action: WidgetAction<typeof CalculatorRowWidget>
): boolean {
    switch (action.type) {
        case "WIDTH":
        case "HEIGHT":
            return isDecimalChangeAction(action.action);
        case "NOTE":
            return true;
    }
}

function isCalculatorUnitChangeAction(
    action: WidgetAction<typeof Fields.calculatorUnits>
): boolean {
    switch (action.type) {
        case "ITEM":
            return isCalculationUnitRowChangeAction(action.action);
        case "MOVE":
        case "MERGE":
        case "REMOVE":
        case "NEW":
            return true;
    }
}

function reduce(
    state: State,
    data: SideAction,
    action: Action,
    context: Context
): WidgetResult<State, SideAction> {
    switch (action.type) {
        case "SET_ACTION_MODAL":
            return {
                data,
                state: {
                    ...state,
                    actionModal: action.tab,
                },
            };
        case "CLOSE_ACTION_MODAL":
            return {
                data,
                state: {
                    ...state,
                    actionModal: null,
                },
            };
        case "CALCULATOR_UNITS":
            if (isCalculatorUnitChangeAction(action.action)) {
                return baseReduce(
                    state,
                    {
                        ...data,
                        hours: null,
                        materials: null,
                    },
                    action,
                    context
                );
            } else {
                return baseReduce(state, data, action, context);
            }
        case "SET_UNIT_RATE_CALCULATION":
            return {
                state,
                data: {
                    ...data,
                    hours: null,
                    materials: null,
                },
            };
        case "SET_HOURS_MATERIALS":
            return {
                state,
                data: {
                    ...data,
                    hours: action.hours,
                    materials: action.materials,
                },
            };
        default:
            let inner = baseReduce(state, data, action, context);
            state = inner.state;
            data = inner.data;
            return { state, data };
    }
}

export const Fields = {
    hours: DecimalDefaultWidget,
    materials: DecimalDefaultWidget,
    calculatorUnits: ListWidget(CalculatorRowWidget, {
        adaptEmpty(action) {
            return {
                ...action,
                height: new Decimal("1"),
            };
        },
    }),
    sealantCalculatorUnits: ListWidget(SealantCalculatorRowWidget, {
        adaptEmpty(action) {
            return {
                ...action,
                multiply: new Decimal(1),
                inefficiency: new Decimal("0.15"),
            };
        },
    }),
    overrideCopyUnits: FormField(SwitchWidget),
};

const BUTTON_STYLE = css({
    width: "100%",
});

function Details(props: Props & { widgets: Widgets }) {
    return props.estimateActionWidget("details");
}

function Calculator(props: Props & { widgets: Widgets }) {
    const estimateContext = useRecordContext(ESTIMATE_META);
    if (estimateContext == undefined) {
        throw new Error("Expected to be used in estimate");
    }
    const sideContext = useRecordContext(SIDE_META);
    if (sideContext === undefined) {
        throw new Error("Expected to be used in side");
    }
    const resolved = resolveAction(
        props.estimateAction,
        props.data,
        sideContext,
        estimateContext,
        props.contingency
    );

    const hourMaterialsDispatch = React.useCallback(
        (action: Action) => {
            switch (action.type) {
                case "HOURS":
                    if (isDecimalChangeAction(action.action)) {
                        props.dispatch({
                            type: "MATERIALS",
                            action: {
                                type: "SET",
                                value: resolved.materials,
                            },
                        });
                    }
                case "MATERIALS":
                    if (isDecimalChangeAction(action.action)) {
                        props.dispatch({
                            type: "HOURS",
                            action: {
                                type: "SET",
                                value: resolved.hours,
                            },
                        });
                    }
            }
            props.dispatch(action);
        },
        [props.dispatch, resolved]
    );

    const sourceAction = find(
        estimateContext.actions,
        (action) => action.id.uuid == props.estimateAction.copyUnitsFromAction
    );
    const overrideCopyUnits = (
        <>
            {props.estimateActionWidget("calculator")}
            {props.estimateAction.copyUnitsFromAction && (
                <>
                    <div>
                        Action is copying units from: {sourceAction?.name}
                    </div>
                    <props.widgets.overrideCopyUnits label="Override for this side" />
                    {extraUnitsAllowed(props.estimateAction) && (
                        <h3>Additional Units</h3>
                    )}
                </>
            )}
        </>
    );

    if (
        props.estimateAction.copyUnitsFromAction &&
        !props.data.overrideCopyUnits &&
        !extraUnitsAllowed(props.estimateAction)
    ) {
        return overrideCopyUnits;
    }

    switch (props.estimateAction.calculator) {
        case "Square":
        case "Linear":
            return (
                <>
                    {overrideCopyUnits}
                    <div
                        className="center-labels"
                        style={{
                            display: "flex",
                            flexFlow: "start",
                            paddingBottom: 10,
                            marginBottom: 10,
                            marginLeft: "2em",
                        }}
                    >
                        <FormWrapper label="Hours">
                            <props.widgets.hours
                                dispatch={hourMaterialsDispatch}
                                defaultData={resolved.hours}
                                style={{
                                    display: "inline-block",
                                }}
                            />
                        </FormWrapper>
                        <div style={{ width: "1.5em" }} />
                        <FormWrapper label="Materials">
                            <props.widgets.materials
                                dispatch={hourMaterialsDispatch}
                                defaultData={resolved.materials}
                                style={{
                                    display: "inline-block",
                                }}
                            />
                        </FormWrapper>
                        <div style={{ width: "1.5em" }} />
                        <FormWrapper label="Total Units">
                            <QuantityStatic
                                value={resolveUnits(
                                    estimateContext,
                                    props.estimateAction,
                                    props.data,
                                    sideContext
                                )}
                            />
                        </FormWrapper>
                        <div style={{ width: "1.5em" }} />
                        <FormWrapper label="">
                            <Button
                                onClick={() =>
                                    props.dispatch({
                                        type: "SET_UNIT_RATE_CALCULATION",
                                    })
                                }
                            >
                                Revert to Unit Rate Calculation
                            </Button>
                        </FormWrapper>
                    </div>
                    <table style={{ marginBottom: "10px" }} {...CONTENT_AREA}>
                        <props.widgets.calculatorUnits
                            containerClass="tbody"
                            itemProps={{
                                calculator: props.estimateAction.calculator,
                            }}
                            extraItemForAdd
                        />
                    </table>
                </>
            );
        case "Sealant":
            return (
                <>
                    {overrideCopyUnits}
                    <div
                        className="center-labels"
                        style={{
                            display: "flex",
                            flexFlow: "start",
                            paddingBottom: 10,
                            marginBottom: 10,
                            marginLeft: "2em",
                        }}
                    >
                        <FormWrapper label="Hours">
                            <props.widgets.hours
                                dispatch={hourMaterialsDispatch}
                                defaultData={resolved.hours}
                                style={{
                                    display: "inline-block",
                                }}
                            />
                        </FormWrapper>
                        <div style={{ width: "1.5em" }} />
                        <FormWrapper label="Materials">
                            <props.widgets.materials
                                dispatch={hourMaterialsDispatch}
                                defaultData={resolved.materials}
                                style={{
                                    display: "inline-block",
                                }}
                            />
                        </FormWrapper>
                        <div style={{ width: "1.5em" }} />
                        <FormWrapper label="Total Units">
                            <QuantityStatic
                                value={resolveUnits(
                                    estimateContext,
                                    props.estimateAction,
                                    props.data,
                                    sideContext
                                )}
                            />
                        </FormWrapper>
                        <div style={{ width: "1.5em" }} />
                        <FormWrapper label="">
                            <Button
                                onClick={() =>
                                    props.dispatch({
                                        type: "SET_UNIT_RATE_CALCULATION",
                                    })
                                }
                            >
                                Revert to Unit Rate Calculation
                            </Button>
                        </FormWrapper>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th
                                    style={{
                                        width: "1em",
                                        textAlign: "center",
                                    }}
                                />
                                <th
                                    style={{
                                        width: "8em",
                                        textAlign: "center",
                                    }}
                                >
                                    Multiply
                                </th>
                                <th
                                    style={{
                                        width: "8em",
                                        textAlign: "center",
                                    }}
                                >
                                    Length (ft)
                                </th>
                                <th
                                    style={{
                                        width: "8em",
                                        textAlign: "center",
                                    }}
                                >
                                    Width (in)
                                </th>
                                <th
                                    style={{
                                        width: "8em",
                                        textAlign: "center",
                                    }}
                                >
                                    Depth (in)
                                </th>
                                <th
                                    style={{
                                        width: "4em",
                                        textAlign: "center",
                                    }}
                                >
                                    Inefficiency
                                </th>
                                <th
                                    style={{
                                        width: "8em",
                                        textAlign: "center",
                                    }}
                                >
                                    Total
                                </th>
                                <th />
                                <th style={{ width: "1em" }} />
                            </tr>
                        </thead>
                        <props.widgets.sealantCalculatorUnits
                            containerClass="tbody"
                            extraItemForAdd
                        />
                    </table>
                </>
            );
        default:
            return (
                <>
                    {overrideCopyUnits}
                    <SideWidgetWidgets.room />;
                </>
            );
    }
}

function FinishSchedule(props: Props & { widgets: Widgets }) {
    return props.estimateActionWidget("finishSchedule");
}

const TABS = [
    {
        id: "DETAILS",
        name: "Details",
        component: Details,
    },

    {
        id: "CALCULATOR",
        name: "Calculator",
        component: Calculator,
    },
    {
        id: "FINISH_SCHEDULE",
        name: "Finish Schedule",
        component: FinishSchedule,
    },
];

function ActionModal(props: Props & { widgets: Widgets }) {
    const onClose = React.useCallback(
        () =>
            props.dispatch({
                type: "CLOSE_ACTION_MODAL",
            }),
        [props.dispatch]
    );

    const onTabSelect = React.useCallback(
        (eventKey) =>
            props.dispatch({
                type: "SET_ACTION_MODAL",
                tab: eventKey,
            }),
        [props.dispatch]
    );

    return (
        props.state.actionModal && (
            <Modal
                isOpen={props.state.actionModal !== null}
                onRequestClose={onClose}
                style={{
                    content: {
                        display: "flex",
                        flexDirection: "column",
                        zIndex: 200,
                        padding: 0,
                    },
                }}
            >
                <ModalHeader>
                    <ModalTitle>
                        {props.estimateAction.name} &ndash;{" "}
                        {
                            find(
                                TABS,
                                (tab) => tab.id == props.state.actionModal
                            )?.name
                        }
                    </ModalTitle>
                </ModalHeader>
                <ModalBody
                    style={{
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Tab.Container
                        activeKey={props.state.actionModal}
                        onSelect={onTabSelect}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                flexGrow: 1,
                                overflowY: "auto",
                            }}
                        >
                            <div {...CONTENT_AREA}>
                                <Tab.Content {...CONTENT_AREA}>
                                    {TABS.map((tab) => (
                                        <Tab.Pane
                                            key={tab.id}
                                            eventKey={tab.id}
                                            {...CONTENT_AREA}
                                        >
                                            {props.state.actionModal ===
                                                tab.id && (
                                                <tab.component {...props} />
                                            )}
                                        </Tab.Pane>
                                    ))}
                                </Tab.Content>
                            </div>
                            <div>
                                <Nav variant="pills">
                                    {TABS.map((tab) => (
                                        <Nav.Item key={tab.id}>
                                            <Nav.Link eventKey={tab.id}>
                                                {tab.name}
                                            </Nav.Link>
                                        </Nav.Item>
                                    ))}
                                </Nav>
                            </div>
                        </div>
                    </Tab.Container>
                </ModalBody>
            </Modal>
        )
    );
}

const ACTIVE_COLOR = "#80ff66";
function Component(props: Props) {
    const estimateContext = useRecordContext(ESTIMATE_META);
    if (!estimateContext) {
        throw new Error("Expected estimate context");
    }
    const listItemContext = useListItemContext();

    const onNameClick = React.useCallback(
        () =>
            props.dispatch({
                type: "SET_ACTION_MODAL",
                tab: "DETAILS",
            }),
        [props.dispatch]
    );

    const onCalculatorClick = React.useCallback(
        () =>
            props.dispatch({
                type: "SET_ACTION_MODAL",
                tab: "CALCULATOR",
            }),
        [props.dispatch]
    );

    const onFinishScheduleClick = React.useCallback(
        () =>
            props.dispatch({
                type: "SET_ACTION_MODAL",
                tab: "FINISH_SCHEDULE",
            }),
        [props.dispatch]
    );

    const sideContext = useRecordContext(SIDE_META);
    if (sideContext === undefined) {
        throw new Error("Expected to be used in side");
    }

    const resolved = resolveAction(
        props.estimateAction,
        props.data,
        sideContext,
        estimateContext,
        props.contingency
    );

    const hourMaterialsDispatch = React.useCallback(
        (action: Action) => {
            switch (action.type) {
                case "HOURS":
                    if (isDecimalChangeAction(action.action)) {
                        props.dispatch({
                            type: "MATERIALS",
                            action: {
                                type: "SET",
                                value: resolved.materials,
                            },
                        });
                    }
                case "MATERIALS":
                    if (isDecimalChangeAction(action.action)) {
                        props.dispatch({
                            type: "HOURS",
                            action: {
                                type: "SET",
                                value: resolved.hours,
                            },
                        });
                    }
            }
            props.dispatch(action);
        },
        [props.dispatch, resolved]
    );

    const hasNote = noteTags(estimateContext).has(props.estimateAction.name);

    const itemType = useQuickRecord(
        ITEM_TYPE_META,
        props.estimateAction.itemType
    );

    const finishSchedules = useRecordQuery(
        FINISH_SCHEDULE_META,
        {
            filters: [
                {
                    column: "substrates",
                    filter: {
                        intersects: [itemType?.substrate || null],
                    },
                },
                {
                    column: "name",
                    filter: {
                        equal: props.estimateAction.finishSchedule,
                    },
                },
            ],
        },
        [itemType?.substrate, props.estimateAction.finishSchedule],
        !!itemType
    );

    const modifiedMaterialsRate =
        finishSchedules && finishSchedules[0]
            ? !finishSchedules[0].rate.equals(
                  props.estimateAction.materialsRate
              )
            : false;

    const mayModifyUnits =
        props.contingency &&
        props.data.calculatorUnits.length <= 1 &&
        !some(
            props.data.calculatorUnits,
            (x) => !x.height.equals(new Decimal(1))
        );
    const unitsState = mayModifyUnits
        ? props.state.calculatorUnits.items[0]?.width || null
        : null;

    const unitsDispatch = React.useCallback(
        (action: NumberWidgetAction) => {
            if (props.data.calculatorUnits.length == 0) {
                props.dispatch({
                    type: "CALCULATOR_UNITS",
                    action: {
                        type: "NEW",
                        actions: [
                            {
                                type: "WIDTH",
                                action,
                            },
                        ],
                    },
                });
            } else {
                props.dispatch({
                    type: "CALCULATOR_UNITS",
                    action: {
                        type: "ITEM",
                        index: 0,
                        action: {
                            type: "WIDTH",
                            action,
                        },
                    },
                });
            }
        },
        [props.data.calculatorUnits, props.dispatch]
    );

    return (
        <tr {...listItemContext.draggableProps}>
            <td>{listItemContext.dragHandle}</td>
            <td>
                <ActionModal {...props} widgets={widgets} />
                <Button variant="light" onClick={onNameClick} {...BUTTON_STYLE}>
                    {props.estimateAction.name}{" "}
                    {hasNote && <FontAwesomeIcon icon={faStickyNote} />}
                </Button>
            </td>
            <td
                style={{
                    width: ".125in",
                    backgroundColor:
                        resolved.mode === "calculator"
                            ? ACTIVE_COLOR
                            : undefined,
                }}
            >
                <Button onClick={onCalculatorClick}>
                    <FontAwesomeIcon icon={faCalculator} />
                </Button>
            </td>
            {!props.contingency && (
                <td>
                    <Button
                        onClick={onFinishScheduleClick}
                        variant="light"
                        {...BUTTON_STYLE}
                    >
                        {props.estimateAction.finishSchedule}

                        {modifiedMaterialsRate && (
                            <Badge
                                style={{ marginLeft: ".5em" }}
                                variant="danger"
                            >
                                Modified
                            </Badge>
                        )}
                    </Button>
                </td>
            )}
            {!props.contingency && (
                <td
                    style={{
                        position: "relative",
                        width: "1.1in",
                        backgroundColor:
                            resolved.mode === "hours-materials"
                                ? ACTIVE_COLOR
                                : undefined,
                    }}
                >
                    {props.estimateAction.hourRate !== null && (
                        <div
                            style={{
                                position: "absolute",
                                left: "10px",
                                zIndex: 10,
                            }}
                        >
                            *
                        </div>
                    )}
                    <widgets.hours
                        dispatch={hourMaterialsDispatch}
                        hideStatus
                        defaultData={resolved.hours}
                    />
                </td>
            )}
            {!props.contingency && (
                <td
                    style={{
                        width: "1.1in",
                        backgroundColor:
                            resolved.mode === "hours-materials"
                                ? ACTIVE_COLOR
                                : undefined,
                    }}
                >
                    <widgets.materials
                        hideStatus
                        dispatch={hourMaterialsDispatch}
                        defaultData={resolved.materials}
                    />
                </td>
            )}

            <td
                style={{
                    width: "1.1in",
                    backgroundColor:
                        resolved.mode === "calculator"
                            ? ACTIVE_COLOR
                            : undefined,
                }}
            >
                <QuantityWidget.component
                    data={resolved.units}
                    dispatch={unitsDispatch}
                    state={unitsState}
                    status={{
                        mutable: mayModifyUnits,
                        validation: [],
                    }}
                    hideStatus={true}
                />
            </td>
            <td
                style={{
                    width: "1.25in",
                    backgroundColor:
                        resolved.mode === "calculator"
                            ? ACTIVE_COLOR
                            : undefined,
                }}
            >
                {props.estimateActionWidget("unitRate")}
            </td>
            {props.contingency && (
                <td
                    style={{
                        width: "1.25in",
                    }}
                >
                    {props.estimateActionWidget("unitRateWithMarkup")}
                </td>
            )}
            {props.contingency && (
                <td>{props.estimateActionWidget("markup")}</td>
            )}
            <td
                style={{
                    width: "1.5in",
                }}
            >
                <MoneyStatic
                    value={resolved.hoursCost
                        .plus(resolved.materialsCost)
                        .toDecimalPlaces(2)}
                />
            </td>
            <td
                style={{
                    width: "1.5in",
                }}
            >
                <MoneyStatic
                    value={resolved.hoursPrice.plus(resolved.materialsPrice)}
                />
            </td>
            {props.areas && <td>{props.areas}</td>}

            <td
                style={{
                    whiteSpace: "nowrap",
                }}
            >
                <Button onClick={props.onDuplicate}>
                    <FontAwesomeIcon icon={faCopy} />
                </Button>
                <Button
                    variant="danger"
                    onClick={props.onRemove}
                    style={{ marginLeft: ".25em" }}
                >
                    <FontAwesomeIcon icon={faTrashAlt} />
                </Button>
            </td>
        </tr>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.hours> &
    WidgetContext<typeof Fields.materials> &
    WidgetContext<typeof Fields.calculatorUnits> &
    WidgetContext<typeof Fields.sealantCalculatorUnits> &
    WidgetContext<typeof Fields.overrideCopyUnits>;
type BaseState = {
    hours: WidgetState<typeof Fields.hours>;
    materials: WidgetState<typeof Fields.materials>;
    calculatorUnits: WidgetState<typeof Fields.calculatorUnits>;
    sealantCalculatorUnits: WidgetState<typeof Fields.sealantCalculatorUnits>;
    overrideCopyUnits: WidgetState<typeof Fields.overrideCopyUnits>;
    initialParameters?: string[];
};
export type State = BaseState & ExtraState;

type BaseAction =
    | { type: "HOURS"; action: WidgetAction<typeof Fields.hours> }
    | { type: "MATERIALS"; action: WidgetAction<typeof Fields.materials> }
    | {
          type: "CALCULATOR_UNITS";
          action: WidgetAction<typeof Fields.calculatorUnits>;
      }
    | {
          type: "SEALANT_CALCULATOR_UNITS";
          action: WidgetAction<typeof Fields.sealantCalculatorUnits>;
      }
    | {
          type: "OVERRIDE_COPY_UNITS";
          action: WidgetAction<typeof Fields.overrideCopyUnits>;
      };

export type Action = ExtraActions | BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.hours, data.hours, cache, "hours", errors);
    subvalidate(Fields.materials, data.materials, cache, "materials", errors);
    subvalidate(
        Fields.calculatorUnits,
        data.calculatorUnits,
        cache,
        "calculatorUnits",
        errors
    );
    subvalidate(
        Fields.sealantCalculatorUnits,
        data.sealantCalculatorUnits,
        cache,
        "sealantCalculatorUnits",
        errors
    );
    subvalidate(
        Fields.overrideCopyUnits,
        data.overrideCopyUnits,
        cache,
        "overrideCopyUnits",
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
        case "CALCULATOR_UNITS": {
            const inner = Fields.calculatorUnits.reduce(
                state.calculatorUnits,
                data.calculatorUnits,
                action.action,
                subcontext
            );
            return {
                state: { ...state, calculatorUnits: inner.state },
                data: { ...data, calculatorUnits: inner.data },
            };
        }
        case "SEALANT_CALCULATOR_UNITS": {
            const inner = Fields.sealantCalculatorUnits.reduce(
                state.sealantCalculatorUnits,
                data.sealantCalculatorUnits,
                action.action,
                subcontext
            );
            return {
                state: { ...state, sealantCalculatorUnits: inner.state },
                data: { ...data, sealantCalculatorUnits: inner.data },
            };
        }
        case "OVERRIDE_COPY_UNITS": {
            const inner = Fields.overrideCopyUnits.reduce(
                state.overrideCopyUnits,
                data.overrideCopyUnits,
                action.action,
                subcontext
            );
            return {
                state: { ...state, overrideCopyUnits: inner.state },
                data: { ...data, overrideCopyUnits: inner.data },
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
    calculatorUnits: function (
        props: WidgetExtraProps<typeof Fields.calculatorUnits> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CALCULATOR_UNITS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "calculatorUnits", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.calculatorUnits.component
                state={context.state.calculatorUnits}
                data={context.data.calculatorUnits}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Calculator Units"}
            />
        );
    },
    sealantCalculatorUnits: function (
        props: WidgetExtraProps<typeof Fields.sealantCalculatorUnits> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SEALANT_CALCULATOR_UNITS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "sealantCalculatorUnits",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.sealantCalculatorUnits.component
                state={context.state.sealantCalculatorUnits}
                data={context.data.sealantCalculatorUnits}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Sealant Calculator Units"}
            />
        );
    },
    overrideCopyUnits: function (
        props: WidgetExtraProps<typeof Fields.overrideCopyUnits> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "OVERRIDE_COPY_UNITS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "overrideCopyUnits",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.overrideCopyUnits.component
                state={context.state.overrideCopyUnits}
                data={context.data.overrideCopyUnits}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Override Copy Units"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: SIDE_ACTION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        const result = initialize(data, context);
        data = result.data;
        let subparameters: Dictionary<string[]> =
            (result as any).parameters || {};
        let subcontext = context;
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
        let calculatorUnitsState;
        {
            const inner = Fields.calculatorUnits.initialize(
                data.calculatorUnits,
                subcontext,
                subparameters.calculatorUnits
            );
            calculatorUnitsState = inner.state;
            data = { ...data, calculatorUnits: inner.data };
        }
        let sealantCalculatorUnitsState;
        {
            const inner = Fields.sealantCalculatorUnits.initialize(
                data.sealantCalculatorUnits,
                subcontext,
                subparameters.sealantCalculatorUnits
            );
            sealantCalculatorUnitsState = inner.state;
            data = { ...data, sealantCalculatorUnits: inner.data };
        }
        let overrideCopyUnitsState;
        {
            const inner = Fields.overrideCopyUnits.initialize(
                data.overrideCopyUnits,
                subcontext,
                subparameters.overrideCopyUnits
            );
            overrideCopyUnitsState = inner.state;
            data = { ...data, overrideCopyUnits: inner.data };
        }
        let state = {
            initialParameters: parameters,
            ...result.state,
            hours: hoursState,
            materials: materialsState,
            calculatorUnits: calculatorUnitsState,
            sealantCalculatorUnits: sealantCalculatorUnitsState,
            overrideCopyUnits: overrideCopyUnitsState,
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
                <RecordContext meta={SIDE_ACTION_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
};
export default Widget;
type Widgets = {
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
    calculatorUnits: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.calculatorUnits>
    >;
    sealantCalculatorUnits: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.sealantCalculatorUnits>
    >;
    overrideCopyUnits: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.overrideCopyUnits>
    >;
};
// END MAGIC -- DO NOT EDIT
