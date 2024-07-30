import { UserPermissions } from "./clay/server/api";

export function hasPermission(
    user: UserPermissions,
    table: string,
    permission: string
): boolean {
    return user.permissions.indexOf(`${table}-${permission}`) !== -1;
}
