import { Link } from "../../clay/link";
import { LocalDate } from "../../clay/LocalDate";
import { RecordMeta } from "../../clay/meta";
import { User } from "../user/table";

//!Data
export type DatedString = {
    text: string;
    user: Link<User>;
    date: LocalDate | null;
};

// BEGIN MAGIC -- DO NOT EDIT
export type DatedStringJSON = {
    text: string;
    user: string | null;
    date: string | null;
};

export function JSONToDatedString(json: DatedStringJSON): DatedString {
    return {
        text: json.text,
        user: json.user,
        date: json.date !== null ? LocalDate.parse(json.date) : null,
    };
}
export type DatedStringBrokenJSON = {
    text?: string;
    user?: string | null;
    date?: string | null;
};

export function newDatedString(): DatedString {
    return JSONToDatedString(repairDatedStringJSON(undefined));
}
export function repairDatedStringJSON(
    json: DatedStringBrokenJSON | undefined
): DatedStringJSON {
    if (json) {
        return {
            text: json.text || "",
            user: json.user || null,
            date: json.date || null,
        };
    } else {
        return {
            text: undefined || "",
            user: undefined || null,
            date: undefined || null,
        };
    }
}

export function DatedStringToJSON(value: DatedString): DatedStringJSON {
    return {
        text: value.text,
        user: value.user,
        date: value.date !== null ? value.date.toString() : null,
    };
}

export const DATED_STRING_META: RecordMeta<
    DatedString,
    DatedStringJSON,
    DatedStringBrokenJSON
> & { name: "DatedString" } = {
    name: "DatedString",
    type: "record",
    repair: repairDatedStringJSON,
    toJSON: DatedStringToJSON,
    fromJSON: JSONToDatedString,
    fields: {
        text: { type: "string" },
        user: { type: "uuid", linkTo: "User" },
        date: { type: "date" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
