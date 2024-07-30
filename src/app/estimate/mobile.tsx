import * as React from "react";
import { ListGroup, ListGroupItem } from "react-bootstrap";
import { Project } from "ts-morph";
import { useQuery, useRecordQuery } from "../../clay/api";
import { Link } from "../../clay/link";
import { BaseAction, Page } from "../../clay/Page";
import { useQuickRecord } from "../../clay/quick-cache";
import { startTimeAndMaterialsEstimate } from "../project/ProjectEstimatesWidget.widget";
import { SiteVisitReport } from "../project/site-visit-report/table";
import { PROJECT_META } from "../project/table";
import { useUser } from "../state";
import { CONTENT_AREA } from "../styles";
import { USER_META } from "../user/table";
import { EstimateTemplate, ESTIMATE_TEMPLATE_META } from "./templates/table";

type State = {
    id: Link<SiteVisitReport>;
};

type Action = BaseAction;

function MobileProject(props: { project: Link<Project> }) {
    const basicUser = useUser();
    const user = useQuickRecord(USER_META, basicUser.id);
    const project = useQuickRecord(PROJECT_META, props.project);

    const templates = useRecordQuery(
        ESTIMATE_TEMPLATE_META,
        {
            filters: [
                {
                    column: "kind",
                    filter: {
                        equal: "time-and-materials",
                    },
                },
            ],
        },
        []
    );

    const onSelectCategory = React.useCallback(
        async (template: EstimateTemplate) => {
            await startTimeAndMaterialsEstimate(
                template,
                user!,
                project!,
                "Mobile Estimate",
                false
            );
        },
        [project, user, project]
    );

    if (!project || !templates || !user) {
        return <></>;
    } else {
        return (
            <div {...CONTENT_AREA}>
                <ListGroup>
                    {templates.map((template) => (
                        <ListGroupItem
                            action
                            key={template.id.uuid}
                            onClick={onSelectCategory.bind(undefined, template)}
                        >
                            {template.name}
                        </ListGroupItem>
                    ))}
                </ListGroup>
            </div>
        );
    }
}
function SelectProject() {
    let user = useUser();

    const projects =
        useQuery(
            {
                tableName: "Project",
                filters: [
                    {
                        column: "stage",
                        filter: {
                            in: ["New RFQ", "Estimating", "Re-estimating"],
                        },
                    },
                    {
                        column: "personnel.user",
                        filter: {
                            intersects: [user.id],
                        },
                    },
                ],
                columns: ["id", "projectNumber", "siteAddress.lineFormatted"],
            },
            []
        ) || [];

    const [selectedProject, setSelectedProject] =
        React.useState<Link<Project>>(null);

    if (selectedProject) {
        return <MobileProject project={selectedProject} />;
    } else {
        return (
            <div {...CONTENT_AREA}>
                <ListGroup>
                    {projects.map((project) => (
                        <ListGroupItem
                            action
                            key={project[0] as string}
                            onClick={setSelectedProject.bind(
                                undefined,
                                project[0] as string
                            )}
                        >
                            Project {project[1]} - {project[2]}
                        </ListGroupItem>
                    ))}
                </ListGroup>
            </div>
        );
    }
}

const PAGE: Page<State, Action> = {
    initialize() {
        return {
            state: {
                id: null,
                views: {},
            },
            requests: [],
        };
    },
    reduce(state, action, context) {
        switch (action.type) {
            case "PAGE_ACTIVATED":
            case "HEARTBEAT":
                return {
                    state,
                    requests: [],
                };
            case "UPDATE_PARAMETERS":
                return {
                    state: {
                        ...state,
                        id: action.segments[0] || null,
                    },
                    requests: [],
                };
        }
    },
    headerComponent() {
        return <div style={{ flexGrow: 1 }}>Simple Estimate</div>;
    },
    component: React.memo((props) => {
        return <SelectProject />;
    }),
    encodeState(state) {
        return {
            segments: state.id == null ? [] : [state.id],
            parameters: {},
        };
    },
    hasUnsavedChanges() {
        return false;
    },
    title() {
        return "Simple Estimate";
    },
    beforeUnload() {
        return false;
    },
};

export default PAGE;
