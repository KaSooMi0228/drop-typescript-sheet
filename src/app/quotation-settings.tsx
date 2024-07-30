import {
    faFileContract,
    faListOl,
    faPrint,
    faStethoscope,
} from "@fortawesome/free-solid-svg-icons";
import { Breadcrumb } from "react-bootstrap";
import { PagesPage } from "./pages-page";
import * as React from "react";

const BUTTONS = [
    {
        href: "#/admin/scope-of-work",
        title: "Scope of Work",
        icon: faStethoscope,
        permission: {
            table: "ScopeOfWork",
            permission: "write",
        },
    },
    {
        href: "#/admin/contract-note",
        title: "Contract Notes",
        icon: faFileContract,
        permission: {
            table: "ContractNote",
            permission: "write",
        },
    },
    {
        href: "#/admin/your-project-item",
        title: "Project Spotlight Items",
        icon: faListOl,
        permission: {
            table: "ProjectSpotlight",
            permission: "write",
        },
    },
    {
        href: "#/admin/quotation-types",
        title: "Quotation Types",
        icon: faPrint,
        permission: {
            table: "QuotationType",
            permission: "write",
        },
    },
];

export const QuotationSettingsPage = {
    ...PagesPage({
        title: "Settings",
        buttons: BUTTONS,
    }),
    headerComponent: () => {
        return (
            <>
                <Breadcrumb>
                    <Breadcrumb.Item href="#/">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item href="#/admin/">Settings</Breadcrumb.Item>
                    <Breadcrumb.Item active>Quotation</Breadcrumb.Item>
                </Breadcrumb>
                <div style={{ flexGrow: 1 }} />
            </>
        );
    },
};
