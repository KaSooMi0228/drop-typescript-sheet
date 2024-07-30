import { AdminTablePage } from "../../../clay/admin-table";
import QuoteSourceCategoryRowWidget from "./QuoteSourceCategoryRowWidget.widget";
import * as React from "react";

export const QuoteSourceCategoriesPage = AdminTablePage({
    rowWidget: QuoteSourceCategoryRowWidget,
    compare: (lhs, rhs) => lhs.name.localeCompare(rhs.name),
    columns: [
        {
            id: "name",
            label: "Name",
            width: 400,
        },
        {
            id: "active",
            label: "Active",
            width: 100,
        },
        {
            id: "requireDetail",
            label: "Require Detail",
            width: 100,
        },
    ],
    adminCategory: "projects",
});
