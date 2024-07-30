import { RecordMeta } from "../../../clay/meta";
import { genUUID, UUID } from "../../../clay/uuid";
import { Version } from "../../../clay/version";

//!Data
export type ThirdPartySpecifier = {
    id: UUID;
    recordVersion: Version;
    name: string;
    active: boolean;
};

//!Data
export type Competitor = {
    id: UUID;
    recordVersion: Version;
    name: string;
    active: boolean;
};

//!Data
export type Manufacturer = {
    id: UUID;
    recordVersion: Version;
    name: string;
    active: boolean;
};

//!Data
export type ApprovalType = {
    id: UUID;
    recordVersion: Version;
    name: string;
    active: boolean;
    requireDetail: boolean;
    requireCustomerPO: boolean;
};

//!Data
export type AnticipatedDuration = {
    id: UUID;
    recordVersion: Version;
    name: string;
    active: boolean;
};

// BEGIN MAGIC -- DO NOT EDIT
export type ThirdPartySpecifierJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    active: boolean;
};

export function JSONToThirdPartySpecifier(
    json: ThirdPartySpecifierJSON
): ThirdPartySpecifier {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        active: json.active,
    };
}
export type ThirdPartySpecifierBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    active?: boolean;
};

export function newThirdPartySpecifier(): ThirdPartySpecifier {
    return JSONToThirdPartySpecifier(repairThirdPartySpecifierJSON(undefined));
}
export function repairThirdPartySpecifierJSON(
    json: ThirdPartySpecifierBrokenJSON | undefined
): ThirdPartySpecifierJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            active: json.active || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            active: undefined || false,
        };
    }
}

export function ThirdPartySpecifierToJSON(
    value: ThirdPartySpecifier
): ThirdPartySpecifierJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        active: value.active,
    };
}

export const THIRD_PARTY_SPECIFIER_META: RecordMeta<
    ThirdPartySpecifier,
    ThirdPartySpecifierJSON,
    ThirdPartySpecifierBrokenJSON
> & { name: "ThirdPartySpecifier" } = {
    name: "ThirdPartySpecifier",
    type: "record",
    repair: repairThirdPartySpecifierJSON,
    toJSON: ThirdPartySpecifierToJSON,
    fromJSON: JSONToThirdPartySpecifier,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        active: { type: "boolean" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type CompetitorJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    active: boolean;
};

export function JSONToCompetitor(json: CompetitorJSON): Competitor {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        active: json.active,
    };
}
export type CompetitorBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    active?: boolean;
};

export function newCompetitor(): Competitor {
    return JSONToCompetitor(repairCompetitorJSON(undefined));
}
export function repairCompetitorJSON(
    json: CompetitorBrokenJSON | undefined
): CompetitorJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            active: json.active || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            active: undefined || false,
        };
    }
}

export function CompetitorToJSON(value: Competitor): CompetitorJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        active: value.active,
    };
}

export const COMPETITOR_META: RecordMeta<
    Competitor,
    CompetitorJSON,
    CompetitorBrokenJSON
> & { name: "Competitor" } = {
    name: "Competitor",
    type: "record",
    repair: repairCompetitorJSON,
    toJSON: CompetitorToJSON,
    fromJSON: JSONToCompetitor,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        active: { type: "boolean" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type ManufacturerJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    active: boolean;
};

export function JSONToManufacturer(json: ManufacturerJSON): Manufacturer {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        active: json.active,
    };
}
export type ManufacturerBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    active?: boolean;
};

export function newManufacturer(): Manufacturer {
    return JSONToManufacturer(repairManufacturerJSON(undefined));
}
export function repairManufacturerJSON(
    json: ManufacturerBrokenJSON | undefined
): ManufacturerJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            active: json.active || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            active: undefined || false,
        };
    }
}

export function ManufacturerToJSON(value: Manufacturer): ManufacturerJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        active: value.active,
    };
}

export const MANUFACTURER_META: RecordMeta<
    Manufacturer,
    ManufacturerJSON,
    ManufacturerBrokenJSON
> & { name: "Manufacturer" } = {
    name: "Manufacturer",
    type: "record",
    repair: repairManufacturerJSON,
    toJSON: ManufacturerToJSON,
    fromJSON: JSONToManufacturer,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        active: { type: "boolean" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type ApprovalTypeJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    active: boolean;
    requireDetail: boolean;
    requireCustomerPO: boolean;
};

export function JSONToApprovalType(json: ApprovalTypeJSON): ApprovalType {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        active: json.active,
        requireDetail: json.requireDetail,
        requireCustomerPO: json.requireCustomerPO,
    };
}
export type ApprovalTypeBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    active?: boolean;
    requireDetail?: boolean;
    requireCustomerPO?: boolean;
};

export function newApprovalType(): ApprovalType {
    return JSONToApprovalType(repairApprovalTypeJSON(undefined));
}
export function repairApprovalTypeJSON(
    json: ApprovalTypeBrokenJSON | undefined
): ApprovalTypeJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            active: json.active || false,
            requireDetail: json.requireDetail || false,
            requireCustomerPO: json.requireCustomerPO || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            active: undefined || false,
            requireDetail: undefined || false,
            requireCustomerPO: undefined || false,
        };
    }
}

export function ApprovalTypeToJSON(value: ApprovalType): ApprovalTypeJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        active: value.active,
        requireDetail: value.requireDetail,
        requireCustomerPO: value.requireCustomerPO,
    };
}

export const APPROVAL_TYPE_META: RecordMeta<
    ApprovalType,
    ApprovalTypeJSON,
    ApprovalTypeBrokenJSON
> & { name: "ApprovalType" } = {
    name: "ApprovalType",
    type: "record",
    repair: repairApprovalTypeJSON,
    toJSON: ApprovalTypeToJSON,
    fromJSON: JSONToApprovalType,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        active: { type: "boolean" },
        requireDetail: { type: "boolean" },
        requireCustomerPO: { type: "boolean" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type AnticipatedDurationJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    active: boolean;
};

export function JSONToAnticipatedDuration(
    json: AnticipatedDurationJSON
): AnticipatedDuration {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        active: json.active,
    };
}
export type AnticipatedDurationBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    active?: boolean;
};

export function newAnticipatedDuration(): AnticipatedDuration {
    return JSONToAnticipatedDuration(repairAnticipatedDurationJSON(undefined));
}
export function repairAnticipatedDurationJSON(
    json: AnticipatedDurationBrokenJSON | undefined
): AnticipatedDurationJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            active: json.active || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            active: undefined || false,
        };
    }
}

export function AnticipatedDurationToJSON(
    value: AnticipatedDuration
): AnticipatedDurationJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        active: value.active,
    };
}

export const ANTICIPATED_DURATION_META: RecordMeta<
    AnticipatedDuration,
    AnticipatedDurationJSON,
    AnticipatedDurationBrokenJSON
> & { name: "AnticipatedDuration" } = {
    name: "AnticipatedDuration",
    type: "record",
    repair: repairAnticipatedDurationJSON,
    toJSON: AnticipatedDurationToJSON,
    fromJSON: JSONToAnticipatedDuration,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        active: { type: "boolean" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
