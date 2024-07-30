import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { genUUID, UUID } from "../../../clay/uuid";
import { Version } from "../../../clay/version";
import {
    JSONToRate,
    Rate,
    RateJSON,
    RateToJSON,
    RATE_META,
    repairRateJSON,
} from "../rate/table";

//!Data
export type UnitType = {
    id: UUID;
    recordVersion: Version;
    name: string;
    contingency: boolean;
};

//!Data
export type Substrate = {
    id: UUID;
    recordVersion: Version;
    name: string;
};

//!Data
export type ItemType = {
    id: UUID;
    recordVersion: Version;
    name: string;
    defaultUnitType: Link<UnitType>;
    calculator:
        | "Square"
        | "Linear"
        | "Walls"
        | "Ceiling"
        | "Baseboard"
        | "Crown"
        | "Chair Rail";

    substrate: Link<Substrate>;
    defaultHidden: boolean;
    rates: Rate[];
    contingency: boolean;
    regular: boolean;
    phaseCode: string;
};

//!Data
export type ApplicationTypeOption = {
    id: UUID;
    name: string;
};

//!Data
export type ApplicationType = {
    id: UUID;
    recordVersion: Version;
    name: string;
    options: ApplicationTypeOption[];
    default: Link<ApplicationTypeOption>;
    hidden: boolean;
};

// BEGIN MAGIC -- DO NOT EDIT
export type UnitTypeJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    contingency: boolean;
};

export function JSONToUnitType(json: UnitTypeJSON): UnitType {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        contingency: json.contingency,
    };
}
export type UnitTypeBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    contingency?: boolean;
};

export function newUnitType(): UnitType {
    return JSONToUnitType(repairUnitTypeJSON(undefined));
}
export function repairUnitTypeJSON(
    json: UnitTypeBrokenJSON | undefined
): UnitTypeJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            contingency: json.contingency || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            contingency: undefined || false,
        };
    }
}

export function UnitTypeToJSON(value: UnitType): UnitTypeJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        contingency: value.contingency,
    };
}

export const UNIT_TYPE_META: RecordMeta<
    UnitType,
    UnitTypeJSON,
    UnitTypeBrokenJSON
> & { name: "UnitType" } = {
    name: "UnitType",
    type: "record",
    repair: repairUnitTypeJSON,
    toJSON: UnitTypeToJSON,
    fromJSON: JSONToUnitType,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        contingency: { type: "boolean" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type SubstrateJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
};

export function JSONToSubstrate(json: SubstrateJSON): Substrate {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
    };
}
export type SubstrateBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
};

export function newSubstrate(): Substrate {
    return JSONToSubstrate(repairSubstrateJSON(undefined));
}
export function repairSubstrateJSON(
    json: SubstrateBrokenJSON | undefined
): SubstrateJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
        };
    }
}

export function SubstrateToJSON(value: Substrate): SubstrateJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
    };
}

export const SUBSTRATE_META: RecordMeta<
    Substrate,
    SubstrateJSON,
    SubstrateBrokenJSON
> & { name: "Substrate" } = {
    name: "Substrate",
    type: "record",
    repair: repairSubstrateJSON,
    toJSON: SubstrateToJSON,
    fromJSON: JSONToSubstrate,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type ItemTypeJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    defaultUnitType: string | null;
    calculator: string;
    substrate: string | null;
    defaultHidden: boolean;
    rates: RateJSON[];
    contingency: boolean;
    regular: boolean;
    phaseCode: string;
};

export function JSONToItemType(json: ItemTypeJSON): ItemType {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        defaultUnitType: json.defaultUnitType,
        calculator: json.calculator as any,
        substrate: json.substrate,
        defaultHidden: json.defaultHidden,
        rates: json.rates.map((inner) => JSONToRate(inner)),
        contingency: json.contingency,
        regular: json.regular,
        phaseCode: json.phaseCode,
    };
}
export type ItemTypeBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    defaultUnitType?: string | null;
    calculator?: string;
    substrate?: string | null;
    defaultHidden?: boolean;
    rates?: RateJSON[];
    contingency?: boolean;
    regular?: boolean;
    phaseCode?: string;
};

export function newItemType(): ItemType {
    return JSONToItemType(repairItemTypeJSON(undefined));
}
export function repairItemTypeJSON(
    json: ItemTypeBrokenJSON | undefined
): ItemTypeJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            defaultUnitType: json.defaultUnitType || null,
            calculator: json.calculator || "Square",
            substrate: json.substrate || null,
            defaultHidden: json.defaultHidden || false,
            rates: (json.rates || []).map((inner) => repairRateJSON(inner)),
            contingency: json.contingency || false,
            regular: json.regular || false,
            phaseCode: json.phaseCode || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            defaultUnitType: undefined || null,
            calculator: undefined || "Square",
            substrate: undefined || null,
            defaultHidden: undefined || false,
            rates: (undefined || []).map((inner) => repairRateJSON(inner)),
            contingency: undefined || false,
            regular: undefined || false,
            phaseCode: undefined || "",
        };
    }
}

export function ItemTypeToJSON(value: ItemType): ItemTypeJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        defaultUnitType: value.defaultUnitType,
        calculator: value.calculator,
        substrate: value.substrate,
        defaultHidden: value.defaultHidden,
        rates: value.rates.map((inner) => RateToJSON(inner)),
        contingency: value.contingency,
        regular: value.regular,
        phaseCode: value.phaseCode,
    };
}

export const ITEM_TYPE_META: RecordMeta<
    ItemType,
    ItemTypeJSON,
    ItemTypeBrokenJSON
> & { name: "ItemType" } = {
    name: "ItemType",
    type: "record",
    repair: repairItemTypeJSON,
    toJSON: ItemTypeToJSON,
    fromJSON: JSONToItemType,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        defaultUnitType: { type: "uuid", linkTo: "UnitType" },
        calculator: {
            type: "enum",
            values: [
                "Square",
                "Linear",
                "Walls",
                "Ceiling",
                "Baseboard",
                "Crown",
                "Chair Rail",
            ],
        },
        substrate: { type: "uuid", linkTo: "Substrate" },
        defaultHidden: { type: "boolean" },
        rates: { type: "array", items: RATE_META },
        contingency: { type: "boolean" },
        regular: { type: "boolean" },
        phaseCode: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type ApplicationTypeOptionJSON = {
    id: string;
    name: string;
};

export function JSONToApplicationTypeOption(
    json: ApplicationTypeOptionJSON
): ApplicationTypeOption {
    return {
        id: { uuid: json.id },
        name: json.name,
    };
}
export type ApplicationTypeOptionBrokenJSON = {
    id?: string;
    name?: string;
};

export function newApplicationTypeOption(): ApplicationTypeOption {
    return JSONToApplicationTypeOption(
        repairApplicationTypeOptionJSON(undefined)
    );
}
export function repairApplicationTypeOptionJSON(
    json: ApplicationTypeOptionBrokenJSON | undefined
): ApplicationTypeOptionJSON {
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

export function ApplicationTypeOptionToJSON(
    value: ApplicationTypeOption
): ApplicationTypeOptionJSON {
    return {
        id: value.id.uuid,
        name: value.name,
    };
}

export const APPLICATION_TYPE_OPTION_META: RecordMeta<
    ApplicationTypeOption,
    ApplicationTypeOptionJSON,
    ApplicationTypeOptionBrokenJSON
> & { name: "ApplicationTypeOption" } = {
    name: "ApplicationTypeOption",
    type: "record",
    repair: repairApplicationTypeOptionJSON,
    toJSON: ApplicationTypeOptionToJSON,
    fromJSON: JSONToApplicationTypeOption,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type ApplicationTypeJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    options: ApplicationTypeOptionJSON[];
    default: string | null;
    hidden: boolean;
};

export function JSONToApplicationType(
    json: ApplicationTypeJSON
): ApplicationType {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        options: json.options.map((inner) =>
            JSONToApplicationTypeOption(inner)
        ),
        default: json.default,
        hidden: json.hidden,
    };
}
export type ApplicationTypeBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    options?: ApplicationTypeOptionJSON[];
    default?: string | null;
    hidden?: boolean;
};

export function newApplicationType(): ApplicationType {
    return JSONToApplicationType(repairApplicationTypeJSON(undefined));
}
export function repairApplicationTypeJSON(
    json: ApplicationTypeBrokenJSON | undefined
): ApplicationTypeJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            options: (json.options || []).map((inner) =>
                repairApplicationTypeOptionJSON(inner)
            ),
            default: json.default || null,
            hidden: json.hidden || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            options: (undefined || []).map((inner) =>
                repairApplicationTypeOptionJSON(inner)
            ),
            default: undefined || null,
            hidden: undefined || false,
        };
    }
}

export function ApplicationTypeToJSON(
    value: ApplicationType
): ApplicationTypeJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        options: value.options.map((inner) =>
            ApplicationTypeOptionToJSON(inner)
        ),
        default: value.default,
        hidden: value.hidden,
    };
}

export const APPLICATION_TYPE_META: RecordMeta<
    ApplicationType,
    ApplicationTypeJSON,
    ApplicationTypeBrokenJSON
> & { name: "ApplicationType" } = {
    name: "ApplicationType",
    type: "record",
    repair: repairApplicationTypeJSON,
    toJSON: ApplicationTypeToJSON,
    fromJSON: JSONToApplicationType,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        options: { type: "array", items: APPLICATION_TYPE_OPTION_META },
        default: { type: "uuid", linkTo: "ApplicationTypeOption" },
        hidden: { type: "boolean" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
