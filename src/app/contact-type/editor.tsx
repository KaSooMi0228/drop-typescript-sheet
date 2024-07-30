import { AdminTablePage } from "../../clay/admin-table";
import ContactTypeRowWidget from "./ContactTypeRowWidget.widget";
import * as React from "react";

export const ContactTypesPage = AdminTablePage({
    rowWidget: ContactTypeRowWidget,
    adminCategory: "contacts",
    compare: (lhs, rhs) => lhs.name.localeCompare(rhs.name),
    columns: [
        {
            id: "name",
            label: "Name",
            width: 400,
        },
        {
            id: "common",
            label: "Common",
            width: 100,
        },
    ],
});
