import {
    faHistory,
    faPeopleCarry,
    faTable,
    faUsers,
    faUserTag,
} from "@fortawesome/free-solid-svg-icons";
import { Breadcrumb } from "react-bootstrap";
import { PagesPage } from "./pages-page";
import * as React from "react";

const BUTTONS = [
    {
        href: "#/admin/users/",
        title: "Users",
        icon: faUsers,
        permission: {
            table: "User",
            permission: "write",
        },
    },
    {
        href: "#/admin/squads/",
        title: "Squads",
        icon: faPeopleCarry,
        permission: {
            table: "Squad",
            permission: "write",
        },
    },
    {
        href: "#/admin/views/",
        title: "Views",
        icon: faTable,
        permission: {
            table: "View",
            permission: "write",
        },
    },
    {
        href: "#/admin/roles/",
        title: "Roles",
        icon: faUserTag,
        permission: {
            table: "Role",
            permission: "write",
        },
    },
    {
        href: "#/admin/record-history/",
        title: "Record History",
        icon: faHistory,
        permission: {
            table: "RecordHistory",
            permission: "read",
        },
    },
    {
        href: "#/admin/rejected-changes/",
        title: "Rejected Changes",
        icon: faHistory,
        permission: {
            table: "RecordHistory",
            permission: "read",
        },
    },
];

export const GeneralSettingsPage = {
    ...PagesPage({
        title: "General Settings",
        buttons: BUTTONS,
    }),
    headerComponent: () => {
        return (
            <>
                <Breadcrumb>
                    <Breadcrumb.Item href="#/">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item href="#/admin/">Settings</Breadcrumb.Item>
                    <Breadcrumb.Item active>General</Breadcrumb.Item>
                </Breadcrumb>
                <div style={{ flexGrow: 1 }} />
            </>
        );
    },
};
