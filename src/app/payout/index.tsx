import DataGridPage from "../../clay/dataGrid/DataGridPage";
import * as React from "react";

export const PayoutsPage = DataGridPage({
    table: "Payout",
    fallbackSorts: ["id"],
    dataSection: true,
});
