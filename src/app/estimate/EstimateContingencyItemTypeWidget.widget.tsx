import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { DropdownLinkWidget } from "../../clay/widgets/dropdown-link-widget";
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
import { TextWidget } from "../../clay/widgets/TextWidget";
import {
    EstimateContingencyItemType,
    ESTIMATE_CONTINGENCY_ITEM_TYPE_META,
} from "./table";
import { SUBSTRATE_META, UNIT_TYPE_META } from "./types/table";

export type Data = EstimateContingencyItemType;

export const Fields = {
    name: TextWidget,
    rate: MoneyWidget,
    type: DropdownLinkWidget({
        meta: UNIT_TYPE_META,
        label: (record) => record.name,
        include: (record) => record.contingency,
    }),
    substrate: DropdownLinkWidget({
        meta: SUBSTRATE_META,
        label: (record) => record.name,
    }),
};

function Component(props: Props) {
    throw new Error("unsupported");
    return <></>;
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.rate> &
    WidgetContext<typeof Fields.type> &
    WidgetContext<typeof Fields.substrate>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    rate: WidgetState<typeof Fields.rate>;
    type: WidgetState<typeof Fields.type>;
    substrate: WidgetState<typeof Fields.substrate>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "RATE"; action: WidgetAction<typeof Fields.rate> }
    | { type: "TYPE"; action: WidgetAction<typeof Fields.type> }
    | { type: "SUBSTRATE"; action: WidgetAction<typeof Fields.substrate> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.rate, data.rate, cache, "rate", errors);
    subvalidate(Fields.type, data.type, cache, "type", errors);
    subvalidate(Fields.substrate, data.substrate, cache, "substrate", errors);
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
        case "RATE": {
            const inner = Fields.rate.reduce(
                state.rate,
                data.rate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, rate: inner.state },
                data: { ...data, rate: inner.data },
            };
        }
        case "TYPE": {
            const inner = Fields.type.reduce(
                state.type,
                data.type,
                action.action,
                subcontext
            );
            return {
                state: { ...state, type: inner.state },
                data: { ...data, type: inner.data },
            };
        }
        case "SUBSTRATE": {
            const inner = Fields.substrate.reduce(
                state.substrate,
                data.substrate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, substrate: inner.state },
                data: { ...data, substrate: inner.data },
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
    rate: function (
        props: WidgetExtraProps<typeof Fields.rate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "RATE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "rate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.rate.component
                state={context.state.rate}
                data={context.data.rate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Rate"}
            />
        );
    },
    type: function (
        props: WidgetExtraProps<typeof Fields.type> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "TYPE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "type", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.type.component
                state={context.state.type}
                data={context.data.type}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Type"}
            />
        );
    },
    substrate: function (
        props: WidgetExtraProps<typeof Fields.substrate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SUBSTRATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "substrate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.substrate.component
                state={context.state.substrate}
                data={context.data.substrate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Substrate"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ESTIMATE_CONTINGENCY_ITEM_TYPE_META,
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
        let rateState;
        {
            const inner = Fields.rate.initialize(
                data.rate,
                subcontext,
                subparameters.rate
            );
            rateState = inner.state;
            data = { ...data, rate: inner.data };
        }
        let typeState;
        {
            const inner = Fields.type.initialize(
                data.type,
                subcontext,
                subparameters.type
            );
            typeState = inner.state;
            data = { ...data, type: inner.data };
        }
        let substrateState;
        {
            const inner = Fields.substrate.initialize(
                data.substrate,
                subcontext,
                subparameters.substrate
            );
            substrateState = inner.state;
            data = { ...data, substrate: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            rate: rateState,
            type: typeState,
            substrate: substrateState,
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
                    meta={ESTIMATE_CONTINGENCY_ITEM_TYPE_META}
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
    rate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.rate>
    >;
    type: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.type>
    >;
    substrate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.substrate>
    >;
};
// END MAGIC -- DO NOT EDIT
