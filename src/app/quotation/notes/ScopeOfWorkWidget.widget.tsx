import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { SaveDeleteButton } from "../../../clay/save-delete-button";
import { OptionalFormField } from "../../../clay/widgets/FormField";
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
import { LinkSetWidget } from "../../../clay/widgets/link-set-widget";
import NoteListWidget from "./NoteListWidget.widget";
import {
    CONTRACT_NOTE_META,
    PROJECT_SPOTLIGHT_META,
    ScopeOfWork,
    SCOPE_OF_WORK_META,
} from "./table";

export type Data = ScopeOfWork;

const Fields = {
    notes: NoteListWidget,
    contractNotes: OptionalFormField(
        LinkSetWidget({
            meta: CONTRACT_NOTE_META,
            name: (record) => record.notes.name,
        })
    ),
    projectSpotlight: OptionalFormField(
        LinkSetWidget({
            meta: PROJECT_SPOTLIGHT_META,
            name: (record) => record.notes.name,
        })
    ),
};

function Component(props: Props) {
    return (
        <>
            <widgets.notes />
            <widgets.contractNotes />
            <widgets.projectSpotlight />

            <SaveDeleteButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.notes> &
    WidgetContext<typeof Fields.contractNotes> &
    WidgetContext<typeof Fields.projectSpotlight>;
type ExtraProps = {};
type BaseState = {
    notes: WidgetState<typeof Fields.notes>;
    contractNotes: WidgetState<typeof Fields.contractNotes>;
    projectSpotlight: WidgetState<typeof Fields.projectSpotlight>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NOTES"; action: WidgetAction<typeof Fields.notes> }
    | {
          type: "CONTRACT_NOTES";
          action: WidgetAction<typeof Fields.contractNotes>;
      }
    | {
          type: "PROJECT_SPOTLIGHT";
          action: WidgetAction<typeof Fields.projectSpotlight>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.notes, data.notes, cache, "notes", errors);
    subvalidate(
        Fields.contractNotes,
        data.contractNotes,
        cache,
        "contractNotes",
        errors
    );
    subvalidate(
        Fields.projectSpotlight,
        data.projectSpotlight,
        cache,
        "projectSpotlight",
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
        case "CONTRACT_NOTES": {
            const inner = Fields.contractNotes.reduce(
                state.contractNotes,
                data.contractNotes,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contractNotes: inner.state },
                data: { ...data, contractNotes: inner.data },
            };
        }
        case "PROJECT_SPOTLIGHT": {
            const inner = Fields.projectSpotlight.reduce(
                state.projectSpotlight,
                data.projectSpotlight,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectSpotlight: inner.state },
                data: { ...data, projectSpotlight: inner.data },
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
    contractNotes: function (
        props: WidgetExtraProps<typeof Fields.contractNotes> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTRACT_NOTES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "contractNotes", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contractNotes.component
                state={context.state.contractNotes}
                data={context.data.contractNotes}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contract Notes"}
            />
        );
    },
    projectSpotlight: function (
        props: WidgetExtraProps<typeof Fields.projectSpotlight> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_SPOTLIGHT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "projectSpotlight", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectSpotlight.component
                state={context.state.projectSpotlight}
                data={context.data.projectSpotlight}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Spotlight"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: SCOPE_OF_WORK_META,
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
        let contractNotesState;
        {
            const inner = Fields.contractNotes.initialize(
                data.contractNotes,
                subcontext,
                subparameters.contractNotes
            );
            contractNotesState = inner.state;
            data = { ...data, contractNotes: inner.data };
        }
        let projectSpotlightState;
        {
            const inner = Fields.projectSpotlight.initialize(
                data.projectSpotlight,
                subcontext,
                subparameters.projectSpotlight
            );
            projectSpotlightState = inner.state;
            data = { ...data, projectSpotlight: inner.data };
        }
        let state = {
            initialParameters: parameters,
            notes: notesState,
            contractNotes: contractNotesState,
            projectSpotlight: projectSpotlightState,
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
                <RecordContext meta={SCOPE_OF_WORK_META} value={props.data}>
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
    contractNotes: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contractNotes>
    >;
    projectSpotlight: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectSpotlight>
    >;
};
// END MAGIC -- DO NOT EDIT
