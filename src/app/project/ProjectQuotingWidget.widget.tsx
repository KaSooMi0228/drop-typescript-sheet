import * as React from "react";
import { Button } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { PageContext } from "../../clay/Page";
import { PaginatedWidget } from "../../clay/paginated-widget";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { DateWidget } from "../../clay/widgets/DateWidget";
import { FormWrapper, OptionalFormField } from "../../clay/widgets/FormField";
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
import { useUser } from "../state";
import { EmailPopupButton } from "./email-popup";
import PendingQuoteHistoryRecordWidget from "./pending-quote-history/PendingQuoteHistoryRecordWidget.widget";
import { Project, PROJECT_META } from "./table";

export type Data = Project;

export const Fields = {
    pendingQuoteHistory: ListWidget(PendingQuoteHistoryRecordWidget, {
        emptyOk: true,
    }),
    nextMeetingDate: OptionalFormField(DateWidget),
};

/*export function actionProjectQuotingWidgetAddLikelihood(
    state: ProjectQuotingWidgetState,
    data: Project,
    date: Date,
    likelihood: Link<LandingLikelihood>
) {
    if (data.landingLikelihoodHistory.length == 0) {
        return {
            state,
            data: {
                ...data,
                landingLikelihoodHistory: [
                    {
                        date,
                        likelihood,
                    },
                ],
            },
        };
    } else {
        const lastDate =
            data.landingLikelihoodHistory[
                data.landingLikelihoodHistory.length - 1
            ].date;
        if (!lastDate || differenceInHours(date, lastDate) < 1) {
            return {
                state,
                data: {
                    ...data,
                    landingLikelihoodHistory: [
                        ...data.landingLikelihoodHistory.slice(
                            0,
                            data.landingLikelihoodHistory.length - 1
                        ),
                        {
                            date,
                            likelihood,
                        },
                    ],
                },
            };
        } else {
            return {
                state,
                data: {
                    ...data,
                    landingLikelihoodHistory: [
                        ...data.landingLikelihoodHistory,
                        {
                            date,
                            likelihood,
                        },
                    ],
                },
            };
        }
    }
}*/

function Component(props: Props) {
    const user = useUser();

    const myRef = React.useRef<HTMLDivElement | null>(null);

    React.useLayoutEffect(() => {
        if (myRef.current) {
            myRef.current.scrollBy(0, myRef.current.scrollHeight);
        }
    }, []);

    const onClickAddPendingQuoteUpdate = React.useCallback(() => {
        props.dispatch({
            type: "PENDING_QUOTE_HISTORY",
            action: {
                type: "NEW",
                actions: [
                    {
                        type: "PREPARE",
                        user: user.id,
                    },
                ],
            },
        });
    }, [props.dispatch, user.id]);

    return (
        <>
            <div
                style={{
                    display: "flex",
                    marginBottom: "1em",
                }}
            >
                <FormWrapper label="">
                    <EmailPopupButton
                        subject=""
                        project={props.data}
                        prefix="follow-up-"
                    >
                        Send Follow-up Email
                    </EmailPopupButton>
                </FormWrapper>
                <FormWrapper label="">
                    <Button
                        onClick={onClickAddPendingQuoteUpdate}
                        style={{ marginRight: "20px" }}
                    >
                        Update Pending Status
                    </Button>
                </FormWrapper>
                <widgets.nextMeetingDate />
            </div>
            <widgets.pendingQuoteHistory reversed />
        </>
    );
}

export const SummaryTabsWidget = PaginatedWidget<Project, PageContext>({
    dataMeta: PROJECT_META,
    pages() {
        return [
            {
                id: "summary",
                title: "Summary",
                widget: Widget,
            },
        ];
    },
});

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.pendingQuoteHistory> &
    WidgetContext<typeof Fields.nextMeetingDate>;
type ExtraProps = {};
type BaseState = {
    pendingQuoteHistory: WidgetState<typeof Fields.pendingQuoteHistory>;
    nextMeetingDate: WidgetState<typeof Fields.nextMeetingDate>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "PENDING_QUOTE_HISTORY";
          action: WidgetAction<typeof Fields.pendingQuoteHistory>;
      }
    | {
          type: "NEXT_MEETING_DATE";
          action: WidgetAction<typeof Fields.nextMeetingDate>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.pendingQuoteHistory,
        data.pendingQuoteHistory,
        cache,
        "pendingQuoteHistory",
        errors
    );
    subvalidate(
        Fields.nextMeetingDate,
        data.nextMeetingDate,
        cache,
        "nextMeetingDate",
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
        case "PENDING_QUOTE_HISTORY": {
            const inner = Fields.pendingQuoteHistory.reduce(
                state.pendingQuoteHistory,
                data.pendingQuoteHistory,
                action.action,
                subcontext
            );
            return {
                state: { ...state, pendingQuoteHistory: inner.state },
                data: { ...data, pendingQuoteHistory: inner.data },
            };
        }
        case "NEXT_MEETING_DATE": {
            const inner = Fields.nextMeetingDate.reduce(
                state.nextMeetingDate,
                data.nextMeetingDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, nextMeetingDate: inner.state },
                data: { ...data, nextMeetingDate: inner.data },
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
    pendingQuoteHistory: function (
        props: WidgetExtraProps<typeof Fields.pendingQuoteHistory> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PENDING_QUOTE_HISTORY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "pendingQuoteHistory",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.pendingQuoteHistory.component
                state={context.state.pendingQuoteHistory}
                data={context.data.pendingQuoteHistory}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Pending Quote History"}
            />
        );
    },
    nextMeetingDate: function (
        props: WidgetExtraProps<typeof Fields.nextMeetingDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "NEXT_MEETING_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "nextMeetingDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.nextMeetingDate.component
                state={context.state.nextMeetingDate}
                data={context.data.nextMeetingDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Next Meeting Date"}
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
        let pendingQuoteHistoryState;
        {
            const inner = Fields.pendingQuoteHistory.initialize(
                data.pendingQuoteHistory,
                subcontext,
                subparameters.pendingQuoteHistory
            );
            pendingQuoteHistoryState = inner.state;
            data = { ...data, pendingQuoteHistory: inner.data };
        }
        let nextMeetingDateState;
        {
            const inner = Fields.nextMeetingDate.initialize(
                data.nextMeetingDate,
                subcontext,
                subparameters.nextMeetingDate
            );
            nextMeetingDateState = inner.state;
            data = { ...data, nextMeetingDate: inner.data };
        }
        let state = {
            initialParameters: parameters,
            pendingQuoteHistory: pendingQuoteHistoryState,
            nextMeetingDate: nextMeetingDateState,
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
    pendingQuoteHistory: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.pendingQuoteHistory>
    >;
    nextMeetingDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.nextMeetingDate>
    >;
};
// END MAGIC -- DO NOT EDIT
