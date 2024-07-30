import { format as formatDate } from "date-fns";
import Decimal from "decimal.js";
import { Dictionary } from "../../clay/common";
import { Link } from "../../clay/link";
import { sumMap } from "../../clay/queryFuncs";
import { QuickCacheApi } from "../../clay/quick-cache";
import { uuid5 } from "../../clay/uuid";
import {
    resolveAction,
    resolveEstimateAction,
    resolveSideAction,
} from "../estimate/action/table";
import {
    contingencySide,
    EstimateCommon,
    ESTIMATE_META,
} from "../estimate/table";
import {
    calcTimeAndMaterialsEstimateLineTotalCost,
    TIME_AND_MATERIALS_ESTIMATE_META,
    TIME_AND_MATERIALS_ESTIMATE_PRODUCT_META,
} from "../estimate/time-and-materials/table";
import { ITEM_TYPE_META } from "../estimate/types/table";
import {
    SourceArea,
    SourceAreaAction,
    SourceAreaAllowance,
    SourceAreaContingency,
} from "./source-area";
import { Quotation, QuotationOption, schedulePortion } from "./table";
import * as React from "react";

export function resolveAreasReady(
    quotation: Quotation,
    cache: QuickCacheApi
): boolean {
    for (const estimateId of quotation.estimates) {
        const fullEstimate = cache.get(ESTIMATE_META, estimateId);
        const tmEstimate = cache.get(
            TIME_AND_MATERIALS_ESTIMATE_META,
            estimateId
        );

        if (!fullEstimate && !tmEstimate) {
            return false;
        }
    }
    return true;
}

function estimateName(estimate: { common: EstimateCommon }): string {
    return `${estimate.common.name} ${
        estimate.common.creationDate &&
        formatDate(estimate.common.creationDate, "Y-M-d p")
    }`;
}

let lastResolveAreas: [Quotation, QuickCacheApi, SourceArea[]] = [
    null,
    null,
    null,
] as any;

export function resolveAreas(quotation: Quotation, cache: QuickCacheApi) {
    const [lastQuotation, lastCache, lastSourceAreas] = lastResolveAreas;

    if (lastQuotation === quotation && cache === lastCache) {
        return lastSourceAreas;
    } else {
        const sourceAreas = resolveAreasImpl(quotation, cache);
        lastResolveAreas = [lastQuotation, lastCache, sourceAreas];
        return sourceAreas;
    }
}

export function resolveAreasImpl(
    quotation: Quotation,
    cache: QuickCacheApi
): SourceArea[] {
    const areas: SourceArea[] = [];
    for (const estimateId of quotation.estimates) {
        const fullEstimate = cache.get(ESTIMATE_META, estimateId);
        const tmEstimate = cache.get(
            TIME_AND_MATERIALS_ESTIMATE_META,
            estimateId
        );
        if (fullEstimate) {
            for (const area of fullEstimate.areas) {
                areas.push({
                    id: area.id,
                    name: estimateName(fullEstimate) + " - " + area.name,
                    allowances: fullEstimate.allowances
                        .filter(
                            (allowance) =>
                                allowance.areas.length === 0 ||
                                allowance.areas.indexOf(area.id.uuid) !== -1
                        )
                        .map((allowance) => ({
                            id: allowance.id,
                            name: allowance.name,
                            cost: allowance.cost,
                            global: allowance.areas.length === 0,
                            price: allowance.cost
                                .times(new Decimal(1).plus(allowance.markup))
                                .times(
                                    new Decimal(1).plus(
                                        fullEstimate.common
                                            .additionalAllowancesMarkup ??
                                            fullEstimate.common.additionalMarkup
                                    )
                                )
                                .toDecimalPlaces(2),
                        })),
                    actions: fullEstimate.actions.map((action, index) => {
                        const resolvedEstimateAction = resolveEstimateAction(
                            action,
                            fullEstimate,
                            false
                        );
                        const resolvedActions = area.sides
                            .filter((side) => side.actions[index])
                            .map((side) =>
                                resolveSideAction(
                                    action,
                                    side.actions[index],
                                    side,
                                    fullEstimate,
                                    false
                                )
                            );
                        return {
                            id: action.id,
                            itemType: action.itemType,
                            name: action.name,
                            finishSchedule: action.finishSchedule,
                            application: action.application,
                            applicationType: action.applicationType,
                            hours: resolvedActions.reduce(
                                (x, y) => x.plus(y.hours),
                                new Decimal(0)
                            ),
                            hourRate: resolvedEstimateAction.hourRate,
                            materials: resolvedActions.reduce(
                                (x, y) => x.plus(y.materials),
                                new Decimal(0)
                            ),
                            materialsRate: action.materialsRate,
                            cost: resolvedActions
                                .map((action) =>
                                    action.hoursCost.plus(action.materialsCost)
                                )
                                .reduce((x, y) => x.plus(y), new Decimal(0)),
                            price: resolvedActions
                                .map((action) =>
                                    action.hoursPrice.plus(
                                        action.materialsPrice
                                    )
                                )
                                .reduce((x, y) => x.plus(y), new Decimal(0)),
                        };
                    }),
                    contingencies: [
                        ...fullEstimate.contingencyItems
                            .filter(
                                (contingency) =>
                                    contingency.areas.length === 0 ||
                                    contingency.areas.indexOf(area.id.uuid) !==
                                        -1
                            )
                            .map((contingencyItem) => ({
                                id: contingencyItem.id,
                                description: contingencyItem.name,
                                quantity: contingencyItem.quantity,
                                type: contingencyItem.type,
                                costRate: contingencyItem.rate,
                                priceRate: contingencyItem.rate
                                    .times(
                                        new Decimal(1).plus(
                                            contingencyItem.markup
                                        )
                                    )
                                    .toDecimalPlaces(2),
                                finishSchedule: contingencyItem.finishSchedule,
                                materials: new Decimal(0),
                                hours: new Decimal(0),
                            })),
                        ...fullEstimate.contingencyItemsV2
                            .filter(
                                (contingency) =>
                                    contingency.areas.length === 0 ||
                                    contingency.areas.indexOf(area.id.uuid) !==
                                        -1
                            )
                            .map((contingencyItem) => {
                                const resolved = resolveAction(
                                    contingencyItem.estimate,
                                    contingencyItem.side,
                                    contingencySide(fullEstimate),
                                    fullEstimate,
                                    true
                                );

                                return {
                                    id: contingencyItem.estimate.id,
                                    description: contingencyItem.estimate.name,
                                    quantity: resolved.units,
                                    type: contingencyItem.estimate.unitType,
                                    materials: resolved.materials,
                                    hours: resolved.hours,
                                    costRate: resolved.unitRate,
                                    priceRate: resolved.rateWithMarkup,
                                    finishSchedule:
                                        contingencyItem.estimate.finishSchedule,
                                };
                            }),
                    ],
                });
            }
        }
        if (tmEstimate) {
            areas.push({
                id: tmEstimate.id,
                name: estimateName(tmEstimate),
                actions: tmEstimate.lines.map((line) => ({
                    id: { uuid: line.product! },
                    itemType: null,
                    application: null,
                    applicationType: null,
                    finishSchedule: "",
                    name:
                        cache.get(
                            TIME_AND_MATERIALS_ESTIMATE_PRODUCT_META,
                            line.product
                        )?.name || "",
                    hours: new Decimal(0),
                    hourRate: new Decimal(0),
                    materials: line.quantity,
                    materialsRate: line.cost,
                    cost: calcTimeAndMaterialsEstimateLineTotalCost(line),
                    price: calcTimeAndMaterialsEstimateLineTotalCost(
                        line
                    ).times(
                        new Decimal(1)
                            .plus(tmEstimate.common.markup)
                            .plus(tmEstimate.common.additionalMarkup)
                    ),
                })),
                allowances: tmEstimate.extras.map((extra) => ({
                    id: { uuid: uuid5(extra.description) },
                    name: extra.description,
                    cost: extra.amount,
                    global: false,
                    price: extra.amount
                        .times(
                            new Decimal(1)
                                .plus(tmEstimate.common.markup)
                                .plus(tmEstimate.common.additionalMarkup)
                        )
                        .toDecimalPlaces(2),
                })),
                contingencies: [],
            });
        }
    }

    return areas;
}

export function resolveActions(
    includeAreas: Link<SourceArea>[],
    areas: SourceArea[]
) {
    const actions: SourceAreaAction[] = [];
    const indexForAction: Dictionary<number> = {};
    for (const area of areas) {
        if (includeAreas.indexOf(area.id.uuid) != -1) {
            for (const action of area.actions) {
                const index = indexForAction[action.id.uuid];
                if (index == undefined) {
                    indexForAction[action.id.uuid] = actions.length;
                    actions.push(action);
                } else {
                    actions[index] = {
                        ...actions[index],
                        hours: actions[index].hours.plus(action.hours),
                        materials: actions[index].materials.plus(
                            action.materials
                        ),
                        cost: actions[index].cost.plus(action.cost),
                        price: actions[index].price.plus(action.price),
                    };
                }
            }
        }
    }
    return actions;
}

export function resolveAllowances(
    includeAreas: Link<SourceArea>[],
    areas: SourceArea[]
) {
    const allowances: SourceAreaAllowance[] = [];
    const indexForAllowance: Dictionary<number> = {};
    for (const area of areas) {
        if (includeAreas.indexOf(area.id.uuid) != -1) {
            for (const allowance of area.allowances) {
                const index = indexForAllowance[allowance.id.uuid];
                if (index == undefined) {
                    indexForAllowance[allowance.id.uuid] = allowances.length;
                    allowances.push(allowance);
                } else if (!allowance.global) {
                    allowances[index] = {
                        ...allowances[index],
                        cost: allowances[index].cost.plus(allowance.cost),
                        price: allowances[index].price.plus(allowance.price),
                    };
                }
            }
        }
    }
    return allowances;
}

export function resolveContingencies(
    includeAreas: Link<SourceArea>[],
    areas: SourceArea[]
) {
    const contingencies: SourceAreaContingency[] = [];
    const indexForContingency: Dictionary<number> = {};
    for (const area of areas) {
        if (includeAreas.indexOf(area.id.uuid) != -1) {
            for (const contingency of area.contingencies) {
                const index = indexForContingency[contingency.id.uuid];
                if (index == undefined) {
                    indexForContingency[contingency.id.uuid] = index;
                    contingencies.push(contingency);
                }
            }
        }
    }
    return contingencies;
}

export function resolveCurrentOption(
    cache: QuickCacheApi,
    quotation: Quotation,
    option: QuotationOption
) {
    if (quotation.date === null) {
        return resolveOption(cache, quotation, option);
    } else {
        return {
            ...option.details,
            defaultHiddenActions: new Set([]),
            activeActions: option.details.actions,
        };
    }
}

export function resolveOption(
    cache: QuickCacheApi,
    quotation: Quotation,
    option: QuotationOption
) {
    const areas = resolveAreas(quotation, cache);
    const actions = resolveActions(option.areas, areas);
    const activeActions = actions.filter(
        (action) => option.actions.indexOf(action.id.uuid) !== -1
    );
    const shownActions = activeActions.filter(
        (action) =>
            option.hiddenActions.indexOf(action.id.uuid) == -1 &&
            action.finishSchedule !== ""
    );
    const finishSchedule = shownActions.map((action) => ({
        name: action.name,
        finishSchedule: action.finishSchedule,
        application: action.application,
        applicationType: action.applicationType,
    }));

    const contingencies = resolveContingencies(option.areas, areas);
    const activeContingencies = contingencies.filter(
        (contingency) =>
            option.contingencies.indexOf(contingency.id.uuid) !== -1
    );
    const contingencyPriceTotal = sumMap(activeContingencies, (contingency) =>
        contingency.quantity.times(contingency.priceRate)
    );

    const allowances = resolveAllowances(option.areas, areas);
    const activeAllowances = allowances.filter(
        (allowance) => option.allowances.indexOf(allowance.id.uuid) !== -1
    );

    const allowancePriceTotal = activeAllowances.reduce(
        (total, action) => total.plus(action.price),
        new Decimal(0)
    );
    const actionPriceTotal = activeActions.reduce(
        (total, action) => total.plus(action.price),
        new Decimal(0)
    );

    const defaultHiddenActions = new Set<string>();
    for (const action of actions) {
        if (action.itemType) {
            const itemType = cache.get(ITEM_TYPE_META, action.itemType);
            if (itemType?.defaultHidden) {
                defaultHiddenActions.add(action.id.uuid);
            }
        }
    }

    const schedules = option.schedules.map((schedule) => ({
        name: schedule.name,
        total: activeAllowances
            .reduce(
                (total, action) =>
                    total.plus(
                        action.price.times(
                            schedulePortion(
                                schedule,
                                "allowances",
                                action.id.uuid
                            )
                        )
                    ),
                new Decimal(0)
            )
            .plus(
                activeActions.reduce(
                    (total, action) =>
                        total.plus(
                            action.price.times(
                                schedulePortion(
                                    schedule,
                                    "actions",
                                    action.id.uuid
                                )
                            )
                        ),
                    new Decimal(0)
                )
            )
            .plus(
                activeContingencies.reduce(
                    (total, contingency) =>
                        total.plus(
                            contingency.quantity
                                .times(contingency.priceRate)
                                .times(
                                    schedulePortion(
                                        schedule,
                                        "contingencies",
                                        contingency.id.uuid
                                    )
                                )
                        ),
                    new Decimal(0)
                )
            )
            .round(),
    }));

    const total =
        schedules.length === 0
            ? allowancePriceTotal
                  .plus(actionPriceTotal)
                  .plus(contingencyPriceTotal)
                  .plus(option.adjustment)
                  .round()
            : sumMap(schedules, (x) => x.total).round();

    return {
        areas,
        actions,
        activeActions,
        contingencies,
        activeContingencies,
        allowances,
        activeAllowances,
        allowancePriceTotal,
        actionPriceTotal,
        contingencyPriceTotal,
        total,
        defaultHiddenActions,
        finishSchedule,
        schedules,
    };
}

export type ResolvedOption = ReturnType<typeof resolveOption>;
