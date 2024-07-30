import { Link } from "../../../clay/link";
import { LocalDate } from "../../../clay/LocalDate";
import { RecordMeta } from "../../../clay/meta";
import { User } from "../../user/table";

//!Data
export type Locked = {
    value: string;
    date: LocalDate | null;
    user: Link<User>;
};

// BEGIN MAGIC -- DO NOT EDIT
export type LockedJSON = {
    value: string;
    date: string | null;
    user: string | null;
};

export function JSONToLocked(json: LockedJSON): Locked {
    return {
        value: json.value,
        date: json.date !== null ? LocalDate.parse(json.date) : null,
        user: json.user,
    };
}
export type LockedBrokenJSON = {
    value?: string;
    date?: string | null;
    user?: string | null;
};

export function newLocked(): Locked {
    return JSONToLocked(repairLockedJSON(undefined));
}
export function repairLockedJSON(
    json: LockedBrokenJSON | undefined
): LockedJSON {
    if (json) {
        return {
            value: json.value || "",
            date: json.date || null,
            user: json.user || null,
        };
    } else {
        return {
            value: undefined || "",
            date: undefined || null,
            user: undefined || null,
        };
    }
}

export function LockedToJSON(value: Locked): LockedJSON {
    return {
        value: value.value,
        date: value.date !== null ? value.date.toString() : null,
        user: value.user,
    };
}

export const LOCKED_META: RecordMeta<Locked, LockedJSON, LockedBrokenJSON> & {
    name: "Locked";
} = {
    name: "Locked",
    type: "record",
    repair: repairLockedJSON,
    toJSON: LockedToJSON,
    fromJSON: JSONToLocked,
    fields: {
        value: { type: "string" },
        date: { type: "date" },
        user: { type: "uuid", linkTo: "User" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
