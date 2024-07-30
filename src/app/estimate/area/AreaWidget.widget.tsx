import { faStickyNote } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Decimal from "decimal.js";
import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
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
import { TabsWidget } from "../../../clay/widgets/TabsWidget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { newSideAction } from "../action/table";
import { ReactContext as AreasWidgetReactContext } from "../AreasWidget.widget";
import SideWidget from "../side/SideWidget.widget";
import { Estimate, noteTags } from "../table";
import { Area, AREA_META } from "./table";

export type Data = Area;

export type ExtraProps = {
    estimate: Estimate;
};

function encodeState(state: State) {
    const innerEncodeState = Fields.sides.encodeState;
    if (!innerEncodeState) {
        throw new Error("missing encode state");
    }
    return innerEncodeState(state.sides);
}

function actionSetPhase(state: State, data: Area, value: Decimal) {
    return {
        state,
        data: {
            ...data,
            phase: value,
        },
    };
}

function initialize(data: Area, context: Context, parameters: string[] = []) {
    return {
        state: {},
        data,
        parameters: {
            sides: parameters,
        },
    };
}

export const Fields = {
    sides: TabsWidget(SideWidget, {
        namePrompt: "Name for new side?",
        adaptNewItem: (side, sides, context) => {
            return {
                ...side,
                room: {
                    width: new Decimal(0),
                    height: new Decimal(0),
                    length: new Decimal(0),
                    note: "",
                    additionalRooms: [],

                    includeBaseboard: false,
                    includeChairRail: false,
                    includeCrown: false,
                    includeCeiling: false,
                    includeWalls: false,

                    multiplyBaseboard: new Decimal(1),
                    multiplyChairRail: new Decimal(1),
                    multiplyCrown: new Decimal(1),
                    multiplyCeiling: new Decimal(1),
                    multiplyWalls: new Decimal(1),
                },
                multiply: new Decimal(1),
                actions: context.estimate.actions.map((action) =>
                    newSideAction()
                ),
            };
        },
    }),
    name: TextWidget,
};

function Component(props: Props) {
    const areasContext = React.useContext(AreasWidgetReactContext);
    if (!areasContext) {
        throw new Error("Should be used inside areas");
    }

    const sideActions = React.useCallback(
        (side, index) => [
            {
                label: "Duplicate",
                action: () => {
                    const name = prompt("Name for new area?", side.name);
                    if (name != null) {
                        props.dispatch({
                            type: "SIDES" as const,
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
                label: "Remove",
                action: () => {
                    if (confirm("Are you sure you want to delete side?")) {
                        props.dispatch({
                            type: "SIDES" as const,
                            action: {
                                index,
                                type: "REMOVE",
                            },
                        });
                    }
                },
            },
            ...areasContext.data.areas.flatMap((area, areaIndex) =>
                area !== props.data
                    ? [
                          {
                              label: "Move to " + area.name,
                              action: () => {
                                  areasContext.dispatch({
                                      type: "MOVE_SIDE" as const,
                                      sourceArea:
                                          areasContext.data.areas.indexOf(
                                              props.data
                                          ),
                                      destinationArea: areaIndex,
                                      side: index,
                                  });
                              },
                          },
                      ]
                    : []
            ),
        ],
        [props.dispatch]
    );

    const notes = noteTags(areasContext.data);
    return (
        <widgets.sides
            itemProps={{ estimate: props.estimate }}
            tabsStyle={{
                marginRight:
                    props.estimate.areas.length == 1 ? "100px" : undefined,
            }}
            actions={sideActions}
            labelForItem={(side) => {
                return (
                    <>
                        {side.name}{" "}
                        {notes.has(side.name) && (
                            <FontAwesomeIcon icon={faStickyNote} />
                        )}
                    </>
                );
            }}
        />
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.sides> &
    WidgetContext<typeof Fields.name>;
type BaseState = {
    sides: WidgetState<typeof Fields.sides>;
    name: WidgetState<typeof Fields.name>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "SIDES"; action: WidgetAction<typeof Fields.sides> }
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "SET_PHASE"; value: Decimal };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.sides, data.sides, cache, "sides", errors);
    subvalidate(Fields.name, data.name, cache, "name", errors);
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
        case "SIDES": {
            const inner = Fields.sides.reduce(
                state.sides,
                data.sides,
                action.action,
                subcontext
            );
            return {
                state: { ...state, sides: inner.state },
                data: { ...data, sides: inner.data },
            };
        }
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
        case "SET_PHASE":
            return actionSetPhase(state, data, action.value);
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
    sides: function (
        props: WidgetExtraProps<typeof Fields.sides> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "SIDES", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "sides", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.sides.component
                state={context.state.sides}
                data={context.data.sides}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Sides"}
            />
        );
    },
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: AREA_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        const result = initialize(data, context, parameters);
        data = result.data;
        let subparameters: Dictionary<string[]> =
            (result as any).parameters || {};
        let subcontext = context;
        let sidesState;
        {
            const inner = Fields.sides.initialize(
                data.sides,
                subcontext,
                subparameters.sides
            );
            sidesState = inner.state;
            data = { ...data, sides: inner.data };
        }
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
        let state = {
            initialParameters: parameters,
            ...result.state,
            sides: sidesState,
            name: nameState,
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
                <RecordContext meta={AREA_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    sides: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.sides>
    >;
    name: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.name>
    >;
};
// END MAGIC -- DO NOT EDIT
