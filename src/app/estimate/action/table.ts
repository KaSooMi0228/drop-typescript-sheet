import Decimal from "decimal.js";
import { findIndex } from "lodash";
import { Money, Percentage, Quantity } from "../../../clay/common";
import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { genUUID, UUID } from "../../../clay/uuid";
import { resolveRoom, Room } from "../side/room";
import { Side } from "../side/table";
import { Estimate, EstimateCommon } from "../table";
import {
    ApplicationType,
    ApplicationTypeOption,
    ItemType,
    UnitType,
} from "../types/table";

//!Data
export type CalculatorRow = {
    width: Quantity;
    height: Quantity;
    note: string;
};

//!Data
export type SealantCalculatorRow = {
    multiply: Quantity;
    width: Quantity;
    length: Quantity;
    depth: Quantity;
    inefficiency: Percentage;
    note: string;
};

//!Data
export type SideAction = {
    hours: Quantity | null;
    materials: Quantity | null;
    calculatorUnits: CalculatorRow[];
    sealantCalculatorUnits: SealantCalculatorRow[];
    overrideCopyUnits: boolean;
};

//!Data
export type EstimateAction = {
    id: UUID;
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
    applicationType: Link<ApplicationType>;
    application: Link<ApplicationTypeOption>;

    hourRate: Money | null;
    materialsRate: Money;
    hourRatio: Quantity;
    materialsRatio: Quantity;
    unitIncrement: Quantity;

    customUnitRate: Money | null;
    finishSchedule: string;
    rateName: string;
    unitType: Link<UnitType>;
    copyUnitsFromAction: Link<EstimateAction>;

    markup: Percentage | null;
};

export function isRoomCalculator(action: EstimateAction) {
    return (
        action.calculator !== "Square" &&
        action.calculator !== "Linear" &&
        action.calculator !== "Sealant"
    );
}

export type ResolvedEstimateAction = {
    hourRate: Money;
    unitRate: Money;
    rateWithMarkup: Money;
    markups: {
        hours: Percentage;
        materials: Percentage;
    };
};

export type ResolvedAction = {
    hours: Quantity;
    materials: Quantity;
    units: Quantity;
    hoursCost: Money;
    materialsCost: Money;
    hoursPrice: Money;
    materialsPrice: Money;
    mode: "hours-materials" | "calculator";
} & ResolvedEstimateAction;

function resolveRoomCalculator(
    calculator: "Walls" | "Ceiling" | "Baseboard" | "Crown" | "Chair Rail",
    room: Room
): Decimal {
    const resolvedRoom = resolveRoom(room);
    switch (calculator) {
        case "Walls":
            return resolvedRoom.walls;
        case "Ceiling":
            return resolvedRoom.ceiling;
        case "Baseboard":
            return resolvedRoom.baseboard;
        case "Crown":
            return resolvedRoom.crown;
        case "Chair Rail":
            return resolvedRoom.chairRail;
    }
}

export function resolveEstimateAction(
    estimateAction: EstimateAction,
    estimate: Estimate,
    contingency: boolean
): ResolvedEstimateAction {
    const hourRate =
        estimateAction.hourRate === null
            ? estimate.baseHourRate
            : estimateAction.hourRate;

    const unitRate =
        estimateAction.customUnitRate === null
            ? estimateAction.hourRatio
                  .times(hourRate)
                  .plus(
                      estimateAction.materialsRatio.times(
                          estimateAction.materialsRate
                      )
                  )
                  .dividedBy(estimateAction.unitIncrement)
            : estimateAction.customUnitRate;

    const markups = resolveMarkups(
        estimate.common,
        contingency,
        estimateAction.markup
    );

    const ratePerPoint = unitRate.dividedBy(
        estimateAction.hourRatio.plus(estimateAction.materialsRatio)
    );
    const rateWithMarkup = contingency
        ? unitRate.times(markups.materials.plus(1))
        : ratePerPoint
              .times(estimateAction.hourRatio)
              .times(markups.hours.plus(1))
              .plus(
                  ratePerPoint
                      .times(estimateAction.materialsRatio)
                      .times(markups.materials.plus(1))
              );

    return { hourRate, unitRate, markups, rateWithMarkup };
}

export function extraUnitsAllowed(estimateAction: EstimateAction) {
    return (
        estimateAction.calculator === "Square" ||
        estimateAction.calculator === "Linear"
    );
}

export function resolveUnits(
    estimate: Estimate,
    estimateAction: EstimateAction,
    sideAction: SideAction,
    side: Side
): Decimal {
    const baseUnits = resolveCalculatorUnits(
        estimateAction,
        sideAction,
        side.room
    );
    if (estimateAction.copyUnitsFromAction && !sideAction.overrideCopyUnits) {
        const sourceActionIndex = findIndex(
            estimate.actions,
            (action) => action.id.uuid === estimateAction.copyUnitsFromAction
        );
        if (
            sourceActionIndex !== -1 &&
            !estimate.actions[sourceActionIndex].copyUnitsFromAction
        ) {
            return resolveUnits(
                estimate,
                estimate.actions[sourceActionIndex],
                side.actions[sourceActionIndex],
                side
            ).plus(estimateAction ? baseUnits : new Decimal(0));
        } else {
            return baseUnits;
        }
    } else {
        return baseUnits;
    }
}

export function computeSealantRow(row: SealantCalculatorRow): Quantity {
    return row.width
        .dividedBy(12)
        .times(row.depth.dividedBy(12))
        .times(row.length)
        .times(new Decimal(48))
        .times(row.multiply)
        .times(row.inefficiency.plus(1))
        .toDecimalPlaces(1);
}

export function resolveCalculatorUnits(
    estimateAction: EstimateAction,
    side: SideAction,
    room: Room
) {
    switch (estimateAction.calculator) {
        case "":
            return new Decimal(0);
        case "Square":
            return side.calculatorUnits.reduce(
                (previous, item) =>
                    previous.plus(item.width.times(item.height)),
                new Decimal("0")
            );
        case "Linear":
            return side.calculatorUnits.reduce(
                (previous, item) => previous.plus(item.width),
                new Decimal("0")
            );
        case "Sealant":
            return side.sealantCalculatorUnits.reduce(
                (previous, item) => previous.plus(computeSealantRow(item)),
                new Decimal("0")
            );
        default:
            return resolveRoomCalculator(estimateAction.calculator, room);
    }
}

function safeDivide(numerator: Decimal, denominator: Decimal) {
    if (numerator.isZero()) {
        return numerator;
    } else {
        return numerator.dividedBy(denominator);
    }
}

function resolveActionBase(
    estimateAction: EstimateAction,
    sideAction: SideAction,
    side: Side,
    estimate: Estimate,
    contingency: boolean
) {
    const resolvedEstimateAction = resolveEstimateAction(
        estimateAction,
        estimate,
        contingency
    );

    if (sideAction.hours !== null || sideAction.materials !== null) {
        const hours = sideAction.hours || new Decimal("0");
        const materials = sideAction.materials || new Decimal("0");
        return {
            hours,
            materials,
            units: new Decimal("0"),
            hoursCost: hours.times(resolvedEstimateAction.hourRate),
            materialsCost: (sideAction.materials || new Decimal("0")).times(
                estimateAction.materialsRate
            ),
            mode: "hours-materials" as const,
            ...resolvedEstimateAction,
        };
    } else {
        const units = resolveUnits(estimate, estimateAction, sideAction, side);

        const cost = units.times(resolvedEstimateAction.unitRate);

        const hoursPerCost = resolvedEstimateAction.hourRate.times(
            estimateAction.hourRatio
        );
        const materialsPerCost = estimateAction.materialsRate.times(
            estimateAction.materialsRatio
        );

        const costPerPoint = cost.dividedBy(
            hoursPerCost.plus(materialsPerCost)
        );

        const hoursCost = costPerPoint.times(hoursPerCost);
        const materialsCost = costPerPoint.times(materialsPerCost);

        return {
            hoursCost,
            materialsCost,
            hours: safeDivide(
                hoursCost,
                resolvedEstimateAction.hourRate
            ).toNearest("0.1"),
            materials: safeDivide(
                materialsCost,
                estimateAction.materialsRate
            ).toNearest("0.1"),
            cost,
            units,
            mode: "calculator" as const,
            ...resolvedEstimateAction,
        };
    }
}

function computeExclusive(x: Decimal, y: Decimal): Decimal {
    return x.plus(y).plus(x.times(y));
}

export function resolveMarkups(
    estimate: EstimateCommon,
    contingency: boolean,
    markup: Percentage | null
): {
    hours: Percentage;
    materials: Percentage;
} {
    if (contingency) {
        if (markup) {
            return {
                hours: markup,
                materials: markup,
            };
        } else {
            const inner = resolveMarkups(estimate, false, null);
            return {
                hours: inner.hours,
                materials: inner.hours,
            };
        }
    } else {
        if (estimate.markupExclusive) {
            return {
                hours: computeExclusive(
                    estimate.markup,
                    estimate.additionalMarkup
                ),
                materials: computeExclusive(
                    estimate.materialsMarkup === null
                        ? estimate.markup
                        : estimate.materialsMarkup,
                    estimate.additionalMaterialsMarkup === null
                        ? estimate.additionalMarkup
                        : estimate.additionalMaterialsMarkup
                ),
            };
        } else {
            return {
                hours: estimate.markup.plus(estimate.additionalMarkup),
                materials: (estimate.materialsMarkup === null
                    ? estimate.markup
                    : estimate.materialsMarkup
                ).plus(
                    estimate.additionalMaterialsMarkup === null
                        ? estimate.additionalMarkup
                        : estimate.additionalMaterialsMarkup
                ),
            };
        }
    }
}

export function resolveAction(
    estimateAction: EstimateAction,
    sideAction: SideAction,
    side: Side,
    estimate: Estimate,
    contingency: boolean
): ResolvedAction {
    const base = resolveActionBase(
        estimateAction,
        sideAction,
        side,
        estimate,
        contingency
    );
    const markups = base.markups;
    return {
        ...base,
        hoursPrice: base.hoursCost
            .times(markups.hours.plus(1))
            .toDecimalPlaces(2),
        materialsPrice: base.materialsCost
            .times(markups.materials.plus(1))
            .toDecimalPlaces(2),
    };
}

export function resolveSideAction(
    estimateAction: EstimateAction,
    sideAction: SideAction,
    side: Side,
    estimate: Estimate,
    contingency: boolean
): ResolvedAction {
    const base = resolveAction(
        estimateAction,
        sideAction,
        side,
        estimate,
        contingency
    );
    return {
        hours: base.hours.times(side.multiply),
        materials: base.materials.times(side.multiply),
        units: base.units.times(side.multiply),
        hoursCost: base.hoursCost.times(side.multiply),
        hourRate: base.hourRate,
        unitRate: base.unitRate,
        materialsCost: base.materialsCost.times(side.multiply),
        hoursPrice: base.hoursPrice.times(side.multiply),
        materialsPrice: base.materialsPrice.times(side.multiply),
        mode: base.mode,
        markups: base.markups,
        rateWithMarkup: base.rateWithMarkup,
    };
}

// BEGIN MAGIC -- DO NOT EDIT
export type CalculatorRowJSON = {
    width: string;
    height: string;
    note: string;
};

export function JSONToCalculatorRow(json: CalculatorRowJSON): CalculatorRow {
    return {
        width: new Decimal(json.width),
        height: new Decimal(json.height),
        note: json.note,
    };
}
export type CalculatorRowBrokenJSON = {
    width?: string;
    height?: string;
    note?: string;
};

export function newCalculatorRow(): CalculatorRow {
    return JSONToCalculatorRow(repairCalculatorRowJSON(undefined));
}
export function repairCalculatorRowJSON(
    json: CalculatorRowBrokenJSON | undefined
): CalculatorRowJSON {
    if (json) {
        return {
            width: json.width || "0",
            height: json.height || "0",
            note: json.note || "",
        };
    } else {
        return {
            width: undefined || "0",
            height: undefined || "0",
            note: undefined || "",
        };
    }
}

export function CalculatorRowToJSON(value: CalculatorRow): CalculatorRowJSON {
    return {
        width: value.width.toString(),
        height: value.height.toString(),
        note: value.note,
    };
}

export const CALCULATOR_ROW_META: RecordMeta<
    CalculatorRow,
    CalculatorRowJSON,
    CalculatorRowBrokenJSON
> & { name: "CalculatorRow" } = {
    name: "CalculatorRow",
    type: "record",
    repair: repairCalculatorRowJSON,
    toJSON: CalculatorRowToJSON,
    fromJSON: JSONToCalculatorRow,
    fields: {
        width: { type: "quantity" },
        height: { type: "quantity" },
        note: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type SealantCalculatorRowJSON = {
    multiply: string;
    width: string;
    length: string;
    depth: string;
    inefficiency: string;
    note: string;
};

export function JSONToSealantCalculatorRow(
    json: SealantCalculatorRowJSON
): SealantCalculatorRow {
    return {
        multiply: new Decimal(json.multiply),
        width: new Decimal(json.width),
        length: new Decimal(json.length),
        depth: new Decimal(json.depth),
        inefficiency: new Decimal(json.inefficiency),
        note: json.note,
    };
}
export type SealantCalculatorRowBrokenJSON = {
    multiply?: string;
    width?: string;
    length?: string;
    depth?: string;
    inefficiency?: string;
    note?: string;
};

export function newSealantCalculatorRow(): SealantCalculatorRow {
    return JSONToSealantCalculatorRow(
        repairSealantCalculatorRowJSON(undefined)
    );
}
export function repairSealantCalculatorRowJSON(
    json: SealantCalculatorRowBrokenJSON | undefined
): SealantCalculatorRowJSON {
    if (json) {
        return {
            multiply: json.multiply || "0",
            width: json.width || "0",
            length: json.length || "0",
            depth: json.depth || "0",
            inefficiency: json.inefficiency || "0",
            note: json.note || "",
        };
    } else {
        return {
            multiply: undefined || "0",
            width: undefined || "0",
            length: undefined || "0",
            depth: undefined || "0",
            inefficiency: undefined || "0",
            note: undefined || "",
        };
    }
}

export function SealantCalculatorRowToJSON(
    value: SealantCalculatorRow
): SealantCalculatorRowJSON {
    return {
        multiply: value.multiply.toString(),
        width: value.width.toString(),
        length: value.length.toString(),
        depth: value.depth.toString(),
        inefficiency: value.inefficiency.toString(),
        note: value.note,
    };
}

export const SEALANT_CALCULATOR_ROW_META: RecordMeta<
    SealantCalculatorRow,
    SealantCalculatorRowJSON,
    SealantCalculatorRowBrokenJSON
> & { name: "SealantCalculatorRow" } = {
    name: "SealantCalculatorRow",
    type: "record",
    repair: repairSealantCalculatorRowJSON,
    toJSON: SealantCalculatorRowToJSON,
    fromJSON: JSONToSealantCalculatorRow,
    fields: {
        multiply: { type: "quantity" },
        width: { type: "quantity" },
        length: { type: "quantity" },
        depth: { type: "quantity" },
        inefficiency: { type: "percentage" },
        note: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type SideActionJSON = {
    hours: string | null;
    materials: string | null;
    calculatorUnits: CalculatorRowJSON[];
    sealantCalculatorUnits: SealantCalculatorRowJSON[];
    overrideCopyUnits: boolean;
};

export function JSONToSideAction(json: SideActionJSON): SideAction {
    return {
        hours: json.hours !== null ? new Decimal(json.hours) : null,
        materials: json.materials !== null ? new Decimal(json.materials) : null,
        calculatorUnits: json.calculatorUnits.map((inner) =>
            JSONToCalculatorRow(inner)
        ),
        sealantCalculatorUnits: json.sealantCalculatorUnits.map((inner) =>
            JSONToSealantCalculatorRow(inner)
        ),
        overrideCopyUnits: json.overrideCopyUnits,
    };
}
export type SideActionBrokenJSON = {
    hours?: string | null;
    materials?: string | null;
    calculatorUnits?: CalculatorRowJSON[];
    sealantCalculatorUnits?: SealantCalculatorRowJSON[];
    overrideCopyUnits?: boolean;
};

export function newSideAction(): SideAction {
    return JSONToSideAction(repairSideActionJSON(undefined));
}
export function repairSideActionJSON(
    json: SideActionBrokenJSON | undefined
): SideActionJSON {
    if (json) {
        return {
            hours: json.hours || null,
            materials: json.materials || null,
            calculatorUnits: (json.calculatorUnits || []).map((inner) =>
                repairCalculatorRowJSON(inner)
            ),
            sealantCalculatorUnits: (json.sealantCalculatorUnits || []).map(
                (inner) => repairSealantCalculatorRowJSON(inner)
            ),
            overrideCopyUnits: json.overrideCopyUnits || false,
        };
    } else {
        return {
            hours: undefined || null,
            materials: undefined || null,
            calculatorUnits: (undefined || []).map((inner) =>
                repairCalculatorRowJSON(inner)
            ),
            sealantCalculatorUnits: (undefined || []).map((inner) =>
                repairSealantCalculatorRowJSON(inner)
            ),
            overrideCopyUnits: undefined || false,
        };
    }
}

export function SideActionToJSON(value: SideAction): SideActionJSON {
    return {
        hours: value.hours !== null ? value.hours.toString() : null,
        materials: value.materials !== null ? value.materials.toString() : null,
        calculatorUnits: value.calculatorUnits.map((inner) =>
            CalculatorRowToJSON(inner)
        ),
        sealantCalculatorUnits: value.sealantCalculatorUnits.map((inner) =>
            SealantCalculatorRowToJSON(inner)
        ),
        overrideCopyUnits: value.overrideCopyUnits,
    };
}

export const SIDE_ACTION_META: RecordMeta<
    SideAction,
    SideActionJSON,
    SideActionBrokenJSON
> & { name: "SideAction" } = {
    name: "SideAction",
    type: "record",
    repair: repairSideActionJSON,
    toJSON: SideActionToJSON,
    fromJSON: JSONToSideAction,
    fields: {
        hours: { type: "quantity?" },
        materials: { type: "quantity?" },
        calculatorUnits: { type: "array", items: CALCULATOR_ROW_META },
        sealantCalculatorUnits: {
            type: "array",
            items: SEALANT_CALCULATOR_ROW_META,
        },
        overrideCopyUnits: { type: "boolean" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type EstimateActionJSON = {
    id: string;
    name: string;
    itemType: string | null;
    calculator: string;
    applicationType: string | null;
    application: string | null;
    hourRate: string | null;
    materialsRate: string;
    hourRatio: string;
    materialsRatio: string;
    unitIncrement: string;
    customUnitRate: string | null;
    finishSchedule: string;
    rateName: string;
    unitType: string | null;
    copyUnitsFromAction: string | null;
    markup: string | null;
};

export function JSONToEstimateAction(json: EstimateActionJSON): EstimateAction {
    return {
        id: { uuid: json.id },
        name: json.name,
        itemType: json.itemType,
        calculator: json.calculator as any,
        applicationType: json.applicationType,
        application: json.application,
        hourRate: json.hourRate !== null ? new Decimal(json.hourRate) : null,
        materialsRate: new Decimal(json.materialsRate),
        hourRatio: new Decimal(json.hourRatio),
        materialsRatio: new Decimal(json.materialsRatio),
        unitIncrement: new Decimal(json.unitIncrement),
        customUnitRate:
            json.customUnitRate !== null
                ? new Decimal(json.customUnitRate)
                : null,
        finishSchedule: json.finishSchedule,
        rateName: json.rateName,
        unitType: json.unitType,
        copyUnitsFromAction: json.copyUnitsFromAction,
        markup: json.markup !== null ? new Decimal(json.markup) : null,
    };
}
export type EstimateActionBrokenJSON = {
    id?: string;
    name?: string;
    itemType?: string | null;
    calculator?: string;
    applicationType?: string | null;
    application?: string | null;
    hourRate?: string | null;
    materialsRate?: string;
    hourRatio?: string;
    materialsRatio?: string;
    unitIncrement?: string;
    customUnitRate?: string | null;
    finishSchedule?: string;
    rateName?: string;
    unitType?: string | null;
    copyUnitsFromAction?: string | null;
    markup?: string | null;
};

export function newEstimateAction(): EstimateAction {
    return JSONToEstimateAction(repairEstimateActionJSON(undefined));
}
export function repairEstimateActionJSON(
    json: EstimateActionBrokenJSON | undefined
): EstimateActionJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            itemType: json.itemType || null,
            calculator: json.calculator || "",
            applicationType: json.applicationType || null,
            application: json.application || null,
            hourRate: json.hourRate || null,
            materialsRate: json.materialsRate || "0",
            hourRatio: json.hourRatio || "0",
            materialsRatio: json.materialsRatio || "0",
            unitIncrement: json.unitIncrement || "0",
            customUnitRate: json.customUnitRate || null,
            finishSchedule: json.finishSchedule || "",
            rateName: json.rateName || "",
            unitType: json.unitType || null,
            copyUnitsFromAction: json.copyUnitsFromAction || null,
            markup: json.markup || null,
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            itemType: undefined || null,
            calculator: undefined || "",
            applicationType: undefined || null,
            application: undefined || null,
            hourRate: undefined || null,
            materialsRate: undefined || "0",
            hourRatio: undefined || "0",
            materialsRatio: undefined || "0",
            unitIncrement: undefined || "0",
            customUnitRate: undefined || null,
            finishSchedule: undefined || "",
            rateName: undefined || "",
            unitType: undefined || null,
            copyUnitsFromAction: undefined || null,
            markup: undefined || null,
        };
    }
}

export function EstimateActionToJSON(
    value: EstimateAction
): EstimateActionJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        itemType: value.itemType,
        calculator: value.calculator,
        applicationType: value.applicationType,
        application: value.application,
        hourRate: value.hourRate !== null ? value.hourRate.toString() : null,
        materialsRate: value.materialsRate.toString(),
        hourRatio: value.hourRatio.toString(),
        materialsRatio: value.materialsRatio.toString(),
        unitIncrement: value.unitIncrement.toString(),
        customUnitRate:
            value.customUnitRate !== null
                ? value.customUnitRate.toString()
                : null,
        finishSchedule: value.finishSchedule,
        rateName: value.rateName,
        unitType: value.unitType,
        copyUnitsFromAction: value.copyUnitsFromAction,
        markup: value.markup !== null ? value.markup.toString() : null,
    };
}

export const ESTIMATE_ACTION_META: RecordMeta<
    EstimateAction,
    EstimateActionJSON,
    EstimateActionBrokenJSON
> & { name: "EstimateAction" } = {
    name: "EstimateAction",
    type: "record",
    repair: repairEstimateActionJSON,
    toJSON: EstimateActionToJSON,
    fromJSON: JSONToEstimateAction,
    fields: {
        id: { type: "uuid" },
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
        applicationType: { type: "uuid", linkTo: "ApplicationType" },
        application: { type: "uuid", linkTo: "ApplicationTypeOption" },
        hourRate: { type: "money?" },
        materialsRate: { type: "money" },
        hourRatio: { type: "quantity" },
        materialsRatio: { type: "quantity" },
        unitIncrement: { type: "quantity" },
        customUnitRate: { type: "money?" },
        finishSchedule: { type: "string" },
        rateName: { type: "string" },
        unitType: { type: "uuid", linkTo: "UnitType" },
        copyUnitsFromAction: { type: "uuid", linkTo: "EstimateAction" },
        markup: { type: "percentage?" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
