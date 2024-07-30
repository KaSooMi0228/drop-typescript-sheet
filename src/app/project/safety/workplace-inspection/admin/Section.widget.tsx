import * as React from "react";
import { Table } from "react-bootstrap";
import { Dictionary } from "../../../../../clay/common";
import { propCheck } from "../../../../../clay/propCheck";
import { QuickCacheApi } from "../../../../../clay/quick-cache";
import { FormField } from "../../../../../clay/widgets/FormField";
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
import { ListWidget } from "../../../../../clay/widgets/ListWidget";
import { TextWidget } from "../../../../../clay/widgets/TextWidget";
import QuestionWidget from "./Question.widget";
import {
    WorkplaceInspectionTemplateSection,
    WORKPLACE_INSPECTION_TEMPLATE_SECTION_META,
} from "./table";

type Data = WorkplaceInspectionTemplateSection;

const Fields = {
    name: FormField(TextWidget),
    questions: ListWidget(QuestionWidget),
};

function Component(props: Props) {
    return (
        <>
            <Table>
                <widgets.questions containerClass="tbody" extraItemForAdd />
            </Table>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.questions>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    questions: WidgetState<typeof Fields.questions>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "QUESTIONS"; action: WidgetAction<typeof Fields.questions> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
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
    dataMeta: WORKPLACE_INSPECTION_TEMPLATE_SECTION_META,
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
            name: nameState,
            questions: questionsState,
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
                    meta={WORKPLACE_INSPECTION_TEMPLATE_SECTION_META}
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
    questions: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.questions>
    >;
};
// END MAGIC -- DO NOT EDIT
