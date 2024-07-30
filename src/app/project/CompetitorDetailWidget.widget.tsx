import React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../clay/quick-cache";
import { CheckboxWidget } from "../../clay/widgets/CheckboxWidget";
import { DecimalDefaultWidget } from "../../clay/widgets/DecimalDefaultWidget";
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
    WidgetExtraProps,
    WidgetProps,
    WidgetResult,
    WidgetState,
    WidgetStatus,
} from "../../clay/widgets/index";
import { QuantityWidget } from "../../clay/widgets/number-widget";
import { TableRow } from "../../clay/widgets/TableRow";
import {
    calcQuotationExpectedContractValue,
    QUOTATION_META,
} from "../quotation/table";
import { ReactContext as ProjectWidgetReactContext } from "./ProjectWidget.widget";
import { CompetitorDetail, COMPETITOR_DETAIL_META } from "./table";
import { CompetitorLinkWidget } from "./types/link";

export type Data = CompetitorDetail;
export const Fields = {
    bidRanking: Optional(QuantityWidget),
    competitor: CompetitorLinkWidget,
    bid: DecimalDefaultWidget,
    percentageOfRemdal: DecimalDefaultWidget,
    successfulBidder: CheckboxWidget,
};

function Component(props: Props) {
    const projectContext = React.useContext(ProjectWidgetReactContext);

    const quotation = useQuickRecord(
        QUOTATION_META,
        projectContext?.data.selectedQuotation || null
    );

    const expectedContractValue =
        React.useMemo(
            () => quotation && calcQuotationExpectedContractValue(quotation),
            [quotation]
        ) || null;

    return (
        <TableRow flexSizes>
            <widgets.bidRanking />
            <widgets.competitor />
            <widgets.bid
                defaultData={
                    props.data.percentageOfRemdal &&
                    expectedContractValue &&
                    props.data.percentageOfRemdal.times(expectedContractValue)
                }
                money
                clearable
            />
            <widgets.percentageOfRemdal
                defaultData={
                    props.data.bid &&
                    expectedContractValue &&
                    props.data.bid
                        .dividedBy(expectedContractValue)
                        .toDecimalPlaces(4)
                }
                percentage
                clearable
            />
            <widgets.successfulBidder />
        </TableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.bidRanking> &
    WidgetContext<typeof Fields.competitor> &
    WidgetContext<typeof Fields.bid> &
    WidgetContext<typeof Fields.percentageOfRemdal> &
    WidgetContext<typeof Fields.successfulBidder>;
type ExtraProps = {};
type BaseState = {
    bidRanking: WidgetState<typeof Fields.bidRanking>;
    competitor: WidgetState<typeof Fields.competitor>;
    bid: WidgetState<typeof Fields.bid>;
    percentageOfRemdal: WidgetState<typeof Fields.percentageOfRemdal>;
    successfulBidder: WidgetState<typeof Fields.successfulBidder>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "BID_RANKING"; action: WidgetAction<typeof Fields.bidRanking> }
    | { type: "COMPETITOR"; action: WidgetAction<typeof Fields.competitor> }
    | { type: "BID"; action: WidgetAction<typeof Fields.bid> }
    | {
          type: "PERCENTAGE_OF_REMDAL";
          action: WidgetAction<typeof Fields.percentageOfRemdal>;
      }
    | {
          type: "SUCCESSFUL_BIDDER";
          action: WidgetAction<typeof Fields.successfulBidder>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.bidRanking,
        data.bidRanking,
        cache,
        "bidRanking",
        errors
    );
    subvalidate(
        Fields.competitor,
        data.competitor,
        cache,
        "competitor",
        errors
    );
    subvalidate(Fields.bid, data.bid, cache, "bid", errors);
    subvalidate(
        Fields.percentageOfRemdal,
        data.percentageOfRemdal,
        cache,
        "percentageOfRemdal",
        errors
    );
    subvalidate(
        Fields.successfulBidder,
        data.successfulBidder,
        cache,
        "successfulBidder",
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
        case "BID_RANKING": {
            const inner = Fields.bidRanking.reduce(
                state.bidRanking,
                data.bidRanking,
                action.action,
                subcontext
            );
            return {
                state: { ...state, bidRanking: inner.state },
                data: { ...data, bidRanking: inner.data },
            };
        }
        case "COMPETITOR": {
            const inner = Fields.competitor.reduce(
                state.competitor,
                data.competitor,
                action.action,
                subcontext
            );
            return {
                state: { ...state, competitor: inner.state },
                data: { ...data, competitor: inner.data },
            };
        }
        case "BID": {
            const inner = Fields.bid.reduce(
                state.bid,
                data.bid,
                action.action,
                subcontext
            );
            return {
                state: { ...state, bid: inner.state },
                data: { ...data, bid: inner.data },
            };
        }
        case "PERCENTAGE_OF_REMDAL": {
            const inner = Fields.percentageOfRemdal.reduce(
                state.percentageOfRemdal,
                data.percentageOfRemdal,
                action.action,
                subcontext
            );
            return {
                state: { ...state, percentageOfRemdal: inner.state },
                data: { ...data, percentageOfRemdal: inner.data },
            };
        }
        case "SUCCESSFUL_BIDDER": {
            const inner = Fields.successfulBidder.reduce(
                state.successfulBidder,
                data.successfulBidder,
                action.action,
                subcontext
            );
            return {
                state: { ...state, successfulBidder: inner.state },
                data: { ...data, successfulBidder: inner.data },
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
    bidRanking: function (
        props: WidgetExtraProps<typeof Fields.bidRanking> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "BID_RANKING",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "bidRanking", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.bidRanking.component
                state={context.state.bidRanking}
                data={context.data.bidRanking}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Bid Ranking"}
            />
        );
    },
    competitor: function (
        props: WidgetExtraProps<typeof Fields.competitor> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMPETITOR",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "competitor", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.competitor.component
                state={context.state.competitor}
                data={context.data.competitor}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Competitor"}
            />
        );
    },
    bid: function (
        props: WidgetExtraProps<typeof Fields.bid> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "BID", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "bid", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.bid.component
                state={context.state.bid}
                data={context.data.bid}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Bid"}
            />
        );
    },
    percentageOfRemdal: function (
        props: WidgetExtraProps<typeof Fields.percentageOfRemdal> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PERCENTAGE_OF_REMDAL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "percentageOfRemdal",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.percentageOfRemdal.component
                state={context.state.percentageOfRemdal}
                data={context.data.percentageOfRemdal}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Percentage of Remdal"}
            />
        );
    },
    successfulBidder: function (
        props: WidgetExtraProps<typeof Fields.successfulBidder> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SUCCESSFUL_BIDDER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "successfulBidder", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.successfulBidder.component
                state={context.state.successfulBidder}
                data={context.data.successfulBidder}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Successful Bidder"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: COMPETITOR_DETAIL_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let bidRankingState;
        {
            const inner = Fields.bidRanking.initialize(
                data.bidRanking,
                subcontext,
                subparameters.bidRanking
            );
            bidRankingState = inner.state;
            data = { ...data, bidRanking: inner.data };
        }
        let competitorState;
        {
            const inner = Fields.competitor.initialize(
                data.competitor,
                subcontext,
                subparameters.competitor
            );
            competitorState = inner.state;
            data = { ...data, competitor: inner.data };
        }
        let bidState;
        {
            const inner = Fields.bid.initialize(
                data.bid,
                subcontext,
                subparameters.bid
            );
            bidState = inner.state;
            data = { ...data, bid: inner.data };
        }
        let percentageOfRemdalState;
        {
            const inner = Fields.percentageOfRemdal.initialize(
                data.percentageOfRemdal,
                subcontext,
                subparameters.percentageOfRemdal
            );
            percentageOfRemdalState = inner.state;
            data = { ...data, percentageOfRemdal: inner.data };
        }
        let successfulBidderState;
        {
            const inner = Fields.successfulBidder.initialize(
                data.successfulBidder,
                subcontext,
                subparameters.successfulBidder
            );
            successfulBidderState = inner.state;
            data = { ...data, successfulBidder: inner.data };
        }
        let state = {
            initialParameters: parameters,
            bidRanking: bidRankingState,
            competitor: competitorState,
            bid: bidState,
            percentageOfRemdal: percentageOfRemdalState,
            successfulBidder: successfulBidderState,
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
                <RecordContext meta={COMPETITOR_DETAIL_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    bidRanking: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.bidRanking>
    >;
    competitor: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.competitor>
    >;
    bid: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.bid>
    >;
    percentageOfRemdal: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.percentageOfRemdal>
    >;
    successfulBidder: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.successfulBidder>
    >;
};
// END MAGIC -- DO NOT EDIT
