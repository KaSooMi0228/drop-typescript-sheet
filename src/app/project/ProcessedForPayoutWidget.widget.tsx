import * as React from "react";
import { useProjectRecordQuery } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { Optional } from "../../clay/widgets/FormField";
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
} from "../../clay/widgets/index";
import { SelectLinkWidget } from "../../clay/widgets/SelectLinkWidget";
import { TableRow } from "../../clay/widgets/TableRow";
import { PAYOUT_META } from "../payout/table";
import UserAndDateWidget from "../user-and-date/UserAndDateWidget.widget";
import {
    ProcessedForPayout,
    PROCESSED_FOR_PAYOUT_META,
    PROJECT_META,
} from "./table";

export type Data = ProcessedForPayout;

export const Fields = {
    processed: UserAndDateWidget,
    payout: Optional(
        SelectLinkWidget({
            meta: PAYOUT_META,
            label: (payout) => payout.number.toString(),
        })
    ),
};

export function Component(props: Props) {
    const project = useRecordContext(PROJECT_META);
    const payouts = useProjectRecordQuery(PAYOUT_META, project.id.uuid);

    return (
        <TableRow>
            <td>
                <widgets.processed />
            </td>
            <td>
                <widgets.payout records={payouts || []} />
            </td>
        </TableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.processed> &
    WidgetContext<typeof Fields.payout>;
type ExtraProps = {};
type BaseState = {
    processed: WidgetState<typeof Fields.processed>;
    payout: WidgetState<typeof Fields.payout>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "PROCESSED"; action: WidgetAction<typeof Fields.processed> }
    | { type: "PAYOUT"; action: WidgetAction<typeof Fields.payout> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.processed, data.processed, cache, "processed", errors);
    subvalidate(Fields.payout, data.payout, cache, "payout", errors);
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
        case "PROCESSED": {
            const inner = Fields.processed.reduce(
                state.processed,
                data.processed,
                action.action,
                subcontext
            );
            return {
                state: { ...state, processed: inner.state },
                data: { ...data, processed: inner.data },
            };
        }
        case "PAYOUT": {
            const inner = Fields.payout.reduce(
                state.payout,
                data.payout,
                action.action,
                subcontext
            );
            return {
                state: { ...state, payout: inner.state },
                data: { ...data, payout: inner.data },
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
    processed: function (
        props: WidgetExtraProps<typeof Fields.processed> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROCESSED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "processed", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.processed.component
                state={context.state.processed}
                data={context.data.processed}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Processed"}
            />
        );
    },
    payout: function (
        props: WidgetExtraProps<typeof Fields.payout> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PAYOUT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "payout", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.payout.component
                state={context.state.payout}
                data={context.data.payout}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Payout"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PROCESSED_FOR_PAYOUT_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let processedState;
        {
            const inner = Fields.processed.initialize(
                data.processed,
                subcontext,
                subparameters.processed
            );
            processedState = inner.state;
            data = { ...data, processed: inner.data };
        }
        let payoutState;
        {
            const inner = Fields.payout.initialize(
                data.payout,
                subcontext,
                subparameters.payout
            );
            payoutState = inner.state;
            data = { ...data, payout: inner.data };
        }
        let state = {
            initialParameters: parameters,
            processed: processedState,
            payout: payoutState,
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
                    meta={PROCESSED_FOR_PAYOUT_META}
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
    processed: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.processed>
    >;
    payout: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.payout>
    >;
};
// END MAGIC -- DO NOT EDIT
