import { AdminTablePage } from "../../../clay/admin-table";
import AnticipatedDurationWidget from "./AnticipatedDurationWidget.widget";
import ApprovalTypeWidget from "./ApprovalTypeWidget.widget";
import CompetitorWidget from "./CompetitorWidget.widget";
import ManufacturerWidget from "./ManufacturerWidget.widget";
import { AnticipatedDuration } from "./table";
import ThirdPartySpecifierWidget from "./ThirdPartySpecifierWidget.widget";
import * as React from "react";

export const ThirdPartySpecifiersPage = AdminTablePage({
    adminCategory: "projects",
    rowWidget: ThirdPartySpecifierWidget,
    compare: (lhs, rhs) => lhs.name.localeCompare(rhs.name),
    columns: [
        {
            id: "name",
            label: "Name",
            width: 400,
        },
        {
            id: "active",
            label: "Active",
        },
    ],
});

export const CompetitorsPage = AdminTablePage({
    adminCategory: "projects",
    rowWidget: CompetitorWidget,
    compare: (lhs, rhs) => lhs.name.localeCompare(rhs.name),
    columns: [
        {
            id: "name",
            label: "Name",
            width: 400,
        },
        {
            id: "active",
            label: "Active",
        },
    ],
});

export const ManufacturersPage = AdminTablePage({
    adminCategory: "projects",
    rowWidget: ManufacturerWidget,
    compare: (lhs, rhs) => lhs.name.localeCompare(rhs.name),
    columns: [
        {
            id: "name",
            label: "Name",
            width: 400,
        },
        {
            id: "active",
            label: "Active",
        },
    ],
});

function classifyUnit(name: string): number {
    if (name.startsWith(">")) {
        return 3;
    } else if (name.toLowerCase().indexOf("days") !== -1) {
        return 1;
    } else if (name.toLowerCase().indexOf("weeks") !== -1) {
        return 2;
    } else {
        return 0;
    }
}

export function durationCompare(
    lhs: AnticipatedDuration,
    rhs: AnticipatedDuration
) {
    const lhsUnit = classifyUnit(lhs.name);
    const rhsUnit = classifyUnit(rhs.name);
    if (lhsUnit != rhsUnit) {
        return lhsUnit - rhsUnit;
    } else {
        return parseInt(lhs.name) - parseInt(rhs.name);
    }
}

export const AnticipatedDurationsPage = AdminTablePage({
    adminCategory: "projects",
    rowWidget: AnticipatedDurationWidget,
    compare: durationCompare,
    columns: [
        {
            id: "name",
            label: "Name",
            width: 400,
        },
        {
            id: "active",
            label: "Active",
        },
    ],
});

export const ApprovalTypesPage = AdminTablePage({
    adminCategory: "projects",
    rowWidget: ApprovalTypeWidget,
    compare: (lhs, rhs) => lhs.name.localeCompare(rhs.name),
    columns: [
        {
            id: "name",
            label: "Name",
            width: 400,
        },
        {
            id: "active",
            label: "Active",
        },
        {
            id: "requireCustomerPO",
            label: "Require Customer PO",
        },
    ],
});
