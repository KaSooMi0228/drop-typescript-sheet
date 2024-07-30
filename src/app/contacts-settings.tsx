import {
    faFileSignature,
    faIdCard,
    faIndustry,
    faSnowboarding,
} from "@fortawesome/free-solid-svg-icons";
import { Breadcrumb } from "react-bootstrap";
import { PagesPage } from "./pages-page";
import * as React from "react";

const BUTTONS = [
    {
        href: "#/admin/contact-types/",
        title: "Titles",
        icon: faIdCard,
        permission: {
            table: "ContactType",
            permission: "write",
        },
    },
    {
        href: "#/admin/contact-inactive-reasons",
        title: "Contact Inactive Reasons",
        icon: faFileSignature,
        permission: {
            table: "ContactInactiveReason",
            permission: "write",
        },
    },
    {
        href: "#/admin/industries",
        title: "Industries",
        icon: faIndustry,
        permission: {
            table: "Industry",
            permission: "write",
        },
    },
    {
        href: "#/admin/contact-activity-followup",
        title: "Contact Followup Activity",
        icon: faSnowboarding,
        permission: {
            table: "ContactFollowupActivity",
            permission: "write",
        },
    },
];

export const ContactsSettingsPage = {
    ...PagesPage({
        title: "Contacts Settings",
        buttons: BUTTONS,
    }),
    headerComponent: () => {
        return (
            <>
                <Breadcrumb>
                    <Breadcrumb.Item href="#/">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item href="#/admin/">Settings</Breadcrumb.Item>
                    <Breadcrumb.Item active>Contacts</Breadcrumb.Item>
                </Breadcrumb>
                <div style={{ flexGrow: 1 }} />
            </>
        );
    },
};
