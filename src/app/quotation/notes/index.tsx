import { AdminCollectionPage } from "../../../clay/admin-collection-page";
import ContractNoteWidget from "./ContractNoteWidget.widget";
import ProjectSpotlightWidget from "./ProjectSpotlightWidget.widget";
import ScopeOfWorkWidget from "./ScopeOfWorkWidget.widget";
import * as React from "react";

export const ScopeOfWorkPage = AdminCollectionPage({
    meta: ScopeOfWorkWidget,
    labelColumn: "notes.name",
    urlPrefix: "#/admin/scope-of-work",
    adminCategory: "quotations",
    title: "Scopes of Work",
});

export const ContractNotePage = AdminCollectionPage({
    meta: ContractNoteWidget,
    labelColumn: "notes.name",
    urlPrefix: "#/admin/contract-note",
    adminCategory: "quotations",
});

export const ProjectSpotlightPage = AdminCollectionPage({
    meta: ProjectSpotlightWidget,
    labelColumn: "notes.name",
    urlPrefix: "#/admin/your-project-item",
    adminCategory: "quotations",
    title: "Project Spotlight Items",
    addText: "Project Spotlight Item",
});
