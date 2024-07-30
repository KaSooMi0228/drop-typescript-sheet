import { Decimal } from "decimal.js";
import { Money, Percentage } from "../../../clay/common";
import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { genUUID, UUID } from "../../../clay/uuid";
import { Area } from "../area/table";

//!Data
export type Allowance = {
    id: UUID;
    name: string;
    cost: Money;
    markup: Money;
    areas: Link<Area>[];
};

export function allowanceCost(allowance: Allowance) {
    const multiplier =
        allowance.areas.length === 0 ? 1 : allowance.areas.length;
    return allowance.cost.times(multiplier);
}

export function allowancePrice(allowance: Allowance, markup: Percentage) {
    return allowanceCost(allowance)
        .times(
            new Decimal(1)
                .plus(allowance.markup)
                .times(new Decimal(1).plus(markup))
        )
        .toDecimalPlaces(2);
}

// BEGIN MAGIC -- DO NOT EDIT
export type AllowanceJSON = {
    id: string;
    name: string;
    cost: string;
    markup: string;
    areas: (string | null)[];
};

export function JSONToAllowance(json: AllowanceJSON): Allowance {
    return {
        id: { uuid: json.id },
        name: json.name,
        cost: new Decimal(json.cost),
        markup: new Decimal(json.markup),
        areas: json.areas.map((inner) => inner),
    };
}
export type AllowanceBrokenJSON = {
    id?: string;
    name?: string;
    cost?: string;
    markup?: string;
    areas?: (string | null)[];
};

export function newAllowance(): Allowance {
    return JSONToAllowance(repairAllowanceJSON(undefined));
}
export function repairAllowanceJSON(
    json: AllowanceBrokenJSON | undefined
): AllowanceJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            cost: json.cost || "0",
            markup: json.markup || "0",
            areas: (json.areas || []).map((inner) => inner || null),
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            cost: undefined || "0",
            markup: undefined || "0",
            areas: (undefined || []).map((inner) => inner || null),
        };
    }
}

export function AllowanceToJSON(value: Allowance): AllowanceJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        cost: value.cost.toString(),
        markup: value.markup.toString(),
        areas: value.areas.map((inner) => inner),
    };
}

export const ALLOWANCE_META: RecordMeta<
    Allowance,
    AllowanceJSON,
    AllowanceBrokenJSON
> & { name: "Allowance" } = {
    name: "Allowance",
    type: "record",
    repair: repairAllowanceJSON,
    toJSON: AllowanceToJSON,
    fromJSON: JSONToAllowance,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        cost: { type: "money" },
        markup: { type: "money" },
        areas: { type: "array", items: { type: "uuid", linkTo: "Area" } },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
