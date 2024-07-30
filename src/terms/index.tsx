import { AdminTablePage } from "../clay/admin-table";
import { DropdownLinkWidget } from "../clay/widgets/dropdown-link-widget";
import { TERM_META } from "./table";
import TermWidget from "./TermWidget.widget";
import * as React from "react";

export const TermsPage = AdminTablePage({
    adminCategory: "projects",
    rowWidget: TermWidget,
    columns: [
        {
            id: "name",
            label: "Name",
        },
    ],
    compare: (a, b) => a.name.localeCompare(b.name),
});

export const TermLinkWidget = DropdownLinkWidget({
    meta: TERM_META,
    label: (term) => term.name,
});
