import { AdminTablePage } from "../../../clay/admin-table";
import QuotationTypeRowWidget from "./QuotationTypeRowWidget.widget";
import * as React from "react";

export const QuotationTypesPage = AdminTablePage({
    rowWidget: QuotationTypeRowWidget,
    compare: (lhs, rhs) => lhs.name.localeCompare(rhs.name),
    columns: [
        {
            id: "name",
            label: "Name",
            width: 400,
        },
        {
            id: "print",
            label: "Print",
        },
        {
            id: "defaultLandingLikelihood",
            label: "Default Landing Likelihood",
        },
    ],
});
