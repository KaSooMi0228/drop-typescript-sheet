import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { PaginatedWidget } from "../../../clay/paginated-widget";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
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
import { PercentageWidget } from "../../../clay/widgets/percentage-widget";
import { RichTextWidget } from "../../rich-text-widget";
import { CONTENT_AREA } from "../../styles";
import SiteVisitReportMainWidget, {
    SectionWidgetFactory,
} from "./SiteVisitReportMainWidget.widget";
import { SiteVisitReport, SITE_VISIT_REPORT_META } from "./table";

export const SiteVisitReportWidget = PaginatedWidget({
    dataMeta: SITE_VISIT_REPORT_META,
    validate(detailSheet, cache, errors) {
        if (detailSheet.date) {
            return [];
        } else {
            return errors;
        }
    },
    pages(data) {
        return [
            {
                id: "main",
                title: "Details",
                widget: SiteVisitReportMainWidget,
            },
            {
                id: "notes",
                title: "Summary",
                widget: Widget,
            },
            ...data.sections.map((section, index) => ({
                id: `section-${index}`,
                title: section.name,
                widget: SectionWidgetFactory(index),
            })),
        ];
    },
});

export type Data = SiteVisitReport;

export const Fields = {
    reportOnWorkPlan: FormField(RichTextWidget),
    projectIssuesInformationActionItems: FormField(RichTextWidget),
    progressToDate: OptionalFormField(PercentageWidget),
    previousProgressToDate: OptionalFormField(PercentageWidget),
};

export function actionFinalize(state: State, data: SiteVisitReport) {
    return {
        state,
        data: {
            ...data,
            date: data.date || new Date(),
        },
    };
}

function Component(props: Props) {
    return (
        <>
            <div {...CONTENT_AREA}>
                <widgets.reportOnWorkPlan />
                <widgets.projectIssuesInformationActionItems label="Project Issues / Information / Action Items" />
                <widgets.previousProgressToDate readOnly />
                <widgets.progressToDate />
            </div>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.reportOnWorkPlan> &
    WidgetContext<typeof Fields.projectIssuesInformationActionItems> &
    WidgetContext<typeof Fields.progressToDate> &
    WidgetContext<typeof Fields.previousProgressToDate>;
type ExtraProps = {};
type BaseState = {
    reportOnWorkPlan: WidgetState<typeof Fields.reportOnWorkPlan>;
    projectIssuesInformationActionItems: WidgetState<
        typeof Fields.projectIssuesInformationActionItems
    >;
    progressToDate: WidgetState<typeof Fields.progressToDate>;
    previousProgressToDate: WidgetState<typeof Fields.previousProgressToDate>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "REPORT_ON_WORK_PLAN";
          action: WidgetAction<typeof Fields.reportOnWorkPlan>;
      }
    | {
          type: "PROJECT_ISSUES_INFORMATION_ACTION_ITEMS";
          action: WidgetAction<
              typeof Fields.projectIssuesInformationActionItems
          >;
      }
    | {
          type: "PROGRESS_TO_DATE";
          action: WidgetAction<typeof Fields.progressToDate>;
      }
    | {
          type: "PREVIOUS_PROGRESS_TO_DATE";
          action: WidgetAction<typeof Fields.previousProgressToDate>;
      }
    | { type: "FINALIZE" };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.reportOnWorkPlan,
        data.reportOnWorkPlan,
        cache,
        "reportOnWorkPlan",
        errors
    );
    subvalidate(
        Fields.projectIssuesInformationActionItems,
        data.projectIssuesInformationActionItems,
        cache,
        "projectIssuesInformationActionItems",
        errors
    );
    subvalidate(
        Fields.progressToDate,
        data.progressToDate,
        cache,
        "progressToDate",
        errors
    );
    subvalidate(
        Fields.previousProgressToDate,
        data.previousProgressToDate,
        cache,
        "previousProgressToDate",
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
        case "REPORT_ON_WORK_PLAN": {
            const inner = Fields.reportOnWorkPlan.reduce(
                state.reportOnWorkPlan,
                data.reportOnWorkPlan,
                action.action,
                subcontext
            );
            return {
                state: { ...state, reportOnWorkPlan: inner.state },
                data: { ...data, reportOnWorkPlan: inner.data },
            };
        }
        case "PROJECT_ISSUES_INFORMATION_ACTION_ITEMS": {
            const inner = Fields.projectIssuesInformationActionItems.reduce(
                state.projectIssuesInformationActionItems,
                data.projectIssuesInformationActionItems,
                action.action,
                subcontext
            );
            return {
                state: {
                    ...state,
                    projectIssuesInformationActionItems: inner.state,
                },
                data: {
                    ...data,
                    projectIssuesInformationActionItems: inner.data,
                },
            };
        }
        case "PROGRESS_TO_DATE": {
            const inner = Fields.progressToDate.reduce(
                state.progressToDate,
                data.progressToDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, progressToDate: inner.state },
                data: { ...data, progressToDate: inner.data },
            };
        }
        case "PREVIOUS_PROGRESS_TO_DATE": {
            const inner = Fields.previousProgressToDate.reduce(
                state.previousProgressToDate,
                data.previousProgressToDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, previousProgressToDate: inner.state },
                data: { ...data, previousProgressToDate: inner.data },
            };
        }
        case "FINALIZE":
            return actionFinalize(state, data);
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
    reportOnWorkPlan: function (
        props: WidgetExtraProps<typeof Fields.reportOnWorkPlan> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "REPORT_ON_WORK_PLAN",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "reportOnWorkPlan", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.reportOnWorkPlan.component
                state={context.state.reportOnWorkPlan}
                data={context.data.reportOnWorkPlan}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Report on Work Plan"}
            />
        );
    },
    projectIssuesInformationActionItems: function (
        props: WidgetExtraProps<
            typeof Fields.projectIssuesInformationActionItems
        > & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_ISSUES_INFORMATION_ACTION_ITEMS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "projectIssuesInformationActionItems",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectIssuesInformationActionItems.component
                state={context.state.projectIssuesInformationActionItems}
                data={context.data.projectIssuesInformationActionItems}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Issues Information Action Items"}
            />
        );
    },
    progressToDate: function (
        props: WidgetExtraProps<typeof Fields.progressToDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROGRESS_TO_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "progressToDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.progressToDate.component
                state={context.state.progressToDate}
                data={context.data.progressToDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Progress to Date"}
            />
        );
    },
    previousProgressToDate: function (
        props: WidgetExtraProps<typeof Fields.previousProgressToDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PREVIOUS_PROGRESS_TO_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "previousProgressToDate",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.previousProgressToDate.component
                state={context.state.previousProgressToDate}
                data={context.data.previousProgressToDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Previous Progress to Date"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: SITE_VISIT_REPORT_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let reportOnWorkPlanState;
        {
            const inner = Fields.reportOnWorkPlan.initialize(
                data.reportOnWorkPlan,
                subcontext,
                subparameters.reportOnWorkPlan
            );
            reportOnWorkPlanState = inner.state;
            data = { ...data, reportOnWorkPlan: inner.data };
        }
        let projectIssuesInformationActionItemsState;
        {
            const inner = Fields.projectIssuesInformationActionItems.initialize(
                data.projectIssuesInformationActionItems,
                subcontext,
                subparameters.projectIssuesInformationActionItems
            );
            projectIssuesInformationActionItemsState = inner.state;
            data = { ...data, projectIssuesInformationActionItems: inner.data };
        }
        let progressToDateState;
        {
            const inner = Fields.progressToDate.initialize(
                data.progressToDate,
                subcontext,
                subparameters.progressToDate
            );
            progressToDateState = inner.state;
            data = { ...data, progressToDate: inner.data };
        }
        let previousProgressToDateState;
        {
            const inner = Fields.previousProgressToDate.initialize(
                data.previousProgressToDate,
                subcontext,
                subparameters.previousProgressToDate
            );
            previousProgressToDateState = inner.state;
            data = { ...data, previousProgressToDate: inner.data };
        }
        let state = {
            initialParameters: parameters,
            reportOnWorkPlan: reportOnWorkPlanState,
            projectIssuesInformationActionItems:
                projectIssuesInformationActionItemsState,
            progressToDate: progressToDateState,
            previousProgressToDate: previousProgressToDateState,
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
                <RecordContext meta={SITE_VISIT_REPORT_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    reportOnWorkPlan: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.reportOnWorkPlan>
    >;
    projectIssuesInformationActionItems: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectIssuesInformationActionItems>
    >;
    progressToDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.progressToDate>
    >;
    previousProgressToDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.previousProgressToDate>
    >;
};
// END MAGIC -- DO NOT EDIT
