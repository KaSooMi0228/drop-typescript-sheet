import React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { FormField, Optional } from "../../../clay/widgets/FormField";
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
import { MoneyStatic } from "../../../clay/widgets/money-widget";
import { QuantityStatic } from "../../../clay/widgets/number-widget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { TABLE_STYLE } from "../../styles";
import BudgetLineWidget from "./BudgetLineWidget.widget";
import {
    calcDetailSheetOptionHoursTotal,
    calcDetailSheetOptionMaterialsTotal,
    calcDetailSheetOptionOverallTotal,
    DetailSheetOption,
    DETAIL_SHEET_OPTION_META,
} from "./table";

export type Data = DetailSheetOption;

const Fields = {
    name: Optional(TextWidget),
    description: FormField(TextWidget),
    budget: ListWidget(BudgetLineWidget, {
        merge(state, data, incomingState, incomingData) {
            return {
                state,
                data: {
                    ...data,
                    hours: data.hours.plus(incomingData.hours),
                    materials: data.materials.plus(incomingData.materials),
                },
            };
        },
        emptyOk: true,
    }),
};

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);
    if (data.description.indexOf(" as per scope ") !== -1) {
        return [
            ...errors,
            {
                field: "description",
                invalid: true,
                empty: false,
            },
        ];
    }
    return errors;
}

function Component(props: Props) {
    return (
        <>
            <widgets.description />
            <table {...TABLE_STYLE}>
                <thead>
                    <tr>
                        <th style={{ width: "1em" }} />
                        <th style={{ width: "20em" }}>Name</th>
                        <th style={{ width: "7em" }}>Hours</th>
                        <th style={{ width: "7em" }}>Materials</th>
                        <th style={{ width: "9em" }}>Hourly Rate</th>
                        <th style={{ width: "8em" }}>Materials Rate</th>
                        <th style={{ width: "9em" }}>Total</th>
                        <th style={{ width: "1em" }} />
                    </tr>
                </thead>
                <widgets.budget containerClass="tbody" extraItemForAdd />
                <tfoot>
                    <tr style={{ height: "1em" }} />
                    <tr
                        style={{
                            height: "1em",
                            borderTop: "solid 4px black",
                        }}
                    >
                        <td colSpan={5}></td>
                    </tr>
                    <tr>
                        <th />
                        <th>Total</th>
                        <th>
                            <QuantityStatic
                                style={{
                                    fontWeight: "bold",
                                }}
                                value={calcDetailSheetOptionHoursTotal(
                                    props.data
                                )}
                            />
                        </th>
                        <th>
                            <QuantityStatic
                                style={{
                                    fontWeight: "bold",
                                }}
                                value={calcDetailSheetOptionMaterialsTotal(
                                    props.data
                                )}
                            />
                        </th>
                        <th />
                        <th />
                        <th>
                            <MoneyStatic
                                style={{ fontWeight: "bold" }}
                                value={calcDetailSheetOptionOverallTotal(
                                    props.data
                                )}
                            />
                        </th>
                    </tr>
                </tfoot>
            </table>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.description> &
    WidgetContext<typeof Fields.budget>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    description: WidgetState<typeof Fields.description>;
    budget: WidgetState<typeof Fields.budget>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "DESCRIPTION"; action: WidgetAction<typeof Fields.description> }
    | { type: "BUDGET"; action: WidgetAction<typeof Fields.budget> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(
        Fields.description,
        data.description,
        cache,
        "description",
        errors
    );
    subvalidate(Fields.budget, data.budget, cache, "budget", errors);
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
        case "NAME": {
            const inner = Fields.name.reduce(
                state.name,
                data.name,
                action.action,
                subcontext
            );
            return {
                state: { ...state, name: inner.state },
                data: { ...data, name: inner.data },
            };
        }
        case "DESCRIPTION": {
            const inner = Fields.description.reduce(
                state.description,
                data.description,
                action.action,
                subcontext
            );
            return {
                state: { ...state, description: inner.state },
                data: { ...data, description: inner.data },
            };
        }
        case "BUDGET": {
            const inner = Fields.budget.reduce(
                state.budget,
                data.budget,
                action.action,
                subcontext
            );
            return {
                state: { ...state, budget: inner.state },
                data: { ...data, budget: inner.data },
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
    name: function (
        props: WidgetExtraProps<typeof Fields.name> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "NAME", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "name", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.name.component
                state={context.state.name}
                data={context.data.name}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Name"}
            />
        );
    },
    description: function (
        props: WidgetExtraProps<typeof Fields.description> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DESCRIPTION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "description", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.description.component
                state={context.state.description}
                data={context.data.description}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Description"}
            />
        );
    },
    budget: function (
        props: WidgetExtraProps<typeof Fields.budget> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "BUDGET",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "budget", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.budget.component
                state={context.state.budget}
                data={context.data.budget}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Budget"}
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
        let nameState;
        {
            const inner = Fields.name.initialize(
                data.name,
                subcontext,
                subparameters.name
            );
            nameState = inner.state;
            data = { ...data, name: inner.data };
        }
        let descriptionState;
        {
            const inner = Fields.description.initialize(
                data.description,
                subcontext,
                subparameters.description
            );
            descriptionState = inner.state;
            data = { ...data, description: inner.data };
        }
        let budgetState;
        {
            const inner = Fields.budget.initialize(
                data.budget,
                subcontext,
                subparameters.budget
            );
            budgetState = inner.state;
            data = { ...data, budget: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            description: descriptionState,
            budget: budgetState,
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
    name: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.name>
    >;
    description: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.description>
    >;
    budget: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.budget>
    >;
};
// END MAGIC -- DO NOT EDIT
