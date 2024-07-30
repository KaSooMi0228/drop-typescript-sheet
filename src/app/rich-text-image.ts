import { decode as b64decode, encode as b64encode } from "base64-arraybuffer";
import { RecordMeta } from "../clay/meta";
import { genUUID, UUID } from "../clay/uuid";
import { Version } from "../clay/version";

//!Data
export type RichTextImage = {
    id: UUID;
    recordVersion: Version;
    name: string;
    data: ArrayBuffer;
};

// BEGIN MAGIC -- DO NOT EDIT
export type RichTextImageJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    data: string;
};

export function JSONToRichTextImage(json: RichTextImageJSON): RichTextImage {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        data: b64decode(json.data),
    };
}
export type RichTextImageBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    data?: string;
};

export function newRichTextImage(): RichTextImage {
    return JSONToRichTextImage(repairRichTextImageJSON(undefined));
}
export function repairRichTextImageJSON(
    json: RichTextImageBrokenJSON | undefined
): RichTextImageJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            data: json.data || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            data: undefined || "",
        };
    }
}

export function RichTextImageToJSON(value: RichTextImage): RichTextImageJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        data: b64encode(value.data),
    };
}

export const RICH_TEXT_IMAGE_META: RecordMeta<
    RichTextImage,
    RichTextImageJSON,
    RichTextImageBrokenJSON
> & { name: "RichTextImage" } = {
    name: "RichTextImage",
    type: "record",
    repair: repairRichTextImageJSON,
    toJSON: RichTextImageToJSON,
    fromJSON: JSONToRichTextImage,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        data: { type: "binary" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
