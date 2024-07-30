import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Decimal } from "decimal.js";
import { memoize, some } from "lodash";
import * as React from "react";
import { Draggable, Droppable } from "react-beautiful-dnd";
import { Button } from "react-bootstrap";
import { useDroppableId } from "../dnd";
import { Meta } from "../meta";
import { propCheck, propCheckVerbose } from "../propCheck";
import { QuickCacheApi } from "../quick-cache";
import {
    subStatus,
    ValidationError,
    Widget,
    WidgetResult,
    WidgetStatus,
} from "./index";

export function moveIndex<T>(data: T[], from: number, to: number): T[] {
    const items = data.slice();
    items.splice(from, 1);
    items.splice(to, 0, data[from]);
    return items;
}

export function insertIndex<T>(data: T[], index: number, x: T): T[] {
    const items = data.slice();
    items.splice(index, 0, x);
    return items;
}

export function removeIndex<T>(data: T[], index: number): T[] {
    const items = data.slice();
    items.splice(index, 1);
    return items;
}

export function duplicateIndex<T>(
    data: T[],
    index: number,
    adapt?: (t: T) => T
): T[] {
    const items = data.slice();
    if (adapt) {
        items.splice(index + 1, 0, adapt(data[index]));
    } else {
        items.splice(index + 1, 0, data[index]);
    }
    return items;
}

export function createEmpty(meta: Meta): any {
    switch (meta.type) {
        case "string":
            return "";
        case "money":
        case "percentage":
        case "quantity":
            return new Decimal(0);
        case "boolean":
            return false;
        case "version":
            throw new Error("unexpected");
        case "date":
        case "uuid":
        case "money?":
        case "quantity?":
        case "percentage?":
            return null;
        case "array":
            return [];
        case "record":
            return meta.fromJSON(meta.repair(undefined));
    }
}

export type ListAction<InnerAction> =
    | {
          type: "ITEM";
          index: number;
          action: InnerAction;
      }
    | {
          type: "REMOVE";
          index: number;
      }
    | {
          type: "NEW";
          actions: InnerAction[];
      }
    | {
          type: "MOVE" | "MERGE";
          from: number;
          to: number;
      };

export type ListItemContextType = {
    remove: (() => void) | null;
    dragHandle: React.ReactNode;
    draggableProps: any;
    isExtra: boolean;
    index?: number;
};

const DefaultListItemConfig: ListItemContextType = {
    remove: null,
    dragHandle: undefined,
    draggableProps: {},
    isExtra: false,
};

const ListItemContext = React.createContext<ListItemContextType>(
    DefaultListItemConfig
);

export function useListItemContext() {
    return React.useContext(ListItemContext);
}

type State<InnerDataType, InnerStateType> = {
    items: InnerStateType[];
    empty: InnerDataType;
    emptyState: InnerStateType;
};

type ListExtraProps<T, DataType, ActionType> = {
    itemProps?: T;
    itemFn?: (index: number) => T;
    extraItemForAdd?: boolean;
    addButtonText?: string;
    containerClass?: "div" | "tbody" | "ol";
    filterItems?: (item: DataType) => boolean;
    postNewAction?: ActionType;
    reversed?: boolean;
    droppableId?: string;
};

export type Props<StateType, DataType, ActionType, ExtraPropsType> = {
    state: State<DataType, StateType>;
    data: DataType[];
    dispatch: (action: ListAction<ActionType>) => void;
    status: WidgetStatus;
    label?: string;
} & ListExtraProps<ExtraPropsType, DataType, ActionType>;

export type ListWidgetConfig<T, AddedContext, StateType, DataType> = {
    makeDragHandler?: () => (from: number, to: number) => void;
    enhanceContext?: (index: number) => AddedContext;
    adaptEmpty?: (value: T) => T;
    emptyOk?: boolean;
    merge?: (
        state: StateType,
        data: DataType,
        incomingState: StateType,
        incomingData: DataType
    ) => { state: StateType; data: DataType };
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

export function ListWidget<
    StateType,
    DataType,
    ContextType,
    ActionType,
    ExtraPropsType,
    AddedContext
>(
    meta: Widget<StateType, DataType, ContextType, ActionType, ExtraPropsType>,
    config: ListWidgetConfig<DataType, AddedContext, StateType, DataType> = {}
): Widget<
    State<DataType, StateType>,
    DataType[],
    SuperContext<ContextType, AddedContext>,
    ListAction<ActionType>,
    ListExtraProps<ExtraPropsType, DataType, ActionType>
> {
    if (!meta.dataMeta) {
        throw new Error("missing dataMeta");
    }

    const adaptEmpty = config.adaptEmpty || identity;

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
        (
            props: Props<StateType, DataType, ActionType, ExtraPropsType> & {
                droppableId: string;
            }
        ) => {
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
                if (!filterItems(props.data[index])) {
                    continue;
                }
                components.push(
                    <Draggable
                        draggableId={props.droppableId + "-" + index}
                        index={index}
                        key={index}
                    >
                        {(provided, snapshot) => {
                            const context = {
                                index,
                                remove: props.status.mutable
                                    ? () => {
                                          if (
                                              confirm(
                                                  "Are you sure you want to remove?"
                                              )
                                          ) {
                                              props.dispatch({
                                                  type: "REMOVE",
                                                  index,
                                              });
                                          }
                                      }
                                    : null,
                                dragHandle: (
                                    <div {...provided.dragHandleProps}>
                                        {props.status.mutable && (
                                            <FontAwesomeIcon
                                                icon={faBars}
                                                size="2x"
                                            />
                                        )}
                                    </div>
                                ),
                                draggableProps: {
                                    ...provided.draggableProps,
                                    ref: provided.innerRef,
                                    style: {
                                        ...provided.draggableProps.style,
                                        backgroundColor:
                                            snapshot.combineTargetFor
                                                ? "#e0e0e0"
                                                : undefined,
                                    },
                                },
                                isExtra: false,
                            } as ListItemContextType;

                            const itemFn = props.itemFn || defaultItemFn;
                            return (
                                <ListItemContext.Provider value={context}>
                                    <meta.component
                                        {...(props.itemProps as ExtraPropsType)}
                                        {...itemFn(index)}
                                        status={substatuses(index)}
                                        state={props.state.items[index]}
                                        data={props.data[index]}
                                        dispatch={subdispatches(index)}
                                    />
                                </ListItemContext.Provider>
                            );
                        }}
                    </Draggable>
                );
            }

            if (props.extraItemForAdd && props.status.mutable) {
                const index = props.data.length;
                components.push(
                    <Draggable
                        draggableId={props.droppableId + "-" + index}
                        index={index}
                        key={index}
                        isDragDisabled={true}
                    >
                        {(provided) => {
                            const context = {
                                remove: null,
                                dragHandle: (
                                    <div {...provided.dragHandleProps} />
                                ),
                                draggableProps: {
                                    ...provided.draggableProps,
                                    ref: provided.innerRef,
                                },
                                isExtra: true,
                            } as ListItemContextType;

                            return (
                                <ListItemContext.Provider value={context}>
                                    <meta.component
                                        {...(props.itemProps as ExtraPropsType)}
                                        status={subStatus(
                                            props.status,
                                            `${index}`,
                                            false
                                        )}
                                        state={props.state.emptyState}
                                        data={props.state.empty}
                                        dispatch={(action) =>
                                            props.dispatch({
                                                type: "NEW",
                                                actions: props.postNewAction
                                                    ? [
                                                          props.postNewAction,
                                                          action,
                                                      ]
                                                    : [action],
                                            })
                                        }
                                    />
                                </ListItemContext.Provider>
                            );
                        }}
                    </Draggable>
                );
            }

            if (props.addButtonText && props.status.mutable) {
                if (props.containerClass === "tbody") {
                    components.push(
                        <tr>
                            <td colSpan={5} style={{ border: "none" }}>
                                <Button
                                    key="add"
                                    onClick={() =>
                                        props.dispatch({
                                            type: "NEW",
                                            actions: props.postNewAction
                                                ? [props.postNewAction]
                                                : [],
                                        })
                                    }
                                >
                                    {props.addButtonText}
                                </Button>
                            </td>
                        </tr>
                    );
                } else {
                    components.push(
                        <Button
                            key="add"
                            onClick={() =>
                                props.dispatch({
                                    type: "NEW",
                                    actions: props.postNewAction
                                        ? [props.postNewAction]
                                        : [],
                                })
                            }
                        >
                            {props.addButtonText}
                        </Button>
                    );
                }
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
            const emptyInner = meta.initialize(
                adaptEmpty(createEmpty(meta.dataMeta)),
                makeContext(context, data.length)
            );

            const result: WidgetResult<
                State<DataType, StateType>,
                DataType[]
            > = {
                state: {
                    items: [],
                    empty: emptyInner.data,
                    emptyState: emptyInner.state,
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
                const dragHandler = config.makeDragHandler
                    ? config.makeDragHandler()
                    : (from: number, to: number, combine: boolean) => {
                          props.dispatch({
                              type: combine ? "MERGE" : "MOVE",
                              from,
                              to,
                          });
                      };

                const droppableId = useDroppableId(
                    dragHandler,
                    props.droppableId
                );

                const ContainerClass = props.containerClass || "div";

                return (
                    <Droppable
                        droppableId={droppableId}
                        isCombineEnabled={!!config.merge}
                    >
                        {(provided) => (
                            <ContainerClass ref={provided.innerRef}>
                                <ItemsComponent
                                    droppableId={droppableId}
                                    {...props}
                                />
                                {provided.placeholder}
                            </ContainerClass>
                        )}
                    </Droppable>
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

            if (data.length == 0 && !config.emptyOk) {
                errors.push({
                    field: "0",
                    empty: true,
                    invalid: false,
                    //                    detail: meta.validate(state.empty, cache),
                });
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
                case "REMOVE": {
                    const items = state.items.slice();
                    data = data.slice();
                    items.splice(action.index, 1);
                    data.splice(action.index, 1);
                    return {
                        state: {
                            ...state,
                            items,
                        },
                        data,
                    };
                }
                case "MOVE": {
                    return {
                        state: {
                            ...state,
                            items: moveIndex(
                                state.items,
                                action.from,
                                action.to
                            ),
                        },
                        data: moveIndex(data, action.from, action.to),
                    };
                }
                case "MERGE": {
                    const inner = config.merge!(
                        state.items[action.to],
                        data[action.to],
                        state.items[action.from],
                        data[action.from]
                    );
                    data = data.slice();
                    const items = state.items.slice();
                    data.splice(action.from, 1);
                    items.splice(action.from, 1);
                    data[action.to] = inner.data;
                    items[action.to] = inner.state;
                    return {
                        state: {
                            ...state,
                            items,
                        },
                        data,
                    };
                }

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
                case "NEW": {
                    const emptyInner = meta.initialize(
                        adaptEmpty(createEmpty(meta.dataMeta)),
                        makeContext(context, data.length)
                    );

                    let inner = {
                        state: state.emptyState,
                        data: state.empty,
                    };

                    for (const innerAction of action.actions) {
                        inner = meta.reduce(
                            inner.state,
                            inner.data,
                            innerAction,
                            makeContext(context, data.length)
                        );
                    }

                    return {
                        state: {
                            emptyState: emptyInner.state,
                            empty: emptyInner.data,
                            items: [...state.items, inner.state],
                        },
                        data: [...data, inner.data],
                    };
                }
            }
        },
    };
}
