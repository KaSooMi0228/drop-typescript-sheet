import {
    DeleteRecordResult,
    EditingRequest,
    EditingResponse,
    FilterDetail,
    HistoryRequest,
    HistoryResult,
    QueryTableResult,
    ReadRecordResult,
    ReadRecordsResult,
    Record,
    RevertRecord,
    StoreRecordResult,
} from "../../clay/server/api";
import * as React from "react";

export type RequestType<TypeId, DetailsType, ResultType> = {
    type: TypeId;
    request: DetailsType;
    result: ResultType;
};

export type RequestHandle<T extends RequestType<{}, {}, {}>, ActionType> = {
    type: T["type"];
    request: T["request"];
    decorator: (result: T["result"]) => ActionType;
};

export type BareRequestHandle<T extends RequestType<{}, {}, {}>> = {
    type: T["type"];
    request: T["request"];
};

export function BareRequest<T extends RequestType<{}, {}, {}>>(
    type: T["type"],
    request: T["request"]
): BareRequestHandle<T> {
    return {
        type,
        request,
    };
}

export function Request<T extends RequestType<{}, {}, {}>, ActionType>(
    type: T["type"],
    request: T["request"],
    decorator: (result: T["result"]) => ActionType
): RequestHandle<T, ActionType> {
    return {
        type,
        request,
        decorator,
    };
}

export type NullRequest = {
    type: "NULL";
    request: {};
    result: {};
};

export type RecordsRequest = {
    type: "RECORDS";
    request: {
        tableName: string;
    };
    result: ReadRecordsResult;
};

export type RedirectHashRequest = {
    type: "REDIRECT_HASH";
    request: string;
    result: {};
};

export type TimeoutRequest = {
    type: "TIMEOUT";
    request: number;
    result: {};
};

export type OpenHashRequest = {
    type: "OPEN_HASH";
    request: string;
    result: any;
};

export type PrintRequest = {
    type: "PRINT";
    request: {
        template: string;
        id: string;
        parameters: string[];
    };
    result: any;
};

export type QueryRequest = {
    type: "QUERY";
    request: {
        tableName: string;
        columns: string[];
        sorts?: string[];
        filters?: FilterDetail[];
        limit?: number;
        segment?: string;
    };
    result: QueryTableResult;
};

export type StoreRequest = {
    type: "STORE";
    request: {
        tableName: string;
        form: string;
        record: Record;
    };
    result: StoreRecordResult;
};

export type PatchRequest = {
    type: "PATCH";
    request: {
        tableName: string;
        form: string;
        id: string;
        patches: any[];
        patchIds: string[];
        override: boolean;
    };
    result: StoreRecordResult;
};

export type LocalStoreRequest = {
    type: "LOCAL_STORE";
    request: {
        tableName: string;
        form: string;
        record: Record;
    };
    result: {};
};

export type LocalPatchRequest = {
    type: "LOCAL_PATCH";
    request: {
        tableName: string;
        form: string;
        id: string;
        patches: any[];
        patchIds: string[];
    };
    result: {};
};

export type RecordRequest = {
    type: "RECORD";
    request: {
        tableName: string;
        recordId: string;
    };
    result: ReadRecordResult;
};

export type FetchHistoryRequest = {
    type: "FETCH_HISTORY";
    request: HistoryRequest;
    result: HistoryResult;
};

export type RevertRecordRequest = {
    type: "REVERT";
    request: RevertRecord;
    result: StoreRecordResult | DeleteRecordResult;
};

export type FinishedRequest = {
    type: "FINISHED";
    request: any;
    result: {};
};

export type DeleteRequest = {
    type: "DELETE";
    request: {
        tableName: string;
        form: string;
        recordId: string;
    };
    result: DeleteRecordResult;
};

export type EditingRecordRequest = {
    type: "EDIT";
    request: EditingRequest;
    result: EditingResponse;
};

export function transformRequest<
    ThisRequestType extends RequestType<{}, {}, {}>,
    OldAction,
    NewAction
>(
    handle: RequestHandle<ThisRequestType, OldAction>,
    transform: (x: OldAction) => NewAction
): RequestHandle<ThisRequestType, NewAction> {
    return {
        type: handle.type,
        request: handle.request,
        decorator: (inner) => transform(handle.decorator(inner)),
    };
}

export function castRequest<
    OldRequestType extends NewRequestType,
    NewRequestType extends RequestType<{}, {}, {}>,
    ActionType
>(
    request: RequestHandle<OldRequestType, ActionType>
): RequestHandle<NewRequestType, ActionType> {
    return {
        type: request.type,
        request: request.request,
        decorator: request.decorator,
    };
}
