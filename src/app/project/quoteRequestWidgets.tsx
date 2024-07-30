import { PageContext } from "../../clay/Page";
import { PageConfig, PaginatedWidget } from "../../clay/paginated-widget";
import TenderDetailsWidget from "./quote-request/tender-details.widget";
import QuoteRequestCustomerWidget from "./QuoteRequestCustomerWidget.widget";
import QuoteRequestDetailsWidget from "./QuoteRequestDetailsWidget.widget";
import QuoteRequestParticularsWidget from "./QuoteRequestParticularsWidget.widget";
import { calcProjectHasThirdPartyTender, Project, PROJECT_META } from "./table";
import * as React from "react";

export const QuoteRequestWidget = PaginatedWidget<Project, PageContext>({
    dataMeta: PROJECT_META,
    pages(project: Project) {
        const pages: PageConfig<Project, PageContext>[] = [
            {
                id: "customer",
                title: "Client",
                widget: QuoteRequestCustomerWidget,
            },
            {
                id: "details",
                title: "Project Contacts",
                widget: QuoteRequestDetailsWidget,
            },
            {
                id: "particulars",
                title: "Project Particulars",
                widget: QuoteRequestParticularsWidget,
            },
        ];

        if (calcProjectHasThirdPartyTender(project)) {
            pages.push({
                id: "tender-details",
                title: "Tender Details",
                widget: TenderDetailsWidget,
            });
        }

        return pages;
    },
});
