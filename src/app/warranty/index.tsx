import { AdminCollectionPage } from "../../clay/admin-collection-page";
import { AdminTablePage } from "../../clay/admin-table";
import WarrantyLengthWidget from "./WarrantyLengthWidget.widget";
import WarrantyTemplateWidget from "./WarrantyTemplateWidget.widget";
import * as React from "react";

export const WarrantyLengthsPage = AdminTablePage({
    rowWidget: WarrantyLengthWidget,
    adminCategory: "projects",
    compare: (lhs, rhs) => lhs.name.localeCompare(rhs.name),
    columns: [
        {
            id: "name",
            label: "Name",
            width: 400,
        },
        {
            id: "legal",
            label: "Legal",
            width: 400,
        },
        {
            id: "number",
            label: "Number",
            width: 400,
        },
    ],
});

export const WarrantyTemplatesPage = AdminCollectionPage({
    meta: WarrantyTemplateWidget,
    labelColumn: "name",
    urlPrefix: "#/admin/warranty-templates",
    title: "Warranty Templates",
    adminCategory: "projects",
});
