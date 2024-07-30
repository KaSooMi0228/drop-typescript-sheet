import { RecordMeta } from "../../clay/meta";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";

//!Data
export type Role = {
    id: UUID;
    recordVersion: Version;
    azureId: string;

    name: string;
    permissions: string[];

    projectRole: boolean;
};

// BEGIN MAGIC -- DO NOT EDIT
export type RoleJSON = {
    id: string;
    recordVersion: number | null;
    azureId: string;
    name: string;
    permissions: string[];
    projectRole: boolean;
};

export function JSONToRole(json: RoleJSON): Role {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        azureId: json.azureId,
        name: json.name,
        permissions: json.permissions.map((inner) => inner),
        projectRole: json.projectRole,
    };
}
export type RoleBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    azureId?: string;
    name?: string;
    permissions?: string[];
    projectRole?: boolean;
};

export function newRole(): Role {
    return JSONToRole(repairRoleJSON(undefined));
}
export function repairRoleJSON(json: RoleBrokenJSON | undefined): RoleJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            azureId: json.azureId || "",
            name: json.name || "",
            permissions: (json.permissions || []).map((inner) => inner || ""),
            projectRole: json.projectRole || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            azureId: undefined || "",
            name: undefined || "",
            permissions: (undefined || []).map((inner) => inner || ""),
            projectRole: undefined || false,
        };
    }
}

export function RoleToJSON(value: Role): RoleJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        azureId: value.azureId,
        name: value.name,
        permissions: value.permissions.map((inner) => inner),
        projectRole: value.projectRole,
    };
}

export const ROLE_META: RecordMeta<Role, RoleJSON, RoleBrokenJSON> & {
    name: "Role";
} = {
    name: "Role",
    type: "record",
    repair: repairRoleJSON,
    toJSON: RoleToJSON,
    fromJSON: JSONToRole,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        azureId: { type: "string" },
        name: { type: "string" },
        permissions: { type: "array", items: { type: "string" } },
        projectRole: { type: "boolean" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
