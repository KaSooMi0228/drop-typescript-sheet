import * as Sentry from "@sentry/react";
import "fixed-data-table-2/dist/fixed-data-table.css";
import "jsondiffpatch/dist/formatters-styles/html.css";
import { isEmpty } from "lodash";
import * as React from "react";
import "react-bootstrap-typeahead/css/Typeahead.css";
import { createRoot } from "react-dom/client";
import ReactModal from "react-modal";
import { Provider, useSelector } from "react-redux";
import "react-resizable/css/styles.css";
import "react-tagsinput/react-tagsinput.css";
import { applyMiddleware, compose, createStore, Store } from "redux";
import { devToolsEnhancer } from "redux-devtools-extension";
import { PRINT_EVENTS } from "../clay/api";
import { DndWrapper } from "../clay/dnd";
import { PageRequest } from "../clay/Page";
import { QuickCache, useQuickCache } from "../clay/quick-cache";
import { RequestHandle, RequestType } from "../clay/requests";
import { ServerMessage } from "../clay/service";
import "../sentry";
import App from "./App";
import "./client.css";
import { recordLog } from "./logger";
import { Authentication } from "./msal.config";
import { ROOT_PAGE } from "./pages";
import { encodeState, reducer } from "./reducer";
import { SERVICE } from "./service";
import { Action, createInitialState, State } from "./state";

if (typeof Node === "function" && Node.prototype) {
    const originalRemoveChild = Node.prototype.removeChild;
    (Node as any).prototype.removeChild = function (child: any) {
        if (child.parentNode !== this) {
            if (console) {
                console.error(
                    "Cannot remove a child from a different parent",
                    child,
                    this
                );
            }
            return child;
        }
        return (originalRemoveChild as any).apply(this, arguments);
    };

    const originalInsertBefore = Node.prototype.insertBefore;
    (Node as any).prototype.insertBefore = function (
        newNode: any,
        referenceNode: any
    ) {
        if (referenceNode && referenceNode.parentNode !== this) {
            if (console) {
                console.error(
                    "Cannot insert before a reference node from a different parent",
                    referenceNode,
                    this
                );
            }
            return newNode;
        }
        return (originalInsertBefore as any).apply(this, arguments);
    };
}

function dropsheetMiddleware({ getState }: any) {
    return (next: any) => (action: any) => {
        recordLog("ACTION", action);
        const result = next(action);
        recordLog("STATE", getState());
        return result;
    };
}

const store: Store<State, Action> = createStore(
    reducer as any,
    createInitialState() as any,
    compose(
        devToolsEnhancer({ name: "Dropsheet Main" }),
        applyMiddleware(dropsheetMiddleware)
    )
);

window.addEventListener("hashchange", () => {
    const state = store.getState();
    if (state.waitingHash !== null) {
        return;
    }
    const correctHash = encodeState(state);
    if (correctHash !== null && window.location.hash !== correctHash) {
        store.dispatch({
            type: "HASHCHANGE",
            hash: window.location.hash,
        });
    }
});

SERVICE.on("message", (message: ServerMessage) => {
    store.dispatch({
        type: "SERVER_MESSAGE",
        message,
    });
});

type Extended<T extends RequestType<{}, {}, {}>, A> = T extends any
    ? RequestHandle<T, A>
    : never;

const subwindowRequestIds: { subWindow: Window; requestId: string }[] = [];

window.addEventListener("message", (event) => {
    for (const request of subwindowRequestIds) {
        if (request.subWindow === event.source) {
            store.dispatch({
                type: "SERVER_MESSAGE",
                message: {
                    type: "RESPONSE",
                    id: request.requestId,
                    response: event.data,
                },
            });
        }
    }
});

function dispatchRequest<A>(
    requestId: string,
    request: Extended<PageRequest, A>,
    currentToken: string
): boolean {
    switch (request.type) {
        case "RECORDS":
        case "RECORD":
        case "QUERY":
        case "STORE":
        case "DELETE":
        case "FETCH_HISTORY":
        case "REVERT":
        case "PATCH":
            SERVICE.send({
                request: {
                    type: request.type,
                    ...request.request,
                },
                id: requestId,
            });
            return true;
        case "LOCAL_PATCH":
        case "LOCAL_STORE":
            SERVICE.send({
                type: request.type,
                request: request.request,
                id: requestId,
            });
            return true;
        case "REDIRECT_HASH":
            window.location.hash = request.request;
            return true;
        case "OPEN_HASH":
            const subWindow = window.open(request.request);
            if (subWindow) {
                subwindowRequestIds.push({ subWindow, requestId });
            }
            return true;
        case "PRINT":
            window.open(
                "/print/" +
                    request.request.template +
                    "/" +
                    request.request.id +
                    "/" +
                    request.request.parameters.join("/") +
                    "?token=" +
                    currentToken
            );
            return true;
        case "FINISHED":
            if (window.opener) {
                window.opener.postMessage(
                    request.request,
                    location.protocol + "//" + location.host
                );
            }
            setTimeout(() => window.close(), 1000);
            return true;
        case "TIMEOUT":
            setTimeout(() => {
                store.dispatch({
                    type: "SERVER_MESSAGE",
                    message: {
                        type: "RESPONSE",
                        id: requestId,
                        response: {},
                    },
                });
            }, request.request);
            return true;
        case "EDIT":
            return true;
        case "NULL":
        case "RESET_REQUESTS":
            throw new Error("Should not be created");
    }
}

store.subscribe(() => {
    const state = store.getState();

    if (state.user !== null && !isEmpty(state.pendingRequests)) {
        for (const [requestId, request] of Object.entries(
            state.pendingRequests
        )) {
            dispatchRequest(
                requestId,
                request as any,
                state.status.currentToken
            );
        }
        store.dispatch({
            type: "REQUESTS_DISPATCHED",
            requests: Object.keys(state.pendingRequests),
        });
    }
    if (state.waitingHash !== null) {
        return;
    }
    const correctHash = encodeState(state);
    if (correctHash !== null && window.location.hash !== correctHash) {
        window.location.hash = correctHash;
    }

    Sentry.configureScope((scope) => {
        scope.setUser({
            id: (state.user && state.user.id) || undefined,
            email: state.email || undefined,
        });
    });
});

function SetPageTitle() {
    const pageState = useSelector<State, State["pageState"]>(
        (state) => state.pageState
    );
    const cache = useQuickCache();
    const baseTitle = ROOT_PAGE.title(pageState, cache);
    const title =
        (ROOT_PAGE.hasUnsavedChanges(pageState) ? "* " : "") + baseTitle;
    React.useEffect(() => {
        document.title = title;
    }, [title]);
    return <></>;
}

store.dispatch({
    type: "HASHCHANGE",
    hash: window.location.hash,
});

const element = document.createElement("div");
document.body.appendChild(element);
ReactModal.setAppElement(element);

const root = createRoot(element);
root.render(
    <React.StrictMode>
        <DndWrapper>
            <Provider store={store}>
                <QuickCache>
                    <Authentication>
                        <SetPageTitle />
                        <App />
                    </Authentication>
                </QuickCache>
            </Provider>
        </DndWrapper>
    </React.StrictMode>
);

document.addEventListener("visibilitychange", () => {
    store.dispatch({
        type: "VISIBILITY_CHANGE",
        value: document.visibilityState,
    });
});

PRINT_EVENTS.addListener(
    "started",
    (event: { id: string; template: string }) => {
        store.dispatch({
            type: "PRINT_STARTED",
            ...event,
        });
    }
);

PRINT_EVENTS.addListener(
    "finished",
    (event: { id: string; url?: string; error?: string; target: string[] }) => {
        store.dispatch({
            type: "PRINT_FINISHED",
            ...event,
        });
    }
);

const UNSAVED_MESSAGE = "There are unsaved changes";

window.addEventListener("beforeunload", (event) => {
    const state = store.getState();

    if (ROOT_PAGE.beforeUnload(state.pageState)) {
        return null;
    }

    if (process.env.NODE_ENV === "production" || true) {
        if (ROOT_PAGE.hasUnsavedChanges(state.pageState)) {
            event.returnValue = UNSAVED_MESSAGE;
            return UNSAVED_MESSAGE;
        } else {
            return null;
        }
    } else {
        return null;
    }
});
