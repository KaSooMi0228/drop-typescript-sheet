import {
    faBoxes,
    faCalculator,
    faCopy,
    faFileAlt,
    faIdCard,
    faToolbox,
} from "@fortawesome/free-solid-svg-icons";
import { Breadcrumb } from "react-bootstrap";
import { PagesPage } from "./pages-page";
import * as React from "react";

const BUTTONS = [
    {
        href: "#/admin/contacts/",
        title: "Contact Settings",
        icon: faIdCard,
    },
    {
        href: "#/admin/general/",
        title: "General Settings",
        icon: faBoxes,
    },
    {
        href: "#/admin/estimates",
        title: "Estimate Settings",
        icon: faCalculator,
    },
    {
        href: "#/admin/quotations",
        title: "Quotation Settings",
        icon: faFileAlt,
    },
    {
        href: "#/admin/projects",
        title: "Project Settings",
        icon: faToolbox,
    },
    {
        href: "#/admin/salt/",
        title: "Salt Products",
        icon: faBoxes,
        permission: {
            table: "SaltProduct",
            permission: "write",
        },
    },
    {
        href: "#/admin/duplicates",
        title: "Duplicates",
        icon: faCopy,
        permission: {
            table: "General",
            permission: "duplicates",
        },
    },
];

export const SettingsPage = {
    ...PagesPage({
        title: "Settings",
        buttons: BUTTONS,
    }),
    headerComponent: () => {
        return (
            <>
                <Breadcrumb>
                    <Breadcrumb.Item href="#/">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item active>Settings</Breadcrumb.Item>
                </Breadcrumb>
                <div style={{ flexGrow: 1 }} />
            </>
        );
    },
};
