import DataGridPage from "../../../clay/dataGrid/DataGridPage";
import * as React from "react";

export const SiteVisitReportPage = DataGridPage({
    table: "SiteVisitReport",
    fallbackSorts: ["id"],
    dataSection: true,
});
