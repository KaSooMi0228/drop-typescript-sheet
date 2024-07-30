import { find } from "lodash";
import * as React from "react";
import { Dropdown } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { useQuickAllRecordsSorted } from "../../clay/widgets/dropdown-link-widget";
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
import { TabsWidget } from "../../clay/widgets/TabsWidget";
import { ESTIMATE_META } from "../estimate/table";
import { ESTIMATE_TEMPLATE_META } from "../estimate/templates/table";
import { TIME_AND_MATERIALS_ESTIMATE_META } from "../estimate/time-and-materials/table";
import NoteListWidget from "./notes/NoteListWidget.widget";
import {
    ContractNote,
    CONTRACT_NOTE_META,
    ProjectSpotlight,
    PROJECT_SPOTLIGHT_META,
    ScopeOfWork,
    SCOPE_OF_WORK_META,
} from "./notes/table";
import { Quotation, QUOTATION_META } from "./table";
import { QUOTATION_TYPE_META } from "./type/table";

export type Data = Quotation;

const Fields = {
    scopeOfWork: TabsWidget(NoteListWidget, {
        adaptNewItem() {
            throw new Error("Not Ready");
        },
        emptyOk: true,
    }),
};

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);

    const quotationType = cache.get(QUOTATION_TYPE_META, data.quotationType);

    if (
        (!quotationType || quotationType.print) &&
        data.scopeOfWork.length === 0
    ) {
        return [
            ...errors,
            {
                field: "scopeOfWork",
                empty: true,
                invalid: false,
            },
        ];
    } else {
        return errors;
    }
}

function rawActionQuotationScopeOfWorkWidgetAddScopeOfWork(
    state: State,
    data: Data,
    scopeOfWork: ScopeOfWork
) {
    const inner = NoteListWidget.initialize(
        {
            ...scopeOfWork.notes,
            options: null,
        },
        {}
    );
    return {
        state: {
            ...state,
            scopeOfWork: {
                ...state.scopeOfWork,
                items: [...state.scopeOfWork.items, inner.state],
            },
        },
        data: {
            ...data,
            scopeOfWork: [...data.scopeOfWork, inner.data],
        },
    };
}

function actionAddScopeOfWork(
    state: State,
    data: Data,
    scopeOfWork: ScopeOfWork,
    contractNotes: ContractNote[],
    projectSpotlights: ProjectSpotlight[]
) {
    let inner = rawActionQuotationScopeOfWorkWidgetAddScopeOfWork(
        state,
        data,
        scopeOfWork
    );

    for (const contractNoteId of scopeOfWork.contractNotes) {
        const contractNote = find(
            contractNotes,
            (note) => note.id.uuid == contractNoteId
        );
        if (contractNote) {
            inner = actionAddContractNotes(
                inner.state,
                inner.data,
                contractNote
            );
        }
    }

    for (const projectSpotlightId of scopeOfWork.projectSpotlight) {
        const projectSpotlight = find(
            projectSpotlights,
            (note) => note.id.uuid === projectSpotlightId
        );
        if (projectSpotlight) {
            inner = actionAddProjectSpotlight(
                inner.state,
                inner.data,
                projectSpotlight
            );
        }
    }

    return inner;
}

function actionAddContractNotes(
    state: State,
    data: Data,
    contractNotes: ContractNote
) {
    const inner = NoteListWidget.initialize(contractNotes.notes, {});
    return {
        state,
        data: {
            ...data,
            contractNotes: [...data.contractNotes, inner.data],
        },
    };
}

function actionAddProjectSpotlight(
    state: State,
    data: Data,
    projectSpotlightItem: ContractNote
) {
    const inner = NoteListWidget.initialize(projectSpotlightItem.notes, {});
    return {
        state,
        data: {
            ...data,
            projectSpotlightItems: [...data.projectSpotlightItems, inner.data],
        },
    };
}

export function resolveEstimateTemplates(
    quotation: Quotation,
    cache: QuickCacheApi
) {
    let missing = false;
    const templates = [];
    for (const estimateId of quotation.estimates) {
        const fullEstimate = cache.get(ESTIMATE_META, estimateId);
        const tmEstimate = cache.get(
            TIME_AND_MATERIALS_ESTIMATE_META,
            estimateId
        );
        const estimate = tmEstimate || fullEstimate;
        if (!estimate) {
            missing = true;
            continue;
        }

        if (estimate.common.template) {
            const template = cache.get(
                ESTIMATE_TEMPLATE_META,
                estimate.common.template
            );
            if (!template) {
                missing = true;
                continue;
            }
            templates.push(template);
        }
    }
    if (missing) {
        return null;
    } else {
        return templates;
    }
}

function Component(props: Props) {
    const scopeOfWorks = useQuickAllRecordsSorted(
        SCOPE_OF_WORK_META,
        (scopeOfWork) => scopeOfWork.notes.name
    );
    const contractNotes = useQuickAllRecordsSorted(
        CONTRACT_NOTE_META,
        (scopeOfWork) => scopeOfWork.notes.name
    );
    const projectSpotlights = useQuickAllRecordsSorted(
        PROJECT_SPOTLIGHT_META,
        (scopeOfWork) => scopeOfWork.notes.name
    );

    const actions = React.useCallback(
        (note, index) => [
            {
                label: "Remove",
                action: () => {
                    if (
                        confirm(
                            "Are you sure you want to delete this scope of work?"
                        )
                    ) {
                        props.dispatch({
                            type: "SCOPE_OF_WORK" as const,
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
            <widgets.scopeOfWork
                actions={actions}
                itemProps={{ quotation: props.data }}
                labelForItem={(notes) => notes.name}
                newButton={
                    <Dropdown>
                        <Dropdown.Toggle
                            variant="link"
                            id="scope-of-work-dropdown"
                        >
                            Add Scope of Work
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {scopeOfWorks.map((scopeOfWork) => (
                                <Dropdown.Item
                                    key={scopeOfWork.id.uuid}
                                    onClick={() => {
                                        props.dispatch({
                                            type: "ADD_SCOPE_OF_WORK",
                                            scopeOfWork,
                                            contractNotes,
                                            projectSpotlights,
                                        });
                                    }}
                                >
                                    {scopeOfWork.notes.name}
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
type Context = WidgetContext<typeof Fields.scopeOfWork>;
type ExtraProps = {};
type BaseState = {
    scopeOfWork: WidgetState<typeof Fields.scopeOfWork>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "SCOPE_OF_WORK"; action: WidgetAction<typeof Fields.scopeOfWork> }
    | {
          type: "ADD_SCOPE_OF_WORK";
          scopeOfWork: ScopeOfWork;
          contractNotes: ContractNote[];
          projectSpotlights: ProjectSpotlight[];
      }
    | { type: "ADD_CONTRACT_NOTES"; contractNotes: ContractNote }
    | { type: "ADD_PROJECT_SPOTLIGHT"; projectSpotlightItem: ContractNote };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.scopeOfWork,
        data.scopeOfWork,
        cache,
        "scopeOfWork",
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
        case "SCOPE_OF_WORK": {
            const inner = Fields.scopeOfWork.reduce(
                state.scopeOfWork,
                data.scopeOfWork,
                action.action,
                subcontext
            );
            return {
                state: { ...state, scopeOfWork: inner.state },
                data: { ...data, scopeOfWork: inner.data },
            };
        }
        case "ADD_SCOPE_OF_WORK":
            return actionAddScopeOfWork(
                state,
                data,
                action.scopeOfWork,
                action.contractNotes,
                action.projectSpotlights
            );
        case "ADD_CONTRACT_NOTES":
            return actionAddContractNotes(state, data, action.contractNotes);
        case "ADD_PROJECT_SPOTLIGHT":
            return actionAddProjectSpotlight(
                state,
                data,
                action.projectSpotlightItem
            );
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
    scopeOfWork: function (
        props: WidgetExtraProps<typeof Fields.scopeOfWork> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SCOPE_OF_WORK",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "scopeOfWork", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.scopeOfWork.component
                state={context.state.scopeOfWork}
                data={context.data.scopeOfWork}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Scope of Work"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: QUOTATION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let scopeOfWorkState;
        {
            const inner = Fields.scopeOfWork.initialize(
                data.scopeOfWork,
                subcontext,
                subparameters.scopeOfWork
            );
            scopeOfWorkState = inner.state;
            data = { ...data, scopeOfWork: inner.data };
        }
        let state = {
            initialParameters: parameters,
            scopeOfWork: scopeOfWorkState,
        };
        return {
            state,
            data,
        };
    },
    validate: validate,
    component: React.memo((props: Props) => {
        return (
            <ReactContext.Provider value={props}>
                <RecordContext meta={QUOTATION_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    scopeOfWork: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.scopeOfWork>
    >;
};
// END MAGIC -- DO NOT EDIT
