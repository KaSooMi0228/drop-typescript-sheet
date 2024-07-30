import { EventEmitter } from "events";
import { recordLog } from "../app/logger";
import { Dictionary } from "../clay/common";
import { UserPermissions } from "../clay/server/api";
import * as React from "react";

export type Status = {
    connected: boolean;
    offline: boolean;
    pendingCount: number;
    cache: {
        syncTime: string;
    } | null;
    currentToken: string;
};

export type ServerMessage =
    | {
          type: "UPDATE_USER";
          user: UserPermissions | null;
      }
    | {
          type: "RESPONSE";
          id: string;
          response: {};
      }
    | {
          type: "ERROR";
          status: string;
          id: string;
      }
    | {
          type: "UPDATE_STATUS";
          status: Status;
      };

export type Connection = {
    send: (message: any) => void;
    listen: (callback: (message: any) => void) => void;
};

export type AuthenticationUser = {
    id_token: string;
    email: string;
    image: string;
};

export class StandardService extends EventEmitter {
    _connection: Promise<Connection>;
    _handlers: Dictionary<{
        resolve: (response: any) => void;
        reject: (response: any) => void;
        message: any;
    }>;
    tokens: Dictionary<number>;

    constructor(connection: Promise<Connection>) {
        super();
        this._handlers = {};
        this._connection = connection.then((connection) => {
            connection.listen(this._handleMessage.bind(this));
            return connection;
        });
        this.tokens = {};
    }

    userChange(user: AuthenticationUser | null) {
        if (!user) {
            this.send({
                type: "LOGOUT",
            });
        } else {
            this.send({
                type: "SET_USER",
                token: user.id_token,
            });
        }
    }

    _handleMessage(message: any) {
        recordLog("service-message", message);
        if (message.type === "RESPONSE") {
            const handler = this._handlers[message.id];
            if (handler !== undefined) {
                delete this._handlers[message.id];
                handler.resolve(message.response);
            }
            this.emit("message", message);
        } else if (message.type === "ERROR") {
            const handler = this._handlers[message.id];
            if (handler !== undefined) {
                delete this._handlers[message.id];
                this.emit("message", { ...message, request: handler.message });
                handler.reject("server error");
            } else {
                this.emit("message", message);
            }
        } else if (message.type === "INVALIDATE_CACHE") {
            this.emit("cache-change", message);
        } else if (message.type === "UPDATE_USER" && message.user) {
            this.emit("message", message);
        } else {
            this.emit("message", message);
        }
    }

    async send(message: any): Promise<any> {
        (await this._connection).send(message);
        if (message.id !== undefined) {
            return new Promise((resolve, reject) => {
                this._handlers[message.id] = { resolve, reject, message };
            });
        }
    }

    sync() {
        this.send({
            type: "OFFLINE",
        });
    }
}

export function openDirectConnection(): Promise<Connection> {
    return new Promise((resolve, reject) => {
        const socket = new WebSocket(
            (window.location.protocol === "http:" ? "ws:" : "wss:") +
                "//" +
                window.location.host +
                "/api/"
        );

        socket.addEventListener("open", function () {
            resolve({
                send: (message: any) => socket.send(JSON.stringify(message)),
                listen: (callback: any) =>
                    socket.addEventListener("message", (event) =>
                        callback(JSON.parse(event.data))
                    ),
            });
        });

        socket.addEventListener("close", function () {
            forceReload("close-socket");
        });
    });
}

export function forceReload(reason: string) {
    window.localStorage.setItem(
        "dropsheet-reloaded",
        JSON.stringify({
            reason: reason,
            date: new Date().toISOString(),
        })
    );
    //window.location.reload();
}
