import React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { DateWidget } from "../../clay/widgets/DateWidget";
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
import { MoneyWidget } from "../../clay/widgets/money-widget";
import { TableRow } from "../../clay/widgets/TableRow";
import { TextWidget } from "../../clay/widgets/TextWidget";
import {
    InvoiceContingencyItemMaterial,
    INVOICE_CONTINGENCY_ITEM_MATERIAL_META,
} from "./table";

export type Data = InvoiceContingencyItemMaterial;

const Fields = {
    date: DateWidget,
    name: TextWidget,
    description: TextWidget,
    amount: MoneyWidget,
};
export type ExtraProps = {
    dividedDescription: boolean;
};

function Component(props: Props) {
    return (
        <>
            <TableRow flexSizes>
                <widgets.date />
                <widgets.name />
                <widgets.description />
                <widgets.amount />
            </TableRow>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.date> &
    WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.description> &
    WidgetContext<typeof Fields.amount>;
type BaseState = {
    date: WidgetState<typeof Fields.date>;
    name: WidgetState<typeof Fields.name>;
    description: WidgetState<typeof Fields.description>;
    amount: WidgetState<typeof Fields.amount>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "DATE"; action: WidgetAction<typeof Fields.date> }
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "DESCRIPTION"; action: WidgetAction<typeof Fields.description> }
    | { type: "AMOUNT"; action: WidgetAction<typeof Fields.amount> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.date, data.date, cache, "date", errors);
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(
        Fields.description,
        data.description,
        cache,
        "description",
        errors
    );
    subvalidate(Fields.amount, data.amount, cache, "amount", errors);
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
        case "DATE": {
            const inner = Fields.date.reduce(
                state.date,
                data.date,
                action.action,
                subcontext
            );
            return {
                state: { ...state, date: inner.state },
                data: { ...data, date: inner.data },
            };
        }
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
        case "AMOUNT": {
            const inner = Fields.amount.reduce(
                state.amount,
                data.amount,
                action.action,
                subcontext
            );
            return {
                state: { ...state, amount: inner.state },
                data: { ...data, amount: inner.data },
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
    date: function (
        props: WidgetExtraProps<typeof Fields.date> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "DATE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "date", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.date.component
                state={context.state.date}
                data={context.data.date}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Date"}
            />
        );
    },
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
    amount: function (
        props: WidgetExtraProps<typeof Fields.amount> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "AMOUNT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "amount", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.amount.component
                state={context.state.amount}
                data={context.data.amount}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Amount"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: INVOICE_CONTINGENCY_ITEM_MATERIAL_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let dateState;
        {
            const inner = Fields.date.initialize(
                data.date,
                subcontext,
                subparameters.date
            );
            dateState = inner.state;
            data = { ...data, date: inner.data };
        }
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
        let amountState;
        {
            const inner = Fields.amount.initialize(
                data.amount,
                subcontext,
                subparameters.amount
            );
            amountState = inner.state;
            data = { ...data, amount: inner.data };
        }
        let state = {
            initialParameters: parameters,
            date: dateState,
            name: nameState,
            description: descriptionState,
            amount: amountState,
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
                    meta={INVOICE_CONTINGENCY_ITEM_MATERIAL_META}
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
    date: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.date>
    >;
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
    amount: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.amount>
    >;
};
// END MAGIC -- DO NOT EDIT
