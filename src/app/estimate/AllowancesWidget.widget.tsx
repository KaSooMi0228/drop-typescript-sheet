import Decimal from "decimal.js";
import * as React from "react";
import { Button, Table } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { newUUID } from "../../clay/uuid";
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
import { ListWidget } from "../../clay/widgets/ListWidget";
import { TABLE_STYLE } from "../styles";
import AllowanceWidget from "./allowances/AllowanceWidget.widget";
import { Estimate, ESTIMATE_META } from "./table";

export type Data = Estimate;

function actionAddAllowance(state: State, data: Estimate) {
    const NEW_ALLOWANCE = AllowanceWidget.initialize(
        {
            id: newUUID(),
            name: "",
            cost: new Decimal(0),
            markup: new Decimal(0),
            areas: [],
        },
        {}
    );
    return {
        data: {
            ...data,
            allowances: [...data.allowances, NEW_ALLOWANCE.data],
        },
        state: {
            ...state,
            allowances: {
                ...state.allowances,
                items: [...state.allowances.items, NEW_ALLOWANCE.state],
            },
        },
    };
}

export function initialize(
    data: Estimate,
    context: Context,
    parameters: string[] = []
) {
    return {
        state: {},
        data,
        parameters: {
            areas: parameters,
        },
    };
}

export const Fields = {
    allowances: Optional(ListWidget(AllowanceWidget)),
};

function Component(props: Props) {
    const onAddAllowance = React.useCallback(() => {
        props.dispatch({ type: "ADD_ALLOWANCE" });
    }, [props.dispatch]);
    return (
        <>
            <Table {...TABLE_STYLE}>
                <thead>
                    <tr>
                        <th />
                        <th>Name</th>
                        <th style={{ width: "180px" }}>Cost</th>
                        <th style={{ width: "180px" }}>Markup</th>
                        <th style={{ width: "180px" }}>Price</th>
                        <th>Areas</th>
                        <th />
                    </tr>
                </thead>
                <widgets.allowances containerClass="tbody" />
            </Table>
            <Button onClick={onAddAllowance}>Add Allowance</Button>
        </>
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

type BaseAction =
    | { type: "ALLOWANCES"; action: WidgetAction<typeof Fields.allowances> }
    | { type: "ADD_ALLOWANCE" };

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
        case "ADD_ALLOWANCE":
            return actionAddAllowance(state, data);
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
    dataMeta: ESTIMATE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        const result = initialize(data, context);
        data = result.data;
        let subparameters: Dictionary<string[]> =
            (result as any).parameters || {};
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
            ...result.state,
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
                <RecordContext meta={ESTIMATE_META} value={props.data}>
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
