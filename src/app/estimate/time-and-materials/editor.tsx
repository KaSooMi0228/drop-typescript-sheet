import { AdminTablePage } from "../../../clay/admin-table";
import TimeAndMaterialsEstimateProductWidget from "./TimeAndMaterialsEstimateProductWidget.widget";
import * as React from "react";

export const TimeAndMaterialsEstimateProductPage = AdminTablePage({
    rowWidget: TimeAndMaterialsEstimateProductWidget,
    adminCategory: "estimates",
    title: "Line Painting Options",
    compare: (lhs, rhs) => lhs.name.localeCompare(rhs.name),
    columns: [
        {
            id: "name",
            label: "Name",
            width: 400,
        },
        {
            id: "cost",
            label: "Cost",
        },
    ],
});
