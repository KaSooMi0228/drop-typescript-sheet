import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../clay/quick-cache";
import { Optional } from "../../clay/widgets/FormField";
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
import { MoneyStatic } from "../../clay/widgets/money-widget";
import {
    PercentageStatic,
    PercentageWidget,
} from "../../clay/widgets/percentage-widget";
import { ReactContext as ProjectWrapUpWidgetReactContext } from "../project/ProjectWrapUpWidget.widget";
import { QUOTATION_META } from "../quotation/table";
import {
    calcPayoutOptionAmount,
    calcPayoutOptionCertifiedForemanAmount,
    PayoutOption,
    PAYOUT_OPTION_META,
} from "./table";

export type Data = PayoutOption;

export const Fields = {
    completed: Optional(PercentageWidget),
};

function Component(props: Props) {
    const projectContext = React.useContext(ProjectWrapUpWidgetReactContext)!;
    const quotation = useQuickRecord(
        QUOTATION_META,
        props.data.quotations.length == 1 ? props.data.quotations[0] : null
    );
    return (
        <tr>
            <td>
                {props.data.description}
                {quotation &&
                    ` as per quotation ${
                        projectContext.data.projectNumber
                    }-${quotation.number.toString()}`}
            </td>
            <td style={{ textAlign: "center" }}>
                {props.data.number.isZero()
                    ? "N/A"
                    : props.data.number.toString()}
            </td>
            <td>
                <MoneyStatic value={calcPayoutOptionAmount(props.data)} />
            </td>
            <td>
                <MoneyStatic
                    value={calcPayoutOptionCertifiedForemanAmount(props.data)}
                />
            </td>
            <td>
                <PercentageStatic value={props.data.previous} />
            </td>
            <td>
                <widgets.completed readOnly />
            </td>
        </tr>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.completed>;
type ExtraProps = {};
type BaseState = {
    completed: WidgetState<typeof Fields.completed>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "COMPLETED";
    action: WidgetAction<typeof Fields.completed>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.completed, data.completed, cache, "completed", errors);
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
        case "COMPLETED": {
            const inner = Fields.completed.reduce(
                state.completed,
                data.completed,
                action.action,
                subcontext
            );
            return {
                state: { ...state, completed: inner.state },
                data: { ...data, completed: inner.data },
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
    completed: function (
        props: WidgetExtraProps<typeof Fields.completed> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMPLETED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "completed", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.completed.component
                state={context.state.completed}
                data={context.data.completed}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Completed"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PAYOUT_OPTION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let completedState;
        {
            const inner = Fields.completed.initialize(
                data.completed,
                subcontext,
                subparameters.completed
            );
            completedState = inner.state;
            data = { ...data, completed: inner.data };
        }
        let state = {
            initialParameters: parameters,
            completed: completedState,
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
                <RecordContext meta={PAYOUT_OPTION_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    completed: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.completed>
    >;
};
// END MAGIC -- DO NOT EDIT
