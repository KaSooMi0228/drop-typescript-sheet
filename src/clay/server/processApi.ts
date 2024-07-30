import ajv from "ajv";
import { ClientBase, Pool } from "pg";
import { TABLES_META } from "../../app/tables";
import { generateDocument } from "../../server/print";
import PRINTABLES from "../../server/printables";
import { Request, UserPermissions } from "./api";
import { Context } from "./context";
import deleteRecord from "./deleteRecord";
import editRecord from "./editRecord";
import { ServerError } from "./error";
import fetchHistory from "./fetchHistory";
import patchRecord from "./patchRecord";
import queryTable from "./queryTable";
import readRecord, { readRecords } from "./readRecord";
import revertRecord from "./revertRecord";
import storeRecord from "./storeRecord";

const BASE_SCHEMA = {
    type: "object",
    required: ["id", "request"],
    additionalProperties: false,
    properties: {
        request: {
            type: "object",
            required: ["type"],
            properties: {
                type: {
                    type: "string",
                    enum: [
                        "RECORDS",
                        "QUERY",
                        "RECORD",
                        "STORE",
                        "DELETE",
                        "FETCH_HISTORY",
                        "REVERT",
                        "EDIT",
                        "PATCH",
                        "GENERATE",
                    ],
                },
            },
        },
        id: {
            type: "string",
        },
    },
};

const validator = new ajv();
validator.addSchema(BASE_SCHEMA, "base");
validator.addSchema(
    {
        type: "object",
        additionalProperties: false,
        required: ["type", "tableName"],
        properties: {
            type: {
                type: "string",
                enum: ["RECORDS"],
            },
            tableName: {
                type: "string",
                enum: Object.keys(TABLES_META),
            },
        },
    },
    "RECORDS"
);

validator.addSchema(
    {
        type: "object",
        additionalProperties: false,
        required: ["type", "tableName", "columns"],
        properties: {
            type: {
                type: "string",
                enum: ["QUERY"],
            },
            tableName: {
                type: "string",
                enum: Object.keys(TABLES_META),
            },
            filters: {
                type: "array",
                items: {
                    type: "object",
                },
            },
            columns: {
                type: "array",
                items: {
                    type: "string",
                },
            },
            sorts: {
                type: "array",
                items: {
                    type: "string",
                },
            },
            limit: {
                type: "integer",
            },
            segment: {
                type: "string",
            },
        },
    },
    "QUERY"
);
validator.addSchema(
    {
        type: "object",
        additionalProperties: false,
        required: ["type", "tableName", "recordId"],
        properties: {
            type: {
                type: "string",
                enum: ["RECORD"],
            },
            tableName: {
                type: "string",
                enum: Object.keys(TABLES_META),
            },
            recordId: {
                type: "string",
                pattern:
                    "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}",
            },
        },
    },
    "RECORD"
);
validator.addSchema(
    {
        type: "object",
        additionalProperties: false,
        required: ["type", "tableName", "id", "recordVersion"],
        properties: {
            type: {
                type: "string",
                enum: ["REVERT"],
            },
            tableName: {
                type: "string",
                enum: Object.keys(TABLES_META),
            },
            id: {
                type: "string",
                pattern:
                    "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}",
            },
            recordVersion: {
                type: "integer",
            },
        },
    },
    "REVERT"
);
validator.addSchema(
    {
        type: "object",
        additionalProperties: false,
        required: ["type", "tableName", "id"],
        properties: {
            type: {
                type: "string",
                enum: ["EDIT"],
            },
            tableName: {
                type: "string",
                enum: Object.keys(TABLES_META),
            },
            id: {
                type: "string",
                pattern:
                    "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}",
            },
        },
    },
    "EDIT"
);
validator.addSchema(
    {
        type: "object",
        additionalProperties: false,
        required: ["type", "tableName", "record", "form"],
        properties: {
            type: {
                type: "string",
                enum: ["STORE"],
            },
            tableName: {
                type: "string",
                enum: Object.keys(TABLES_META),
            },
            form: {
                type: "string",
            },
            record: {
                type: "object",
                required: ["id"],
                properties: {
                    id: {
                        type: "string",
                        pattern:
                            "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}",
                    },
                },
            },
        },
    },
    "STORE"
);
validator.addSchema(
    {
        type: "object",
        additionalProperties: false,
        required: [
            "type",
            "tableName",
            "patches",
            "patchIds",
            "form",
            "id",
            "override",
        ],
        properties: {
            type: {
                type: "string",
                enum: ["PATCH"],
            },
            tableName: {
                type: "string",
                enum: Object.keys(TABLES_META),
            },
            form: {
                type: "string",
            },
            id: {
                type: "string",
                pattern:
                    "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}",
            },
            override: {
                type: "boolean",
            },
            patches: {
                type: "array",
            },
            patchIds: {
                type: "array",
                items: {
                    type: "string",
                    pattern:
                        "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}",
                },
            },
            __previousSend: {},
        },
    },
    "PATCH"
);
validator.addSchema(
    {
        type: "object",
        additionalProperties: false,
        required: ["type", "tableName", "recordId", "form"],
        properties: {
            type: {
                type: "string",
                enum: ["DELETE"],
            },
            tableName: {
                type: "string",
                enum: Object.keys(TABLES_META),
            },
            form: {
                type: "string",
            },
            recordId: {
                type: "string",
                pattern:
                    "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}",
            },
        },
    },
    "DELETE"
);

validator.addSchema(
    {
        type: "object",
        additionalProperties: false,
        required: ["type"],
        properties: {
            type: {
                type: "string",
                enum: ["FETCH_HISTORY"],
            },
            tableName: {
                type: "string",
                enum: Object.keys(TABLES_META),
            },
            id: {
                type: "string",
                pattern:
                    "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}",
            },
            userId: {
                type: "string",
                pattern:
                    "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}",
            },
            userKey: {
                type: "string",
            },
            fromDate: {
                type: "string",
                pattern: "[0-9]{4}-[0-9]{2}-[0-9]{2}",
            },
            toDate: {
                type: "string",
                pattern: "[0-9]{4}-[0-9]{2}-[0-9]{2}",
            },
        },
    },
    "FETCH_HISTORY"
);

validator.addSchema(
    {
        type: "object",
        additionalProperties: false,
        required: ["type", "sendEmails"],
        properties: {
            type: {
                type: "string",
                enum: ["GENERATE"],
            },
            sendEmails: {
                type: "boolean",
            },
            template: {
                type: "string",
                enum: Object.keys(PRINTABLES),
            },
            parameters: {
                type: "array",
                items: {
                    type: "string",
                },
            },
        },
    },
    "GENERATE"
);

async function processRequest(
    request: Request,
    client: ClientBase,
    context: Context,
    user: UserPermissions,
    pool: Pool
): Promise<{}> {
    switch (request.request.type) {
        case "RECORDS":
            return await readRecords(
                client,
                context,
                user,
                request.request.tableName
            );
        case "QUERY":
            return await queryTable({
                client,
                context,
                user,
                tableName: request.request.tableName,
                columns: request.request.columns,
                sorts: request.request.sorts || [],
                filters: request.request.filters,
                limit: request.request.limit,
                segment: request.request.segment,
            });
        case "RECORD":
            return await readRecord(
                client,
                context,
                user,
                request.request.tableName,
                request.request.recordId
            );
        case "STORE":
            return await storeRecord({
                client,
                context,
                user,
                tableName: request.request.tableName,
                record: request.request.record,
                form: request.request.form,
                dateTime: new Date(),
            });
        case "PATCH":
            return await patchRecord({
                client,
                context,
                user,
                tableName: request.request.tableName,
                id: request.request.id,
                patchIds: request.request.patchIds,
                patches: request.request.patches,
                form: request.request.form,
                dateTime: new Date(),
                override: request.request.override,
            });
        case "DELETE":
            return await deleteRecord({
                client,
                context,
                user,
                tableName: request.request.tableName,
                id: request.request.recordId,
                form: request.request.form,
                dateTime: new Date(),
            });
        case "FETCH_HISTORY":
            return await fetchHistory(client, context, user, request.request);
        case "REVERT":
            return revertRecord(
                client,
                context,
                user,
                new Date(),
                request.request
            );
        case "EDIT":
            return editRecord(
                client,
                context,
                user,
                new Date(),
                request.request
            );
        case "GENERATE":
            return await generateDocument(
                pool,
                context,
                user,
                request.request.template,
                request.request.parameters,
                request.request.sendEmails
            );
    }
}

export default async function processApi(
    pool: Pool,
    context: Context,
    rawRequest: {},
    user: UserPermissions
) {
    if (!validator.validate("base", rawRequest)) {
        throw new ServerError({
            status: "INVALID_REQUEST",
            errors: validator.errors,
            request: rawRequest,
        });
    }

    const request = rawRequest as Request;

    if (!validator.validate(request.request.type, request.request)) {
        console.log(request.request.type);
        throw new ServerError({
            status: "INVALID_REQUEST",
            errors: validator.errors,
            request: rawRequest,
        });
    }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const response = await processRequest(
            request,
            client,
            context,
            user,
            pool
        );
        await client.query("COMMIT");
        return {
            id: request.id,
            type: "RESPONSE",
            response,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
