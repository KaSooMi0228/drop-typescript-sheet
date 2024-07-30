import { AdminCollectionPage } from "../../clay/admin-collection-page";
import RoleWidget from "./RoleWidget.widget";
import * as React from "react";

export const RolesPage = AdminCollectionPage({
    meta: RoleWidget,
    adminCategory: "general",
    labelColumn: "name",
    urlPrefix: "#/admin/roles",
});
