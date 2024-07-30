export interface Record {
    id: string;
    recordVersion: number | null;
    [key: string]: any;
}

export type ReadRecordResult = {
    record: Record | null;
};

export type ReadRecordsResult = {
    records: Record[];
};

export type DeleteRecordResult = {
    recordId: string;
};

export type QueryTableResult = {
    rows: ({} | null)[][];
    full_count: number;
};

export type StoreRecordResult = {
    record: Record;
    generate?: GenerateResponse;
};

export type GenerateRequest = {
    template: string;
    parameters: string[];
    sendEmails: boolean;
};

export type GenerateResponse = {
    url?: string;
    target: string[];
    error?: string;
};

export type HistoryRequest = {
    tableName?: string;
    recordId?: string;
    userId?: string;
    userKey?: string;
    fromDate?: string;
    toDate?: string;
    id?: string;
};

export type RevertRecord = {
    tableName: string;
    id: string;
    recordVersion: number;
};

export type HistoryResult = {
    changes: {
        tableName: string;
        id: string;
        userName: string;
        form: string;
        changedTime: string;
        userKey: string;
        deleted: boolean;
        recordVersion: number;
        diff: any;
    }[];
};

export interface ColumnFilter {
    like?: string;
    equal?: {} | null;
    not_equal?: {} | null;
    in?: Array<{} | null>;
    greater?: {};
    lesser?: {};
    intersects?: Array<{} | null>;
    ignore_case?: boolean;
}

export type FilterDetail =
    | {
          column: string;
          filter: ColumnFilter;
      }
    | {
          or: FilterDetail[];
      }
    | {
          and: FilterDetail[];
      }
    | {
          not: FilterDetail;
      };

export type EditingRequest = {
    tableName: string;
    id: string;
};

export type EditingResponse = {
    editors: {
        userId: string;
        username: string;
        timestamp: string;
    }[];
};

export type Request = {
    id: string;
    request:
        | {
              type: "RECORDS";
              tableName: string;
          }
        | {
              type: "QUERY";
              tableName: string;
              columns: string[];
              sorts?: string[];
              filters?: FilterDetail[];
              limit?: number;
              segment?: string;
          }
        | {
              type: "RECORD";
              tableName: string;
              recordId: string;
          }
        | {
              type: "STORE";
              tableName: string;
              form: string;
              record: Record;
          }
        | {
              type: "PATCH";
              tableName: string;
              id: string;
              form: string;
              patchIds: string[];
              patches: any[];
              override: boolean;
          }
        | {
              type: "DELETE";
              tableName: string;
              form: string;
              recordId: string;
          }
        | ({
              type: "FETCH_HISTORY";
          } & HistoryRequest)
        | ({
              type: "REVERT";
          } & RevertRecord)
        | ({
              type: "EDIT";
          } & EditingRequest)
        | ({ type: "GENERATE" } & GenerateRequest);
};

export type UserPermissions = {
    id: string;
    email: string;
    permissions: string[];
};
