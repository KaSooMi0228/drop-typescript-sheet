import { Decimal } from "decimal.js";
import { Money } from "../../../clay/common";
import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { genUUID, UUID } from "../../../clay/uuid";
import { Allowance } from "../allowances/table";
import { Area } from "../area/table";

//!Data
export type Schedule = {
    id: UUID;
    name: string;
};

//!Data
export type ItemListing = {
    items: string[];
    removed: string[];
    custom: boolean;
};

//!Data
export type Photo = {
    name: string;
    url: string;
};

//!Data
export type OptionBuilding = {
    building: Link<Area>;
    include: boolean;
};

//!Data
export type OptionAction = {
    status: "Include" | "Hidden" | "Exclude";
    schedule: Link<Schedule>;
};

//!Data
export type OptionAllowance = {
    allowance: Link<Allowance>;
    schedule: Link<Schedule>;
    include: boolean;
};

//!Data
export type Option = {
    id: UUID;

    baseBid: boolean;
    name: string;
    description: string;
    buildings: OptionBuilding[];
    actions: OptionAction[];
    allowances: OptionAllowance[];
    adjustment: Money;

    notes: ItemListing;
    excludes: ItemListing;
    warrantyExcludes: ItemListing;

    pricePer: string;
    comment: string;
    photos: Photo[];

    schedules: Schedule[];
    customNotes: string[];

    includedInExpectedContractValue: boolean;
};

// BEGIN MAGIC -- DO NOT EDIT
export type ScheduleJSON = {
    id: string;
    name: string;
};

export function JSONToSchedule(json: ScheduleJSON): Schedule {
    return {
        id: { uuid: json.id },
        name: json.name,
    };
}
export type ScheduleBrokenJSON = {
    id?: string;
    name?: string;
};

export function newSchedule(): Schedule {
    return JSONToSchedule(repairScheduleJSON(undefined));
}
export function repairScheduleJSON(
    json: ScheduleBrokenJSON | undefined
): ScheduleJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
        };
    }
}

export function ScheduleToJSON(value: Schedule): ScheduleJSON {
    return {
        id: value.id.uuid,
        name: value.name,
    };
}

export const SCHEDULE_META: RecordMeta<
    Schedule,
    ScheduleJSON,
    ScheduleBrokenJSON
> & { name: "Schedule" } = {
    name: "Schedule",
    type: "record",
    repair: repairScheduleJSON,
    toJSON: ScheduleToJSON,
    fromJSON: JSONToSchedule,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type ItemListingJSON = {
    items: string[];
    removed: string[];
    custom: boolean;
};

export function JSONToItemListing(json: ItemListingJSON): ItemListing {
    return {
        items: json.items.map((inner) => inner),
        removed: json.removed.map((inner) => inner),
        custom: json.custom,
    };
}
export type ItemListingBrokenJSON = {
    items?: string[];
    removed?: string[];
    custom?: boolean;
};

export function newItemListing(): ItemListing {
    return JSONToItemListing(repairItemListingJSON(undefined));
}
export function repairItemListingJSON(
    json: ItemListingBrokenJSON | undefined
): ItemListingJSON {
    if (json) {
        return {
            items: (json.items || []).map((inner) => inner || ""),
            removed: (json.removed || []).map((inner) => inner || ""),
            custom: json.custom || false,
        };
    } else {
        return {
            items: (undefined || []).map((inner) => inner || ""),
            removed: (undefined || []).map((inner) => inner || ""),
            custom: undefined || false,
        };
    }
}

export function ItemListingToJSON(value: ItemListing): ItemListingJSON {
    return {
        items: value.items.map((inner) => inner),
        removed: value.removed.map((inner) => inner),
        custom: value.custom,
    };
}

export const ITEM_LISTING_META: RecordMeta<
    ItemListing,
    ItemListingJSON,
    ItemListingBrokenJSON
> & { name: "ItemListing" } = {
    name: "ItemListing",
    type: "record",
    repair: repairItemListingJSON,
    toJSON: ItemListingToJSON,
    fromJSON: JSONToItemListing,
    fields: {
        items: { type: "array", items: { type: "string" } },
        removed: { type: "array", items: { type: "string" } },
        custom: { type: "boolean" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type PhotoJSON = {
    name: string;
    url: string;
};

export function JSONToPhoto(json: PhotoJSON): Photo {
    return {
        name: json.name,
        url: json.url,
    };
}
export type PhotoBrokenJSON = {
    name?: string;
    url?: string;
};

export function newPhoto(): Photo {
    return JSONToPhoto(repairPhotoJSON(undefined));
}
export function repairPhotoJSON(json: PhotoBrokenJSON | undefined): PhotoJSON {
    if (json) {
        return {
            name: json.name || "",
            url: json.url || "",
        };
    } else {
        return {
            name: undefined || "",
            url: undefined || "",
        };
    }
}

export function PhotoToJSON(value: Photo): PhotoJSON {
    return {
        name: value.name,
        url: value.url,
    };
}

export const PHOTO_META: RecordMeta<Photo, PhotoJSON, PhotoBrokenJSON> & {
    name: "Photo";
} = {
    name: "Photo",
    type: "record",
    repair: repairPhotoJSON,
    toJSON: PhotoToJSON,
    fromJSON: JSONToPhoto,
    fields: {
        name: { type: "string" },
        url: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type OptionBuildingJSON = {
    building: string | null;
    include: boolean;
};

export function JSONToOptionBuilding(json: OptionBuildingJSON): OptionBuilding {
    return {
        building: json.building,
        include: json.include,
    };
}
export type OptionBuildingBrokenJSON = {
    building?: string | null;
    include?: boolean;
};

export function newOptionBuilding(): OptionBuilding {
    return JSONToOptionBuilding(repairOptionBuildingJSON(undefined));
}
export function repairOptionBuildingJSON(
    json: OptionBuildingBrokenJSON | undefined
): OptionBuildingJSON {
    if (json) {
        return {
            building: json.building || null,
            include: json.include || false,
        };
    } else {
        return {
            building: undefined || null,
            include: undefined || false,
        };
    }
}

export function OptionBuildingToJSON(
    value: OptionBuilding
): OptionBuildingJSON {
    return {
        building: value.building,
        include: value.include,
    };
}

export const OPTION_BUILDING_META: RecordMeta<
    OptionBuilding,
    OptionBuildingJSON,
    OptionBuildingBrokenJSON
> & { name: "OptionBuilding" } = {
    name: "OptionBuilding",
    type: "record",
    repair: repairOptionBuildingJSON,
    toJSON: OptionBuildingToJSON,
    fromJSON: JSONToOptionBuilding,
    fields: {
        building: { type: "uuid", linkTo: "Area" },
        include: { type: "boolean" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type OptionActionJSON = {
    status: string;
    schedule: string | null;
};

export function JSONToOptionAction(json: OptionActionJSON): OptionAction {
    return {
        status: json.status as any,
        schedule: json.schedule,
    };
}
export type OptionActionBrokenJSON = {
    status?: string;
    schedule?: string | null;
};

export function newOptionAction(): OptionAction {
    return JSONToOptionAction(repairOptionActionJSON(undefined));
}
export function repairOptionActionJSON(
    json: OptionActionBrokenJSON | undefined
): OptionActionJSON {
    if (json) {
        return {
            status: json.status || "Include",
            schedule: json.schedule || null,
        };
    } else {
        return {
            status: undefined || "Include",
            schedule: undefined || null,
        };
    }
}

export function OptionActionToJSON(value: OptionAction): OptionActionJSON {
    return {
        status: value.status,
        schedule: value.schedule,
    };
}

export const OPTION_ACTION_META: RecordMeta<
    OptionAction,
    OptionActionJSON,
    OptionActionBrokenJSON
> & { name: "OptionAction" } = {
    name: "OptionAction",
    type: "record",
    repair: repairOptionActionJSON,
    toJSON: OptionActionToJSON,
    fromJSON: JSONToOptionAction,
    fields: {
        status: {
            type: "enum",
            values: ["Include", "Hidden", "Exclude"],
        },
        schedule: { type: "uuid", linkTo: "Schedule" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type OptionAllowanceJSON = {
    allowance: string | null;
    schedule: string | null;
    include: boolean;
};

export function JSONToOptionAllowance(
    json: OptionAllowanceJSON
): OptionAllowance {
    return {
        allowance: json.allowance,
        schedule: json.schedule,
        include: json.include,
    };
}
export type OptionAllowanceBrokenJSON = {
    allowance?: string | null;
    schedule?: string | null;
    include?: boolean;
};

export function newOptionAllowance(): OptionAllowance {
    return JSONToOptionAllowance(repairOptionAllowanceJSON(undefined));
}
export function repairOptionAllowanceJSON(
    json: OptionAllowanceBrokenJSON | undefined
): OptionAllowanceJSON {
    if (json) {
        return {
            allowance: json.allowance || null,
            schedule: json.schedule || null,
            include: json.include || false,
        };
    } else {
        return {
            allowance: undefined || null,
            schedule: undefined || null,
            include: undefined || false,
        };
    }
}

export function OptionAllowanceToJSON(
    value: OptionAllowance
): OptionAllowanceJSON {
    return {
        allowance: value.allowance,
        schedule: value.schedule,
        include: value.include,
    };
}

export const OPTION_ALLOWANCE_META: RecordMeta<
    OptionAllowance,
    OptionAllowanceJSON,
    OptionAllowanceBrokenJSON
> & { name: "OptionAllowance" } = {
    name: "OptionAllowance",
    type: "record",
    repair: repairOptionAllowanceJSON,
    toJSON: OptionAllowanceToJSON,
    fromJSON: JSONToOptionAllowance,
    fields: {
        allowance: { type: "uuid", linkTo: "Allowance" },
        schedule: { type: "uuid", linkTo: "Schedule" },
        include: { type: "boolean" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type OptionJSON = {
    id: string;
    baseBid: boolean;
    name: string;
    description: string;
    buildings: OptionBuildingJSON[];
    actions: OptionActionJSON[];
    allowances: OptionAllowanceJSON[];
    adjustment: string;
    notes: ItemListingJSON;
    excludes: ItemListingJSON;
    warrantyExcludes: ItemListingJSON;
    pricePer: string;
    comment: string;
    photos: PhotoJSON[];
    schedules: ScheduleJSON[];
    customNotes: string[];
    includedInExpectedContractValue: boolean;
};

export function JSONToOption(json: OptionJSON): Option {
    return {
        id: { uuid: json.id },
        baseBid: json.baseBid,
        name: json.name,
        description: json.description,
        buildings: json.buildings.map((inner) => JSONToOptionBuilding(inner)),
        actions: json.actions.map((inner) => JSONToOptionAction(inner)),
        allowances: json.allowances.map((inner) =>
            JSONToOptionAllowance(inner)
        ),
        adjustment: new Decimal(json.adjustment),
        notes: JSONToItemListing(json.notes),
        excludes: JSONToItemListing(json.excludes),
        warrantyExcludes: JSONToItemListing(json.warrantyExcludes),
        pricePer: json.pricePer,
        comment: json.comment,
        photos: json.photos.map((inner) => JSONToPhoto(inner)),
        schedules: json.schedules.map((inner) => JSONToSchedule(inner)),
        customNotes: json.customNotes.map((inner) => inner),
        includedInExpectedContractValue: json.includedInExpectedContractValue,
    };
}
export type OptionBrokenJSON = {
    id?: string;
    baseBid?: boolean;
    name?: string;
    description?: string;
    buildings?: OptionBuildingJSON[];
    actions?: OptionActionJSON[];
    allowances?: OptionAllowanceJSON[];
    adjustment?: string;
    notes?: ItemListingJSON;
    excludes?: ItemListingJSON;
    warrantyExcludes?: ItemListingJSON;
    pricePer?: string;
    comment?: string;
    photos?: PhotoJSON[];
    schedules?: ScheduleJSON[];
    customNotes?: string[];
    includedInExpectedContractValue?: boolean;
};

export function newOption(): Option {
    return JSONToOption(repairOptionJSON(undefined));
}
export function repairOptionJSON(
    json: OptionBrokenJSON | undefined
): OptionJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            baseBid: json.baseBid || false,
            name: json.name || "",
            description: json.description || "",
            buildings: (json.buildings || []).map((inner) =>
                repairOptionBuildingJSON(inner)
            ),
            actions: (json.actions || []).map((inner) =>
                repairOptionActionJSON(inner)
            ),
            allowances: (json.allowances || []).map((inner) =>
                repairOptionAllowanceJSON(inner)
            ),
            adjustment: json.adjustment || "0",
            notes: repairItemListingJSON(json.notes),
            excludes: repairItemListingJSON(json.excludes),
            warrantyExcludes: repairItemListingJSON(json.warrantyExcludes),
            pricePer: json.pricePer || "",
            comment: json.comment || "",
            photos: (json.photos || []).map((inner) => repairPhotoJSON(inner)),
            schedules: (json.schedules || []).map((inner) =>
                repairScheduleJSON(inner)
            ),
            customNotes: (json.customNotes || []).map((inner) => inner || ""),
            includedInExpectedContractValue:
                json.includedInExpectedContractValue || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            baseBid: undefined || false,
            name: undefined || "",
            description: undefined || "",
            buildings: (undefined || []).map((inner) =>
                repairOptionBuildingJSON(inner)
            ),
            actions: (undefined || []).map((inner) =>
                repairOptionActionJSON(inner)
            ),
            allowances: (undefined || []).map((inner) =>
                repairOptionAllowanceJSON(inner)
            ),
            adjustment: undefined || "0",
            notes: repairItemListingJSON(undefined),
            excludes: repairItemListingJSON(undefined),
            warrantyExcludes: repairItemListingJSON(undefined),
            pricePer: undefined || "",
            comment: undefined || "",
            photos: (undefined || []).map((inner) => repairPhotoJSON(inner)),
            schedules: (undefined || []).map((inner) =>
                repairScheduleJSON(inner)
            ),
            customNotes: (undefined || []).map((inner) => inner || ""),
            includedInExpectedContractValue: undefined || false,
        };
    }
}

export function OptionToJSON(value: Option): OptionJSON {
    return {
        id: value.id.uuid,
        baseBid: value.baseBid,
        name: value.name,
        description: value.description,
        buildings: value.buildings.map((inner) => OptionBuildingToJSON(inner)),
        actions: value.actions.map((inner) => OptionActionToJSON(inner)),
        allowances: value.allowances.map((inner) =>
            OptionAllowanceToJSON(inner)
        ),
        adjustment: value.adjustment.toString(),
        notes: ItemListingToJSON(value.notes),
        excludes: ItemListingToJSON(value.excludes),
        warrantyExcludes: ItemListingToJSON(value.warrantyExcludes),
        pricePer: value.pricePer,
        comment: value.comment,
        photos: value.photos.map((inner) => PhotoToJSON(inner)),
        schedules: value.schedules.map((inner) => ScheduleToJSON(inner)),
        customNotes: value.customNotes.map((inner) => inner),
        includedInExpectedContractValue: value.includedInExpectedContractValue,
    };
}

export const OPTION_META: RecordMeta<Option, OptionJSON, OptionBrokenJSON> & {
    name: "Option";
} = {
    name: "Option",
    type: "record",
    repair: repairOptionJSON,
    toJSON: OptionToJSON,
    fromJSON: JSONToOption,
    fields: {
        id: { type: "uuid" },
        baseBid: { type: "boolean" },
        name: { type: "string" },
        description: { type: "string" },
        buildings: { type: "array", items: OPTION_BUILDING_META },
        actions: { type: "array", items: OPTION_ACTION_META },
        allowances: { type: "array", items: OPTION_ALLOWANCE_META },
        adjustment: { type: "money" },
        notes: ITEM_LISTING_META,
        excludes: ITEM_LISTING_META,
        warrantyExcludes: ITEM_LISTING_META,
        pricePer: { type: "string" },
        comment: { type: "string" },
        photos: { type: "array", items: PHOTO_META },
        schedules: { type: "array", items: SCHEDULE_META },
        customNotes: { type: "array", items: { type: "string" } },
        includedInExpectedContractValue: { type: "boolean" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
