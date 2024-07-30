import * as React from "react";
import { Table } from "react-bootstrap";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { CheckboxWidget } from "../../../clay/widgets/CheckboxWidget";
import {
    DecimalStatic,
    DecimalWidget,
} from "../../../clay/widgets/DecimalWidget";
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
import { TextWidget } from "../../../clay/widgets/TextWidget";
import AdditionalRoomWidget from "./AdditionalRoomWidget.widget";
import { resolveRoom, Room, ROOM_META } from "./room";

export type Data = Room;

export const Fields = {
    width: DecimalWidget,
    height: DecimalWidget,
    length: DecimalWidget,
    note: TextWidget,

    additionalRooms: ListWidget(AdditionalRoomWidget),

    includeWalls: CheckboxWidget,
    multiplyWalls: DecimalWidget,

    includeCeiling: CheckboxWidget,
    multiplyCeiling: DecimalWidget,

    includeBaseboard: CheckboxWidget,
    multiplyBaseboard: DecimalWidget,
    includeCrown: CheckboxWidget,
    multiplyCrown: DecimalWidget,
    includeChairRail: CheckboxWidget,
    multiplyChairRail: DecimalWidget,
};

function Component(props: Props) {
    const resolved = resolveRoom(props.data);
    return (
        <div
            style={{
                display: "flex",
            }}
        >
            <div>
                <Table>
                    <thead>
                        <tr>
                            <th />
                            <th style={{ width: "8em", textAlign: "center" }}>
                                Width
                            </th>
                            <th style={{ textAlign: "center" }}>Length</th>
                            <th style={{ textAlign: "center" }}>Height</th>
                            <th style={{ textAlign: "center" }}>Multiply</th>
                        </tr>
                    </thead>
                    <widgets.additionalRooms
                        addButtonText="Add Room"
                        containerClass="tbody"
                        postNewAction={{
                            type: "MULTIPLY",
                            action: {
                                type: "SET",
                                value: "1",
                            },
                        }}
                    />
                </Table>
            </div>
            <div
                style={{
                    marginLeft: "1em",
                    border: "solid 1px black",
                    backgroundColor: "#fafafa",
                }}
            >
                <Table style={{ tableLayout: "fixed", maxWidth: "30em" }}>
                    <tbody></tbody>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left" }}> Item</th>
                            <th style={{ textAlign: "center", width: "10em" }}>
                                Multiplier
                            </th>
                            <th style={{ textAlign: "center", width: "10em" }}>
                                Areas
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <widgets.includeWalls checkLabel="Walls" />
                            </td>
                            <td>
                                <widgets.multiplyWalls />
                            </td>
                            <td>
                                <DecimalStatic value={resolved.walls} />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <widgets.includeCeiling checkLabel="Ceiling" />
                            </td>
                            <td>
                                <widgets.multiplyCeiling />
                            </td>
                            <td>
                                <DecimalStatic value={resolved.ceiling} />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <widgets.includeBaseboard checkLabel="Baseboard" />
                            </td>
                            <td>
                                <widgets.multiplyBaseboard />
                            </td>
                            <td>
                                <DecimalStatic value={resolved.baseboard} />
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <widgets.includeCrown checkLabel="Crown" />
                            </td>
                            <td>
                                <widgets.multiplyCrown />
                            </td>
                            <td>
                                <DecimalStatic value={resolved.crown} />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <widgets.includeChairRail checkLabel="Chair Rail" />
                            </td>
                            <td>
                                <widgets.multiplyChairRail />
                            </td>
                            <td>
                                <DecimalStatic value={resolved.chairRail} />
                            </td>
                        </tr>
                    </tbody>
                </Table>
            </div>
        </div>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.width> &
    WidgetContext<typeof Fields.height> &
    WidgetContext<typeof Fields.length> &
    WidgetContext<typeof Fields.note> &
    WidgetContext<typeof Fields.additionalRooms> &
    WidgetContext<typeof Fields.includeWalls> &
    WidgetContext<typeof Fields.multiplyWalls> &
    WidgetContext<typeof Fields.includeCeiling> &
    WidgetContext<typeof Fields.multiplyCeiling> &
    WidgetContext<typeof Fields.includeBaseboard> &
    WidgetContext<typeof Fields.multiplyBaseboard> &
    WidgetContext<typeof Fields.includeCrown> &
    WidgetContext<typeof Fields.multiplyCrown> &
    WidgetContext<typeof Fields.includeChairRail> &
    WidgetContext<typeof Fields.multiplyChairRail>;
type ExtraProps = {};
type BaseState = {
    width: WidgetState<typeof Fields.width>;
    height: WidgetState<typeof Fields.height>;
    length: WidgetState<typeof Fields.length>;
    note: WidgetState<typeof Fields.note>;
    additionalRooms: WidgetState<typeof Fields.additionalRooms>;
    includeWalls: WidgetState<typeof Fields.includeWalls>;
    multiplyWalls: WidgetState<typeof Fields.multiplyWalls>;
    includeCeiling: WidgetState<typeof Fields.includeCeiling>;
    multiplyCeiling: WidgetState<typeof Fields.multiplyCeiling>;
    includeBaseboard: WidgetState<typeof Fields.includeBaseboard>;
    multiplyBaseboard: WidgetState<typeof Fields.multiplyBaseboard>;
    includeCrown: WidgetState<typeof Fields.includeCrown>;
    multiplyCrown: WidgetState<typeof Fields.multiplyCrown>;
    includeChairRail: WidgetState<typeof Fields.includeChairRail>;
    multiplyChairRail: WidgetState<typeof Fields.multiplyChairRail>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "WIDTH"; action: WidgetAction<typeof Fields.width> }
    | { type: "HEIGHT"; action: WidgetAction<typeof Fields.height> }
    | { type: "LENGTH"; action: WidgetAction<typeof Fields.length> }
    | { type: "NOTE"; action: WidgetAction<typeof Fields.note> }
    | {
          type: "ADDITIONAL_ROOMS";
          action: WidgetAction<typeof Fields.additionalRooms>;
      }
    | {
          type: "INCLUDE_WALLS";
          action: WidgetAction<typeof Fields.includeWalls>;
      }
    | {
          type: "MULTIPLY_WALLS";
          action: WidgetAction<typeof Fields.multiplyWalls>;
      }
    | {
          type: "INCLUDE_CEILING";
          action: WidgetAction<typeof Fields.includeCeiling>;
      }
    | {
          type: "MULTIPLY_CEILING";
          action: WidgetAction<typeof Fields.multiplyCeiling>;
      }
    | {
          type: "INCLUDE_BASEBOARD";
          action: WidgetAction<typeof Fields.includeBaseboard>;
      }
    | {
          type: "MULTIPLY_BASEBOARD";
          action: WidgetAction<typeof Fields.multiplyBaseboard>;
      }
    | {
          type: "INCLUDE_CROWN";
          action: WidgetAction<typeof Fields.includeCrown>;
      }
    | {
          type: "MULTIPLY_CROWN";
          action: WidgetAction<typeof Fields.multiplyCrown>;
      }
    | {
          type: "INCLUDE_CHAIR_RAIL";
          action: WidgetAction<typeof Fields.includeChairRail>;
      }
    | {
          type: "MULTIPLY_CHAIR_RAIL";
          action: WidgetAction<typeof Fields.multiplyChairRail>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.width, data.width, cache, "width", errors);
    subvalidate(Fields.height, data.height, cache, "height", errors);
    subvalidate(Fields.length, data.length, cache, "length", errors);
    subvalidate(Fields.note, data.note, cache, "note", errors);
    subvalidate(
        Fields.additionalRooms,
        data.additionalRooms,
        cache,
        "additionalRooms",
        errors
    );
    subvalidate(
        Fields.includeWalls,
        data.includeWalls,
        cache,
        "includeWalls",
        errors
    );
    subvalidate(
        Fields.multiplyWalls,
        data.multiplyWalls,
        cache,
        "multiplyWalls",
        errors
    );
    subvalidate(
        Fields.includeCeiling,
        data.includeCeiling,
        cache,
        "includeCeiling",
        errors
    );
    subvalidate(
        Fields.multiplyCeiling,
        data.multiplyCeiling,
        cache,
        "multiplyCeiling",
        errors
    );
    subvalidate(
        Fields.includeBaseboard,
        data.includeBaseboard,
        cache,
        "includeBaseboard",
        errors
    );
    subvalidate(
        Fields.multiplyBaseboard,
        data.multiplyBaseboard,
        cache,
        "multiplyBaseboard",
        errors
    );
    subvalidate(
        Fields.includeCrown,
        data.includeCrown,
        cache,
        "includeCrown",
        errors
    );
    subvalidate(
        Fields.multiplyCrown,
        data.multiplyCrown,
        cache,
        "multiplyCrown",
        errors
    );
    subvalidate(
        Fields.includeChairRail,
        data.includeChairRail,
        cache,
        "includeChairRail",
        errors
    );
    subvalidate(
        Fields.multiplyChairRail,
        data.multiplyChairRail,
        cache,
        "multiplyChairRail",
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
        case "WIDTH": {
            const inner = Fields.width.reduce(
                state.width,
                data.width,
                action.action,
                subcontext
            );
            return {
                state: { ...state, width: inner.state },
                data: { ...data, width: inner.data },
            };
        }
        case "HEIGHT": {
            const inner = Fields.height.reduce(
                state.height,
                data.height,
                action.action,
                subcontext
            );
            return {
                state: { ...state, height: inner.state },
                data: { ...data, height: inner.data },
            };
        }
        case "LENGTH": {
            const inner = Fields.length.reduce(
                state.length,
                data.length,
                action.action,
                subcontext
            );
            return {
                state: { ...state, length: inner.state },
                data: { ...data, length: inner.data },
            };
        }
        case "NOTE": {
            const inner = Fields.note.reduce(
                state.note,
                data.note,
                action.action,
                subcontext
            );
            return {
                state: { ...state, note: inner.state },
                data: { ...data, note: inner.data },
            };
        }
        case "ADDITIONAL_ROOMS": {
            const inner = Fields.additionalRooms.reduce(
                state.additionalRooms,
                data.additionalRooms,
                action.action,
                subcontext
            );
            return {
                state: { ...state, additionalRooms: inner.state },
                data: { ...data, additionalRooms: inner.data },
            };
        }
        case "INCLUDE_WALLS": {
            const inner = Fields.includeWalls.reduce(
                state.includeWalls,
                data.includeWalls,
                action.action,
                subcontext
            );
            return {
                state: { ...state, includeWalls: inner.state },
                data: { ...data, includeWalls: inner.data },
            };
        }
        case "MULTIPLY_WALLS": {
            const inner = Fields.multiplyWalls.reduce(
                state.multiplyWalls,
                data.multiplyWalls,
                action.action,
                subcontext
            );
            return {
                state: { ...state, multiplyWalls: inner.state },
                data: { ...data, multiplyWalls: inner.data },
            };
        }
        case "INCLUDE_CEILING": {
            const inner = Fields.includeCeiling.reduce(
                state.includeCeiling,
                data.includeCeiling,
                action.action,
                subcontext
            );
            return {
                state: { ...state, includeCeiling: inner.state },
                data: { ...data, includeCeiling: inner.data },
            };
        }
        case "MULTIPLY_CEILING": {
            const inner = Fields.multiplyCeiling.reduce(
                state.multiplyCeiling,
                data.multiplyCeiling,
                action.action,
                subcontext
            );
            return {
                state: { ...state, multiplyCeiling: inner.state },
                data: { ...data, multiplyCeiling: inner.data },
            };
        }
        case "INCLUDE_BASEBOARD": {
            const inner = Fields.includeBaseboard.reduce(
                state.includeBaseboard,
                data.includeBaseboard,
                action.action,
                subcontext
            );
            return {
                state: { ...state, includeBaseboard: inner.state },
                data: { ...data, includeBaseboard: inner.data },
            };
        }
        case "MULTIPLY_BASEBOARD": {
            const inner = Fields.multiplyBaseboard.reduce(
                state.multiplyBaseboard,
                data.multiplyBaseboard,
                action.action,
                subcontext
            );
            return {
                state: { ...state, multiplyBaseboard: inner.state },
                data: { ...data, multiplyBaseboard: inner.data },
            };
        }
        case "INCLUDE_CROWN": {
            const inner = Fields.includeCrown.reduce(
                state.includeCrown,
                data.includeCrown,
                action.action,
                subcontext
            );
            return {
                state: { ...state, includeCrown: inner.state },
                data: { ...data, includeCrown: inner.data },
            };
        }
        case "MULTIPLY_CROWN": {
            const inner = Fields.multiplyCrown.reduce(
                state.multiplyCrown,
                data.multiplyCrown,
                action.action,
                subcontext
            );
            return {
                state: { ...state, multiplyCrown: inner.state },
                data: { ...data, multiplyCrown: inner.data },
            };
        }
        case "INCLUDE_CHAIR_RAIL": {
            const inner = Fields.includeChairRail.reduce(
                state.includeChairRail,
                data.includeChairRail,
                action.action,
                subcontext
            );
            return {
                state: { ...state, includeChairRail: inner.state },
                data: { ...data, includeChairRail: inner.data },
            };
        }
        case "MULTIPLY_CHAIR_RAIL": {
            const inner = Fields.multiplyChairRail.reduce(
                state.multiplyChairRail,
                data.multiplyChairRail,
                action.action,
                subcontext
            );
            return {
                state: { ...state, multiplyChairRail: inner.state },
                data: { ...data, multiplyChairRail: inner.data },
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
    width: function (
        props: WidgetExtraProps<typeof Fields.width> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "WIDTH", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "width", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.width.component
                state={context.state.width}
                data={context.data.width}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Width"}
            />
        );
    },
    height: function (
        props: WidgetExtraProps<typeof Fields.height> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "HEIGHT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "height", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.height.component
                state={context.state.height}
                data={context.data.height}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Height"}
            />
        );
    },
    length: function (
        props: WidgetExtraProps<typeof Fields.length> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "LENGTH",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "length", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.length.component
                state={context.state.length}
                data={context.data.length}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Length"}
            />
        );
    },
    note: function (
        props: WidgetExtraProps<typeof Fields.note> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "NOTE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "note", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.note.component
                state={context.state.note}
                data={context.data.note}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Note"}
            />
        );
    },
    additionalRooms: function (
        props: WidgetExtraProps<typeof Fields.additionalRooms> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ADDITIONAL_ROOMS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "additionalRooms", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.additionalRooms.component
                state={context.state.additionalRooms}
                data={context.data.additionalRooms}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Additional Rooms"}
            />
        );
    },
    includeWalls: function (
        props: WidgetExtraProps<typeof Fields.includeWalls> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INCLUDE_WALLS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "includeWalls", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.includeWalls.component
                state={context.state.includeWalls}
                data={context.data.includeWalls}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Include Walls"}
            />
        );
    },
    multiplyWalls: function (
        props: WidgetExtraProps<typeof Fields.multiplyWalls> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MULTIPLY_WALLS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "multiplyWalls", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.multiplyWalls.component
                state={context.state.multiplyWalls}
                data={context.data.multiplyWalls}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Multiply Walls"}
            />
        );
    },
    includeCeiling: function (
        props: WidgetExtraProps<typeof Fields.includeCeiling> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INCLUDE_CEILING",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "includeCeiling", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.includeCeiling.component
                state={context.state.includeCeiling}
                data={context.data.includeCeiling}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Include Ceiling"}
            />
        );
    },
    multiplyCeiling: function (
        props: WidgetExtraProps<typeof Fields.multiplyCeiling> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MULTIPLY_CEILING",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "multiplyCeiling", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.multiplyCeiling.component
                state={context.state.multiplyCeiling}
                data={context.data.multiplyCeiling}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Multiply Ceiling"}
            />
        );
    },
    includeBaseboard: function (
        props: WidgetExtraProps<typeof Fields.includeBaseboard> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INCLUDE_BASEBOARD",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "includeBaseboard", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.includeBaseboard.component
                state={context.state.includeBaseboard}
                data={context.data.includeBaseboard}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Include Baseboard"}
            />
        );
    },
    multiplyBaseboard: function (
        props: WidgetExtraProps<typeof Fields.multiplyBaseboard> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MULTIPLY_BASEBOARD",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "multiplyBaseboard",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.multiplyBaseboard.component
                state={context.state.multiplyBaseboard}
                data={context.data.multiplyBaseboard}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Multiply Baseboard"}
            />
        );
    },
    includeCrown: function (
        props: WidgetExtraProps<typeof Fields.includeCrown> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INCLUDE_CROWN",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "includeCrown", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.includeCrown.component
                state={context.state.includeCrown}
                data={context.data.includeCrown}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Include Crown"}
            />
        );
    },
    multiplyCrown: function (
        props: WidgetExtraProps<typeof Fields.multiplyCrown> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MULTIPLY_CROWN",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "multiplyCrown", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.multiplyCrown.component
                state={context.state.multiplyCrown}
                data={context.data.multiplyCrown}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Multiply Crown"}
            />
        );
    },
    includeChairRail: function (
        props: WidgetExtraProps<typeof Fields.includeChairRail> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INCLUDE_CHAIR_RAIL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "includeChairRail", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.includeChairRail.component
                state={context.state.includeChairRail}
                data={context.data.includeChairRail}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Include Chair Rail"}
            />
        );
    },
    multiplyChairRail: function (
        props: WidgetExtraProps<typeof Fields.multiplyChairRail> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MULTIPLY_CHAIR_RAIL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "multiplyChairRail",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.multiplyChairRail.component
                state={context.state.multiplyChairRail}
                data={context.data.multiplyChairRail}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Multiply Chair Rail"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ROOM_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let widthState;
        {
            const inner = Fields.width.initialize(
                data.width,
                subcontext,
                subparameters.width
            );
            widthState = inner.state;
            data = { ...data, width: inner.data };
        }
        let heightState;
        {
            const inner = Fields.height.initialize(
                data.height,
                subcontext,
                subparameters.height
            );
            heightState = inner.state;
            data = { ...data, height: inner.data };
        }
        let lengthState;
        {
            const inner = Fields.length.initialize(
                data.length,
                subcontext,
                subparameters.length
            );
            lengthState = inner.state;
            data = { ...data, length: inner.data };
        }
        let noteState;
        {
            const inner = Fields.note.initialize(
                data.note,
                subcontext,
                subparameters.note
            );
            noteState = inner.state;
            data = { ...data, note: inner.data };
        }
        let additionalRoomsState;
        {
            const inner = Fields.additionalRooms.initialize(
                data.additionalRooms,
                subcontext,
                subparameters.additionalRooms
            );
            additionalRoomsState = inner.state;
            data = { ...data, additionalRooms: inner.data };
        }
        let includeWallsState;
        {
            const inner = Fields.includeWalls.initialize(
                data.includeWalls,
                subcontext,
                subparameters.includeWalls
            );
            includeWallsState = inner.state;
            data = { ...data, includeWalls: inner.data };
        }
        let multiplyWallsState;
        {
            const inner = Fields.multiplyWalls.initialize(
                data.multiplyWalls,
                subcontext,
                subparameters.multiplyWalls
            );
            multiplyWallsState = inner.state;
            data = { ...data, multiplyWalls: inner.data };
        }
        let includeCeilingState;
        {
            const inner = Fields.includeCeiling.initialize(
                data.includeCeiling,
                subcontext,
                subparameters.includeCeiling
            );
            includeCeilingState = inner.state;
            data = { ...data, includeCeiling: inner.data };
        }
        let multiplyCeilingState;
        {
            const inner = Fields.multiplyCeiling.initialize(
                data.multiplyCeiling,
                subcontext,
                subparameters.multiplyCeiling
            );
            multiplyCeilingState = inner.state;
            data = { ...data, multiplyCeiling: inner.data };
        }
        let includeBaseboardState;
        {
            const inner = Fields.includeBaseboard.initialize(
                data.includeBaseboard,
                subcontext,
                subparameters.includeBaseboard
            );
            includeBaseboardState = inner.state;
            data = { ...data, includeBaseboard: inner.data };
        }
        let multiplyBaseboardState;
        {
            const inner = Fields.multiplyBaseboard.initialize(
                data.multiplyBaseboard,
                subcontext,
                subparameters.multiplyBaseboard
            );
            multiplyBaseboardState = inner.state;
            data = { ...data, multiplyBaseboard: inner.data };
        }
        let includeCrownState;
        {
            const inner = Fields.includeCrown.initialize(
                data.includeCrown,
                subcontext,
                subparameters.includeCrown
            );
            includeCrownState = inner.state;
            data = { ...data, includeCrown: inner.data };
        }
        let multiplyCrownState;
        {
            const inner = Fields.multiplyCrown.initialize(
                data.multiplyCrown,
                subcontext,
                subparameters.multiplyCrown
            );
            multiplyCrownState = inner.state;
            data = { ...data, multiplyCrown: inner.data };
        }
        let includeChairRailState;
        {
            const inner = Fields.includeChairRail.initialize(
                data.includeChairRail,
                subcontext,
                subparameters.includeChairRail
            );
            includeChairRailState = inner.state;
            data = { ...data, includeChairRail: inner.data };
        }
        let multiplyChairRailState;
        {
            const inner = Fields.multiplyChairRail.initialize(
                data.multiplyChairRail,
                subcontext,
                subparameters.multiplyChairRail
            );
            multiplyChairRailState = inner.state;
            data = { ...data, multiplyChairRail: inner.data };
        }
        let state = {
            initialParameters: parameters,
            width: widthState,
            height: heightState,
            length: lengthState,
            note: noteState,
            additionalRooms: additionalRoomsState,
            includeWalls: includeWallsState,
            multiplyWalls: multiplyWallsState,
            includeCeiling: includeCeilingState,
            multiplyCeiling: multiplyCeilingState,
            includeBaseboard: includeBaseboardState,
            multiplyBaseboard: multiplyBaseboardState,
            includeCrown: includeCrownState,
            multiplyCrown: multiplyCrownState,
            includeChairRail: includeChairRailState,
            multiplyChairRail: multiplyChairRailState,
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
                <RecordContext meta={ROOM_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    width: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.width>
    >;
    height: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.height>
    >;
    length: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.length>
    >;
    note: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.note>
    >;
    additionalRooms: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.additionalRooms>
    >;
    includeWalls: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.includeWalls>
    >;
    multiplyWalls: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.multiplyWalls>
    >;
    includeCeiling: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.includeCeiling>
    >;
    multiplyCeiling: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.multiplyCeiling>
    >;
    includeBaseboard: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.includeBaseboard>
    >;
    multiplyBaseboard: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.multiplyBaseboard>
    >;
    includeCrown: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.includeCrown>
    >;
    multiplyCrown: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.multiplyCrown>
    >;
    includeChairRail: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.includeChairRail>
    >;
    multiplyChairRail: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.multiplyChairRail>
    >;
};
// END MAGIC -- DO NOT EDIT
