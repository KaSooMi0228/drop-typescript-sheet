import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { RemoveButton } from "../../../clay/remove-button";
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
import { useListItemContext } from "../../../clay/widgets/ListWidget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { CertifiedForemanLinkWidget } from "../../user";
import {
    PreferredCertifiedForeman,
    PREFERRED_CERTIFIED_FOREMAN_META,
} from "./table";

export type Data = PreferredCertifiedForeman;

export const Fields = {
    certifiedForeman: CertifiedForemanLinkWidget,
    reason: TextWidget,
};

function Component(props: Props) {
    const listItemContext = useListItemContext();
    return (
        <tr {...listItemContext.draggableProps}>
            <td>{listItemContext.dragHandle}</td>
            <td style={{ width: "20em" }}>
                <widgets.certifiedForeman />
            </td>
            <td>
                <widgets.reason />
            </td>
            <td>
                <RemoveButton />
            </td>
        </tr>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.certifiedForeman> &
    WidgetContext<typeof Fields.reason>;
type ExtraProps = {};
type BaseState = {
    certifiedForeman: WidgetState<typeof Fields.certifiedForeman>;
    reason: WidgetState<typeof Fields.reason>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "CERTIFIED_FOREMAN";
          action: WidgetAction<typeof Fields.certifiedForeman>;
      }
    | { type: "REASON"; action: WidgetAction<typeof Fields.reason> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.certifiedForeman,
        data.certifiedForeman,
        cache,
        "certifiedForeman",
        errors
    );
    subvalidate(Fields.reason, data.reason, cache, "reason", errors);
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
        case "CERTIFIED_FOREMAN": {
            const inner = Fields.certifiedForeman.reduce(
                state.certifiedForeman,
                data.certifiedForeman,
                action.action,
                subcontext
            );
            return {
                state: { ...state, certifiedForeman: inner.state },
                data: { ...data, certifiedForeman: inner.data },
            };
        }
        case "REASON": {
            const inner = Fields.reason.reduce(
                state.reason,
                data.reason,
                action.action,
                subcontext
            );
            return {
                state: { ...state, reason: inner.state },
                data: { ...data, reason: inner.data },
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
    certifiedForeman: function (
        props: WidgetExtraProps<typeof Fields.certifiedForeman> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CERTIFIED_FOREMAN",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "certifiedForeman", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.certifiedForeman.component
                state={context.state.certifiedForeman}
                data={context.data.certifiedForeman}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Certified Foreman"}
            />
        );
    },
    reason: function (
        props: WidgetExtraProps<typeof Fields.reason> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "REASON",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "reason", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.reason.component
                state={context.state.reason}
                data={context.data.reason}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Reason"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PREFERRED_CERTIFIED_FOREMAN_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let certifiedForemanState;
        {
            const inner = Fields.certifiedForeman.initialize(
                data.certifiedForeman,
                subcontext,
                subparameters.certifiedForeman
            );
            certifiedForemanState = inner.state;
            data = { ...data, certifiedForeman: inner.data };
        }
        let reasonState;
        {
            const inner = Fields.reason.initialize(
                data.reason,
                subcontext,
                subparameters.reason
            );
            reasonState = inner.state;
            data = { ...data, reason: inner.data };
        }
        let state = {
            initialParameters: parameters,
            certifiedForeman: certifiedForemanState,
            reason: reasonState,
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
                    meta={PREFERRED_CERTIFIED_FOREMAN_META}
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
    certifiedForeman: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.certifiedForeman>
    >;
    reason: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.reason>
    >;
};
// END MAGIC -- DO NOT EDIT
