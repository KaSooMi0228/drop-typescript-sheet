import * as React from "react";
import { Dictionary } from "../../clay/common";
import { LocalDate } from "../../clay/LocalDate";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { DateWidget } from "../../clay/widgets/DateWidget";
import { FormField } from "../../clay/widgets/FormField";
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
import { TextWidget } from "../../clay/widgets/TextWidget";
import { BulkSaltDelivery, BULK_SALT_DELIVERY_META } from "./table";

export type Data = BulkSaltDelivery;

export const Fields = {
    deliveredBy: FormField(TextWidget),
    deliveredDate: FormField(DateWidget),
};

function initialize(data: BulkSaltDelivery, context: Context) {
    return {
        data: {
            ...data,
            deliveredDate: new LocalDate(new Date()),
        },
        state: {},
    };
}

function Component(props: Props) {
    return (
        <>
            <widgets.deliveredBy />
            <widgets.deliveredDate />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.deliveredBy> &
    WidgetContext<typeof Fields.deliveredDate>;
type ExtraProps = {};
type BaseState = {
    deliveredBy: WidgetState<typeof Fields.deliveredBy>;
    deliveredDate: WidgetState<typeof Fields.deliveredDate>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "DELIVERED_BY"; action: WidgetAction<typeof Fields.deliveredBy> }
    | {
          type: "DELIVERED_DATE";
          action: WidgetAction<typeof Fields.deliveredDate>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.deliveredBy,
        data.deliveredBy,
        cache,
        "deliveredBy",
        errors
    );
    subvalidate(
        Fields.deliveredDate,
        data.deliveredDate,
        cache,
        "deliveredDate",
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
        case "DELIVERED_BY": {
            const inner = Fields.deliveredBy.reduce(
                state.deliveredBy,
                data.deliveredBy,
                action.action,
                subcontext
            );
            return {
                state: { ...state, deliveredBy: inner.state },
                data: { ...data, deliveredBy: inner.data },
            };
        }
        case "DELIVERED_DATE": {
            const inner = Fields.deliveredDate.reduce(
                state.deliveredDate,
                data.deliveredDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, deliveredDate: inner.state },
                data: { ...data, deliveredDate: inner.data },
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
    deliveredBy: function (
        props: WidgetExtraProps<typeof Fields.deliveredBy> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DELIVERED_BY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "deliveredBy", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.deliveredBy.component
                state={context.state.deliveredBy}
                data={context.data.deliveredBy}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Delivered By"}
            />
        );
    },
    deliveredDate: function (
        props: WidgetExtraProps<typeof Fields.deliveredDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DELIVERED_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "deliveredDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.deliveredDate.component
                state={context.state.deliveredDate}
                data={context.data.deliveredDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Delivered Date"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: BULK_SALT_DELIVERY_META,
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
        let deliveredByState;
        {
            const inner = Fields.deliveredBy.initialize(
                data.deliveredBy,
                subcontext,
                subparameters.deliveredBy
            );
            deliveredByState = inner.state;
            data = { ...data, deliveredBy: inner.data };
        }
        let deliveredDateState;
        {
            const inner = Fields.deliveredDate.initialize(
                data.deliveredDate,
                subcontext,
                subparameters.deliveredDate
            );
            deliveredDateState = inner.state;
            data = { ...data, deliveredDate: inner.data };
        }
        let state = {
            initialParameters: parameters,
            ...result.state,
            deliveredBy: deliveredByState,
            deliveredDate: deliveredDateState,
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
                    meta={BULK_SALT_DELIVERY_META}
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
    deliveredBy: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.deliveredBy>
    >;
    deliveredDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.deliveredDate>
    >;
};
// END MAGIC -- DO NOT EDIT
