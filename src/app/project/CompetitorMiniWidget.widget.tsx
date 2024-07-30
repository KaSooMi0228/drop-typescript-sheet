import React from "react";
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
import { TableRow } from "../../clay/widgets/TableRow";
import { CompetitorDetail, COMPETITOR_DETAIL_META } from "./table";
import { CompetitorLinkWidget } from "./types/link";

export type Data = CompetitorDetail;
export const Fields = {
    competitor: CompetitorLinkWidget,
};

function Component(props: Props) {
    return (
        <TableRow flexSizes>
            <widgets.competitor />
        </TableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.competitor>;
type ExtraProps = {};
type BaseState = {
    competitor: WidgetState<typeof Fields.competitor>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "COMPETITOR";
    action: WidgetAction<typeof Fields.competitor>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.competitor,
        data.competitor,
        cache,
        "competitor",
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
        case "COMPETITOR": {
            const inner = Fields.competitor.reduce(
                state.competitor,
                data.competitor,
                action.action,
                subcontext
            );
            return {
                state: { ...state, competitor: inner.state },
                data: { ...data, competitor: inner.data },
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
    competitor: function (
        props: WidgetExtraProps<typeof Fields.competitor> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMPETITOR",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "competitor", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.competitor.component
                state={context.state.competitor}
                data={context.data.competitor}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Competitor"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: COMPETITOR_DETAIL_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let competitorState;
        {
            const inner = Fields.competitor.initialize(
                data.competitor,
                subcontext,
                subparameters.competitor
            );
            competitorState = inner.state;
            data = { ...data, competitor: inner.data };
        }
        let state = {
            initialParameters: parameters,
            competitor: competitorState,
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
                <RecordContext meta={COMPETITOR_DETAIL_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    competitor: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.competitor>
    >;
};
// END MAGIC -- DO NOT EDIT
