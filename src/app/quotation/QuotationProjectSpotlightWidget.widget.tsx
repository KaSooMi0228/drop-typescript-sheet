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
import NoteListWidget from "./notes/NoteListWidget.widget";
import { ContractNote, PROJECT_SPOTLIGHT_META } from "./notes/table";
import { Quotation, QUOTATION_META } from "./table";

export type Data = Quotation;

const Fields = {
    projectSpotlightItems: TabsWidget(NoteListWidget, { emptyOk: true }),
};

export function actionAddProjectSpotlight(
    state: State,
    data: Data,
    projectSpotlight: ContractNote
) {
    const inner = NoteListWidget.initialize(projectSpotlight.notes, {});
    return {
        state: {
            ...state,
            projectSpotlightItems: {
                ...state.projectSpotlightItems,
                items: [...state.projectSpotlightItems.items, inner.state],
            },
        },
        data: {
            ...data,
            projectSpotlightItems: [...data.projectSpotlightItems, inner.data],
        },
    };
}

function Component(props: Props) {
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
                            "Are you sure you want to delete this project item?"
                        )
                    ) {
                        props.dispatch({
                            type: "PROJECT_SPOTLIGHT_ITEMS" as const,
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
            <widgets.projectSpotlightItems
                labelForItem={(notes) => notes.name}
                actions={actions}
                newButton={
                    <Dropdown>
                        <Dropdown.Toggle
                            variant="success"
                            id="your-project-items-dropdown"
                        >
                            Add Project Spotlight Items
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {projectSpotlights.map((projectSpotlight) => (
                                <Dropdown.Item
                                    key={projectSpotlight.id.uuid}
                                    onClick={() =>
                                        props.dispatch({
                                            type: "ADD_PROJECT_SPOTLIGHT",
                                            projectSpotlight,
                                        })
                                    }
                                >
                                    {projectSpotlight.notes.name}
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
type Context = WidgetContext<typeof Fields.projectSpotlightItems>;
type ExtraProps = {};
type BaseState = {
    projectSpotlightItems: WidgetState<typeof Fields.projectSpotlightItems>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "PROJECT_SPOTLIGHT_ITEMS";
          action: WidgetAction<typeof Fields.projectSpotlightItems>;
      }
    | { type: "ADD_PROJECT_SPOTLIGHT"; projectSpotlight: ContractNote };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.projectSpotlightItems,
        data.projectSpotlightItems,
        cache,
        "projectSpotlightItems",
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
        case "PROJECT_SPOTLIGHT_ITEMS": {
            const inner = Fields.projectSpotlightItems.reduce(
                state.projectSpotlightItems,
                data.projectSpotlightItems,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectSpotlightItems: inner.state },
                data: { ...data, projectSpotlightItems: inner.data },
            };
        }
        case "ADD_PROJECT_SPOTLIGHT":
            return actionAddProjectSpotlight(
                state,
                data,
                action.projectSpotlight
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
    projectSpotlightItems: function (
        props: WidgetExtraProps<typeof Fields.projectSpotlightItems> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_SPOTLIGHT_ITEMS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "projectSpotlightItems",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectSpotlightItems.component
                state={context.state.projectSpotlightItems}
                data={context.data.projectSpotlightItems}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Spotlight Items"}
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
        let projectSpotlightItemsState;
        {
            const inner = Fields.projectSpotlightItems.initialize(
                data.projectSpotlightItems,
                subcontext,
                subparameters.projectSpotlightItems
            );
            projectSpotlightItemsState = inner.state;
            data = { ...data, projectSpotlightItems: inner.data };
        }
        let state = {
            initialParameters: parameters,
            projectSpotlightItems: projectSpotlightItemsState,
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
    projectSpotlightItems: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectSpotlightItems>
    >;
};
// END MAGIC -- DO NOT EDIT
