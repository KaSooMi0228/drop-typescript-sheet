import React from "react";
import { Table } from "react-bootstrap";
import { Dictionary } from "../../../clay/common";
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
import { ListWidget } from "../../../clay/widgets/ListWidget";
import { TABLE_STYLE } from "../../styles";
import FinishScheduleWidget from "./FinishScheduleWidget.widget";
import { DetailSheetOption, DETAIL_SHEET_OPTION_META } from "./table";

export type Data = DetailSheetOption;

const Fields = {
    finishSchedule: ListWidget(FinishScheduleWidget, { emptyOk: true }),
};

function Component(props: Props) {
    return (
        <Table {...TABLE_STYLE}>
            <thead>
                <tr>
                    <th />
                    <th>Name</th>
                    <th>Finish Schedule</th>
                    <th colSpan={2}>Application</th>
                    <th>Colour</th>
                </tr>
            </thead>
            <widgets.finishSchedule containerClass="tbody" extraItemForAdd />
        </Table>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.finishSchedule>;
type ExtraProps = {};
type BaseState = {
    finishSchedule: WidgetState<typeof Fields.finishSchedule>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "FINISH_SCHEDULE";
    action: WidgetAction<typeof Fields.finishSchedule>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.finishSchedule,
        data.finishSchedule,
        cache,
        "finishSchedule",
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
        case "FINISH_SCHEDULE": {
            const inner = Fields.finishSchedule.reduce(
                state.finishSchedule,
                data.finishSchedule,
                action.action,
                subcontext
            );
            return {
                state: { ...state, finishSchedule: inner.state },
                data: { ...data, finishSchedule: inner.data },
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
    finishSchedule: function (
        props: WidgetExtraProps<typeof Fields.finishSchedule> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "FINISH_SCHEDULE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "finishSchedule", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.finishSchedule.component
                state={context.state.finishSchedule}
                data={context.data.finishSchedule}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Finish Schedule"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: DETAIL_SHEET_OPTION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let finishScheduleState;
        {
            const inner = Fields.finishSchedule.initialize(
                data.finishSchedule,
                subcontext,
                subparameters.finishSchedule
            );
            finishScheduleState = inner.state;
            data = { ...data, finishSchedule: inner.data };
        }
        let state = {
            initialParameters: parameters,
            finishSchedule: finishScheduleState,
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
                    meta={DETAIL_SHEET_OPTION_META}
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
    finishSchedule: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.finishSchedule>
    >;
};
// END MAGIC -- DO NOT EDIT
