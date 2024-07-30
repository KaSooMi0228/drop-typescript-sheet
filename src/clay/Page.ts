import {} from "googlemaps";
import { ParsedUrlQuery } from "querystring";
import * as React from "react";
import { useUser } from "../app/state";
import { User } from "../app/user/table";
import { Dictionary } from "./common";
import { Link } from "./link";
import { QuickCacheApi } from "./quick-cache";
import {
    DeleteRequest,
    EditingRecordRequest,
    FetchHistoryRequest,
    FinishedRequest,
    LocalPatchRequest,
    LocalStoreRequest,
    NullRequest,
    OpenHashRequest,
    PatchRequest,
    PrintRequest,
    QueryRequest,
    RecordRequest,
    RecordsRequest,
    RedirectHashRequest,
    RequestHandle,
    RevertRecordRequest,
    StoreRequest,
    TimeoutRequest,
} from "./requests";
import { UserPermissions } from "./server/api";

export type ResetRequestsRequest = {
    type: "RESET_REQUESTS";
    request: any;
    result: {};
};
export type PageRequest =
    | RecordsRequest
    | RedirectHashRequest
    | QueryRequest
    | StoreRequest
    | FinishedRequest
    | DeleteRequest
    | RecordRequest
    | OpenHashRequest
    | NullRequest
    | TimeoutRequest
    | LocalStoreRequest
    | ResetRequestsRequest
    | PrintRequest
    | FetchHistoryRequest
    | RevertRecordRequest
    | EditingRecordRequest
    | PatchRequest
    | LocalPatchRequest;

export type BaseAction =
    | {
          type: "UPDATE_PARAMETERS";
          segments: string[];
          parameters: ParsedUrlQuery;
      }
    | {
          type: "PAGE_ACTIVATED";
      }
    | {
          type: "HEARTBEAT";
      };

export type PageContext = {
    currentUserId: Link<User>;
    user: UserPermissions;
};

export function usePageContext(): PageContext {
    const user = useUser();
    return {
        currentUserId: user.id,
        user,
    };
}

export type Page<State, Action> = {
    initialize: (
        segments: string[],
        parameters: ParsedUrlQuery,
        context: PageContext
    ) => ReduceResult<State, Action>;
    reduce: (
        state: State,
        action: BaseAction | Action,
        context: PageContext
    ) => ReduceResult<State, Action>;
    component: React.SFC<{ state: State; dispatch: (action: Action) => void }>;

    encodeState: (state: State) => {
        segments: string[];
        parameters: Dictionary<string>;
    };

    title: (state: State, cache: QuickCacheApi) => string;
    headerComponent: React.SFC<{
        state: State;
        dispatch: (action: Action) => void;
    }>;
    hasUnsavedChanges: (state: State) => boolean;

    beforeUnload: (state: State) => boolean;
};

export type ReduceResult<State, Action> = {
    state: State;
    requests: RequestHandle<PageRequest, Action>[];
};

export type PageState<T extends Page<any, any>> = ReturnType<
    T["reduce"]
>["state"];
export type PageAction<T extends Page<any, any>> = T["reduce"] extends (
    state: infer X,
    action: infer Y,
    ...args: any[]
) => {}
    ? Y
    : never;
