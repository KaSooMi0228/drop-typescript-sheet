import * as Sentry from "@sentry/react";
import { pickBy } from "lodash";
import {
    parse as parseQueryString,
    stringify as stringifyQueryString,
} from "querystring";
import { Link } from "../clay/link";
import { ReduceResult } from "../clay/Page";
import { RouterPageState } from "../clay/router-page";
import { UserPermissions } from "../clay/server/api";
import { ROOT_PAGE } from "./pages";
import { Action, isLoggedIn, State } from "./state";
import { User } from "./user/table";

type AppContext = {
    currentUserId: Link<User>;
    user: UserPermissions;
};

function reducePage(
    state: State,
    process: (detail: State) => ReduceResult<RouterPageState, any>
): State {
    const reduced = process(state);

    let nextRequestId = state.nextRequestId;
    let pendingRequests = state.pendingRequests;
    let dispatchedRequests = state.dispatchedRequests;

    for (const request of reduced.requests) {
        if (request.type === "RESET_REQUESTS") {
            pendingRequests = {};
            dispatchedRequests = {};
        } else {
            pendingRequests = {
                ...pendingRequests,
                [nextRequestId]: request,
            };
            nextRequestId += 1;
        }
    }
    return {
        ...state,
        nextRequestId,
        pageState: reduced.state,
        pendingRequests,
        dispatchedRequests,
    };
}

function parseHash(hash: string) {
    const question = hash.indexOf("?");
    if (question === -1) {
        while (hash.endsWith("/")) {
            hash = hash.slice(0, hash.length - 1);
        }

        return {
            segments: hash.split("/").slice(1),
            parameters: {},
        };
    } else {
        const parameters = parseQueryString(hash.slice(question + 1));
        hash = hash.slice(0, question);
        while (hash.endsWith("/")) {
            hash = hash.slice(0, hash.length - 1);
        }
        const segments = hash.split("/").slice(1);
        return {
            segments,
            parameters,
        };
    }
}

export function innerReducer(
    state: State,
    action: Action,
    context: AppContext
): State {
    switch (action.type) {
        case "PAGE":
            return reducePage(state, (state) => {
                return ROOT_PAGE.reduce(
                    state.pageState,
                    action.action,
                    context
                );
            });
        case "VISIBILITY_CHANGE":
            if (action.value === "visible" && isLoggedIn(state)) {
                return {
                    ...reducePage(state, (state) => {
                        return ROOT_PAGE.reduce(
                            state.pageState,
                            { type: "PAGE_ACTIVATED" },
                            context
                        );
                    }),

                    visible: true,
                };
            } else {
                return {
                    ...state,
                    visible: false,
                };
            }
        case "PRINT_STARTED":
            return {
                ...state,
                printing: [
                    {
                        type: "starting",
                        id: action.id,
                        template: action.template,
                    },
                    ...state.printing,
                ],
            };
        case "PRINT_FINISHED":
            return {
                ...state,
                printing: state.printing.map((status) =>
                    status.id === action.id
                        ? {
                              ...status,
                              type: "finished",
                              url: action.url,
                              target: action.target,
                              error: action.error,
                              offline: action.offline,
                          }
                        : status
                ),
            };
        case "CLOSE_PRINTING":
            return {
                ...state,
                printing: state.printing.filter(
                    (status) => status.id != action.id
                ),
            };

        case "CLOSE_ERROR":
            return {
                ...state,
                errors: state.errors.filter((error) => error !== action.error),
            };

        case "SERVER_MESSAGE":
            const message = action.message;
            switch (message.type) {
                case "UPDATE_STATUS": {
                    return {
                        ...state,
                        status: message.status,
                    };
                }
                case "UPDATE_USER":
                    return {
                        ...state,
                        user: message.user,
                        email: message.user?.email || null,
                    };

                case "RESPONSE":
                    state = reducePage(state, (state) => {
                        const request = state.dispatchedRequests[message.id];
                        if ((action as any).message.response.type === "ERROR") {
                            console.error("Request: ", request);
                            console.error("Error: ", action.message);
                        }
                        if (request) {
                            return ROOT_PAGE.reduce(
                                state.pageState,
                                (request as any).decorator(message.response),
                                context
                            );
                        } else {
                            return {
                                state: state.pageState,
                                requests: [],
                            };
                        }
                    });

                    return {
                        ...state,
                        dispatchedRequests: pickBy(
                            state.dispatchedRequests,
                            (_, key) => key !== message.id
                        ),
                    };
                case "ERROR": {
                    const request = state.dispatchedRequests[message.id];
                    const detail = {
                        request,
                        ...message,
                    };
                    Sentry.captureEvent({
                        message: message.status,
                        extra: detail,
                    });
                    return {
                        ...state,
                        errors: [detail, ...state.errors],
                    };
                }

                default:
                    return state;
            }
        case "REQUESTS_DISPATCHED":
            return {
                ...state,
                pendingRequests: pickBy(
                    state.pendingRequests,
                    (_, key) => action.requests.indexOf(key) === -1
                ),
                dispatchedRequests: {
                    ...state.dispatchedRequests,
                    ...pickBy(
                        state.pendingRequests,
                        (_, key) => action.requests.indexOf(key) !== -1
                    ),
                },
            };
        case "HASHCHANGE":
            if (state.user === null) {
                return {
                    ...state,
                    waitingHash: action.hash,
                };
            } else {
                const parsed_hash = parseHash(action.hash);
                return reducePage(
                    {
                        ...state,
                        waitingHash: null,
                    },
                    (currentPage) =>
                        ROOT_PAGE.reduce(
                            currentPage.pageState,
                            {
                                type: "UPDATE_PARAMETERS",
                                segments: parsed_hash.segments,
                                parameters: parsed_hash.parameters,
                            },
                            context
                        )
                );
            }
        default:
            return state;
    }
}

export function encodeState(state: State): string {
    const encodedState = ROOT_PAGE.encodeState(state.pageState);
    return `${["#", ...encodedState.segments].join(
        "/"
    )}/?${stringifyQueryString(encodedState.parameters)}`;
}

export function reducer(state: State, action: Action): State {
    const context: AppContext = {
        currentUserId: state.user !== null ? state.user.id : "",
        user: state.user || {
            id: "",
            email: "",
            permissions: [],
        },
    };
    state = innerReducer(state, action, context);

    if (state.user !== null && state.waitingHash !== null) {
        context.currentUserId = state.user.id;
        context.user = state.user;
        state = innerReducer(
            state,
            {
                type: "HASHCHANGE",
                hash: state.waitingHash,
            },
            context
        );
    }

    return state;
}
