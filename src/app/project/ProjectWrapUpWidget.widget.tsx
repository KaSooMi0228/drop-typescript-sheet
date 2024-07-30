import {
    faCheck,
    faFileInvoiceDollar,
    faPollH,
    faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { format as formatDate } from "date-fns";
import { every, find, flatMap, some } from "lodash";
import * as React from "react";
import { Button, ListGroup, ListGroupItem, Pagination } from "react-bootstrap";
import {
    fetchRecord,
    useProjectRecordQuery,
    useRecordQuery,
} from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { Link } from "../../clay/link";
import {
    PaginatedWidgetAction,
    PaginatedWidgetState,
    TAB_STYLE,
} from "../../clay/paginated-widget";
import { propCheck } from "../../clay/propCheck";
import {
    QuickCacheApi,
    useQuickAllRecords,
    useQuickCache,
    useQuickRecord,
} from "../../clay/quick-cache";
import { UserPermissions } from "../../clay/server/api";
import { newUUID } from "../../clay/uuid";
import {
    RecordContext,
    RecordWidget,
    ValidationError,
    Widget,
    WidgetContext,
    WidgetData,
    WidgetProps,
    WidgetResult,
    WidgetStatus,
} from "../../clay/widgets/index";
import { hasPermission } from "../../permissions";
import { ContactDetail } from "../contact/table";
import { Invoice, INVOICE_META } from "../invoice/table";
import { calcPayoutIsComplete, Payout, PAYOUT_META } from "../payout/table";
import { PayoutWidget } from "../payout/widget";
import { useUser } from "../state";
import { ROLE_CERTIFIED_FOREMAN, User, USER_META } from "../user/table";
import { CompletionSurveyWidget } from "./completion-survey/CompletionSurveyTemplateWidget.widget";
import {
    CompletionSurvey,
    CompletionSurveyTemplate,
    COMPLETION_SURVEY_META,
    COMPLETION_SURVEY_TEMPLATE_ID,
    COMPLETION_SURVEY_TEMPLATE_META,
} from "./completion-survey/table";
import { CustomerSurveyWidget } from "./customer-survey/CustomerSurveyTabWidget.widget";
import { CustomerSurvey, CUSTOMER_SURVEY_META } from "./customer-survey/table";
import { DetailSheet, DETAIL_SHEET_META } from "./detail-sheet/table";
import {
    DATED_EMBEDDED,
    EmbeddedRecordState,
    EmbeddedRecordStateAction,
    EmbeddedRecordStateOptions,
    embededRecordStateReduce,
    initializeEmbeddedRecordState,
    InternalStateOptions,
    useEmbeddedRecordState,
    useInternalRecordState,
} from "./embedded-records";
import { FinishScheduleWidget } from "./FinishScheduleMainWidget.widget";
import { FinishScheduleSkipWidget } from "./FinishScheduleSkipMainWidget.widget";
import { Datum, Summary } from "./project-items";
import { ProjectWarrantyWidget } from "./project-warranty";
import { ReactContext as ProjectWidgetReactContext } from "./ProjectWidget.widget";
import { computeScore } from "./site-visit-report/table";
import { constructPayout, Project, PROJECT_META } from "./table";
import { WarrantySkipWidget } from "./WarrantySkipMainWidget.widget";
import { QUOTATION_META, Quotation } from "../quotation/table";

export type Data = Project;

const Embedded = {
    payout: PayoutWidget,
    survey: CompletionSurveyWidget,
    customerSurvey: CustomerSurveyWidget,
};

const Internal = {
    finishSchedule: FinishScheduleWidget,
    finishScheduleSkip: FinishScheduleSkipWidget,
    warrantySkip: WarrantySkipWidget,
    projectWarranty: ProjectWarrantyWidget,
};

function actionUpdateContacts(
    state: State,
    data: Data,
    billingContacts: ContactDetail[],
    contacts: ContactDetail[]
) {
    return {
        state,
        data: {
            ...data,
            contacts,
            billingContacts,
        },
    };
}

function ShowPayoutSummary(props: { payout: Payout }) {
    const user = useQuickRecord(USER_META, props.payout.user);
    const cache = useQuickCache();

    return (
        <>
            <Summary
                icon={faFileInvoiceDollar}
                valid={PayoutWidget.validate(props.payout, cache).length == 0}
                finalized={props.payout.date !== null}
                title="Payout"
            >
                <Datum
                    label="Date"
                    value={props.payout.date}
                    format={(x) => formatDate(x, "Y-M-d p")}
                />
                <Datum
                    label="Number"
                    value={props.payout.number}
                    format={(x) => x.toString()}
                />
            </Summary>
        </>
    );
}

function ShowCompletionSurveySummary(props: { survey: CompletionSurvey }) {
    const certifiedForeman = useQuickRecord(
        USER_META,
        props.survey.certifiedForeman
    );
    const cache = useQuickCache();

    return (
        <>
            <Summary
                icon={faPollH}
                valid={
                    CompletionSurveyWidget.validate(props.survey, cache)
                        .length == 0
                }
                finalized={props.survey.date !== null}
                title="Payout Survey"
            >
                <Datum
                    label="Date"
                    value={props.survey.date}
                    format={(x) => formatDate(x, "Y-M-d p")}
                />
                <Datum
                    label="CF"
                    value={certifiedForeman}
                    format={(x) => x.name}
                />
            </Summary>
        </>
    );
}

function ShowCustomerSurveySummary(props: { survey: CustomerSurvey }) {
    const cache = useQuickCache();

    const score = computeScore(props.survey);

    const rfiQuestion = props.survey.sections
        .flatMap((section) => section.questions)
        .filter((question) => question.answers.length == 10)[0];
    const rfiAnswer =
        rfiQuestion &&
        find(
            rfiQuestion.answers,
            (answer) => answer.id.uuid === rfiQuestion.selectedAnswer
        );

    return (
        <>
            <Summary
                icon={faPollH}
                valid={
                    CustomerSurveyWidget.validate(props.survey, cache).length ==
                    0
                }
                finalized={props.survey.date !== null}
                title="Customer Survey"
            >
                <div>
                    <Datum
                        label="Completed By"
                        value={props.survey.contact.name}
                        format={(x) => x}
                    />
                </div>
                <div>
                    <Datum
                        label="Date Requested"
                        value={props.survey.addedDateTime}
                        format={(x) => formatDate(x, "Y-M-d p")}
                    />

                    <Datum
                        label="Date Completed"
                        value={props.survey.date}
                        format={(x) => formatDate(x, "Y-M-d p")}
                    />
                </div>
                <div>
                    <Datum
                        label="Overall Score"
                        value={score.points.dividedBy(score.total)}
                        format={(x) => x.times(100).round() + "%"}
                    />
                    <Datum
                        label="RFI"
                        value={rfiAnswer?.name}
                        format={(x) => x}
                    />
                </div>
            </Summary>
        </>
    );
}

function maybeSingle<T>(items: T[]): T | null {
    if (items.length == 1) {
        return items[0];
    } else {
        return null;
    }
}

function startFinishSchedule(
    project: Project,
    invoices: Invoice[],
    detailSheets: DetailSheet[]
): Project {
    const lastInvoice = invoices[invoices.length - 1];

    if (
        project.finishScheduleDate ||
        project.finishScheduleScopeOfWork != "" ||
        project.finishScheduleLines.length > 0
    ) {
        return project;
    }

    return {
        ...project,
        finishScheduleScopeOfWork: `<ul>${lastInvoice.options
            .map((option) => `<li>${option.description}</li>`)
            .join("\n")}</ul>`,
        finishScheduleLines: flatMap(detailSheets, (detailSheet) =>
            flatMap(detailSheet.options, (option) =>
                flatMap(option.finishSchedule, (schedule) => ({
                    id: newUUID(),
                    substrate: schedule.name,
                    manufacturer: null,
                    productName: schedule.finishSchedule,
                    productSizeAndBase: "",
                    colourName: schedule.colour,
                    colourFormula: "",
                }))
            )
        ),
    };
}

export function reduce(
    state: State,
    data: Project,
    action: Action,
    context: Context
): WidgetResult<State, Project> {
    switch (action.type) {
        case "START_SURVEY": {
            const newSurvey: CompletionSurvey = {
                sent: false,
                id: newUUID(),
                addedDateTime: null,
                firstDate: null,
                date: null,
                recordVersion: { version: null },
                project: action.project.id.uuid,
                user: action.user.id,
                certifiedForeman: action.certifiedForeman,
                sections: action.template.surveySections.map((section) => ({
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
            };
            return {
                data,
                state: {
                    ...state,
                    survey: initializeEmbeddedRecordState(
                        CompletionSurveyWidget,
                        newSurvey,
                        context,
                        true
                    ),
                },
            };
        }

        case "START_PAYOUT": {
            const newPayout: Payout = constructPayout(action);
            return {
                data,
                state: {
                    ...state,
                    payout: initializeEmbeddedRecordState(
                        PayoutWidget,
                        newPayout,
                        context,
                        true
                    ),
                },
            };
        }

        case "PAYOUT_COMPLETED":
            const processed = data.processedForPayouts.slice();
            if (!some(processed, (x) => x.payout === action.payout_id)) {
                for (let index = 0; index < processed.length; index++) {
                    const item = processed[index];
                    if (!item.payout) {
                        processed[index] = {
                            ...item,
                            payout: action.payout_id,
                        };
                    }
                }
            }

            return {
                data: {
                    ...data,
                    processedForPayouts: processed,
                    completion: action.final
                        ? {
                              user: action.user_id,
                              date: action.date,
                          }
                        : data.completion,
                },
                state,
            };

        case "UNLOCK_PROJECT_WARRANTY": {
            return {
                state,
                data: {
                    ...data,
                    warrantyDate: null,
                    warrantyHistory: [
                        ...data.warrantyHistory,
                        {
                            user: action.user,
                            datetime: new Date(),
                            event: "unlock" as const,
                        },
                    ],
                },
            };
        }
        case "CANCEL_FINISH_SCHEDULE": {
            return {
                data: {
                    ...data,
                    finishScheduleDate: null,
                    finishScheduleNotRequiredDate: null,
                },
                state: state,
            };
        }

        case "CANCEL_WARRANTY": {
            return {
                data: {
                    ...data,
                    warrantyDate: null,
                    warrantyNotRequiredDate: null,
                },
                state: state,
            };
        }

        case "START_FINISH_SCHEDULE": {
            const inner = FinishScheduleWidget.initialize(
                startFinishSchedule(data, action.invoices, action.detailSheets),
                context as any
            );

            return {
                data: inner.data,
                state: {
                    ...state,
                    finishSchedule: inner.state,
                },
            };
        }
        default:
            return baseReduce(state, data, action, context);
    }
}

export type ExtraActions =
    | {
          type: "START_SURVEY";
          user: UserPermissions;
          project: Project;
          template: CompletionSurveyTemplate;
          certifiedForeman: Link<User>;
      }
    | {
          type: "START_PAYOUT";
          user: UserPermissions;
          users: User[];
          project: Project;
          quotation: Quotation | null;
          detailSheets: DetailSheet[];
          invoices: Invoice[];
          payouts: Payout[];
          surveys: CompletionSurvey[];
      }
    | {
          type: "PAYOUT_COMPLETED";
          user_id: string;
          payout_id: Link<Payout>;
          final: boolean;
          date: Date | null;
      }
    | {
          type: "CANCEL_FINISH_SCHEDULE";
      }
    | {
          type: "CANCEL_WARRANTY";
      }
    | {
          type: "START_FINISH_SCHEDULE";
          invoices: Invoice[];
          detailSheets: DetailSheet[];
      }
    | {
          type: "UNLOCK_PROJECT_WARRANTY";
          user: Link<User>;
      };

function StageStatus(props: { done: boolean }) {
    if (props.done) {
        return (
            <FontAwesomeIcon
                icon={faCheck}
                style={{ color: "green", marginRight: "1em" }}
            />
        );
    } else {
        return (
            <FontAwesomeIcon
                icon={faTimes}
                style={{ color: "red", marginRight: "1em" }}
            />
        );
    }
}

function ShowItems() {
    const projectContext = React.useContext(ProjectWidgetReactContext);
    const props = React.useContext(ReactContext)!;
    const user = useUser();

    const detailSheets = useProjectRecordQuery(
        DETAIL_SHEET_META,
        props.data.id.uuid
    );

    const surveys = useRecordQuery(
        COMPLETION_SURVEY_META,
        {
            filters: [
                {
                    column: "project",
                    filter: {
                        equal: props.data.id.uuid,
                    },
                },
            ],
            sorts: ["-date"],
        },
        [props.data.id.uuid],
        hasPermission(user, "CompletionSurvey", "read")
    );

    const customerSurveys = useRecordQuery(
        CUSTOMER_SURVEY_META,
        {
            filters: [
                {
                    column: "project",
                    filter: {
                        equal: props.data.id.uuid,
                    },
                },
            ],
            sorts: ["-addedDateTime"],
        },
        [props.data.id.uuid],
        hasPermission(user, "CustomerSurvey", "read")
    );

    const payouts = useRecordQuery(
        PAYOUT_META,
        {
            filters: [
                {
                    column: "project",
                    filter: {
                        equal: props.data.id.uuid,
                    },
                },
            ],
            sorts: ["-date"],
        },
        [props.data.id.uuid],
        hasPermission(user, "Payout", "read")
    );

    const dispatch = props.dispatch;

    const invoices = useProjectRecordQuery(INVOICE_META, props.data.id.uuid);

    const paidOut =
        some(payouts, calcPayoutIsComplete) &&
        every(
            invoices,
            (invoice) =>
                invoice.date == null ||
                some(
                    payouts,
                    (payout) => payout.date && payout.date > invoice!.date!
                )
        );

    const users = useQuickAllRecords(USER_META) || [];

    const quotation = useQuickRecord(QUOTATION_META, props.data.selectedQuotation)

    const onClickNew = React.useCallback(() => {
        if (!payouts || !detailSheets || !invoices || !surveys || quotation === undefined) {
            return;
        }
        dispatch({
            type: "START_PAYOUT",
            user: user,
            users,
            project: props.data,
            payouts,
            quotation,
            detailSheets,
            invoices,
            surveys,
        });
    }, [user, users, dispatch, props.data, payouts, invoices, detailSheets]);

    const quickCache = useQuickCache();

    const allValid =
        payouts &&
        every(
            payouts.map(
                (payout) =>
                    PayoutWidget.validate(payout, quickCache).length == 0
            )
        );

    const someCfsReady = some(
        props.data.personnel.filter(
            (entry) => entry.role == ROLE_CERTIFIED_FOREMAN
        ),
        (entry) =>
            !quickCache.get(USER_META, entry.user)?.postProjectSurvey ||
            find(
                surveys,
                (survey) =>
                    survey.certifiedForeman === entry.user &&
                    survey.date != null
            )
    );

    const completionSurveyTemplate = useQuickRecord(
        COMPLETION_SURVEY_TEMPLATE_META,
        COMPLETION_SURVEY_TEMPLATE_ID
    );

    return (
        <ListGroup>
            <ListGroupItem
                style={{
                    display: "flex",
                }}
            >
                <div style={{ width: "100%" }}>
                    <StageStatus
                        done={
                            props.data.finishScheduleDate !== null ||
                            props.data.finishScheduleNotRequiredDate !== null
                        }
                    />
                    Finish Schedule
                </div>

                {(props.data.finishScheduleDate === null ||
                    props.data.finishScheduleNotRequiredDate !== null) && (
                    <Button
                        style={{
                            marginLeft: "auto",
                        }}
                        disabled={!invoices || invoices.length == 0}
                        onClick={() =>
                            props.dispatch({
                                type: "OPEN_FINISH_SCHEDULE_SKIP",
                            })
                        }
                    >
                        Not Required
                    </Button>
                )}
                {(props.data.finishScheduleDate !== null ||
                    props.data.finishScheduleNotRequiredDate === null) && (
                    <Button
                        style={{
                            marginLeft: "1em",
                        }}
                        disabled={
                            !invoices || !detailSheets || invoices.length == 0
                        }
                        onClick={() =>
                            invoices &&
                            detailSheets &&
                            props.dispatch({
                                type: "START_FINISH_SCHEDULE",
                                invoices,
                                detailSheets,
                            })
                        }
                    >
                        Open
                    </Button>
                )}

                {(props.data.finishScheduleDate !== null ||
                    props.data.finishScheduleNotRequiredDate !== null) &&
                    hasPermission(
                        user,
                        "Project",
                        "cancel-finish-schedule"
                    ) && (
                        <Button
                            variant="danger"
                            style={{
                                marginLeft: "1em",
                            }}
                            onClick={() =>
                                props.dispatch({
                                    type: "CANCEL_FINISH_SCHEDULE",
                                })
                            }
                        >
                            Cancel Finish Schedule
                        </Button>
                    )}
            </ListGroupItem>
            <ListGroupItem
                style={{
                    display: "flex",
                }}
            >
                <div style={{ width: "100%" }}>
                    <StageStatus
                        done={
                            props.data.warrantyDate !== null ||
                            props.data.warrantyNotRequiredDate !== null
                        }
                    />
                    Project Warranty
                </div>
                {(props.data.warrantyDate == null ||
                    props.data.warrantyNotRequiredDate !== null) && (
                    <Button
                        style={{
                            marginLeft: "auto",
                        }}
                        disabled={!invoices || invoices.length == 0}
                        onClick={() =>
                            props.dispatch({
                                type: "OPEN_WARRANTY_SKIP",
                            })
                        }
                    >
                        Not Required
                    </Button>
                )}
                {(props.data.warrantyDate !== null ||
                    props.data.warrantyNotRequiredDate === null) && (
                    <Button
                        style={{
                            marginLeft: "1em",
                        }}
                        onClick={() =>
                            props.dispatch({
                                type: "OPEN_PROJECT_WARRANTY",
                            })
                        }
                    >
                        {props.data.warrantyDate === null
                            ? props.data.warranties.length === 0
                                ? "Create"
                                : "Resume"
                            : "View"}
                    </Button>
                )}
                {(props.data.warrantyDate !== null ||
                    props.data.warrantyNotRequiredDate !== null) &&
                    hasPermission(user, "Project", "cancel-warranty") && (
                        <Button
                            variant="danger"
                            style={{
                                marginLeft: "1em",
                            }}
                            onClick={() =>
                                props.dispatch({
                                    type: "CANCEL_WARRANTY",
                                })
                            }
                        >
                            Cancel Warranty
                        </Button>
                    )}
            </ListGroupItem>
            {customerSurveys &&
                customerSurveys.map((survey) => (
                    <ListGroupItem
                        key={survey.id.uuid}
                        style={{
                            display: "flex",
                        }}
                    >
                        <div style={{ width: "100%" }}>
                            <ShowCustomerSurveySummary survey={survey} />
                        </div>

                        <Button
                            style={{
                                marginLeft: "auto",
                            }}
                            onClick={() =>
                                props.dispatch({
                                    type: "OPEN_CUSTOMER_SURVEY",
                                    customerSurvey: survey,
                                })
                            }
                        >
                            Open
                        </Button>
                    </ListGroupItem>
                ))}

            {hasPermission(user, "CustomerSurvey", "new") && (
                <ListGroupItem>
                    <Button
                        style={{}}
                        onClick={() =>
                            projectContext!.dispatch({
                                type: "UPDATE_CUSTOMER_SURVEY_TRIGGERED",
                                value: true,
                            })
                        }
                    >
                        New Customer Survey
                    </Button>
                </ListGroupItem>
            )}
            {surveys &&
                surveys.map((survey) => (
                    <ListGroupItem
                        key={survey.id.uuid}
                        style={{
                            display: "flex",
                        }}
                    >
                        <div style={{ width: "100%" }}>
                            <ShowCompletionSurveySummary survey={survey} />
                        </div>

                        <Button
                            style={{
                                marginLeft: "auto",
                            }}
                            onClick={() =>
                                props.dispatch({
                                    type: "OPEN_SURVEY",
                                    survey,
                                })
                            }
                        >
                            Open
                        </Button>
                    </ListGroupItem>
                ))}
            {hasPermission(user, "CompletionSurvey", "write") &&
                completionSurveyTemplate &&
                props.data.personnel
                    .filter((entry) => entry.role === ROLE_CERTIFIED_FOREMAN)
                    .map((entry) => quickCache.get(USER_META, entry.user))
                    .filter(
                        (user) =>
                            user?.postProjectSurvey &&
                            !find(
                                surveys,
                                (survey) =>
                                    survey.certifiedForeman === user.id.uuid
                            )
                    )
                    .map((cf) => (
                        <ListGroupItem style={{ display: "flex" }}>
                            <StageStatus done={false} />
                            <Button
                                disabled={!allValid}
                                style={{}}
                                onClick={() =>
                                    props.dispatch({
                                        type: "START_SURVEY",
                                        user,
                                        project: props.data,
                                        template: completionSurveyTemplate,
                                        certifiedForeman: cf!.id.uuid,
                                    })
                                }
                            >
                                New Payout Survey for {cf?.name}
                            </Button>
                        </ListGroupItem>
                    ))}
            {payouts &&
                payouts.map((payout) => (
                    <ListGroupItem
                        key={payout.id.uuid}
                        style={{
                            display: "flex",
                        }}
                    >
                        <div style={{ width: "100%" }}>
                            <ShowPayoutSummary payout={payout} />
                        </div>

                        <Button
                            style={{
                                marginLeft: "auto",
                            }}
                            onClick={() =>
                                props.dispatch({
                                    type: "OPEN_PAYOUT",
                                    payout,
                                })
                            }
                        >
                            Open
                        </Button>
                    </ListGroupItem>
                ))}
            {hasPermission(user, "Payout", "new") && !paidOut && (
                <ListGroupItem style={{ display: "flex" }}>
                    <StageStatus done={false} />
                    <Button
                        disabled={
                            !invoices ||
                            !payouts ||
                            !detailSheets ||
                            !allValid ||
                            paidOut ||
                            !someCfsReady ||
                            !props.status.mutable ||
                            (props.data.finishScheduleDate === null &&
                                props.data.finishScheduleNotRequiredDate ===
                                    null)
                        }
                        style={{}}
                        onClick={onClickNew}
                    >
                        New Payout
                    </Button>
                </ListGroupItem>
            )}
        </ListGroup>
    );
}

function Component(props: Props) {
    const user = useUser();
    const detailSheets = useProjectRecordQuery(
        DETAIL_SHEET_META,
        props.data.id.uuid
    );

    return (
        <>
            <EmbeddedRecords
                mainTabLabel="Wrap Up"
                survey={{
                    ...DATED_EMBEDDED,
                    extra: props.data,
                    generateRequests: () => [],
                }}
                finishSchedule={{}}
                warrantySkip={{}}
                finishScheduleSkip={{}}
                customerSurvey={{
                    ...DATED_EMBEDDED,
                    extra: props.data,
                    generateRequests: () => [
                        {
                            template: "customerSurvey",
                        },
                    ],
                }}
                payout={{
                    ...DATED_EMBEDDED,
                    process: (detailSheet: Payout, cache, detail, user_id) => ({
                        ...DATED_EMBEDDED.process(detailSheet, cache, detail),
                        addedToAccountingSoftware:
                            detail === "final"
                                ? {
                                      user:
                                          detailSheet.addedToAccountingSoftware
                                              .user || user_id,
                                      date:
                                          detailSheet.addedToAccountingSoftware
                                              .date || new Date(),
                                  }
                                : detailSheet.addedToAccountingSoftware,
                    }),
                    extra: props.data,
                    generateRequests: (payout, _, detail) =>
                        detail === "final"
                            ? payout.certifiedForemen.map((entry) => ({
                                  template: "certifiedForemanPayout",
                                  parameters: [entry.certifiedForeman!],
                              }))
                            : [
                                  {
                                      template: "payout",
                                  },
                              ],
                    preSave: (payout, detail, user_id) => {
                        props.dispatch({
                            type: "PAYOUT_COMPLETED",
                            user_id: user_id,
                            final:
                                detail == "final" &&
                                calcPayoutIsComplete(payout),
                            payout_id: payout.id.uuid,
                            date: payout.date,
                        });
                    },
                }}
                projectWarranty={{
                    locked: props.data.warrantyDate !== null,
                    unlockAction: () => {
                        props.dispatch({
                            type: "UNLOCK_PROJECT_WARRANTY",
                            user: user.id,
                        });
                    },
                    extra: detailSheets,
                }}
            >
                <ShowItems />
            </EmbeddedRecords>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Embedded.payout> &
    WidgetContext<typeof Embedded.survey> &
    WidgetContext<typeof Embedded.customerSurvey> &
    WidgetContext<typeof Internal.finishSchedule> &
    WidgetContext<typeof Internal.finishScheduleSkip> &
    WidgetContext<typeof Internal.warrantySkip> &
    WidgetContext<typeof Internal.projectWarranty>;
type ExtraProps = {};
type BaseState = {
    payout: EmbeddedRecordState<WidgetData<typeof Embedded.payout>>;
    survey: EmbeddedRecordState<WidgetData<typeof Embedded.survey>>;
    customerSurvey: EmbeddedRecordState<
        WidgetData<typeof Embedded.customerSurvey>
    >;
    finishSchedule: PaginatedWidgetState<
        WidgetData<typeof Internal.finishSchedule>,
        {}
    > | null;
    finishScheduleSkip: PaginatedWidgetState<
        WidgetData<typeof Internal.finishScheduleSkip>,
        {}
    > | null;
    warrantySkip: PaginatedWidgetState<
        WidgetData<typeof Internal.warrantySkip>,
        {}
    > | null;
    projectWarranty: PaginatedWidgetState<
        WidgetData<typeof Internal.projectWarranty>,
        {}
    > | null;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "PAYOUT";
          action: EmbeddedRecordStateAction<WidgetData<typeof Embedded.payout>>;
      }
    | { type: "OPEN_PAYOUT"; payout: WidgetData<typeof Embedded.payout> }
    | {
          type: "SURVEY";
          action: EmbeddedRecordStateAction<WidgetData<typeof Embedded.survey>>;
      }
    | { type: "OPEN_SURVEY"; survey: WidgetData<typeof Embedded.survey> }
    | {
          type: "CUSTOMER_SURVEY";
          action: EmbeddedRecordStateAction<
              WidgetData<typeof Embedded.customerSurvey>
          >;
      }
    | {
          type: "OPEN_CUSTOMER_SURVEY";
          customerSurvey: WidgetData<typeof Embedded.customerSurvey>;
      }
    | {
          type: "FINISH_SCHEDULE";
          action: PaginatedWidgetAction<
              WidgetData<typeof Internal.finishSchedule>
          >;
      }
    | { type: "OPEN_FINISH_SCHEDULE" }
    | {
          type: "FINISH_SCHEDULE_SKIP";
          action: PaginatedWidgetAction<
              WidgetData<typeof Internal.finishScheduleSkip>
          >;
      }
    | { type: "OPEN_FINISH_SCHEDULE_SKIP" }
    | {
          type: "WARRANTY_SKIP";
          action: PaginatedWidgetAction<
              WidgetData<typeof Internal.warrantySkip>
          >;
      }
    | { type: "OPEN_WARRANTY_SKIP" }
    | {
          type: "PROJECT_WARRANTY";
          action: PaginatedWidgetAction<
              WidgetData<typeof Internal.projectWarranty>
          >;
      }
    | { type: "OPEN_PROJECT_WARRANTY" }
    | { type: "RESET" }
    | {
          type: "UPDATE_CONTACTS";
          billingContacts: ContactDetail[];
          contacts: ContactDetail[];
      };

export type Action = ExtraActions | BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
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
        case "PAYOUT": {
            const inner = embededRecordStateReduce(
                Embedded.payout,
                state.payout,
                action.action,
                context
            );
            return {
                state: { ...state, payout: inner },
                data: data,
            };
        }
        case "OPEN_PAYOUT": {
            return {
                state: {
                    ...state,
                    payout: initializeEmbeddedRecordState(
                        Embedded.payout,
                        action.payout,
                        context,
                        false
                    ),
                },
                data,
            };
        }
        case "SURVEY": {
            const inner = embededRecordStateReduce(
                Embedded.survey,
                state.survey,
                action.action,
                context
            );
            return {
                state: { ...state, survey: inner },
                data: data,
            };
        }
        case "OPEN_SURVEY": {
            return {
                state: {
                    ...state,
                    survey: initializeEmbeddedRecordState(
                        Embedded.survey,
                        action.survey,
                        context,
                        false
                    ),
                },
                data,
            };
        }
        case "CUSTOMER_SURVEY": {
            const inner = embededRecordStateReduce(
                Embedded.customerSurvey,
                state.customerSurvey,
                action.action,
                context
            );
            return {
                state: { ...state, customerSurvey: inner },
                data: data,
            };
        }
        case "OPEN_CUSTOMER_SURVEY": {
            return {
                state: {
                    ...state,
                    customerSurvey: initializeEmbeddedRecordState(
                        Embedded.customerSurvey,
                        action.customerSurvey,
                        context,
                        false
                    ),
                },
                data,
            };
        }
        case "FINISH_SCHEDULE": {
            const inner = Internal.finishSchedule.reduce(
                state.finishSchedule!,
                data,
                action.action,
                context
            );
            return {
                state: { ...state, finishSchedule: inner.state },
                data: inner.data,
            };
        }
        case "OPEN_FINISH_SCHEDULE": {
            const inner = Internal.finishSchedule.initialize(data, context);
            return {
                state: { ...state, finishSchedule: inner.state },
                data: inner.data,
            };
        }
        case "FINISH_SCHEDULE_SKIP": {
            const inner = Internal.finishScheduleSkip.reduce(
                state.finishScheduleSkip!,
                data,
                action.action,
                context
            );
            return {
                state: { ...state, finishScheduleSkip: inner.state },
                data: inner.data,
            };
        }
        case "OPEN_FINISH_SCHEDULE_SKIP": {
            const inner = Internal.finishScheduleSkip.initialize(data, context);
            return {
                state: { ...state, finishScheduleSkip: inner.state },
                data: inner.data,
            };
        }
        case "WARRANTY_SKIP": {
            const inner = Internal.warrantySkip.reduce(
                state.warrantySkip!,
                data,
                action.action,
                context
            );
            return {
                state: { ...state, warrantySkip: inner.state },
                data: inner.data,
            };
        }
        case "OPEN_WARRANTY_SKIP": {
            const inner = Internal.warrantySkip.initialize(data, context);
            return {
                state: { ...state, warrantySkip: inner.state },
                data: inner.data,
            };
        }
        case "PROJECT_WARRANTY": {
            const inner = Internal.projectWarranty.reduce(
                state.projectWarranty!,
                data,
                action.action,
                context
            );
            return {
                state: { ...state, projectWarranty: inner.state },
                data: inner.data,
            };
        }
        case "OPEN_PROJECT_WARRANTY": {
            const inner = Internal.projectWarranty.initialize(data, context);
            return {
                state: { ...state, projectWarranty: inner.state },
                data: inner.data,
            };
        }
        case "RESET": {
            return {
                state: {
                    ...state,
                    payout: null,
                    survey: null,
                    customerSurvey: null,
                    finishSchedule: null,
                    finishScheduleSkip: null,
                    warrantySkip: null,
                    projectWarranty: null,
                },
                data,
            };
        }
        case "UPDATE_CONTACTS":
            return actionUpdateContacts(
                state,
                data,
                action.billingContacts,
                action.contacts
            );
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
export const widgets: Widgets = {};
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
        let payoutState;
        {
            const inner = null;
            payoutState = inner;
            data = data;
        }
        let surveyState;
        {
            const inner = null;
            surveyState = inner;
            data = data;
        }
        let customerSurveyState;
        {
            const inner = null;
            customerSurveyState = inner;
            data = data;
        }
        let finishScheduleState;
        {
            const inner = { state: null, data };
            finishScheduleState = inner.state;
            data = inner.data;
        }
        let finishScheduleSkipState;
        {
            const inner = { state: null, data };
            finishScheduleSkipState = inner.state;
            data = inner.data;
        }
        let warrantySkipState;
        {
            const inner = { state: null, data };
            warrantySkipState = inner.state;
            data = inner.data;
        }
        let projectWarrantyState;
        {
            const inner = { state: null, data };
            projectWarrantyState = inner.state;
            data = inner.data;
        }
        let state = {
            initialParameters: parameters,
            payout: payoutState,
            survey: surveyState,
            customerSurvey: customerSurveyState,
            finishSchedule: finishScheduleState,
            finishScheduleSkip: finishScheduleSkipState,
            warrantySkip: warrantySkipState,
            projectWarranty: projectWarrantyState,
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
                    case "payout":
                        fetchRecord(
                            Embedded.payout.dataMeta,
                            props.state.initialParameters[1]
                        ).then(
                            (record) =>
                                record &&
                                props.dispatch({
                                    type: "OPEN_PAYOUT",
                                    payout: record,
                                })
                        );
                        break;
                    case "survey":
                        fetchRecord(
                            Embedded.survey.dataMeta,
                            props.state.initialParameters[1]
                        ).then(
                            (record) =>
                                record &&
                                props.dispatch({
                                    type: "OPEN_SURVEY",
                                    survey: record,
                                })
                        );
                        break;
                    case "customerSurvey":
                        fetchRecord(
                            Embedded.customerSurvey.dataMeta,
                            props.state.initialParameters[1]
                        ).then(
                            (record) =>
                                record &&
                                props.dispatch({
                                    type: "OPEN_CUSTOMER_SURVEY",
                                    customerSurvey: record,
                                })
                        );
                        break;
                    case "finishSchedule":
                        props.dispatch({ type: "OPEN_FINISH_SCHEDULE" });
                        break;
                    case "finishScheduleSkip":
                        props.dispatch({ type: "OPEN_FINISH_SCHEDULE_SKIP" });
                        break;
                    case "warrantySkip":
                        props.dispatch({ type: "OPEN_WARRANTY_SKIP" });
                        break;
                    case "projectWarranty":
                        props.dispatch({ type: "OPEN_PROJECT_WARRANTY" });
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
        if (state.payout) {
            return ["payout", state.payout.data.id.uuid];
        }
        if (state.survey) {
            return ["survey", state.survey.data.id.uuid];
        }
        if (state.customerSurvey) {
            return ["customerSurvey", state.customerSurvey.data.id.uuid];
        }
        if (state.finishSchedule) {
            return ["finishSchedule"];
        }
        if (state.finishScheduleSkip) {
            return ["finishScheduleSkip"];
        }
        if (state.warrantySkip) {
            return ["warrantySkip"];
        }
        if (state.projectWarranty) {
            return ["projectWarranty"];
        }
        return [];
    },
};
export default Widget;
type Widgets = {};
function EmbeddedRecords(props: {
    payout: EmbeddedRecordStateOptions<WidgetData<typeof Embedded.payout>>;
    survey: EmbeddedRecordStateOptions<WidgetData<typeof Embedded.survey>>;
    customerSurvey: EmbeddedRecordStateOptions<
        WidgetData<typeof Embedded.customerSurvey>
    >;
    finishSchedule: InternalStateOptions;
    finishScheduleSkip: InternalStateOptions;
    warrantySkip: InternalStateOptions;
    projectWarranty: InternalStateOptions;
    children: React.ReactNode;
    mainTabLabel: string;
    extraTabWidget?: React.ReactNode;
}) {
    const context = React.useContext(ReactContext)!;
    const payoutDispatch = React.useCallback(
        (
            action: EmbeddedRecordStateAction<
                WidgetData<typeof Embedded.payout>
            >
        ) => {
            context.dispatch({ type: "PAYOUT", action });
        },
        [context.dispatch]
    );
    const payout = useEmbeddedRecordState(
        Embedded.payout,

        context.state.payout,
        payoutDispatch,
        context.status,
        props.payout
    );
    const surveyDispatch = React.useCallback(
        (
            action: EmbeddedRecordStateAction<
                WidgetData<typeof Embedded.survey>
            >
        ) => {
            context.dispatch({ type: "SURVEY", action });
        },
        [context.dispatch]
    );
    const survey = useEmbeddedRecordState(
        Embedded.survey,

        context.state.survey,
        surveyDispatch,
        context.status,
        props.survey
    );
    const customerSurveyDispatch = React.useCallback(
        (
            action: EmbeddedRecordStateAction<
                WidgetData<typeof Embedded.customerSurvey>
            >
        ) => {
            context.dispatch({ type: "CUSTOMER_SURVEY", action });
        },
        [context.dispatch]
    );
    const customerSurvey = useEmbeddedRecordState(
        Embedded.customerSurvey,

        context.state.customerSurvey,
        customerSurveyDispatch,
        context.status,
        props.customerSurvey
    );
    const finishScheduleDispatch = React.useCallback(
        (
            action: PaginatedWidgetAction<
                WidgetData<typeof Internal.finishSchedule>
            >
        ) => {
            context.dispatch({ type: "FINISH_SCHEDULE", action });
        },
        [context.dispatch]
    );
    const finishSchedule = useInternalRecordState(
        Internal.finishSchedule,
        context.data,
        context.state.finishSchedule,
        finishScheduleDispatch,
        context.status,
        props.finishSchedule
    );
    const finishScheduleSkipDispatch = React.useCallback(
        (
            action: PaginatedWidgetAction<
                WidgetData<typeof Internal.finishScheduleSkip>
            >
        ) => {
            context.dispatch({ type: "FINISH_SCHEDULE_SKIP", action });
        },
        [context.dispatch]
    );
    const finishScheduleSkip = useInternalRecordState(
        Internal.finishScheduleSkip,
        context.data,
        context.state.finishScheduleSkip,
        finishScheduleSkipDispatch,
        context.status,
        props.finishScheduleSkip
    );
    const warrantySkipDispatch = React.useCallback(
        (
            action: PaginatedWidgetAction<
                WidgetData<typeof Internal.warrantySkip>
            >
        ) => {
            context.dispatch({ type: "WARRANTY_SKIP", action });
        },
        [context.dispatch]
    );
    const warrantySkip = useInternalRecordState(
        Internal.warrantySkip,
        context.data,
        context.state.warrantySkip,
        warrantySkipDispatch,
        context.status,
        props.warrantySkip
    );
    const projectWarrantyDispatch = React.useCallback(
        (
            action: PaginatedWidgetAction<
                WidgetData<typeof Internal.projectWarranty>
            >
        ) => {
            context.dispatch({ type: "PROJECT_WARRANTY", action });
        },
        [context.dispatch]
    );
    const projectWarranty = useInternalRecordState(
        Internal.projectWarranty,
        context.data,
        context.state.projectWarranty,
        projectWarrantyDispatch,
        context.status,
        props.projectWarranty
    );
    return (
        <>
            <div {...TAB_STYLE}>
                {payout.mainComponent ||
                    survey.mainComponent ||
                    customerSurvey.mainComponent ||
                    finishSchedule.mainComponent ||
                    finishScheduleSkip.mainComponent ||
                    warrantySkip.mainComponent ||
                    projectWarranty.mainComponent ||
                    props.children}
            </div>
            <Pagination style={{ marginBottom: "0px" }}>
                <Pagination.Item
                    active={
                        !(
                            payout ||
                            survey ||
                            customerSurvey ||
                            finishSchedule ||
                            finishScheduleSkip ||
                            warrantySkip ||
                            projectWarranty
                        )
                    }
                    onClick={() => {
                        context.dispatch({ type: "RESET" });
                    }}
                >
                    {props.mainTabLabel}
                </Pagination.Item>
                {payout.tabs}
                {survey.tabs}
                {customerSurvey.tabs}
                {finishSchedule.tabs}
                {finishScheduleSkip.tabs}
                {warrantySkip.tabs}
                {projectWarranty.tabs}
                {props.extraTabWidget}
            </Pagination>
        </>
    );
}
// END MAGIC -- DO NOT EDIT
