import Decimal from "decimal.js";
import { Button } from "react-bootstrap";
import { generateDocument } from "../../clay/api";
import { GridWithEditor } from "../../clay/dataGrid/gridWithEditor";
import { OpenButton } from "../../clay/openButton";
import { hasPermission } from "../../permissions";
import ProjectWidget from "./ProjectWidget.widget";
import { isProjectLocked, Project } from "./table";
import * as React from "react";

export const BrowseProjectPage = GridWithEditor({
    prefix: "#/project",
    newTitle: "New Project",
    meta: ProjectWidget,
    makeContext: (context) => context,
    colorColumn: "color",
    colorAppliedColumn: "stage",
    fallbackSorts: ["projectNumber"],
    initialize(record) {
        if (record.bidBondType === "") {
            return {
                ...record,
                bidBondRequired: true,
                bidBondType: "electronic" as const,
                bidBidAmount: new Decimal("0.1"),
                consentOfSurety: true,
            };
        } else {
            return record;
        }
    },
    title: (record: Project) => {
        return record.siteAddress.line1 + " > Project " + record.projectNumber;
    },
    locked: (project: Project) => {
        return isProjectLocked(project);
    },
    print: async (project, printTemplate, printParameters, sendEmails) => {
        await generateDocument(printTemplate, printParameters, sendEmails);
    },
    postSave(project) {
        if (project.projectNumber) {
            fetch("/server/project-files/" + project.projectNumber, {
                redirect: "manual",
            });
        }
    },
    extraColumns: ["projectNumber"],
    actionCellWidth: 200,
    topActionCell: () => {
        return (
            <OpenButton
                href={"#/project/edit/new"}
                variant="primary"
                size="sm"
                style={{
                    width: "160px",
                    fontSize: "14pt",
                    marginLeft: "auto",
                    marginRight: "auto",
                }}
            >
                Add New Project
            </OpenButton>
        );
    },
    actionCell: ([id, number]) => {
        return (
            <div style={{ textAlign: "center" }}>
                <OpenButton
                    href={"#/project/edit/" + id}
                    variant="primary"
                    size="sm"
                    style={{
                        width: "80px",
                        height: "24px",
                        padding: "0px",
                    }}
                >
                    Dropsheet
                </OpenButton>
                <Button
                    variant="warning"
                    size="sm"
                    onClick={() =>
                        window.open("/server/project-files/" + number)
                    }
                    style={{
                        marginLeft: "2px",
                        width: "84px",
                        height: "24px",
                        padding: "0px",
                    }}
                >
                    SharePoint
                </Button>
            </div>
        );
    },
    disableFinish: true,
    extraFilters: (user) => {
        const filters = [];

        if (!hasPermission(user, "Project", "show-not-assigned-to-me")) {
            const may_views = [];

            may_views.push({
                column: "personnel.user",
                filter: {
                    intersects: [user.id],
                },
            });

            for (const permission of user.permissions) {
                if (permission.startsWith("Project-view-squad-")) {
                    const uuid = permission.substring(
                        "Project-view-squad-".length
                    );
                    may_views.push({
                        column: "personnel.user.squad",
                        filter: {
                            intersects: [uuid],
                        },
                    });
                }
            }

            filters.push({
                or: may_views,
            });
        }

        if (!hasPermission(user, "Project", "show-lost-projects")) {
            filters.push({
                column: "projectLostDate",
                filter: {
                    equal: null,
                },
            });
        }

        if (!hasPermission(user, "Project", "show-awarded-projects")) {
            filters.push({
                column: "projectAwardDate",
                filter: {
                    equal: null,
                },
            });
        }

        if (!hasPermission(user, "Project", "show-quoting-projects")) {
            filters.push({
                or: [
                    {
                        column: "projectLostDate",
                        filter: {
                            not_equal: null,
                        },
                    },
                    {
                        column: "projectAwardDate",
                        filter: {
                            not_equal: null,
                        },
                    },
                ],
            });
        }

        return filters;
    },
});
