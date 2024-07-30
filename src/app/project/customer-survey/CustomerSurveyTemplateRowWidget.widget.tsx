import React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { SaveDeleteButton } from "../../../clay/save-delete-button";
import { DropdownLinkWidget } from "../../../clay/widgets/dropdown-link-widget";
import { FormField, OptionalFormField } from "../../../clay/widgets/FormField";
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
import { TextWidget } from "../../../clay/widgets/TextWidget";
import SurveySectionWidget from "../../project-description/SurveySectionWidget.widget";
import { PROJECT_DESCRIPTION_CATEGORY_META } from "../../project-description/table";
import { CustomerSurveyTemplate, CUSTOMER_SURVEY_TEMPLATE_META } from "./table";

export type Data = CustomerSurveyTemplate;

export const Fields = {
    name: FormField(TextWidget),
    category: OptionalFormField(
        DropdownLinkWidget({
            meta: PROJECT_DESCRIPTION_CATEGORY_META,
            label: (category) => category.name,
        })
    ),
    sections: TabsWidget(SurveySectionWidget, {
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
        <div className="customer-survey-template">
            <widgets.name />
            <widgets.category />
            <widgets.sections
                newLabel="New Survey Section"
                labelForItem={(section) => section.name}
                actions={surveySectionActions}
            />

            <SaveDeleteButton duplicate />
        </div>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.category> &
    WidgetContext<typeof Fields.sections>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    category: WidgetState<typeof Fields.category>;
    sections: WidgetState<typeof Fields.sections>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "CATEGORY"; action: WidgetAction<typeof Fields.category> }
    | { type: "SECTIONS"; action: WidgetAction<typeof Fields.sections> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.category, data.category, cache, "category", errors);
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
        case "CATEGORY": {
            const inner = Fields.category.reduce(
                state.category,
                data.category,
                action.action,
                subcontext
            );
            return {
                state: { ...state, category: inner.state },
                data: { ...data, category: inner.data },
            };
        }
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
    category: function (
        props: WidgetExtraProps<typeof Fields.category> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CATEGORY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "category", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.category.component
                state={context.state.category}
                data={context.data.category}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Category"}
            />
        );
    },
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
    dataMeta: CUSTOMER_SURVEY_TEMPLATE_META,
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
        let categoryState;
        {
            const inner = Fields.category.initialize(
                data.category,
                subcontext,
                subparameters.category
            );
            categoryState = inner.state;
            data = { ...data, category: inner.data };
        }
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
            name: nameState,
            category: categoryState,
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
                    meta={CUSTOMER_SURVEY_TEMPLATE_META}
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
    category: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.category>
    >;
    sections: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.sections>
    >;
};
// END MAGIC -- DO NOT EDIT
