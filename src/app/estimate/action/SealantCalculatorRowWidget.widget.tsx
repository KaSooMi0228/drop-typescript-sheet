import Decimal from "decimal.js";
import { css } from "glamor";
import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { RemoveButton } from "../../../clay/remove-button";
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
import {
    QuantityStatic,
    QuantityWidget,
} from "../../../clay/widgets/number-widget";
import { SelectNumberWidget } from "../../../clay/widgets/SelectNumberWidget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import {
    computeSealantRow,
    SealantCalculatorRow,
    SEALANT_CALCULATOR_ROW_META,
} from "./table";

const INEFFICIENCY_OPTIONS = [0, 5, 10, 15, 20, 25].map((number) => ({
    value: new Decimal(number).dividedBy(100),
    label: number + "%",
}));

export type Data = SealantCalculatorRow;
const Fields = {
    width: QuantityWidget,
    length: QuantityWidget,
    depth: QuantityWidget,
    inefficiency: SelectNumberWidget(INEFFICIENCY_OPTIONS),
    multiply: QuantityWidget,
    note: TextWidget,
};

const LABELED_SPACER = css({
    width: "1.5em",
    fontWeight: "bold",
    textAlign: "center",
});

function Component(props: Props) {
    const listItemContext = useListItemContext();

    return (
        <tr {...listItemContext.draggableProps}>
            <td style={{ width: "1em" }}>{listItemContext.dragHandle}</td>
            <td>
                <widgets.multiply />
            </td>
            <td>
                <widgets.length />
            </td>
            <td>
                <widgets.width />
            </td>
            <td>
                <widgets.depth />
            </td>
            <td>
                <widgets.inefficiency />
            </td>
            <td>
                <QuantityStatic value={computeSealantRow(props.data)} />
            </td>
            <td>
                <widgets.note />
            </td>
            <td>
                <RemoveButton />
            </td>
        </tr>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.width> &
    WidgetContext<typeof Fields.length> &
    WidgetContext<typeof Fields.depth> &
    WidgetContext<typeof Fields.inefficiency> &
    WidgetContext<typeof Fields.multiply> &
    WidgetContext<typeof Fields.note>;
type ExtraProps = {};
type BaseState = {
    width: WidgetState<typeof Fields.width>;
    length: WidgetState<typeof Fields.length>;
    depth: WidgetState<typeof Fields.depth>;
    inefficiency: WidgetState<typeof Fields.inefficiency>;
    multiply: WidgetState<typeof Fields.multiply>;
    note: WidgetState<typeof Fields.note>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "WIDTH"; action: WidgetAction<typeof Fields.width> }
    | { type: "LENGTH"; action: WidgetAction<typeof Fields.length> }
    | { type: "DEPTH"; action: WidgetAction<typeof Fields.depth> }
    | { type: "INEFFICIENCY"; action: WidgetAction<typeof Fields.inefficiency> }
    | { type: "MULTIPLY"; action: WidgetAction<typeof Fields.multiply> }
    | { type: "NOTE"; action: WidgetAction<typeof Fields.note> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.width, data.width, cache, "width", errors);
    subvalidate(Fields.length, data.length, cache, "length", errors);
    subvalidate(Fields.depth, data.depth, cache, "depth", errors);
    subvalidate(
        Fields.inefficiency,
        data.inefficiency,
        cache,
        "inefficiency",
        errors
    );
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
        case "DEPTH": {
            const inner = Fields.depth.reduce(
                state.depth,
                data.depth,
                action.action,
                subcontext
            );
            return {
                state: { ...state, depth: inner.state },
                data: { ...data, depth: inner.data },
            };
        }
        case "INEFFICIENCY": {
            const inner = Fields.inefficiency.reduce(
                state.inefficiency,
                data.inefficiency,
                action.action,
                subcontext
            );
            return {
                state: { ...state, inefficiency: inner.state },
                data: { ...data, inefficiency: inner.data },
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
    depth: function (
        props: WidgetExtraProps<typeof Fields.depth> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "DEPTH", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "depth", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.depth.component
                state={context.state.depth}
                data={context.data.depth}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Depth"}
            />
        );
    },
    inefficiency: function (
        props: WidgetExtraProps<typeof Fields.inefficiency> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INEFFICIENCY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "inefficiency", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.inefficiency.component
                state={context.state.inefficiency}
                data={context.data.inefficiency}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Inefficiency"}
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
    dataMeta: SEALANT_CALCULATOR_ROW_META,
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
        let depthState;
        {
            const inner = Fields.depth.initialize(
                data.depth,
                subcontext,
                subparameters.depth
            );
            depthState = inner.state;
            data = { ...data, depth: inner.data };
        }
        let inefficiencyState;
        {
            const inner = Fields.inefficiency.initialize(
                data.inefficiency,
                subcontext,
                subparameters.inefficiency
            );
            inefficiencyState = inner.state;
            data = { ...data, inefficiency: inner.data };
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
            length: lengthState,
            depth: depthState,
            inefficiency: inefficiencyState,
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
                <RecordContext
                    meta={SEALANT_CALCULATOR_ROW_META}
                    value={props.data}
                >
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
    length: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.length>
    >;
    depth: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.depth>
    >;
    inefficiency: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.inefficiency>
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
