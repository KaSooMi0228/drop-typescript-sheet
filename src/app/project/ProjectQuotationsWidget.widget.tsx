import { faFileAlt } from "@fortawesome/free-solid-svg-icons";
import { differenceInHours, format as formatDate, parseISO } from "date-fns";
import Decimal from "decimal.js";
import { css } from "glamor";
import { every, some } from "lodash";
import * as React from "react";
import {
    Accordion,
    Alert,
    Button,
    Card,
    ListGroup,
    ListGroupItem,
    ModalBody,
    ModalTitle,
    Pagination,
    Tab,
    Tabs,
} from "react-bootstrap";
import Modal from "react-modal";
import ReactSwitch from "react-switch";
import {
    doQuery,
    fetchRecord,
    patchRecord,
    storeRecord,
    useIdQuery,
    useRecordQuery,
} from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { useEditableContext } from "../../clay/edit-context";
import { Link } from "../../clay/link";
import { TAB_STYLE } from "../../clay/paginated-widget";
import { propCheck } from "../../clay/propCheck";
import { sumMap } from "../../clay/queryFuncs";
import {
    QuickCacheApi,
    useQuickCache,
    useQuickRecord,
} from "../../clay/quick-cache";
import { UserPermissions } from "../../clay/server/api";
import { newUUID } from "../../clay/uuid";
import { FormWrapper, Optional } from "../../clay/widgets/FormField";
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
import { ESTIMATE_META } from "../estimate/table";
import { TIME_AND_MATERIALS_ESTIMATE_META } from "../estimate/time-and-materials/table";
import { formatMoney } from "../estimate/TotalsWidget.widget";
import { useLocalFieldWidget } from "../inbox/useLocalWidget";
import ModalHeader from "../ModalHeader";
import {
    buildDuplicateQuotation,
    duplicateQuotation,
} from "../quotation/manage";
import {
    resolveCurrentOption,
    resolveOption,
} from "../quotation/resolve-option";
import {
    Quotation,
    QuotationOption,
    quotationSeason,
    QUOTATION_COPY_REQUEST_META,
    QUOTATION_META,
} from "../quotation/table";
import { QuotationType, QUOTATION_TYPE_META } from "../quotation/type/table";
import { QuotationWidget } from "../quotation/widget";
import { RichTextWidget } from "../rich-text-widget";
import { useUser } from "../state";
import { ROLE_ESTIMATOR, User, USER_META } from "../user/table";
import {
    DATED_EMBEDDED,
    EmbeddedRecordState,
    EmbeddedRecordStateAction,
    EmbeddedRecordStateOptions,
    embededRecordStateReduce,
    initializeEmbeddedRecordState,
    useEmbeddedRecordState,
} from "./embedded-records";
import { REVISING_QUOTE_ID } from "./pending-quote-history/table";
import { Datum, Summary } from "./project-items";
import { SelectProject } from "./ProjectEstimatesWidget.widget";
import { ReactContext as ProjectWidgetReactContext } from "./ProjectWidget.widget";
import { useRelatedProjectsFilter } from "./QuoteRequestCustomerWidget.widget";
import { Project, PROJECT_META } from "./table";

export type Data = Project;

export const Embedded = {
    quotation: QuotationWidget,
};

export const Fields = {
    name: Optional(TextWidget),
};

function actionRestimateProject(
    state: State,
    data: Project,
    message: string,
    user: Link<User>
) {
    return {
        data: {
            ...data,
            pendingQuoteHistory: [
                ...data.pendingQuoteHistory,
                {
                    landingLikelihood: REVISING_QUOTE_ID,
                    date: new Date(),
                    followupDate: null,
                    message,
                    user,
                },
            ],
        },
        state,
    };
}

const SWITCH_STYLE = css({
    verticalAlign: "bottom",
});

function ShowSummary(props: {
    quotation: Quotation;
    status: WidgetStatus;
    children?: React.ReactNode;
}) {
    const cache = useQuickCache();
    const currentUser = useUser();
    const user = useQuickRecord(USER_META, props.quotation.user);

    const setActive = React.useCallback(
        (value) => {
            patchRecord(QUOTATION_META, "Quotations", props.quotation.id.uuid, {
                superceded: [value, !value],
            });
        },
        [props.quotation.id.uuid]
    );

    const resolvedOptions = React.useMemo(
        () =>
            props.quotation.options.map((option) => ({
                ...option,
                ...resolveCurrentOption(cache, props.quotation, option),
            })),
        [cache, props.quotation]
    );

    return (
        <Summary
            title={
                props.quotation.number.isZero()
                    ? "Proposal"
                    : `Proposal #${props.quotation.number.toString()}`
            }
            icon={faFileAlt}
            change={props.quotation.change}
            finalized={props.quotation.generated}
            valid={isQuoteValid(props.quotation, cache)}
        >
            {props.children}
            <Accordion>
                <Card>
                    <Card.Header>
                        <Accordion.Toggle
                            as={Button}
                            variant="link"
                            eventKey="0"
                            style={{ textAlign: "left" }}
                        >
                            <Datum
                                label="User"
                                value={user}
                                format={(x) => x.name}
                            />
                            <Datum
                                label="Proposal Date"
                                value={props.quotation.date}
                                format={(x) => formatDate(x, "Y-M-d p")}
                            />
                            <Datum
                                label="Last Modified"
                                value={props.quotation.modifiedDateTime}
                                format={(x) => formatDate(x, "Y-M-d p")}
                            />
                            <Datum
                                label="By"
                                value={props.quotation.modifiedBy}
                                format={(x) => cache.get(USER_META, x)?.name}
                            />
                            <br />
                            {props.quotation.tags.length > 0 && (
                                <Datum
                                    label="Tags"
                                    value={props.quotation.tags}
                                    format={(x) => x.join(", ")}
                                />
                            )}
                        </Accordion.Toggle>
                    </Card.Header>
                    <Accordion.Collapse eventKey="0">
                        <Card.Body>
                            <table>
                                <thead></thead>
                                <tbody>
                                    {resolvedOptions.map((option) => {
                                        return (
                                            <tr>
                                                <td>{option.description}</td>
                                                <td>
                                                    {formatMoney(option.total)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {props.quotation.options.length > 1 && (
                                    <tfoot>
                                        <tr>
                                            <th>Total</th>
                                            <th>
                                                {formatMoney(
                                                    sumMap(
                                                        resolvedOptions,
                                                        (x) => x.total
                                                    )
                                                )}
                                            </th>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>

                            {hasPermission(
                                currentUser,
                                "Quotation",
                                "show-active-season"
                            ) && (
                                <div>
                                    <Datum
                                        label="Proposal Season"
                                        value={quotationSeason(
                                            props.quotation.date
                                        )}
                                        format={(number) => `${number}`}
                                    />

                                    {props.quotation.generated &&
                                        !props.quotation.change && (
                                            <Datum
                                                label="Active"
                                                value={
                                                    !props.quotation.superceded
                                                }
                                                format={(value) => (
                                                    <ReactSwitch
                                                        className={`${SWITCH_STYLE}`}
                                                        checked={value}
                                                        disabled={
                                                            !props.status
                                                                .mutable ||
                                                            !hasPermission(
                                                                currentUser,
                                                                "Quotation",
                                                                "change-active"
                                                            )
                                                        }
                                                        onChange={setActive}
                                                    />
                                                )}
                                            />
                                        )}
                                    {props.quotation.firstDate !== null &&
                                        !props.quotation.generated && (
                                            <Alert variant="danger">
                                                Proposal has been unlocked,
                                                please re-generate before
                                                continuing
                                            </Alert>
                                        )}
                                </div>
                            )}
                        </Card.Body>
                    </Accordion.Collapse>
                </Card>
            </Accordion>
        </Summary>
    );
}

export function reduce(
    state: State,
    data: Project,
    action: Action,
    context: Context
): WidgetResult<State, Project> {
    switch (action.type) {
        case "DUPLICATE_QUOTATION": {
            const newQuotation = buildDuplicateQuotation(
                action.quotation,
                action.user,
                action.project,
                action.quotations
            );
            return {
                data,
                state: {
                    ...state,
                    quotation: initializeEmbeddedRecordState(
                        QuotationWidget,
                        newQuotation,
                        context,
                        true
                    ),
                },
            };
        }
        case "START_QUOTE": {
            const estimatorPercentage = new Decimal(1).dividedBy(
                new Decimal(
                    action.project.personnel.filter(
                        (entry) => entry.role === ROLE_ESTIMATOR
                    ).length
                )
            );

            const newQuotation: Quotation = {
                tags: [],
                id: newUUID(),
                recordVersion: { version: null },
                ignoringUnusedItemsBecause: "",
                specificationDetails: "",
                numberOfAddendums: new Decimal(0),
                addedDateTime: null,
                modifiedDateTime: null,
                modifiedBy: null,
                user: action.user.id,
                project: action.project.id.uuid,
                estimates: [],
                scopeOfWork: [],
                contractNotes: [],
                projectSpotlightItems: [],
                options: [],
                quotationType: null,
                addressedContacts: [],
                quoteFollowUpDate: null,
                firstDate: null,
                date: null,
                projectDescription: {
                    category: null,
                    description: null,
                    custom: "",
                },
                initialized: false,
                initializedEstimates: [],
                dividedProjectDescription: false,
                number: action.quotations
                    .reduce(
                        (current, quotation) =>
                            Decimal.max(current, quotation.number),
                        new Decimal(0)
                    )
                    .plus(1),
                generated: false,
                change: data.projectAwardDate !== null,
                superceded: false,
                quotedBy: action.project.personnel
                    .filter((entry) => entry.role === ROLE_ESTIMATOR)
                    .map((entry) => entry.user),
                estimators: action.project.personnel
                    .filter((entry) => entry.role === ROLE_ESTIMATOR)
                    .map((entry) => ({
                        user: entry.user,
                        percentage: estimatorPercentage,
                    })),
            };
            return {
                data,
                state: {
                    ...state,
                    quotation: initializeEmbeddedRecordState(
                        QuotationWidget,
                        newQuotation,
                        context,
                        true
                    ),
                },
            };
        }
        case "UNLOCK_QUOTATION":
            return {
                data,
                state: {
                    ...state,
                    quotation: {
                        ...state.quotation!,
                        data: {
                            ...state.quotation!.data,
                            generated: false,
                        },
                    },
                },
            };
        case "GENERATE_QUOTATION":
            return {
                data: {
                    ...data,
                    firstQuotationDate: data.firstQuotationDate || new Date(),
                    lastQuotation: state.quotation!.data.id.uuid,
                    pendingQuoteHistory: [
                        ...data.pendingQuoteHistory,
                        {
                            landingLikelihood:
                                action.quotationType.defaultLandingLikelihood,
                            date: new Date(),
                            user: action.user,
                            followupDate:
                                state.quotation!.data.quoteFollowUpDate,
                            message: "Quote Generated",
                        },
                    ],
                },
                state,
            };

        default:
            return baseReduce(state, data, action, context);
    }
}

export type ExtraActions =
    | {
          type: "START_QUOTE";
          user: UserPermissions;
          project: Project;
          quotations: Quotation[];
      }
    | {
          type: "GENERATE_QUOTATION";
          quotationType: QuotationType;
          user: string;
      }
    | {
          type: "DUPLICATE_QUOTATION";
          quotation: Quotation;
          user: UserPermissions;
          project: Project;
          quotations: Quotation[];
      }
    | {
          type: "UNLOCK_QUOTATION";
      };

function finalizeOption(
    option: QuotationOption,
    quotation: Quotation,
    cache: QuickCacheApi
): QuotationOption {
    const resolved = resolveOption(cache, quotation, option);
    return {
        ...option,
        details: {
            areas: resolved.areas.map((area) => ({
                id: area.id,
                name: area.name,
            })),
            actionPriceTotal: resolved.actionPriceTotal,
            allowancePriceTotal: resolved.allowancePriceTotal,
            total: resolved.total,
            actions: resolved.activeActions,
            allowances: resolved.activeAllowances,
            finishSchedule: resolved.finishSchedule,
            schedules: resolved.schedules,
            contingencies: resolved.activeContingencies,
            contingencyPriceTotal: resolved.contingencyPriceTotal,
        },
    };
}

export function finalizeQuotation(
    data: Quotation,
    cache: QuickCacheApi,
    detail: string
) {
    return {
        ...DATED_EMBEDDED.process(data, cache, detail),
        options: data.options.map((option) =>
            finalizeOption(option, data, cache)
        ),
        generated: true,
    };
}

function isQuoteValid(quotation: Quotation, quickCache: QuickCacheApi) {
    return (
        quotation.generated ||
        (QuotationWidget.validate(quotation, quickCache).length == 0 &&
            quotation.firstDate === null)
    );
}
function RestimateProjectPopup(props: {
    dispatch: (action: Action) => void;
    close: () => void;
}) {
    const user = useUser();
    const { data, component, isValid } = useLocalFieldWidget(
        RichTextWidget,
        "",
        {}
    );

    const onClickRestimate = React.useCallback(() => {
        props.dispatch({
            type: "RESTIMATE_PROJECT",
            message: data,
            user: user.id,
        });
        props.close();
    }, [props.dispatch, data, user.id, props.close]);

    return (
        <Modal isOpen={true} onRequestClose={() => {}}>
            <ModalHeader>
                <ModalTitle>Re-estimate Project</ModalTitle>
            </ModalHeader>
            <ModalBody>
                <FormWrapper label="Enter Message">{component}</FormWrapper>
                <Button disabled={!isValid} onClick={onClickRestimate}>
                    Re-estimate Project
                </Button>
            </ModalBody>
        </Modal>
    );
}

const BUTTON_BLOCK = css({
    marginLeft: "auto",
    whiteSpace: "nowrap",
    width: "25em",
    "& div": {
        display: "flex",
        gap: "1em",
        marginBottom: ".5em",
    },
});

const BUTTON_STYLE = css({
    width: "12em",
});

function HistoricalQuotationCopyButton(props: {
    quotation: Quotation;
    project: Project;
    status: WidgetStatus;
}) {
    const baseProps = React.useContext(ReactContext);
    const user = useUser();
    const project = useQuickRecord(PROJECT_META, props.quotation.project);

    const estimateCopyRequests =
        useIdQuery(
            QUOTATION_COPY_REQUEST_META,
            {
                filters: [
                    {
                        column: "quotation",
                        filter: {
                            equal: props.quotation.id.uuid,
                        },
                    },
                    {
                        column: "target",
                        filter: {
                            equal: props.project.id.uuid,
                        },
                    },
                ],
            },
            [props.quotation.id.uuid, props.project.id.uuid]
        ) || [];

    const isEstimatorOnProject = some(
        project?.personnel || [],
        (entry) => entry.role === ROLE_ESTIMATOR && entry.user === user.id
    );

    const onCopy = React.useCallback(async () => {
        if (isEstimatorOnProject) {
            const newQuotation = await duplicateQuotation(
                props.quotation,
                props.project,
                user
            );
            baseProps!.dispatch({
                type: "OPEN_QUOTATION",
                quotation: newQuotation,
            });
        } else {
            await storeRecord(QUOTATION_COPY_REQUEST_META, "quotations", {
                id: newUUID(),
                recordVersion: { version: null },
                addedDateTime: null,
                quotation: props.quotation.id.uuid,
                target: props.project.id.uuid,
                user: user.id,
                approved: false,
            });
            alert("A copy of this proposal has been requested");
        }
    }, [
        user.id,
        props.quotation,
        props.project,
        isEstimatorOnProject,
        baseProps!.dispatch,
    ]);

    if (
        !isEstimatorOnProject &&
        !hasPermission(user, "QuotationCopyRequest", "new")
    ) {
        return <></>;
    }

    if (isEstimatorOnProject) {
        return (
            <Button
                style={{
                    marginLeft: "auto",
                }}
                disabled={!props.status.mutable}
                onClick={onCopy}
            >
                Copy
            </Button>
        );
    } else if (estimateCopyRequests.length > 0) {
        return (
            <Button
                style={{
                    marginLeft: "auto",
                }}
                disabled={true}
                onClick={onCopy}
            >
                Copy Requested
            </Button>
        );
    } else {
        return (
            <Button
                style={{
                    marginLeft: "auto",
                }}
                disabled={!props.status.mutable}
                onClick={onCopy}
            >
                Request Copy
            </Button>
        );
    }
}

function ItemsList() {
    return (
        <Tabs defaultActiveKey="currentProject" id="quotation-tabs">
            <Tab eventKey="currentProject" title="Current Project">
                <ItemsListCurrent />
            </Tab>
            <Tab eventKey="historical" title="Historical">
                <ItemsListHistorical />
            </Tab>
            <Tab eventKey="other" title="Other">
                <ItemsListOther />
            </Tab>
        </Tabs>
    );
}

function ShowProject(props: { quotation: Quotation }) {
    const project = useQuickRecord(PROJECT_META, props.quotation.project);
    return (
        <div>
            <Datum
                label="Project Number"
                value={project}
                format={(project) => project.projectNumber}
            />
        </div>
    );
}

function ItemsListHistorical() {
    const props = React.useContext(ReactContext)!;
    const editableContext = useEditableContext();
    const user = useUser();

    const projectFilters = useRelatedProjectsFilter("project.", props.data);

    const quotations =
        useRecordQuery(
            QUOTATION_META,
            {
                filters: projectFilters || [],
                sorts: ["date", "addedDateTime"],
            },
            [projectFilters],
            projectFilters !== null
        ) || [];

    return (
        <ListGroup>
            {quotations.map((quotation) => (
                <ListGroupItem
                    key={quotation.id.uuid}
                    style={{
                        display: "flex",
                    }}
                >
                    <ShowSummary quotation={quotation} status={props.status}>
                        <ShowProject quotation={quotation} />
                    </ShowSummary>
                    <div {...BUTTON_BLOCK}>
                        <HistoricalQuotationCopyButton
                            project={props.data}
                            quotation={quotation}
                            status={props.status}
                        />
                    </div>
                </ListGroupItem>
            ))}
        </ListGroup>
    );
}

function ItemsListOther() {
    const props = React.useContext(ReactContext)!;
    const [id, setId] = React.useState<string | null>(null);

    const quotations =
        useRecordQuery(
            QUOTATION_META,
            {
                filters: [
                    {
                        column: "project",
                        filter: {
                            equal: id,
                        },
                    },
                ],
                sorts: ["date", "addedDateTime"],
            },
            [id],
            id !== null
        ) || [];

    return (
        <>
            <FormWrapper label="Project">
                <SelectProject id={id} setId={setId} />
            </FormWrapper>
            <ListGroup>
                {quotations.map((quotation) => (
                    <ListGroupItem
                        key={quotation.id.uuid}
                        style={{
                            display: "flex",
                        }}
                    >
                        <ShowSummary
                            quotation={quotation}
                            status={props.status}
                        >
                            <ShowProject quotation={quotation} />
                        </ShowSummary>
                        <div {...BUTTON_BLOCK}>
                            <HistoricalQuotationCopyButton
                                project={props.data}
                                quotation={quotation}
                                status={props.status}
                            />
                        </div>
                    </ListGroupItem>
                ))}
            </ListGroup>
        </>
    );
}

function ItemsListCurrent() {
    const props = React.useContext(ReactContext)!;
    const editableContext = useEditableContext();

    const user = useUser();

    const cache = useQuickCache();
    cache.getAll(QUOTATION_TYPE_META);

    const quotations =
        useRecordQuery(
            QUOTATION_META,
            {
                filters: [
                    {
                        column: "project",
                        filter: {
                            equal: props.data.id.uuid,
                        },
                    },
                ],
                sorts: ["-number"],
            },
            []
        ) || [];
    const dispatch = props.dispatch;

    const onClickNew = React.useCallback(
        () =>
            dispatch({
                type: "START_QUOTE",
                user: user,
                project: props.data,
                quotations,
            }),
        [user, dispatch, props.data, quotations]
    );

    const quickCache = useQuickCache();

    const projectContext = React.useContext(ProjectWidgetReactContext);

    const onClickDidNotQuote = React.useCallback(
        () =>
            projectContext?.dispatch({
                type: "SELECT_QUOTATION",
                quotation: null,
                lost: true,
                user: user.id,
            }),
        [projectContext?.dispatch]
    );

    const onClickAwardedWithoutQuote = React.useCallback(
        () =>
            projectContext?.dispatch({
                type: "SELECT_QUOTATION",
                quotation: null,
                lost: false,
                user: user.id,
            }),
        [projectContext?.dispatch]
    );

    const [isReestimating, setReestimating] = React.useState(false);

    const onClickRestimate = React.useCallback(() => {
        setReestimating(true);
    }, [setReestimating]);

    const onCloseRestimate = React.useCallback(() => {
        setReestimating(false);
    }, [setReestimating]);

    const allValid = every(
        quotations.map((quotation) => isQuoteValid(quotation, quickCache))
    );

    const canContinue =
        allValid &&
        editableContext.save &&
        !editableContext.save.disabled &&
        props.data.projectLostDate === null &&
        props.data.projectAwardDate === null;

    return (
        <>
            {isReestimating && (
                <RestimateProjectPopup
                    dispatch={props.dispatch}
                    close={onCloseRestimate}
                />
            )}
            <ListGroup>
                <ListGroupItem style={{ display: "flex" }}>
                    {quotations.length > 0 && (
                        <Button
                            style={{
                                marginLeft: "auto",
                                backgroundColor: "#ff8b13",
                            }}
                            variant="none"
                            {...BUTTON_STYLE}
                            onClick={onClickRestimate}
                        >
                            Re-estimate Project
                        </Button>
                    )}
                    <Button
                        {...BUTTON_STYLE}
                        disabled={!allValid}
                        style={{
                            marginLeft: "1em",
                        }}
                        onClick={onClickNew}
                    >
                        Start New Proposal
                    </Button>
                </ListGroupItem>
                {quotations.length === 0 && canContinue && (
                    <ListGroupItem style={{ display: "flex" }}>
                        <Button
                            {...BUTTON_STYLE}
                            style={{
                                marginLeft: "auto",
                            }}
                            onClick={onClickAwardedWithoutQuote}
                        >
                            Awarded Without Proposal
                        </Button>
                        <Button
                            {...BUTTON_STYLE}
                            style={{
                                marginLeft: "1em",
                            }}
                            onClick={onClickDidNotQuote}
                            variant="danger"
                        >
                            RFQ Cancelled
                        </Button>
                    </ListGroupItem>
                )}

                {quotations.map((quotation) => (
                    <ListGroupItem
                        key={quotation.id.uuid}
                        style={{
                            display: "flex",
                        }}
                    >
                        <ShowSummary
                            quotation={quotation}
                            status={props.status}
                        />
                        <div {...BUTTON_BLOCK}>
                            {quotation.generated &&
                                canContinue &&
                                !quotation.change && (
                                    <div>
                                        <Button
                                            variant="fobar"
                                            {...BUTTON_STYLE}
                                            onClick={() => {
                                                projectContext?.dispatch({
                                                    type: "SELECT_QUOTATION",
                                                    quotation:
                                                        quotation.id.uuid,
                                                    lost: false,
                                                    user: user.id,
                                                });
                                            }}
                                            style={{
                                                background: "#e5ffe0",
                                                backgroundColor: "#e5ffe0",
                                                color: "black",
                                            }}
                                        >
                                            Record Project Award
                                        </Button>
                                        <Button
                                            {...BUTTON_STYLE}
                                            onClick={() => {
                                                projectContext?.dispatch({
                                                    type: "SELECT_QUOTATION",
                                                    quotation:
                                                        quotation.id.uuid,
                                                    lost: true,
                                                    user: user.id,
                                                });
                                            }}
                                            variant="danger"
                                        >
                                            Record Lost Project
                                        </Button>
                                    </div>
                                )}
                            <div>
                                <Button
                                    {...BUTTON_STYLE}
                                    onClick={() =>
                                        props.dispatch({
                                            type: "DUPLICATE_QUOTATION",
                                            quotation,
                                            user: user,
                                            project: props.data,
                                            quotations,
                                        })
                                    }
                                >
                                    Duplicate Proposal
                                </Button>
                                <Button
                                    {...BUTTON_STYLE}
                                    onClick={() =>
                                        props.dispatch({
                                            type: "OPEN_QUOTATION",
                                            quotation,
                                        })
                                    }
                                >
                                    Open Proposal
                                </Button>
                            </div>
                        </div>
                    </ListGroupItem>
                ))}
            </ListGroup>
        </>
    );
}

function Component(props: Props) {
    const user = useUser();

    const cache = useQuickCache();
    cache.getAll(QUOTATION_TYPE_META);
    const preSave = React.useCallback(
        (quotation) => {
            for (const estimateId of quotation.estimates) {
                const estimate = cache.get(ESTIMATE_META, estimateId);
                if (estimate) {
                    storeRecord(ESTIMATE_META, "project quotations", {
                        ...estimate,
                        id: newUUID(),
                        common: {
                            ...estimate.common,
                            archiveOf: estimate.id.uuid,
                            archiveFor: quotation.id.uuid,
                            archiveDate: new Date(),
                        },
                    });
                }
                const tmEstimate = cache.get(
                    TIME_AND_MATERIALS_ESTIMATE_META,
                    estimateId
                );
                if (tmEstimate) {
                    storeRecord(
                        TIME_AND_MATERIALS_ESTIMATE_META,
                        "project quotations",
                        {
                            ...tmEstimate,
                            id: newUUID(),
                            common: {
                                ...tmEstimate.common,
                                archiveOf: tmEstimate.id.uuid,
                                archiveFor: quotation.id.uuid,
                                archiveDate: new Date(),
                            },
                        }
                    );
                }
            }
            if (!quotation.change) {
                props.dispatch({
                    type: "GENERATE_QUOTATION",
                    quotationType: cache.get(
                        QUOTATION_TYPE_META,
                        quotation.quotationType
                    )!,
                    user: user.id,
                });
                const season = quotationSeason(quotation.date);
                doQuery({
                    tableName: "Quotation",
                    columns: ["id", "date"],
                    filters: [
                        {
                            column: "project",
                            filter: {
                                equal: props.data.id.uuid,
                            },
                        },
                        {
                            column: "generated",
                            filter: {
                                equal: true,
                            },
                        },
                        {
                            column: "change",
                            filter: {
                                equal: false,
                            },
                        },
                        {
                            column: "superceded",
                            filter: {
                                equal: false,
                            },
                        },
                        {
                            column: "id",
                            filter: {
                                not_equal: quotation.id.uuid,
                            },
                        },
                    ],
                }).then((result) => {
                    result.rows.forEach((row) => {
                        const id = row[0] as string;
                        const date = row[1] && parseISO(row[1] as string);
                        if (quotationSeason(date) == season) {
                            patchRecord(QUOTATION_META, "Quotations", id, {
                                superceded: [false, true],
                            });
                        }
                    });
                });
            }
        },
        [props.state.quotation?.data.quotationType, user.id, props.dispatch]
    );
    const preDelete = React.useCallback(
        (quotation) => {
            if (!quotation.change && quotation.date) {
                const season = quotationSeason(quotation.date);
                doQuery({
                    tableName: "Quotation",
                    columns: ["id", "date", "superceded"],
                    filters: [
                        {
                            column: "project",
                            filter: {
                                equal: props.data.id.uuid,
                            },
                        },
                        {
                            column: "generated",
                            filter: {
                                equal: true,
                            },
                        },
                        {
                            column: "change",
                            filter: {
                                equal: false,
                            },
                        },
                        {
                            column: "id",
                            filter: {
                                not_equal: quotation.id.uuid,
                            },
                        },
                    ],
                    sorts: ["number"],
                }).then((result) => {
                    let best = null;
                    result.rows.forEach((row) => {
                        const id = row[0] as string;
                        const date = row[1] && parseISO(row[1] as string);
                        const superceded = row[2] as boolean;
                        if (quotationSeason(date) == season) {
                            best = [id, superceded];
                        }
                    });
                    if (best) {
                        patchRecord(QUOTATION_META, "Quotations", best[0], {
                            superceded: [true, false],
                        });
                    }
                });
            }
        },
        [props.state.quotation?.data.quotationType, user.id, props.dispatch]
    );

    const onOpenEstimate = React.useCallback(() => {
        const estimate = props.state.quotation!.data.estimates[0];
        window.open("#/estimate/" + estimate);
    }, [props.state.quotation?.data.estimates[0]]);

    return (
        <EmbeddedRecords
            mainTabLabel="Proposal Library"
            extraTabWidget={
                props.state.quotation?.data?.estimates?.length == 1 && (
                    <Button
                        onClick={onOpenEstimate}
                        style={{ marginLeft: "auto" }}
                    >
                        Open Estimate
                    </Button>
                )
            }
            quotation={{
                preSave,
                preDelete,
                process: finalizeQuotation,
                mayCancel: DATED_EMBEDDED.mayCancel,
                locked: (quotation) => quotation.generated,
                unlock: (quotation) => ({
                    ...quotation,
                    generated: false,
                }),
                mayUnlock: (quotation) => {
                    return (
                        differenceInHours(
                            new Date(),
                            quotation.modifiedDateTime!
                        ) < 72
                    );
                },
                generateRequests: (quotation, cache) => {
                    const quotationType = cache.get(
                        QUOTATION_TYPE_META,
                        quotation.quotationType
                    )!;
                    if (quotationType.print) {
                        return [
                            {
                                template: "quotation",
                                parameters: [quotationType.name],
                            },
                        ];
                    } else {
                        return [];
                    }
                },
            }}
        >
            <ItemsList />
        </EmbeddedRecords>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Embedded.quotation>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    quotation: EmbeddedRecordState<WidgetData<typeof Embedded.quotation>>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | {
          type: "QUOTATION";
          action: EmbeddedRecordStateAction<
              WidgetData<typeof Embedded.quotation>
          >;
      }
    | {
          type: "OPEN_QUOTATION";
          quotation: WidgetData<typeof Embedded.quotation>;
      }
    | { type: "RESET" }
    | { type: "RESTIMATE_PROJECT"; message: string; user: Link<User> };

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
        case "QUOTATION": {
            const inner = embededRecordStateReduce(
                Embedded.quotation,
                state.quotation,
                action.action,
                context
            );
            return {
                state: { ...state, quotation: inner },
                data: data,
            };
        }
        case "OPEN_QUOTATION": {
            return {
                state: {
                    ...state,
                    quotation: initializeEmbeddedRecordState(
                        Embedded.quotation,
                        action.quotation,
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
                    quotation: null,
                },
                data,
            };
        }
        case "RESTIMATE_PROJECT":
            return actionRestimateProject(
                state,
                data,
                action.message,
                action.user
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
        let quotationState;
        {
            const inner = null;
            quotationState = inner;
            data = data;
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            quotation: quotationState,
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
                    case "quotation":
                        fetchRecord(
                            Embedded.quotation.dataMeta,
                            props.state.initialParameters[1]
                        ).then(
                            (record) =>
                                record &&
                                props.dispatch({
                                    type: "OPEN_QUOTATION",
                                    quotation: record,
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
        if (state.quotation) {
            return ["quotation", state.quotation.data.id.uuid];
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
    quotation: EmbeddedRecordStateOptions<
        WidgetData<typeof Embedded.quotation>
    >;
    children: React.ReactNode;
    mainTabLabel: string;
    extraTabWidget?: React.ReactNode;
}) {
    const context = React.useContext(ReactContext)!;
    const quotationDispatch = React.useCallback(
        (
            action: EmbeddedRecordStateAction<
                WidgetData<typeof Embedded.quotation>
            >
        ) => {
            context.dispatch({ type: "QUOTATION", action });
        },
        [context.dispatch]
    );
    const quotation = useEmbeddedRecordState(
        Embedded.quotation,

        context.state.quotation,
        quotationDispatch,
        context.status,
        props.quotation
    );
    return (
        <>
            <div {...TAB_STYLE}>
                {quotation.mainComponent || props.children}
            </div>
            <Pagination style={{ marginBottom: "0px" }}>
                <Pagination.Item
                    active={!quotation}
                    onClick={() => {
                        context.dispatch({ type: "RESET" });
                    }}
                >
                    {props.mainTabLabel}
                </Pagination.Item>
                {quotation.tabs}
                {props.extraTabWidget}
            </Pagination>
        </>
    );
}
// END MAGIC -- DO NOT EDIT
