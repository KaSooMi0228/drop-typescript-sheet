import DataGridPage from "../../clay/dataGrid/DataGridPage";
import * as React from "react";

export const InvoicesPage = DataGridPage({
    table: "Invoice",
    fallbackSorts: ["id"],
    dataSection: true,
});
