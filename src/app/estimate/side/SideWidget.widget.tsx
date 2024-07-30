import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Decimal from "decimal.js";
import { css } from "glamor";
import { some } from "lodash";
import * as React from "react";
import { Button } from "react-bootstrap";
import Modal from "react-modal";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi, useQuickAllRecords } from "../../../clay/quick-cache";
import {
    DecimalStatic,
    DecimalWidget,
} from "../../../clay/widgets/DecimalWidget";
import { FormField } from "../../../clay/widgets/FormField";
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
import { ListWidget } from "../../../clay/widgets/ListWidget";
import { MoneyStatic } from "../../../clay/widgets/money-widget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { CONTENT_AREA, TABLE_STYLE } from "../../styles";
import { EstimateActionWidgetTypes } from "../action/EstimateActionWidget.widget";
import SideActionWidget, {
    ActionModalTab,
} from "../action/SideActionWidget.widget";
import { resolveAction, ResolvedAction } from "../action/table";
import {
    ReactContext as AreasWidgetReactContext,
    widgets as AreasWidgetWidgets,
} from "../AreasWidget.widget";
import { Estimate } from "../table";
import { ITEM_TYPE_META } from "../types/table";
import RoomWidget from "./RoomWidget.widget";
import { Side, SIDE_META } from "./table";

export const ACTION_TABLE_STYLE = css({
    "& th": {
        position: "sticky",
        top: 0,
        backgroundColor: "white",
        boxShadow: "0 2px 2px -1px rgba(0, 0, 0, 0.4)",
        zIndex: 1,
    },
});

export type Data = Side;

export type ExtraContext = {
    estimate: Estimate;
};

export type ExtraProps = {
    estimate: Estimate;
};

export type ExtraState = {
    addingAction: boolean;
};

function encodeState(state: State) {
    let index = 0;
    for (const action of state.actions.items) {
        if (action.actionModal !== null) {
            return [`${index}`, action.actionModal];
        }

        index += 1;
    }
    return [];
}

export const Fields = {
    name: FormField(TextWidget),
    multiply: FormField(DecimalWidget),
    actions: ListWidget(SideActionWidget, {
        enhanceContext(index) {
            return { actionIndex: index };
        },

        makeDragHandler() {
            const estimateContext = React.useContext(AreasWidgetReactContext);

            if (!estimateContext) {
                throw new Error("expected estimate context");
            }

            return (from, to) => {
                estimateContext.dispatch({
                    type: "MOVE_ACTION",
                    from,
                    to,
                });
            };
        },
    }),
    room: RoomWidget,
};

function updateArray<T>(items: T[], index: number, value: T) {
    items = items.slice();
    items[index] = value;
    return items;
}

export function postInitialize(
    side: Side,
    state: BaseState,
    context: Context,
    parameters: string[] = []
): State {
    if (parameters.length == 2) {
        let index = parseInt(parameters[0], 10) || 0;
        let tab = parameters[1] as ActionModalTab;

        let newState = {
            ...state,
            addingAction: false,
            actions: {
                ...state.actions,
                items: updateArray(state.actions.items, index, {
                    ...state.actions.items[index],
                    actionModal: tab,
                }),
            },
        };
        return newState;
    } else {
        return {
            ...state,
            addingAction: false,
        };
    }
}

function actionOpenAddAction(state: State, data: Side) {
    return {
        state: {
            ...state,
            addingAction: true,
        },
        data,
    };
}
function actionCloseAddAction(state: State, data: Side) {
    return {
        state: {
            ...state,
            addingAction: false,
        },
        data,
    };
}

function AddActionModal(props: Props) {
    const estimateContext = React.useContext(AreasWidgetReactContext);
    if (!estimateContext) {
        throw new Error("Expected to be used in EstimateContext");
    }
    const itemTypes = (useQuickAllRecords(ITEM_TYPE_META) || []).filter(
        (x) => x.regular
    );
    return (
        <Modal
            isOpen={props.state.addingAction}
            onRequestClose={() =>
                props.dispatch({
                    type: "CLOSE_ADD_ACTION",
                })
            }
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    rowGap: "1em",
                    columnGap: "5em",
                }}
            >
                {itemTypes.map((itemType) => (
                    <Button
                        key={itemType.id.uuid}
                        onClick={() =>
                            estimateContext.dispatch({
                                type: "ADD_ACTION",
                                itemType,
                            })
                        }
                    >
                        {itemType.name}
                    </Button>
                ))}
            </div>
        </Modal>
    );
}

function Component(props: Props) {
    const estimateContext = React.useContext(AreasWidgetReactContext)!;

    const onRemove = React.useCallback(
        (actionIndex) => {
            const estimateAction = estimateContext.data.actions[actionIndex];
            if (
                some(
                    estimateContext.data.actions,
                    (action) =>
                        action.copyUnitsFromAction ===
                        estimateContext.data.actions[actionIndex].id.uuid
                )
            ) {
                alert(
                    "This action cannot be removed: it is the calculator source for another action."
                );
                return;
            }

            if (
                confirm(
                    `Are you sure you want to remove the action "${estimateAction.name}"?`
                )
            ) {
                estimateContext.dispatch({
                    type: "REMOVE_ACTION",
                    index: actionIndex,
                });
            }
        },
        [estimateContext.dispatch, estimateContext.data.actions]
    );

    const onDuplicate = React.useCallback(
        (actionIndex) => {
            const estimateAction = estimateContext.data.actions[actionIndex];

            const name = prompt(
                "Name for new action?",
                estimateAction.name + " (copy)"
            );
            if (name) {
                estimateContext.dispatch({
                    type: "DUPLICATE_ACTION",
                    index: actionIndex,
                    name,
                });
            }
        },
        [estimateContext.dispatch, estimateContext.data.actions]
    );

    const itemFn = React.useCallback(
        (index) => ({
            estimateAction: props.estimate.actions[index],
            estimateActionWidget: (widget: EstimateActionWidgetTypes) => (
                <AreasWidgetWidgets.actions
                    index={index}
                    itemProps={{
                        widget,
                        contingency: false,
                    }}
                />
            ),
            onRemove: onRemove.bind(undefined, index),
            onDuplicate: onDuplicate.bind(undefined, index),
            contingency: false,
        }),
        [props.estimate.actions]
    );

    const resolvedActions = props.data.actions.map((action, index) =>
        resolveAction(
            props.estimate.actions[index],
            action,
            props.data,
            props.estimate,
            false
        )
    );

    return (
        <div {...CONTENT_AREA}>
            <AddActionModal {...props} />
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    paddingTop: "1em",
                    paddingBottom: ".5em",
                }}
            >
                <widgets.name
                    align="center"
                    label="Side"
                    style={{ display: "inline-block", width: "2in" }}
                />
                <div style={{ width: "1em" }} />
                <widgets.multiply
                    label="Multiply by"
                    style={{ display: "inline-block", width: "1in" }}
                />
            </div>
            <div {...CONTENT_AREA}>
                <table {...ACTION_TABLE_STYLE} {...TABLE_STYLE}>
                    <thead>
                        <tr>
                            <th style={{ width: "1em" }} />
                            <th style={{ width: "15em" }}>Name</th>
                            <th />
                            <th>Finish Schedule</th>
                            <th>Hours</th>
                            <th>Materials</th>
                            <th>Units</th>
                            <th>Unit Rate</th>
                            <th>Cost</th>
                            <th>Price</th>
                            <th />
                        </tr>
                    </thead>
                    <widgets.actions containerClass="tbody" itemFn={itemFn} />
                    <tfoot>
                        <tr>
                            <th style={{ padding: 0 }}>
                                <Button
                                    style={{ width: "100%" }}
                                    onClick={() =>
                                        props.dispatch({
                                            type: "OPEN_ADD_ACTION",
                                        })
                                    }
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                </Button>
                            </th>
                            <th>
                                <Button
                                    style={{ width: "100%" }}
                                    onClick={() =>
                                        estimateContext.dispatch({
                                            type: "CLEAR_EMPTY",
                                        })
                                    }
                                    variant="danger"
                                >
                                    <FontAwesomeIcon icon={faMinus} />
                                    &nbsp; Remove Empty
                                </Button>
                            </th>
                            <th />
                            <th>Total</th>
                            <th>
                                <DecimalStatic
                                    value={resolvedActions.reduce(
                                        (
                                            total: Decimal,
                                            action: ResolvedAction
                                        ) => total.plus(action.hours),
                                        new Decimal(0)
                                    )}
                                />
                            </th>
                            <th>
                                <DecimalStatic
                                    value={resolvedActions.reduce(
                                        (
                                            total: Decimal,
                                            action: ResolvedAction
                                        ) => total.plus(action.materials),
                                        new Decimal(0)
                                    )}
                                />
                            </th>
                            <th />
                            <th />
                            <th>
                                <MoneyStatic
                                    value={resolvedActions.reduce(
                                        (
                                            total: Decimal,
                                            action: ResolvedAction
                                        ) =>
                                            total.plus(
                                                action.hoursCost.plus(
                                                    action.materialsCost
                                                )
                                            ),
                                        new Decimal(0)
                                    )}
                                />
                            </th>
                            <th>
                                <MoneyStatic
                                    value={resolvedActions.reduce(
                                        (
                                            total: Decimal,
                                            action: ResolvedAction
                                        ) =>
                                            total.plus(
                                                action.hoursPrice.plus(
                                                    action.materialsPrice
                                                )
                                            ),
                                        new Decimal(0)
                                    )}
                                />
                            </th>
                        </tr>
                        <tr>
                            <th />
                            <th />
                            <th />
                            <th>Total (w. multiplier)</th>
                            <th>
                                <DecimalStatic
                                    value={resolvedActions
                                        .reduce(
                                            (
                                                total: Decimal,
                                                action: ResolvedAction
                                            ) => total.plus(action.hours),
                                            new Decimal(0)
                                        )
                                        .times(props.data.multiply)}
                                />
                            </th>
                            <th>
                                <DecimalStatic
                                    value={resolvedActions
                                        .reduce(
                                            (
                                                total: Decimal,
                                                action: ResolvedAction
                                            ) => total.plus(action.materials),
                                            new Decimal(0)
                                        )
                                        .times(props.data.multiply)}
                                />
                            </th>
                            <th />
                            <th />
                            <th>
                                <MoneyStatic
                                    value={resolvedActions
                                        .reduce(
                                            (
                                                total: Decimal,
                                                action: ResolvedAction
                                            ) =>
                                                total.plus(
                                                    action.hoursCost.plus(
                                                        action.materialsCost
                                                    )
                                                ),
                                            new Decimal(0)
                                        )
                                        .times(props.data.multiply)}
                                />
                            </th>
                            <th>
                                <MoneyStatic
                                    value={resolvedActions
                                        .reduce(
                                            (
                                                total: Decimal,
                                                action: ResolvedAction
                                            ) =>
                                                total.plus(
                                                    action.hoursPrice.plus(
                                                        action.materialsPrice
                                                    )
                                                ),
                                            new Decimal(0)
                                        )
                                        .times(props.data.multiply)}
                                />
                            </th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.multiply> &
    WidgetContext<typeof Fields.actions> &
    WidgetContext<typeof Fields.room> &
    ExtraContext;
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    multiply: WidgetState<typeof Fields.multiply>;
    actions: WidgetState<typeof Fields.actions>;
    room: WidgetState<typeof Fields.room>;
    initialParameters?: string[];
};
export type State = BaseState & ExtraState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "MULTIPLY"; action: WidgetAction<typeof Fields.multiply> }
    | { type: "ACTIONS"; action: WidgetAction<typeof Fields.actions> }
    | { type: "ROOM"; action: WidgetAction<typeof Fields.room> }
    | { type: "OPEN_ADD_ACTION" }
    | { type: "CLOSE_ADD_ACTION" };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.multiply, data.multiply, cache, "multiply", errors);
    subvalidate(Fields.actions, data.actions, cache, "actions", errors);
    subvalidate(Fields.room, data.room, cache, "room", errors);
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
        case "MULTIPLY": {
            const inner = Fields.multiply.reduce(
                state.multiply,
                data.multiply,
                action.action,
                subcontext
            );
            return {
                state: { ...state, multiply: inner.state },
                data: { ...data, multiply: inner.data },
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
        case "ROOM": {
            const inner = Fields.room.reduce(
                state.room,
                data.room,
                action.action,
                subcontext
            );
            return {
                state: { ...state, room: inner.state },
                data: { ...data, room: inner.data },
            };
        }
        case "OPEN_ADD_ACTION":
            return actionOpenAddAction(state, data);
        case "CLOSE_ADD_ACTION":
            return actionCloseAddAction(state, data);
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
    multiply: function (
        props: WidgetExtraProps<typeof Fields.multiply> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MULTIPLY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "multiply", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.multiply.component
                state={context.state.multiply}
                data={context.data.multiply}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Multiply"}
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
    room: function (
        props: WidgetExtraProps<typeof Fields.room> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "ROOM", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "room", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.room.component
                state={context.state.room}
                data={context.data.room}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Room"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: SIDE_META,
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
        let multiplyState;
        {
            const inner = Fields.multiply.initialize(
                data.multiply,
                subcontext,
                subparameters.multiply
            );
            multiplyState = inner.state;
            data = { ...data, multiply: inner.data };
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
        let roomState;
        {
            const inner = Fields.room.initialize(
                data.room,
                subcontext,
                subparameters.room
            );
            roomState = inner.state;
            data = { ...data, room: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            multiply: multiplyState,
            actions: actionsState,
            room: roomState,
        };
        return {
            state: postInitialize(data, state, context, parameters),
            data,
        };
    },
    validate: baseValidate,
    encodeState: encodeState,
    component: React.memo((props: Props) => {
        return (
            <ReactContext.Provider value={props}>
                <RecordContext meta={SIDE_META} value={props.data}>
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
    multiply: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.multiply>
    >;
    actions: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.actions>
    >;
    room: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.room>
    >;
};
// END MAGIC -- DO NOT EDIT
