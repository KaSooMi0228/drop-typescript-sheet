import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
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
import { SelectWidget } from "../../clay/widgets/SelectWidget";
import { BaseTableRow } from "../../clay/widgets/TableRow";
import { TextAreaWidget } from "../../clay/widgets/TextAreaWidget";
import {
    WarrantyReviewInspectionItem,
    WARRANTY_REVIEW_INSPECTION_ITEM_META,
} from "./table";

export type Data = WarrantyReviewInspectionItem;

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);
    if (data.evaluation !== "Requires Attention") {
        return errors.filter((error) => error.field != "notes");
    } else {
        return errors;
    }
}

export const Fields = {
    evaluation: SelectWidget([
        {
            value: "Good" as const,
            label: "Good",
        },
        {
            value: "Requires Attention" as const,
            label: "Requires Attention",
        },
        {
            value: "N/A" as const,
            label: "N/A",
        },
    ]),
    notes: TextAreaWidget,
};

export function Component(props: Props) {
    const [base, extra] = React.useMemo(() => {
        const match = /([^\(]+)\(([^)]+)\)/.exec(props.data.name);
        if (match) {
            return [match[1], match[2]];
        } else {
            return [props.data.name, ""];
        }
    }, [props.data.name]);
    return (
        <BaseTableRow>
            <td>{base}</td>
            <td>{extra}</td>
            <td>
                <widgets.evaluation />
            </td>
            <td>
                <widgets.notes />
            </td>
        </BaseTableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.evaluation> &
    WidgetContext<typeof Fields.notes>;
type ExtraProps = {};
type BaseState = {
    evaluation: WidgetState<typeof Fields.evaluation>;
    notes: WidgetState<typeof Fields.notes>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "EVALUATION"; action: WidgetAction<typeof Fields.evaluation> }
    | { type: "NOTES"; action: WidgetAction<typeof Fields.notes> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.evaluation,
        data.evaluation,
        cache,
        "evaluation",
        errors
    );
    subvalidate(Fields.notes, data.notes, cache, "notes", errors);
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
        case "EVALUATION": {
            const inner = Fields.evaluation.reduce(
                state.evaluation,
                data.evaluation,
                action.action,
                subcontext
            );
            return {
                state: { ...state, evaluation: inner.state },
                data: { ...data, evaluation: inner.data },
            };
        }
        case "NOTES": {
            const inner = Fields.notes.reduce(
                state.notes,
                data.notes,
                action.action,
                subcontext
            );
            return {
                state: { ...state, notes: inner.state },
                data: { ...data, notes: inner.data },
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
    evaluation: function (
        props: WidgetExtraProps<typeof Fields.evaluation> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "EVALUATION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "evaluation", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.evaluation.component
                state={context.state.evaluation}
                data={context.data.evaluation}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Evaluation"}
            />
        );
    },
    notes: function (
        props: WidgetExtraProps<typeof Fields.notes> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "NOTES", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "notes", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.notes.component
                state={context.state.notes}
                data={context.data.notes}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Notes"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WARRANTY_REVIEW_INSPECTION_ITEM_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let evaluationState;
        {
            const inner = Fields.evaluation.initialize(
                data.evaluation,
                subcontext,
                subparameters.evaluation
            );
            evaluationState = inner.state;
            data = { ...data, evaluation: inner.data };
        }
        let notesState;
        {
            const inner = Fields.notes.initialize(
                data.notes,
                subcontext,
                subparameters.notes
            );
            notesState = inner.state;
            data = { ...data, notes: inner.data };
        }
        let state = {
            initialParameters: parameters,
            evaluation: evaluationState,
            notes: notesState,
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
                    meta={WARRANTY_REVIEW_INSPECTION_ITEM_META}
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
    evaluation: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.evaluation>
    >;
    notes: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.notes>
    >;
};
// END MAGIC -- DO NOT EDIT
