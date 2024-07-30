import { css } from "glamor";
import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { RemoveButton } from "../../../clay/remove-button";
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
import { useListItemContext } from "../../../clay/widgets/ListWidget";
import { QuantityStatic } from "../../../clay/widgets/number-widget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { CalculatorRow, CALCULATOR_ROW_META } from "./table";

export type Data = CalculatorRow;
const Fields = {
    width: DecimalWidget,
    height: DecimalWidget,
    note: TextWidget,
};

export type ExtraProps = {
    calculator: "Square" | "Linear";
};

const LABELED_SPACER = css({
    width: "1.5em",
    fontWeight: "bold",
    textAlign: "center",
});

function Component(props: Props) {
    const listItemContext = useListItemContext();
    switch (props.calculator) {
        case "Square":
            return (
                <tr {...listItemContext.draggableProps}>
                    <td style={{ width: "1em" }}>
                        {listItemContext.dragHandle}
                    </td>
                    <td>
                        <widgets.width />
                    </td>
                    <td {...LABELED_SPACER}>{"X"}</td>
                    <td>
                        <widgets.height />
                    </td>
                    <td {...LABELED_SPACER}>{"="}</td>
                    <td>
                        <QuantityStatic
                            value={props.data.width.times(props.data.height)}
                        />
                    </td>
                    <td {...LABELED_SPACER}></td>
                    <td>
                        <widgets.note />
                    </td>
                    <td {...LABELED_SPACER}></td>
                    <td>
                        <RemoveButton />
                    </td>
                </tr>
            );
        case "Linear":
            return (
                <tr {...listItemContext.draggableProps}>
                    <td>{listItemContext.dragHandle}</td>
                    <td>
                        <widgets.width />
                    </td>
                    <td {...LABELED_SPACER}></td>
                    <td>
                        <widgets.note />
                    </td>
                    <td {...LABELED_SPACER}></td>
                    <td>
                        <RemoveButton />
                    </td>
                </tr>
            );
    }
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.width> &
    WidgetContext<typeof Fields.height> &
    WidgetContext<typeof Fields.note>;
type BaseState = {
    width: WidgetState<typeof Fields.width>;
    height: WidgetState<typeof Fields.height>;
    note: WidgetState<typeof Fields.note>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "WIDTH"; action: WidgetAction<typeof Fields.width> }
    | { type: "HEIGHT"; action: WidgetAction<typeof Fields.height> }
    | { type: "NOTE"; action: WidgetAction<typeof Fields.note> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.width, data.width, cache, "width", errors);
    subvalidate(Fields.height, data.height, cache, "height", errors);
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
    dataMeta: CALCULATOR_ROW_META,
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
                <RecordContext meta={CALCULATOR_ROW_META} value={props.data}>
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
    note: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.note>
    >;
};
// END MAGIC -- DO NOT EDIT
