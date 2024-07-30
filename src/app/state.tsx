import * as React from "react";
import { Dictionary } from "../clay/common";
import { PageRequest } from "../clay/Page";
import { RequestHandle } from "../clay/requests";
import { RouterPageState } from "../clay/router-page";
import { UserPermissions } from "../clay/server/api";
import { ServerMessage, Status } from "../clay/service";

export type PrintStatus =
    | {
          type: "starting";
          id: string;
          template: string;
      }
    | {
          type: "finished";
          id: string;
          template: string;
          url?: string;
          error?: string;
          target: string[];
          offline?: boolean;
      };

export type State = {
    profile_image_url: string | null;
    email: string | null;
    user: null | UserPermissions;
    status: Status;
    pageState: RouterPageState;
    pendingRequests: Dictionary<RequestHandle<PageRequest, Action>>;
    dispatchedRequests: Dictionary<RequestHandle<PageRequest, Action>>;

    nextRequestId: number;
    errors: ServerMessage[];
    printing: PrintStatus[];
    waitingHash: string | null;
    visible: boolean;
};

export type Action =
    | {
          type: "SERVER_MESSAGE";
          message: ServerMessage;
      }
    | {
          type: "SERVER_OPEN";
      }
    | {
          type: "HASHCHANGE";
          hash: string;
      }
    | {
          type: "REQUESTS_DISPATCHED";
          requests: string[];
      }
    | {
          type: "PAGE";
          action: any;
      }
    | {
          type: "VISIBILITY_CHANGE";
          value: DocumentVisibilityState;
      }
    | {
          type: "CLOSE_ERROR";
          error: ServerMessage;
      }
    | {
          type: "PRINT_STARTED";
          id: string;
          template: string;
      }
    | {
          type: "PRINT_FINISHED";
          id: string;
          url?: string;
          error?: string;
          target: string[];
          offline?: boolean;
      }
    | {
          type: "CLOSE_PRINTING";
          id: string;
      };

export function isLoggedIn(state: State): boolean {
    if (state.user === null) {
        return false;
    }
    if (state.status.offline) {
        return !!state.status.cache;
    } else {
        return state.status.connected && state.status.currentToken !== null;
    }
}

export function createInitialState(): State {
    return {
        visible: true,
        profile_image_url: null,
        email: null,
        status: {
            connected: false,
            offline: false,
            pendingCount: 0,
            cache: null,
            currentToken: "",
        },
        user: null,
        nextRequestId: 0,
        pageState: {
            currentPage: "",
            currentPageState: {},
        },
        pendingRequests: {},
        dispatchedRequests: {},
        errors: [],
        printing: [],
        waitingHash: null,
    };
}

export const StateContext = React.createContext(createInitialState());

export function useUser(): UserPermissions {
    const state = React.useContext(StateContext);
    if (!state.user) {
        throw new Error("invariant violation");
    }
    return state.user;
}

export function useIsConnected(): boolean {
    const state = React.useContext(StateContext);
    if (!state.user) {
        throw new Error("invariant violation");
    }
    return state.status.connected;
}

export function useCurrentToken(): string {
    const state = React.useContext(StateContext);
    if (!state.user) {
        throw new Error("invariant violation");
    }
    return state.status.currentToken;
}
