import dateParse from "date-fns/parseISO";
import { Decimal } from "decimal.js";
import { createSelector } from "reselect";
import { Money, Percentage, Quantity } from "../../clay/common";
import { Link } from "../../clay/link";
import { RecordMeta } from "../../clay/meta";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";
import { Project } from "../project/table";
import { Quotation } from "../quotation/table";
import { User } from "../user/table";
import {
    EstimateAction,
    EstimateActionJSON,
    EstimateActionToJSON,
    ESTIMATE_ACTION_META,
    JSONToEstimateAction,
    JSONToSideAction,
    repairEstimateActionJSON,
    repairSideActionJSON,
    resolveAction,
    SideAction,
    SideActionJSON,
    SideActionToJSON,
    SIDE_ACTION_META,
} from "./action/table";
import {
    Allowance,
    allowanceCost,
    AllowanceJSON,
    allowancePrice,
    AllowanceToJSON,
    ALLOWANCE_META,
    JSONToAllowance,
    repairAllowanceJSON,
} from "./allowances/table";
import {
    Area,
    AreaJSON,
    AreaToJSON,
    AREA_META,
    JSONToArea,
    repairAreaJSON,
} from "./area/table";
import { Side } from "./side/table";
import { EstimateTemplate } from "./templates/table";
import { TimeAndMaterialsEstimate } from "./time-and-materials/table";
import { Substrate, UnitType } from "./types/table";

//!Data
export type EstimateCopyRequest = {
    id: UUID;
    addedDateTime: Date | null;
    recordVersion: Version;
    type: string;
    estimate: Link<Estimate>;
    target: Link<Project>;
    user: Link<User>;
    approved: boolean;
};

export function contingencySide(estimate: Estimate): Side {
    return {
        name: "",
        multiply: new Decimal(1),
        actions: estimate.contingencyItemsV2.map((x) => x.side),
        room: {
            width: new Decimal(0),
            height: new Decimal(0),
            length: new Decimal(0),
            note: "",
            additionalRooms: [],
            includeBaseboard: false,
            includeCeiling: false,
            includeChairRail: false,
            includeCrown: false,
            includeWalls: false,
            multiplyBaseboard: new Decimal(1),
            multiplyCeiling: new Decimal(1),
            multiplyChairRail: new Decimal(1),
            multiplyCrown: new Decimal(1),
            multiplyWalls: new Decimal(1),
        },
    };
}

export function calcEstimateCopyRequestIsUnapproved(
    request: EstimateCopyRequest
): boolean {
    return !request.approved;
}

export function calcEstimateCopyRequestApprovedUsers(
    request: EstimateCopyRequest
): Link<User>[] {
    return [request.user].filter((entry) => request.approved);
}

//!Data
export type ContactDetails = {
    contacted: boolean;
    notes: string;
};

//!Data
export type EstimateCommon = {
    name: string;
    project: Link<Project>;
    user: Link<User>;
    creationDate: Date | null;
    markup: Percentage;
    materialsMarkup: Percentage | null;
    additionalMarkup: Percentage;
    additionalMaterialsMarkup: Percentage | null;
    additionalAllowancesMarkup: Percentage | null;
    additionalMarkupNote: string;
    template: Link<EstimateTemplate>;
    change: boolean;
    markupExclusive: boolean;
    archiveOf: Link<Estimate | TimeAndMaterialsEstimate>;
    archiveDate: Date | null;
    archiveFor: Link<Quotation>;
};

//!Data
export type EstimateContingencyItemType = {
    id: UUID;
    recordVersion: Version;
    name: string;
    rate: Money;
    type: Link<UnitType>;
    substrate: Link<Substrate>;
};

//!Data
export type EstimateContingencyItemV2 = {
    estimate: EstimateAction;
    side: SideAction;
    areas: Link<Area>[];
};

//!Data
export type EstimateContingencyItem = {
    id: UUID;
    name: string;
    substrate: Link<Substrate>;
    quantity: Quantity;
    type: Link<UnitType>;
    rate: Money;
    markup: Percentage;
    areas: Link<Area>[];
    finishSchedule: string;
};

export function calcEstimateContingencyItemCost(
    item: EstimateContingencyItem
): Money {
    return item.quantity.times(item.rate);
}

export function calcEstimateContingencyItemPrice(
    item: EstimateContingencyItem
): Money {
    return calcEstimateContingencyItemCost(item).times(
        new Decimal(1).plus(item.markup)
    );
}

//!Data
export type Estimate = {
    id: UUID;
    recordVersion: Version;
    common: EstimateCommon;

    areas: Area[];

    actions: EstimateAction[];
    allowances: Allowance[];
    contingencyItems: EstimateContingencyItem[];
    contingencyItemsV2: EstimateContingencyItemV2[];

    baseHourRate: Money;
    notes: string;
};

export const noteTags = createSelector(
    (estimate: Estimate) => estimate.notes,
    (value: string) => {
        const element = document.createElement("div");
        element.innerHTML = value;
        const tags: string[] = [];
        for (const mention of Array.from(
            element.getElementsByClassName("mention")
        )) {
            tags.push(
                (mention.getAttribute("data-mention") as string).substring(1)
            );
        }
        return new Set(tags);
    }
);

export function estimateTotal(estimate: Estimate) {
    const overall = {
        hours: new Decimal(0),
        materials: new Decimal(0),
        cost: new Decimal(0),
        price: new Decimal(0),
    };

    for (const allowance of estimate.allowances) {
        overall.cost = overall.cost.plus(allowanceCost(allowance));
        overall.price = overall.price.plus(
            allowancePrice(
                allowance,
                estimate.common.additionalAllowancesMarkup ??
                    estimate.common.additionalMarkup
            )
        );
    }

    for (const contingencyItem of estimate.contingencyItems) {
        overall.cost = overall.cost.plus(
            calcEstimateContingencyItemCost(contingencyItem)
        );
        overall.price = overall.price.plus(
            calcEstimateContingencyItemPrice(contingencyItem)
        );
    }

    for (const area of estimate.areas) {
        let sideIndex = -1;
        for (const side of area.sides) {
            sideIndex += 1;

            for (let index = 0; index < side.actions.length; index++) {
                const estimateAction = estimate.actions[index];

                if (side.actions[index] && estimateAction) {
                    const resolvedAction = resolveAction(
                        estimateAction,
                        side.actions[index],
                        side,
                        estimate,
                        false
                    );

                    const factor = side.multiply;

                    overall.hours = overall.hours
                        .plus(resolvedAction.hours)
                        .times(factor);
                    overall.materials = overall.materials
                        .plus(resolvedAction.materials)
                        .times(factor);
                    overall.cost = overall.cost.plus(
                        resolvedAction.hoursCost
                            .plus(resolvedAction.materialsCost)
                            .times(factor)
                    );
                    overall.price = overall.price.plus(
                        resolvedAction.hoursPrice
                            .plus(resolvedAction.materialsPrice)
                            .times(factor)
                    );
                }
            }
        }
    }
    return overall;
}

// BEGIN MAGIC -- DO NOT EDIT
export type EstimateCopyRequestJSON = {
    id: string;
    addedDateTime: string | null;
    recordVersion: number | null;
    type: string;
    estimate: string | null;
    target: string | null;
    user: string | null;
    approved: boolean;
};

export function JSONToEstimateCopyRequest(
    json: EstimateCopyRequestJSON
): EstimateCopyRequest {
    return {
        id: { uuid: json.id },
        addedDateTime:
            json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
        recordVersion: { version: json.recordVersion },
        type: json.type,
        estimate: json.estimate,
        target: json.target,
        user: json.user,
        approved: json.approved,
    };
}
export type EstimateCopyRequestBrokenJSON = {
    id?: string;
    addedDateTime?: string | null;
    recordVersion?: number | null;
    type?: string;
    estimate?: string | null;
    target?: string | null;
    user?: string | null;
    approved?: boolean;
};

export function newEstimateCopyRequest(): EstimateCopyRequest {
    return JSONToEstimateCopyRequest(repairEstimateCopyRequestJSON(undefined));
}
export function repairEstimateCopyRequestJSON(
    json: EstimateCopyRequestBrokenJSON | undefined
): EstimateCopyRequestJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            addedDateTime: json.addedDateTime
                ? new Date(json.addedDateTime!).toISOString()
                : null,
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            type: json.type || "",
            estimate: json.estimate || null,
            target: json.target || null,
            user: json.user || null,
            approved: json.approved || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            addedDateTime: undefined
                ? new Date(undefined!).toISOString()
                : null,
            recordVersion: null,
            type: undefined || "",
            estimate: undefined || null,
            target: undefined || null,
            user: undefined || null,
            approved: undefined || false,
        };
    }
}

export function EstimateCopyRequestToJSON(
    value: EstimateCopyRequest
): EstimateCopyRequestJSON {
    return {
        id: value.id.uuid,
        addedDateTime:
            value.addedDateTime !== null
                ? value.addedDateTime.toISOString()
                : null,
        recordVersion: value.recordVersion.version,
        type: value.type,
        estimate: value.estimate,
        target: value.target,
        user: value.user,
        approved: value.approved,
    };
}

export const ESTIMATE_COPY_REQUEST_META: RecordMeta<
    EstimateCopyRequest,
    EstimateCopyRequestJSON,
    EstimateCopyRequestBrokenJSON
> & { name: "EstimateCopyRequest" } = {
    name: "EstimateCopyRequest",
    type: "record",
    repair: repairEstimateCopyRequestJSON,
    toJSON: EstimateCopyRequestToJSON,
    fromJSON: JSONToEstimateCopyRequest,
    fields: {
        id: { type: "uuid" },
        addedDateTime: { type: "datetime" },
        recordVersion: { type: "version" },
        type: { type: "string" },
        estimate: { type: "uuid", linkTo: "Estimate" },
        target: { type: "uuid", linkTo: "Project" },
        user: { type: "uuid", linkTo: "User" },
        approved: { type: "boolean" },
    },
    userFacingKey: null,
    functions: {
        isUnapproved: {
            fn: calcEstimateCopyRequestIsUnapproved,
            parameterTypes: () => [ESTIMATE_COPY_REQUEST_META],
            returnType: { type: "boolean" },
        },
        approvedUsers: {
            fn: calcEstimateCopyRequestApprovedUsers,
            parameterTypes: () => [ESTIMATE_COPY_REQUEST_META],
            returnType: {
                type: "array",
                items: { type: "uuid", linkTo: "User" },
            },
        },
    },
    segments: {},
};

export type ContactDetailsJSON = {
    contacted: boolean;
    notes: string;
};

export function JSONToContactDetails(json: ContactDetailsJSON): ContactDetails {
    return {
        contacted: json.contacted,
        notes: json.notes,
    };
}
export type ContactDetailsBrokenJSON = {
    contacted?: boolean;
    notes?: string;
};

export function newContactDetails(): ContactDetails {
    return JSONToContactDetails(repairContactDetailsJSON(undefined));
}
export function repairContactDetailsJSON(
    json: ContactDetailsBrokenJSON | undefined
): ContactDetailsJSON {
    if (json) {
        return {
            contacted: json.contacted || false,
            notes: json.notes || "",
        };
    } else {
        return {
            contacted: undefined || false,
            notes: undefined || "",
        };
    }
}

export function ContactDetailsToJSON(
    value: ContactDetails
): ContactDetailsJSON {
    return {
        contacted: value.contacted,
        notes: value.notes,
    };
}

export const CONTACT_DETAILS_META: RecordMeta<
    ContactDetails,
    ContactDetailsJSON,
    ContactDetailsBrokenJSON
> & { name: "ContactDetails" } = {
    name: "ContactDetails",
    type: "record",
    repair: repairContactDetailsJSON,
    toJSON: ContactDetailsToJSON,
    fromJSON: JSONToContactDetails,
    fields: {
        contacted: { type: "boolean" },
        notes: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type EstimateCommonJSON = {
    name: string;
    project: string | null;
    user: string | null;
    creationDate: string | null;
    markup: string;
    materialsMarkup: string | null;
    additionalMarkup: string;
    additionalMaterialsMarkup: string | null;
    additionalAllowancesMarkup: string | null;
    additionalMarkupNote: string;
    template: string | null;
    change: boolean;
    markupExclusive: boolean;
    archiveOf: string | null;
    archiveDate: string | null;
    archiveFor: string | null;
};

export function JSONToEstimateCommon(json: EstimateCommonJSON): EstimateCommon {
    return {
        name: json.name,
        project: json.project,
        user: json.user,
        creationDate:
            json.creationDate !== null ? dateParse(json.creationDate) : null,
        markup: new Decimal(json.markup),
        materialsMarkup:
            json.materialsMarkup !== null
                ? new Decimal(json.materialsMarkup)
                : null,
        additionalMarkup: new Decimal(json.additionalMarkup),
        additionalMaterialsMarkup:
            json.additionalMaterialsMarkup !== null
                ? new Decimal(json.additionalMaterialsMarkup)
                : null,
        additionalAllowancesMarkup:
            json.additionalAllowancesMarkup !== null
                ? new Decimal(json.additionalAllowancesMarkup)
                : null,
        additionalMarkupNote: json.additionalMarkupNote,
        template: json.template,
        change: json.change,
        markupExclusive: json.markupExclusive,
        archiveOf: json.archiveOf,
        archiveDate:
            json.archiveDate !== null ? dateParse(json.archiveDate) : null,
        archiveFor: json.archiveFor,
    };
}
export type EstimateCommonBrokenJSON = {
    name?: string;
    project?: string | null;
    user?: string | null;
    creationDate?: string | null;
    markup?: string;
    materialsMarkup?: string | null;
    additionalMarkup?: string;
    additionalMaterialsMarkup?: string | null;
    additionalAllowancesMarkup?: string | null;
    additionalMarkupNote?: string;
    template?: string | null;
    change?: boolean;
    markupExclusive?: boolean;
    archiveOf?: string | null;
    archiveDate?: string | null;
    archiveFor?: string | null;
};

export function newEstimateCommon(): EstimateCommon {
    return JSONToEstimateCommon(repairEstimateCommonJSON(undefined));
}
export function repairEstimateCommonJSON(
    json: EstimateCommonBrokenJSON | undefined
): EstimateCommonJSON {
    if (json) {
        return {
            name: json.name || "",
            project: json.project || null,
            user: json.user || null,
            creationDate: json.creationDate
                ? new Date(json.creationDate!).toISOString()
                : null,
            markup: json.markup || "0",
            materialsMarkup: json.materialsMarkup || null,
            additionalMarkup: json.additionalMarkup || "0",
            additionalMaterialsMarkup: json.additionalMaterialsMarkup || null,
            additionalAllowancesMarkup: json.additionalAllowancesMarkup || null,
            additionalMarkupNote: json.additionalMarkupNote || "",
            template: json.template || null,
            change: json.change || false,
            markupExclusive: json.markupExclusive || false,
            archiveOf: json.archiveOf || null,
            archiveDate: json.archiveDate
                ? new Date(json.archiveDate!).toISOString()
                : null,
            archiveFor: json.archiveFor || null,
        };
    } else {
        return {
            name: undefined || "",
            project: undefined || null,
            user: undefined || null,
            creationDate: undefined ? new Date(undefined!).toISOString() : null,
            markup: undefined || "0",
            materialsMarkup: undefined || null,
            additionalMarkup: undefined || "0",
            additionalMaterialsMarkup: undefined || null,
            additionalAllowancesMarkup: undefined || null,
            additionalMarkupNote: undefined || "",
            template: undefined || null,
            change: undefined || false,
            markupExclusive: undefined || false,
            archiveOf: undefined || null,
            archiveDate: undefined ? new Date(undefined!).toISOString() : null,
            archiveFor: undefined || null,
        };
    }
}

export function EstimateCommonToJSON(
    value: EstimateCommon
): EstimateCommonJSON {
    return {
        name: value.name,
        project: value.project,
        user: value.user,
        creationDate:
            value.creationDate !== null
                ? value.creationDate.toISOString()
                : null,
        markup: value.markup.toString(),
        materialsMarkup:
            value.materialsMarkup !== null
                ? value.materialsMarkup.toString()
                : null,
        additionalMarkup: value.additionalMarkup.toString(),
        additionalMaterialsMarkup:
            value.additionalMaterialsMarkup !== null
                ? value.additionalMaterialsMarkup.toString()
                : null,
        additionalAllowancesMarkup:
            value.additionalAllowancesMarkup !== null
                ? value.additionalAllowancesMarkup.toString()
                : null,
        additionalMarkupNote: value.additionalMarkupNote,
        template: value.template,
        change: value.change,
        markupExclusive: value.markupExclusive,
        archiveOf: value.archiveOf,
        archiveDate:
            value.archiveDate !== null ? value.archiveDate.toISOString() : null,
        archiveFor: value.archiveFor,
    };
}

export const ESTIMATE_COMMON_META: RecordMeta<
    EstimateCommon,
    EstimateCommonJSON,
    EstimateCommonBrokenJSON
> & { name: "EstimateCommon" } = {
    name: "EstimateCommon",
    type: "record",
    repair: repairEstimateCommonJSON,
    toJSON: EstimateCommonToJSON,
    fromJSON: JSONToEstimateCommon,
    fields: {
        name: { type: "string" },
        project: { type: "uuid", linkTo: "Project" },
        user: { type: "uuid", linkTo: "User" },
        creationDate: { type: "datetime" },
        markup: { type: "percentage" },
        materialsMarkup: { type: "percentage?" },
        additionalMarkup: { type: "percentage" },
        additionalMaterialsMarkup: { type: "percentage?" },
        additionalAllowancesMarkup: { type: "percentage?" },
        additionalMarkupNote: { type: "string" },
        template: { type: "uuid", linkTo: "EstimateTemplate" },
        change: { type: "boolean" },
        markupExclusive: { type: "boolean" },
        archiveOf: {
            type: "uuid",
            linkTo: "Estimate | TimeAndMaterialsEstimate",
        },
        archiveDate: { type: "datetime" },
        archiveFor: { type: "uuid", linkTo: "Quotation" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type EstimateContingencyItemTypeJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    rate: string;
    type: string | null;
    substrate: string | null;
};

export function JSONToEstimateContingencyItemType(
    json: EstimateContingencyItemTypeJSON
): EstimateContingencyItemType {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        rate: new Decimal(json.rate),
        type: json.type,
        substrate: json.substrate,
    };
}
export type EstimateContingencyItemTypeBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    rate?: string;
    type?: string | null;
    substrate?: string | null;
};

export function newEstimateContingencyItemType(): EstimateContingencyItemType {
    return JSONToEstimateContingencyItemType(
        repairEstimateContingencyItemTypeJSON(undefined)
    );
}
export function repairEstimateContingencyItemTypeJSON(
    json: EstimateContingencyItemTypeBrokenJSON | undefined
): EstimateContingencyItemTypeJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            rate: json.rate || "0",
            type: json.type || null,
            substrate: json.substrate || null,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            rate: undefined || "0",
            type: undefined || null,
            substrate: undefined || null,
        };
    }
}

export function EstimateContingencyItemTypeToJSON(
    value: EstimateContingencyItemType
): EstimateContingencyItemTypeJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        rate: value.rate.toString(),
        type: value.type,
        substrate: value.substrate,
    };
}

export const ESTIMATE_CONTINGENCY_ITEM_TYPE_META: RecordMeta<
    EstimateContingencyItemType,
    EstimateContingencyItemTypeJSON,
    EstimateContingencyItemTypeBrokenJSON
> & { name: "EstimateContingencyItemType" } = {
    name: "EstimateContingencyItemType",
    type: "record",
    repair: repairEstimateContingencyItemTypeJSON,
    toJSON: EstimateContingencyItemTypeToJSON,
    fromJSON: JSONToEstimateContingencyItemType,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        rate: { type: "money" },
        type: { type: "uuid", linkTo: "UnitType" },
        substrate: { type: "uuid", linkTo: "Substrate" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type EstimateContingencyItemV2JSON = {
    estimate: EstimateActionJSON;
    side: SideActionJSON;
    areas: (string | null)[];
};

export function JSONToEstimateContingencyItemV2(
    json: EstimateContingencyItemV2JSON
): EstimateContingencyItemV2 {
    return {
        estimate: JSONToEstimateAction(json.estimate),
        side: JSONToSideAction(json.side),
        areas: json.areas.map((inner) => inner),
    };
}
export type EstimateContingencyItemV2BrokenJSON = {
    estimate?: EstimateActionJSON;
    side?: SideActionJSON;
    areas?: (string | null)[];
};

export function newEstimateContingencyItemV2(): EstimateContingencyItemV2 {
    return JSONToEstimateContingencyItemV2(
        repairEstimateContingencyItemV2JSON(undefined)
    );
}
export function repairEstimateContingencyItemV2JSON(
    json: EstimateContingencyItemV2BrokenJSON | undefined
): EstimateContingencyItemV2JSON {
    if (json) {
        return {
            estimate: repairEstimateActionJSON(json.estimate),
            side: repairSideActionJSON(json.side),
            areas: (json.areas || []).map((inner) => inner || null),
        };
    } else {
        return {
            estimate: repairEstimateActionJSON(undefined),
            side: repairSideActionJSON(undefined),
            areas: (undefined || []).map((inner) => inner || null),
        };
    }
}

export function EstimateContingencyItemV2ToJSON(
    value: EstimateContingencyItemV2
): EstimateContingencyItemV2JSON {
    return {
        estimate: EstimateActionToJSON(value.estimate),
        side: SideActionToJSON(value.side),
        areas: value.areas.map((inner) => inner),
    };
}

export const ESTIMATE_CONTINGENCY_ITEM_V2_META: RecordMeta<
    EstimateContingencyItemV2,
    EstimateContingencyItemV2JSON,
    EstimateContingencyItemV2BrokenJSON
> & { name: "EstimateContingencyItemV2" } = {
    name: "EstimateContingencyItemV2",
    type: "record",
    repair: repairEstimateContingencyItemV2JSON,
    toJSON: EstimateContingencyItemV2ToJSON,
    fromJSON: JSONToEstimateContingencyItemV2,
    fields: {
        estimate: ESTIMATE_ACTION_META,
        side: SIDE_ACTION_META,
        areas: { type: "array", items: { type: "uuid", linkTo: "Area" } },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type EstimateContingencyItemJSON = {
    id: string;
    name: string;
    substrate: string | null;
    quantity: string;
    type: string | null;
    rate: string;
    markup: string;
    areas: (string | null)[];
    finishSchedule: string;
};

export function JSONToEstimateContingencyItem(
    json: EstimateContingencyItemJSON
): EstimateContingencyItem {
    return {
        id: { uuid: json.id },
        name: json.name,
        substrate: json.substrate,
        quantity: new Decimal(json.quantity),
        type: json.type,
        rate: new Decimal(json.rate),
        markup: new Decimal(json.markup),
        areas: json.areas.map((inner) => inner),
        finishSchedule: json.finishSchedule,
    };
}
export type EstimateContingencyItemBrokenJSON = {
    id?: string;
    name?: string;
    substrate?: string | null;
    quantity?: string;
    type?: string | null;
    rate?: string;
    markup?: string;
    areas?: (string | null)[];
    finishSchedule?: string;
};

export function newEstimateContingencyItem(): EstimateContingencyItem {
    return JSONToEstimateContingencyItem(
        repairEstimateContingencyItemJSON(undefined)
    );
}
export function repairEstimateContingencyItemJSON(
    json: EstimateContingencyItemBrokenJSON | undefined
): EstimateContingencyItemJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            substrate: json.substrate || null,
            quantity: json.quantity || "0",
            type: json.type || null,
            rate: json.rate || "0",
            markup: json.markup || "0",
            areas: (json.areas || []).map((inner) => inner || null),
            finishSchedule: json.finishSchedule || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            substrate: undefined || null,
            quantity: undefined || "0",
            type: undefined || null,
            rate: undefined || "0",
            markup: undefined || "0",
            areas: (undefined || []).map((inner) => inner || null),
            finishSchedule: undefined || "",
        };
    }
}

export function EstimateContingencyItemToJSON(
    value: EstimateContingencyItem
): EstimateContingencyItemJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        substrate: value.substrate,
        quantity: value.quantity.toString(),
        type: value.type,
        rate: value.rate.toString(),
        markup: value.markup.toString(),
        areas: value.areas.map((inner) => inner),
        finishSchedule: value.finishSchedule,
    };
}

export const ESTIMATE_CONTINGENCY_ITEM_META: RecordMeta<
    EstimateContingencyItem,
    EstimateContingencyItemJSON,
    EstimateContingencyItemBrokenJSON
> & { name: "EstimateContingencyItem" } = {
    name: "EstimateContingencyItem",
    type: "record",
    repair: repairEstimateContingencyItemJSON,
    toJSON: EstimateContingencyItemToJSON,
    fromJSON: JSONToEstimateContingencyItem,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        substrate: { type: "uuid", linkTo: "Substrate" },
        quantity: { type: "quantity" },
        type: { type: "uuid", linkTo: "UnitType" },
        rate: { type: "money" },
        markup: { type: "percentage" },
        areas: { type: "array", items: { type: "uuid", linkTo: "Area" } },
        finishSchedule: { type: "string" },
    },
    userFacingKey: "name",
    functions: {
        cost: {
            fn: calcEstimateContingencyItemCost,
            parameterTypes: () => [ESTIMATE_CONTINGENCY_ITEM_META],
            returnType: { type: "money" },
        },
        price: {
            fn: calcEstimateContingencyItemPrice,
            parameterTypes: () => [ESTIMATE_CONTINGENCY_ITEM_META],
            returnType: { type: "money" },
        },
    },
    segments: {},
};

export type EstimateJSON = {
    id: string;
    recordVersion: number | null;
    common: EstimateCommonJSON;
    areas: AreaJSON[];
    actions: EstimateActionJSON[];
    allowances: AllowanceJSON[];
    contingencyItems: EstimateContingencyItemJSON[];
    contingencyItemsV2: EstimateContingencyItemV2JSON[];
    baseHourRate: string;
    notes: string;
};

export function JSONToEstimate(json: EstimateJSON): Estimate {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        common: JSONToEstimateCommon(json.common),
        areas: json.areas.map((inner) => JSONToArea(inner)),
        actions: json.actions.map((inner) => JSONToEstimateAction(inner)),
        allowances: json.allowances.map((inner) => JSONToAllowance(inner)),
        contingencyItems: json.contingencyItems.map((inner) =>
            JSONToEstimateContingencyItem(inner)
        ),
        contingencyItemsV2: json.contingencyItemsV2.map((inner) =>
            JSONToEstimateContingencyItemV2(inner)
        ),
        baseHourRate: new Decimal(json.baseHourRate),
        notes: json.notes,
    };
}
export type EstimateBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    common?: EstimateCommonJSON;
    areas?: AreaJSON[];
    actions?: EstimateActionJSON[];
    allowances?: AllowanceJSON[];
    contingencyItems?: EstimateContingencyItemJSON[];
    contingencyItemsV2?: EstimateContingencyItemV2JSON[];
    baseHourRate?: string;
    notes?: string;
};

export function newEstimate(): Estimate {
    return JSONToEstimate(repairEstimateJSON(undefined));
}
export function repairEstimateJSON(
    json: EstimateBrokenJSON | undefined
): EstimateJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            common: repairEstimateCommonJSON(json.common),
            areas: (json.areas || []).map((inner) => repairAreaJSON(inner)),
            actions: (json.actions || []).map((inner) =>
                repairEstimateActionJSON(inner)
            ),
            allowances: (json.allowances || []).map((inner) =>
                repairAllowanceJSON(inner)
            ),
            contingencyItems: (json.contingencyItems || []).map((inner) =>
                repairEstimateContingencyItemJSON(inner)
            ),
            contingencyItemsV2: (json.contingencyItemsV2 || []).map((inner) =>
                repairEstimateContingencyItemV2JSON(inner)
            ),
            baseHourRate: json.baseHourRate || "0",
            notes: json.notes || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            common: repairEstimateCommonJSON(undefined),
            areas: (undefined || []).map((inner) => repairAreaJSON(inner)),
            actions: (undefined || []).map((inner) =>
                repairEstimateActionJSON(inner)
            ),
            allowances: (undefined || []).map((inner) =>
                repairAllowanceJSON(inner)
            ),
            contingencyItems: (undefined || []).map((inner) =>
                repairEstimateContingencyItemJSON(inner)
            ),
            contingencyItemsV2: (undefined || []).map((inner) =>
                repairEstimateContingencyItemV2JSON(inner)
            ),
            baseHourRate: undefined || "0",
            notes: undefined || "",
        };
    }
}

export function EstimateToJSON(value: Estimate): EstimateJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        common: EstimateCommonToJSON(value.common),
        areas: value.areas.map((inner) => AreaToJSON(inner)),
        actions: value.actions.map((inner) => EstimateActionToJSON(inner)),
        allowances: value.allowances.map((inner) => AllowanceToJSON(inner)),
        contingencyItems: value.contingencyItems.map((inner) =>
            EstimateContingencyItemToJSON(inner)
        ),
        contingencyItemsV2: value.contingencyItemsV2.map((inner) =>
            EstimateContingencyItemV2ToJSON(inner)
        ),
        baseHourRate: value.baseHourRate.toString(),
        notes: value.notes,
    };
}

export const ESTIMATE_META: RecordMeta<
    Estimate,
    EstimateJSON,
    EstimateBrokenJSON
> & { name: "Estimate" } = {
    name: "Estimate",
    type: "record",
    repair: repairEstimateJSON,
    toJSON: EstimateToJSON,
    fromJSON: JSONToEstimate,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        common: ESTIMATE_COMMON_META,
        areas: { type: "array", items: AREA_META },
        actions: { type: "array", items: ESTIMATE_ACTION_META },
        allowances: { type: "array", items: ALLOWANCE_META },
        contingencyItems: {
            type: "array",
            items: ESTIMATE_CONTINGENCY_ITEM_META,
        },
        contingencyItemsV2: {
            type: "array",
            items: ESTIMATE_CONTINGENCY_ITEM_V2_META,
        },
        baseHourRate: { type: "money" },
        notes: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
