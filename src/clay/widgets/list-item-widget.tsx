import { some } from "lodash";
import * as React from "react";
import { propCheck } from "../propCheck";
import { QuickCacheApi } from "../quick-cache";
import {
    subStatus,
    ValidationError,
    Widget,
    WidgetProps,
    WidgetResult,
} from "./index";

export type ListAction<InnerAction> = {
    type: "ITEM";
    index: number;
    action: InnerAction;
};

type State<InnerStateType> = {
    items: InnerStateType[];
};

type ListExtraProps<T> = {
    itemProps?: T;
    index: number;
};

export type Props<StateType, DataType, ActionType, ExtraPropsType> =
    WidgetProps<
        State<StateType>,
        DataType[],
        ListAction<ActionType>,
        ListExtraProps<ExtraPropsType>
    >;

export function ListItemWidget<
    StateType,
    DataType,
    ContextType,
    ActionType,
    ExtraPropsType
>(
    meta: Widget<StateType, DataType, ContextType, ActionType, ExtraPropsType>
): Widget<
    State<StateType>,
    DataType[],
    ContextType,
    ListAction<ActionType>,
    ListExtraProps<ExtraPropsType>
> {
    return {
        dataMeta: {
            type: "array",
            items: meta.dataMeta,
        },
        initialize: (
            data: DataType[],
            context: ContextType
        ): WidgetResult<State<StateType>, DataType[]> => {
            const result: WidgetResult<State<StateType>, DataType[]> = {
                state: {
                    items: [],
                },
                data: [],
            };

            data.forEach((item, index) => {
                const inner = meta.initialize(item, context);
                result.state.items.push(inner.state);
                result.data.push(inner.data);
            });

            return result;
        },
        component: React.memo(
            (props: Props<StateType, DataType, ActionType, ExtraPropsType>) => {
                const subdispatch = React.useCallback(
                    (action: ActionType) => {
                        props.dispatch({
                            type: "ITEM",
                            index: props.index,
                            action,
                        });
                    },
                    [props.dispatch, props.index]
                );

                return (
                    <meta.component
                        {...(props.itemProps as ExtraPropsType)}
                        status={subStatus(props.status, `${props.index}`)}
                        state={props.state.items[props.index]}
                        data={props.data[props.index]}
                        dispatch={subdispatch}
                    />
                );
            },
            propCheck
        ),
        validate: (
            data: DataType[],
            cache: QuickCacheApi
        ): ValidationError[] => {
            const errors = [];
            for (let index = 0; index < data.length; index++) {
                const innerErrors = meta.validate(data[index], cache);

                if (innerErrors.length > 0) {
                    errors.push({
                        field: `${index}`,
                        empty: some(innerErrors, "empty"),
                        invalid: some(innerErrors, "invalid"),
                        detail: innerErrors,
                    });
                }
            }

            return errors;
        },
        reduce: (
            state: State<StateType>,
            data: DataType[],
            action: ListAction<ActionType>,
            context: ContextType
        ): WidgetResult<State<StateType>, DataType[]> => {
            switch (action.type) {
                case "ITEM": {
                    const items = state.items.slice();
                    data = data.slice();
                    const inner = meta.reduce(
                        items[action.index],
                        data[action.index],
                        action.action,
                        context
                    );

                    items[action.index] = inner.state;
                    data[action.index] = inner.data;
                    return {
                        state: {
                            ...state,
                            items,
                        },
                        data,
                    };
                }
            }
        },
    };
}
