import Decimal from "decimal.js";
import { Quantity } from "../../../clay/common";
import { RecordMeta } from "../../../clay/meta";
import { sumMap } from "../../../clay/queryFuncs";

//!Data
export type AdditionalRoom = {
    width: Quantity;
    height: Quantity;
    length: Quantity;
    multiply: Quantity;
    note: string;
};

//!Data
export type Room = {
    width: Quantity;
    height: Quantity;
    length: Quantity;
    note: string;

    additionalRooms: AdditionalRoom[];

    includeBaseboard: boolean;
    multiplyBaseboard: Quantity;

    includeChairRail: boolean;
    multiplyChairRail: Quantity;

    includeCrown: boolean;
    multiplyCrown: Quantity;

    includeCeiling: boolean;
    multiplyCeiling: Quantity;

    includeWalls: boolean;
    multiplyWalls: Quantity;
};

function areaCalc(
    include: boolean,
    multiply: Decimal,
    value: Decimal
): Decimal {
    if (include) {
        return multiply.times(value);
    } else {
        return new Decimal(0);
    }
}

export function resolveRoom(room: Room) {
    const applyRoom = (f: (room: AdditionalRoom) => Quantity) => {
        return sumMap(room.additionalRooms, (room) =>
            room.multiply.times(f(room))
        );
    };

    return {
        walls: areaCalc(
            room.includeWalls,
            room.multiplyWalls,
            applyRoom((room) =>
                room.width.plus(room.length).times(2).times(room.height)
            )
        ),
        ceiling: areaCalc(
            room.includeCeiling,
            room.multiplyCeiling,
            applyRoom((room) => room.width.times(room.length))
        ),
        baseboard: areaCalc(
            room.includeBaseboard,
            room.multiplyBaseboard,
            applyRoom((room) => room.width.plus(room.length).times(2))
        ),
        crown: areaCalc(
            room.includeCrown,
            room.multiplyCrown,
            applyRoom((room) => room.width.plus(room.length).times(2))
        ),
        chairRail: areaCalc(
            room.includeChairRail,
            room.multiplyChairRail,
            applyRoom((room) => room.width.plus(room.length).times(2))
        ),
    };
}

// BEGIN MAGIC -- DO NOT EDIT
export type AdditionalRoomJSON = {
    width: string;
    height: string;
    length: string;
    multiply: string;
    note: string;
};

export function JSONToAdditionalRoom(json: AdditionalRoomJSON): AdditionalRoom {
    return {
        width: new Decimal(json.width),
        height: new Decimal(json.height),
        length: new Decimal(json.length),
        multiply: new Decimal(json.multiply),
        note: json.note,
    };
}
export type AdditionalRoomBrokenJSON = {
    width?: string;
    height?: string;
    length?: string;
    multiply?: string;
    note?: string;
};

export function newAdditionalRoom(): AdditionalRoom {
    return JSONToAdditionalRoom(repairAdditionalRoomJSON(undefined));
}
export function repairAdditionalRoomJSON(
    json: AdditionalRoomBrokenJSON | undefined
): AdditionalRoomJSON {
    if (json) {
        return {
            width: json.width || "0",
            height: json.height || "0",
            length: json.length || "0",
            multiply: json.multiply || "0",
            note: json.note || "",
        };
    } else {
        return {
            width: undefined || "0",
            height: undefined || "0",
            length: undefined || "0",
            multiply: undefined || "0",
            note: undefined || "",
        };
    }
}

export function AdditionalRoomToJSON(
    value: AdditionalRoom
): AdditionalRoomJSON {
    return {
        width: value.width.toString(),
        height: value.height.toString(),
        length: value.length.toString(),
        multiply: value.multiply.toString(),
        note: value.note,
    };
}

export const ADDITIONAL_ROOM_META: RecordMeta<
    AdditionalRoom,
    AdditionalRoomJSON,
    AdditionalRoomBrokenJSON
> & { name: "AdditionalRoom" } = {
    name: "AdditionalRoom",
    type: "record",
    repair: repairAdditionalRoomJSON,
    toJSON: AdditionalRoomToJSON,
    fromJSON: JSONToAdditionalRoom,
    fields: {
        width: { type: "quantity" },
        height: { type: "quantity" },
        length: { type: "quantity" },
        multiply: { type: "quantity" },
        note: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type RoomJSON = {
    width: string;
    height: string;
    length: string;
    note: string;
    additionalRooms: AdditionalRoomJSON[];
    includeBaseboard: boolean;
    multiplyBaseboard: string;
    includeChairRail: boolean;
    multiplyChairRail: string;
    includeCrown: boolean;
    multiplyCrown: string;
    includeCeiling: boolean;
    multiplyCeiling: string;
    includeWalls: boolean;
    multiplyWalls: string;
};

export function JSONToRoom(json: RoomJSON): Room {
    return {
        width: new Decimal(json.width),
        height: new Decimal(json.height),
        length: new Decimal(json.length),
        note: json.note,
        additionalRooms: json.additionalRooms.map((inner) =>
            JSONToAdditionalRoom(inner)
        ),
        includeBaseboard: json.includeBaseboard,
        multiplyBaseboard: new Decimal(json.multiplyBaseboard),
        includeChairRail: json.includeChairRail,
        multiplyChairRail: new Decimal(json.multiplyChairRail),
        includeCrown: json.includeCrown,
        multiplyCrown: new Decimal(json.multiplyCrown),
        includeCeiling: json.includeCeiling,
        multiplyCeiling: new Decimal(json.multiplyCeiling),
        includeWalls: json.includeWalls,
        multiplyWalls: new Decimal(json.multiplyWalls),
    };
}
export type RoomBrokenJSON = {
    width?: string;
    height?: string;
    length?: string;
    note?: string;
    additionalRooms?: AdditionalRoomJSON[];
    includeBaseboard?: boolean;
    multiplyBaseboard?: string;
    includeChairRail?: boolean;
    multiplyChairRail?: string;
    includeCrown?: boolean;
    multiplyCrown?: string;
    includeCeiling?: boolean;
    multiplyCeiling?: string;
    includeWalls?: boolean;
    multiplyWalls?: string;
};

export function newRoom(): Room {
    return JSONToRoom(repairRoomJSON(undefined));
}
export function repairRoomJSON(json: RoomBrokenJSON | undefined): RoomJSON {
    if (json) {
        return {
            width: json.width || "0",
            height: json.height || "0",
            length: json.length || "0",
            note: json.note || "",
            additionalRooms: (json.additionalRooms || []).map((inner) =>
                repairAdditionalRoomJSON(inner)
            ),
            includeBaseboard: json.includeBaseboard || false,
            multiplyBaseboard: json.multiplyBaseboard || "0",
            includeChairRail: json.includeChairRail || false,
            multiplyChairRail: json.multiplyChairRail || "0",
            includeCrown: json.includeCrown || false,
            multiplyCrown: json.multiplyCrown || "0",
            includeCeiling: json.includeCeiling || false,
            multiplyCeiling: json.multiplyCeiling || "0",
            includeWalls: json.includeWalls || false,
            multiplyWalls: json.multiplyWalls || "0",
        };
    } else {
        return {
            width: undefined || "0",
            height: undefined || "0",
            length: undefined || "0",
            note: undefined || "",
            additionalRooms: (undefined || []).map((inner) =>
                repairAdditionalRoomJSON(inner)
            ),
            includeBaseboard: undefined || false,
            multiplyBaseboard: undefined || "0",
            includeChairRail: undefined || false,
            multiplyChairRail: undefined || "0",
            includeCrown: undefined || false,
            multiplyCrown: undefined || "0",
            includeCeiling: undefined || false,
            multiplyCeiling: undefined || "0",
            includeWalls: undefined || false,
            multiplyWalls: undefined || "0",
        };
    }
}

export function RoomToJSON(value: Room): RoomJSON {
    return {
        width: value.width.toString(),
        height: value.height.toString(),
        length: value.length.toString(),
        note: value.note,
        additionalRooms: value.additionalRooms.map((inner) =>
            AdditionalRoomToJSON(inner)
        ),
        includeBaseboard: value.includeBaseboard,
        multiplyBaseboard: value.multiplyBaseboard.toString(),
        includeChairRail: value.includeChairRail,
        multiplyChairRail: value.multiplyChairRail.toString(),
        includeCrown: value.includeCrown,
        multiplyCrown: value.multiplyCrown.toString(),
        includeCeiling: value.includeCeiling,
        multiplyCeiling: value.multiplyCeiling.toString(),
        includeWalls: value.includeWalls,
        multiplyWalls: value.multiplyWalls.toString(),
    };
}

export const ROOM_META: RecordMeta<Room, RoomJSON, RoomBrokenJSON> & {
    name: "Room";
} = {
    name: "Room",
    type: "record",
    repair: repairRoomJSON,
    toJSON: RoomToJSON,
    fromJSON: JSONToRoom,
    fields: {
        width: { type: "quantity" },
        height: { type: "quantity" },
        length: { type: "quantity" },
        note: { type: "string" },
        additionalRooms: { type: "array", items: ADDITIONAL_ROOM_META },
        includeBaseboard: { type: "boolean" },
        multiplyBaseboard: { type: "quantity" },
        includeChairRail: { type: "boolean" },
        multiplyChairRail: { type: "quantity" },
        includeCrown: { type: "boolean" },
        multiplyCrown: { type: "quantity" },
        includeCeiling: { type: "boolean" },
        multiplyCeiling: { type: "quantity" },
        includeWalls: { type: "boolean" },
        multiplyWalls: { type: "quantity" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
