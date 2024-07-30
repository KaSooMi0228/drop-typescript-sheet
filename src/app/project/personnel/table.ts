import dateParse from "date-fns/parseISO";
import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { Role } from "../../roles/table";
import { User } from "../../user/table";

//!Data
export type ProjectPersonnel = {
    user: Link<User>;
    role: Link<Role>;
    assignedBy: Link<User>;
    assignedDate: Date | null;
    accepted: boolean;
    acceptedDate: Date | null;
};

// BEGIN MAGIC -- DO NOT EDIT
export type ProjectPersonnelJSON = {
    user: string | null;
    role: string | null;
    assignedBy: string | null;
    assignedDate: string | null;
    accepted: boolean;
    acceptedDate: string | null;
};

export function JSONToProjectPersonnel(
    json: ProjectPersonnelJSON
): ProjectPersonnel {
    return {
        user: json.user,
        role: json.role,
        assignedBy: json.assignedBy,
        assignedDate:
            json.assignedDate !== null ? dateParse(json.assignedDate) : null,
        accepted: json.accepted,
        acceptedDate:
            json.acceptedDate !== null ? dateParse(json.acceptedDate) : null,
    };
}
export type ProjectPersonnelBrokenJSON = {
    user?: string | null;
    role?: string | null;
    assignedBy?: string | null;
    assignedDate?: string | null;
    accepted?: boolean;
    acceptedDate?: string | null;
};

export function newProjectPersonnel(): ProjectPersonnel {
    return JSONToProjectPersonnel(repairProjectPersonnelJSON(undefined));
}
export function repairProjectPersonnelJSON(
    json: ProjectPersonnelBrokenJSON | undefined
): ProjectPersonnelJSON {
    if (json) {
        return {
            user: json.user || null,
            role: json.role || null,
            assignedBy: json.assignedBy || null,
            assignedDate: json.assignedDate
                ? new Date(json.assignedDate!).toISOString()
                : null,
            accepted: json.accepted || false,
            acceptedDate: json.acceptedDate
                ? new Date(json.acceptedDate!).toISOString()
                : null,
        };
    } else {
        return {
            user: undefined || null,
            role: undefined || null,
            assignedBy: undefined || null,
            assignedDate: undefined ? new Date(undefined!).toISOString() : null,
            accepted: undefined || false,
            acceptedDate: undefined ? new Date(undefined!).toISOString() : null,
        };
    }
}

export function ProjectPersonnelToJSON(
    value: ProjectPersonnel
): ProjectPersonnelJSON {
    return {
        user: value.user,
        role: value.role,
        assignedBy: value.assignedBy,
        assignedDate:
            value.assignedDate !== null
                ? value.assignedDate.toISOString()
                : null,
        accepted: value.accepted,
        acceptedDate:
            value.acceptedDate !== null
                ? value.acceptedDate.toISOString()
                : null,
    };
}

export const PROJECT_PERSONNEL_META: RecordMeta<
    ProjectPersonnel,
    ProjectPersonnelJSON,
    ProjectPersonnelBrokenJSON
> & { name: "ProjectPersonnel" } = {
    name: "ProjectPersonnel",
    type: "record",
    repair: repairProjectPersonnelJSON,
    toJSON: ProjectPersonnelToJSON,
    fromJSON: JSONToProjectPersonnel,
    fields: {
        user: { type: "uuid", linkTo: "User" },
        role: { type: "uuid", linkTo: "Role" },
        assignedBy: { type: "uuid", linkTo: "User" },
        assignedDate: { type: "datetime" },
        accepted: { type: "boolean" },
        acceptedDate: { type: "datetime" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
