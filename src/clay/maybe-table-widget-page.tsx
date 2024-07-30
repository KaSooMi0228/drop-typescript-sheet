import { Page, PageRequest } from "./Page";
import {
    TableWidgetOptions,
    TableWidgetPage,
    TableWidgetPageAction,
    TableWidgetPageState,
} from "./TableWidgetPage";
import { UUID } from "./uuid";
import * as React from "react";

export function MaybeTableWidgetPage<
    StateType,
    DataType extends { id: UUID },
    ContextType,
    ActionType,
    ThisRequestType extends PageRequest,
    JsonType,
    BrokenJsonType
>(
    options: TableWidgetOptions<
        StateType,
        DataType,
        ContextType,
        ActionType,
        JsonType,
        BrokenJsonType
    >
): Page<
    TableWidgetPageState<StateType, DataType, ActionType> | null,
    TableWidgetPageAction<ActionType, DataType>
> {
    const base = TableWidgetPage(options);
    return {
        ...base,
        initialize(segments, parameters, context) {
            if (segments.length > 0) {
                return base.initialize(segments, parameters, context);
            } else {
                return {
                    state: null,
                    requests: [],
                };
            }
        },
        reduce(state, action, context) {
            switch (action.type) {
                case "UPDATE_PARAMETERS":
                    if (action.segments.length > 0) {
                        return base.initialize(
                            action.segments,
                            action.parameters,
                            context
                        );
                    } else {
                        return {
                            state: null,
                            requests: [],
                        };
                    }
                default:
                    if (state) {
                        return base.reduce(state, action, context);
                    } else {
                        return {
                            state: null,
                            requests: [],
                        };
                    }
            }
        },
        title(state, cache) {
            if (state) {
                return base.title(state, cache);
            } else {
                return "";
            }
        },
        component(props) {
            if (props.state) {
                return <base.component {...(props as any)} />;
            } else {
                return <></>;
            }
        },
        headerComponent(props) {
            if (props.state && base.headerComponent) {
                return <base.headerComponent {...(props as any)} />;
            } else {
                return <></>;
            }
        },
        hasUnsavedChanges(state) {
            if (state === null) {
                return false;
            } else {
                return base.hasUnsavedChanges(state);
            }
        },
        encodeState(state) {
            if (state) {
                return base.encodeState(state);
            } else {
                return {
                    parameters: {},
                    segments: [],
                };
            }
        },
        beforeUnload(state) {
            if (state) {
                return base.beforeUnload(state);
            } else {
                return false;
            }
        },
    };
}
