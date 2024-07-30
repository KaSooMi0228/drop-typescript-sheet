import * as React from "react";
import { Dictionary } from "../../clay/common";
import { DeleteButton } from "../../clay/delete-button";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../clay/quick-cache";
import { DateWidget } from "../../clay/widgets/DateWidget";
import { FormField, FormWrapper, Optional } from "../../clay/widgets/FormField";
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
import { StaticTextField } from "../../clay/widgets/TextWidget";
import { hasPermission } from "../../permissions";
import { calcAddressLineFormatted } from "../address";
import { PersonnelListWidget } from "../project/personnel/list-widget";
import { ManageRoles } from "../project/ProjectRolesWidget.widget";
import { PROJECT_META } from "../project/table";
import { RichTextWidget } from "../rich-text-widget";
import { useUser } from "../state";
import UserAndDateWidget from "../user-and-date/UserAndDateWidget.widget";
import {
    calcWarrantyReviewHasCoveredItems,
    calcWarrantyReviewHasProjectManager,
    WarrantyReview,
    WARRANTY_REVIEW_META,
} from "./table";

export type Data = WarrantyReview;

export const Fields = {
    dueDate: FormField(DateWidget),
    remediationWorkDueDate: FormField(DateWidget),
    personnel: PersonnelListWidget,
    cancelled: Optional(UserAndDateWidget),
    cancellationReason: FormField(RichTextWidget),
};

function validate(review: WarrantyReview, cache: QuickCacheApi) {
    const errors = baseValidate(review, cache);
    const hasProjectManager = calcWarrantyReviewHasProjectManager(review);
    return errors.filter((error) => {
        switch (error.field) {
            case "cancellationReason":
                return review.cancelled.date !== null;
            case "remediationWorkDueDate":
                return hasProjectManager;
            default:
                return true;
        }
    });
}

function Component(props: Props) {
    const project = useQuickRecord(PROJECT_META, props.data.project);
    const user = useUser();

    const showRemediationDate =
        calcWarrantyReviewHasCoveredItems(props.data) ||
        calcWarrantyReviewHasProjectManager(props.data);

    return (
        <>
            <FormWrapper label="Site Address">
                {project && (
                    <StaticTextField
                        value={calcAddressLineFormatted(project.siteAddress)}
                    />
                )}
            </FormWrapper>
            <ManageRoles
                personnel={props.data.personnel}
                dispatch={props.dispatch}
                status={props.status}
            />

            <FieldRow>
                <widgets.dueDate label="Warranty Review Due Date" />
                {showRemediationDate && <widgets.remediationWorkDueDate />}
            </FieldRow>
            {props.data.cancelled.date !== null && (
                <>
                    <FormWrapper label="Cancelled by">
                        <widgets.cancelled
                            setLabel="Cancel Warranty Review"
                            disableSet={
                                !hasPermission(user, "WarrantyReview", "cancel")
                            }
                            enableReset={hasPermission(
                                user,
                                "WarrantyReview",
                                "cancel"
                            )}
                        />
                    </FormWrapper>
                    <widgets.cancellationReason />
                </>
            )}

            <div style={{ display: "flex" }}>
                {props.data.cancelled.date === null && (
                    <div style={{ marginRight: "1em" }}>
                        <widgets.cancelled
                            setLabel="Cancel Warranty Review"
                            disableSet={
                                !hasPermission(user, "WarrantyReview", "cancel")
                            }
                        />
                    </div>
                )}
                <DeleteButton label="Delete Warranty Review" />
            </div>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.dueDate> &
    WidgetContext<typeof Fields.remediationWorkDueDate> &
    WidgetContext<typeof Fields.personnel> &
    WidgetContext<typeof Fields.cancelled> &
    WidgetContext<typeof Fields.cancellationReason>;
type ExtraProps = {};
type BaseState = {
    dueDate: WidgetState<typeof Fields.dueDate>;
    remediationWorkDueDate: WidgetState<typeof Fields.remediationWorkDueDate>;
    personnel: WidgetState<typeof Fields.personnel>;
    cancelled: WidgetState<typeof Fields.cancelled>;
    cancellationReason: WidgetState<typeof Fields.cancellationReason>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "DUE_DATE"; action: WidgetAction<typeof Fields.dueDate> }
    | {
          type: "REMEDIATION_WORK_DUE_DATE";
          action: WidgetAction<typeof Fields.remediationWorkDueDate>;
      }
    | { type: "PERSONNEL"; action: WidgetAction<typeof Fields.personnel> }
    | { type: "CANCELLED"; action: WidgetAction<typeof Fields.cancelled> }
    | {
          type: "CANCELLATION_REASON";
          action: WidgetAction<typeof Fields.cancellationReason>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.dueDate, data.dueDate, cache, "dueDate", errors);
    subvalidate(
        Fields.remediationWorkDueDate,
        data.remediationWorkDueDate,
        cache,
        "remediationWorkDueDate",
        errors
    );
    subvalidate(Fields.personnel, data.personnel, cache, "personnel", errors);
    subvalidate(Fields.cancelled, data.cancelled, cache, "cancelled", errors);
    subvalidate(
        Fields.cancellationReason,
        data.cancellationReason,
        cache,
        "cancellationReason",
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
        case "DUE_DATE": {
            const inner = Fields.dueDate.reduce(
                state.dueDate,
                data.dueDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, dueDate: inner.state },
                data: { ...data, dueDate: inner.data },
            };
        }
        case "REMEDIATION_WORK_DUE_DATE": {
            const inner = Fields.remediationWorkDueDate.reduce(
                state.remediationWorkDueDate,
                data.remediationWorkDueDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, remediationWorkDueDate: inner.state },
                data: { ...data, remediationWorkDueDate: inner.data },
            };
        }
        case "PERSONNEL": {
            const inner = Fields.personnel.reduce(
                state.personnel,
                data.personnel,
                action.action,
                subcontext
            );
            return {
                state: { ...state, personnel: inner.state },
                data: { ...data, personnel: inner.data },
            };
        }
        case "CANCELLED": {
            const inner = Fields.cancelled.reduce(
                state.cancelled,
                data.cancelled,
                action.action,
                subcontext
            );
            return {
                state: { ...state, cancelled: inner.state },
                data: { ...data, cancelled: inner.data },
            };
        }
        case "CANCELLATION_REASON": {
            const inner = Fields.cancellationReason.reduce(
                state.cancellationReason,
                data.cancellationReason,
                action.action,
                subcontext
            );
            return {
                state: { ...state, cancellationReason: inner.state },
                data: { ...data, cancellationReason: inner.data },
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
    dueDate: function (
        props: WidgetExtraProps<typeof Fields.dueDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DUE_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "dueDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.dueDate.component
                state={context.state.dueDate}
                data={context.data.dueDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Due Date"}
            />
        );
    },
    remediationWorkDueDate: function (
        props: WidgetExtraProps<typeof Fields.remediationWorkDueDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "REMEDIATION_WORK_DUE_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "remediationWorkDueDate",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.remediationWorkDueDate.component
                state={context.state.remediationWorkDueDate}
                data={context.data.remediationWorkDueDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Remediation Work Due Date"}
            />
        );
    },
    personnel: function (
        props: WidgetExtraProps<typeof Fields.personnel> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PERSONNEL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "personnel", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.personnel.component
                state={context.state.personnel}
                data={context.data.personnel}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Personnel"}
            />
        );
    },
    cancelled: function (
        props: WidgetExtraProps<typeof Fields.cancelled> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CANCELLED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "cancelled", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.cancelled.component
                state={context.state.cancelled}
                data={context.data.cancelled}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Cancelled"}
            />
        );
    },
    cancellationReason: function (
        props: WidgetExtraProps<typeof Fields.cancellationReason> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CANCELLATION_REASON",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "cancellationReason",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.cancellationReason.component
                state={context.state.cancellationReason}
                data={context.data.cancellationReason}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Cancellation Reason"}
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
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let dueDateState;
        {
            const inner = Fields.dueDate.initialize(
                data.dueDate,
                subcontext,
                subparameters.dueDate
            );
            dueDateState = inner.state;
            data = { ...data, dueDate: inner.data };
        }
        let remediationWorkDueDateState;
        {
            const inner = Fields.remediationWorkDueDate.initialize(
                data.remediationWorkDueDate,
                subcontext,
                subparameters.remediationWorkDueDate
            );
            remediationWorkDueDateState = inner.state;
            data = { ...data, remediationWorkDueDate: inner.data };
        }
        let personnelState;
        {
            const inner = Fields.personnel.initialize(
                data.personnel,
                subcontext,
                subparameters.personnel
            );
            personnelState = inner.state;
            data = { ...data, personnel: inner.data };
        }
        let cancelledState;
        {
            const inner = Fields.cancelled.initialize(
                data.cancelled,
                subcontext,
                subparameters.cancelled
            );
            cancelledState = inner.state;
            data = { ...data, cancelled: inner.data };
        }
        let cancellationReasonState;
        {
            const inner = Fields.cancellationReason.initialize(
                data.cancellationReason,
                subcontext,
                subparameters.cancellationReason
            );
            cancellationReasonState = inner.state;
            data = { ...data, cancellationReason: inner.data };
        }
        let state = {
            initialParameters: parameters,
            dueDate: dueDateState,
            remediationWorkDueDate: remediationWorkDueDateState,
            personnel: personnelState,
            cancelled: cancelledState,
            cancellationReason: cancellationReasonState,
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
                <RecordContext meta={WARRANTY_REVIEW_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    dueDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.dueDate>
    >;
    remediationWorkDueDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.remediationWorkDueDate>
    >;
    personnel: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.personnel>
    >;
    cancelled: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.cancelled>
    >;
    cancellationReason: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.cancellationReason>
    >;
};
// END MAGIC -- DO NOT EDIT
