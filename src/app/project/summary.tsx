import { PageContext } from "../../clay/Page";
import { PaginatedWidget } from "../../clay/paginated-widget";
import ProjectAccountingWidget from "./ProjectAccountingWidget.widget";
import ProjectDetailsWidget from "./ProjectDetailsWidget.widget";
import ProjectQuotingWidget from "./ProjectQuotingWidget.widget";
import ProjectRfqToQWidget from "./ProjectRfqToQWidget.widget";
import ProjectSummaryWidget from "./ProjectSummaryWidget.widget";
import { Project, PROJECT_META } from "./table";
import * as React from "react";

export const SummaryTabsWidget = PaginatedWidget<Project, PageContext>({
    dataMeta: PROJECT_META,
    pages() {
        return [
            {
                id: "summary",
                title: "Summary",
                widget: ProjectSummaryWidget,
            },
            {
                id: "rfq-to-q",
                title: "RFQ to Q",
                widget: ProjectRfqToQWidget,
            },
            {
                id: "accounting",
                title: "Accounting",
                widget: ProjectAccountingWidget,
            },
            {
                id: "quoting",
                title: "Pending Follow-ups",
                widget: ProjectQuotingWidget,
            },
            {
                id: "details",
                title: "Project Scheduling",
                widget: ProjectDetailsWidget,
            },
        ];
    },
});
