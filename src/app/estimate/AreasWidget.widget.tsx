import { faStickyNote } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Decimal from "decimal.js";
import { every, range } from "lodash";
import * as React from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { PageContext } from "../../clay/Page";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { newUUID } from "../../clay/uuid";
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
import { ListItemWidget } from "../../clay/widgets/list-item-widget";
import {
    duplicateIndex,
    moveIndex,
    removeIndex,
} from "../../clay/widgets/ListWidget";
import { TabsWidget } from "../../clay/widgets/TabsWidget";
import AreaWidget from "../estimate/area/AreaWidget.widget";
import EstimateActionWidget from "./action/EstimateActionWidget.widget";
import SideActionWidget from "./action/SideActionWidget.widget";
import { resolveAction } from "./action/table";
import { Estimate, ESTIMATE_META, noteTags } from "./table";
import { ItemType } from "./types/table";

export type Data = Estimate;

export type Context = PageContext;

export function subContext(estimate: Estimate, context: Context): SubContext {
    return {
        ...context,
        estimate,
    };
}

export function initialize(
    data: Estimate,
    context: Context,
    parameters: string[] = []
) {
    return {
        state: {},
        data,
        parameters: {
            areas: parameters,
        },
    };
}

export function encodeState(state: State) {
    let encodeInnerState = Fields.areas.encodeState;
    if (!encodeInnerState) {
        throw new Error("missing encode state");
    }
    return encodeInnerState(state.areas);
}

export const Fields = {
    areas: TabsWidget(AreaWidget, {
        namePrompt: "Name for new area?",
    }),
    actions: ListItemWidget(EstimateActionWidget),
};

type ExtraActions =
    | {
          type: "MOVE_ACTION";
          from: number;
          to: number;
      }
    | {
          type: "REMOVE_ACTION";
          index: number;
      }
    | {
          type: "DUPLICATE_ACTION";
          index: number;
          name: string;
      }
    | {
          type: "ADD_ACTION";
          itemType: ItemType;
      }
    | {
          type: "CLEAR_EMPTY";
      }
    | {
          type: "MOVE_SIDE";
          sourceArea: number;
          destinationArea: number;
          side: number;
      };

function isZeroOrNull(number: Decimal | null) {
    return number === null || number.isZero();
}

function reduce(
    state: State,
    data: Data,
    action: Action,
    context: Context
): WidgetResult<State, Data> {
    switch (action.type) {
        case "ADD_ACTION":
            const ESTIMATE_ACTION = {
                id: newUUID(),
                name: action.itemType.name,
                itemType: action.itemType.id.uuid,
                unitType: action.itemType.defaultUnitType,
                calculator: action.itemType.calculator,
                application: null,
                applicationType: null,
                hourRatio: new Decimal(1),
                materialsRatio: new Decimal(0),
                materialsRate: new Decimal(0),
                hourRate: null,
                unitIncrement: new Decimal(1),
                customUnitRate: null,
                finishSchedule: "",
                rateName: "",
                copyUnitsFromAction: null,
                markup: null,
            };
            const EMPTY_ACTION = {
                hours: new Decimal(0),
                materials: new Decimal(0),
                units: null,
                calculatorUnits: [],
                sealantCalculatorUnits: [],
                exclusions: [],
                warrantyExclusions: [],
                fieldNotes: [],
                note: { url: "" },
                overrideCopyUnits: false,
            };
            return {
                data: {
                    ...data,
                    actions: [...data.actions, ESTIMATE_ACTION],
                    areas: data.areas.map((area) => ({
                        ...area,
                        sides: area.sides.map((side) => ({
                            ...side,
                            actions: [...side.actions, EMPTY_ACTION],
                        })),
                    })),
                },
                state: {
                    ...state,
                    actions: {
                        ...state.actions,
                        items: [
                            ...state.actions.items,
                            EstimateActionWidget.initialize(
                                ESTIMATE_ACTION,
                                context
                            ).state,
                        ],
                    },
                    areas: {
                        ...state.areas,
                        items: state.areas.items.map((area) => ({
                            ...area,
                            sides: {
                                ...area.sides,
                                items: area.sides.items.map((side) => ({
                                    ...side,
                                    addingAction: false,
                                    actions: {
                                        ...side.actions,
                                        items: [
                                            ...side.actions.items,
                                            SideActionWidget.initialize(
                                                EMPTY_ACTION,
                                                context
                                            ).state,
                                        ],
                                    },
                                })),
                            },
                        })),
                    },
                },
            };
        case "CLEAR_EMPTY":
            const emptyActions = range(data.actions.length).filter(
                (actionIndex) =>
                    every(
                        data.areas
                            .flatMap((area) => area.sides)
                            .map(
                                (side) =>
                                    isZeroOrNull(
                                        side.actions[actionIndex].hours
                                    ) &&
                                    isZeroOrNull(
                                        side.actions[actionIndex].materials
                                    ) &&
                                    isZeroOrNull(
                                        resolveAction(
                                            data.actions[actionIndex],
                                            side.actions[actionIndex],
                                            side,
                                            data,
                                            false
                                        ).units
                                    )
                            )
                    )
            );

            const filtered = function <T>(items: T[]) {
                return items.filter(
                    (_, index) => emptyActions.indexOf(index) === -1
                );
            };

            return {
                data: {
                    ...data,
                    actions: filtered(data.actions),
                    areas: data.areas.map((area) => ({
                        ...area,
                        sides: area.sides.map((side) => ({
                            ...side,
                            actions: filtered(side.actions),
                        })),
                    })),
                },
                state: {
                    ...state,
                    actions: {
                        ...state.actions,
                        items: filtered(state.actions.items),
                    },
                    areas: {
                        ...state.areas,
                        items: state.areas.items.map((area) => ({
                            ...area,
                            sides: {
                                ...area.sides,
                                items: area.sides.items.map((side) => ({
                                    ...side,
                                    actions: {
                                        ...side.actions,
                                        items: filtered(side.actions.items),
                                    },
                                })),
                            },
                        })),
                    },
                },
            };
        case "MOVE_ACTION":
            return {
                data: {
                    ...data,
                    actions: moveIndex(data.actions, action.from, action.to),
                    areas: data.areas.map((area) => ({
                        ...area,
                        sides: area.sides.map((side) => ({
                            ...side,
                            actions: moveIndex(
                                side.actions,
                                action.from,
                                action.to
                            ),
                        })),
                    })),
                },
                state: {
                    ...state,
                    areas: {
                        ...state.areas,
                        items: state.areas.items.map((area) => ({
                            ...area,
                            sides: {
                                ...area.sides,
                                items: area.sides.items.map((side) => ({
                                    ...side,
                                    actions: {
                                        ...side.actions,
                                        items: moveIndex(
                                            side.actions.items,
                                            action.from,
                                            action.to
                                        ),
                                    },
                                })),
                            },
                        })),
                    },
                },
            };
        case "REMOVE_ACTION":
            return {
                data: {
                    ...data,
                    actions: removeIndex(data.actions, action.index),
                    areas: data.areas.map((area) => ({
                        ...area,
                        sides: area.sides.map((side) => ({
                            ...side,
                            actions: removeIndex(side.actions, action.index),
                        })),
                    })),
                },
                state: {
                    ...state,
                    actions: {
                        ...state.actions,
                        items: removeIndex(state.actions.items, action.index),
                    },
                    areas: {
                        ...state.areas,
                        items: state.areas.items.map((area) => ({
                            ...area,
                            sides: {
                                ...area.sides,
                                items: area.sides.items.map((side) => ({
                                    ...side,
                                    actions: {
                                        ...side.actions,
                                        items: removeIndex(
                                            side.actions.items,
                                            action.index
                                        ),
                                    },
                                })),
                            },
                        })),
                    },
                },
            };
        case "DUPLICATE_ACTION":
            return {
                data: {
                    ...data,
                    actions: duplicateIndex(
                        data.actions,
                        action.index,
                        (oldAction) => ({
                            ...oldAction,
                            id: newUUID(),
                            name: action.name,
                        })
                    ),
                    areas: data.areas.map((area) => ({
                        ...area,
                        sides: area.sides.map((side) => ({
                            ...side,
                            actions: duplicateIndex(
                                side.actions,
                                action.index,
                                () => ({
                                    hours: null,
                                    materials: null,
                                    calculatorUnits: [],
                                    sealantCalculatorUnits: [],
                                    overrideCopyUnits: false,
                                })
                            ),
                        })),
                    })),
                },
                state: {
                    ...state,
                    actions: {
                        ...state.actions,
                        items: duplicateIndex(
                            state.actions.items,
                            action.index
                        ),
                    },
                    areas: {
                        ...state.areas,
                        items: state.areas.items.map((area) => ({
                            ...area,
                            sides: {
                                ...area.sides,
                                items: area.sides.items.map((side) => ({
                                    ...side,
                                    actions: {
                                        ...side.actions,
                                        items: duplicateIndex(
                                            side.actions.items,
                                            action.index,
                                            (x) => ({
                                                ...x,
                                                calculatorUnits: {
                                                    ...x.calculatorUnits,
                                                    items: [],
                                                },
                                            })
                                        ),
                                    },
                                })),
                            },
                        })),
                    },
                },
            };
        case "MOVE_SIDE":
            return {
                data: {
                    ...data,
                    areas: data.areas.map((area, areaIndex) => {
                        if (action.sourceArea == areaIndex) {
                            const sides = area.sides.slice();
                            sides.splice(action.side, 1);
                            return {
                                ...area,
                                sides,
                            };
                        } else if (action.destinationArea === areaIndex) {
                            return {
                                ...area,
                                sides: [
                                    ...area.sides,
                                    data.areas[action.sourceArea].sides[
                                        action.side
                                    ],
                                ],
                            };
                        } else {
                            return area;
                        }
                    }),
                },
                state: {
                    ...state,
                    areas: {
                        ...state.areas,
                        items: state.areas.items.map((area, areaIndex) => {
                            if (action.sourceArea == areaIndex) {
                                const sides = area.sides.items.slice();
                                sides.splice(action.side, 1);
                                return {
                                    ...area,
                                    sides: {
                                        ...area.sides,
                                        items: sides,
                                    },
                                };
                            } else if (action.destinationArea === areaIndex) {
                                return {
                                    ...area,
                                    sides: {
                                        ...area.sides,
                                        items: [
                                            ...area.sides.items,
                                            state.areas.items[action.sourceArea]
                                                .sides.items[action.side],
                                        ],
                                    },
                                };
                            } else {
                                return area;
                            }
                        }),
                    },
                },
            };

        default:
            let result = baseReduce(state, data, action, context);

            return result;
    }
}

function Component(props: Props) {
    const finalPhase =
        props.data.areas.length > 0
            ? Decimal.max(...props.data.areas.map((area) => area.phase))
            : new Decimal(0);
    const areaActions = React.useCallback(
        (area, index) => [
            {
                widget: () => {
                    return (
                        <ButtonGroup key="phase">
                            {range(finalPhase.toNumber() + 1).map(
                                (phaseIndex) => (
                                    <Button
                                        key={phaseIndex}
                                        variant={
                                            phaseIndex == area.phase.toNumber()
                                                ? "primary"
                                                : "secondary"
                                        }
                                        onClick={() => {
                                            props.dispatch({
                                                type: "AREAS",
                                                action: {
                                                    type: "ITEM",
                                                    index: index,
                                                    action: {
                                                        type: "SET_PHASE",
                                                        value: new Decimal(
                                                            phaseIndex
                                                        ),
                                                    },
                                                },
                                            });
                                        }}
                                    >
                                        {phaseIndex + 1}
                                    </Button>
                                )
                            )}
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    props.dispatch({
                                        type: "AREAS",
                                        action: {
                                            type: "ITEM",
                                            index: index,
                                            action: {
                                                type: "SET_PHASE",
                                                value: finalPhase.plus(1),
                                            },
                                        },
                                    });
                                }}
                            >
                                +
                            </Button>
                        </ButtonGroup>
                    );
                },
            },
            {
                label: "Rename",
                action: () => {
                    const name = prompt("Area Name?", area.name);
                    if (name != null) {
                        props.dispatch({
                            type: "AREAS" as const,
                            action: {
                                index,
                                type: "ITEM",
                                action: {
                                    type: "NAME" as const,
                                    action: {
                                        type: "SET" as const,
                                        value: name,
                                    },
                                },
                            },
                        });
                    }
                },
            },
            {
                label: "Duplicate",
                action: () => {
                    const name = prompt("Name for new area?", area.name);
                    if (name != null) {
                        props.dispatch({
                            type: "AREAS" as const,
                            action: {
                                index,
                                type: "DUPLICATE",
                                action: {
                                    type: "NAME" as const,
                                    action: {
                                        type: "SET" as const,
                                        value: name,
                                    },
                                },
                            },
                        });
                    }
                },
            },
            {
                label: props.data.areas.length === 1 ? "Single-Area" : "Remove",
                action: () => {
                    if (props.data.areas.length === 1) {
                        props.dispatch({
                            type: "AREAS" as const,
                            action: {
                                index: 0,
                                type: "ITEM",
                                action: {
                                    type: "NAME",
                                    action: {
                                        type: "SET",
                                        value: "",
                                    },
                                },
                            },
                        });
                    } else if (
                        confirm("Are you sure you want to delete area?")
                    ) {
                        props.dispatch({
                            type: "AREAS" as const,
                            action: {
                                index,
                                type: "REMOVE",
                            },
                        });
                    }
                },
            },
        ],
        [props.dispatch, finalPhase, props.data.areas]
    );
    const deSolo = React.useCallback(() => {
        const name = prompt("Name for area?");
        if (!name) {
            return;
        }
        props.dispatch({
            type: "AREAS",
            action: {
                type: "ITEM",
                index: 0,
                action: {
                    type: "NAME",
                    action: {
                        type: "SET",
                        value: name,
                    },
                },
            },
        });
    }, [props.dispatch]);
    const notes = noteTags(props.data);
    return (
        <widgets.areas
            collapseSolo={
                props.data.areas.length == 1 && props.data.areas[0].name == ""
            }
            deSolo={deSolo}
            itemProps={{ estimate: props.data }}
            actions={areaActions}
            labelForItem={(area) => {
                return (
                    <>
                        {area.name}{" "}
                        {notes.has(area.name) && (
                            <FontAwesomeIcon icon={faStickyNote} />
                        )}
                    </>
                );
            }}
        />
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type SubContext = WidgetContext<typeof Fields.areas> &
    WidgetContext<typeof Fields.actions>;
type ExtraProps = {};
type BaseState = {
    areas: WidgetState<typeof Fields.areas>;
    actions: WidgetState<typeof Fields.actions>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "AREAS"; action: WidgetAction<typeof Fields.areas> }
    | { type: "ACTIONS"; action: WidgetAction<typeof Fields.actions> };

export type Action = ExtraActions | BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.areas, data.areas, cache, "areas", errors);
    subvalidate(Fields.actions, data.actions, cache, "actions", errors);
    return errors;
}
function baseReduce(
    state: State,
    data: Data,
    action: BaseAction,
    context: Context
): WidgetResult<State, Data> {
    let subcontext: SubContext = subContext(data, context);
    switch (action.type) {
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
        case "ACTIONS": {
            const inner = Fields.actions.reduce(
                state.actions,
                data.actions,
                action.action,
                subcontext
            );
            return {
                state: { ...state, actions: inner.state },
                data: { ...data, actions: inner.data },
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
    actions: function (
        props: WidgetExtraProps<typeof Fields.actions> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ACTIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "actions", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.actions.component
                state={context.state.actions}
                data={context.data.actions}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Actions"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ESTIMATE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        const result = initialize(data, context, parameters);
        data = result.data;
        let subparameters: Dictionary<string[]> =
            (result as any).parameters || {};
        let subcontext: SubContext = subContext(data, context);
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
        let actionsState;
        {
            const inner = Fields.actions.initialize(
                data.actions,
                subcontext,
                subparameters.actions
            );
            actionsState = inner.state;
            data = { ...data, actions: inner.data };
        }
        let state = {
            initialParameters: parameters,
            ...result.state,
            areas: areasState,
            actions: actionsState,
        };
        return {
            state,
            data,
        };
    },
    validate: baseValidate,
    encodeState: encodeState,
    component: React.memo((props: Props) => {
        return (
            <ReactContext.Provider value={props}>
                <RecordContext meta={ESTIMATE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
};
export default Widget;
type Widgets = {
    areas: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.areas>
    >;
    actions: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.actions>
    >;
};
// END MAGIC -- DO NOT EDIT
