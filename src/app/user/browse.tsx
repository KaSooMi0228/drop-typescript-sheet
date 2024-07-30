import { AdminCollectionPage } from "../../clay/admin-collection-page";
import UserWidget from "./UserWidget.widget";
import * as React from "react";

export const UsersPage = AdminCollectionPage({
    meta: UserWidget,
    adminCategory: "general",
    labelColumn: "name",
    urlPrefix: "#/admin/users",
    categoryColumn: "active",
    categories: [
        {
            key: "true",
            label: "Active",
        },
        {
            key: "false",
            label: "Inactive",
        },
    ],
    applyCategory: (user, category) => ({
        ...user,
        active: category === "true",
    }),
});
