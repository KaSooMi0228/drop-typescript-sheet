import { memoize, some } from "lodash";
import * as React from "react";
import { propCheck, propCheckVerbose } from "../propCheck";
import { QuickCacheApi } from "../quick-cache";
import {
    subStatus,
    ValidationError,
    Widget,
    WidgetResult,
    WidgetStatus,
} from "./index";

export type ListAction<InnerAction> = {
    type: "ITEM";
    index: number;
    action: InnerAction;
};

type State<InnerDataType, InnerStateType> = {
    items: InnerStateType[];
};

type ListExtraProps<T, DataType, ActionType> = {
    index?: number;
    itemProps?: T;
    itemFn?: (index: number) => T;
    filterItems?: (item: DataType) => boolean;
    reversed?: boolean;
};

export type Props<StateType, DataType, ActionType, ExtraPropsType> = {
    state: State<DataType, StateType>;
    data: DataType[];
    dispatch: (action: ListAction<ActionType>) => void;
    status: WidgetStatus;
    label?: string;
} & ListExtraProps<ExtraPropsType, DataType, ActionType>;

export type ListWidgetConfig<T, AddedContext> = {
    makeDragHandler?: () => (from: number, to: number) => void;
    enhanceContext?: (index: number) => AddedContext;
};
function defaultItemFn() {
    return {};
}

type SuperContext<ContextType, AddedContext> = Pick<
    ContextType,
    Exclude<keyof ContextType, keyof AddedContext>
>;

function identity<T>(value: T) {
    return value;
}

export function StaticListWidget<
    StateType,
    DataType,
    ContextType,
    ActionType,
    ExtraPropsType,
    AddedContext
>(
    meta: Widget<StateType, DataType, ContextType, ActionType, ExtraPropsType>,
    config: ListWidgetConfig<DataType, AddedContext> = {}
): Widget<
    State<DataType, StateType>,
    DataType[],
    SuperContext<ContextType, AddedContext>,
    ListAction<ActionType>,
    ListExtraProps<ExtraPropsType, DataType, ActionType>
> {
    function makeContext(
        context: SuperContext<ContextType, AddedContext>,
        index: number
    ): ContextType {
        if (config.enhanceContext) {
            return {
                ...context,
                ...config.enhanceContext(index),
            } as any;
        } else {
            return context as any;
        }
    }

    const ItemsComponent = React.memo(
        (props: Props<StateType, DataType, ActionType, ExtraPropsType>) => {
            console.log("?? Hello?");
            const subdispatches = React.useMemo(
                () =>
                    memoize(
                        (index: number) => (action: any) =>
                            props.dispatch({
                                type: "ITEM",
                                index,
                                action,
                            })
                    ),
                [props.dispatch]
            );
            const defaultFilter = (item: DataType) => true;
            const filterItems = props.filterItems ?? defaultFilter;

            const substatuses = React.useMemo(
                () =>
                    memoize((index: number) =>
                        subStatus(props.status, `${index}`, false)
                    ),
                [props.status]
            );

            let components = [];

            for (let index = 0; index < props.state.items.length; index++) {
                console.log("SS", index, props.index);
                if (!filterItems(props.data[index])) {
                    continue;
                }
                if (props.index !== undefined && props.index !== index) {
                    continue;
                }
                const itemFn = props.itemFn || defaultItemFn;
                components.push(
                    <meta.component
                        key={index}
                        {...(props.itemProps as ExtraPropsType)}
                        {...itemFn(index)}
                        status={substatuses(index)}
                        state={props.state.items[index]}
                        data={props.data[index]}
                        dispatch={subdispatches(index)}
                    />
                );
            }

            if (props.reversed) {
                components.reverse();
            }

            return <>{components}</>;
        },
        propCheckVerbose
    );

    return {
        dataMeta: {
            type: "array",
            items: meta.dataMeta,
        },
        initialize: (
            data: DataType[],
            context: SuperContext<ContextType, AddedContext>
        ): WidgetResult<State<DataType, StateType>, DataType[]> => {
            const result: WidgetResult<
                State<DataType, StateType>,
                DataType[]
            > = {
                state: {
                    items: [],
                },
                data: [],
            };

            data.forEach((item, index) => {
                const inner = meta.initialize(
                    item,
                    makeContext(context, index)
                );
                result.state.items.push(inner.state);
                result.data.push(inner.data);
            });

            return result;
        },
        component: React.memo(
            (props: Props<StateType, DataType, ActionType, ExtraPropsType>) => {
                return <ItemsComponent {...props} />;
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
            state: State<DataType, StateType>,
            data: DataType[],
            action: ListAction<ActionType>,
            context: SuperContext<ContextType, AddedContext>
        ): WidgetResult<State<DataType, StateType>, DataType[]> => {
            switch (action.type) {
                case "ITEM": {
                    const items = state.items.slice();
                    data = data.slice();
                    const inner = meta.reduce(
                        items[action.index],
                        data[action.index],
                        action.action,
                        makeContext(context, action.index)
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
