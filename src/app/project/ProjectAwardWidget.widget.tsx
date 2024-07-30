import * as React from "react";
import { ActionButton } from "../../clay/ActionButton";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../clay/quick-cache";
import { StaticDateTimeWidget } from "../../clay/widgets/DateTimeWidget";
import {
    FormField,
    FormWrapper,
    OptionalFormField,
} from "../../clay/widgets/FormField";
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
import { FieldRow } from "../../clay/widgets/layout";
import { ListWidget } from "../../clay/widgets/ListWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { RichTextWidget } from "../rich-text-widget";
import CompetitorDetailWidget from "./CompetitorDetailWidget.widget";
import { ProjectLostAwardShared } from "./projectLostAwardShared";
import { ReactContext as ProjectWidgetReactContext } from "./ProjectWidget.widget";
import { SeasonWidget } from "./SeasonWidget";
import { Project, PROJECT_META } from "./table";
import {
    AnticipatedDurationLinkWidget,
    ApprovalTypeLinkWidget,
} from "./types/link";
import { APPROVAL_TYPE_META } from "./types/table";

export type Data = Project;

export const Fields = {
    projectAwardDate: StaticDateTimeWidget,
    customerPurchaseOrderNumber: FormField(TextWidget),
    competitors: ListWidget(CompetitorDetailWidget, { emptyOk: true }),
    approvalType: FormField(ApprovalTypeLinkWidget),
    season: FormField(SeasonWidget),
    anticipatedDuration: FormField(AnticipatedDurationLinkWidget),
    contractAwardSpecialNeedsAndNotes: OptionalFormField(RichTextWidget),
    // Make sure any fields in this widget are reset in the handler for
    // CANCEL_AWARD_LOST at the project level
};

function validate(data: Project, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);

    const approvalType = cache.get(APPROVAL_TYPE_META, data.approvalType);
    if (approvalType) {
        return errors.filter((detail) => {
            switch (detail.field) {
                case "customerPurchaseOrderNumber":
                    return approvalType.requireCustomerPO;
                default:
                    return true;
            }
        });
    }

    return errors;
}

function Component(props: Props) {
    const projectContext = React.useContext(ProjectWidgetReactContext)!;

    const approvalType = useQuickRecord(
        APPROVAL_TYPE_META,
        props.data.approvalType
    );
    return (
        <>
            <ProjectLostAwardShared data={props.data} widgets={widgets} />
            <FormWrapper label="Contract Award Date">
                <div style={{ display: "flex" }}>
                    <widgets.projectAwardDate />
                    <div style={{ width: "1em" }} />
                    <ActionButton
                        status={props.status}
                        disabled={props.data.contractDetailsDate !== null}
                        onClick={() =>
                            projectContext.dispatch({
                                type: "CANCEL_AWARD_LOST",
                            })
                        }
                    >
                        Cancel
                    </ActionButton>
                </div>
            </FormWrapper>
            <FieldRow>
                <widgets.approvalType label="Type of Approval" />
                <widgets.customerPurchaseOrderNumber label="Customer PO #" />
            </FieldRow>
            <FieldRow>
                <widgets.season label="Work Season" />
                <widgets.anticipatedDuration />
            </FieldRow>
            <widgets.contractAwardSpecialNeedsAndNotes label="Contract Notes and Special Needs" />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.projectAwardDate> &
    WidgetContext<typeof Fields.customerPurchaseOrderNumber> &
    WidgetContext<typeof Fields.competitors> &
    WidgetContext<typeof Fields.approvalType> &
    WidgetContext<typeof Fields.season> &
    WidgetContext<typeof Fields.anticipatedDuration> &
    WidgetContext<typeof Fields.contractAwardSpecialNeedsAndNotes>;
type ExtraProps = {};
type BaseState = {
    projectAwardDate: WidgetState<typeof Fields.projectAwardDate>;
    customerPurchaseOrderNumber: WidgetState<
        typeof Fields.customerPurchaseOrderNumber
    >;
    competitors: WidgetState<typeof Fields.competitors>;
    approvalType: WidgetState<typeof Fields.approvalType>;
    season: WidgetState<typeof Fields.season>;
    anticipatedDuration: WidgetState<typeof Fields.anticipatedDuration>;
    contractAwardSpecialNeedsAndNotes: WidgetState<
        typeof Fields.contractAwardSpecialNeedsAndNotes
    >;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "PROJECT_AWARD_DATE";
          action: WidgetAction<typeof Fields.projectAwardDate>;
      }
    | {
          type: "CUSTOMER_PURCHASE_ORDER_NUMBER";
          action: WidgetAction<typeof Fields.customerPurchaseOrderNumber>;
      }
    | { type: "COMPETITORS"; action: WidgetAction<typeof Fields.competitors> }
    | {
          type: "APPROVAL_TYPE";
          action: WidgetAction<typeof Fields.approvalType>;
      }
    | { type: "SEASON"; action: WidgetAction<typeof Fields.season> }
    | {
          type: "ANTICIPATED_DURATION";
          action: WidgetAction<typeof Fields.anticipatedDuration>;
      }
    | {
          type: "CONTRACT_AWARD_SPECIAL_NEEDS_AND_NOTES";
          action: WidgetAction<typeof Fields.contractAwardSpecialNeedsAndNotes>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.projectAwardDate,
        data.projectAwardDate,
        cache,
        "projectAwardDate",
        errors
    );
    subvalidate(
        Fields.customerPurchaseOrderNumber,
        data.customerPurchaseOrderNumber,
        cache,
        "customerPurchaseOrderNumber",
        errors
    );
    subvalidate(
        Fields.competitors,
        data.competitors,
        cache,
        "competitors",
        errors
    );
    subvalidate(
        Fields.approvalType,
        data.approvalType,
        cache,
        "approvalType",
        errors
    );
    subvalidate(Fields.season, data.season, cache, "season", errors);
    subvalidate(
        Fields.anticipatedDuration,
        data.anticipatedDuration,
        cache,
        "anticipatedDuration",
        errors
    );
    subvalidate(
        Fields.contractAwardSpecialNeedsAndNotes,
        data.contractAwardSpecialNeedsAndNotes,
        cache,
        "contractAwardSpecialNeedsAndNotes",
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
        case "PROJECT_AWARD_DATE": {
            const inner = Fields.projectAwardDate.reduce(
                state.projectAwardDate,
                data.projectAwardDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectAwardDate: inner.state },
                data: { ...data, projectAwardDate: inner.data },
            };
        }
        case "CUSTOMER_PURCHASE_ORDER_NUMBER": {
            const inner = Fields.customerPurchaseOrderNumber.reduce(
                state.customerPurchaseOrderNumber,
                data.customerPurchaseOrderNumber,
                action.action,
                subcontext
            );
            return {
                state: { ...state, customerPurchaseOrderNumber: inner.state },
                data: { ...data, customerPurchaseOrderNumber: inner.data },
            };
        }
        case "COMPETITORS": {
            const inner = Fields.competitors.reduce(
                state.competitors,
                data.competitors,
                action.action,
                subcontext
            );
            return {
                state: { ...state, competitors: inner.state },
                data: { ...data, competitors: inner.data },
            };
        }
        case "APPROVAL_TYPE": {
            const inner = Fields.approvalType.reduce(
                state.approvalType,
                data.approvalType,
                action.action,
                subcontext
            );
            return {
                state: { ...state, approvalType: inner.state },
                data: { ...data, approvalType: inner.data },
            };
        }
        case "SEASON": {
            const inner = Fields.season.reduce(
                state.season,
                data.season,
                action.action,
                subcontext
            );
            return {
                state: { ...state, season: inner.state },
                data: { ...data, season: inner.data },
            };
        }
        case "ANTICIPATED_DURATION": {
            const inner = Fields.anticipatedDuration.reduce(
                state.anticipatedDuration,
                data.anticipatedDuration,
                action.action,
                subcontext
            );
            return {
                state: { ...state, anticipatedDuration: inner.state },
                data: { ...data, anticipatedDuration: inner.data },
            };
        }
        case "CONTRACT_AWARD_SPECIAL_NEEDS_AND_NOTES": {
            const inner = Fields.contractAwardSpecialNeedsAndNotes.reduce(
                state.contractAwardSpecialNeedsAndNotes,
                data.contractAwardSpecialNeedsAndNotes,
                action.action,
                subcontext
            );
            return {
                state: {
                    ...state,
                    contractAwardSpecialNeedsAndNotes: inner.state,
                },
                data: {
                    ...data,
                    contractAwardSpecialNeedsAndNotes: inner.data,
                },
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
    projectAwardDate: function (
        props: WidgetExtraProps<typeof Fields.projectAwardDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_AWARD_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "projectAwardDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectAwardDate.component
                state={context.state.projectAwardDate}
                data={context.data.projectAwardDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Award Date"}
            />
        );
    },
    customerPurchaseOrderNumber: function (
        props: WidgetExtraProps<typeof Fields.customerPurchaseOrderNumber> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CUSTOMER_PURCHASE_ORDER_NUMBER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "customerPurchaseOrderNumber",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.customerPurchaseOrderNumber.component
                state={context.state.customerPurchaseOrderNumber}
                data={context.data.customerPurchaseOrderNumber}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Customer Purchase Order Number"}
            />
        );
    },
    competitors: function (
        props: WidgetExtraProps<typeof Fields.competitors> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMPETITORS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "competitors", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.competitors.component
                state={context.state.competitors}
                data={context.data.competitors}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Competitors"}
            />
        );
    },
    approvalType: function (
        props: WidgetExtraProps<typeof Fields.approvalType> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "APPROVAL_TYPE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "approvalType", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.approvalType.component
                state={context.state.approvalType}
                data={context.data.approvalType}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Approval Type"}
            />
        );
    },
    season: function (
        props: WidgetExtraProps<typeof Fields.season> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SEASON",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "season", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.season.component
                state={context.state.season}
                data={context.data.season}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Season"}
            />
        );
    },
    anticipatedDuration: function (
        props: WidgetExtraProps<typeof Fields.anticipatedDuration> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ANTICIPATED_DURATION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "anticipatedDuration",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.anticipatedDuration.component
                state={context.state.anticipatedDuration}
                data={context.data.anticipatedDuration}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Anticipated Duration"}
            />
        );
    },
    contractAwardSpecialNeedsAndNotes: function (
        props: WidgetExtraProps<
            typeof Fields.contractAwardSpecialNeedsAndNotes
        > & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTRACT_AWARD_SPECIAL_NEEDS_AND_NOTES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "contractAwardSpecialNeedsAndNotes",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contractAwardSpecialNeedsAndNotes.component
                state={context.state.contractAwardSpecialNeedsAndNotes}
                data={context.data.contractAwardSpecialNeedsAndNotes}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contract Award Special Needs and Notes"}
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
        let projectAwardDateState;
        {
            const inner = Fields.projectAwardDate.initialize(
                data.projectAwardDate,
                subcontext,
                subparameters.projectAwardDate
            );
            projectAwardDateState = inner.state;
            data = { ...data, projectAwardDate: inner.data };
        }
        let customerPurchaseOrderNumberState;
        {
            const inner = Fields.customerPurchaseOrderNumber.initialize(
                data.customerPurchaseOrderNumber,
                subcontext,
                subparameters.customerPurchaseOrderNumber
            );
            customerPurchaseOrderNumberState = inner.state;
            data = { ...data, customerPurchaseOrderNumber: inner.data };
        }
        let competitorsState;
        {
            const inner = Fields.competitors.initialize(
                data.competitors,
                subcontext,
                subparameters.competitors
            );
            competitorsState = inner.state;
            data = { ...data, competitors: inner.data };
        }
        let approvalTypeState;
        {
            const inner = Fields.approvalType.initialize(
                data.approvalType,
                subcontext,
                subparameters.approvalType
            );
            approvalTypeState = inner.state;
            data = { ...data, approvalType: inner.data };
        }
        let seasonState;
        {
            const inner = Fields.season.initialize(
                data.season,
                subcontext,
                subparameters.season
            );
            seasonState = inner.state;
            data = { ...data, season: inner.data };
        }
        let anticipatedDurationState;
        {
            const inner = Fields.anticipatedDuration.initialize(
                data.anticipatedDuration,
                subcontext,
                subparameters.anticipatedDuration
            );
            anticipatedDurationState = inner.state;
            data = { ...data, anticipatedDuration: inner.data };
        }
        let contractAwardSpecialNeedsAndNotesState;
        {
            const inner = Fields.contractAwardSpecialNeedsAndNotes.initialize(
                data.contractAwardSpecialNeedsAndNotes,
                subcontext,
                subparameters.contractAwardSpecialNeedsAndNotes
            );
            contractAwardSpecialNeedsAndNotesState = inner.state;
            data = { ...data, contractAwardSpecialNeedsAndNotes: inner.data };
        }
        let state = {
            initialParameters: parameters,
            projectAwardDate: projectAwardDateState,
            customerPurchaseOrderNumber: customerPurchaseOrderNumberState,
            competitors: competitorsState,
            approvalType: approvalTypeState,
            season: seasonState,
            anticipatedDuration: anticipatedDurationState,
            contractAwardSpecialNeedsAndNotes:
                contractAwardSpecialNeedsAndNotesState,
        };
        return {
            state,
            data,
        };
    },
    validate: validate,
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
    projectAwardDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectAwardDate>
    >;
    customerPurchaseOrderNumber: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.customerPurchaseOrderNumber>
    >;
    competitors: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.competitors>
    >;
    approvalType: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.approvalType>
    >;
    season: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.season>
    >;
    anticipatedDuration: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.anticipatedDuration>
    >;
    contractAwardSpecialNeedsAndNotes: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contractAwardSpecialNeedsAndNotes>
    >;
};
// END MAGIC -- DO NOT EDIT
