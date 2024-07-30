import DataGridPage from "../../clay/dataGrid/DataGridPage";
import * as React from "react";

export const QuotationsPage = DataGridPage({
    table: "Quotation",
    dataSection: true,
    fallbackSorts: ["id"],
});
