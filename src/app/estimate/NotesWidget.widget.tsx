import * as React from "react";
import { Dictionary } from "../../clay/common";
import { PageContext } from "../../clay/Page";
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
import { NoteBlockWidget } from "./notes-widget";
import { Estimate, ESTIMATE_META } from "./table";

export type Data = Estimate;

export type Context = PageContext;

export const Fields = {
    notes: NoteBlockWidget,
};

function Component(props: Props) {
    return <widgets.notes />;
}

// BEGIN MAGIC -- DO NOT EDIT
type SubContext = WidgetContext<typeof Fields.notes>;
type ExtraProps = {};
type BaseState = {
    notes: WidgetState<typeof Fields.notes>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = { type: "NOTES"; action: WidgetAction<typeof Fields.notes> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.notes, data.notes, cache, "notes", errors);
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
        case "NOTES": {
            const inner = Fields.notes.reduce(
                state.notes,
                data.notes,
                action.action,
                subcontext
            );
            return {
                state: { ...state, notes: inner.state },
                data: { ...data, notes: inner.data },
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
    notes: function (
        props: WidgetExtraProps<typeof Fields.notes> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "NOTES", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "notes", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.notes.component
                state={context.state.notes}
                data={context.data.notes}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Notes"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ESTIMATE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let notesState;
        {
            const inner = Fields.notes.initialize(
                data.notes,
                subcontext,
                subparameters.notes
            );
            notesState = inner.state;
            data = { ...data, notes: inner.data };
        }
        let state = {
            initialParameters: parameters,
            notes: notesState,
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
                <RecordContext meta={ESTIMATE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    notes: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.notes>
    >;
};
// END MAGIC -- DO NOT EDIT
