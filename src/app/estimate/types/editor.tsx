import { AdminCollectionPage } from "../../../clay/admin-collection-page";
import { AdminTablePage } from "../../../clay/admin-table";
import ApplicationTypeWidget from "./ApplicationTypeWidget.widget";
import ItemTypeRowWidget from "./ItemTypeRowWidget.widget";
import SubstrateRowWidget from "./SubstrateRowWidget.widget";
import UnitTypeRowWidget from "./UnitTypeRowWidget.widget";
import * as React from "react";

export const SubstratePage = AdminTablePage({
    rowWidget: SubstrateRowWidget,
    adminCategory: "estimates",
    compare: (lhs, rhs) => lhs.name.localeCompare(rhs.name),
    columns: [
        {
            id: "name",
            label: "Name",
            width: 400,
        },
    ],
});

export const UnitTypesPage = AdminTablePage({
    rowWidget: UnitTypeRowWidget,
    adminCategory: "estimates",
    compare: (lhs, rhs) => {
        if (lhs.contingency == rhs.contingency) {
            return lhs.name.localeCompare(rhs.name);
        } else {
            return lhs.contingency ? 1 : -1;
        }
    },
    columns: [
        {
            id: "name",
            label: "Name",
            width: 400,
        },
        {
            id: "contingency",
            label: "Contingency",
        },
    ],
});

export const ItemTypesPage = AdminCollectionPage({
    meta: ItemTypeRowWidget,
    adminCategory: "estimates",
    labelColumn: "name",
    urlPrefix: "#/admin/item-types",
});

export const ApplicationTypesPage = AdminCollectionPage({
    meta: ApplicationTypeWidget,
    labelColumn: "name",
    adminCategory: "estimates",
    urlPrefix: "#/admin/application-types",
});
