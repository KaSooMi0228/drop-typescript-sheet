import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { DecimalDefaultWidget } from "../../../clay/widgets/DecimalDefaultWidget";
import {
    RecordContext,
    RecordWidget,
    subStatus,
    subvalidate,
    useRecordContext,
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
import { ESTIMATE_META } from "../table";
import {
    EstimateAction,
    ESTIMATE_ACTION_META,
    resolveEstimateAction,
} from "./table";

export type Data = EstimateAction;

const Fields = {
    markup: DecimalDefaultWidget,
};

function Component(props: Props) {
    const resolvedEstimateAction = resolveEstimateAction(
        props.data,
        useRecordContext(ESTIMATE_META),
        true
    );
    return (
        <widgets.markup
            percentage
            defaultData={resolvedEstimateAction.markups.hours}
        />
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.markup>;
type ExtraProps = {};
type BaseState = {
    markup: WidgetState<typeof Fields.markup>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "MARKUP";
    action: WidgetAction<typeof Fields.markup>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.markup, data.markup, cache, "markup", errors);
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
        case "MARKUP": {
            const inner = Fields.markup.reduce(
                state.markup,
                data.markup,
                action.action,
                subcontext
            );
            return {
                state: { ...state, markup: inner.state },
                data: { ...data, markup: inner.data },
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
    markup: function (
        props: WidgetExtraProps<typeof Fields.markup> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MARKUP",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "markup", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.markup.component
                state={context.state.markup}
                data={context.data.markup}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Markup"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ESTIMATE_ACTION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let markupState;
        {
            const inner = Fields.markup.initialize(
                data.markup,
                subcontext,
                subparameters.markup
            );
            markupState = inner.state;
            data = { ...data, markup: inner.data };
        }
        let state = {
            initialParameters: parameters,
            markup: markupState,
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
                <RecordContext meta={ESTIMATE_ACTION_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    markup: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.markup>
    >;
};
// END MAGIC -- DO NOT EDIT
