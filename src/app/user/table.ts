import { Decimal } from "decimal.js";
import { Money, Percentage, Quantity } from "../../clay/common";
import { Link } from "../../clay/link";
import { RecordMeta } from "../../clay/meta";
import { Phone } from "../../clay/phone";
import { anyMap } from "../../clay/queryFuncs";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";
import { Role } from "../roles/table";

//!Data
export type Targets = {
    fiscalYear: Quantity;
    quotingTarget: Money;
    landingTarget: Money;
    managingTarget: Money;
};

//!Data
export type Squad = {
    id: UUID;
    recordVersion: Version;
    name: string;
    azureId: string;
    targets: Targets[];
};

//!Data
export type User = {
    id: UUID;
    code: string;
    name: string;
    recordVersion: Version;
    phone: Phone;
    accountEmail: string;
    active: boolean;
    roles: Link<Role>[];

    includeWarrantyFund: boolean;
    includeTaxHoldback: boolean;
    includeGst: boolean;
    includeEmployeeProfitShare: boolean;
    postProjectSurvey: boolean;

    companyRole: string;

    commissionsPercentage: Percentage;
    squad: Link<Squad>;
    quickbooksId: string;

    targets: Targets[];
};

export function calcUserLabel(user: User): string {
    return anyMap(
        user.roles,
        (role) => role === "b0f6ddd1-36cc-436c-835e-08359b719eea"
    )
        ? calcUserCodeName(user)
        : user.name;
}

export function calcUserCodeName(user: User): string {
    return user.code + " " + user.name;
}

export const ROLE_PROJECT_MANAGER = "ef529179-ed06-4ed0-9d70-09d7ee143771";
export const ROLE_BASIC_ACCESS = "f7022c57-3101-4310-aaee-9eae9201c224";
export const ROLE_SERVICE_REPRESENTATIVE =
    "50e102b1-eed2-4eed-8821-0c827d7101ab";
export const ROLE_CERTIFIED_FOREMAN = "b0f6ddd1-36cc-436c-835e-08359b719eea";
export const ROLE_ESTIMATOR = "11ac42ea-5e6c-45e6-b74e-677483307c23";
export const ROLE_OBSERVER = "fb7de4ac-42ce-442c-a837-1a839d2a9e1b";
export const ROLE_WARRANTY_REVIEWER = "82b57cdd-5715-4571-87e5-d87ea4608af5";

export const ROLE_ORDER = [
    ROLE_SERVICE_REPRESENTATIVE,
    ROLE_ESTIMATOR,
    ROLE_PROJECT_MANAGER,
    ROLE_CERTIFIED_FOREMAN,
    ROLE_OBSERVER,
    "",
    null,
];

// BEGIN MAGIC -- DO NOT EDIT
export type TargetsJSON = {
    fiscalYear: string;
    quotingTarget: string;
    landingTarget: string;
    managingTarget: string;
};

export function JSONToTargets(json: TargetsJSON): Targets {
    return {
        fiscalYear: new Decimal(json.fiscalYear),
        quotingTarget: new Decimal(json.quotingTarget),
        landingTarget: new Decimal(json.landingTarget),
        managingTarget: new Decimal(json.managingTarget),
    };
}
export type TargetsBrokenJSON = {
    fiscalYear?: string;
    quotingTarget?: string;
    landingTarget?: string;
    managingTarget?: string;
};

export function newTargets(): Targets {
    return JSONToTargets(repairTargetsJSON(undefined));
}
export function repairTargetsJSON(
    json: TargetsBrokenJSON | undefined
): TargetsJSON {
    if (json) {
        return {
            fiscalYear: json.fiscalYear || "0",
            quotingTarget: json.quotingTarget || "0",
            landingTarget: json.landingTarget || "0",
            managingTarget: json.managingTarget || "0",
        };
    } else {
        return {
            fiscalYear: undefined || "0",
            quotingTarget: undefined || "0",
            landingTarget: undefined || "0",
            managingTarget: undefined || "0",
        };
    }
}

export function TargetsToJSON(value: Targets): TargetsJSON {
    return {
        fiscalYear: value.fiscalYear.toString(),
        quotingTarget: value.quotingTarget.toString(),
        landingTarget: value.landingTarget.toString(),
        managingTarget: value.managingTarget.toString(),
    };
}

export const TARGETS_META: RecordMeta<
    Targets,
    TargetsJSON,
    TargetsBrokenJSON
> & { name: "Targets" } = {
    name: "Targets",
    type: "record",
    repair: repairTargetsJSON,
    toJSON: TargetsToJSON,
    fromJSON: JSONToTargets,
    fields: {
        fiscalYear: { type: "quantity" },
        quotingTarget: { type: "money" },
        landingTarget: { type: "money" },
        managingTarget: { type: "money" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type SquadJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    azureId: string;
    targets: TargetsJSON[];
};

export function JSONToSquad(json: SquadJSON): Squad {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        azureId: json.azureId,
        targets: json.targets.map((inner) => JSONToTargets(inner)),
    };
}
export type SquadBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    azureId?: string;
    targets?: TargetsJSON[];
};

export function newSquad(): Squad {
    return JSONToSquad(repairSquadJSON(undefined));
}
export function repairSquadJSON(json: SquadBrokenJSON | undefined): SquadJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            azureId: json.azureId || "",
            targets: (json.targets || []).map((inner) =>
                repairTargetsJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            azureId: undefined || "",
            targets: (undefined || []).map((inner) => repairTargetsJSON(inner)),
        };
    }
}

export function SquadToJSON(value: Squad): SquadJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        azureId: value.azureId,
        targets: value.targets.map((inner) => TargetsToJSON(inner)),
    };
}

export const SQUAD_META: RecordMeta<Squad, SquadJSON, SquadBrokenJSON> & {
    name: "Squad";
} = {
    name: "Squad",
    type: "record",
    repair: repairSquadJSON,
    toJSON: SquadToJSON,
    fromJSON: JSONToSquad,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        azureId: { type: "string" },
        targets: { type: "array", items: TARGETS_META },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type UserJSON = {
    id: string;
    code: string;
    name: string;
    recordVersion: number | null;
    phone: string;
    accountEmail: string;
    active: boolean;
    roles: (string | null)[];
    includeWarrantyFund: boolean;
    includeTaxHoldback: boolean;
    includeGst: boolean;
    includeEmployeeProfitShare: boolean;
    postProjectSurvey: boolean;
    companyRole: string;
    commissionsPercentage: string;
    squad: string | null;
    quickbooksId: string;
    targets: TargetsJSON[];
};

export function JSONToUser(json: UserJSON): User {
    return {
        id: { uuid: json.id },
        code: json.code,
        name: json.name,
        recordVersion: { version: json.recordVersion },
        phone: new Phone(json.phone),
        accountEmail: json.accountEmail,
        active: json.active,
        roles: json.roles.map((inner) => inner),
        includeWarrantyFund: json.includeWarrantyFund,
        includeTaxHoldback: json.includeTaxHoldback,
        includeGst: json.includeGst,
        includeEmployeeProfitShare: json.includeEmployeeProfitShare,
        postProjectSurvey: json.postProjectSurvey,
        companyRole: json.companyRole,
        commissionsPercentage: new Decimal(json.commissionsPercentage),
        squad: json.squad,
        quickbooksId: json.quickbooksId,
        targets: json.targets.map((inner) => JSONToTargets(inner)),
    };
}
export type UserBrokenJSON = {
    id?: string;
    code?: string;
    name?: string;
    recordVersion?: number | null;
    phone?: string;
    accountEmail?: string;
    active?: boolean;
    roles?: (string | null)[];
    includeWarrantyFund?: boolean;
    includeTaxHoldback?: boolean;
    includeGst?: boolean;
    includeEmployeeProfitShare?: boolean;
    postProjectSurvey?: boolean;
    companyRole?: string;
    commissionsPercentage?: string;
    squad?: string | null;
    quickbooksId?: string;
    targets?: TargetsJSON[];
};

export function newUser(): User {
    return JSONToUser(repairUserJSON(undefined));
}
export function repairUserJSON(json: UserBrokenJSON | undefined): UserJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            code: json.code || "",
            name: json.name || "",
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            phone: json.phone || "",
            accountEmail: json.accountEmail || "",
            active: json.active || false,
            roles: (json.roles || []).map((inner) => inner || null),
            includeWarrantyFund: json.includeWarrantyFund || false,
            includeTaxHoldback: json.includeTaxHoldback || false,
            includeGst: json.includeGst || false,
            includeEmployeeProfitShare:
                json.includeEmployeeProfitShare || false,
            postProjectSurvey: json.postProjectSurvey || false,
            companyRole: json.companyRole || "",
            commissionsPercentage: json.commissionsPercentage || "0",
            squad: json.squad || null,
            quickbooksId: json.quickbooksId || "",
            targets: (json.targets || []).map((inner) =>
                repairTargetsJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            code: undefined || "",
            name: undefined || "",
            recordVersion: null,
            phone: undefined || "",
            accountEmail: undefined || "",
            active: undefined || false,
            roles: (undefined || []).map((inner) => inner || null),
            includeWarrantyFund: undefined || false,
            includeTaxHoldback: undefined || false,
            includeGst: undefined || false,
            includeEmployeeProfitShare: undefined || false,
            postProjectSurvey: undefined || false,
            companyRole: undefined || "",
            commissionsPercentage: undefined || "0",
            squad: undefined || null,
            quickbooksId: undefined || "",
            targets: (undefined || []).map((inner) => repairTargetsJSON(inner)),
        };
    }
}

export function UserToJSON(value: User): UserJSON {
    return {
        id: value.id.uuid,
        code: value.code,
        name: value.name,
        recordVersion: value.recordVersion.version,
        phone: value.phone.phone,
        accountEmail: value.accountEmail,
        active: value.active,
        roles: value.roles.map((inner) => inner),
        includeWarrantyFund: value.includeWarrantyFund,
        includeTaxHoldback: value.includeTaxHoldback,
        includeGst: value.includeGst,
        includeEmployeeProfitShare: value.includeEmployeeProfitShare,
        postProjectSurvey: value.postProjectSurvey,
        companyRole: value.companyRole,
        commissionsPercentage: value.commissionsPercentage.toString(),
        squad: value.squad,
        quickbooksId: value.quickbooksId,
        targets: value.targets.map((inner) => TargetsToJSON(inner)),
    };
}

export const USER_META: RecordMeta<User, UserJSON, UserBrokenJSON> & {
    name: "User";
} = {
    name: "User",
    type: "record",
    repair: repairUserJSON,
    toJSON: UserToJSON,
    fromJSON: JSONToUser,
    fields: {
        id: { type: "uuid" },
        code: { type: "string" },
        name: { type: "string" },
        recordVersion: { type: "version" },
        phone: { type: "phone" },
        accountEmail: { type: "string" },
        active: { type: "boolean" },
        roles: { type: "array", items: { type: "uuid", linkTo: "Role" } },
        includeWarrantyFund: { type: "boolean" },
        includeTaxHoldback: { type: "boolean" },
        includeGst: { type: "boolean" },
        includeEmployeeProfitShare: { type: "boolean" },
        postProjectSurvey: { type: "boolean" },
        companyRole: { type: "string" },
        commissionsPercentage: { type: "percentage" },
        squad: { type: "uuid", linkTo: "Squad" },
        quickbooksId: { type: "string" },
        targets: { type: "array", items: TARGETS_META },
    },
    userFacingKey: "name",
    functions: {
        label: {
            fn: calcUserLabel,
            parameterTypes: () => [USER_META],
            returnType: { type: "string" },
        },
        codeName: {
            fn: calcUserCodeName,
            parameterTypes: () => [USER_META],
            returnType: { type: "string" },
        },
    },
    segments: {},
};

// END MAGIC -- DO NOT EDIT
