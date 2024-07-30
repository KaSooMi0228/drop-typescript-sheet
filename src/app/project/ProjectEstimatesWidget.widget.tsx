import { faCalculator } from "@fortawesome/free-solid-svg-icons";
import { format as formatDate } from "date-fns";
import Decimal from "decimal.js";
import { css } from "glamor";
import { find, some } from "lodash";
import * as React from "react";
import { Button, ListGroup, ListGroupItem, Tab, Tabs } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { useId } from "react-id-generator";
import Modal from "react-modal";
import {
    maybeFetchRecord,
    storeRecord,
    useIdQuery,
    useQuery,
    useRecordQuery,
} from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { toPattern } from "../../clay/dataGrid/patterns";
import { longDate } from "../../clay/LocalDate";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../clay/quick-cache";
import { newUUID } from "../../clay/uuid";
import { useQuickAllRecordsSorted } from "../../clay/widgets/dropdown-link-widget";
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
    WidgetExtraProps,
    WidgetProps,
    WidgetResult,
    WidgetState,
    WidgetStatus,
} from "../../clay/widgets/index";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { hasPermission } from "../../permissions";
import { FINISH_SCHEDULE_META } from "../estimate/finish-schedule/table";
import {
    duplicateEstimate,
    EstimateHandle,
    onEstimate,
    updateEstimateDate,
    useEstimateHandle,
    useEstimatesByFilter,
    useProjectEstimates,
} from "../estimate/manage";
import {
    Estimate,
    EstimateCommon,
    EstimateCopyRequest,
    estimateTotal,
    ESTIMATE_CONTINGENCY_ITEM_TYPE_META,
    ESTIMATE_COPY_REQUEST_META,
    ESTIMATE_META,
} from "../estimate/table";
import {
    EstimateTemplate,
    ESTIMATE_TEMPLATE_META,
} from "../estimate/templates/table";
import {
    calcTimeAndMaterialsEstimateTotal,
    TimeAndMaterialsEstimate,
    TIME_AND_MATERIALS_ESTIMATE_META,
} from "../estimate/time-and-materials/table";
import { formatMoney } from "../estimate/TotalsWidget.widget";
import { ITEM_TYPE_META } from "../estimate/types/table";
import { handleAccept } from "../inbox/approved-copy";
import { useUser } from "../state";
import { ROLE_ESTIMATOR, User, USER_META } from "../user/table";
import { Datum, Summary } from "./project-items";
import { useRelatedProjectsFilter } from "./QuoteRequestCustomerWidget.widget";
import { Project, PROJECT_META } from "./table";

export type Data = Project;

export const Fields = {
    name: Optional(TextWidget),
};

function createCommon(
    template: EstimateTemplate,
    user: User,
    project: Project,
    name: string
): EstimateCommon {
    return {
        name,
        template: template.id.uuid,
        user: user.id.uuid,
        project: project.id.uuid,
        creationDate: new Date(),
        markup: template.markup,
        materialsMarkup: template.materialsMarkup,
        additionalMarkup: new Decimal(0),
        additionalMaterialsMarkup: null,
        additionalAllowancesMarkup: null,
        additionalMarkupNote: "",
        change: project.projectAwardDate !== null,
        markupExclusive: true,
        archiveOf: null,
        archiveFor: null,
        archiveDate: null,
    };
}

export async function startTimeAndMaterialsEstimate(
    template: EstimateTemplate,
    user: User,
    project: Project,
    name: string,
    open: boolean = true
) {
    const estimate: TimeAndMaterialsEstimate = {
        id: newUUID(),
        recordVersion: { version: null },
        common: createCommon(template, user, project, name),
        lines: [],
        extras: [],
    };

    await storeRecord(
        TIME_AND_MATERIALS_ESTIMATE_META,
        "New Estimate",
        estimate
    );

    if (open) {
        window.open("#/tm-estimate/" + estimate.id.uuid);
    } else {
        window.location.href = "#/tm-estimate/" + estimate.id.uuid;
    }
}

async function startFullEstimate(
    template: EstimateTemplate,
    user: User,
    project: Project,
    name: string
) {
    const estimateActions = Promise.all(
        template.actions.map(async (action) => {
            const finishScheduleP = maybeFetchRecord(
                FINISH_SCHEDULE_META,
                action.finishSchedule
            );
            const itemTypeP = maybeFetchRecord(ITEM_TYPE_META, action.itemType);
            const finishSchedule = await finishScheduleP;
            const itemType = await itemTypeP;
            const rate = itemType
                ? find(itemType.rates, (rate) => rate.id.uuid === action.rate)
                : null;
            return {
                id: newUUID(),
                name: action.name,
                itemType: action.itemType,
                unitType: action.unitType,
                calculator: action.calculator,
                applicationType: finishSchedule?.applicationType || null,
                application: finishSchedule?.defaultApplication || null,
                hourRate: action.hourRate,
                materialsRate: finishSchedule?.rate || new Decimal(0),
                hourRatio: rate?.hours || new Decimal(1),
                materialsRatio: rate?.materials || new Decimal(1),
                unitIncrement: rate?.unitIncrement || new Decimal(1),
                customUnitRate: null,
                rateName: rate?.name || "",
                finishSchedule: finishSchedule?.name || "",
                copyUnitsFromAction: null,
                markup: null,
            };
        })
    );

    const contingencyItems = Promise.all(
        template.contingencyItems.map(async (contingencyItemId) => {
            const contingencyItem = (await maybeFetchRecord(
                ESTIMATE_CONTINGENCY_ITEM_TYPE_META,
                contingencyItemId
            ))!;
            return {
                id: newUUID(),
                name: contingencyItem.name,
                substrate: contingencyItem.substrate,
                quantity: new Decimal("0"),
                type: contingencyItem.type,
                rate: contingencyItem.rate,
                markup: new Decimal("0.47"),
                areas: [],
                finishSchedule: "",
            };
        })
    );

    const estimate: Estimate = {
        id: newUUID(),
        recordVersion: { version: null },
        common: createCommon(template, user, project, name),
        actions: await estimateActions,
        contingencyItems: await contingencyItems,
        contingencyItemsV2: [],
        allowances: [],
        baseHourRate: template.baseHourRate,
        notes: "",
        areas: [
            {
                id: newUUID(),
                name: "",
                phase: new Decimal(1),
                count: new Decimal(1),
                unitCount: new Decimal(1),
                sides: [],
            },
        ],
    };

    await storeRecord(ESTIMATE_META, "New Estimate", estimate);

    window.open("#/estimate/" + estimate.id.uuid);
}

async function startEstimate(
    template: EstimateTemplate,
    user: User,
    project: Project,
    name: string
) {
    updateEstimateDate(project);
    switch (template.kind) {
        case "full":
            return startFullEstimate(template, user, project, name);
        case "time-and-materials":
            return startTimeAndMaterialsEstimate(template, user, project, name);
    }
}

function EstimateTemplatePopup(props: {
    project: Project;
    close: () => void;
    hasEstimate: boolean;
}) {
    const templates = useQuickAllRecordsSorted(
        ESTIMATE_TEMPLATE_META,
        (estimate) => estimate.name
    );
    const basicUser = useUser();
    const user = useQuickRecord(USER_META, basicUser.id);

    if (!user) {
        return <></>;
    }

    return (
        <Modal isOpen={true} onRequestClose={props.close}>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    rowGap: "1em",
                    columnGap: "5em",
                }}
            >
                {templates.map((template) => (
                    <Button
                        key={template.id.uuid}
                        onClick={() => {
                            const name = props.hasEstimate
                                ? prompt("Name for estimate?")
                                : "";
                            if (name !== null) {
                                startEstimate(
                                    template,
                                    user,
                                    props.project,
                                    name
                                );
                                props.close();
                            }
                        }}
                    >
                        {template.name}
                    </Button>
                ))}
            </div>
        </Modal>
    );
}

function ShowTimeAndMaterialsEstimate(props: {
    estimate: TimeAndMaterialsEstimate;
}) {
    const estimate = props.estimate;
    return (
        <>
            <ShowCommon common={props.estimate.common} />
            <div>
                <b>Total:</b>{" "}
                {formatMoney(calcTimeAndMaterialsEstimateTotal(estimate))}
            </div>
        </>
    );
}

function ShowEstimate(props: { estimate: EstimateHandle }) {
    return onEstimate(props.estimate, {
        std(estimate) {
            return <ShowStandardEstimate estimate={estimate} />;
        },
        tm(estimate) {
            return <ShowTimeAndMaterialsEstimate estimate={estimate} />;
        },
    });
}

function ShowStandardEstimate(props: { estimate: Estimate }) {
    const estimate = props.estimate;
    return (
        <>
            <ShowCommon common={props.estimate.common} />
            {estimate.areas.length > 1 ? (
                <div>
                    <b>Areas:</b>{" "}
                    {estimate.areas
                        .slice(0, 5)
                        .map((area) => area.name)
                        .join("; ")}
                    {estimate.areas.length > 5 && "; ..."}
                </div>
            ) : (
                estimate.areas.length > 0 && (
                    <div>
                        <b>Sides:</b>{" "}
                        {estimate.areas[0].sides
                            .slice(0, 5)
                            .map((side) => side.name)
                            .join("; ")}
                        {estimate.areas[0].sides.length > 5 && "; ..."}
                    </div>
                )
            )}
            <div>
                <b>Total:</b> {formatMoney(estimateTotal(estimate).price)}
            </div>
        </>
    );
}

function ShowProject(props: { estimate: EstimateHandle }) {
    const project = useQuickRecord(PROJECT_META, props.estimate.common.project);
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

function ShowCommon(props: { common: EstimateCommon }) {
    const user = useQuickRecord(USER_META, props.common.user);
    const template = useQuickRecord(
        ESTIMATE_TEMPLATE_META,
        props.common.template
    );
    return (
        <>
            <Datum
                label="Date"
                value={props.common.creationDate}
                format={(date) => formatDate(date, "Y-M-d p")}
            />
            <Datum
                label="Name"
                value={props.common.name}
                format={(name) => name}
            />
            <Datum label="User" value={user} format={(user) => user.name} />
            <Datum
                label="Template"
                value={template}
                format={(template) => template.name}
            />
        </>
    );
}

function HistoricalEstimateCopyButton(props: {
    estimate: EstimateHandle;
    project: Project;
    status: WidgetStatus;
}) {
    const user = useUser();
    const project = useQuickRecord(PROJECT_META, props.estimate.common.project);

    const estimateCopyRequests =
        useIdQuery(
            ESTIMATE_COPY_REQUEST_META,
            {
                filters: [
                    {
                        column: "estimate",
                        filter: {
                            equal: props.estimate.id,
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
            [props.estimate.id, props.project.id.uuid]
        ) || [];

    const isEstimatorOnProject = some(
        project?.personnel || [],
        (entry) => entry.role === ROLE_ESTIMATOR && entry.user === user.id
    );

    const onCopy = React.useCallback(() => {
        if (isEstimatorOnProject) {
            duplicateEstimate(props.estimate, props.project);
        } else {
            storeRecord(ESTIMATE_COPY_REQUEST_META, "estimates", {
                id: newUUID(),
                recordVersion: { version: null },
                addedDateTime: null,
                estimate: props.estimate.id,
                target: props.project.id.uuid,
                type: props.estimate.meta.name,
                user: user.id,
                approved: false,
            }).then(() => {
                alert("A copy of this estimate has been requested");
            });
        }
    }, [user.id, props.estimate, props.project, isEstimatorOnProject]);

    if (
        !isEstimatorOnProject &&
        !hasPermission(user, "EstimateCopyRequest", "new")
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

const LOOKUP_WIDGET_STYLE = css({
    "html & input.form-control": {
        border: "none",
        height: "auto",
        padding: "0px",
    },
});

export function SelectProject(props: {
    setId: (id: string | null) => void;
    id: string | null;
}) {
    const user = useUser();
    const [text, setText] = React.useState("");
    const lookupQuery = useQuery(
        {
            tableName: "Project",
            columns: ["id", "summary"],
            filters: [
                {
                    column: "summary",
                    filter: {
                        like: toPattern(text),
                    },
                },
            ],
            sorts: ["summary"],
            limit: 100,
        },
        [text]
    );

    const widgetId = useId()[0];

    type Item = {
        id: string;
        name: string;
    };

    async function onChange(selected: any[]) {
        if (selected.length > 0) {
            const item = selected[0];
            props.setId(item.id);
            setText(item.name);
        } else {
            props.setId(null);
        }
    }

    const items: Item[] = [];
    let selectedText = "";

    if (lookupQuery) {
        for (const row of lookupQuery) {
            items.push({
                id: row[0] as string,
                name: (row[1] as string) || "",
            });
        }
    }

    return (
        <div style={{ display: "flex", flexGrow: 1 }}>
            <div className={"form-control "} {...LOOKUP_WIDGET_STYLE}>
                <Typeahead
                    flip={true}
                    positionFixed={true}
                    id={widgetId}
                    labelKey="name"
                    selected={[
                        {
                            name: text,
                            id: props.id!,
                        },
                    ]}
                    filterBy={() => true}
                    options={items}
                    onInputChange={(text) => {
                        setText(text);
                    }}
                    onChange={onChange}
                />
            </div>
        </div>
    );
}

function OtherEstimates(props: { project: Project; status: WidgetStatus }) {
    const [id, setId] = React.useState<string | null>(null);

    const estimates = useProjectEstimates(id);

    const estimateWidgets = [];
    if (estimates) {
        for (const estimate of estimates) {
            estimateWidgets.push({
                estimate,
                component: (
                    <ListGroupItem
                        key={estimate.id}
                        style={{
                            display: "flex",
                        }}
                    >
                        <Summary
                            title="Estimate"
                            icon={faCalculator}
                            change={estimate.common.change}
                        >
                            <ShowProject estimate={estimate} />
                            <ShowEstimate estimate={estimate} />
                        </Summary>
                        <HistoricalEstimateCopyButton
                            estimate={estimate}
                            project={props.project}
                            status={props.status}
                        />
                    </ListGroupItem>
                ),
            });
        }
    }

    return (
        <>
            <FormWrapper label="Project">
                <SelectProject id={id} setId={setId} />
            </FormWrapper>
            <ListGroup>
                {estimateWidgets.map((widget) => widget.component)}
            </ListGroup>
        </>
    );
}

function HistoricalEstimates(props: {
    project: Project;
    status: WidgetStatus;
}) {
    const projectFilters = useRelatedProjectsFilter(
        "common.project.",
        props.project
    );
    const estimateFilter = React.useMemo(
        () =>
            projectFilters && [
                ...projectFilters,
                {
                    column: "common.archiveOf",
                    filter: {
                        equal: null,
                    },
                },
            ],
        [projectFilters]
    );

    const estimates = useEstimatesByFilter(estimateFilter);

    const estimateWidgets = [];
    for (const estimate of estimates) {
        estimateWidgets.push({
            estimate,
            component: (
                <ListGroupItem
                    key={estimate.id}
                    style={{
                        display: "flex",
                    }}
                >
                    <Summary
                        title="Estimate"
                        icon={faCalculator}
                        change={estimate.common.change}
                    >
                        <ShowProject estimate={estimate} />
                        <ShowEstimate estimate={estimate} />
                    </Summary>
                    <HistoricalEstimateCopyButton
                        estimate={estimate}
                        project={props.project}
                        status={props.status}
                    />
                </ListGroupItem>
            ),
        });
    }

    return (
        <ListGroup>
            {estimateWidgets.map((widget) => widget.component)}
        </ListGroup>
    );
}

function ShowPendingEstimateRequest(props: {
    request: EstimateCopyRequest;
    project: Project;
}) {
    const estimate = useEstimateHandle(props.request.estimate);

    const onAccept = React.useCallback(() => {
        handleAccept(props.project, estimate!, props.request);
    }, [estimate, props.request, props.project]);

    if (!estimate) {
        return null;
    }

    return (
        <ListGroupItem
            key={estimate.id}
            style={{
                display: "flex",
                opacity: props.request.approved ? undefined : 0.5,
            }}
        >
            <Summary
                title="Estimate"
                icon={faCalculator}
                change={estimate.common.change}
            >
                <ShowEstimate estimate={estimate} />
            </Summary>

            {props.request.approved && (
                <Button
                    style={{
                        marginLeft: "auto",
                        width: BUTTON_WIDTH,
                    }}
                    onClick={onAccept}
                >
                    Copy
                </Button>
            )}

            {!props.request.approved && (
                <Button
                    style={{
                        marginLeft: "auto",
                        width: BUTTON_WIDTH,
                    }}
                    disabled
                >
                    Awaiting Approval
                </Button>
            )}
        </ListGroupItem>
    );
}

const BUTTON_WIDTH = "5em";
function Component(props: Props) {
    const estimates = useProjectEstimates(props.data.id.uuid);

    const pendingEstimateCopyRequests =
        useRecordQuery(
            ESTIMATE_COPY_REQUEST_META,
            {
                filters: [
                    {
                        column: "target",
                        filter: {
                            equal: props.data.id.uuid,
                        },
                    },
                ],
            },
            [props.data.id.uuid]
        ) || [];

    const onOpenEstimate = React.useCallback((estimate: EstimateHandle) => {
        window.open(
            onEstimate(estimate, {
                std(_) {
                    return "#/estimate/" + estimate.id + "/areas/";
                },
                tm(_) {
                    return "#/tm-estimate/" + estimate.id + "/main/";
                },
            })
        );
    }, []);

    const onDuplicateEstimate = React.useCallback(
        (estimate: EstimateHandle) => {
            updateEstimateDate(props.data);
            duplicateEstimate(estimate, props.data);
        },
        []
    );

    const [addingEstimate, setAddingEstimate] = React.useState(false);
    const closeAddingEstimate = React.useCallback(
        () => setAddingEstimate(false),
        [setAddingEstimate]
    );

    const estimateWidgets = [];
    for (const estimate of estimates) {
        const archivedEstimates = estimates.filter(
            (x) => x.common.archiveOf === estimate.id
        );

        if (estimate.common.archiveFor) {
            continue;
        }
        estimateWidgets.push({
            estimate,
            component: (
                <ListGroupItem key={estimate.id}>
                    <div style={{ display: "flex" }}>
                        <Summary
                            title="Estimate"
                            icon={faCalculator}
                            change={estimate.common.change}
                        >
                            <ShowEstimate estimate={estimate} />
                        </Summary>
                        <Button
                            style={{
                                marginLeft: "auto",
                            }}
                            disabled={!props.status.mutable}
                            onClick={onDuplicateEstimate.bind(null, estimate)}
                        >
                            Duplicate
                        </Button>
                        <Button
                            style={{
                                marginLeft: "1em",
                                width: BUTTON_WIDTH,
                            }}
                            onClick={onOpenEstimate.bind(null, estimate)}
                        >
                            Open
                        </Button>
                    </div>
                    {archivedEstimates.length > 0 && (
                        <>
                            <div
                                style={{ fontSize: "1rem", fontWeight: "bold" }}
                            >
                                Archived Estimates
                            </div>
                            <ul>
                                {estimates
                                    .filter(
                                        (x) =>
                                            x.common.archiveOf === estimate.id
                                    )
                                    .map((x) => (
                                        <li>
                                            {longDate(
                                                estimate.common.archiveDate
                                            )}
                                            <Button
                                                style={{
                                                    marginLeft: "auto",
                                                }}
                                                size="sm"
                                                disabled={!props.status.mutable}
                                                onClick={onDuplicateEstimate.bind(
                                                    null,
                                                    x
                                                )}
                                            >
                                                Duplicate
                                            </Button>
                                        </li>
                                    ))}
                            </ul>
                        </>
                    )}
                </ListGroupItem>
            ),
        });
    }

    for (const pendingEstimateCopyRequest of pendingEstimateCopyRequests) {
        estimateWidgets.push({
            component: (
                <ShowPendingEstimateRequest
                    request={pendingEstimateCopyRequest}
                    project={props.data}
                />
            ),
        });
    }

    return (
        <>
            {addingEstimate && (
                <EstimateTemplatePopup
                    close={closeAddingEstimate}
                    project={props.data}
                    hasEstimate={estimates.length > 0}
                />
            )}
            <Tabs defaultActiveKey="currentProject" id="estimate-tabs">
                <Tab eventKey="currentProject" title="Current Project">
                    <ListGroup>
                        <ListGroupItem style={{ display: "flex" }}>
                            New Estimate
                            <Button
                                style={{
                                    marginLeft: "auto",
                                    width: BUTTON_WIDTH,
                                }}
                                onClick={() => {
                                    setAddingEstimate(true);
                                }}
                            >
                                New
                            </Button>
                        </ListGroupItem>
                        {estimateWidgets.map(({ component }) => component)}
                    </ListGroup>
                </Tab>
                <Tab eventKey="historical" title="Historical">
                    <HistoricalEstimates
                        project={props.data}
                        status={props.status}
                    />
                </Tab>
                <Tab eventKey="other" title="Other">
                    <OtherEstimates
                        project={props.data}
                        status={props.status}
                    />
                </Tab>
            </Tabs>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = { type: "NAME"; action: WidgetAction<typeof Fields.name> };

export type Action = BaseAction;

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
        let state = {
            initialParameters: parameters,
            name: nameState,
        };
        return {
            state,
            data,
        };
    },
    validate: baseValidate,
    component: React.memo((props: Props) => {
        return (
            <ReactContext.Provider value={props}>
                <RecordContext meta={PROJECT_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
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
// END MAGIC -- DO NOT EDIT
