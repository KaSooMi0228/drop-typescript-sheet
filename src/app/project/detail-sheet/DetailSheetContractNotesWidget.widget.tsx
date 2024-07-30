import * as React from "react";
import { Dropdown } from "react-bootstrap";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { useQuickAllRecordsSorted } from "../../../clay/widgets/dropdown-link-widget";
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
import { TabsWidget } from "../../../clay/widgets/TabsWidget";
import NoteListWidget from "../../quotation/notes/NoteListWidget.widget";
import { ContractNote, CONTRACT_NOTE_META } from "../../quotation/notes/table";
import { DetailSheet, DETAIL_SHEET_META } from "./table";

export type Data = DetailSheet;

const Fields = {
    contractNotes: TabsWidget(NoteListWidget, {
        adaptNewItem() {
            throw new Error("Not Ready");
        },
        emptyOk: true,
    }),
};

function actionAddContractNotes(
    state: State,
    data: Data,
    contractNote: ContractNote
) {
    const inner = NoteListWidget.initialize(contractNote.notes, {});
    return {
        state: {
            ...state,
            contractNotes: {
                ...state.contractNotes,
                items: [...state.contractNotes.items, inner.state],
            },
        },
        data: {
            ...data,
            contractNotes: [...data.contractNotes, inner.data],
        },
    };
}

function Component(props: Props) {
    const contractNotes = useQuickAllRecordsSorted(
        CONTRACT_NOTE_META,
        (scopeOfWork) => scopeOfWork.notes.name
    );

    const actions = React.useCallback(
        (note, index) => [
            {
                label: "Remove",
                action: () => {
                    if (
                        confirm(
                            "Are you sure you want to delete this project note?"
                        )
                    ) {
                        props.dispatch({
                            type: "CONTRACT_NOTES" as const,
                            action: {
                                index,
                                type: "REMOVE",
                            },
                        });
                    }
                },
            },
        ],
        [props.dispatch]
    );

    return (
        <>
            <widgets.contractNotes
                actions={actions}
                itemProps={{ quotation: props.data }}
                labelForItem={(notes) => notes.name}
                newButton={
                    <Dropdown>
                        <Dropdown.Toggle
                            variant="link"
                            id="contract-note-dropdown"
                        >
                            Add Project Note
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {contractNotes.map((contractNote) => (
                                <Dropdown.Item
                                    key={contractNote.id.uuid}
                                    onClick={() => {
                                        props.dispatch({
                                            type: "ADD_CONTRACT_NOTES",
                                            contractNote,
                                        });
                                    }}
                                >
                                    {contractNote.notes.name}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                }
            />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.contractNotes>;
type ExtraProps = {};
type BaseState = {
    contractNotes: WidgetState<typeof Fields.contractNotes>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "CONTRACT_NOTES";
          action: WidgetAction<typeof Fields.contractNotes>;
      }
    | { type: "ADD_CONTRACT_NOTES"; contractNote: ContractNote };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.contractNotes,
        data.contractNotes,
        cache,
        "contractNotes",
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
        case "ADD_CONTRACT_NOTES":
            return actionAddContractNotes(state, data, action.contractNote);
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: DETAIL_SHEET_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
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
        let state = {
            initialParameters: parameters,
            contractNotes: contractNotesState,
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
                <RecordContext meta={DETAIL_SHEET_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    contractNotes: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contractNotes>
    >;
};
// END MAGIC -- DO NOT EDIT
