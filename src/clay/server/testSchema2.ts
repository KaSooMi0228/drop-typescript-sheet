import Decimal from "decimal.js";
import { Dictionary, Quantity } from "../common";
import { LocalDate } from "../LocalDate";
import { RecordMeta } from "../meta";
import { genUUID, UUID } from "../uuid";
import { Version } from "../version";

//!Data
export type Person = {
    name: string;
    happy: boolean;
    age: Quantity;
    favoriteColor: string;
    holiday: LocalDate | null;
};

//!Data
export type Family = {
    id: UUID;
    recordVersion: Version;

    mother: Person;
    father: Person;
    children: Person[];
    surname: string;
    currentLocation: string;
};

//!Tables
export type Tables = [Family];

// BEGIN MAGIC -- DO NOT EDIT
export type PersonJSON = {
    name: string;
    happy: boolean;
    age: string;
    favoriteColor: string;
    holiday: string | null;
};

export function JSONToPerson(json: PersonJSON): Person {
    return {
        name: json.name,
        happy: json.happy,
        age: new Decimal(json.age),
        favoriteColor: json.favoriteColor,
        holiday: json.holiday !== null ? LocalDate.parse(json.holiday) : null,
    };
}
export type PersonBrokenJSON = {
    name?: string;
    happy?: boolean;
    age?: string;
    favoriteColor?: string;
    holiday?: string | null;
};

export function newPerson(): Person {
    return JSONToPerson(repairPersonJSON(undefined));
}
export function repairPersonJSON(
    json: PersonBrokenJSON | undefined
): PersonJSON {
    if (json) {
        return {
            name: json.name || "",
            happy: json.happy || false,
            age: json.age || "0",
            favoriteColor: json.favoriteColor || "",
            holiday: json.holiday || null,
        };
    } else {
        return {
            name: undefined || "",
            happy: undefined || false,
            age: undefined || "0",
            favoriteColor: undefined || "",
            holiday: undefined || null,
        };
    }
}

export function PersonToJSON(value: Person): PersonJSON {
    return {
        name: value.name,
        happy: value.happy,
        age: value.age.toString(),
        favoriteColor: value.favoriteColor,
        holiday: value.holiday !== null ? value.holiday.toString() : null,
    };
}

export const PERSON_META: RecordMeta<Person, PersonJSON, PersonBrokenJSON> & {
    name: "Person";
} = {
    name: "Person",
    type: "record",
    repair: repairPersonJSON,
    toJSON: PersonToJSON,
    fromJSON: JSONToPerson,
    fields: {
        name: { type: "string" },
        happy: { type: "boolean" },
        age: { type: "quantity" },
        favoriteColor: { type: "string" },
        holiday: { type: "date" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type FamilyJSON = {
    id: string;
    recordVersion: number | null;
    mother: PersonJSON;
    father: PersonJSON;
    children: PersonJSON[];
    surname: string;
    currentLocation: string;
};

export function JSONToFamily(json: FamilyJSON): Family {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        mother: JSONToPerson(json.mother),
        father: JSONToPerson(json.father),
        children: json.children.map((inner) => JSONToPerson(inner)),
        surname: json.surname,
        currentLocation: json.currentLocation,
    };
}
export type FamilyBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    mother?: PersonJSON;
    father?: PersonJSON;
    children?: PersonJSON[];
    surname?: string;
    currentLocation?: string;
};

export function newFamily(): Family {
    return JSONToFamily(repairFamilyJSON(undefined));
}
export function repairFamilyJSON(
    json: FamilyBrokenJSON | undefined
): FamilyJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            mother: repairPersonJSON(json.mother),
            father: repairPersonJSON(json.father),
            children: (json.children || []).map((inner) =>
                repairPersonJSON(inner)
            ),
            surname: json.surname || "",
            currentLocation: json.currentLocation || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            mother: repairPersonJSON(undefined),
            father: repairPersonJSON(undefined),
            children: (undefined || []).map((inner) => repairPersonJSON(inner)),
            surname: undefined || "",
            currentLocation: undefined || "",
        };
    }
}

export function FamilyToJSON(value: Family): FamilyJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        mother: PersonToJSON(value.mother),
        father: PersonToJSON(value.father),
        children: value.children.map((inner) => PersonToJSON(inner)),
        surname: value.surname,
        currentLocation: value.currentLocation,
    };
}

export const FAMILY_META: RecordMeta<Family, FamilyJSON, FamilyBrokenJSON> & {
    name: "Family";
} = {
    name: "Family",
    type: "record",
    repair: repairFamilyJSON,
    toJSON: FamilyToJSON,
    fromJSON: JSONToFamily,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        mother: PERSON_META,
        father: PERSON_META,
        children: { type: "array", items: PERSON_META },
        surname: { type: "string" },
        currentLocation: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export const TABLES_META: Dictionary<RecordMeta<any, any, any>> = {
    Family: FAMILY_META,
};

// END MAGIC -- DO NOT EDIT
