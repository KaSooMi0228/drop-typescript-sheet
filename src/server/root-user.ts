import { TABLES_META } from "../app/tables";

export const ROOT_USER = {
    id: "c7d4d727-276d-43b0-8449-8c13d905887b",
    email: "winstone@remdal.com",
    permissions: Object.keys(TABLES_META).flatMap((tableName) => [
        tableName + "-read",
        tableName + "-write",
        tableName + "-new",
        tableName + "-delete",
    ]),
};
