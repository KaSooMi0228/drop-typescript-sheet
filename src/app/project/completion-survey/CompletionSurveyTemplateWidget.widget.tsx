import { memoize } from "lodash";
import React from "react";
import { Dictionary } from "../../../clay/common";
import { DeleteButton } from "../../../clay/delete-button";
import { GenerateButton } from "../../../clay/generate-button";
import { PaginatedWidget } from "../../../clay/paginated-widget";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { SaveButton } from "../../../clay/save-button";
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
import SurveySectionWidget from "../../project-description/SurveySectionWidget.widget";
import { CONTENT_AREA } from "../../styles";
import SiteVisitReportSectionWidget, {
    Action as SiteVisitReportSectionWidgetAction,
    State as SiteVisitReportSectionWidgetState,
} from "../site-visit-report/SiteVisitReportSectionWidget.widget";
import {
    CompletionSurvey,
    CompletionSurveyTemplate,
    COMPLETION_SURVEY_META,
    COMPLETION_SURVEY_TEMPLATE_META,
} from "./table";

export type Data = CompletionSurveyTemplate;

export const Fields = {
    surveySections: TabsWidget(SurveySectionWidget, {
        namePrompt: "Name for new survey section?",
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
            <widgets.surveySections
                newLabel="New Survey Section"
                labelForItem={(section) => section.name}
                actions={surveySectionActions}
            />
            <SaveButton />
            <DeleteButton />
        </>
    );
}

function CompletionSurveySurveySectionWidget(
    index: number,
    final: boolean
): RecordWidget<
    SiteVisitReportSectionWidgetState,
    CompletionSurvey,
    {},
    SiteVisitReportSectionWidgetAction,
    {}
> {
    return {
        dataMeta: COMPLETION_SURVEY_META,
        reactContext: undefined as any,
        fieldWidgets: undefined as any,
        initialize(data: CompletionSurvey, context) {
            const inner = SiteVisitReportSectionWidget.initialize(
                data.sections[index],
                context
            );
            const items = data.sections.slice();
            items[index] = inner.data;
            return {
                data: {
                    ...data,
                    sections: items,
                },
                state: inner.state,
            };
        },
        component(props) {
            return (
                <>
                    <div {...CONTENT_AREA}>
                        <SiteVisitReportSectionWidget.component
                            {...props}
                            final={false}
                            data={props.data.sections[index]}
                        />
                    </div>
                    {final && (
                        <div style={{ display: "flex" }}>
                            <GenerateButton label="Generate Survey" />
                            <DeleteButton label="Delete Survey" />
                        </div>
                    )}
                </>
            );
        },
        reduce(state, data, action, context) {
            const inner = SiteVisitReportSectionWidget.reduce(
                state,
                data.sections[index],
                action,
                context
            );
            const items = data.sections.slice();
            items[index] = inner.data;
            return {
                state: inner.state,
                data: {
                    ...data,
                    sections: items,
                },
            };
        },
        validate(data, cache) {
            return SiteVisitReportSectionWidget.validate(
                data.sections[index],
                cache
            );
        },
    };
}

const SectionWidgetFactory = memoize(CompletionSurveySurveySectionWidget);

export const CompletionSurveyWidget = PaginatedWidget({
    dataMeta: COMPLETION_SURVEY_META,
    validate(detailSheet, cache, errors) {
        if (detailSheet.date) {
            return [];
        } else {
            return errors;
        }
    },
    pages(data) {
        return [
            ...data.sections.map((section, index) => ({
                id: `section-${index}`,
                title: section.name,
                widget: SectionWidgetFactory(
                    index,
                    index + 1 === data.sections.length
                ),
            })),
        ];
    },
});

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.surveySections>;
type ExtraProps = {};
type BaseState = {
    surveySections: WidgetState<typeof Fields.surveySections>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "SURVEY_SECTIONS";
    action: WidgetAction<typeof Fields.surveySections>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
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
    dataMeta: COMPLETION_SURVEY_TEMPLATE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
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
                    meta={COMPLETION_SURVEY_TEMPLATE_META}
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
    surveySections: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.surveySections>
    >;
};
// END MAGIC -- DO NOT EDIT
