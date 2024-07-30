import { Decimal } from "decimal.js";
import { Quantity } from "../../../clay/common";
import { RecordMeta } from "../../../clay/meta";
import { genUUID, UUID } from "../../../clay/uuid";
import {
    JSONToSide,
    repairSideJSON,
    Side,
    SideJSON,
    SideToJSON,
    SIDE_META,
} from "../side/table";

//!Data
export type Area = {
    id: UUID;
    name: string;
    phase: Quantity;
    count: Quantity;
    unitCount: Quantity;
    sides: Side[];
};

// BEGIN MAGIC -- DO NOT EDIT
export type AreaJSON = {
    id: string;
    name: string;
    phase: string;
    count: string;
    unitCount: string;
    sides: SideJSON[];
};

export function JSONToArea(json: AreaJSON): Area {
    return {
        id: { uuid: json.id },
        name: json.name,
        phase: new Decimal(json.phase),
        count: new Decimal(json.count),
        unitCount: new Decimal(json.unitCount),
        sides: json.sides.map((inner) => JSONToSide(inner)),
    };
}
export type AreaBrokenJSON = {
    id?: string;
    name?: string;
    phase?: string;
    count?: string;
    unitCount?: string;
    sides?: SideJSON[];
};

export function newArea(): Area {
    return JSONToArea(repairAreaJSON(undefined));
}
export function repairAreaJSON(json: AreaBrokenJSON | undefined): AreaJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            phase: json.phase || "0",
            count: json.count || "0",
            unitCount: json.unitCount || "0",
            sides: (json.sides || []).map((inner) => repairSideJSON(inner)),
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            phase: undefined || "0",
            count: undefined || "0",
            unitCount: undefined || "0",
            sides: (undefined || []).map((inner) => repairSideJSON(inner)),
        };
    }
}

export function AreaToJSON(value: Area): AreaJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        phase: value.phase.toString(),
        count: value.count.toString(),
        unitCount: value.unitCount.toString(),
        sides: value.sides.map((inner) => SideToJSON(inner)),
    };
}

export const AREA_META: RecordMeta<Area, AreaJSON, AreaBrokenJSON> & {
    name: "Area";
} = {
    name: "Area",
    type: "record",
    repair: repairAreaJSON,
    toJSON: AreaToJSON,
    fromJSON: JSONToArea,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        phase: { type: "quantity" },
        count: { type: "quantity" },
        unitCount: { type: "quantity" },
        sides: { type: "array", items: SIDE_META },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
