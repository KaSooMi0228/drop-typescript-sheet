import Decimal from "decimal.js";
import { every, find } from "lodash";
import { PaginatedWidget } from "../../../clay/paginated-widget";
import { sumMap } from "../../../clay/queryFuncs";
import { newUUID } from "../../../clay/uuid";
import { FINISH_SCHEDULE_META } from "../../estimate/finish-schedule/table";
import { ITEM_TYPE_META } from "../../estimate/types/table";
import {
    calcQuotationExpectedContractValue,
    QUOTATION_META,
} from "../../quotation/table";
import { Project } from "../table";
import DetailSheetAccessRequirementsWidget from "./DetailSheetAccessRequirementsWidget.widget";
import DetailSheetAllowancesWidget from "./DetailSheetAllowancesWidget.widget";
import DetailSheetContractDetailsWidget from "./DetailSheetContractDetailsWidget.widget";
import DetailSheetContractNotesWidget from "./DetailSheetContractNotesWidget.widget";
import DetailSheetFinishSchedulesWidget from "./DetailSheetFinishSchedulesWidget.widget";
import DetailSheetMainWidget from "./DetailSheetMainWidget.widget";
import DetailSheetOptionsWidget from "./DetailSheetOptionsWidget.widget";
import DetailSheetScopeOfWorkWidget from "./DetailSheetScopeOfWorkWidget.widget";
import {
    DetailSheetOption,
    DETAIL_SHEET_META,
    resolveDetailSheetSchedules,
} from "./table";
import * as React from "react";

export const DetailSheetWidget = PaginatedWidget({
    dataMeta: DETAIL_SHEET_META,
    validate(detailSheet, cache, errors) {
        if (detailSheet.date) {
            return [];
        } else {
            return errors;
        }
    },
    process(detailSheet, cache, pageId, project: Project) {
        if (detailSheet.initialized) {
            return null;
        }

        const quotations = detailSheet.quotations.map((quotation) =>
            cache.get(QUOTATION_META, quotation)
        );

        const finishSchedules = cache.getAll(FINISH_SCHEDULE_META);
        const itemTypes = cache.getAll(ITEM_TYPE_META);

        if (pageId === "main") {
            return null;
        }

        if (!every(quotations) || !finishSchedules || !itemTypes) {
            return undefined;
        }
        const options: DetailSheetOption[] = [];
        for (const quotation of quotations) {
            for (const option of quotation!.options) {
                if (
                    !detailSheet.change &&
                    project.selectedOptions.indexOf(option.id.uuid) === -1
                ) {
                    continue;
                }
                options.push({
                    id: newUUID(),
                    name: option.name,
                    description: option.description,
                    finishSchedule: option.details.finishSchedule.map(
                        (schedule) => ({
                            ...schedule,
                            colour: "",
                        })
                    ),
                    allowances: option.details.allowances,
                    budget: option.details.actions.map((action) => ({
                        name: action.name,
                        hours: action.hours,
                        hourRate: action.hourRate,
                        materials: action.materials,
                        materialsRate: action.materialsRate,
                        colour: "",
                        originalMaterialsRate:
                            find(
                                finishSchedules,
                                (finishSchedule) =>
                                    finishSchedule.name ===
                                        action.finishSchedule &&
                                    finishSchedule.substrates.indexOf(
                                        find(
                                            itemTypes,
                                            (itemType) =>
                                                itemType.id.uuid ==
                                                action.itemType
                                        )?.substrate || null
                                    ) !== -1
                            )?.rate || null,
                    })),
                });
            }
        }

        return resolveDetailSheetSchedules({
            ...detailSheet,
            initialized: true,
            options,
            ...(detailSheet.change
                ? {
                      schedules: [
                          {
                              id: newUUID(),
                              name:
                                  "Change Order #" +
                                  detailSheet.number.toString(),
                              description: "",
                              price: sumMap(quotations, (quotation) =>
                                  calcQuotationExpectedContractValue(quotation!)
                              ),
                              certifiedForemanContractAmount: new Decimal(0),
                              contingencyAllowance: false,
                              projectDescription: {
                                  category: null,
                                  description: null,
                                  custom: "",
                              },
                          },
                      ],
                      projectDescription:
                          quotations[0]?.projectDescription ||
                          project.projectDescription,
                      schedulesDividedDescription: false,
                  }
                : {
                      schedules: project.projectSchedules,
                      contingencyItems: project.projectContingencyItems,
                      schedulesDividedDescription:
                          project.projectSchedulesDividedDescription,
                      description: project.projectDescription,
                  }),
            scopeOfWork: quotations.flatMap(
                (quotation) => quotation!.scopeOfWork
            ),
            contractNotes: quotations.flatMap(
                (quotation) => quotation!.contractNotes
            ),
        });
    },
    pages() {
        return [
            {
                id: "main",
                title: "Main",
                widget: DetailSheetMainWidget,
            },
            {
                id: "options",
                title: "Budgets",
                widget: DetailSheetOptionsWidget,
            },
            {
                id: "finish-schedules",
                title: "Finish Schedules",
                widget: DetailSheetFinishSchedulesWidget,
            },
            {
                id: "allowances",
                title: "Allowances",
                widget: DetailSheetAllowancesWidget,
            },
            {
                id: "scope-of-work",
                title: "Scope of Work",
                widget: DetailSheetScopeOfWorkWidget,
            },
            {
                id: "contract-notes",
                title: "Project Notes",
                widget: DetailSheetContractNotesWidget,
            },
            {
                id: "special-requirements",
                title: "Special Requirements",
                widget: DetailSheetAccessRequirementsWidget,
            },
            {
                id: "contract-details",
                title: "Invoicing Details",
                widget: DetailSheetContractDetailsWidget,
            },
        ];
    },
});
