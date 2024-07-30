import { RecordMeta } from "../clay/meta";
import { genUUID, UUID } from "../clay/uuid";
import { Version } from "../clay/version";

//!Data
export type Term = {
    id: UUID;
    recordVersion: Version;
    name: string;
};

// BEGIN MAGIC -- DO NOT EDIT
export type TermJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
};

export function JSONToTerm(json: TermJSON): Term {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
    };
}
export type TermBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
};

export function newTerm(): Term {
    return JSONToTerm(repairTermJSON(undefined));
}
export function repairTermJSON(json: TermBrokenJSON | undefined): TermJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
        };
    }
}

export function TermToJSON(value: Term): TermJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
    };
}

export const TERM_META: RecordMeta<Term, TermJSON, TermBrokenJSON> & {
    name: "Term";
} = {
    name: "Term",
    type: "record",
    repair: repairTermJSON,
    toJSON: TermToJSON,
    fromJSON: JSONToTerm,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
