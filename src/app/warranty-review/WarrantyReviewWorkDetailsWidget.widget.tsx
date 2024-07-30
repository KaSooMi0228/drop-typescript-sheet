import { faProjectDiagram } from "@fortawesome/free-solid-svg-icons";
import { format as formatDate } from "date-fns";
import Decimal from "decimal.js";
import { every } from "lodash";
import * as React from "react";
import { Button, ListGroup, ListGroupItem, Pagination } from "react-bootstrap";
import { fetchRecord, useRecordQuery } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { TAB_STYLE } from "../../clay/paginated-widget";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickCache } from "../../clay/quick-cache";
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
import {
    DATED_EMBEDDED,
    EmbeddedRecordState,
    EmbeddedRecordStateAction,
    EmbeddedRecordStateOptions,
    embededRecordStateReduce,
    initializeEmbeddedRecordState,
    useEmbeddedRecordState,
} from "../project/embedded-records";
import { Datum, Summary } from "../project/project-items";
import {
    WarrantyReview,
    WarrantyReviewDetailSheet,
    WARRANTY_REVIEW_DETAIL_SHEET_META,
    WARRANTY_REVIEW_META,
} from "./table";
import WarrantyReviewDetailSheetWidget from "./WarrantyReviewDetailSheetWidget";

export type Data = WarrantyReview;

export const Embedded = {
    detailSheet: WarrantyReviewDetailSheetWidget,
};

function ShowDetailSheetSummary(props: {
    detailSheet: WarrantyReviewDetailSheet;
}) {
    const cache = useQuickCache();

    return (
        <>
            <Summary
                title="Detail Sheet"
                icon={faProjectDiagram}
                valid={
                    WarrantyReviewDetailSheetWidget.validate(
                        props.detailSheet,
                        cache
                    ).length == 0
                }
                finalized={props.detailSheet.date !== null}
            >
                <Datum
                    label="Number"
                    value={
                        props.detailSheet.number?.isZero()
                            ? null
                            : props.detailSheet.number
                    }
                    format={(x) => x.toString()}
                />
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

function actionStartDetailSheet(state: State, data: Data) {
    const detailSheet: WarrantyReviewDetailSheet = {
        id: newUUID(),
        recordVersion: { version: null },
        addedByUser: null,
        addedDateTime: null,
        modifiedDateTime: null,
        firstDate: null,
        date: null,
        scheduledWorkDate: null,
        warrantyReview: data.id.uuid,
        certifiedForeman: null,
        manager: null,
        number: new Decimal(0),
        accessRequirements: [],
        requiredEquipment: [],
        customerAndProjectNotes: [],
        items: data.specificItems.map((item) => ({
            id: item.id,
            actionRequired: item.actionRequired,
            description: item.description,
            included: true,
        })),
        cfPayment: "",
        cfPaymentAmount: new Decimal("0.0"),
        cfRate: new Decimal(50.0),
        paymentSource: "",
        nonWarrantyItems: "",
        hasNonWarrantyItems: false,
        highlightedFinishSchedules: [],
    };
    return {
        data,
        state: {
            ...state,
            detailSheet: initializeEmbeddedRecordState(
                WarrantyReviewDetailSheetWidget,
                detailSheet,
                {},
                true
            ),
        },
    };
}

function ItemsList() {
    const props = React.useContext(ReactContext)!;

    const detailSheets =
        useRecordQuery(
            WARRANTY_REVIEW_DETAIL_SHEET_META,
            {
                filters: [
                    {
                        column: "warrantyReview",
                        filter: {
                            equal: props.data.id.uuid,
                        },
                    },
                ],
                sorts: ["number"],
            },
            []
        ) || [];

    const allValid = every(
        detailSheets.map((detailSheet) => detailSheet.date !== null)
    );

    const onClickNew = React.useCallback(
        () =>
            props.dispatch({
                type: "START_DETAIL_SHEET",
            }),
        [props.dispatch]
    );

    return (
        <ListGroup>
            {detailSheets.map((detailSheet) => (
                <ListGroupItem
                    key={detailSheet.id.uuid}
                    style={{
                        display: "flex",
                    }}
                >
                    <div style={{ width: "100%" }}>
                        <ShowDetailSheetSummary detailSheet={detailSheet} />
                    </div>
                    <Button
                        style={{
                            marginLeft: "auto",
                        }}
                        onClick={() =>
                            props.dispatch({
                                type: "OPEN_DETAIL_SHEET",
                                detailSheet,
                            })
                        }
                    >
                        Open
                    </Button>
                </ListGroupItem>
            ))}
            <ListGroupItem style={{ display: "flex" }}>
                New Detail Sheet
                <Button
                    disabled={!allValid}
                    style={{
                        marginLeft: "auto",
                    }}
                    onClick={onClickNew}
                >
                    New
                </Button>
            </ListGroupItem>
        </ListGroup>
    );
}

function Component(props: Props) {
    return (
        <EmbeddedRecords
            mainTabLabel="Detail Sheets"
            detailSheet={{
                ...DATED_EMBEDDED,
                generateRequests() {
                    return [
                        {
                            template: "warrantyReviewDetailSheet",
                        },
                    ];
                },
            }}
        >
            <ItemsList />
        </EmbeddedRecords>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Embedded.detailSheet>;
type ExtraProps = {};
type BaseState = {
    detailSheet: EmbeddedRecordState<WidgetData<typeof Embedded.detailSheet>>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
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
    | { type: "RESET" }
    | { type: "START_DETAIL_SHEET" };

export type Action = BaseAction;

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
        case "RESET": {
            return {
                state: {
                    ...state,
                    detailSheet: null,
                },
                data,
            };
        }
        case "START_DETAIL_SHEET":
            return actionStartDetailSheet(state, data);
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
    dataMeta: WARRANTY_REVIEW_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let detailSheetState;
        {
            const inner = null;
            detailSheetState = inner;
            data = data;
        }
        let state = {
            initialParameters: parameters,
            detailSheet: detailSheetState,
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
                }
            }
        }, [props.state.initialParameters]);
        return (
            <ReactContext.Provider value={props}>
                <RecordContext meta={WARRANTY_REVIEW_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
    encodeState: (state) => {
        if (state.detailSheet) {
            return ["detailSheet", state.detailSheet.data.id.uuid];
        }
        return [];
    },
};
export default Widget;
type Widgets = {};
function EmbeddedRecords(props: {
    detailSheet: EmbeddedRecordStateOptions<
        WidgetData<typeof Embedded.detailSheet>
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
    return (
        <>
            <div {...TAB_STYLE}>
                {detailSheet.mainComponent || props.children}
            </div>
            <Pagination style={{ marginBottom: "0px" }}>
                <Pagination.Item
                    active={!detailSheet}
                    onClick={() => {
                        context.dispatch({ type: "RESET" });
                    }}
                >
                    {props.mainTabLabel}
                </Pagination.Item>
                {detailSheet.tabs}
                {props.extraTabWidget}
            </Pagination>
        </>
    );
}
// END MAGIC -- DO NOT EDIT
