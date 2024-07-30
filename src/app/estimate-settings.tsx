import {
    faBolt,
    faBoxes,
    faDotCircle,
    faGopuram,
    faPalette,
    faRuler,
    faStroopwafel,
} from "@fortawesome/free-solid-svg-icons";
import { Breadcrumb } from "react-bootstrap";
import { PagesPage } from "./pages-page";
import * as React from "react";

const BUTTONS = [
    {
        href: "#/admin/unit-types",
        title: "Unit Types",
        icon: faRuler,
        permission: {
            table: "UnitType",
            permission: "write",
        },
    },
    {
        href: "#/admin/substrates",
        title: "Substrates",
        icon: faStroopwafel,
        permission: {
            table: "Substrate",
            permission: "write",
        },
    },
    {
        href: "#/admin/item-types",
        title: "Item Types",
        icon: faDotCircle,
        permission: {
            table: "ItemType",
            permission: "write",
        },
    },
    {
        href: "#/admin/finish-schedules",
        title: "Finish Schedule Options",
        icon: faPalette,
        permission: {
            table: "FinishSchedule",
            permission: "write",
        },
    },
    {
        href: "#/admin/application-types",
        title: "Application Types",
        icon: faBolt,
        permission: {
            table: "ApplicationType",
            permission: "write",
        },
    },
    {
        href: "#/admin/estimate-templates",
        title: "Estimate Templates",
        icon: faGopuram,
        permission: {
            table: "EstimateTemplate",
            permission: "write",
        },
    },
    {
        href: "#/admin/tm-products",
        title: "Line Painting Options",
        icon: faBoxes,
        permission: {
            table: "TimeAndMaterialsEstimateProduct",
            permission: "write",
        },
    },
    {
        href: "#/admin/estimate-contingency-item-types",
        title: "Contingency Item Options",
        icon: faBoxes,
        permission: {
            table: "EstimateContingencyItemType",
            permission: "write",
        },
    },
];

export const EstimateSettingsPage = {
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
                    <Breadcrumb.Item active>Estimate</Breadcrumb.Item>
                </Breadcrumb>
                <div style={{ flexGrow: 1 }} />
            </>
        );
    },
};
