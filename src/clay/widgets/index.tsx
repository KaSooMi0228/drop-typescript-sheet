import { find, memoize, some } from "lodash";
import * as React from "react";
import { Dictionary } from "../common";
import { Meta, RecordMeta } from "../meta";
import { QuickCacheApi } from "../quick-cache";
import {
    BareRequest,
    BareRequestHandle,
    QueryRequest,
    RecordsRequest,
    RequestType,
} from "../requests";

export type WidgetStatus = {
    mutable: boolean;
    validation: ValidationError[];
};

export type WidgetResult<StateType, DataType> = {
    state: StateType;
    data: DataType;
};

export type InitializeResult<StateType, DataType> = WidgetResult<
    StateType,
    DataType
> & {
    parameters?: Dictionary<string[]>;
};

export type WidgetRequest = BareRequestHandle<QueryRequest | RecordsRequest>;

export function WidgetRequest<T extends RequestType<{}, {}, {}>>(
    type: T["type"],
    request: T["request"]
) {
    return BareRequest(type, request);
}

export type ValidationError = {
    field?: string;
    empty: boolean;
    invalid: boolean;
    detail?: ValidationError[];
};

export type WidgetProps<StateType, DataType, ActionType, ExtraPropsType> = {
    state: StateType;
    data: DataType;
    dispatch: (action: ActionType) => void;
    status: WidgetStatus;
    label?: string;
} & ExtraPropsType;

export type Widget<
    StateType,
    DataType,
    ContextType,
    ActionType,
    ExtraPropsType
> = {
    dataMeta: Meta;
    initialize: (
        data: DataType,
        context: ContextType,
        encodedContext?: string[]
    ) => WidgetResult<StateType, DataType>;
    component: React.StatelessComponent<
        WidgetProps<StateType, DataType, ActionType, ExtraPropsType>
    >;
    reduce: (
        state: StateType,
        data: DataType,
        action: ActionType,
        context: ContextType
    ) => WidgetResult<StateType, DataType>;
    validate: (data: DataType, cache: QuickCacheApi) => ValidationError[];
    encodeState?: (state: StateType) => string[];
    noGrow?: boolean;
};

export type BaseRecordWidget<
    StateType,
    DataType,
    ContextType,
    ActionType,
    ExtraPropsType
> = Widget<StateType, DataType, ContextType, ActionType, ExtraPropsType> & {
    dataMeta: RecordMeta<DataType, any, any>;
};

export type RecordWidget<
    StateType,
    DataType,
    ContextType,
    ActionType,
    ExtraPropsType
> = BaseRecordWidget<
    StateType,
    DataType,
    ContextType,
    ActionType,
    ExtraPropsType
> & {
    reactContext: React.Context<
        | {
              state: StateType;
              data: DataType;
              dispatch: (action: ActionType) => void;
              status: WidgetStatus;
          }
        | undefined
    >;
    fieldWidgets: Dictionary<React.SFC<any>>;
};

export type WidgetState<T extends Widget<any, any, any, any, any>> = ReturnType<
    T["reduce"]
>["state"];
export type WidgetData<T extends Widget<any, any, any, any, any>> = ReturnType<
    T["reduce"]
>["data"];
export type WidgetContext<T extends Widget<any, any, any, any, any>> =
    T["reduce"] extends (
        state: infer State,
        data: infer Data,
        action: infer Action,
        context: infer Context
    ) => {}
        ? Context
        : never;
export type WidgetAction<T extends Widget<any, any, any, any, any>> =
    T["reduce"] extends (
        state: infer State,
        data: infer Data,
        action: infer Action,
        context: infer Context
    ) => {}
        ? Action
        : never;

export type WidgetPropsAll<T extends Widget<any, any, any, any, any>> =
    T["component"] extends (args: infer X) => any ? X : never;

export type WidgetPropsOf<T extends Widget<any, any, any, any, any>> = Pick<
    WidgetPropsAll<T>,
    {
        [P in keyof WidgetPropsAll<T>]: P extends "children" ? never : P;
    }[keyof WidgetPropsAll<T>]
>;

export type WidgetExtraProps<T extends Widget<any, any, any, any, any>> = Pick<
    WidgetPropsAll<T>,
    {
        [P in keyof WidgetPropsAll<T>]: P extends
            | "children"
            | "data"
            | "state"
            | "dispatch"
            | "requests"
            | "status"
            ? never
            : P;
    }[keyof WidgetPropsAll<T>]
>;

export function subRequests(
    requests: Dictionary<WidgetRequest>,
    key: string
): Dictionary<WidgetRequest> {
    const result: Dictionary<WidgetRequest> = {};
    for (const [requestKey, value] of Object.entries(requests)) {
        if (requestKey.startsWith(key + ".")) {
            result[requestKey.slice(key.length + 1)] = value;
        }
    }
    return result;
}

export function subvalidate<
    StateType,
    DataType,
    ContextType,
    ActionType,
    ExtraPropsType
>(
    widget: Widget<
        StateType,
        DataType,
        ContextType,
        ActionType,
        ExtraPropsType
    >,
    data: DataType,
    cache: QuickCacheApi,
    key: string,
    errors: ValidationError[]
) {
    const inner = widget.validate(data, cache);
    if (inner.length > 0) {
        errors.push({
            field: key,
            invalid: some(inner, "invalid"),
            empty: some(inner, "empty"),
            detail: inner,
        });
    }
}

export function subStatus(
    status: WidgetStatus,
    key: string,
    readOnly: boolean = false
): WidgetStatus {
    const validation = [];
    for (const error of status.validation) {
        if (error.field === key) {
            if (error.detail) {
                validation.push(...error.detail);
            } else {
                validation.push({
                    empty: error.empty,
                    invalid: error.invalid,
                });
            }
        }
    }
    return {
        mutable: status.mutable && !readOnly,
        validation: validation,
    };
}

export function statusToState(
    errors: ValidationError[],
    empty: boolean = false
) {
    if (errors.length > 0) {
        return "is-invalid";
    } else if (empty) {
        return "is-empty";
    } else {
        return "is-valid";
    }
}

export function atLeastOneOf(
    errors: ValidationError[],
    lhs: string,
    rhs: string
) {
    const lhsError = find(
        errors,
        (error) => error.field === lhs && error.empty && !error.invalid
    );
    const rhsError = find(
        errors,
        (error) => error.field === rhs && error.empty && !error.invalid
    );

    // if either is ok, then remove the other, only one is needed
    if (rhsError === undefined || lhsError === undefined) {
        return errors.filter((error) => error != rhsError && error != lhsError);
    } else {
        return errors;
    }
}

const RECORD_CONTEXTS = memoize((key) => React.createContext<any>(null));

export function RecordContext<T>(props: {
    children: React.ReactNode;
    meta: RecordMeta<T, any, any>;
    value: T;
}) {
    const context = RECORD_CONTEXTS(props.meta.name);
    return (
        <context.Provider value={props.value}>
            {props.children}
        </context.Provider>
    );
}

export function useRecordContext<T>(meta: RecordMeta<T, any, any>): T {
    return React.useContext(RECORD_CONTEXTS(meta.name));
}
