import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { DecimalWidget } from "../../../clay/widgets/DecimalWidget";
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
import { AdditionalRoom, ADDITIONAL_ROOM_META } from "./room";

export type Data = AdditionalRoom;

export const Fields = {
    width: DecimalWidget,
    height: DecimalWidget,
    length: DecimalWidget,
    multiply: DecimalWidget,
    note: TextWidget,
};

function Component(props: Props) {
    return (
        <TableRow flexSizes>
            <widgets.width />
            <widgets.length />
            <widgets.height />
            <widgets.multiply />
            <widgets.note />
        </TableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.width> &
    WidgetContext<typeof Fields.height> &
    WidgetContext<typeof Fields.length> &
    WidgetContext<typeof Fields.multiply> &
    WidgetContext<typeof Fields.note>;
type ExtraProps = {};
type BaseState = {
    width: WidgetState<typeof Fields.width>;
    height: WidgetState<typeof Fields.height>;
    length: WidgetState<typeof Fields.length>;
    multiply: WidgetState<typeof Fields.multiply>;
    note: WidgetState<typeof Fields.note>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "WIDTH"; action: WidgetAction<typeof Fields.width> }
    | { type: "HEIGHT"; action: WidgetAction<typeof Fields.height> }
    | { type: "LENGTH"; action: WidgetAction<typeof Fields.length> }
    | { type: "MULTIPLY"; action: WidgetAction<typeof Fields.multiply> }
    | { type: "NOTE"; action: WidgetAction<typeof Fields.note> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.width, data.width, cache, "width", errors);
    subvalidate(Fields.height, data.height, cache, "height", errors);
    subvalidate(Fields.length, data.length, cache, "length", errors);
    subvalidate(Fields.multiply, data.multiply, cache, "multiply", errors);
    subvalidate(Fields.note, data.note, cache, "note", errors);
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ADDITIONAL_ROOM_META,
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
        let state = {
            initialParameters: parameters,
            width: widthState,
            height: heightState,
            length: lengthState,
            multiply: multiplyState,
            note: noteState,
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
                <RecordContext meta={ADDITIONAL_ROOM_META} value={props.data}>
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
    multiply: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.multiply>
    >;
    note: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.note>
    >;
};
// END MAGIC -- DO NOT EDIT
