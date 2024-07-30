import { Decimal } from "decimal.js";
import { Money, Quantity } from "../../clay/common";
import { Link } from "../../clay/link";
import { RecordMeta } from "../../clay/meta";
import { genUUID, UUID } from "../../clay/uuid";
import { UnitType } from "../estimate/types/table";
import {
    JSONToProjectDescriptionDetail,
    ProjectDescriptionDetail,
    ProjectDescriptionDetailJSON,
    ProjectDescriptionDetailToJSON,
    PROJECT_DESCRIPTION_DETAIL_META,
    repairProjectDescriptionDetailJSON,
} from "../project/projectDescriptionDetail/table";

//!Data
export type ContingencyItem = {
    id: UUID;
    type: Link<UnitType>;
    description: string;
    quantity: Quantity;
    rate: Money;
    certifiedForemanRate: Money;
    projectDescription: ProjectDescriptionDetail;
};

export const LUMP_SUM_CONTINGENCY_TYPE = "17af3398-c612-4c61-b2df-872decb10821";

export function calcContingencyItemTotal(item: ContingencyItem): Money {
    return item.quantity.times(item.rate);
}

export function calcContingencyItemCertifiedForemanTotal(
    item: ContingencyItem
): Money {
    return item.quantity.times(item.certifiedForemanRate);
}

// BEGIN MAGIC -- DO NOT EDIT
export type ContingencyItemJSON = {
    id: string;
    type: string | null;
    description: string;
    quantity: string;
    rate: string;
    certifiedForemanRate: string;
    projectDescription: ProjectDescriptionDetailJSON;
};

export function JSONToContingencyItem(
    json: ContingencyItemJSON
): ContingencyItem {
    return {
        id: { uuid: json.id },
        type: json.type,
        description: json.description,
        quantity: new Decimal(json.quantity),
        rate: new Decimal(json.rate),
        certifiedForemanRate: new Decimal(json.certifiedForemanRate),
        projectDescription: JSONToProjectDescriptionDetail(
            json.projectDescription
        ),
    };
}
export type ContingencyItemBrokenJSON = {
    id?: string;
    type?: string | null;
    description?: string;
    quantity?: string;
    rate?: string;
    certifiedForemanRate?: string;
    projectDescription?: ProjectDescriptionDetailJSON;
};

export function newContingencyItem(): ContingencyItem {
    return JSONToContingencyItem(repairContingencyItemJSON(undefined));
}
export function repairContingencyItemJSON(
    json: ContingencyItemBrokenJSON | undefined
): ContingencyItemJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            type: json.type || null,
            description: json.description || "",
            quantity: json.quantity || "0",
            rate: json.rate || "0",
            certifiedForemanRate: json.certifiedForemanRate || "0",
            projectDescription: repairProjectDescriptionDetailJSON(
                json.projectDescription
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            type: undefined || null,
            description: undefined || "",
            quantity: undefined || "0",
            rate: undefined || "0",
            certifiedForemanRate: undefined || "0",
            projectDescription: repairProjectDescriptionDetailJSON(undefined),
        };
    }
}

export function ContingencyItemToJSON(
    value: ContingencyItem
): ContingencyItemJSON {
    return {
        id: value.id.uuid,
        type: value.type,
        description: value.description,
        quantity: value.quantity.toString(),
        rate: value.rate.toString(),
        certifiedForemanRate: value.certifiedForemanRate.toString(),
        projectDescription: ProjectDescriptionDetailToJSON(
            value.projectDescription
        ),
    };
}

export const CONTINGENCY_ITEM_META: RecordMeta<
    ContingencyItem,
    ContingencyItemJSON,
    ContingencyItemBrokenJSON
> & { name: "ContingencyItem" } = {
    name: "ContingencyItem",
    type: "record",
    repair: repairContingencyItemJSON,
    toJSON: ContingencyItemToJSON,
    fromJSON: JSONToContingencyItem,
    fields: {
        id: { type: "uuid" },
        type: { type: "uuid", linkTo: "UnitType" },
        description: { type: "string" },
        quantity: { type: "quantity" },
        rate: { type: "money" },
        certifiedForemanRate: { type: "money" },
        projectDescription: PROJECT_DESCRIPTION_DETAIL_META,
    },
    userFacingKey: null,
    functions: {
        total: {
            fn: calcContingencyItemTotal,
            parameterTypes: () => [CONTINGENCY_ITEM_META],
            returnType: { type: "money" },
        },
        certifiedForemanTotal: {
            fn: calcContingencyItemCertifiedForemanTotal,
            parameterTypes: () => [CONTINGENCY_ITEM_META],
            returnType: { type: "money" },
        },
    },
    segments: {},
};

// END MAGIC -- DO NOT EDIT
