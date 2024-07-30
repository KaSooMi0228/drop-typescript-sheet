import React from "react";
import {
    fetchRecord,
    patchRecord,
    storeRecord,
    useRecordQuery,
} from "../../clay/api";
import { Link } from "../../clay/link";
import { useQuickRecord } from "../../clay/quick-cache";
import { FilterDetail } from "../../clay/server/api";
import { newUUID, UUID, uuid5 } from "../../clay/uuid";
import { Project, PROJECT_META } from "../project/table";
import { Estimate, EstimateCommon, ESTIMATE_META } from "./table";
import {
    TimeAndMaterialsEstimate,
    TIME_AND_MATERIALS_ESTIMATE_META,
} from "./time-and-materials/table";

export type EstimateHandle = {
    meta: typeof ESTIMATE_META | typeof TIME_AND_MATERIALS_ESTIMATE_META;
    id: Link<Estimate | TimeAndMaterialsEstimate>;
    common: EstimateCommon;
    estimate: any;
};

export function onEstimate<T>(
    x: EstimateHandle,
    callbacks: {
        std: (x: Estimate) => T;
        tm: (x: TimeAndMaterialsEstimate) => T;
    }
): T {
    switch (x.meta.name) {
        case "Estimate":
            return callbacks.std(x.estimate);
        case "TimeAndMaterialsEstimate":
            return callbacks.tm(x.estimate);
        default:
            throw new Error("Unreachable");
    }
}

function useProjectEstimatesForMeta(
    meta: typeof ESTIMATE_META | typeof TIME_AND_MATERIALS_ESTIMATE_META,
    filters: FilterDetail[] | null
): EstimateHandle[] {
    const records = useRecordQuery(
        meta as any,
        {
            filters: filters || [],
        },
        [filters],
        filters !== null
    );

    if (!records) {
        return [];
    }

    return (records as (Estimate | TimeAndMaterialsEstimate)[]).map(
        (estimate) => ({
            meta,
            id: estimate.id.uuid,
            common: estimate.common,
            estimate,
        })
    );
}

export function useProjectEstimates(project: Link<Project>) {
    const filters = React.useMemo(
        () => [
            {
                column: "common.project",
                filter: {
                    equal: project,
                },
            },
        ],
        [project]
    );

    return useEstimatesByFilter(filters);
}

export function useEstimatesByFilter(filter: FilterDetail[] | null) {
    const estimates = [
        ...useProjectEstimatesForMeta(ESTIMATE_META, filter),
        ...useProjectEstimatesForMeta(TIME_AND_MATERIALS_ESTIMATE_META, filter),
    ];

    estimates.sort((x, y) =>
        (x.common.creationDate || "") < (y.common.creationDate || "") ? -1 : 1
    );

    return estimates;
}

export async function fetchEstimate(
    id: Link<Estimate | TimeAndMaterialsEstimate>
) {
    const stdEstimate = fetchRecord(ESTIMATE_META, id!);
    const tmEstimate = fetchRecord(TIME_AND_MATERIALS_ESTIMATE_META, id!);

    const standardEstimate = await stdEstimate;
    const timeAndMaterialsEstimate = await tmEstimate;
    if (standardEstimate) {
        return {
            id,
            meta: ESTIMATE_META,
            common: standardEstimate.common,
            estimate: standardEstimate,
        };
    } else if (timeAndMaterialsEstimate) {
        return {
            id,
            meta: TIME_AND_MATERIALS_ESTIMATE_META,
            common: timeAndMaterialsEstimate.common,
            estimate: timeAndMaterialsEstimate,
        };
    } else {
        console.log("Gave up");
        return null;
    }
}

export function useEstimateHandle(
    id: Link<Estimate | TimeAndMaterialsEstimate>
): EstimateHandle | null | undefined {
    const standardEstimate = useQuickRecord(ESTIMATE_META, id);
    const timeAndMaterialsEstimate = useQuickRecord(
        TIME_AND_MATERIALS_ESTIMATE_META,
        id
    );

    if (standardEstimate) {
        return {
            id,
            meta: ESTIMATE_META,
            common: standardEstimate.common,
            estimate: standardEstimate,
        };
    }

    if (timeAndMaterialsEstimate) {
        return {
            id,
            meta: TIME_AND_MATERIALS_ESTIMATE_META,
            common: timeAndMaterialsEstimate.common,
            estimate: timeAndMaterialsEstimate,
        };
    }

    if (
        standardEstimate === undefined &&
        timeAndMaterialsEstimate === undefined
    ) {
        return undefined;
    } else {
        return null;
    }
}

function changeEstimateIds(newId: UUID, estimate: Estimate): Estimate {
    return {
        ...estimate,
        id: newId,
        areas: estimate.areas.map((area) => ({
            ...area,
            id: {
                uuid: uuid5(newId.uuid + area.id.uuid),
            },
        })),
        actions: estimate.actions.map((action) => ({
            ...action,
            id: {
                uuid: uuid5(newId.uuid + action.id.uuid),
            },
            copyUnitsFromAction:
                action.copyUnitsFromAction &&
                uuid5(newId.uuid + action.copyUnitsFromAction),
        })),
        allowances: estimate.allowances.map((allowance) => ({
            ...allowance,
            id: {
                uuid: uuid5(newId.uuid + allowance.id.uuid),
            },
            areas: allowance.areas.map((area) => uuid5(newId.uuid + area)),
        })),
        contingencyItems: estimate.contingencyItems.map((contingencyItem) => ({
            ...contingencyItem,
            id: {
                uuid: uuid5(newId.uuid + contingencyItem.id.uuid),
            },
            areas: contingencyItem.areas.map((area) =>
                uuid5(newId.uuid + area)
            ),
        })),
        contingencyItemsV2: estimate.contingencyItemsV2.map(
            (contingencyItem) => ({
                ...contingencyItem,
                estimate: {
                    ...contingencyItem.estimate,
                    uuid: uuid5(newId.uuid + contingencyItem.estimate.id.uuid),
                    copyUnitsFromAction:
                        contingencyItem.estimate.copyUnitsFromAction &&
                        uuid5(
                            newId.uuid +
                                contingencyItem.estimate.copyUnitsFromAction
                        ),
                },
            })
        ),
    };
}
export async function updateEstimateDate(project: Project) {
    if (project.estimateDate === null) {
        await patchRecord(PROJECT_META, "Estimates", project.id.uuid, {
            estimateDate: [null, new Date().toISOString()],
        });
    }
}
export async function duplicateEstimate(
    estimate: EstimateHandle,
    project: Project,
    interactive: boolean = true
) {
    const name = interactive
        ? prompt("Name for estimate?", estimate.common.name + " (duplicate)")
        : estimate.common.name;
    if (name || !interactive) {
        const newId = newUUID();
        const common = {
            ...estimate.common,
            change: project.projectAwardDate !== null,
            name: name || "",
            project: project.id.uuid,
            creationDate: new Date(),
            archiveDate: null,
            archiveFor: null,
            archiveOf: null,
        };

        await onEstimate(estimate, {
            async std(estimate) {
                storeRecord(
                    ESTIMATE_META,
                    "estimates",
                    changeEstimateIds(newId, {
                        ...estimate,
                        common,
                    })
                );

                if (interactive) {
                    window.open("#/estimate/" + newId.uuid);
                }
            },
            async tm(estimate) {
                await storeRecord(
                    TIME_AND_MATERIALS_ESTIMATE_META,
                    "estimates",
                    {
                        ...estimate,
                        common,
                        id: newId,
                    }
                );

                if (interactive) {
                    window.open("#/tm-estimate/" + newId.uuid);
                }
            },
        });

        await updateEstimateDate(project);
        return newId.uuid;
    } else {
        return null;
    }
}
