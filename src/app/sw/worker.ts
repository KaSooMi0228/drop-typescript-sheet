import * as Sentry from "@sentry/react";
import { differenceInHours, parseISO } from "date-fns";
import EventEmitter from "events";
import { Dictionary } from "lodash";
import ReconnectingWebsocket from "reconnecting-websocket";
import "../../sentry";
import { grabLog, recordLog } from "../logger";
import {
    cacheUpdate,
    getCacheData,
    getCurrentToken,
    getCurrentUser,
    setCurrentToken,
    setCurrentUser,
} from "./cache";
import {
    CHANNEL,
    localResponse,
    localResponseOnline,
    localResponsePeek,
    pendingCount,
    pendingReturn,
    PENDING_RESOLVED,
    recordLocalPatch,
    resolvePending,
} from "./localResponse";

export const SERVICE_CHANNEL = new EventEmitter();

CHANNEL.addEventListener("message", (event) => {
    if (event.data.type !== "SEND_LOGS") {
        recordLog("broadcast", event.data);
    }
    switch (event.data.type) {
        case "REQUEST_LOGS":
            CHANNEL.postMessage({
                type: "SEND_LOGS",
                client: "shared-worker",
                log: grabLog(),
            });
            break;
        case "PENDING_RESOLVED":
            PENDING_RESOLVED.emit(event.data.key);
            break;
        case "ERROR":
            SERVICE_CHANNEL.emit("message", event.data);
            break;
    }
});

function connectToServer(): ReconnectingWebsocket {
    if ((global as any).window) {
        const url = new URL(window.location.origin);
        return new ReconnectingWebsocket(
            (url.protocol === "http:" ? "ws://" : "wss://") + url.host + "/api/"
        );
    } else {
        return {
            addEventListener() {},
        } as any;
    }
}

const serverConnection = connectToServer();

serverConnection.addEventListener("open", () => {
    const currentToken = getCurrentToken();
    if (currentToken !== null) {
        serverConnection.send(
            JSON.stringify({
                type: "SET_USER",
                token: currentToken,
            })
        );
        resolvePending(serverConnection);
    }
    emitStatus();
});

serverConnection.addEventListener("close", () => {
    emitStatus();
});

function isServerOnline() {
    return !window.location.search.startsWith("?offline");
}

const pendingRequests: Dictionary<any> = {};
let cacheAsked = false;
let loginStatus = "";

async function requestSync() {
    if (isServerOnline() && !cacheAsked) {
        cacheAsked = true;
        resolvePending(serverConnection);
        serverConnection.send(
            JSON.stringify({
                request: {
                    type: "OFFLINE",
                },
                id: "cache",
            })
        );
    }
}

async function checkHints(request: any) {
    switch (request.type) {
        case "STORE":
        case "LOCAL_STORE": {
            const status = {
                type: "INVALIDATE_CACHE",
                table: request.tableName,
                id: request.record.id,
            };
            CHANNEL.postMessage(status);
        }
        case "DELETE": {
            const status = {
                type: "INVALIDATE_CACHE",
                table: request.tableName,
                id: request.recordId,
            };
            CHANNEL.postMessage(status);
        }
        case "PATCH":
        case "LOCAL_PATCH": {
            const status = {
                type: "INVALIDATE_CACHE",
                table: request.tableName,
                id: request.id,
            };
            CHANNEL.postMessage(status);
        }
    }
}

async function emitStatus() {
    const cacheData = await getCacheData();

    if (
        cacheData &&
        cacheData.syncTime &&
        differenceInHours(new Date(), parseISO(cacheData.syncTime)) >= 1 &&
        !cacheAsked
    ) {
        requestSync();
    }

    const status = {
        type: "UPDATE_STATUS",
        status: {
            connected: serverConnection.readyState == WebSocket.OPEN,
            offline: !isServerOnline(),
            pendingCount: await pendingCount(),
            cache: cacheData,
            currentToken: getCurrentToken(),
            loginStatus,
        },
    };
    SERVICE_CHANNEL.emit("message", status);
}

async function onServerMessage(event: any) {
    const message = JSON.parse(event.data);
    recordLog("SERVER_MESSAGE", message);
    switch (message.type) {
        case "ERROR":
            if (message.id) {
                if (message.id.startsWith("pending@")) {
                    pendingReturn(serverConnection, message);
                    CHANNEL.postMessage(message);
                } else if (message.id === "cache") {
                    CHANNEL.postMessage(message);
                } else {
                    SERVICE_CHANNEL.emit("message", message);
                }
            } else {
                if (message.status === "AUTHENTICATION_FAILED") {
                    loginStatus = message.substatus;
                    setCurrentToken(null);
                    emitStatus();
                }
                console.error(message);
            }
            break;
        case "RESPONSE":
            if (message.id.startsWith("pending@")) {
                pendingReturn(serverConnection, message);
                emitStatus();
            } else if (message.id === "cache") {
                await cacheUpdate(message);
                cacheAsked = false;
                emitStatus();
            } else {
                const request = pendingRequests[message.id];
                delete pendingRequests[message.id];
                localResponsePeek(request, message.response);
                checkHints(request);
                SERVICE_CHANNEL.emit("message", message);
            }
            break;
        case "UPDATE_USER":
            await setCurrentUser(message.user);
            SERVICE_CHANNEL.emit("message", message);
            break;
    }
}

serverConnection.addEventListener("message", (x) => {
    onServerMessage(x);
});

async function processMessage(message: any) {
    switch (message.data.type) {
        case "SET_USER":
            {
                setCurrentToken(message.data.token);
                emitStatus();
                if (isServerOnline()) {
                    serverConnection.send(
                        JSON.stringify({
                            type: "SET_USER",
                            token: message.data.token,
                        })
                    );
                    resolvePending(serverConnection);
                }
            }
            break;
        case "LOGOUT":
            {
                setCurrentToken(null);
                if (isServerOnline()) {
                    serverConnection.send(
                        JSON.stringify({
                            type: "LOGOUT",
                        })
                    );
                }
            }
            break;
        case "LOCAL_STORE": {
            await localResponse({
                type: "STORE",
                ...message.data.request,
            });
            checkHints({
                type: "LOCAL_STORE",
                ...message.data.request,
            });
            emitStatus();
            break;
        }
        case "LOCAL_PATCH": {
            try {
                await recordLocalPatch(
                    {
                        type: "PATCH",
                        override: false,
                        ...message.data.request,
                    },
                    !isServerOnline()
                );
            } catch (error) {
                console.error(message.data);
                console.error(error);
                Sentry.captureException(error);
                SERVICE_CHANNEL.emit("message", {
                    type: "ERROR",
                    status: "Local Error",
                    id: message.data.id,
                    error: (error as any).toString(),
                });
            }
            SERVICE_CHANNEL.emit("message", {
                type: "RESPONSE",
                id: message.data.id,
                response: {},
            });
            checkHints({
                type: "LOCAL_PATCH",
                ...message.data.request,
            });
            emitStatus();
            break;
        }
        case "OFFLINE": {
            if (isServerOnline()) {
                cacheAsked = true;
                resolvePending(serverConnection);
                serverConnection.send(
                    JSON.stringify({
                        request: {
                            type: "OFFLINE",
                        },
                        id: "cache",
                    })
                );
            }
            break;
        }

        default:
            if (!isServerOnline()) {
                try {
                    const response = await localResponse(message.data.request);
                    SERVICE_CHANNEL.emit("message", {
                        type: "RESPONSE",
                        id: message.data.id,
                        response,
                    });
                    checkHints(message.data.request);
                } catch (error) {
                    console.error(message.data);
                    console.error(error);
                    Sentry.captureException(error);
                    SERVICE_CHANNEL.emit("message", {
                        type: "ERROR",
                        status: "Local Error",
                        id: message.data.id,
                        error: (error as any).toString(),
                    });
                }
                emitStatus();
            } else {
                await localResponseOnline(
                    serverConnection,
                    message.data.request
                );
                emitStatus();

                serverConnection.send(JSON.stringify(message.data));
                pendingRequests[message.data.id] = message.data.request;
            }
            break;
    }
}

export function processWorkerMessage(message: any) {
    recordLog("CLIENT_MESSAGE", {
        data: message,
        client: "client",
    });
    processMessage({
        data: message,
    });
}

export async function startWorker() {
    SERVICE_CHANNEL.emit("message", {
        type: "UPDATE_USER",
        user: await getCurrentUser(),
    });
    emitStatus();
}
