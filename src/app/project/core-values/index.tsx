import { AdminCollectionPage } from "../../../clay/admin-collection-page";
import CoreValueNoticeCategoryWidget from "./CoreValueNoticeCategoryWidget.widget";
import * as React from "react";

export const CoreValueNoticeCategoryPage = AdminCollectionPage({
    meta: CoreValueNoticeCategoryWidget,
    labelColumn: "name",
    urlPrefix: "#/admin/core-value-notice-categories",
    title: "Core Value Notice Categories",
    adminCategory: "projects",
});
