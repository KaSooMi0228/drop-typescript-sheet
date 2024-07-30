import { hasPermission } from "../../permissions";
import { UserPermissions } from "./api";

type ErrorDetail = {
    status: string;
};

export class ServerError<T extends ErrorDetail> extends Error {
    detail: {};
    constructor(detail: T) {
        super(detail.status);
        this.detail = detail;

        Object.setPrototypeOf(this, ServerError.prototype);
    }
}

export function verifyPermission(
    user: UserPermissions,
    table: string,
    permission: string
) {
    if (!hasPermission(user, table, permission)) {
        throw new ServerError({
            status: "PERMISSION_DENIED: " + table + "-" + permission,
            table,
            permission,
        });
    }
}
