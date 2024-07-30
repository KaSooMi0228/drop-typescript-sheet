import { GridWithEditor } from "../../clay/dataGrid/gridWithEditor";
import { LinkWidget } from "../../clay/widgets/link-widget";
import CompanyWidget from "./CompanyWidget.widget";
import * as React from "react";

export const CompanyPage = GridWithEditor({
    prefix: "#/company",
    meta: CompanyWidget,
    makeContext: (context) => context,
    applyName: (record, name) => ({
        ...record,
        name: name,
    }),
    title: (record) => {
        return `Company: ${record.name}`;
    },
    fallbackSorts: ["name", "id"],
});

export const CompanyLinkWidget = LinkWidget({
    table: "Company",
    openUrl: "#/company/edit",
    nameColumn: "summary",
});
