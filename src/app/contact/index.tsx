import { AdminTablePage } from "../../clay/admin-table";
import { GridWithEditor } from "../../clay/dataGrid/gridWithEditor";
import ContactFollowupActivityRowWidget from "./ContactFollowupActivityRowWidget.widget";
import ContactInactiveReasonRowWidget from "./ContactInactiveReasonRowWidget.widget";
import ContactWidget from "./ContactWidget.widget";
import * as React from "react";

export const ContactPage = GridWithEditor({
    prefix: "#/contact",
    meta: ContactWidget,
    fallbackSorts: ["name", "id"],
    makeContext: (context) => context,
    title: (record) => {
        return `Contact: ${record.name}`;
    },
    applyName: (record, name) => ({
        ...record,
        name,
    }),
});

export const ContactInactiveReasonPage = AdminTablePage({
    rowWidget: ContactInactiveReasonRowWidget,
    columns: [
        {
            id: "name",
            label: "Name",
        },
        {
            id: "requireDetail",
            label: "Require Detail",
        },
    ],
    compare: (lhs, rhs) => {
        return lhs.name.localeCompare(rhs.name);
    },
    adminCategory: "contact",
});

export const ContactFollowupActivityPage = AdminTablePage({
    rowWidget: ContactFollowupActivityRowWidget,
    columns: [
        {
            id: "name",
            label: "Name",
        },
    ],
    compare: (lhs, rhs) => {
        return lhs.name.localeCompare(rhs.name);
    },
    adminCategory: "contact",
});
