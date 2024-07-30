import { AdminTablePage } from "../../clay/admin-table";
import { TableWidgetPage } from "../../clay/TableWidgetPage";
import { PROJECT_META } from "../project/table";
import EstimateContingencyItemTypeWidget from "./EstimateContingencyItemTypeWidget.widget";
import EstimateWidget from "./EstimateWidget.widget";
import { Estimate } from "./table";
import * as React from "react";

export const EstimatePage = TableWidgetPage({
    meta: EstimateWidget as any,
    makeContext: (context) => context,
    autoSave: true,
    title: (record: Estimate, cache) => {
        const project = cache.get(PROJECT_META, record.common.project);
        return `Estimate: ${project?.siteAddress?.line1}, ${project?.siteAddress.city} - ${project?.projectNumber} - ${record.common.name}`;
    },
});

export const EstimateContingencyItemTypePage = AdminTablePage({
    rowWidget: EstimateContingencyItemTypeWidget,
    columns: [
        {
            id: "name",
            label: "Name",
        },
        {
            id: "rate",
            label: "Rate",
        },
        {
            id: "type",
            label: "Type",
        },
        {
            id: "substrate",
            label: "Substrate",
        },
    ],
    compare: (lhs, rhs) => {
        return lhs.name.localeCompare(rhs.name);
    },
    adminCategory: "contact",
});
