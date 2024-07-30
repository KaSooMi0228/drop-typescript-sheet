import { RecordMeta } from "../../clay/meta";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";

//!Data
export type Help = {
    id: UUID;
    code: string;
    recordVersion: Version;
    title: string;
    content: string;
};

// BEGIN MAGIC -- DO NOT EDIT
export type HelpJSON = {
    id: string;
    code: string;
    recordVersion: number | null;
    title: string;
    content: string;
};

export function JSONToHelp(json: HelpJSON): Help {
    return {
        id: { uuid: json.id },
        code: json.code,
        recordVersion: { version: json.recordVersion },
        title: json.title,
        content: json.content,
    };
}
export type HelpBrokenJSON = {
    id?: string;
    code?: string;
    recordVersion?: number | null;
    title?: string;
    content?: string;
};

export function newHelp(): Help {
    return JSONToHelp(repairHelpJSON(undefined));
}
export function repairHelpJSON(json: HelpBrokenJSON | undefined): HelpJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            code: json.code || "",
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            title: json.title || "",
            content: json.content || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            code: undefined || "",
            recordVersion: null,
            title: undefined || "",
            content: undefined || "",
        };
    }
}

export function HelpToJSON(value: Help): HelpJSON {
    return {
        id: value.id.uuid,
        code: value.code,
        recordVersion: value.recordVersion.version,
        title: value.title,
        content: value.content,
    };
}

export const HELP_META: RecordMeta<Help, HelpJSON, HelpBrokenJSON> & {
    name: "Help";
} = {
    name: "Help",
    type: "record",
    repair: repairHelpJSON,
    toJSON: HelpToJSON,
    fromJSON: JSONToHelp,
    fields: {
        id: { type: "uuid" },
        code: { type: "string" },
        recordVersion: { type: "version" },
        title: { type: "string" },
        content: { type: "string" },
    },
    userFacingKey: "title",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
