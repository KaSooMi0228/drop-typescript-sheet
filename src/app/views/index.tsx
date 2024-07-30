import { plural } from "pluralize";
import { AdminCollectionPage } from "../../clay/admin-collection-page";
import { titleCase } from "../../clay/title-case";
import ViewWidget from "./ViewWidget.widget";
import * as React from "react";

const categories = [
        "Company",
        "Contact",
        "Invoice",
        "Payout",
        "Project",
        "ProjectEmail",
        "Quotation",
        "SaltOrder",
        "SiteVisitReport",
        "CompletionSurvey",
        "CustomerSurvey",
        "Campaign",
        "WarrantyReview",
    ].map((key) => ({
        key,
        label:
            key == "CompletionSurvey"
                ? "Payout Survey"
                : titleCase(plural(key)),
    }))

categories.sort((a,b) => a.label.localeCompare(b.label))

export const ViewsPage = AdminCollectionPage({
    meta: ViewWidget,
    adminCategory: "general",
    labelColumn: "name",
    urlPrefix: "#/admin/views",
    categoryColumn: "table",
    defaultColumn: "default",
    categories,
    applyCategory: (view, category) => ({
        ...view,
        table: category as any,
    }),
});
