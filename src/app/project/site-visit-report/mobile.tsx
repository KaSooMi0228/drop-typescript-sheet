import * as React from "react";
import { ListGroup, ListGroupItem } from "react-bootstrap";
import {
    fetchRecord,
    generateDocument,
    storeRecord,
    useQuery,
    useRecordQuery,
} from "../../../clay/api";
import { Editable, useEditableContext } from "../../../clay/edit-context";
import { Link } from "../../../clay/link";
import { BaseAction, Page } from "../../../clay/Page";
import { useQuickCache, useQuickRecord } from "../../../clay/quick-cache";
import { TableWidgetPage } from "../../../clay/TableWidgetPage";
import { genUUID } from "../../../clay/uuid";
import { RecordContext } from "../../../clay/widgets";
import {
    ProjectDescriptionCategory,
    PROJECT_DESCRIPTION_CATEGORY_META,
} from "../../project-description/table";
import { useUser } from "../../state";
import { CONTENT_AREA } from "../../styles";
import { buildSiteVisitReport } from "../ProjectCertifiedForemenCommunicationWidget.widget";
import {
    calcProjectDescriptionCategories,
    Project,
    PROJECT_META,
} from "../table";
import { SiteVisitReportWidget } from "./SiteVisitReportNotesWidget.widget";
import { SiteVisitReport, SITE_VISIT_REPORT_META } from "./table";

const MobileSiteVisitReportWidget: typeof SiteVisitReportWidget = {
    ...SiteVisitReportWidget,
    component(props) {
        const project = useQuickRecord(PROJECT_META, props.data.project);
        const editContext = useEditableContext();

        if (!project) {
            return <></>;
        } else {
            return (
                <Editable generate={editContext.save}>
                    <RecordContext meta={PROJECT_META} value={project}>
                        <SiteVisitReportWidget.component {...props} />
                    </RecordContext>
                </Editable>
            );
        }
    },
};

export const MobileSiteVisitReportPage = TableWidgetPage({
    meta: MobileSiteVisitReportWidget,
    makeContext: (x) => x,
    title: () => "Site Visit Report",
    autoSave: true,
    disableFinish: true,
    preSave(record) {
        return {
            ...record,
            date: record.date || new Date(),
        };
    },
    async postSave(record) {
        await generateDocument("siteVisitReport", [record.id.uuid], true);
        window.location.hash = "/";
    },
});

type State = {
    id: Link<SiteVisitReport>;
};

type Action = BaseAction;

function MobileProject(props: { project: Link<Project> }) {
    const user = useUser();
    const cache = useQuickCache();
    const project = useQuickRecord(PROJECT_META, props.project);
    const categories = project && calcProjectDescriptionCategories(project);

    const siteVisitReports = useRecordQuery(
        SITE_VISIT_REPORT_META,
        {
            filters: [
                {
                    column: "project",
                    filter: {
                        equal: props.project,
                    },
                },
            ],
            sorts: ["-date"],
        },
        [props.project]
    );

    const onSelectCategory = React.useCallback(
        async (categoryId: Link<ProjectDescriptionCategory>) => {
            const id = genUUID();
            const category = (await fetchRecord(
                PROJECT_DESCRIPTION_CATEGORY_META,
                categoryId!
            ))!;
            const siteVisitReport = {
                ...buildSiteVisitReport({
                    user,
                    project: project!,
                    category,
                    siteVisitReports: siteVisitReports!,
                }),
                mobile: true,
            };
            await storeRecord(
                SITE_VISIT_REPORT_META,
                "mobile",
                siteVisitReport
            );
            window.location.hash =
                "/mobile/site-visit-report-x/" + siteVisitReport.id.uuid;
        },
        [project, user, project, siteVisitReports]
    );

    if (!project || !siteVisitReports) {
        return <></>;
    } else {
        return (
            <div {...CONTENT_AREA}>
                <ListGroup>
                    {categories!.map((category) => (
                        <ListGroupItem
                            action
                            key={category}
                            onClick={onSelectCategory.bind(undefined, category)}
                        >
                            {
                                cache.get(
                                    PROJECT_DESCRIPTION_CATEGORY_META,
                                    category
                                )?.name
                            }
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
                            equal: "Current",
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
        return <div style={{ flexGrow: 1 }}>Site Visit Report</div>;
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
        return "Site Visit Report";
    },
    beforeUnload() {
        return false;
    },
};

export default PAGE;
