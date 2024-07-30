import { RecordMeta } from "../../clay/meta";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";

//!Data
export type ContactType = {
    id: UUID;
    recordVersion: Version;
    name: string;
    useSiteAddress: boolean;
    common: boolean;
};

// BEGIN MAGIC -- DO NOT EDIT
export type ContactTypeJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    useSiteAddress: boolean;
    common: boolean;
};

export function JSONToContactType(json: ContactTypeJSON): ContactType {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        useSiteAddress: json.useSiteAddress,
        common: json.common,
    };
}
export type ContactTypeBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    useSiteAddress?: boolean;
    common?: boolean;
};

export function newContactType(): ContactType {
    return JSONToContactType(repairContactTypeJSON(undefined));
}
export function repairContactTypeJSON(
    json: ContactTypeBrokenJSON | undefined
): ContactTypeJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            useSiteAddress: json.useSiteAddress || false,
            common: json.common || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            useSiteAddress: undefined || false,
            common: undefined || false,
        };
    }
}

export function ContactTypeToJSON(value: ContactType): ContactTypeJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        useSiteAddress: value.useSiteAddress,
        common: value.common,
    };
}

export const CONTACT_TYPE_META: RecordMeta<
    ContactType,
    ContactTypeJSON,
    ContactTypeBrokenJSON
> & { name: "ContactType" } = {
    name: "ContactType",
    type: "record",
    repair: repairContactTypeJSON,
    toJSON: ContactTypeToJSON,
    fromJSON: JSONToContactType,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        useSiteAddress: { type: "boolean" },
        common: { type: "boolean" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
