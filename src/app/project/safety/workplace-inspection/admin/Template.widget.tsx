import * as React from "react";
import { Dictionary } from "../../../../../clay/common";
import { propCheck } from "../../../../../clay/propCheck";
import { QuickCacheApi } from "../../../../../clay/quick-cache";
import { SaveButton } from "../../../../../clay/save-button";
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
} from "../../../../../clay/widgets/index";
import { TabsWidget } from "../../../../../clay/widgets/TabsWidget";
import SectionWidget from "./Section.widget";
import {
    WorkplaceInspectionTemplate,
    WORKPLACE_INSPECTION_TEMPLATE_META,
} from "./table";

type Data = WorkplaceInspectionTemplate;

const Fields = {
    sections: TabsWidget(SectionWidget, {
        namePrompt: "Name for new section?",
    }),
};

function Component(props: Props) {
    const sectionActions = React.useCallback(
        (area, index) => [
            {
                label: "Rename",
                action: () => {
                    const name = prompt("Section Name?", area.name);
                    if (name != null) {
                        props.dispatch({
                            type: "SECTIONS" as const,
                            action: {
                                index,
                                type: "ITEM",
                                action: {
                                    type: "NAME" as const,
                                    action: {
                                        type: "SET" as const,
                                        value: name,
                                    },
                                },
                            },
                        });
                    }
                },
            },
            {
                label: "Duplicate",
                action: () => {
                    props.dispatch({
                        type: "SECTIONS" as const,
                        action: {
                            index,
                            type: "DUPLICATE",
                        },
                    });
                },
            },
            {
                label: "Remove",
                action: () => {
                    if (
                        confirm(
                            "Are you sure you want to delete survey section?"
                        )
                    ) {
                        props.dispatch({
                            type: "SECTIONS" as const,
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
            <widgets.sections
                actions={sectionActions}
                newLabel={"Add Section"}
                labelForItem={(x) => x.name}
            />
            <SaveButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.sections>;
type ExtraProps = {};
type BaseState = {
    sections: WidgetState<typeof Fields.sections>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "SECTIONS";
    action: WidgetAction<typeof Fields.sections>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.sections, data.sections, cache, "sections", errors);
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
        case "SECTIONS": {
            const inner = Fields.sections.reduce(
                state.sections,
                data.sections,
                action.action,
                subcontext
            );
            return {
                state: { ...state, sections: inner.state },
                data: { ...data, sections: inner.data },
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
    sections: function (
        props: WidgetExtraProps<typeof Fields.sections> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SECTIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "sections", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.sections.component
                state={context.state.sections}
                data={context.data.sections}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Sections"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WORKPLACE_INSPECTION_TEMPLATE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let sectionsState;
        {
            const inner = Fields.sections.initialize(
                data.sections,
                subcontext,
                subparameters.sections
            );
            sectionsState = inner.state;
            data = { ...data, sections: inner.data };
        }
        let state = {
            initialParameters: parameters,
            sections: sectionsState,
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
                    meta={WORKPLACE_INSPECTION_TEMPLATE_META}
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
    sections: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.sections>
    >;
};
// END MAGIC -- DO NOT EDIT
