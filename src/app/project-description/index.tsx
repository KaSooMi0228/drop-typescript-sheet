import { AdminCollectionPage } from "../../clay/admin-collection-page";
import { AdminTablePage } from "../../clay/admin-table";
import ProjectDescriptionCategoryRowWidget from "./ProjectDescriptionCategoryRowWidget.widget";
import ProjectDescriptionRowWidget from "./ProjectDescriptionRowWidget.widget";
import * as React from "react";

export const ProjectDescriptionsPage = AdminTablePage({
    rowWidget: ProjectDescriptionRowWidget,
    compare: (lhs, rhs) => lhs.name.localeCompare(rhs.name),
    columns: [
        {
            id: "name",
            label: "Name",
            width: 400,
        },
        {
            id: "requireDetail",
            label: "Require Detail",
        },
        {
            id: "category",
            label: "Category",
        },
    ],
    adminCategory: "projects",
});

export const ProjectDescriptionCategoriesPage = AdminCollectionPage({
    meta: ProjectDescriptionCategoryRowWidget,
    labelColumn: "name",
    urlPrefix: "#/admin/project-description-categories",
    title: "Project Categories",
    adminCategory: "projects",
});
