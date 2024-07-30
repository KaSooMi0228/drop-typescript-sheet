import { Decimal } from "decimal.js";
import { Money, Percentage } from "../../../clay/common";
import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { genUUID, UUID } from "../../../clay/uuid";
import { Version } from "../../../clay/version";
import { ContractNote, ScopeOfWork } from "../../quotation/notes/table";
import { FinishSchedule } from "../finish-schedule/table";
import { Rate } from "../rate/table";
import { EstimateContingencyItemType } from "../table";
import { ItemType, UnitType } from "../types/table";

//!Data
export type EstimateTemplateAction = {
    name: string;
    itemType: Link<ItemType>;
    calculator:
        | ""
        | "Linear"
        | "Square"
        | "Sealant"
        | "Walls"
        | "Ceiling"
        | "Baseboard"
        | "Crown"
        | "Chair Rail";
    hourRate: Money | null;
    finishSchedule: Link<FinishSchedule>;
    rate: Link<Rate>;
    unitType: Link<UnitType>;
};

//!Data
export type EstimateTemplate = {
    id: UUID;
    recordVersion: Version;
    name: string;

    markup: Percentage;
    materialsMarkup: Percentage | null;

    kind: "" | "full" | "time-and-materials";

    baseHourRate: Money;

    actions: EstimateTemplateAction[];
    scopesOfWork: Link<ScopeOfWork>[];
    contractNotes: Link<ContractNote>[];
    contingencyItems: Link<EstimateContingencyItemType>[];
};

// BEGIN MAGIC -- DO NOT EDIT
export type EstimateTemplateActionJSON = {
    name: string;
    itemType: string | null;
    calculator: string;
    hourRate: string | null;
    finishSchedule: string | null;
    rate: string | null;
    unitType: string | null;
};

export function JSONToEstimateTemplateAction(
    json: EstimateTemplateActionJSON
): EstimateTemplateAction {
    return {
        name: json.name,
        itemType: json.itemType,
        calculator: json.calculator as any,
        hourRate: json.hourRate !== null ? new Decimal(json.hourRate) : null,
        finishSchedule: json.finishSchedule,
        rate: json.rate,
        unitType: json.unitType,
    };
}
export type EstimateTemplateActionBrokenJSON = {
    name?: string;
    itemType?: string | null;
    calculator?: string;
    hourRate?: string | null;
    finishSchedule?: string | null;
    rate?: string | null;
    unitType?: string | null;
};

export function newEstimateTemplateAction(): EstimateTemplateAction {
    return JSONToEstimateTemplateAction(
        repairEstimateTemplateActionJSON(undefined)
    );
}
export function repairEstimateTemplateActionJSON(
    json: EstimateTemplateActionBrokenJSON | undefined
): EstimateTemplateActionJSON {
    if (json) {
        return {
            name: json.name || "",
            itemType: json.itemType || null,
            calculator: json.calculator || "",
            hourRate: json.hourRate || null,
            finishSchedule: json.finishSchedule || null,
            rate: json.rate || null,
            unitType: json.unitType || null,
        };
    } else {
        return {
            name: undefined || "",
            itemType: undefined || null,
            calculator: undefined || "",
            hourRate: undefined || null,
            finishSchedule: undefined || null,
            rate: undefined || null,
            unitType: undefined || null,
        };
    }
}

export function EstimateTemplateActionToJSON(
    value: EstimateTemplateAction
): EstimateTemplateActionJSON {
    return {
        name: value.name,
        itemType: value.itemType,
        calculator: value.calculator,
        hourRate: value.hourRate !== null ? value.hourRate.toString() : null,
        finishSchedule: value.finishSchedule,
        rate: value.rate,
        unitType: value.unitType,
    };
}

export const ESTIMATE_TEMPLATE_ACTION_META: RecordMeta<
    EstimateTemplateAction,
    EstimateTemplateActionJSON,
    EstimateTemplateActionBrokenJSON
> & { name: "EstimateTemplateAction" } = {
    name: "EstimateTemplateAction",
    type: "record",
    repair: repairEstimateTemplateActionJSON,
    toJSON: EstimateTemplateActionToJSON,
    fromJSON: JSONToEstimateTemplateAction,
    fields: {
        name: { type: "string" },
        itemType: { type: "uuid", linkTo: "ItemType" },
        calculator: {
            type: "enum",
            values: [
                "",
                "Linear",
                "Square",
                "Sealant",
                "Walls",
                "Ceiling",
                "Baseboard",
                "Crown",
                "Chair Rail",
            ],
        },
        hourRate: { type: "money?" },
        finishSchedule: { type: "uuid", linkTo: "FinishSchedule" },
        rate: { type: "uuid", linkTo: "Rate" },
        unitType: { type: "uuid", linkTo: "UnitType" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type EstimateTemplateJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    markup: string;
    materialsMarkup: string | null;
    kind: string;
    baseHourRate: string;
    actions: EstimateTemplateActionJSON[];
    scopesOfWork: (string | null)[];
    contractNotes: (string | null)[];
    contingencyItems: (string | null)[];
};

export function JSONToEstimateTemplate(
    json: EstimateTemplateJSON
): EstimateTemplate {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        markup: new Decimal(json.markup),
        materialsMarkup:
            json.materialsMarkup !== null
                ? new Decimal(json.materialsMarkup)
                : null,
        kind: json.kind as any,
        baseHourRate: new Decimal(json.baseHourRate),
        actions: json.actions.map((inner) =>
            JSONToEstimateTemplateAction(inner)
        ),
        scopesOfWork: json.scopesOfWork.map((inner) => inner),
        contractNotes: json.contractNotes.map((inner) => inner),
        contingencyItems: json.contingencyItems.map((inner) => inner),
    };
}
export type EstimateTemplateBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    markup?: string;
    materialsMarkup?: string | null;
    kind?: string;
    baseHourRate?: string;
    actions?: EstimateTemplateActionJSON[];
    scopesOfWork?: (string | null)[];
    contractNotes?: (string | null)[];
    contingencyItems?: (string | null)[];
};

export function newEstimateTemplate(): EstimateTemplate {
    return JSONToEstimateTemplate(repairEstimateTemplateJSON(undefined));
}
export function repairEstimateTemplateJSON(
    json: EstimateTemplateBrokenJSON | undefined
): EstimateTemplateJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            markup: json.markup || "0",
            materialsMarkup: json.materialsMarkup || null,
            kind: json.kind || "",
            baseHourRate: json.baseHourRate || "0",
            actions: (json.actions || []).map((inner) =>
                repairEstimateTemplateActionJSON(inner)
            ),
            scopesOfWork: (json.scopesOfWork || []).map(
                (inner) => inner || null
            ),
            contractNotes: (json.contractNotes || []).map(
                (inner) => inner || null
            ),
            contingencyItems: (json.contingencyItems || []).map(
                (inner) => inner || null
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            markup: undefined || "0",
            materialsMarkup: undefined || null,
            kind: undefined || "",
            baseHourRate: undefined || "0",
            actions: (undefined || []).map((inner) =>
                repairEstimateTemplateActionJSON(inner)
            ),
            scopesOfWork: (undefined || []).map((inner) => inner || null),
            contractNotes: (undefined || []).map((inner) => inner || null),
            contingencyItems: (undefined || []).map((inner) => inner || null),
        };
    }
}

export function EstimateTemplateToJSON(
    value: EstimateTemplate
): EstimateTemplateJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        markup: value.markup.toString(),
        materialsMarkup:
            value.materialsMarkup !== null
                ? value.materialsMarkup.toString()
                : null,
        kind: value.kind,
        baseHourRate: value.baseHourRate.toString(),
        actions: value.actions.map((inner) =>
            EstimateTemplateActionToJSON(inner)
        ),
        scopesOfWork: value.scopesOfWork.map((inner) => inner),
        contractNotes: value.contractNotes.map((inner) => inner),
        contingencyItems: value.contingencyItems.map((inner) => inner),
    };
}

export const ESTIMATE_TEMPLATE_META: RecordMeta<
    EstimateTemplate,
    EstimateTemplateJSON,
    EstimateTemplateBrokenJSON
> & { name: "EstimateTemplate" } = {
    name: "EstimateTemplate",
    type: "record",
    repair: repairEstimateTemplateJSON,
    toJSON: EstimateTemplateToJSON,
    fromJSON: JSONToEstimateTemplate,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        markup: { type: "percentage" },
        materialsMarkup: { type: "percentage?" },
        kind: {
            type: "enum",
            values: ["", "full", "time-and-materials"],
        },
        baseHourRate: { type: "money" },
        actions: { type: "array", items: ESTIMATE_TEMPLATE_ACTION_META },
        scopesOfWork: {
            type: "array",
            items: { type: "uuid", linkTo: "ScopeOfWork" },
        },
        contractNotes: {
            type: "array",
            items: { type: "uuid", linkTo: "ContractNote" },
        },
        contingencyItems: {
            type: "array",
            items: { type: "uuid", linkTo: "EstimateContingencyItemType" },
        },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
