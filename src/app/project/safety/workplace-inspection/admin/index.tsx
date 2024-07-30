import { TableWidgetPage } from "../../../../../clay/TableWidgetPage";
import TemplateWidget from "./Template.widget";
import * as React from "react";

export const WorkplaceInspectionAdmin = TableWidgetPage({
    meta: TemplateWidget,
    makeContext: (context) => context,
    title() {
        return "Workplace Inspection Template";
    },
});
