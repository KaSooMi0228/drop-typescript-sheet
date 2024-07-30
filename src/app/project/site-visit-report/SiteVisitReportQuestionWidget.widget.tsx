import React from "react";
import { Form } from "react-bootstrap";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { DropdownLinkWidget } from "../../../clay/widgets/dropdown-link-widget";
import { FormWrapper } from "../../../clay/widgets/FormField";
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
import { TextAreaWidget } from "../../../clay/widgets/TextAreaWidget";
import { SURVEY_ANSWER_META } from "../../project-description/table";
import {
    SiteVisitReportQuestion,
    SITE_VISIT_REPORT_QUESTION_META,
} from "./table";

export type Data = SiteVisitReportQuestion;

export type ExtraProps = {
    skipped: boolean;
};

export const Fields = {
    comment: TextAreaWidget,
    selectedAnswer: DropdownLinkWidget({
        meta: SURVEY_ANSWER_META,
        label: (answer) => answer.name,
    }),
};

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);
    if (data.selectedAnswer === data.answers[0]?.id?.uuid) {
        return errors.filter((error) => error.field !== "comment");
    } else {
        return errors;
    }
}

function Component(props: Props) {
    return (
        <>
            <FormWrapper label={props.data.question}>
                {props.data.answers.map((answer) => (
                    <Form.Check
                        type="radio"
                        id={answer.id.uuid}
                        label={
                            <span style={{ fontWeight: "normal" }}>
                                {answer.name}{" "}
                                {answer.score && (
                                    <b>({answer.score?.toString()})</b>
                                )}
                            </span>
                        }
                        checked={answer.id.uuid == props.data.selectedAnswer}
                        disabled={
                            !props.status.mutable ||
                            (props.skipped && !props.data.controlsSection)
                        }
                        onClick={() => {
                            props.dispatch({
                                type: "SELECTED_ANSWER",
                                action: {
                                    type: "SET",
                                    value: answer,
                                },
                            });
                        }}
                    />
                ))}
                <widgets.comment
                    style={{ marginTop: "1em" }}
                    readOnly={props.skipped && !props.data.controlsSection}
                />
            </FormWrapper>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.comment> &
    WidgetContext<typeof Fields.selectedAnswer>;
type BaseState = {
    comment: WidgetState<typeof Fields.comment>;
    selectedAnswer: WidgetState<typeof Fields.selectedAnswer>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "COMMENT"; action: WidgetAction<typeof Fields.comment> }
    | {
          type: "SELECTED_ANSWER";
          action: WidgetAction<typeof Fields.selectedAnswer>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.comment, data.comment, cache, "comment", errors);
    subvalidate(
        Fields.selectedAnswer,
        data.selectedAnswer,
        cache,
        "selectedAnswer",
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
        case "COMMENT": {
            const inner = Fields.comment.reduce(
                state.comment,
                data.comment,
                action.action,
                subcontext
            );
            return {
                state: { ...state, comment: inner.state },
                data: { ...data, comment: inner.data },
            };
        }
        case "SELECTED_ANSWER": {
            const inner = Fields.selectedAnswer.reduce(
                state.selectedAnswer,
                data.selectedAnswer,
                action.action,
                subcontext
            );
            return {
                state: { ...state, selectedAnswer: inner.state },
                data: { ...data, selectedAnswer: inner.data },
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
    comment: function (
        props: WidgetExtraProps<typeof Fields.comment> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMMENT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "comment", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.comment.component
                state={context.state.comment}
                data={context.data.comment}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Comment"}
            />
        );
    },
    selectedAnswer: function (
        props: WidgetExtraProps<typeof Fields.selectedAnswer> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SELECTED_ANSWER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "selectedAnswer", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.selectedAnswer.component
                state={context.state.selectedAnswer}
                data={context.data.selectedAnswer}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Selected Answer"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: SITE_VISIT_REPORT_QUESTION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let commentState;
        {
            const inner = Fields.comment.initialize(
                data.comment,
                subcontext,
                subparameters.comment
            );
            commentState = inner.state;
            data = { ...data, comment: inner.data };
        }
        let selectedAnswerState;
        {
            const inner = Fields.selectedAnswer.initialize(
                data.selectedAnswer,
                subcontext,
                subparameters.selectedAnswer
            );
            selectedAnswerState = inner.state;
            data = { ...data, selectedAnswer: inner.data };
        }
        let state = {
            initialParameters: parameters,
            comment: commentState,
            selectedAnswer: selectedAnswerState,
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
                    meta={SITE_VISIT_REPORT_QUESTION_META}
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
    comment: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.comment>
    >;
    selectedAnswer: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.selectedAnswer>
    >;
};
// END MAGIC -- DO NOT EDIT
