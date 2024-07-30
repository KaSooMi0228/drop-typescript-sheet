import * as React from "react";
import { Table } from "react-bootstrap";
import ReactSwitch from "react-switch";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../../clay/quick-cache";
import { Optional } from "../../../clay/widgets/FormField";
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
import { LinkSetWidget } from "../../../clay/widgets/link-set-widget";
import { FINISH_SCHEDULE_LINE_META, PROJECT_META } from "../../project/table";
import {
    WarrantyReviewDetailSheet,
    WARRANTY_REVIEW_DETAIL_SHEET_META,
    WARRANTY_REVIEW_META,
} from "../table";

type Data = WarrantyReviewDetailSheet;

const Fields = {
    highlightedFinishSchedules: Optional(
        LinkSetWidget({
            meta: FINISH_SCHEDULE_LINE_META,
            name: (line) => line.substrate,
        })
    ),
};

function Component(props: Props) {
    const warrantyReview = useRecordContext(WARRANTY_REVIEW_META);
    const project = useQuickRecord(PROJECT_META, warrantyReview?.project);

    return (
        <Table>
            <thead>
                <tr>
                    <th>Substrate</th>
                    <th>Product</th>
                    <th>Color Formula</th>
                    <th>Highlight</th>
                </tr>
            </thead>
            {project && (
                <tbody>
                    {project.finishScheduleLines.map((line) => (
                        <tr>
                            <td>{line.substrate}</td>
                            <td>{line.productName}</td>
                            <td>{line.colourFormula}</td>
                            <td>
                                <ReactSwitch
                                    checked={
                                        props.data.highlightedFinishSchedules.indexOf(
                                            line.id.uuid
                                        ) != -1
                                    }
                                    disabled={!props.status.mutable}
                                    onChange={(value) => {
                                        props.dispatch({
                                            type: "HIGHLIGHTED_FINISH_SCHEDULES",
                                            action: {
                                                type: "SET",
                                                value: value
                                                    ? [
                                                          ...props.data
                                                              .highlightedFinishSchedules,
                                                          line.id.uuid,
                                                      ]
                                                    : props.data.highlightedFinishSchedules.filter(
                                                          (x) =>
                                                              x != line.id.uuid
                                                      ),
                                            },
                                        });
                                    }}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            )}
        </Table>
    );

    return <></>;
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.highlightedFinishSchedules>;
type ExtraProps = {};
type BaseState = {
    highlightedFinishSchedules: WidgetState<
        typeof Fields.highlightedFinishSchedules
    >;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "HIGHLIGHTED_FINISH_SCHEDULES";
    action: WidgetAction<typeof Fields.highlightedFinishSchedules>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.highlightedFinishSchedules,
        data.highlightedFinishSchedules,
        cache,
        "highlightedFinishSchedules",
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
        case "HIGHLIGHTED_FINISH_SCHEDULES": {
            const inner = Fields.highlightedFinishSchedules.reduce(
                state.highlightedFinishSchedules,
                data.highlightedFinishSchedules,
                action.action,
                subcontext
            );
            return {
                state: { ...state, highlightedFinishSchedules: inner.state },
                data: { ...data, highlightedFinishSchedules: inner.data },
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
    highlightedFinishSchedules: function (
        props: WidgetExtraProps<typeof Fields.highlightedFinishSchedules> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "HIGHLIGHTED_FINISH_SCHEDULES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "highlightedFinishSchedules",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.highlightedFinishSchedules.component
                state={context.state.highlightedFinishSchedules}
                data={context.data.highlightedFinishSchedules}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Highlighted Finish Schedules"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WARRANTY_REVIEW_DETAIL_SHEET_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let highlightedFinishSchedulesState;
        {
            const inner = Fields.highlightedFinishSchedules.initialize(
                data.highlightedFinishSchedules,
                subcontext,
                subparameters.highlightedFinishSchedules
            );
            highlightedFinishSchedulesState = inner.state;
            data = { ...data, highlightedFinishSchedules: inner.data };
        }
        let state = {
            initialParameters: parameters,
            highlightedFinishSchedules: highlightedFinishSchedulesState,
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
                    meta={WARRANTY_REVIEW_DETAIL_SHEET_META}
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
    highlightedFinishSchedules: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.highlightedFinishSchedules>
    >;
};
// END MAGIC -- DO NOT EDIT
