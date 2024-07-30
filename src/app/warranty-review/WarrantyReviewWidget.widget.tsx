import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { keyBy } from "lodash";
import * as React from "react";
import { Nav } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickCache } from "../../clay/quick-cache";
import { SaveButton } from "../../clay/save-button";
import {
    InitializeResult,
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
import { useUser } from "../state";
import { CONTENT_AREA } from "../styles";
import CompletionWidget from "./Completion.widget";
import InternalNotesWidget from "./internal-notes.widget";
import ScheduleWidget from "./ScheduleWidget.widget";
import { WarrantyReview, WARRANTY_REVIEW_META } from "./table";
import WarrantyReviewAssignmentWidget from "./WarrantyReviewAssignmentWidget.widget";
import WarrantyReviewProjectDetailsWidget from "./WarrantyReviewProjectDetailsWidget.widget";
import { WarrantyReviewReviewWidget } from "./WarrantyReviewSpecificItemsWidget.widget";
import WarrantyReviewWorkDetailsWidget from "./WarrantyReviewWorkDetailsWidget.widget";

export type Data = WarrantyReview;
export const WARRANTY_REVIEW_WIDGET_META = WARRANTY_REVIEW_META;
export type ExtraState = {
    tab: keyof typeof Subs;
};
export const Subs = {
    projectDetails: WarrantyReviewProjectDetailsWidget,
    internalNotes: InternalNotesWidget,
    assignment: WarrantyReviewAssignmentWidget,
    review: WarrantyReviewReviewWidget,
    schedule: ScheduleWidget,
    workDetails: WarrantyReviewWorkDetailsWidget,
    completion: CompletionWidget,
};

type ExtraActions = {
    type: "SELECT_TAB";
    tab: keyof typeof Subs;
};

function initialize(
    data: WarrantyReview,
    context: Context,
    parameters: string[] = []
): InitializeResult<ExtraState, WarrantyReview> {
    let state: ExtraState = {
        tab: (parameters[0] as any) || "projectDetails",
    };
    return {
        state,
        data,
        parameters: {
            [state.tab]: parameters.slice(1),
        },
    };
}

function encodeState(state: State) {
    const sub = Subs[state.tab];
    const innerEncoded = sub.encodeState
        ? sub.encodeState(state[state.tab] as any)
        : [];
    return [state.tab, ...innerEncoded];
}

function reduce(
    state: State,
    data: WarrantyReview,
    action: Action,
    context: Context
) {
    switch (action.type) {
        case "SELECT_TAB":
            const tabConfig = TAB_BY_KEY[action.tab];
            data = tabConfig.onOpen ? tabConfig.onOpen(data) : data;
            return {
                state: {
                    ...state,
                    tab: action.tab,
                },
                data,
            };
        default:
            return baseReduce(state, data, action, context);
    }
}

const TABS: {
    key: keyof typeof Subs;
    title: string;
    accessible: (
        project: WarrantyReview,
        validation: ValidationError[],
        cache: QuickCacheApi
    ) => boolean;
    hidden?: (project: WarrantyReview) => boolean;
    enforced?: (project: WarrantyReview) => boolean;
    onOpen?: (project: WarrantyReview) => WarrantyReview;
    permission?: string;
}[] = [
    {
        key: "projectDetails",
        title: "Project Details",
        accessible: (project) => true,
        enforced: () => true,
    },
    {
        key: "internalNotes",
        title: "Internal Notes",
        accessible: (review) => true,
        enforced: () => true,
    },
    {
        key: "assignment",
        title: "Assignment",
        accessible: (warranty) => true,
        enforced: () => true,
    },
    {
        key: "schedule",
        title: "Schedule",
        accessible: (warranty) => true,
        enforced: () => true,
    },
    {
        key: "review",
        title: "Review",
        accessible: (warranty) => warranty.scheduledDate !== null,
        enforced: (review) => review.reviewStarted,
        onOpen: (review) => {
            return {
                ...review,
                reviewStarted: true,
            };
        },
    },
    {
        key: "workDetails",
        title: "Work Details",
        accessible: (warranty) => warranty.reviewDate !== null,
        enforced: () => true,
    },
    {
        key: "completion",
        title: "Completion",
        accessible: (warranty, validation, cache) => {
            return !!cache.exists(
                `warranty-review-detail-sheet-${warranty.id.uuid}`,
                {
                    tableName: "WarrantyReviewDetailSheet",
                    columns: [],
                    filters: [
                        {
                            column: "warrantyReview",
                            filter: {
                                equal: warranty.id.uuid,
                            },
                        },
                    ],
                }
            );
        },
        enforced: () => true,
    },
];

export const WARRANTY_REVIEW_TABS = TABS;

const TAB_BY_KEY = keyBy(TABS, (tab) => tab.key);
function validate(data: Data, cache: QuickCacheApi) {
    if (data.cancelled.date !== null && data.cancellationReason != "") {
        return [];
    }
    const errors = baseValidate(data, cache);

    return errors.filter(
        (error) =>
            TAB_BY_KEY[error.field!].accessible(data, errors, cache) &&
            (TAB_BY_KEY[error.field!].enforced == undefined ||
                TAB_BY_KEY[error.field!].enforced!(data))
    );
}
function Component(props: Props) {
    const cache = useQuickCache();
    const user = useUser();
    const onSelectTab = React.useCallback(
        (tab: string | null) => {
            return props.dispatch({
                type: "SELECT_TAB",
                tab: tab as any,
            });
        },
        [props.dispatch]
    );

    const TabComponent = widgets[props.state.tab];

    return (
        <div
            style={{
                display: "flex",
                flexGrow: 1,
                overflowY: "auto",
            }}
        >
            <Nav
                variant="pills"
                activeKey={props.state.tab}
                className="flex-column"
                onSelect={onSelectTab}
                style={{ flexWrap: "nowrap", width: "10em" }}
            >
                {TABS.filter(
                    (tab) =>
                        (!tab.hidden || !tab.hidden(props.data)) &&
                        (!tab.permission ||
                            user.permissions.indexOf(tab.permission) !== -1)
                ).map((tab) => (
                    <Nav.Item key={tab.key}>
                        <Nav.Link
                            eventKey={tab.key}
                            disabled={
                                !tab.accessible(
                                    props.data,
                                    props.status.validation,
                                    cache
                                )
                            }
                            style={{
                                whiteSpace: "nowrap",
                            }}
                        >
                            {tab.title}{" "}
                            {subStatus(props.status, tab.key).validation
                                .length > 0 && (
                                <FontAwesomeIcon
                                    icon={faTimes}
                                    style={{ color: "red" }}
                                />
                            )}
                        </Nav.Link>
                    </Nav.Item>
                ))}
                <SaveButton style={{ marginTop: "auto", width: "100%" }} />
            </Nav>
            <div {...CONTENT_AREA} style={{ marginLeft: "10px" }}>
                <TabComponent />
            </div>
        </div>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Subs.projectDetails> &
    WidgetContext<typeof Subs.internalNotes> &
    WidgetContext<typeof Subs.assignment> &
    WidgetContext<typeof Subs.review> &
    WidgetContext<typeof Subs.schedule> &
    WidgetContext<typeof Subs.workDetails> &
    WidgetContext<typeof Subs.completion>;
type ExtraProps = {};
type BaseState = {
    projectDetails: WidgetState<typeof Subs.projectDetails>;
    internalNotes: WidgetState<typeof Subs.internalNotes>;
    assignment: WidgetState<typeof Subs.assignment>;
    review: WidgetState<typeof Subs.review>;
    schedule: WidgetState<typeof Subs.schedule>;
    workDetails: WidgetState<typeof Subs.workDetails>;
    completion: WidgetState<typeof Subs.completion>;
    initialParameters?: string[];
};
export type State = BaseState & ExtraState;

type BaseAction =
    | {
          type: "PROJECT_DETAILS";
          action: WidgetAction<typeof Subs.projectDetails>;
      }
    | {
          type: "INTERNAL_NOTES";
          action: WidgetAction<typeof Subs.internalNotes>;
      }
    | { type: "ASSIGNMENT"; action: WidgetAction<typeof Subs.assignment> }
    | { type: "REVIEW"; action: WidgetAction<typeof Subs.review> }
    | { type: "SCHEDULE"; action: WidgetAction<typeof Subs.schedule> }
    | { type: "WORK_DETAILS"; action: WidgetAction<typeof Subs.workDetails> }
    | { type: "COMPLETION"; action: WidgetAction<typeof Subs.completion> };

export type Action = ExtraActions | BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Subs.projectDetails, data, cache, "projectDetails", errors);
    subvalidate(Subs.internalNotes, data, cache, "internalNotes", errors);
    subvalidate(Subs.assignment, data, cache, "assignment", errors);
    subvalidate(Subs.review, data, cache, "review", errors);
    subvalidate(Subs.schedule, data, cache, "schedule", errors);
    subvalidate(Subs.workDetails, data, cache, "workDetails", errors);
    subvalidate(Subs.completion, data, cache, "completion", errors);
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
        case "PROJECT_DETAILS": {
            const inner = Subs.projectDetails.reduce(
                state.projectDetails,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectDetails: inner.state },
                data: inner.data,
            };
        }
        case "INTERNAL_NOTES": {
            const inner = Subs.internalNotes.reduce(
                state.internalNotes,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, internalNotes: inner.state },
                data: inner.data,
            };
        }
        case "ASSIGNMENT": {
            const inner = Subs.assignment.reduce(
                state.assignment,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, assignment: inner.state },
                data: inner.data,
            };
        }
        case "REVIEW": {
            const inner = Subs.review.reduce(
                state.review,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, review: inner.state },
                data: inner.data,
            };
        }
        case "SCHEDULE": {
            const inner = Subs.schedule.reduce(
                state.schedule,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, schedule: inner.state },
                data: inner.data,
            };
        }
        case "WORK_DETAILS": {
            const inner = Subs.workDetails.reduce(
                state.workDetails,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, workDetails: inner.state },
                data: inner.data,
            };
        }
        case "COMPLETION": {
            const inner = Subs.completion.reduce(
                state.completion,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, completion: inner.state },
                data: inner.data,
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
    projectDetails: function (
        props: WidgetExtraProps<typeof Subs.projectDetails> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_DETAILS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "projectDetails", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.projectDetails.component
                state={context.state.projectDetails}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Details"}
            />
        );
    },
    internalNotes: function (
        props: WidgetExtraProps<typeof Subs.internalNotes> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INTERNAL_NOTES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "internalNotes", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.internalNotes.component
                state={context.state.internalNotes}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Internal Notes"}
            />
        );
    },
    assignment: function (
        props: WidgetExtraProps<typeof Subs.assignment> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ASSIGNMENT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "assignment", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.assignment.component
                state={context.state.assignment}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Assignment"}
            />
        );
    },
    review: function (
        props: WidgetExtraProps<typeof Subs.review> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "REVIEW",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "review", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.review.component
                state={context.state.review}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Review"}
            />
        );
    },
    schedule: function (
        props: WidgetExtraProps<typeof Subs.schedule> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SCHEDULE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "schedule", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.schedule.component
                state={context.state.schedule}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Schedule"}
            />
        );
    },
    workDetails: function (
        props: WidgetExtraProps<typeof Subs.workDetails> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "WORK_DETAILS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "workDetails", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.workDetails.component
                state={context.state.workDetails}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Work Details"}
            />
        );
    },
    completion: function (
        props: WidgetExtraProps<typeof Subs.completion> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMPLETION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "completion", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.completion.component
                state={context.state.completion}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Completion"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WARRANTY_REVIEW_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        const result = initialize(data, context, parameters);
        data = result.data;
        let subparameters: Dictionary<string[]> =
            (result as any).parameters || {};
        let subcontext = context;
        let projectDetailsState;
        {
            const inner = Subs.projectDetails.initialize(
                data,
                subcontext,
                subparameters.projectDetails
            );
            projectDetailsState = inner.state;
            data = inner.data;
        }
        let internalNotesState;
        {
            const inner = Subs.internalNotes.initialize(
                data,
                subcontext,
                subparameters.internalNotes
            );
            internalNotesState = inner.state;
            data = inner.data;
        }
        let assignmentState;
        {
            const inner = Subs.assignment.initialize(
                data,
                subcontext,
                subparameters.assignment
            );
            assignmentState = inner.state;
            data = inner.data;
        }
        let reviewState;
        {
            const inner = Subs.review.initialize(
                data,
                subcontext,
                subparameters.review
            );
            reviewState = inner.state;
            data = inner.data;
        }
        let scheduleState;
        {
            const inner = Subs.schedule.initialize(
                data,
                subcontext,
                subparameters.schedule
            );
            scheduleState = inner.state;
            data = inner.data;
        }
        let workDetailsState;
        {
            const inner = Subs.workDetails.initialize(
                data,
                subcontext,
                subparameters.workDetails
            );
            workDetailsState = inner.state;
            data = inner.data;
        }
        let completionState;
        {
            const inner = Subs.completion.initialize(
                data,
                subcontext,
                subparameters.completion
            );
            completionState = inner.state;
            data = inner.data;
        }
        let state = {
            initialParameters: parameters,
            ...result.state,
            projectDetails: projectDetailsState,
            internalNotes: internalNotesState,
            assignment: assignmentState,
            review: reviewState,
            schedule: scheduleState,
            workDetails: workDetailsState,
            completion: completionState,
        };
        return {
            state,
            data,
        };
    },
    validate: validate,
    encodeState: encodeState,
    component: React.memo((props: Props) => {
        return (
            <ReactContext.Provider value={props}>
                <RecordContext meta={WARRANTY_REVIEW_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
};
export default Widget;
type Widgets = {
    projectDetails: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.projectDetails>
    >;
    internalNotes: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.internalNotes>
    >;
    assignment: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.assignment>
    >;
    review: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.review>
    >;
    schedule: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.schedule>
    >;
    workDetails: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.workDetails>
    >;
    completion: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.completion>
    >;
};
// END MAGIC -- DO NOT EDIT
