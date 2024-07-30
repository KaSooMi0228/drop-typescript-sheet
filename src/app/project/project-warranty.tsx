import { some, sortBy } from "lodash";
import { PageContext } from "../../clay/Page";
import { PaginatedWidget } from "../../clay/paginated-widget";
import { WARRANTY_TEMPLATE_META } from "../warranty/table";
import { DetailSheet } from "./detail-sheet/table";
import ProjectWarrantyMainWidget from "./ProjectWarrantyMainWidget.widget";
import ProjectWarrantyProjectInformationWidget from "./ProjectWarrantyProjectInformationWidget.widget";
import ProjectWarrantyScopeOfWorkWidget from "./ProjectWarrantyScopeOfWorkWidget.widget";
import ProjectWarrantyWarrantiesWidget from "./ProjectWarrantyWarrantiesWidget.widget";
import { Project, PROJECT_META } from "./table";
import * as React from "react";

export const ProjectWarrantyWidget = PaginatedWidget<Project, PageContext>({
    dataMeta: PROJECT_META,
    process(data, cache, currentPageId, extra) {
        if (data.warranties.length > 0) {
            return null;
        }

        const allWarrantyTemplates = cache.getAll(WARRANTY_TEMPLATE_META);

        if (!allWarrantyTemplates) {
            return undefined;
        }

        const detailSheets: DetailSheet[] = extra;

        return {
            ...data,
            warranties: sortBy(
                allWarrantyTemplates,
                (template) => template.name
            ).map((template) => ({
                id: template.id,
                name: template.name,
                content: template.content,
                scheduleReview: template.scheduleReview,
                length: template.length,
                exceptions: "",
                active: some(
                    detailSheets,
                    (sheet) =>
                        some(
                            sheet.schedules,
                            (schedule) =>
                                template.projectDescriptions.indexOf(
                                    schedule.projectDescription.description
                                ) !== -1
                        ) ||
                        some(
                            sheet.contingencyItems,
                            (item) =>
                                template.projectDescriptions.indexOf(
                                    item.projectDescription.description
                                ) !== -1
                        )
                ),
            })),
        };
    },
    pages() {
        return [
            {
                id: "projectDetails",
                title: "Project Details",
                widget: ProjectWarrantyProjectInformationWidget,
            },
            {
                id: "scopeOfWork",
                title: "Scope of Work",
                widget: ProjectWarrantyScopeOfWorkWidget,
            },
            {
                id: "warranties",
                title: "Warranties",
                widget: ProjectWarrantyWarrantiesWidget,
            },
            {
                id: "main",
                title: "Internal Notes",
                widget: ProjectWarrantyMainWidget,
            },
        ];
    },
});
