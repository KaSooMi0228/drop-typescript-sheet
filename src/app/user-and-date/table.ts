import dateParse from "date-fns/parseISO";
import { Link } from "../../clay/link";
import { RecordMeta } from "../../clay/meta";
import { User } from "../user/table";

//!Data
export type UserAndDate = {
    user: Link<User>;
    date: Date | null;
};

// BEGIN MAGIC -- DO NOT EDIT
export type UserAndDateJSON = {
    user: string | null;
    date: string | null;
};

export function JSONToUserAndDate(json: UserAndDateJSON): UserAndDate {
    return {
        user: json.user,
        date: json.date !== null ? dateParse(json.date) : null,
    };
}
export type UserAndDateBrokenJSON = {
    user?: string | null;
    date?: string | null;
};

export function newUserAndDate(): UserAndDate {
    return JSONToUserAndDate(repairUserAndDateJSON(undefined));
}
export function repairUserAndDateJSON(
    json: UserAndDateBrokenJSON | undefined
): UserAndDateJSON {
    if (json) {
        return {
            user: json.user || null,
            date: json.date ? new Date(json.date!).toISOString() : null,
        };
    } else {
        return {
            user: undefined || null,
            date: undefined ? new Date(undefined!).toISOString() : null,
        };
    }
}

export function UserAndDateToJSON(value: UserAndDate): UserAndDateJSON {
    return {
        user: value.user,
        date: value.date !== null ? value.date.toISOString() : null,
    };
}

export const USER_AND_DATE_META: RecordMeta<
    UserAndDate,
    UserAndDateJSON,
    UserAndDateBrokenJSON
> & { name: "UserAndDate" } = {
    name: "UserAndDate",
    type: "record",
    repair: repairUserAndDateJSON,
    toJSON: UserAndDateToJSON,
    fromJSON: JSONToUserAndDate,
    fields: {
        user: { type: "uuid", linkTo: "User" },
        date: { type: "datetime" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
