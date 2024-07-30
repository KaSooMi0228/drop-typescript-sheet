import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { RemoveButton } from "../../clay/remove-button";
import { StaticDateTimeWidget } from "../../clay/widgets/DateTimeWidget";
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
import { FieldRow } from "../../clay/widgets/layout";
import { useListItemContext } from "../../clay/widgets/ListWidget";
import { RichTextWidget } from "../rich-text-widget";
import { UserLinkWidget } from "../user";
import { WarrantyInternalNote, WARRANTY_INTERNAL_NOTE_META } from "./table";

export type Data = WarrantyInternalNote;

const Fields = {
    date: StaticDateTimeWidget,
    user: UserLinkWidget,
    text: RichTextWidget,
};

function Component(props: Props) {
    const listItemContext = useListItemContext();
    return (
        <div {...listItemContext.draggableProps}>
            <FieldRow noExpand>
                <widgets.user readOnly />
                <widgets.date />
                <div>
                    <RemoveButton />
                </div>
            </FieldRow>
            <widgets.text />
        </div>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.date> &
    WidgetContext<typeof Fields.user> &
    WidgetContext<typeof Fields.text>;
type ExtraProps = {};
type BaseState = {
    date: WidgetState<typeof Fields.date>;
    user: WidgetState<typeof Fields.user>;
    text: WidgetState<typeof Fields.text>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "DATE"; action: WidgetAction<typeof Fields.date> }
    | { type: "USER"; action: WidgetAction<typeof Fields.user> }
    | { type: "TEXT"; action: WidgetAction<typeof Fields.text> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.date, data.date, cache, "date", errors);
    subvalidate(Fields.user, data.user, cache, "user", errors);
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
        case "DATE": {
            const inner = Fields.date.reduce(
                state.date,
                data.date,
                action.action,
                subcontext
            );
            return {
                state: { ...state, date: inner.state },
                data: { ...data, date: inner.data },
            };
        }
        case "USER": {
            const inner = Fields.user.reduce(
                state.user,
                data.user,
                action.action,
                subcontext
            );
            return {
                state: { ...state, user: inner.state },
                data: { ...data, user: inner.data },
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
    date: function (
        props: WidgetExtraProps<typeof Fields.date> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "DATE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "date", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.date.component
                state={context.state.date}
                data={context.data.date}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Date"}
            />
        );
    },
    user: function (
        props: WidgetExtraProps<typeof Fields.user> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "USER", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "user", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.user.component
                state={context.state.user}
                data={context.data.user}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "User"}
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
    dataMeta: WARRANTY_INTERNAL_NOTE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let dateState;
        {
            const inner = Fields.date.initialize(
                data.date,
                subcontext,
                subparameters.date
            );
            dateState = inner.state;
            data = { ...data, date: inner.data };
        }
        let userState;
        {
            const inner = Fields.user.initialize(
                data.user,
                subcontext,
                subparameters.user
            );
            userState = inner.state;
            data = { ...data, user: inner.data };
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
            date: dateState,
            user: userState,
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
                <RecordContext
                    meta={WARRANTY_INTERNAL_NOTE_META}
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
    date: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.date>
    >;
    user: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.user>
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
