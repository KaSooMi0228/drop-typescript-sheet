import { css } from "glamor";
import * as React from "react";
import { Dictionary } from "../../clay/common";
import { LocalDate } from "../../clay/LocalDate";
import { PageContext } from "../../clay/Page";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { RemoveButton } from "../../clay/remove-button";
import { DateWidget } from "../../clay/widgets/DateWidget";
import { Optional } from "../../clay/widgets/FormField";
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
import { useListItemContext } from "../../clay/widgets/ListWidget";
import { TextAreaWidget } from "../../clay/widgets/TextAreaWidget";
import { UserLinkWidget } from "../user";
import { DatedString, DATED_STRING_META } from "./table";

export type Data = DatedString;

export const Fields = {
    text: TextAreaWidget,
    user: Optional(UserLinkWidget),
    date: Optional(DateWidget),
};

export type Context = PageContext;

export function initialize(data: DatedString, context: PageContext) {
    const isEmpty = data.text === "";

    return {
        data: {
            ...data,
            date: isEmpty ? new LocalDate(new Date()) : data.date,
            user: isEmpty ? context.currentUserId : data.user,
        },
        state: {},
    };
}

const LINE_STYLE = css({
    display: "flex",
});

const ITEM_STYLE = css({
    padding: "4px",
});

function Component(props: Props) {
    const listItemContext = useListItemContext();

    return (
        <div {...listItemContext.draggableProps} {...LINE_STYLE}>
            {!listItemContext.isExtra && (
                <>
                    <div {...ITEM_STYLE} style={{ width: "40px" }}>
                        {listItemContext.dragHandle}
                    </div>
                    <div {...ITEM_STYLE}>
                        <widgets.date style={{ padding: "4px" }} readOnly />
                    </div>
                    <div {...ITEM_STYLE}>
                        <widgets.user readOnly />
                    </div>
                </>
            )}
            <div {...ITEM_STYLE} style={{ flexGrow: 1 }}>
                <widgets.text />
            </div>
            <RemoveButton />
        </div>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type SubContext = WidgetContext<typeof Fields.text> &
    WidgetContext<typeof Fields.user> &
    WidgetContext<typeof Fields.date>;
type ExtraProps = {};
type BaseState = {
    text: WidgetState<typeof Fields.text>;
    user: WidgetState<typeof Fields.user>;
    date: WidgetState<typeof Fields.date>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "TEXT"; action: WidgetAction<typeof Fields.text> }
    | { type: "USER"; action: WidgetAction<typeof Fields.user> }
    | { type: "DATE"; action: WidgetAction<typeof Fields.date> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.text, data.text, cache, "text", errors);
    subvalidate(Fields.user, data.user, cache, "user", errors);
    subvalidate(Fields.date, data.date, cache, "date", errors);
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: DATED_STRING_META,
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
        let state = {
            initialParameters: parameters,
            ...result.state,
            text: textState,
            user: userState,
            date: dateState,
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
                <RecordContext meta={DATED_STRING_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    text: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.text>
    >;
    user: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.user>
    >;
    date: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.date>
    >;
};
// END MAGIC -- DO NOT EDIT
