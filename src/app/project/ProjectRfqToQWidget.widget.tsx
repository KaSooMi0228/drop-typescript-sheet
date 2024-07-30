import * as React from "react";
import { Button, Table } from "react-bootstrap";
import { useQuery } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { Link } from "../../clay/link";
import { longDate } from "../../clay/LocalDate";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickCache } from "../../clay/quick-cache";
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
import { ListWidget } from "../../clay/widgets/ListWidget";
import { emptyContactDetail } from "../contact/table";
import { useUser } from "../state";
import { ROLE_ESTIMATOR, User, USER_META } from "../user/table";
import ScheduledSiteVisitWidget from "./ScheduledSiteVisitWidget.widget";
import { Project, PROJECT_META } from "./table";

export type Data = Project;

export const Fields = {
    scheduledSiteVisits: ListWidget(ScheduledSiteVisitWidget, {
        emptyOk: true,
    }),
};

function actionScheduleSiteVisit(
    state: State,
    data: Project,
    user: Link<User>
) {
    const inner = ScheduledSiteVisitWidget.initialize(
        {
            user,
            addedDateTime: new Date(),
            scheduledDateTime: null,
            contact: emptyContactDetail(),
        },
        {}
    );

    return {
        state: {
            ...state,
            scheduledSiteVisits: {
                ...state.scheduledSiteVisits,
                items: [...state.scheduledSiteVisits.items, inner.state],
            },
        },
        data: {
            ...data,
            scheduledSiteVisits: [...data.scheduledSiteVisits, inner.data],
        },
    };
}

function Component(props: Props) {
    const cache = useQuickCache();
    const user = useUser();
    const estimates =
        useQuery(
            {
                tableName: "Estimate",
                columns: ["id", "common.user", "common.creationDate"],
                filters: [
                    {
                        column: "common.project",
                        filter: {
                            equal: props.data.id.uuid,
                        },
                    },
                    {
                        column: "common.change",
                        filter: {
                            equal: false,
                        },
                    },
                ],
            },
            [props.data.id.uuid]
        ) || [];
    const quotations =
        useQuery(
            {
                tableName: "Quotation",
                columns: ["id", "user", "date"],
                filters: [
                    {
                        column: "project",
                        filter: {
                            equal: props.data.id.uuid,
                        },
                    },
                    {
                        column: "date",
                        filter: {
                            not_equal: null,
                        },
                    },
                    {
                        column: "change",
                        filter: {
                            equal: false,
                        },
                    },
                ],
            },
            [props.data.id.uuid]
        ) || [];
    const entries = [];

    for (const entry of props.data.personnel) {
        if (entry.role === ROLE_ESTIMATOR) {
            if (entry.acceptedDate || entry.accepted) {
                entries.push({
                    date:
                        entry.acceptedDate ||
                        entry.assignedDate ||
                        props.data.quoteRequestDate,
                    component: (
                        <tr key={entry.role + "-" + entry.user + "-x"}>
                            <th>RFQ Accepted By</th>
                            <td>{cache.get(USER_META, entry.user)?.name}</td>
                            <td>{longDate(entry.acceptedDate)}</td>
                        </tr>
                    ),
                });
            }
            entries.push({
                date: entry.assignedDate || props.data.quoteRequestDate,
                component: (
                    <tr key={entry.role + "-" + entry.user}>
                        <th>RFQ Assigned to</th>
                        <td>{cache.get(USER_META, entry.user)?.name}</td>
                        <td>{longDate(entry.assignedDate)}</td>
                    </tr>
                ),
            });
        }
    }

    const lates = useQuery(
        {
            tableName: "QuotationLateRecord",
            columns: ["addedDateTime"],
            filters: [
                {
                    column: "project",
                    filter: {
                        equal: props.data.id.uuid,
                    },
                },
                {
                    column: "late",
                    filter: {
                        equal: true,
                    },
                },
            ],
        },
        [props.data.id.uuid]
    );

    for (const late of lates || []) {
        const date = late[0] ? new Date(late[0] as string) : null;
        entries.push({
            date,
            component: (
                <tr key={"late-" + date}>
                    <th>Late Quotation Notice Sent to Estimator</th>
                    <td></td>
                    <td>{longDate(date)}</td>
                </tr>
            ),
        });
    }

    for (const estimate of estimates) {
        const [id, user, date_] = estimate as [string, string, string | null];
        const date = date_ ? new Date(date_) : null;
        entries.push({
            date,
            component: (
                <tr key={id}>
                    <th>Estimate Started On</th>
                    <td>{cache.get(USER_META, user)?.name}</td>
                    <td>{longDate(date)}</td>
                </tr>
            ),
        });
    }

    for (const quotation of quotations) {
        const [id, user, date_] = quotation as [string, string, string | null];
        const date = date_ ? new Date(date_) : null;
        entries.push({
            date,
            component: (
                <tr key={id}>
                    <th>Quotation submitted on</th>
                    <td>{cache.get(USER_META, user)?.name}</td>
                    <td>{longDate(date)}</td>
                </tr>
            ),
        });
    }

    for (
        let index = 0;
        index < props.data.pendingQuoteHistory.length;
        index++
    ) {
        const record = props.data.pendingQuoteHistory[index];
        if (
            record.landingLikelihood === "d97b9b36-7a34-47a3-9cca-71cc4294c9fd"
        ) {
            entries.push({
                date: record.date,
                component: (
                    <tr key={"pqh-" + index}>
                        <th>Re-estimating</th>
                        <td>{cache.get(USER_META, record.user)?.name}</td>
                        <td>{longDate(record.date)}</td>
                    </tr>
                ),
            });
        }
    }

    for (let index = 0; index < props.data.estimateDelays.length; index++) {
        const record = props.data.estimateDelays[index];
        entries.push({
            date: record.addedDate,
            component: (
                <tr key={"ed-" + index}>
                    <th>Quotation Delayed</th>
                    <td>{cache.get(USER_META, record.user)?.name}</td>
                    <td>{longDate(record.addedDate)}</td>
                    <td>{record.message}</td>
                </tr>
            ),
        });
    }

    if (props.data.projectAwardDate != null) {
        entries.push({
            date: props.data.projectAwardDate,
            component: (
                <tr key="awarded">
                    <th>Project Awarded</th>
                    <td></td>
                    <td>{longDate(props.data.projectAwardDate)}</td>
                </tr>
            ),
        });
    }
    if (props.data.projectLostDate != null) {
        entries.push({
            date: props.data.projectLostDate,
            component: (
                <tr key="awarded">
                    <th>Project Lost</th>
                    <td></td>
                    <td>{longDate(props.data.projectLostDate)}</td>
                </tr>
            ),
        });
    }

    for (
        let index = 0;
        index < props.data.scheduledSiteVisits.length;
        index++
    ) {
        const scheduledSiteVisit = props.data.scheduledSiteVisits[index];
        entries.push({
            date: scheduledSiteVisit.addedDateTime,
            component: (
                <ScheduledSiteVisitWidget.component
                    data={scheduledSiteVisit}
                    state={props.state.scheduledSiteVisits.items[index]}
                    dispatch={(action) =>
                        props.dispatch({
                            type: "SCHEDULED_SITE_VISITS",
                            action: {
                                type: "ITEM",
                                index,
                                action,
                            },
                        })
                    }
                    status={subStatus(
                        subStatus(props.status, "scheduledSiteVisit"),
                        `${index}`
                    )}
                />
            ),
        });
    }

    entries.sort((x, y) => {
        if (x.date == null) {
            return -1;
        } else if (y.date == null) {
            return 1;
        } else if (x.date < y.date) {
            return -1;
        } else if (x.date > y.date) {
            return 1;
        } else {
            return 0;
        }
    });

    return (
        <>
            <Table>
                <tbody>
                    <tr>
                        <th>RFQ Entered By</th>
                        <td>
                            {
                                cache.get(
                                    USER_META,
                                    props.data.quoteRequestCompletedBy
                                )?.name
                            }
                        </td>
                        <td>{longDate(props.data.quoteRequestDate)}</td>
                    </tr>
                    {entries.map((entry) => entry.component)}
                    {props.status.mutable && (
                        <tr>
                            <td colSpan={2}>
                                <Button
                                    onClick={() =>
                                        props.dispatch({
                                            type: "SCHEDULE_SITE_VISIT",
                                            user: user.id,
                                        })
                                    }
                                >
                                    Schedule Site Visit
                                </Button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.scheduledSiteVisits>;
type ExtraProps = {};
type BaseState = {
    scheduledSiteVisits: WidgetState<typeof Fields.scheduledSiteVisits>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "SCHEDULED_SITE_VISITS";
          action: WidgetAction<typeof Fields.scheduledSiteVisits>;
      }
    | { type: "SCHEDULE_SITE_VISIT"; user: Link<User> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.scheduledSiteVisits,
        data.scheduledSiteVisits,
        cache,
        "scheduledSiteVisits",
        errors
    );
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
        case "SCHEDULED_SITE_VISITS": {
            const inner = Fields.scheduledSiteVisits.reduce(
                state.scheduledSiteVisits,
                data.scheduledSiteVisits,
                action.action,
                subcontext
            );
            return {
                state: { ...state, scheduledSiteVisits: inner.state },
                data: { ...data, scheduledSiteVisits: inner.data },
            };
        }
        case "SCHEDULE_SITE_VISIT":
            return actionScheduleSiteVisit(state, data, action.user);
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
    scheduledSiteVisits: function (
        props: WidgetExtraProps<typeof Fields.scheduledSiteVisits> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SCHEDULED_SITE_VISITS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "scheduledSiteVisits",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.scheduledSiteVisits.component
                state={context.state.scheduledSiteVisits}
                data={context.data.scheduledSiteVisits}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Scheduled Site Visits"}
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
        let scheduledSiteVisitsState;
        {
            const inner = Fields.scheduledSiteVisits.initialize(
                data.scheduledSiteVisits,
                subcontext,
                subparameters.scheduledSiteVisits
            );
            scheduledSiteVisitsState = inner.state;
            data = { ...data, scheduledSiteVisits: inner.data };
        }
        let state = {
            initialParameters: parameters,
            scheduledSiteVisits: scheduledSiteVisitsState,
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
    scheduledSiteVisits: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.scheduledSiteVisits>
    >;
};
// END MAGIC -- DO NOT EDIT
