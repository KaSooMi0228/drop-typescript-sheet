import { faFlipboard } from "@fortawesome/free-brands-svg-icons";
import {
    faBuilding,
    faCalendarCheck,
    faCalendarTimes,
    faCheckDouble,
    faEdit,
    faFileContract,
    faFlagCheckered,
    faGlasses,
    faInbox,
    faIndustry,
    faPercent,
    faPollH,
    faRuler,
} from "@fortawesome/free-solid-svg-icons";
import { Breadcrumb } from "react-bootstrap";
import { PagesPage } from "./pages-page";
import { COMPLETION_SURVEY_TEMPLATE_ID } from "./project/completion-survey/table";
import { WORKPLACE_INSPECTION_TEMPLATE_ID } from "./project/safety/workplace-inspection/admin/table";
import { WARRANTY_REVIEW_TEMPLATE_ID } from "./warranty-review/table";
import * as React from "react";

const BUTTONS = [
    {
        href: "#/admin/project-descriptions/",
        title: "Project Descriptions",
        icon: faEdit,
        permission: {
            table: "ProjectDescription",
            permission: "write",
        },
    },
    {
        href: "#/admin/core-value-notice-categories/",
        title: "Core Value Notice Categories",
        icon: faFlagCheckered,
        permission: {
            table: "CoreValueNoticeCategory",
            permission: "write",
        },
    },
    {
        href: "#/admin/project-description-categories/",
        title: "Project Categories",
        icon: faEdit,
        permission: {
            table: "ProjectDescriptionCategory",
            permission: "write",
        },
    },
    {
        href: "#/admin/quote-source-categories/",
        title: "Quote Source Categories",
        icon: faInbox,
        permission: {
            table: "QuoteSourceCategory",
            permission: "write",
        },
    },
    {
        href: "#/admin/landing-likelihood/",
        title: "Landing Likelihood",
        icon: faPercent,
        permission: {
            table: "LandingLikelihood",
            permission: "write",
        },
    },

    {
        href: "#/admin/third-party-specifiers",
        title: "Third Party Specifiers",
        icon: faGlasses,
        permission: {
            table: "ThirdPartySpecifier",
            permission: "write",
        },
    },
    {
        href: "#/admin/competitors",
        title: "Competitors",
        icon: faBuilding,
        permission: {
            table: "Competitor",
            permission: "write",
        },
    },
    {
        href: "#/admin/manufacturers",
        title: "Manufacturers",
        icon: faIndustry,
        permission: {
            table: "Manufacturer",
            permission: "write",
        },
    },
    {
        href: "#/admin/approval-types",
        title: "Approval Types",
        icon: faCheckDouble,
        permission: {
            table: "ApprovalType",
            permission: "write",
        },
    },
    {
        href: "#/admin/anticipated-durations",
        title: "Anticipated Durations",
        icon: faCalendarTimes,
        permission: {
            table: "AnticipatedDuration",
            permission: "write",
        },
    },
    {
        href:
            "#/admin/completion-survey-template/" +
            COMPLETION_SURVEY_TEMPLATE_ID,
        title: "Payout Survey Template",
        icon: faPollH,
        permission: {
            table: "CompletionSurveyTemplate",
            permission: "write",
        },
    },
    {
        href: "#/admin/terms/",
        title: "Terms",
        icon: faCalendarCheck,
        permission: {
            table: "Term",
            permission: "write",
        },
    },
    {
        href: "#/admin/warranty-lengths",
        title: "Warranty Lengths",
        icon: faRuler,
        permission: {
            table: "WarrantyLength",
            permission: "write",
        },
    },
    {
        href: "#/admin/warranty-templates",
        title: "Warranty Templates",
        icon: faFileContract,
        permission: {
            table: "WarrantyTemplate",
            permission: "write",
        },
    },
    {
        href: "#/admin/customer-survey-templates",
        title: "Customer Survey Templates",
        icon: faFlipboard,
        permission: {
            table: "CustomerSurveyTemplate",
            permission: "write",
        },
    },
    {
        href:
            "#/admin/warranty-review-templates/" + WARRANTY_REVIEW_TEMPLATE_ID,
        title: "Warranty Review Templates",
        icon: faFlipboard,
        permission: {
            table: "WarrantyReviewTemplate",
            permission: "write",
        },
    },
    {
        href:
            "#/admin/workplace-inspection/" + WORKPLACE_INSPECTION_TEMPLATE_ID,
        title: "Workplace Inspection Template",
        icon: faFlipboard,
        permission: {
            table: "WorkplaceInspectionTemplate",
            permission: "write",
        },
    },
];

export const ProjectSettingsPage = {
    ...PagesPage({
        title: "Projects Settings",
        buttons: BUTTONS,
    }),
    headerComponent: () => {
        return (
            <>
                <Breadcrumb>
                    <Breadcrumb.Item href="#/">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item href="#/admin/">Settings</Breadcrumb.Item>
                    <Breadcrumb.Item active>Projects</Breadcrumb.Item>
                </Breadcrumb>
                <div style={{ flexGrow: 1 }} />
            </>
        );
    },
};
