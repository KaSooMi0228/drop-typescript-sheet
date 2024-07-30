import { User } from "@sentry/node";
import * as React from "react";
import { Button } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { Link } from "../../clay/link";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
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
import { ListWidget } from "../../clay/widgets/ListWidget";
import { useUser } from "../state";
import InternalNoteWidget from "./InternalNote.widget";
import { WarrantyReview, WARRANTY_REVIEW_META } from "./table";

type Data = WarrantyReview;

const Fields = {
    internalNotes: ListWidget(InternalNoteWidget, { emptyOk: true }),
};

function actionAddNote(state: State, data: WarrantyReview, user: Link<User>) {
    const inner = InternalNoteWidget.initialize(
        {
            user: user,
            date: new Date(),
            text: "",
        },
        {}
    );

    return {
        state: {
            internalNotes: {
                ...state.internalNotes,
                items: [...state.internalNotes.items, inner.state],
            },
        },
        data: {
            ...data,
            internalNotes: [...data.internalNotes, inner.data],
        },
    };
}

function Component(props: Props) {
    const user = useUser();
    const onAdd = React.useCallback(() => {
        props.dispatch({
            type: "ADD_NOTE",
            user: user.id,
        });
    }, [user.id, props.dispatch]);

    return (
        <>
            <Button onClick={onAdd}>Add Note</Button>
            <widgets.internalNotes reversed />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.internalNotes>;
type ExtraProps = {};
type BaseState = {
    internalNotes: WidgetState<typeof Fields.internalNotes>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "INTERNAL_NOTES";
          action: WidgetAction<typeof Fields.internalNotes>;
      }
    | { type: "ADD_NOTE"; user: Link<User> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.internalNotes,
        data.internalNotes,
        cache,
        "internalNotes",
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
        case "INTERNAL_NOTES": {
            const inner = Fields.internalNotes.reduce(
                state.internalNotes,
                data.internalNotes,
                action.action,
                subcontext
            );
            return {
                state: { ...state, internalNotes: inner.state },
                data: { ...data, internalNotes: inner.data },
            };
        }
        case "ADD_NOTE":
            return actionAddNote(state, data, action.user);
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
    internalNotes: function (
        props: WidgetExtraProps<typeof Fields.internalNotes> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INTERNAL_NOTES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "internalNotes", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.internalNotes.component
                state={context.state.internalNotes}
                data={context.data.internalNotes}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Internal Notes"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WARRANTY_REVIEW_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let internalNotesState;
        {
            const inner = Fields.internalNotes.initialize(
                data.internalNotes,
                subcontext,
                subparameters.internalNotes
            );
            internalNotesState = inner.state;
            data = { ...data, internalNotes: inner.data };
        }
        let state = {
            initialParameters: parameters,
            internalNotes: internalNotesState,
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
                <RecordContext meta={WARRANTY_REVIEW_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    internalNotes: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.internalNotes>
    >;
};
// END MAGIC -- DO NOT EDIT
