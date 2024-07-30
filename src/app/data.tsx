import {
    faClipboardList,
    faEnvelopeSquare,
    faFileAlt,
    faFileInvoice,
    faFileInvoiceDollar,
    faPollH,
} from "@fortawesome/free-solid-svg-icons";
import { Breadcrumb } from "react-bootstrap";
import { PagesPage } from "./pages-page";
import * as React from "react";

const BUTTONS = [
    {
        href: "#/quotations/",
        title: "Proposals",
        icon: faFileAlt,
        permission: {
            table: "Quotation",
            permission: "read",
        },
    },
    {
        href: "#/invoices/",
        title: "Invoices",
        icon: faFileInvoice,
        permission: {
            table: "Invoice",
            permission: "read",
        },
    },
    {
        href: "#/payouts/",
        title: "Payouts",
        icon: faFileInvoiceDollar,
        permission: {
            table: "Payout",
            permission: "read",
        },
    },
    {
        href: "#/site-visit-reports/",
        title: "Site Visit Reports",
        icon: faClipboardList,
        permission: {
            table: "SiteVisitReport",
            permission: "read",
        },
    },
    {
        href: "#/project-emails/",
        title: "Project Emails",
        icon: faEnvelopeSquare,
        permission: {
            table: "ProjectEmail",
            permission: "read",
        },
    },
    {
        href: "#/payout-surveys/",
        title: "Payout Surveys",
        icon: faPollH,
        permission: {
            table: "CompletionSurvey",
            permission: "read",
        },
    },
    {
        href: "#/customer-surveys/",
        title: "Customer Surveys",
        icon: faPollH,
        permission: {
            table: "CustomerSurvey",
            permission: "read",
        },
    },
];

export const DataPage = {
    ...PagesPage({
        title: "Data",
        buttons: BUTTONS,
    }),
    headerComponent: () => {
        return (
            <>
                <Breadcrumb>
                    <Breadcrumb.Item href="#/">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item active>Data</Breadcrumb.Item>
                </Breadcrumb>
                <div style={{ flexGrow: 1 }} />
            </>
        );
    },
};
