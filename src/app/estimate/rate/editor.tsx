import { AdminTablePage } from "../../../clay/admin-table";
import RateRowWidget from "./RateRowWidget.widget";
import * as React from "react";

export const RatePage = AdminTablePage({
    rowWidget: RateRowWidget,
    adminCategory: "estimates",
    compare: (lhs, rhs) => lhs.name.localeCompare(rhs.name),
    columns: [
        {
            id: "name",
            label: "Name",
        },
        {
            id: "hours",
            label: "Hours",
        },
        {
            id: "materials",
            label: "Materials",
        },
        {
            id: "itemType",
            label: "Item Type",
        },
        {
            id: "unitType",
            label: "Unit Type",
        },
        {
            id: "unitIncrement",
            label: "Unit Increment",
        },
    ],
});
