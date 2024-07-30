import React from "react";
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
import { TABLE_LEFT_STYLE } from "../../styles";
import AllowanceWidget from "./AllowanceWidget.widget";
import { DetailSheetOption, DETAIL_SHEET_OPTION_META } from "./table";

export type Data = DetailSheetOption;

const Fields = {
    allowances: ListWidget(AllowanceWidget, { emptyOk: true }),
};

function Component(props: Props) {
    return (
        <table {...TABLE_LEFT_STYLE}>
            <thead>
                <tr>
                    <th style={{ width: "1em" }} />
                    <th>Allowance</th>
                    <th style={{ width: "10em", textAlign: "center" }}>Cost</th>
                </tr>
            </thead>
            <widgets.allowances containerClass="tbody" extraItemForAdd />
        </table>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.allowances>;
type ExtraProps = {};
type BaseState = {
    allowances: WidgetState<typeof Fields.allowances>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "ALLOWANCES";
    action: WidgetAction<typeof Fields.allowances>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.allowances,
        data.allowances,
        cache,
        "allowances",
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
        case "ALLOWANCES": {
            const inner = Fields.allowances.reduce(
                state.allowances,
                data.allowances,
                action.action,
                subcontext
            );
            return {
                state: { ...state, allowances: inner.state },
                data: { ...data, allowances: inner.data },
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
    allowances: function (
        props: WidgetExtraProps<typeof Fields.allowances> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ALLOWANCES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "allowances", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.allowances.component
                state={context.state.allowances}
                data={context.data.allowances}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Allowances"}
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
        let allowancesState;
        {
            const inner = Fields.allowances.initialize(
                data.allowances,
                subcontext,
                subparameters.allowances
            );
            allowancesState = inner.state;
            data = { ...data, allowances: inner.data };
        }
        let state = {
            initialParameters: parameters,
            allowances: allowancesState,
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
    allowances: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.allowances>
    >;
};
// END MAGIC -- DO NOT EDIT
