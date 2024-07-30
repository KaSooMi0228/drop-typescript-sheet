import * as React from "react";
import { Tab, Tabs } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { SaveDeleteButton } from "../../clay/save-delete-button";
import { FormField } from "../../clay/widgets/FormField";
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
import { TextWidget } from "../../clay/widgets/TextWidget";
import SurveySectionWidget from "./SurveySectionWidget.widget";
import {
    ProjectDescriptionCategory,
    PROJECT_DESCRIPTION_CATEGORY_META,
} from "./table";

export type Data = ProjectDescriptionCategory;

export const Fields = {
    name: FormField(TextWidget),
    surveySections: TabsWidget(SurveySectionWidget, {
        namePrompt: "Name for new survey section?",
        emptyOk: true,
    }),
};

function Component(props: Props) {
    const surveySectionActions = React.useCallback(
        (area, index) => [
            {
                label: "Rename",
                action: () => {
                    const name = prompt("Section Name?", area.name);
                    if (name != null) {
                        props.dispatch({
                            type: "SURVEY_SECTIONS" as const,
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
                        type: "SURVEY_SECTIONS" as const,
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
                            type: "SURVEY_SECTIONS" as const,
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
            <widgets.name />
            <Tabs defaultActiveKey="site">
                <Tab eventKey="site" title="Site Survey">
                    <widgets.surveySections
                        newLabel="New Survey Section"
                        labelForItem={(section) => section.name}
                        actions={surveySectionActions}
                    />
                </Tab>
            </Tabs>

            <SaveDeleteButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.surveySections>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    surveySections: WidgetState<typeof Fields.surveySections>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | {
          type: "SURVEY_SECTIONS";
          action: WidgetAction<typeof Fields.surveySections>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(
        Fields.surveySections,
        data.surveySections,
        cache,
        "surveySections",
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
        case "SURVEY_SECTIONS": {
            const inner = Fields.surveySections.reduce(
                state.surveySections,
                data.surveySections,
                action.action,
                subcontext
            );
            return {
                state: { ...state, surveySections: inner.state },
                data: { ...data, surveySections: inner.data },
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
    surveySections: function (
        props: WidgetExtraProps<typeof Fields.surveySections> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SURVEY_SECTIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "surveySections", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.surveySections.component
                state={context.state.surveySections}
                data={context.data.surveySections}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Survey Sections"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PROJECT_DESCRIPTION_CATEGORY_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
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
        let surveySectionsState;
        {
            const inner = Fields.surveySections.initialize(
                data.surveySections,
                subcontext,
                subparameters.surveySections
            );
            surveySectionsState = inner.state;
            data = { ...data, surveySections: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            surveySections: surveySectionsState,
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
                    meta={PROJECT_DESCRIPTION_CATEGORY_META}
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
    name: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.name>
    >;
    surveySections: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.surveySections>
    >;
};
// END MAGIC -- DO NOT EDIT
