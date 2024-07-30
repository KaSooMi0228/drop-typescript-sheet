import Decimal from "decimal.js";
import { isEqual } from "lodash";
import { Percentage } from "../../clay/common";
import { Link } from "../../clay/link";
import { PaginatedWidget } from "../../clay/paginated-widget";
import { QuickCacheApi } from "../../clay/quick-cache";
import { newUUID, UUID, uuid5 } from "../../clay/uuid";
import { Estimate } from "../estimate/table";
import { TimeAndMaterialsEstimate } from "../estimate/time-and-materials/table";
import { CONTRACT_NOTE_META, SCOPE_OF_WORK_META } from "./notes/table";
import QuotationContractNotesWidget from "./QuotationContractNotesWidget.widget";
import QuotationGenerateWidget from "./QuotationGenerateWidget.widget";
import QuotationMainWidget from "./QuotationMainWidget.widget";
import QuotationOptionsWidget from "./QuotationOptionsWidget.widget";
import QuotationProjectSpotlightWidget from "./QuotationProjectSpotlightWidget.widget";
import QuotationScopeOfWorkWidget, {
    resolveEstimateTemplates,
} from "./QuotationScopeOfWorkWidget.widget";
import {
    resolveActions,
    resolveAllowances,
    resolveAreas,
    resolveAreasReady,
    resolveContingencies,
} from "./resolve-option";
import {
    SourceArea,
    SourceAreaAction,
    SourceAreaContingency,
} from "./source-area";
import { Quotation, QUOTATION_META } from "./table";
import * as React from "react";

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function fixItem<T extends { id: UUID; name?: string; description?: string }>(
    item: Link<T>,
    current: T[],
    old: T[],
    estimateIds: Link<Estimate | TimeAndMaterialsEstimate>[]
) {
    // Check for an area we know about
    if (current.find((x) => x.id.uuid === item)) {
        return item;
    }
    for (const estimateId of estimateIds) {
        const transplanted = uuid5(estimateId! + item);
        if (current.find((x) => x.id.uuid === transplanted)) {
            return transplanted;
        }

        for (const x of current) {
            const transplanted = uuid5(estimateId! + x.id.uuid);
            if (transplanted == item) {
                return x.id.uuid;
            }
        }
    }

    const oldMatch = old.find((x) => x.id.uuid === item);
    if (oldMatch) {
        const nameMatch = current.find((x) => x.name === oldMatch.name);
        if (nameMatch) {
            return nameMatch.id.uuid;
        }
        const descriptionMatch = current.find(
            (x) => x.name === oldMatch.description
        );
        if (descriptionMatch) {
            return descriptionMatch.id.uuid;
        }
        if (oldMatch.name) {
            const index = oldMatch.name.indexOf(" - ");
            if (index !== -1) {
                const looserMatch = new RegExp(
                    "^.* - " +
                        escapeRegExp(oldMatch.name.substring(index + 3)) +
                        "$"
                );
                const nameMatch2 = current.find(
                    (x) => x.name && looserMatch.test(x.name)
                );
                if (nameMatch2) {
                    return nameMatch2.id.uuid;
                }
            }
        }
    }

    return null;
}

function applyFix<T>(items: T[], f: (x: T) => T) {
    return items.map(f).filter((x) => x);
}

function applyScheduleFix<T>(
    items: { item: T; portion: Percentage }[],
    f: (x: T) => T
) {
    return items
        .map((x) => ({
            ...x,
            item: f(x.item),
        }))
        .filter((x) => x.item);
}

function processChangeEstimates(
    quotation: Quotation,
    cache: QuickCacheApi,
    pageId: string
) {
    let missing = false;

    if (
        !resolveAreasReady(quotation, cache) ||
        !resolveAreasReady(
            { ...quotation, estimates: quotation.initializedEstimates },
            cache
        )
    ) {
        missing = true;
    }

    if (pageId === "main") {
        return null;
    }

    if (missing) {
        return undefined;
    }

    const estimateIds = [
        ...quotation.estimates,
        ...quotation.initializedEstimates,
    ];

    const areas = resolveAreas(quotation, cache);
    const oldAreas = resolveAreas(
        {
            ...quotation,
            estimates: quotation.initializedEstimates,
        },
        cache
    );

    const fixArea = (area: Link<SourceArea>) => {
        return fixItem(area, areas, oldAreas, estimateIds);
    };

    const actions = resolveActions(
        areas.map((x) => x.id.uuid),
        areas
    );
    const oldActions = resolveActions(
        oldAreas.map((x) => x.id.uuid),
        oldAreas
    );

    const fixAction = (action: Link<SourceAreaAction>) => {
        return fixItem(action, actions, oldActions, estimateIds);
    };

    const allowances = resolveAllowances(
        areas.map((x) => x.id.uuid),
        areas
    );
    const oldAllowances = resolveAllowances(
        oldAreas.map((x) => x.id.uuid),
        oldAreas
    );

    const fixAllowance = (allowance: Link<SourceAreaAction>) => {
        return fixItem(allowance, allowances, oldAllowances, estimateIds);
    };

    const contingencies = resolveContingencies(
        areas.map((x) => x.id.uuid),
        areas
    );
    const oldContingencies = resolveContingencies(
        oldAreas.map((x) => x.id.uuid),
        oldAreas
    );

    const fixContigencies = (contingency: Link<SourceAreaContingency>) => {
        return fixItem(
            contingency,
            contingencies,
            oldContingencies,
            estimateIds
        );
    };

    const options = quotation.options.map((option) => ({
        ...option,
        areas: applyFix(option.areas, fixArea),
        actions: applyFix(option.actions, fixAction),
        hiddenActions: applyFix(option.hiddenActions, fixAction),
        allowances: applyFix(option.allowances, fixAllowance),
        contingencies: applyFix(option.contingencies, fixContigencies),
        schedules: option.schedules.map((schedule) => ({
            ...schedule,
            actions: applyScheduleFix(schedule.actions, fixAction),
            allowances: applyScheduleFix(schedule.allowances, fixAllowance),
            contingencies: applyScheduleFix(
                schedule.contingencies,
                fixContigencies
            ),
        })),
    }));

    return {
        ...quotation,
        options,
        initializedEstimates: quotation.estimates,
    };
}

export const QuotationWidget = PaginatedWidget({
    dataMeta: QUOTATION_META,
    process(quotation, cache, pageId) {
        if (quotation.initialized) {
            if (isEqual(quotation.estimates, quotation.initializedEstimates)) {
                return null;
            } else {
                return processChangeEstimates(quotation, cache, pageId);
            }
        }

        const templates = resolveEstimateTemplates(quotation, cache);

        const contractNotes = cache.getAll(CONTRACT_NOTE_META);
        const scopeOfWorks = cache.getAll(SCOPE_OF_WORK_META);

        if (pageId === "main") {
            return null;
        }

        if (
            !resolveAreasReady(quotation, cache) ||
            templates === null ||
            contractNotes === undefined ||
            scopeOfWorks === undefined
        ) {
            return undefined;
        }

        const areas = resolveAreas(quotation, cache);

        const option = {
            id: newUUID(),
            name: "Base Bid",
            description: "",
            actions: [],
            areas: areas.map((area) => area.id.uuid),
            schedules: [],
            contingencies: [],
            adjustment: new Decimal(0),
            hiddenActions: [],
            allowances: [],
            projectDescription: {
                description: null,
                category: null,
                custom: "",
            },
            details: {
                actions: [],
                contingencies: [],
                allowances: [],
                finishSchedule: [],
                schedules: [],
                total: new Decimal(0),
                areas: [],
                actionPriceTotal: new Decimal(0),
                allowancePriceTotal: new Decimal(0),
                contingencyPriceTotal: new Decimal(0),
            },
            includedInExpectedContractValue: true,
        };

        return {
            ...quotation,
            options: [option],
            contractNotes: templates
                .flatMap((template) => template.contractNotes)
                .map(
                    (contractNoteId) =>
                        cache.get(CONTRACT_NOTE_META, contractNoteId)!.notes
                ),
            scopeOfWork: templates
                .flatMap((template) => template.scopesOfWork)
                .map(
                    (scopeOfWorkId) =>
                        cache.get(SCOPE_OF_WORK_META, scopeOfWorkId)!.notes
                ),
            initialized: true,
        };
    },
    pages() {
        return [
            {
                id: "main",
                title: "Details",
                widget: QuotationMainWidget,
            },
            {
                id: "options",
                title: "Options",
                widget: QuotationOptionsWidget,
            },
            {
                id: "scope-of-work",
                title: "Scope of Work",
                widget: QuotationScopeOfWorkWidget,
            },
            {
                id: "contract-notes",
                title: "Contract Notes",
                widget: QuotationContractNotesWidget,
            },
            {
                id: "your-project-items",
                title: "Project Spotlight",
                widget: QuotationProjectSpotlightWidget,
            },

            {
                id: "generate",
                title: "Generate",
                widget: QuotationGenerateWidget,
            },
        ];
    },
});
