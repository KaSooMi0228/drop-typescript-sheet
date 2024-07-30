import { TableWidgetPage } from "../../../clay/TableWidgetPage";
import { PROJECT_META } from "../../project/table";
import { TimeAndMaterialsEstimate } from "./table";
import { TimeAndMaterialsEstimateWidget } from "./widget";
import * as React from "react";

export const TimeAndMaterialsEstimatePage = TableWidgetPage({
    meta: TimeAndMaterialsEstimateWidget as any,
    makeContext: (context) => context,
    autoSave: true,
    title: (record: TimeAndMaterialsEstimate, cache) => {
        const project = cache.get(PROJECT_META, record.common.project);
        return `Estimate: ${project?.siteAddress?.line1}, ${project?.siteAddress.city} - ${project?.projectNumber} - ${record.common.name}`;
    },
});
