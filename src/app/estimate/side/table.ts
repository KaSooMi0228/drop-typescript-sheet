import { Decimal } from "decimal.js";
import { Quantity } from "../../../clay/common";
import { RecordMeta } from "../../../clay/meta";
import {
    JSONToSideAction,
    repairSideActionJSON,
    SideAction,
    SideActionJSON,
    SideActionToJSON,
    SIDE_ACTION_META,
} from "../action/table";
import {
    JSONToRoom,
    repairRoomJSON,
    Room,
    RoomJSON,
    RoomToJSON,
    ROOM_META,
} from "./room";

//!Data
export type Side = {
    name: string;
    multiply: Quantity;
    actions: SideAction[];
    room: Room;
};

// BEGIN MAGIC -- DO NOT EDIT
export type SideJSON = {
    name: string;
    multiply: string;
    actions: SideActionJSON[];
    room: RoomJSON;
};

export function JSONToSide(json: SideJSON): Side {
    return {
        name: json.name,
        multiply: new Decimal(json.multiply),
        actions: json.actions.map((inner) => JSONToSideAction(inner)),
        room: JSONToRoom(json.room),
    };
}
export type SideBrokenJSON = {
    name?: string;
    multiply?: string;
    actions?: SideActionJSON[];
    room?: RoomJSON;
};

export function newSide(): Side {
    return JSONToSide(repairSideJSON(undefined));
}
export function repairSideJSON(json: SideBrokenJSON | undefined): SideJSON {
    if (json) {
        return {
            name: json.name || "",
            multiply: json.multiply || "0",
            actions: (json.actions || []).map((inner) =>
                repairSideActionJSON(inner)
            ),
            room: repairRoomJSON(json.room),
        };
    } else {
        return {
            name: undefined || "",
            multiply: undefined || "0",
            actions: (undefined || []).map((inner) =>
                repairSideActionJSON(inner)
            ),
            room: repairRoomJSON(undefined),
        };
    }
}

export function SideToJSON(value: Side): SideJSON {
    return {
        name: value.name,
        multiply: value.multiply.toString(),
        actions: value.actions.map((inner) => SideActionToJSON(inner)),
        room: RoomToJSON(value.room),
    };
}

export const SIDE_META: RecordMeta<Side, SideJSON, SideBrokenJSON> & {
    name: "Side";
} = {
    name: "Side",
    type: "record",
    repair: repairSideJSON,
    toJSON: SideToJSON,
    fromJSON: JSONToSide,
    fields: {
        name: { type: "string" },
        multiply: { type: "quantity" },
        actions: { type: "array", items: SIDE_ACTION_META },
        room: ROOM_META,
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
