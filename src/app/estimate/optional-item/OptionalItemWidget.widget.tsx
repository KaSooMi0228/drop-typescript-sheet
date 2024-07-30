import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { CheckboxWidget } from "../../../clay/widgets/CheckboxWidget";
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
import { TextAreaWidget } from "../../../clay/widgets/TextAreaWidget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { OptionalItem, OPTIONAL_ITEM_META } from "./table";

export type Data = OptionalItem;

export const Fields = {
    include: CheckboxWidget,
    name: TextWidget,
    text: TextAreaWidget,
};

function Component(props: Props) {
    const listItemContext = useListItemContext();
    return (
        <div {...listItemContext.draggableProps}>
            <div style={{ display: "flex" }}>
                <div style={{ padding: "5px" }}>
                    {listItemContext.dragHandle}
                </div>
                <div style={{ width: "30px" }}>
                    <widgets.include />
                </div>
                <div style={{ flexGrow: 1, display: "inline-block" }}>
                    <widgets.name />
                </div>
            </div>
            <widgets.text />
        </div>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.include> &
    WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.text>;
type ExtraProps = {};
type BaseState = {
    include: WidgetState<typeof Fields.include>;
    name: WidgetState<typeof Fields.name>;
    text: WidgetState<typeof Fields.text>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "INCLUDE"; action: WidgetAction<typeof Fields.include> }
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "TEXT"; action: WidgetAction<typeof Fields.text> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.include, data.include, cache, "include", errors);
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.text, data.text, cache, "text", errors);
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
        case "INCLUDE": {
            const inner = Fields.include.reduce(
                state.include,
                data.include,
                action.action,
                subcontext
            );
            return {
                state: { ...state, include: inner.state },
                data: { ...data, include: inner.data },
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
        case "TEXT": {
            const inner = Fields.text.reduce(
                state.text,
                data.text,
                action.action,
                subcontext
            );
            return {
                state: { ...state, text: inner.state },
                data: { ...data, text: inner.data },
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
    include: function (
        props: WidgetExtraProps<typeof Fields.include> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INCLUDE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "include", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.include.component
                state={context.state.include}
                data={context.data.include}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Include"}
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
    text: function (
        props: WidgetExtraProps<typeof Fields.text> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "TEXT", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "text", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.text.component
                state={context.state.text}
                data={context.data.text}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Text"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: OPTIONAL_ITEM_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let includeState;
        {
            const inner = Fields.include.initialize(
                data.include,
                subcontext,
                subparameters.include
            );
            includeState = inner.state;
            data = { ...data, include: inner.data };
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
        let textState;
        {
            const inner = Fields.text.initialize(
                data.text,
                subcontext,
                subparameters.text
            );
            textState = inner.state;
            data = { ...data, text: inner.data };
        }
        let state = {
            initialParameters: parameters,
            include: includeState,
            name: nameState,
            text: textState,
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
                <RecordContext meta={OPTIONAL_ITEM_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    include: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.include>
    >;
    name: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.name>
    >;
    text: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.text>
    >;
};
// END MAGIC -- DO NOT EDIT
