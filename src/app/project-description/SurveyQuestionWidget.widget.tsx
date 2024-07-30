import * as React from "react";
import { Table } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { RemoveButton } from "../../clay/remove-button";
import { FormField, FormWrapper } from "../../clay/widgets/FormField";
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
import { FieldRow } from "../../clay/widgets/layout";
import { ListWidget, useListItemContext } from "../../clay/widgets/ListWidget";
import { SwitchWidget } from "../../clay/widgets/SwitchWidget";
import { TextAreaWidget } from "../../clay/widgets/TextAreaWidget";
import { TABLE_STYLE } from "../styles";
import SurveyAnswerWidget from "./SurveyAnswerWidget.widget";
import { SurveyQuestion, SURVEY_QUESTION_META } from "./table";

export type Data = SurveyQuestion;

export const Fields = {
    question: FormField(TextAreaWidget),
    scale1to10: FormField(SwitchWidget),
    sendToCustomer: FormField(SwitchWidget),
    controlsSection: FormField(SwitchWidget),
    answers: ListWidget(SurveyAnswerWidget, { emptyOk: true }),
};

function Component(props: Props) {
    const listItemContext = useListItemContext();
    return (
        <div {...listItemContext.draggableProps}>
            <FieldRow noExpand>
                {listItemContext.dragHandle}
                <div style={{ flexGrow: 1 }}>
                    <widgets.question />
                </div>
                <widgets.scale1to10 />
                <div className="special-buttons">
                    <widgets.sendToCustomer />
                    <widgets.controlsSection />
                </div>
                <FormWrapper label=" ">
                    <RemoveButton />
                </FormWrapper>
            </FieldRow>
            <div
                style={{
                    marginLeft: "2em",
                }}
            >
                <Table {...TABLE_STYLE}>
                    <widgets.answers extraItemForAdd />
                </Table>
            </div>
        </div>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.question> &
    WidgetContext<typeof Fields.scale1to10> &
    WidgetContext<typeof Fields.sendToCustomer> &
    WidgetContext<typeof Fields.controlsSection> &
    WidgetContext<typeof Fields.answers>;
type ExtraProps = {};
type BaseState = {
    question: WidgetState<typeof Fields.question>;
    scale1to10: WidgetState<typeof Fields.scale1to10>;
    sendToCustomer: WidgetState<typeof Fields.sendToCustomer>;
    controlsSection: WidgetState<typeof Fields.controlsSection>;
    answers: WidgetState<typeof Fields.answers>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "QUESTION"; action: WidgetAction<typeof Fields.question> }
    | { type: "SCALE1TO10"; action: WidgetAction<typeof Fields.scale1to10> }
    | {
          type: "SEND_TO_CUSTOMER";
          action: WidgetAction<typeof Fields.sendToCustomer>;
      }
    | {
          type: "CONTROLS_SECTION";
          action: WidgetAction<typeof Fields.controlsSection>;
      }
    | { type: "ANSWERS"; action: WidgetAction<typeof Fields.answers> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.question, data.question, cache, "question", errors);
    subvalidate(
        Fields.scale1to10,
        data.scale1to10,
        cache,
        "scale1to10",
        errors
    );
    subvalidate(
        Fields.sendToCustomer,
        data.sendToCustomer,
        cache,
        "sendToCustomer",
        errors
    );
    subvalidate(
        Fields.controlsSection,
        data.controlsSection,
        cache,
        "controlsSection",
        errors
    );
    subvalidate(Fields.answers, data.answers, cache, "answers", errors);
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
        case "QUESTION": {
            const inner = Fields.question.reduce(
                state.question,
                data.question,
                action.action,
                subcontext
            );
            return {
                state: { ...state, question: inner.state },
                data: { ...data, question: inner.data },
            };
        }
        case "SCALE1TO10": {
            const inner = Fields.scale1to10.reduce(
                state.scale1to10,
                data.scale1to10,
                action.action,
                subcontext
            );
            return {
                state: { ...state, scale1to10: inner.state },
                data: { ...data, scale1to10: inner.data },
            };
        }
        case "SEND_TO_CUSTOMER": {
            const inner = Fields.sendToCustomer.reduce(
                state.sendToCustomer,
                data.sendToCustomer,
                action.action,
                subcontext
            );
            return {
                state: { ...state, sendToCustomer: inner.state },
                data: { ...data, sendToCustomer: inner.data },
            };
        }
        case "CONTROLS_SECTION": {
            const inner = Fields.controlsSection.reduce(
                state.controlsSection,
                data.controlsSection,
                action.action,
                subcontext
            );
            return {
                state: { ...state, controlsSection: inner.state },
                data: { ...data, controlsSection: inner.data },
            };
        }
        case "ANSWERS": {
            const inner = Fields.answers.reduce(
                state.answers,
                data.answers,
                action.action,
                subcontext
            );
            return {
                state: { ...state, answers: inner.state },
                data: { ...data, answers: inner.data },
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
    question: function (
        props: WidgetExtraProps<typeof Fields.question> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "QUESTION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "question", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.question.component
                state={context.state.question}
                data={context.data.question}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Question"}
            />
        );
    },
    scale1to10: function (
        props: WidgetExtraProps<typeof Fields.scale1to10> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SCALE1TO10",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "scale1to10", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.scale1to10.component
                state={context.state.scale1to10}
                data={context.data.scale1to10}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Scale1to10"}
            />
        );
    },
    sendToCustomer: function (
        props: WidgetExtraProps<typeof Fields.sendToCustomer> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SEND_TO_CUSTOMER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "sendToCustomer", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.sendToCustomer.component
                state={context.state.sendToCustomer}
                data={context.data.sendToCustomer}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Send to Customer"}
            />
        );
    },
    controlsSection: function (
        props: WidgetExtraProps<typeof Fields.controlsSection> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTROLS_SECTION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "controlsSection", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.controlsSection.component
                state={context.state.controlsSection}
                data={context.data.controlsSection}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Controls Section"}
            />
        );
    },
    answers: function (
        props: WidgetExtraProps<typeof Fields.answers> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ANSWERS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "answers", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.answers.component
                state={context.state.answers}
                data={context.data.answers}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Answers"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: SURVEY_QUESTION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let questionState;
        {
            const inner = Fields.question.initialize(
                data.question,
                subcontext,
                subparameters.question
            );
            questionState = inner.state;
            data = { ...data, question: inner.data };
        }
        let scale1to10State;
        {
            const inner = Fields.scale1to10.initialize(
                data.scale1to10,
                subcontext,
                subparameters.scale1to10
            );
            scale1to10State = inner.state;
            data = { ...data, scale1to10: inner.data };
        }
        let sendToCustomerState;
        {
            const inner = Fields.sendToCustomer.initialize(
                data.sendToCustomer,
                subcontext,
                subparameters.sendToCustomer
            );
            sendToCustomerState = inner.state;
            data = { ...data, sendToCustomer: inner.data };
        }
        let controlsSectionState;
        {
            const inner = Fields.controlsSection.initialize(
                data.controlsSection,
                subcontext,
                subparameters.controlsSection
            );
            controlsSectionState = inner.state;
            data = { ...data, controlsSection: inner.data };
        }
        let answersState;
        {
            const inner = Fields.answers.initialize(
                data.answers,
                subcontext,
                subparameters.answers
            );
            answersState = inner.state;
            data = { ...data, answers: inner.data };
        }
        let state = {
            initialParameters: parameters,
            question: questionState,
            scale1to10: scale1to10State,
            sendToCustomer: sendToCustomerState,
            controlsSection: controlsSectionState,
            answers: answersState,
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
                <RecordContext meta={SURVEY_QUESTION_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    question: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.question>
    >;
    scale1to10: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.scale1to10>
    >;
    sendToCustomer: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.sendToCustomer>
    >;
    controlsSection: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.controlsSection>
    >;
    answers: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.answers>
    >;
};
// END MAGIC -- DO NOT EDIT
