import { faFileInvoice } from "@fortawesome/free-solid-svg-icons";
import { format as formatDate } from "date-fns";
import Decimal from "decimal.js";
import { every, find, maxBy } from "lodash";
import * as React from "react";
import {
    Alert,
    Button,
    ListGroup,
    ListGroupItem,
    Pagination,
} from "react-bootstrap";
import {
    fetchRecord,
    useDraftProjectRecordQuery,
    useProjectRecordQuery,
    useRecordQuery,
} from "../../clay/api";
import { Dictionary } from "../../clay/common";
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
import { emptyContactDetail } from "../contact/table";
import {
    calcInvoiceContingencyItemDeltaAmount,
    calcInvoiceInvoicedTotal,
    calcInvoiceIsComplete,
    Invoice,
    INVOICE_META,
} from "../invoice/table";
import { InvoiceWidget } from "../invoice/widget";
import { Quotation, QUOTATION_META } from "../quotation/table";
import { useUser } from "../state";
import { USER_META } from "../user/table";
import { DetailSheet, DETAIL_SHEET_META } from "./detail-sheet/table";
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
import { ProjectSchedule } from "./schedule";
import {
    calcProjectLienHoldbackRequired,
    Project,
    PROJECT_META,
} from "./table";

export type Data = Project;

export const Embedded = {
    invoice: InvoiceWidget,
};

export const Fields = {
    name: Optional(TextWidget),
};

function ShowSummary(props: { invoice: Invoice }) {
    const cache = useQuickCache();
    const user = useQuickRecord(USER_META, props.invoice.user);

    return (
        <Summary
            title="Invoice"
            icon={faFileInvoice}
            valid={isInvoiceValid(props.invoice, cache)}
            finalized={props.invoice.date !== null}
        >
            <div>
                <Datum label="User" value={user} format={(x) => x.name} />
                <Datum
                    label="Number"
                    value={props.invoice.number}
                    format={(x) => `${x}`}
                />
                <Datum
                    label="Invoice Date"
                    value={props.invoice.date}
                    format={(x) => formatDate(x, "Y-M-d p")}
                />
            </div>
        </Summary>
    );
}

function determinePreviousAmount(
    lastInvoice: Invoice | null,
    detailSheet: DetailSheet,
    schedule: ProjectSchedule
) {
    return (
        find(
            lastInvoice?.options,
            (option) => option.id.uuid == schedule.id.uuid
        )?.completed ||
        find(
            lastInvoice?.options,
            (option) => option.id.uuid == detailSheet.id.uuid
        )?.completed ||
        new Decimal(0)
    );
}

export function reduce(
    state: State,
    data: Project,
    action: Action,
    context: Context
): WidgetResult<State, Project> {
    switch (action.type) {
        case "START_INVOICE": {
            const lastInvoice =
                maxBy(action.invoices, (invoice) =>
                    invoice.number.toNumber()
                ) || null;

            const newInvoice: Invoice = {
                materialsPst: new Decimal("0.07"),
                materialsOverhead: new Decimal("0"),
                materialsProfit: new Decimal("0"),
                externalInvoiceNumber: "",
                addedToAccountingSoftwareDate: null,
                addedToAccountingSoftwareUser: null,
                addedToAccountingSoftware: {
                    date: null,
                    user: null,
                },
                id: newUUID(),
                term: null,
                contact:
                    action.project.billingContacts.length == 1
                        ? action.project.billingContacts[0]
                        : emptyContactDetail(),
                specialInstructions: "",
                previousTotal: lastInvoice
                    ? calcInvoiceInvoicedTotal(lastInvoice)
                    : new Decimal(0),
                recordVersion: { version: null },
                firstDate: null,
                date: null,
                user: action.user.id,
                project: action.project.id.uuid,
                number: action.invoices
                    .reduce(
                        (current, invoice) =>
                            Decimal.max(current, invoice.number),
                        new Decimal(0)
                    )
                    .plus(1),
                contingencyItems: action.detailSheets.flatMap((detailSheet) =>
                    detailSheet.contingencyItems.map((contingencyItem) => ({
                        id: { uuid: contingencyItem.id.uuid },
                        externalChangeOrderNumber: "",
                        contingencyItem: contingencyItem.id.uuid,
                        name: "",
                        number: detailSheet.number,
                        type: contingencyItem.type,
                        quantity: new Decimal(0),
                        total: contingencyItem.quantity,
                        rate: contingencyItem.rate,
                        certifiedForemanRate:
                            contingencyItem.certifiedForemanRate,
                        description: contingencyItem.description,
                        quotations: detailSheet.quotations,
                        previousQuantity: sumMap(
                            action.invoices
                                .flatMap((invoice) => invoice.contingencyItems)
                                .filter(
                                    (item) =>
                                        item.contingencyItem ==
                                        contingencyItem.id.uuid
                                ),
                            (item) => item.quantity
                        ),
                        previousMoney: sumMap(
                            action.invoices
                                .flatMap((invoice) => invoice.contingencyItems)
                                .filter(
                                    (item) =>
                                        item.contingencyItem ==
                                        contingencyItem.id.uuid
                                ),
                            (item) =>
                                calcInvoiceContingencyItemDeltaAmount(item)
                        ),
                        projectDescription: contingencyItem.projectDescription,
                        materials: [],
                    }))
                ),
                holdback: calcProjectLienHoldbackRequired(action.project),
                options: action.detailSheets.flatMap((detailSheet) =>
                    detailSheet.schedules
                        .filter((schedule) => !schedule.price.isZero())
                        .map((schedule) => ({
                            id: schedule.id,
                            externalChangeOrderNumber: "",
                            name: schedule.name,
                            description: `${schedule.description}`,
                            quotations: detailSheet.quotations,
                            number: detailSheet.number,
                            total: schedule.price,
                            previous: determinePreviousAmount(
                                lastInvoice,
                                detailSheet,
                                schedule
                            ),
                            completed: determinePreviousAmount(
                                lastInvoice,
                                detailSheet,
                                schedule
                            ),
                            projectDescription: schedule.projectDescription,
                        }))
                ),
                engineered: data.engineeredProject,
            };
            return {
                data,
                state: {
                    ...state,
                    invoice: initializeEmbeddedRecordState(
                        InvoiceWidget,
                        newInvoice,
                        context,
                        true
                    ),
                },
            };
        }
        case "UNLOCK_INVOICE":
            return {
                data,
                state: {
                    ...state,
                    invoice: {
                        ...state.invoice!,
                        data: {
                            ...state.invoice!.data,
                            date: null,
                        },
                    },
                },
            };
        case "GENERATE_INVOICE":
            return {
                data: {
                    ...data,
                    customerSurveyMissing:
                        data.customerSurveyMissing ||
                        calcInvoiceIsComplete(action.invoice),
                    finalInvoiceDate:
                        data.finalInvoiceDate ||
                        calcInvoiceIsComplete(action.invoice)
                            ? action.invoice.date
                            : null,
                },
                state,
            };

        default:
            return baseReduce(state, data, action, context);
    }
}

export type ExtraActions =
    | {
          type: "START_INVOICE";
          user: UserPermissions;
          project: Project;
          invoices: Invoice[];
          detailSheets: DetailSheet[];
          quotations: Quotation[];
      }
    | {
          type: "GENERATE_INVOICE";
          user: string;
          invoice: Invoice;
      }
    | {
          type: "UNLOCK_INVOICE";
      };

function isInvoiceValid(invoice: Invoice, quickCache: QuickCacheApi) {
    return invoice.date !== null;
}

export function finalizeInvoice(data: Invoice, cache: QuickCacheApi) {
    return {
        ...data,
        date: data.date || new Date(),
    };
}

function ItemsList() {
    const props = React.useContext(ReactContext)!;

    const user = useUser();

    const invoices = useRecordQuery(
        INVOICE_META,
        {
            filters: [
                {
                    column: "project",
                    filter: {
                        equal: props.data.id.uuid,
                    },
                },
            ],
            sorts: ["number"],
        },
        []
    );

    const quotations = useProjectRecordQuery(
        QUOTATION_META,
        props.data.id.uuid
    );

    const detailSheets = useDraftProjectRecordQuery(
        DETAIL_SHEET_META,
        props.data.id.uuid
    );
    const dispatch = props.dispatch;

    const onClickNew = React.useCallback(
        () =>
            dispatch({
                type: "START_INVOICE",
                user: user,
                project: props.data,
                invoices: invoices!,
                detailSheets: detailSheets!,
                quotations: quotations!,
            }),
        [user, dispatch, props.data, invoices, detailSheets]
    );

    const quickCache = useQuickCache();

    const ungeneratedDetailSheet = detailSheets
        ? !every(detailSheets.map((detailSheet) => detailSheet.date !== null))
        : false;

    const allValid =
        invoices &&
        detailSheets &&
        !ungeneratedDetailSheet &&
        every(invoices.map((invoice) => isInvoiceValid(invoice, quickCache))) &&
        props.data.completion.date === null;

    return (
        <>
            {ungeneratedDetailSheet && (
                <Alert variant="primary">
                    A Detail Sheet needs to be generated
                </Alert>
            )}
            <ListGroup>
                {invoices &&
                    invoices.map((invoice) => (
                        <ListGroupItem
                            key={invoice.id.uuid}
                            style={{
                                display: "flex",
                            }}
                        >
                            <div style={{ width: "100%" }}>
                                <ShowSummary invoice={invoice} />
                            </div>
                            <Button
                                style={{
                                    marginLeft: "auto",
                                }}
                                onClick={() =>
                                    props.dispatch({
                                        type: "OPEN_INVOICE",
                                        invoice,
                                    })
                                }
                            >
                                Open
                            </Button>
                        </ListGroupItem>
                    ))}

                <ListGroupItem style={{ display: "flex" }}>
                    New Invoice
                    <Button
                        disabled={
                            !allValid ||
                            !quotations ||
                            !invoices ||
                            !detailSheets
                        }
                        style={{
                            marginLeft: "auto",
                        }}
                        onClick={onClickNew}
                    >
                        New
                    </Button>
                </ListGroupItem>
            </ListGroup>
        </>
    );
}

function Component(props: Props) {
    const user = useUser();

    const preSave = React.useCallback(
        (invoice) => {
            props.dispatch({
                type: "GENERATE_INVOICE",
                user: user.id,
                invoice: invoice,
            });
        },
        [user.id, props.dispatch]
    );

    return (
        <EmbeddedRecords
            invoice={{
                ...DATED_EMBEDDED,
                preSave,
                generateRequests: (invoice) => {
                    const requests = [];

                    if (!invoice.engineered) {
                        requests.push({
                            template: "invoice",
                        });
                    } else {
                        requests.push({
                            template: "engineeredInvoice",
                        });
                    }

                    if (
                        invoice.holdback &&
                        every(invoice.options, (option) =>
                            option.completed.equals(1)
                        )
                    ) {
                        requests.push({
                            template: "holdbackInvoice",
                        });
                    }

                    return requests;
                },
            }}
            mainTabLabel="Invoices"
        >
            <ItemsList />
        </EmbeddedRecords>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Embedded.invoice>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    invoice: EmbeddedRecordState<WidgetData<typeof Embedded.invoice>>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | {
          type: "INVOICE";
          action: EmbeddedRecordStateAction<
              WidgetData<typeof Embedded.invoice>
          >;
      }
    | { type: "OPEN_INVOICE"; invoice: WidgetData<typeof Embedded.invoice> }
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
        case "INVOICE": {
            const inner = embededRecordStateReduce(
                Embedded.invoice,
                state.invoice,
                action.action,
                context
            );
            return {
                state: { ...state, invoice: inner },
                data: data,
            };
        }
        case "OPEN_INVOICE": {
            return {
                state: {
                    ...state,
                    invoice: initializeEmbeddedRecordState(
                        Embedded.invoice,
                        action.invoice,
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
                    invoice: null,
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
        let invoiceState;
        {
            const inner = null;
            invoiceState = inner;
            data = data;
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            invoice: invoiceState,
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
                    case "invoice":
                        fetchRecord(
                            Embedded.invoice.dataMeta,
                            props.state.initialParameters[1]
                        ).then(
                            (record) =>
                                record &&
                                props.dispatch({
                                    type: "OPEN_INVOICE",
                                    invoice: record,
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
        if (state.invoice) {
            return ["invoice", state.invoice.data.id.uuid];
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
    invoice: EmbeddedRecordStateOptions<WidgetData<typeof Embedded.invoice>>;
    children: React.ReactNode;
    mainTabLabel: string;
    extraTabWidget?: React.ReactNode;
}) {
    const context = React.useContext(ReactContext)!;
    const invoiceDispatch = React.useCallback(
        (
            action: EmbeddedRecordStateAction<
                WidgetData<typeof Embedded.invoice>
            >
        ) => {
            context.dispatch({ type: "INVOICE", action });
        },
        [context.dispatch]
    );
    const invoice = useEmbeddedRecordState(
        Embedded.invoice,

        context.state.invoice,
        invoiceDispatch,
        context.status,
        props.invoice
    );
    return (
        <>
            <div {...TAB_STYLE}>{invoice.mainComponent || props.children}</div>
            <Pagination style={{ marginBottom: "0px" }}>
                <Pagination.Item
                    active={!invoice}
                    onClick={() => {
                        context.dispatch({ type: "RESET" });
                    }}
                >
                    {props.mainTabLabel}
                </Pagination.Item>
                {invoice.tabs}
                {props.extraTabWidget}
            </Pagination>
        </>
    );
}
// END MAGIC -- DO NOT EDIT
