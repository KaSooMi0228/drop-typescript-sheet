import { faBars, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { css } from "glamor";
import { some } from "lodash";
import * as React from "react";
import { CSSProperties } from "react";
import { Draggable, Droppable } from "react-beautiful-dnd";
import { Button, DropdownButton, Nav } from "react-bootstrap";
import DropdownItem from "react-bootstrap/DropdownItem";
import RelativePortal from "react-relative-portal";
import { CONTENT_AREA } from "../../app/styles";
import { useDroppableId } from "../dnd";
import { propCheck } from "../propCheck";
import { QuickCacheApi } from "../quick-cache";
import { newUUID } from "../uuid";
import {
    subStatus,
    ValidationError,
    Widget,
    WidgetResult,
    WidgetStatus,
} from "./index";
import { createEmpty } from "./ListWidget";

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
          name?: string;
      }
    | {
          type: "MOVE";
          from: number;
          to: number;
      }
    | {
          type: "SELECT";
          index: number;
      }
    | {
          type: "DUPLICATE";
          index: number;
          action?: InnerAction;
      };

type TabsWidgetConfig<DataType, ContextType> = {
    namePrompt?: string;
    adaptNewItem?: (
        item: DataType,
        items: DataType[],
        context: ContextType
    ) => DataType | null;
    emptyOk?: boolean;
};

export type ListItemContextType = {
    remove: () => void;
    dragHandle: React.ReactNode;
    draggableProps: any;
};

type State<InnerDataType, InnerStateType> = {
    currentIndex: number;
    items: InnerStateType[];
};

type ListExtraProps<T, DataType> = {
    collapseSolo?: boolean;
    deSolo?: () => void;
    itemProps?: T;
    actions?: (
        data: DataType,
        index: number
    ) => {
        label?: string;
        action?: () => void;
        widget?: () => React.ReactNode;
    }[];
    labelForItem?: (item: DataType, index: number) => React.ReactNode;
    tabsStyle?: CSSProperties;
    newButton?: React.ReactNode;
    newLabel?: string;
};

const DELETE_BUTTON_STYLE = css({
    display: "inline-block",
});

const TAB_STYLE = css({
    whiteSpace: "nowrap",
});

const TABS_STYLE = css({
    //overflowX: "auto",
    //flexWrap: "nowrap",
});

export type Props<StateType, DataType, ActionType, ExtraPropsType> = {
    state: State<DataType, StateType>;
    data: DataType[];
    dispatch: (action: ListAction<ActionType>) => void;
    status: WidgetStatus;
    label?: string;
} & ListExtraProps<ExtraPropsType, DataType>;
export function TabsWidget<
    StateType,
    DataType extends object,
    ContextType,
    ActionType,
    ExtraPropsType
>(
    meta: Widget<StateType, DataType, ContextType, ActionType, ExtraPropsType>,
    config: TabsWidgetConfig<DataType, ContextType>
): Widget<
    State<DataType, StateType>,
    DataType[],
    ContextType,
    ListAction<ActionType>,
    ListExtraProps<ExtraPropsType, DataType>
> {
    return {
        dataMeta: {
            type: "array",
            items: meta.dataMeta,
        },
        initialize: (
            data: DataType[],
            context: ContextType,
            parameters: string[] = []
        ): WidgetResult<State<DataType, StateType>, DataType[]> => {
            const result: WidgetResult<
                State<DataType, StateType>,
                DataType[]
            > = {
                state: {
                    currentIndex: parseInt(parameters[0], 10) || 0,
                    items: [],
                },
                data: [],
            };

            data.forEach((item, index) => {
                const inner = meta.initialize(
                    item,
                    context,
                    index === result.state.currentIndex
                        ? parameters.slice(1)
                        : undefined
                );
                result.state.items.push(inner.state);
                result.data.push(inner.data);
            });

            return result;
        },
        encodeState: (state: State<DataType, StateType>) => {
            const innerEncodeState = meta.encodeState;
            const innerState = state.items[state.currentIndex];
            return [
                `${state.currentIndex}`,
                ...(innerEncodeState && innerState
                    ? innerEncodeState(innerState)
                    : []),
            ];
        },
        component: React.memo(
            (props: Props<StateType, DataType, ActionType, ExtraPropsType>) => {
                const subdispatch = React.useCallback(
                    (action) =>
                        props.dispatch({
                            type: "ITEM",
                            index: props.state.currentIndex,
                            action,
                        }),
                    [props.dispatch, props.state.currentIndex]
                );

                const droppableId = useDroppableId((from, to) => {
                    props.dispatch({
                        type: "MOVE",
                        from,
                        to,
                    });
                });
                const onClickNew = React.useCallback(() => {
                    if (config.namePrompt) {
                        const name = prompt(config.namePrompt);
                        if (name) {
                            props.dispatch({
                                type: "NEW",
                                name,
                            });
                        }
                    } else {
                        props.dispatch({
                            type: "NEW",
                        });
                    }
                }, [props.dispatch]);
                if (props.collapseSolo && props.data.length == 1) {
                    return (
                        <div {...CONTENT_AREA}>
                            {props.status.mutable && (
                                <Button
                                    onClick={() => {
                                        if (props.deSolo) {
                                            props.deSolo();
                                        } else {
                                            onClickNew();
                                        }
                                    }}
                                    style={{
                                        position: "absolute",
                                        right: 10,
                                    }}
                                >
                                    Multi-{(meta.dataMeta as any).name}
                                </Button>
                            )}
                            <meta.component
                                {...(props.itemProps as ExtraPropsType)}
                                status={subStatus(props.status, `0`)}
                                state={props.state.items[0]}
                                data={props.data[0]}
                                dispatch={subdispatch}
                            />
                        </div>
                    );
                }
                return (
                    <div {...CONTENT_AREA}>
                        <div>
                            <Droppable
                                droppableId={droppableId}
                                direction="horizontal"
                            >
                                {(droppableProvided) => {
                                    return (
                                        <div
                                            {...TABS_STYLE}
                                            style={props.tabsStyle}
                                            className="nav nav-tabs"
                                            ref={
                                                droppableProvided.innerRef as any
                                            }
                                        >
                                            {props.data.map((item, index) => (
                                                <Draggable
                                                    draggableId={
                                                        droppableId +
                                                        "-" +
                                                        index
                                                    }
                                                    index={index}
                                                    key={index}
                                                    isDragDisabled={
                                                        !props.status.mutable
                                                    }
                                                >
                                                    {(provided) => {
                                                        const actions =
                                                            (props.actions &&
                                                                props.actions(
                                                                    item,
                                                                    index
                                                                )) ||
                                                            [];

                                                        return (
                                                            <Nav.Item
                                                                ref={
                                                                    provided.innerRef as any
                                                                }
                                                                {...provided.draggableProps}
                                                                className="active"
                                                            >
                                                                <Nav.Link
                                                                    onClick={() =>
                                                                        props.dispatch(
                                                                            {
                                                                                type: "SELECT",
                                                                                index: index,
                                                                            }
                                                                        )
                                                                    }
                                                                    eventKey={
                                                                        index +
                                                                        ""
                                                                    }
                                                                    active={
                                                                        index ===
                                                                        props
                                                                            .state
                                                                            .currentIndex
                                                                    }
                                                                >
                                                                    <span
                                                                        {...TAB_STYLE}
                                                                    >
                                                                        <span
                                                                            {...provided.dragHandleProps}
                                                                        >
                                                                            <FontAwesomeIcon
                                                                                icon={
                                                                                    faBars
                                                                                }
                                                                            />
                                                                        </span>{" "}
                                                                        {props.labelForItem &&
                                                                            props.labelForItem(
                                                                                item,
                                                                                index
                                                                            )}
                                                                        {actions.length >
                                                                            0 &&
                                                                            props
                                                                                .status
                                                                                .mutable && (
                                                                                <>
                                                                                    {" "}
                                                                                    <span
                                                                                        style={{
                                                                                            display:
                                                                                                "inline-block",
                                                                                            width: "1em",
                                                                                        }}
                                                                                    />
                                                                                    <RelativePortal>
                                                                                        <DropdownButton
                                                                                            size="sm"
                                                                                            id=""
                                                                                            title=""
                                                                                            style={{
                                                                                                display:
                                                                                                    "inline-block",
                                                                                                left: "-1em",
                                                                                                top: "-0.25em",
                                                                                            }}
                                                                                            variant="light"
                                                                                        >
                                                                                            {actions.map(
                                                                                                (
                                                                                                    action,
                                                                                                    index
                                                                                                ) =>
                                                                                                    action.widget ? (
                                                                                                        action.widget()
                                                                                                    ) : (
                                                                                                        <DropdownItem
                                                                                                            key={
                                                                                                                index
                                                                                                            }
                                                                                                            onClick={
                                                                                                                action.action
                                                                                                            }
                                                                                                        >
                                                                                                            {
                                                                                                                action.label
                                                                                                            }
                                                                                                        </DropdownItem>
                                                                                                    )
                                                                                            )}
                                                                                        </DropdownButton>
                                                                                    </RelativePortal>
                                                                                </>
                                                                            )}
                                                                    </span>
                                                                </Nav.Link>
                                                            </Nav.Item>
                                                        );
                                                    }}
                                                </Draggable>
                                            ))}

                                            {droppableProvided.placeholder}
                                            <Nav.Item
                                                style={{
                                                    marginLeft: "1em",
                                                }}
                                            >
                                                {props.status.mutable &&
                                                    (props.newButton ?? (
                                                        <Nav.Link
                                                            onClick={onClickNew}
                                                        >
                                                            {props.newLabel ?? (
                                                                <>
                                                                    New{" "}
                                                                    {
                                                                        (
                                                                            meta.dataMeta as any
                                                                        ).name
                                                                    }
                                                                </>
                                                            )}{" "}
                                                            <FontAwesomeIcon
                                                                icon={faPlus}
                                                            />
                                                        </Nav.Link>
                                                    ))}
                                            </Nav.Item>
                                        </div>
                                    );
                                }}
                            </Droppable>
                        </div>
                        {props.state.currentIndex <
                            props.state.items.length && (
                            <meta.component
                                {...(props.itemProps as ExtraPropsType)}
                                status={subStatus(
                                    props.status,
                                    `${props.state.currentIndex}`
                                )}
                                state={
                                    props.state.items[props.state.currentIndex]
                                }
                                data={props.data[props.state.currentIndex]}
                                dispatch={subdispatch}
                            />
                        )}
                    </div>
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

            if (data.length === 0 && !config.emptyOk) {
                errors.push({
                    field: "0",
                    empty: true,
                    invalid: false,
                });
            }

            return errors;
        },
        reduce: (
            state: State<DataType, StateType>,
            data: DataType[],
            action: ListAction<ActionType>,
            context: ContextType
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
                            currentIndex:
                                state.currentIndex >= action.index
                                    ? state.currentIndex - 1
                                    : state.currentIndex,
                            items,
                        },
                        data,
                    };
                }
                case "MOVE": {
                    const items = state.items.slice();
                    items.splice(action.from, 1);
                    items.splice(action.to, 0, state.items[action.from]);

                    const newdata = data.slice();
                    newdata.splice(action.from, 1);
                    newdata.splice(action.to, 0, data[action.from]);

                    return {
                        state: {
                            ...state,
                            items,
                        },
                        data: newdata,
                    };
                }

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
                case "DUPLICATE": {
                    const items = state.items.slice();
                    data = data.slice();
                    items.splice(action.index + 1, 0, items[action.index]);
                    data.splice(action.index + 1, 0, data[action.index]);

                    if ("id" in data[action.index + 1]) {
                        data[action.index + 1] = {
                            ...data[action.index + 1],
                            id: newUUID(),
                        };
                    }

                    if (action.action) {
                        const inner = meta.reduce(
                            items[action.index + 1],
                            data[action.index + 1],
                            action.action,
                            context
                        );
                        items[action.index + 1] = inner.state;
                        data[action.index + 1] = inner.data;
                    }

                    return {
                        state: {
                            ...state,
                            items,
                        },
                        data,
                    };
                }
                case "NEW": {
                    let adapted = createEmpty(meta.dataMeta);
                    if (action.name) {
                        adapted = { ...adapted, name: action.name };
                    }
                    if (config.adaptNewItem) {
                        adapted = config.adaptNewItem(adapted, data, context);
                    }
                    if (adapted === null) {
                        return { state, data };
                    }

                    const inner = meta.initialize(adapted, context);

                    return {
                        state: {
                            currentIndex: state.items.length,
                            items: [...state.items, inner.state],
                        },
                        data: [...data, inner.data],
                    };
                }
                case "SELECT":
                    return {
                        state: {
                            ...state,
                            currentIndex: action.index,
                        },
                        data,
                    };
            }
        },
    };
}
