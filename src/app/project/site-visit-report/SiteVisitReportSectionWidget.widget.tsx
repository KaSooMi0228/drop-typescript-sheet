import { find, some } from "lodash";
import React from "react";
import { Dictionary } from "../../../clay/common";
import { GenerateButton } from "../../../clay/generate-button";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
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
import { StaticListWidget } from "../../../clay/widgets/StaticListWidget";
import SiteVisitReportQuestionWidget from "./SiteVisitReportQuestionWidget.widget";
import {
    SiteVisitReportSection,
    SITE_VISIT_REPORT_SECTION_META,
} from "./table";

export type Data = SiteVisitReportSection;

export type ExtraProps = {
    final: boolean;
};

export const Fields = {
    questions: StaticListWidget(SiteVisitReportQuestionWidget),
};

function validate(data: Data, cache: QuickCacheApi) {
    if (isSectionSkipped(data)) {
        return [];
    }
    const errors = baseValidate(data, cache);
    return errors;
}

function isSectionSkipped(section: SiteVisitReportSection) {
    return some(
        section.questions,
        (question) =>
            question.controlsSection &&
            find(
                question.answers,
                (answer) => answer.id.uuid === question.selectedAnswer
            )?.score === null
    );
}

function Component(props: Props) {
    return (
        <>
            <h1>{props.data.name}</h1>
            <widgets.questions
                itemProps={{ skipped: isSectionSkipped(props.data) }}
            />
            {props.final && <GenerateButton label="Generate SVR" />}
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.questions>;
type BaseState = {
    questions: WidgetState<typeof Fields.questions>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "QUESTIONS";
    action: WidgetAction<typeof Fields.questions>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.questions, data.questions, cache, "questions", errors);
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
        case "QUESTIONS": {
            const inner = Fields.questions.reduce(
                state.questions,
                data.questions,
                action.action,
                subcontext
            );
            return {
                state: { ...state, questions: inner.state },
                data: { ...data, questions: inner.data },
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
    questions: function (
        props: WidgetExtraProps<typeof Fields.questions> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "QUESTIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "questions", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.questions.component
                state={context.state.questions}
                data={context.data.questions}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Questions"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: SITE_VISIT_REPORT_SECTION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let questionsState;
        {
            const inner = Fields.questions.initialize(
                data.questions,
                subcontext,
                subparameters.questions
            );
            questionsState = inner.state;
            data = { ...data, questions: inner.data };
        }
        let state = {
            initialParameters: parameters,
            questions: questionsState,
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
                <RecordContext
                    meta={SITE_VISIT_REPORT_SECTION_META}
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
    questions: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.questions>
    >;
};
// END MAGIC -- DO NOT EDIT
