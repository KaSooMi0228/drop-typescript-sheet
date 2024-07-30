import Decimal from "decimal.js";
import { Money, Quantity } from "../../clay/common";
import { Link } from "../../clay/link";
import { RecordMeta } from "../../clay/meta";
import { genUUID, UUID } from "../../clay/uuid";
import {
    ApplicationType,
    ApplicationTypeOption,
    ItemType,
    UnitType,
} from "../estimate/types/table";

//!Data
export type SourceAreaAction = {
    id: UUID;
    itemType: Link<ItemType>;
    name: string;
    hours: Quantity;
    materials: Quantity;
    hourRate: Money;
    materialsRate: Money;
    cost: Money;
    price: Money;
    finishSchedule: string;
    applicationType: Link<ApplicationType>;
    application: Link<ApplicationTypeOption>;
};

//!Data
export type SourceAreaAllowance = {
    id: UUID;
    name: string;
    cost: Money;
    price: Money;
    global: boolean;
};

//!Data
export type SourceAreaContingency = {
    id: UUID;
    description: string;
    type: Link<UnitType>;
    quantity: Quantity;
    hours: Quantity;
    materials: Quantity;
    costRate: Money;
    priceRate: Money;
    finishSchedule: string;
};

//!Data
export type SourceArea = {
    id: UUID;
    name: string;
    actions: SourceAreaAction[];
    allowances: SourceAreaAllowance[];
    contingencies: SourceAreaContingency[];
};

//!Data
export type SourceAreaKey = {
    id: UUID;
    name: string;
};

//!Data
export type OptionFinishSchedule = {
    name: string;
    finishSchedule: string;
    applicationType: Link<ApplicationType>;
    application: Link<ApplicationTypeOption>;
};

// BEGIN MAGIC -- DO NOT EDIT
export type SourceAreaActionJSON = {
    id: string;
    itemType: string | null;
    name: string;
    hours: string;
    materials: string;
    hourRate: string;
    materialsRate: string;
    cost: string;
    price: string;
    finishSchedule: string;
    applicationType: string | null;
    application: string | null;
};

export function JSONToSourceAreaAction(
    json: SourceAreaActionJSON
): SourceAreaAction {
    return {
        id: { uuid: json.id },
        itemType: json.itemType,
        name: json.name,
        hours: new Decimal(json.hours),
        materials: new Decimal(json.materials),
        hourRate: new Decimal(json.hourRate),
        materialsRate: new Decimal(json.materialsRate),
        cost: new Decimal(json.cost),
        price: new Decimal(json.price),
        finishSchedule: json.finishSchedule,
        applicationType: json.applicationType,
        application: json.application,
    };
}
export type SourceAreaActionBrokenJSON = {
    id?: string;
    itemType?: string | null;
    name?: string;
    hours?: string;
    materials?: string;
    hourRate?: string;
    materialsRate?: string;
    cost?: string;
    price?: string;
    finishSchedule?: string;
    applicationType?: string | null;
    application?: string | null;
};

export function newSourceAreaAction(): SourceAreaAction {
    return JSONToSourceAreaAction(repairSourceAreaActionJSON(undefined));
}
export function repairSourceAreaActionJSON(
    json: SourceAreaActionBrokenJSON | undefined
): SourceAreaActionJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            itemType: json.itemType || null,
            name: json.name || "",
            hours: json.hours || "0",
            materials: json.materials || "0",
            hourRate: json.hourRate || "0",
            materialsRate: json.materialsRate || "0",
            cost: json.cost || "0",
            price: json.price || "0",
            finishSchedule: json.finishSchedule || "",
            applicationType: json.applicationType || null,
            application: json.application || null,
        };
    } else {
        return {
            id: undefined || genUUID(),
            itemType: undefined || null,
            name: undefined || "",
            hours: undefined || "0",
            materials: undefined || "0",
            hourRate: undefined || "0",
            materialsRate: undefined || "0",
            cost: undefined || "0",
            price: undefined || "0",
            finishSchedule: undefined || "",
            applicationType: undefined || null,
            application: undefined || null,
        };
    }
}

export function SourceAreaActionToJSON(
    value: SourceAreaAction
): SourceAreaActionJSON {
    return {
        id: value.id.uuid,
        itemType: value.itemType,
        name: value.name,
        hours: value.hours.toString(),
        materials: value.materials.toString(),
        hourRate: value.hourRate.toString(),
        materialsRate: value.materialsRate.toString(),
        cost: value.cost.toString(),
        price: value.price.toString(),
        finishSchedule: value.finishSchedule,
        applicationType: value.applicationType,
        application: value.application,
    };
}

export const SOURCE_AREA_ACTION_META: RecordMeta<
    SourceAreaAction,
    SourceAreaActionJSON,
    SourceAreaActionBrokenJSON
> & { name: "SourceAreaAction" } = {
    name: "SourceAreaAction",
    type: "record",
    repair: repairSourceAreaActionJSON,
    toJSON: SourceAreaActionToJSON,
    fromJSON: JSONToSourceAreaAction,
    fields: {
        id: { type: "uuid" },
        itemType: { type: "uuid", linkTo: "ItemType" },
        name: { type: "string" },
        hours: { type: "quantity" },
        materials: { type: "quantity" },
        hourRate: { type: "money" },
        materialsRate: { type: "money" },
        cost: { type: "money" },
        price: { type: "money" },
        finishSchedule: { type: "string" },
        applicationType: { type: "uuid", linkTo: "ApplicationType" },
        application: { type: "uuid", linkTo: "ApplicationTypeOption" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type SourceAreaAllowanceJSON = {
    id: string;
    name: string;
    cost: string;
    price: string;
    global: boolean;
};

export function JSONToSourceAreaAllowance(
    json: SourceAreaAllowanceJSON
): SourceAreaAllowance {
    return {
        id: { uuid: json.id },
        name: json.name,
        cost: new Decimal(json.cost),
        price: new Decimal(json.price),
        global: json.global,
    };
}
export type SourceAreaAllowanceBrokenJSON = {
    id?: string;
    name?: string;
    cost?: string;
    price?: string;
    global?: boolean;
};

export function newSourceAreaAllowance(): SourceAreaAllowance {
    return JSONToSourceAreaAllowance(repairSourceAreaAllowanceJSON(undefined));
}
export function repairSourceAreaAllowanceJSON(
    json: SourceAreaAllowanceBrokenJSON | undefined
): SourceAreaAllowanceJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            cost: json.cost || "0",
            price: json.price || "0",
            global: json.global || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            cost: undefined || "0",
            price: undefined || "0",
            global: undefined || false,
        };
    }
}

export function SourceAreaAllowanceToJSON(
    value: SourceAreaAllowance
): SourceAreaAllowanceJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        cost: value.cost.toString(),
        price: value.price.toString(),
        global: value.global,
    };
}

export const SOURCE_AREA_ALLOWANCE_META: RecordMeta<
    SourceAreaAllowance,
    SourceAreaAllowanceJSON,
    SourceAreaAllowanceBrokenJSON
> & { name: "SourceAreaAllowance" } = {
    name: "SourceAreaAllowance",
    type: "record",
    repair: repairSourceAreaAllowanceJSON,
    toJSON: SourceAreaAllowanceToJSON,
    fromJSON: JSONToSourceAreaAllowance,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        cost: { type: "money" },
        price: { type: "money" },
        global: { type: "boolean" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type SourceAreaContingencyJSON = {
    id: string;
    description: string;
    type: string | null;
    quantity: string;
    hours: string;
    materials: string;
    costRate: string;
    priceRate: string;
    finishSchedule: string;
};

export function JSONToSourceAreaContingency(
    json: SourceAreaContingencyJSON
): SourceAreaContingency {
    return {
        id: { uuid: json.id },
        description: json.description,
        type: json.type,
        quantity: new Decimal(json.quantity),
        hours: new Decimal(json.hours),
        materials: new Decimal(json.materials),
        costRate: new Decimal(json.costRate),
        priceRate: new Decimal(json.priceRate),
        finishSchedule: json.finishSchedule,
    };
}
export type SourceAreaContingencyBrokenJSON = {
    id?: string;
    description?: string;
    type?: string | null;
    quantity?: string;
    hours?: string;
    materials?: string;
    costRate?: string;
    priceRate?: string;
    finishSchedule?: string;
};

export function newSourceAreaContingency(): SourceAreaContingency {
    return JSONToSourceAreaContingency(
        repairSourceAreaContingencyJSON(undefined)
    );
}
export function repairSourceAreaContingencyJSON(
    json: SourceAreaContingencyBrokenJSON | undefined
): SourceAreaContingencyJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            description: json.description || "",
            type: json.type || null,
            quantity: json.quantity || "0",
            hours: json.hours || "0",
            materials: json.materials || "0",
            costRate: json.costRate || "0",
            priceRate: json.priceRate || "0",
            finishSchedule: json.finishSchedule || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            description: undefined || "",
            type: undefined || null,
            quantity: undefined || "0",
            hours: undefined || "0",
            materials: undefined || "0",
            costRate: undefined || "0",
            priceRate: undefined || "0",
            finishSchedule: undefined || "",
        };
    }
}

export function SourceAreaContingencyToJSON(
    value: SourceAreaContingency
): SourceAreaContingencyJSON {
    return {
        id: value.id.uuid,
        description: value.description,
        type: value.type,
        quantity: value.quantity.toString(),
        hours: value.hours.toString(),
        materials: value.materials.toString(),
        costRate: value.costRate.toString(),
        priceRate: value.priceRate.toString(),
        finishSchedule: value.finishSchedule,
    };
}

export const SOURCE_AREA_CONTINGENCY_META: RecordMeta<
    SourceAreaContingency,
    SourceAreaContingencyJSON,
    SourceAreaContingencyBrokenJSON
> & { name: "SourceAreaContingency" } = {
    name: "SourceAreaContingency",
    type: "record",
    repair: repairSourceAreaContingencyJSON,
    toJSON: SourceAreaContingencyToJSON,
    fromJSON: JSONToSourceAreaContingency,
    fields: {
        id: { type: "uuid" },
        description: { type: "string" },
        type: { type: "uuid", linkTo: "UnitType" },
        quantity: { type: "quantity" },
        hours: { type: "quantity" },
        materials: { type: "quantity" },
        costRate: { type: "money" },
        priceRate: { type: "money" },
        finishSchedule: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type SourceAreaJSON = {
    id: string;
    name: string;
    actions: SourceAreaActionJSON[];
    allowances: SourceAreaAllowanceJSON[];
    contingencies: SourceAreaContingencyJSON[];
};

export function JSONToSourceArea(json: SourceAreaJSON): SourceArea {
    return {
        id: { uuid: json.id },
        name: json.name,
        actions: json.actions.map((inner) => JSONToSourceAreaAction(inner)),
        allowances: json.allowances.map((inner) =>
            JSONToSourceAreaAllowance(inner)
        ),
        contingencies: json.contingencies.map((inner) =>
            JSONToSourceAreaContingency(inner)
        ),
    };
}
export type SourceAreaBrokenJSON = {
    id?: string;
    name?: string;
    actions?: SourceAreaActionJSON[];
    allowances?: SourceAreaAllowanceJSON[];
    contingencies?: SourceAreaContingencyJSON[];
};

export function newSourceArea(): SourceArea {
    return JSONToSourceArea(repairSourceAreaJSON(undefined));
}
export function repairSourceAreaJSON(
    json: SourceAreaBrokenJSON | undefined
): SourceAreaJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            actions: (json.actions || []).map((inner) =>
                repairSourceAreaActionJSON(inner)
            ),
            allowances: (json.allowances || []).map((inner) =>
                repairSourceAreaAllowanceJSON(inner)
            ),
            contingencies: (json.contingencies || []).map((inner) =>
                repairSourceAreaContingencyJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            actions: (undefined || []).map((inner) =>
                repairSourceAreaActionJSON(inner)
            ),
            allowances: (undefined || []).map((inner) =>
                repairSourceAreaAllowanceJSON(inner)
            ),
            contingencies: (undefined || []).map((inner) =>
                repairSourceAreaContingencyJSON(inner)
            ),
        };
    }
}

export function SourceAreaToJSON(value: SourceArea): SourceAreaJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        actions: value.actions.map((inner) => SourceAreaActionToJSON(inner)),
        allowances: value.allowances.map((inner) =>
            SourceAreaAllowanceToJSON(inner)
        ),
        contingencies: value.contingencies.map((inner) =>
            SourceAreaContingencyToJSON(inner)
        ),
    };
}

export const SOURCE_AREA_META: RecordMeta<
    SourceArea,
    SourceAreaJSON,
    SourceAreaBrokenJSON
> & { name: "SourceArea" } = {
    name: "SourceArea",
    type: "record",
    repair: repairSourceAreaJSON,
    toJSON: SourceAreaToJSON,
    fromJSON: JSONToSourceArea,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        actions: { type: "array", items: SOURCE_AREA_ACTION_META },
        allowances: { type: "array", items: SOURCE_AREA_ALLOWANCE_META },
        contingencies: { type: "array", items: SOURCE_AREA_CONTINGENCY_META },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type SourceAreaKeyJSON = {
    id: string;
    name: string;
};

export function JSONToSourceAreaKey(json: SourceAreaKeyJSON): SourceAreaKey {
    return {
        id: { uuid: json.id },
        name: json.name,
    };
}
export type SourceAreaKeyBrokenJSON = {
    id?: string;
    name?: string;
};

export function newSourceAreaKey(): SourceAreaKey {
    return JSONToSourceAreaKey(repairSourceAreaKeyJSON(undefined));
}
export function repairSourceAreaKeyJSON(
    json: SourceAreaKeyBrokenJSON | undefined
): SourceAreaKeyJSON {
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

export function SourceAreaKeyToJSON(value: SourceAreaKey): SourceAreaKeyJSON {
    return {
        id: value.id.uuid,
        name: value.name,
    };
}

export const SOURCE_AREA_KEY_META: RecordMeta<
    SourceAreaKey,
    SourceAreaKeyJSON,
    SourceAreaKeyBrokenJSON
> & { name: "SourceAreaKey" } = {
    name: "SourceAreaKey",
    type: "record",
    repair: repairSourceAreaKeyJSON,
    toJSON: SourceAreaKeyToJSON,
    fromJSON: JSONToSourceAreaKey,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type OptionFinishScheduleJSON = {
    name: string;
    finishSchedule: string;
    applicationType: string | null;
    application: string | null;
};

export function JSONToOptionFinishSchedule(
    json: OptionFinishScheduleJSON
): OptionFinishSchedule {
    return {
        name: json.name,
        finishSchedule: json.finishSchedule,
        applicationType: json.applicationType,
        application: json.application,
    };
}
export type OptionFinishScheduleBrokenJSON = {
    name?: string;
    finishSchedule?: string;
    applicationType?: string | null;
    application?: string | null;
};

export function newOptionFinishSchedule(): OptionFinishSchedule {
    return JSONToOptionFinishSchedule(
        repairOptionFinishScheduleJSON(undefined)
    );
}
export function repairOptionFinishScheduleJSON(
    json: OptionFinishScheduleBrokenJSON | undefined
): OptionFinishScheduleJSON {
    if (json) {
        return {
            name: json.name || "",
            finishSchedule: json.finishSchedule || "",
            applicationType: json.applicationType || null,
            application: json.application || null,
        };
    } else {
        return {
            name: undefined || "",
            finishSchedule: undefined || "",
            applicationType: undefined || null,
            application: undefined || null,
        };
    }
}

export function OptionFinishScheduleToJSON(
    value: OptionFinishSchedule
): OptionFinishScheduleJSON {
    return {
        name: value.name,
        finishSchedule: value.finishSchedule,
        applicationType: value.applicationType,
        application: value.application,
    };
}

export const OPTION_FINISH_SCHEDULE_META: RecordMeta<
    OptionFinishSchedule,
    OptionFinishScheduleJSON,
    OptionFinishScheduleBrokenJSON
> & { name: "OptionFinishSchedule" } = {
    name: "OptionFinishSchedule",
    type: "record",
    repair: repairOptionFinishScheduleJSON,
    toJSON: OptionFinishScheduleToJSON,
    fromJSON: JSONToOptionFinishSchedule,
    fields: {
        name: { type: "string" },
        finishSchedule: { type: "string" },
        applicationType: { type: "uuid", linkTo: "ApplicationType" },
        application: { type: "uuid", linkTo: "ApplicationTypeOption" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
