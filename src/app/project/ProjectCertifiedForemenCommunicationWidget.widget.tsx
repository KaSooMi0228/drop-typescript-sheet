import {
    faAllergies,
    faClipboardList,
    faProjectDiagram,
} from "@fortawesome/free-solid-svg-icons";
import { format as formatDate } from "date-fns";
import Decimal from "decimal.js";
import { every, find, some } from "lodash";
import * as React from "react";
import {
    Alert,
    Button,
    Dropdown,
    DropdownButton,
    ListGroup,
    ListGroupItem,
    Pagination,
    Tab,
    Tabs,
} from "react-bootstrap";
import { fetchRecord, useRecordQuery } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { TAB_STYLE } from "../../clay/paginated-widget";
import { propCheck } from "../../clay/propCheck";
import {
    QuickCacheApi,
    useQuickCache,
    useQuickRecord,
} from "../../clay/quick-cache";
import { UserPermissions } from "../../clay/server/api";
import { newUUID } from "../../clay/uuid";
import { useQuickAllRecordsSorted } from "../../clay/widgets/dropdown-link-widget";
import { Optional } from "../../clay/widgets/FormField";
import {
    RecordContext,
    RecordWidget,
    subStatus,
    subvalidate,
    ValidationError,
    Widget,
    WidgetAction,
    WidgetContext,
    WidgetData,
    WidgetExtraProps,
    WidgetProps,
    WidgetResult,
    WidgetState,
    WidgetStatus,
} from "../../clay/widgets/index";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { hasPermission } from "../../permissions";
import {
    ProjectDescriptionCategory,
    PROJECT_DESCRIPTION_CATEGORY_META,
} from "../project-description/table";
import { useUser } from "../state";
import {
    ROLE_CERTIFIED_FOREMAN,
    ROLE_PROJECT_MANAGER,
    USER_META,
} from "../user/table";
import { CoreValueNoticeWrapperWidget } from "./core-values/CoreValueNoticeWidget.widget";
import {
    CoreValueNotice,
    CORE_VALUE_NOTICE_CATEGORY_META,
    CORE_VALUE_NOTICE_META,
} from "./core-values/table";
import { DetailSheet, DETAIL_SHEET_META } from "./detail-sheet/table";
import { DetailSheetWidget } from "./detail-sheet/widget";
import {
    DATED_EMBEDDED,
    EmbeddedRecordState,
    EmbeddedRecordStateAction,
    EmbeddedRecordStateOptions,
    embededRecordStateReduce,
    initializeEmbeddedRecordState,
    useEmbeddedRecordState,
} from "./embedded-records";
import { Datum, Summary } from "./project-items";
import { SiteVisitReportWidget } from "./site-visit-report/SiteVisitReportNotesWidget.widget";
import {
    SiteVisitReport,
    SITE_VISIT_REPORT_META,
} from "./site-visit-report/table";
import {
    calcProjectDescriptionCategories,
    Project,
    PROJECT_META,
} from "./table";

export type Data = Project;

export const Embedded = {
    detailSheet: DetailSheetWidget,
    siteVisitReport: SiteVisitReportWidget,
    coreValueNotice: CoreValueNoticeWrapperWidget,
};

export const Fields = {
    name: Optional(TextWidget),
};

function ShowDetailSheetSummary(props: { detailSheet: DetailSheet }) {
    const user = useQuickRecord(USER_META, props.detailSheet.user);
    const cache = useQuickCache();

    return (
        <>
            <Summary
                title="Detail Sheet"
                icon={faProjectDiagram}
                change={props.detailSheet.change}
                valid={
                    DetailSheetWidget.validate(props.detailSheet, cache)
                        .length == 0
                }
                finalized={props.detailSheet.date !== null}
            >
                <Datum
                    label="Description"
                    value={props.detailSheet.schedules
                        .map((schedule) => schedule.description)
                        .join(", ")}
                    format={(x) => x}
                />
                <Datum
                    label="Number"
                    value={
                        props.detailSheet.number?.isZero()
                            ? null
                            : props.detailSheet.number
                    }
                    format={(x) => x.toString()}
                />
                <Datum label="User" value={user} format={(x) => x.name} />
                <Datum
                    label="Added Date"
                    value={props.detailSheet.addedDateTime}
                    format={(x) => formatDate(x, "Y-M-d p")}
                />
                <Datum
                    label="Last Modified"
                    value={props.detailSheet.modifiedDateTime}
                    format={(x) => formatDate(x, "Y-M-d p")}
                />
            </Summary>
        </>
    );
}

function ShowSiteVisitReportSummary(props: {
    siteVisitReport: SiteVisitReport;
}) {
    const user = useQuickRecord(USER_META, props.siteVisitReport.user);
    const cache = useQuickCache();
    return (
        <Summary
            title="Site Visit Report"
            icon={faClipboardList}
            valid={
                SiteVisitReportWidget.validate(props.siteVisitReport, cache)
                    .length == 0
            }
            finalized={props.siteVisitReport.date !== null}
        >
            <Datum label="User" value={user} format={(x) => x.name} />
            <Datum
                label="Date"
                value={props.siteVisitReport.date}
                format={(x) => formatDate(x, "Y-M-d p")}
            />
            <Datum
                label="Last Modified"
                value={props.siteVisitReport.modifiedDateTime}
                format={(x) => formatDate(x, "Y-M-d p")}
            />
        </Summary>
    );
}

function ShowCoreValueNoticeSummary(props: {
    coreValueNotice: CoreValueNotice;
}) {
    const user = useQuickRecord(USER_META, props.coreValueNotice.user);
    const cf = useQuickRecord(
        USER_META,
        props.coreValueNotice.certifiedForeman
    );
    const category = useQuickRecord(
        CORE_VALUE_NOTICE_CATEGORY_META,
        props.coreValueNotice.category
    );
    const type = find(
        category?.types || [],
        (x) => x.id.uuid === props.coreValueNotice.type
    );
    const cache = useQuickCache();
    return (
        <Summary
            title="Notice"
            icon={faAllergies}
            valid={
                CoreValueNoticeWrapperWidget.validate(
                    props.coreValueNotice,
                    cache
                ).length == 0
            }
            finalized={props.coreValueNotice.date !== null}
        >
            <Datum label="User" value={user} format={(x) => x.name} />
            <Datum
                label="Date"
                value={props.coreValueNotice.date}
                format={(x) => formatDate(x, "Y-M-d p")}
            />
            <Datum label="CF" value={cf} format={(x) => x.name} />
            <Datum label="Category" value={category} format={(x) => x.name} />
            <Datum label="Type" value={type} format={(x) => x.name} />
            <Datum
                label="Type"
                value={props.coreValueNotice.custom}
                format={(x) => x}
            />
        </Summary>
    );
}

function maybeSingle<T>(items: T[]): T | null {
    if (items.length == 1) {
        return items[0];
    } else {
        return null;
    }
}

export function reduce(
    state: State,
    data: Project,
    action: Action,
    context: Context
): WidgetResult<State, Project> {
    switch (action.type) {
        case "START_DETAIL_SHEET": {
            const managerPercentage = new Decimal(1).dividedBy(
                new Decimal(
                    action.project.personnel.filter(
                        (entry) => entry.role === ROLE_PROJECT_MANAGER
                    ).length
                )
            );

            const newDetailSheet: DetailSheet = {
                id: newUUID(),
                projectedStartDate: null,
                initialized: false,
                recordVersion: { version: null },
                firstDate: null,
                date: null,
                addedDateTime: null,
                modifiedDateTime: null,
                user: action.user.id,
                project: action.project.id.uuid,
                accessRequirements: [],
                requiredEquipment: [],
                options: [],
                contacts: [],
                scopeOfWork: [],
                contractNotes: [],
                quotations:
                    action.change || !action.project.selectedQuotation
                        ? []
                        : [action.project.selectedQuotation],
                number: action.change
                    ? action.detailSheets
                          .reduce(
                              (current, quotation) =>
                                  Decimal.max(current, quotation.number),
                              new Decimal(0)
                          )
                          .plus(1)
                    : new Decimal(0),
                manager: null,
                managers: data.personnel
                    .filter((entry) => entry.role === ROLE_PROJECT_MANAGER)
                    .map((entry) => ({
                        user: entry.user,
                        percentage: managerPercentage,
                    })),
                certifiedForeman: maybeSingle(
                    data.personnel
                        .filter(
                            (entry) => entry.role === ROLE_CERTIFIED_FOREMAN
                        )
                        .map((entry) => entry.user)
                ),
                schedules: [],
                contingencyItems: [],
                schedulesDividedDescription: false,
                description: {
                    category: null,
                    description: null,
                    custom: "",
                },
                change: action.change,
            };
            return {
                data,
                state: {
                    ...state,
                    detailSheet: initializeEmbeddedRecordState(
                        DetailSheetWidget,
                        newDetailSheet,
                        context,
                        true
                    ),
                },
            };
        }
        case "START_SITE_VISIT_REPORT": {
            const newSiteVisitReport: SiteVisitReport =
                buildSiteVisitReport(action);
            return {
                data,
                state: {
                    ...state,
                    siteVisitReport: initializeEmbeddedRecordState(
                        SiteVisitReportWidget,
                        newSiteVisitReport,
                        context,
                        true
                    ),
                },
            };
        }
        case "START_CORE_VALUE_NOTICE": {
            const newCoreValueNotice: CoreValueNotice = {
                id: newUUID(),
                addedDateTime: null,
                recordVersion: { version: null },
                firstDate: null,
                date: null,
                user: action.user.id,
                project: action.project.id.uuid,
                category: null,
                type: null,
                custom: "",
                certifiedForeman: maybeSingle(
                    data.personnel
                        .filter(
                            (entry) => entry.role === ROLE_CERTIFIED_FOREMAN
                        )
                        .map((entry) => entry.user)
                ),
            };
            return {
                data,
                state: {
                    ...state,
                    coreValueNotice: initializeEmbeddedRecordState(
                        CoreValueNoticeWrapperWidget,
                        newCoreValueNotice,
                        context,
                        true
                    ),
                },
            };
        }
        case "RESET":
            return {
                data,
                state: {
                    ...state,
                    detailSheet: null,
                    siteVisitReport: null,
                    coreValueNotice: null,
                },
            };

        case "GENERATE_DETAIL_SHEET":
            return {
                data: {
                    ...data,
                    projectStartDate: action.detailSheet.projectedStartDate,
                    projectDetailDate: data.projectDetailDate || new Date(),
                },
                state,
            };
        default:
            return baseReduce(state, data, action, context);
    }
}

export type ExtraActions =
    | {
          type: "START_DETAIL_SHEET";
          user: UserPermissions;
          project: Project;
          change: boolean;
          detailSheets: DetailSheet[];
      }
    | {
          type: "START_SITE_VISIT_REPORT";
          user: UserPermissions;
          project: Project;
          category: ProjectDescriptionCategory;
          siteVisitReports: SiteVisitReport[];
      }
    | {
          type: "START_CORE_VALUE_NOTICE";
          user: UserPermissions;
          project: Project;
      }
    | {
          type: "DETAIL_SHEET";
          action: EmbeddedRecordStateAction<DetailSheet>;
      }
    | {
          type: "SITE_VISIT_REPORT";
          action: EmbeddedRecordStateAction<SiteVisitReport>;
      }
    | {
          type: "CORE_VALUE_NOTICE";
          action: EmbeddedRecordStateAction<CoreValueNotice>;
      }
    | {
          type: "RESET";
      }
    | {
          type: "OPEN_DETAIL_SHEET";
          detailSheet: DetailSheet;
      }
    | {
          type: "OPEN_SITE_VISIT_REPORT";
          siteVisitReport: SiteVisitReport;
      }
    | {
          type: "OPEN_CORE_VALUE_NOTICE";
          coreValueNotice: CoreValueNotice;
      }
    | {
          type: "GENERATE_DETAIL_SHEET";
          detailSheet: DetailSheet;
      };
export function buildSiteVisitReport(action: {
    user: UserPermissions;
    project: Project;
    category: ProjectDescriptionCategory;
    siteVisitReports: SiteVisitReport[];
}) {
    const progressToDate = action.siteVisitReports.reduce(
        (value, report) => Decimal.max(value, report.progressToDate),
        new Decimal(0)
    );

    const newSiteVisitReport: SiteVisitReport = {
        id: newUUID(),
        mobile: false,
        firstDate: null,
        date: null,
        recordVersion: { version: null },
        addedDateTime: null,
        modifiedDateTime: null,
        user: action.user.id,
        project: action.project.id.uuid,
        weatherConditions: "",
        progressToDate,
        previousProgressToDate: progressToDate,
        numberOfWorkersOnSite: new Decimal(0),
        contacts: [],
        projectIssuesInformationActionItems: "",
        reportOnWorkPlan: "",
        sections: action.category.surveySections.map((section) => ({
            name: section.name,
            questions: section.questions.map((question) => ({
                id: question.id,
                question: question.question,
                sendToCustomer: question.sendToCustomer,
                controlsSection: question.controlsSection,
                answers: question.answers,
                selectedAnswer: null,
                comment: "",
            })),
        })),
        number: action.siteVisitReports
            .reduce(
                (current, quotation) => Decimal.max(current, quotation.number),
                new Decimal(0)
            )
            .plus(1),
        certifiedForeman: maybeSingle(
            action.project.personnel
                .filter((entry) => entry.role === ROLE_CERTIFIED_FOREMAN)
                .map((entry) => entry.user)
        ),
    };
    return newSiteVisitReport;
}

function ItemsList() {
    const context = React.useContext(ReactContext)!;

    const hasForemen = some(
        context.data.personnel,
        (role) => role.role === ROLE_CERTIFIED_FOREMAN
    );
    const user = useUser();

    const detailSheets = useRecordQuery(
        DETAIL_SHEET_META,
        {
            filters: [
                {
                    column: "project",
                    filter: {
                        equal: context.data.id.uuid,
                    },
                },
            ],
            sorts: ["-number", "-addedDateTime"],
        },
        [context.data.id.uuid],
        hasPermission(user, "DetailSheet", "read")
    );
    console.log("OK", detailSheets);
    const siteVisitReports = useRecordQuery(
        SITE_VISIT_REPORT_META,
        {
            filters: [
                {
                    column: "project",
                    filter: {
                        equal: context.data.id.uuid,
                    },
                },
            ],
            sorts: ["-date"],
        },
        [],
        hasPermission(user, "SiteVisitReport", "read")
    );
    const coreValueNotices = useRecordQuery(
        CORE_VALUE_NOTICE_META,
        {
            filters: [
                {
                    column: "project",
                    filter: {
                        equal: context.data.id.uuid,
                    },
                },
            ],
            sorts: ["-date"],
        },
        [],
        hasPermission(user, "CoreValueNotice", "read")
    );

    const dispatch = context.dispatch;

    const onClickNew = React.useCallback(
        () =>
            detailSheets &&
            dispatch({
                type: "START_DETAIL_SHEET",
                user: user,
                project: context.data,
                change: false,
                detailSheets,
            }),
        [user, dispatch, context.data, detailSheets]
    );
    const onClickNewChange = React.useCallback(
        () =>
            detailSheets &&
            dispatch({
                type: "START_DETAIL_SHEET",
                user: user,
                project: context.data,
                change: true,
                detailSheets,
            }),
        [user, dispatch, context.data, detailSheets]
    );

    const onClickNewCoreValueNotice = React.useCallback(
        () =>
            dispatch({
                type: "START_CORE_VALUE_NOTICE",
                user: user,
                project: context.data,
            }),
        [user, dispatch, context.data]
    );

    const quickCache = useQuickCache();

    const allValid =
        detailSheets &&
        every(
            detailSheets.map(
                (detailSheet) =>
                    DetailSheetWidget.validate(detailSheet, quickCache)
                        .length == 0
            )
        ) &&
        siteVisitReports &&
        every(
            siteVisitReports.map(
                (siteVisitReport) =>
                    SiteVisitReportWidget.validate(siteVisitReport, quickCache)
                        .length == 0
            )
        ) &&
        coreValueNotices &&
        every(
            coreValueNotices.map(
                (siteVisitReport) =>
                    CoreValueNoticeWrapperWidget.validate(
                        siteVisitReport,
                        quickCache
                    ).length == 0
            )
        );

    const categories = calcProjectDescriptionCategories(context.data);
    const projectDescriptionCategories = useQuickAllRecordsSorted(
        PROJECT_DESCRIPTION_CATEGORY_META,
        (category) => category.name
    );

    return (
        <Tabs defaultActiveKey="detailSheets" id="cf-communication-tab">
            {hasPermission(user, "DetailSheet", "read") && (
                <Tab eventKey="detailSheets" title="Detail Sheets">
                    <ListGroup>
                        <ListGroupItem style={{ display: "flex" }}>
                            <Button
                                disabled={!allValid}
                                style={{}}
                                onClick={onClickNew}
                            >
                                New Detail Sheet
                            </Button>
                            <Button
                                disabled={!allValid}
                                style={{
                                    marginLeft: "1em",
                                }}
                                onClick={onClickNewChange}
                            >
                                New Change Order Detail Sheet
                            </Button>
                        </ListGroupItem>

                        {detailSheets &&
                            detailSheets.map((detailSheet) => (
                                <ListGroupItem
                                    key={detailSheet.id.uuid}
                                    style={{
                                        display: "flex",
                                    }}
                                >
                                    <div style={{ width: "100%" }}>
                                        <ShowDetailSheetSummary
                                            detailSheet={detailSheet}
                                        />
                                    </div>

                                    <Button
                                        style={{
                                            marginLeft: "auto",
                                        }}
                                        onClick={() =>
                                            context.dispatch({
                                                type: "OPEN_DETAIL_SHEET",
                                                detailSheet,
                                            })
                                        }
                                    >
                                        Open
                                    </Button>
                                </ListGroupItem>
                            ))}
                    </ListGroup>
                </Tab>
            )}
            {hasPermission(user, "SiteVisitReport", "read") && (
                <Tab eventKey="siteVisitReports" title="Site Visit Reports">
                    <ListGroup>
                        <ListGroupItem>
                            {categories.length == 1 ? (
                                <Button
                                    disabled={!allValid || !siteVisitReports}
                                    style={{
                                        marginLeft: "1em",
                                    }}
                                    onClick={() => {
                                        siteVisitReports &&
                                            context.dispatch({
                                                type: "START_SITE_VISIT_REPORT",
                                                user,
                                                siteVisitReports,
                                                project: context.data,
                                                category: find(
                                                    projectDescriptionCategories,
                                                    (category) =>
                                                        category.id.uuid ===
                                                        categories[0]
                                                )!,
                                            });
                                    }}
                                >
                                    New{" "}
                                    {
                                        find(
                                            projectDescriptionCategories,
                                            (category) =>
                                                category.id.uuid ===
                                                categories[0]
                                        )?.name
                                    }{" "}
                                    Site Visit Report
                                </Button>
                            ) : (
                                <DropdownButton
                                    id="new-site-visit-report"
                                    title="New Site Visit Report"
                                    style={{
                                        marginLeft: "1em",
                                    }}
                                >
                                    {projectDescriptionCategories
                                        .filter(
                                            (x) =>
                                                categories.indexOf(
                                                    x.id.uuid
                                                ) !== -1
                                        )
                                        .map((category) => (
                                            <Dropdown.Item
                                                disabled={
                                                    !allValid ||
                                                    !siteVisitReports
                                                }
                                                onClick={() => {
                                                    siteVisitReports &&
                                                        context.dispatch({
                                                            type: "START_SITE_VISIT_REPORT",
                                                            user,
                                                            project:
                                                                context.data,
                                                            category,
                                                            siteVisitReports,
                                                        });
                                                }}
                                            >
                                                {category.name}
                                            </Dropdown.Item>
                                        ))}
                                </DropdownButton>
                            )}
                        </ListGroupItem>

                        {siteVisitReports &&
                            siteVisitReports.map((siteVisitReport) => (
                                <ListGroupItem
                                    key={siteVisitReport.id.uuid}
                                    style={{
                                        display: "flex",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                        }}
                                    >
                                        <ShowSiteVisitReportSummary
                                            siteVisitReport={siteVisitReport}
                                        />
                                    </div>

                                    <Button
                                        style={{
                                            marginLeft: "auto",
                                        }}
                                        onClick={() =>
                                            context.dispatch({
                                                type: "OPEN_SITE_VISIT_REPORT",
                                                siteVisitReport,
                                            })
                                        }
                                    >
                                        Open
                                    </Button>
                                </ListGroupItem>
                            ))}
                    </ListGroup>
                </Tab>
            )}
            {hasPermission(user, "CoreValueNotice", "read") && (
                <Tab eventKey="coreValueNotice" title="Core Values">
                    <ListGroup>
                        <ListGroupItem>
                            <Button
                                disabled={!allValid}
                                onClick={onClickNewCoreValueNotice}
                                style={{ marginLeft: "1em" }}
                            >
                                New Core Value Celebration / Reminder
                            </Button>
                        </ListGroupItem>
                        {coreValueNotices &&
                            coreValueNotices.map((coreValueNotice) => (
                                <ListGroupItem
                                    key={coreValueNotice.id.uuid}
                                    style={{
                                        display: "flex",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                        }}
                                    >
                                        <ShowCoreValueNoticeSummary
                                            coreValueNotice={coreValueNotice}
                                        />
                                    </div>

                                    <Button
                                        style={{
                                            marginLeft: "auto",
                                        }}
                                        onClick={() =>
                                            context.dispatch({
                                                type: "OPEN_CORE_VALUE_NOTICE",
                                                coreValueNotice,
                                            })
                                        }
                                    >
                                        Open
                                    </Button>
                                </ListGroupItem>
                            ))}
                    </ListGroup>
                </Tab>
            )}
        </Tabs>
    );
}
function Component(props: Props) {
    const hasForemen = some(
        props.data.personnel,
        (role) => role.role === ROLE_CERTIFIED_FOREMAN
    );
    const detailSheetPreSave = React.useCallback(() => {
        if (!props.state.detailSheet!.data.change) {
            props.dispatch({
                type: "GENERATE_DETAIL_SHEET",
                detailSheet: props.state.detailSheet!.data,
            });
        }
    }, [props.state.detailSheet?.data, props.dispatch]);

    return (
        <>
            {!hasForemen && (
                <Alert variant="primary">No CF Assigned to this Project</Alert>
            )}
            <EmbeddedRecords
                detailSheet={{
                    ...DATED_EMBEDDED,
                    extra: props.data,
                    preSave: detailSheetPreSave,
                    generateRequests: (detailSheet) => [
                        {
                            template: "detailSheet",
                            parameters: [detailSheet.change ? "1" : "0"],
                        },
                    ],
                }}
                siteVisitReport={{
                    ...DATED_EMBEDDED,
                    generateRequests: () => [
                        {
                            template: "siteVisitReport",
                        },
                    ],
                }}
                coreValueNotice={{
                    ...DATED_EMBEDDED,
                    generateRequests: (notice, cache) => [
                        {
                            template: "coreValueNotice",
                            parameters: [
                                cache.get(
                                    CORE_VALUE_NOTICE_CATEGORY_META,
                                    notice.category
                                )!.name,
                            ],
                        },
                    ],
                }}
                mainTabLabel="CF Communication"
            >
                <ItemsList />
            </EmbeddedRecords>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Embedded.detailSheet> &
    WidgetContext<typeof Embedded.siteVisitReport> &
    WidgetContext<typeof Embedded.coreValueNotice>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    detailSheet: EmbeddedRecordState<WidgetData<typeof Embedded.detailSheet>>;
    siteVisitReport: EmbeddedRecordState<
        WidgetData<typeof Embedded.siteVisitReport>
    >;
    coreValueNotice: EmbeddedRecordState<
        WidgetData<typeof Embedded.coreValueNotice>
    >;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | {
          type: "DETAIL_SHEET";
          action: EmbeddedRecordStateAction<
              WidgetData<typeof Embedded.detailSheet>
          >;
      }
    | {
          type: "OPEN_DETAIL_SHEET";
          detailSheet: WidgetData<typeof Embedded.detailSheet>;
      }
    | {
          type: "SITE_VISIT_REPORT";
          action: EmbeddedRecordStateAction<
              WidgetData<typeof Embedded.siteVisitReport>
          >;
      }
    | {
          type: "OPEN_SITE_VISIT_REPORT";
          siteVisitReport: WidgetData<typeof Embedded.siteVisitReport>;
      }
    | {
          type: "CORE_VALUE_NOTICE";
          action: EmbeddedRecordStateAction<
              WidgetData<typeof Embedded.coreValueNotice>
          >;
      }
    | {
          type: "OPEN_CORE_VALUE_NOTICE";
          coreValueNotice: WidgetData<typeof Embedded.coreValueNotice>;
      }
    | { type: "RESET" };

export type Action = ExtraActions | BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    return errors;
}
function baseReduce(
    state: State,
    data: Data,
    action: BaseAction,
    context: Context
): WidgetResult<State, Data> {
    let subcontext = context;
    switch (action.type) {
        case "NAME": {
            const inner = Fields.name.reduce(
                state.name,
                data.name,
                action.action,
                subcontext
            );
            return {
                state: { ...state, name: inner.state },
                data: { ...data, name: inner.data },
            };
        }
        case "DETAIL_SHEET": {
            const inner = embededRecordStateReduce(
                Embedded.detailSheet,
                state.detailSheet,
                action.action,
                context
            );
            return {
                state: { ...state, detailSheet: inner },
                data: data,
            };
        }
        case "OPEN_DETAIL_SHEET": {
            return {
                state: {
                    ...state,
                    detailSheet: initializeEmbeddedRecordState(
                        Embedded.detailSheet,
                        action.detailSheet,
                        context,
                        false
                    ),
                },
                data,
            };
        }
        case "SITE_VISIT_REPORT": {
            const inner = embededRecordStateReduce(
                Embedded.siteVisitReport,
                state.siteVisitReport,
                action.action,
                context
            );
            return {
                state: { ...state, siteVisitReport: inner },
                data: data,
            };
        }
        case "OPEN_SITE_VISIT_REPORT": {
            return {
                state: {
                    ...state,
                    siteVisitReport: initializeEmbeddedRecordState(
                        Embedded.siteVisitReport,
                        action.siteVisitReport,
                        context,
                        false
                    ),
                },
                data,
            };
        }
        case "CORE_VALUE_NOTICE": {
            const inner = embededRecordStateReduce(
                Embedded.coreValueNotice,
                state.coreValueNotice,
                action.action,
                context
            );
            return {
                state: { ...state, coreValueNotice: inner },
                data: data,
            };
        }
        case "OPEN_CORE_VALUE_NOTICE": {
            return {
                state: {
                    ...state,
                    coreValueNotice: initializeEmbeddedRecordState(
                        Embedded.coreValueNotice,
                        action.coreValueNotice,
                        context,
                        false
                    ),
                },
                data,
            };
        }
        case "RESET": {
            return {
                state: {
                    ...state,
                    detailSheet: null,
                    siteVisitReport: null,
                    coreValueNotice: null,
                },
                data,
            };
        }
    }
}
export type ReactContextType = {
    state: State;
    data: Data;
    dispatch: (action: Action) => void;
    status: WidgetStatus;
};
export const ReactContext = React.createContext<ReactContextType | undefined>(
    undefined
);
export const widgets: Widgets = {
    name: function (
        props: WidgetExtraProps<typeof Fields.name> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "NAME", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "name", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.name.component
                state={context.state.name}
                data={context.data.name}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Name"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PROJECT_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let nameState;
        {
            const inner = Fields.name.initialize(
                data.name,
                subcontext,
                subparameters.name
            );
            nameState = inner.state;
            data = { ...data, name: inner.data };
        }
        let detailSheetState;
        {
            const inner = null;
            detailSheetState = inner;
            data = data;
        }
        let siteVisitReportState;
        {
            const inner = null;
            siteVisitReportState = inner;
            data = data;
        }
        let coreValueNoticeState;
        {
            const inner = null;
            coreValueNoticeState = inner;
            data = data;
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            detailSheet: detailSheetState,
            siteVisitReport: siteVisitReportState,
            coreValueNotice: coreValueNoticeState,
        };
        return {
            state,
            data,
        };
    },
    validate: baseValidate,
    component: React.memo((props: Props) => {
        React.useEffect(() => {
            if (props.state.initialParameters) {
                switch (props.state.initialParameters[0]) {
                    case "detailSheet":
                        fetchRecord(
                            Embedded.detailSheet.dataMeta,
                            props.state.initialParameters[1]
                        ).then(
                            (record) =>
                                record &&
                                props.dispatch({
                                    type: "OPEN_DETAIL_SHEET",
                                    detailSheet: record,
                                })
                        );
                        break;
                    case "siteVisitReport":
                        fetchRecord(
                            Embedded.siteVisitReport.dataMeta,
                            props.state.initialParameters[1]
                        ).then(
                            (record) =>
                                record &&
                                props.dispatch({
                                    type: "OPEN_SITE_VISIT_REPORT",
                                    siteVisitReport: record,
                                })
                        );
                        break;
                    case "coreValueNotice":
                        fetchRecord(
                            Embedded.coreValueNotice.dataMeta,
                            props.state.initialParameters[1]
                        ).then(
                            (record) =>
                                record &&
                                props.dispatch({
                                    type: "OPEN_CORE_VALUE_NOTICE",
                                    coreValueNotice: record,
                                })
                        );
                        break;
                }
            }
        }, [props.state.initialParameters]);
        return (
            <ReactContext.Provider value={props}>
                <RecordContext meta={PROJECT_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
    encodeState: (state) => {
        if (state.detailSheet) {
            return ["detailSheet", state.detailSheet.data.id.uuid];
        }
        if (state.siteVisitReport) {
            return ["siteVisitReport", state.siteVisitReport.data.id.uuid];
        }
        if (state.coreValueNotice) {
            return ["coreValueNotice", state.coreValueNotice.data.id.uuid];
        }
        return [];
    },
};
export default Widget;
type Widgets = {
    name: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.name>
    >;
};
function EmbeddedRecords(props: {
    detailSheet: EmbeddedRecordStateOptions<
        WidgetData<typeof Embedded.detailSheet>
    >;
    siteVisitReport: EmbeddedRecordStateOptions<
        WidgetData<typeof Embedded.siteVisitReport>
    >;
    coreValueNotice: EmbeddedRecordStateOptions<
        WidgetData<typeof Embedded.coreValueNotice>
    >;
    children: React.ReactNode;
    mainTabLabel: string;
    extraTabWidget?: React.ReactNode;
}) {
    const context = React.useContext(ReactContext)!;
    const detailSheetDispatch = React.useCallback(
        (
            action: EmbeddedRecordStateAction<
                WidgetData<typeof Embedded.detailSheet>
            >
        ) => {
            context.dispatch({ type: "DETAIL_SHEET", action });
        },
        [context.dispatch]
    );
    const detailSheet = useEmbeddedRecordState(
        Embedded.detailSheet,

        context.state.detailSheet,
        detailSheetDispatch,
        context.status,
        props.detailSheet
    );
    const siteVisitReportDispatch = React.useCallback(
        (
            action: EmbeddedRecordStateAction<
                WidgetData<typeof Embedded.siteVisitReport>
            >
        ) => {
            context.dispatch({ type: "SITE_VISIT_REPORT", action });
        },
        [context.dispatch]
    );
    const siteVisitReport = useEmbeddedRecordState(
        Embedded.siteVisitReport,

        context.state.siteVisitReport,
        siteVisitReportDispatch,
        context.status,
        props.siteVisitReport
    );
    const coreValueNoticeDispatch = React.useCallback(
        (
            action: EmbeddedRecordStateAction<
                WidgetData<typeof Embedded.coreValueNotice>
            >
        ) => {
            context.dispatch({ type: "CORE_VALUE_NOTICE", action });
        },
        [context.dispatch]
    );
    const coreValueNotice = useEmbeddedRecordState(
        Embedded.coreValueNotice,

        context.state.coreValueNotice,
        coreValueNoticeDispatch,
        context.status,
        props.coreValueNotice
    );
    return (
        <>
            <div {...TAB_STYLE}>
                {detailSheet.mainComponent ||
                    siteVisitReport.mainComponent ||
                    coreValueNotice.mainComponent ||
                    props.children}
            </div>
            <Pagination style={{ marginBottom: "0px" }}>
                <Pagination.Item
                    active={
                        !(detailSheet || siteVisitReport || coreValueNotice)
                    }
                    onClick={() => {
                        context.dispatch({ type: "RESET" });
                    }}
                >
                    {props.mainTabLabel}
                </Pagination.Item>
                {detailSheet.tabs}
                {siteVisitReport.tabs}
                {coreValueNotice.tabs}
                {props.extraTabWidget}
            </Pagination>
        </>
    );
}
// END MAGIC -- DO NOT EDIT
