import { ParsedUrlQuery } from "querystring";
import { Dictionary } from "./common";
import { Page, PageContext, ReduceResult } from "./Page";
import * as React from "react";

type State = {
    currentPage: string;
    currentPageState: any;
};
export type RouterPageState = State;

export function RouterPage(
    pages: Dictionary<Page<any, any>>
): Page<State, any> {
    function initialize(
        segments: string[],
        parameters: ParsedUrlQuery,
        context: PageContext
    ): ReduceResult<State, any> {
        const currentPageId = segments[0] || "";

        const inner = pages[currentPageId];

        if (!inner) {
            throw new Error("unknown page: " + currentPageId);
        }

        const innerResult = inner.initialize(
            segments.slice(1),
            parameters,
            context
        );

        return {
            state: {
                currentPage: currentPageId,
                currentPageState: innerResult.state,
            },
            requests: [
                {
                    type: "RESET_REQUESTS",
                    request: {},
                    decorator: () => {
                        throw new Error("unexpected");
                    },
                },
                ...innerResult.requests,
            ],
        };
    }

    return {
        initialize,
        reduce(state: State, action: any, context: PageContext) {
            if (action.type === "UPDATE_PARAMETERS") {
                const currentPageId = action.segments[0] || "";
                if (currentPageId != state.currentPage) {
                    return initialize(
                        action.segments,
                        action.parameters,
                        context
                    );
                } else {
                    // change action to remove first segment and continue on regular reduce
                    action = {
                        ...action,
                        segments: action.segments.slice(1),
                    };
                }
            }

            const innerResult = pages[state.currentPage].reduce(
                state.currentPageState,
                action,
                context
            );
            return {
                state: {
                    ...state,
                    currentPageState: innerResult.state,
                },
                requests: innerResult.requests,
            };
        },
        component(props) {
            const InnerComponent = pages[props.state.currentPage].component;
            return (
                <InnerComponent
                    {...props}
                    state={props.state.currentPageState}
                />
            );
        },
        beforeUnload(state) {
            return pages[state.currentPage].beforeUnload(
                state.currentPageState
            );
        },
        title(state, cache) {
            return pages[state.currentPage].title(
                state.currentPageState,
                cache
            );
        },
        hasUnsavedChanges(state) {
            return pages[state.currentPage].hasUnsavedChanges(
                state.currentPageState
            );
        },
        encodeState(state) {
            const inner = pages[state.currentPage].encodeState(
                state.currentPageState
            );
            return {
                segments: [state.currentPage, ...inner.segments],
                parameters: inner.parameters,
            };
        },
        headerComponent(props) {
            const InnerHeader = pages[props.state.currentPage].headerComponent;
            return (
                <>
                    {InnerHeader && (
                        <InnerHeader
                            {...props}
                            state={props.state.currentPageState}
                        />
                    )}
                </>
            );
        },
    };
}
