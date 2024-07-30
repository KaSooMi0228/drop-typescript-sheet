import { AdminCollectionPage } from "../../../clay/admin-collection-page";
import EstimateTemplateWidget from "./EstimateTemplateWidget.widget";
import * as React from "react";

export const EstimateTemplatePage = AdminCollectionPage({
    meta: EstimateTemplateWidget,
    adminCategory: "estimates",
    labelColumn: "name",
    urlPrefix: "#/admin/estimate-templates",
});
