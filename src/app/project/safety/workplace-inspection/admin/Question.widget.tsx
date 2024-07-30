import * as React from "react";
import { Dictionary } from "../../../../../clay/common";
import { propCheck } from "../../../../../clay/propCheck";
import { QuickCacheApi } from "../../../../../clay/quick-cache";
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
import { TableRow } from "../../../../../clay/widgets/TableRow";
import { TextWidget } from "../../../../../clay/widgets/TextWidget";
import {
    WorkplaceInspectionTemplateQuestion,
    WORKPLACE_INSPECTION_TEMPLATE_QUESTION_META,
} from "./table";

export type Data = WorkplaceInspectionTemplateQuestion;

const Fields = {
    question: TextWidget,
};

function Component(props: Props) {
    return (
        <TableRow>
            <widgets.question />
        </TableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.question>;
type ExtraProps = {};
type BaseState = {
    question: WidgetState<typeof Fields.question>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "QUESTION";
    action: WidgetAction<typeof Fields.question>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.question, data.question, cache, "question", errors);
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WORKPLACE_INSPECTION_TEMPLATE_QUESTION_META,
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
        let state = {
            initialParameters: parameters,
            question: questionState,
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
                    meta={WORKPLACE_INSPECTION_TEMPLATE_QUESTION_META}
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
    question: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.question>
    >;
};
// END MAGIC -- DO NOT EDIT
