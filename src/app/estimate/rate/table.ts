import Decimal from "decimal.js";
import { Quantity } from "../../../clay/common";
import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { genUUID, UUID } from "../../../clay/uuid";
import { UnitType } from "../types/table";

//!Data
export type Rate = {
    id: UUID;
    name: string;
    hours: Quantity;
    materials: Quantity;
    unitType: Link<UnitType>;
    unitIncrement: Quantity;
};

// BEGIN MAGIC -- DO NOT EDIT
export type RateJSON = {
    id: string;
    name: string;
    hours: string;
    materials: string;
    unitType: string | null;
    unitIncrement: string;
};

export function JSONToRate(json: RateJSON): Rate {
    return {
        id: { uuid: json.id },
        name: json.name,
        hours: new Decimal(json.hours),
        materials: new Decimal(json.materials),
        unitType: json.unitType,
        unitIncrement: new Decimal(json.unitIncrement),
    };
}
export type RateBrokenJSON = {
    id?: string;
    name?: string;
    hours?: string;
    materials?: string;
    unitType?: string | null;
    unitIncrement?: string;
};

export function newRate(): Rate {
    return JSONToRate(repairRateJSON(undefined));
}
export function repairRateJSON(json: RateBrokenJSON | undefined): RateJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            hours: json.hours || "0",
            materials: json.materials || "0",
            unitType: json.unitType || null,
            unitIncrement: json.unitIncrement || "0",
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            hours: undefined || "0",
            materials: undefined || "0",
            unitType: undefined || null,
            unitIncrement: undefined || "0",
        };
    }
}

export function RateToJSON(value: Rate): RateJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        hours: value.hours.toString(),
        materials: value.materials.toString(),
        unitType: value.unitType,
        unitIncrement: value.unitIncrement.toString(),
    };
}

export const RATE_META: RecordMeta<Rate, RateJSON, RateBrokenJSON> & {
    name: "Rate";
} = {
    name: "Rate",
    type: "record",
    repair: repairRateJSON,
    toJSON: RateToJSON,
    fromJSON: JSONToRate,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        hours: { type: "quantity" },
        materials: { type: "quantity" },
        unitType: { type: "uuid", linkTo: "UnitType" },
        unitIncrement: { type: "quantity" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
