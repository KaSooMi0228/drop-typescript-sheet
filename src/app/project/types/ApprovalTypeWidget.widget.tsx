import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { CheckboxWidget } from "../../../clay/widgets/CheckboxWidget";
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
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { ApprovalType, APPROVAL_TYPE_META } from "./table";

export type Data = ApprovalType;

export const Fields = {
    name: TextWidget,
    active: CheckboxWidget,
    requireCustomerPO: CheckboxWidget,
};

function Component(props: Props) {
    throw new Error("unimplemented");
    return <></>;
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.active> &
    WidgetContext<typeof Fields.requireCustomerPO>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    active: WidgetState<typeof Fields.active>;
    requireCustomerPO: WidgetState<typeof Fields.requireCustomerPO>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "ACTIVE"; action: WidgetAction<typeof Fields.active> }
    | {
          type: "REQUIRE_CUSTOMER_PO";
          action: WidgetAction<typeof Fields.requireCustomerPO>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.active, data.active, cache, "active", errors);
    subvalidate(
        Fields.requireCustomerPO,
        data.requireCustomerPO,
        cache,
        "requireCustomerPO",
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
        case "ACTIVE": {
            const inner = Fields.active.reduce(
                state.active,
                data.active,
                action.action,
                subcontext
            );
            return {
                state: { ...state, active: inner.state },
                data: { ...data, active: inner.data },
            };
        }
        case "REQUIRE_CUSTOMER_PO": {
            const inner = Fields.requireCustomerPO.reduce(
                state.requireCustomerPO,
                data.requireCustomerPO,
                action.action,
                subcontext
            );
            return {
                state: { ...state, requireCustomerPO: inner.state },
                data: { ...data, requireCustomerPO: inner.data },
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
    active: function (
        props: WidgetExtraProps<typeof Fields.active> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ACTIVE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "active", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.active.component
                state={context.state.active}
                data={context.data.active}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Active"}
            />
        );
    },
    requireCustomerPO: function (
        props: WidgetExtraProps<typeof Fields.requireCustomerPO> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "REQUIRE_CUSTOMER_PO",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "requireCustomerPO",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.requireCustomerPO.component
                state={context.state.requireCustomerPO}
                data={context.data.requireCustomerPO}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Require Customer Po"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: APPROVAL_TYPE_META,
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
        let activeState;
        {
            const inner = Fields.active.initialize(
                data.active,
                subcontext,
                subparameters.active
            );
            activeState = inner.state;
            data = { ...data, active: inner.data };
        }
        let requireCustomerPOState;
        {
            const inner = Fields.requireCustomerPO.initialize(
                data.requireCustomerPO,
                subcontext,
                subparameters.requireCustomerPO
            );
            requireCustomerPOState = inner.state;
            data = { ...data, requireCustomerPO: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            active: activeState,
            requireCustomerPO: requireCustomerPOState,
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
                <RecordContext meta={APPROVAL_TYPE_META} value={props.data}>
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
    active: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.active>
    >;
    requireCustomerPO: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.requireCustomerPO>
    >;
};
// END MAGIC -- DO NOT EDIT
