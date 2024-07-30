import { isNull } from "lodash";
import * as React from "react";
import { Button } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { Link } from "../../clay/link";
import { propCheck } from "../../clay/propCheck";
import { anyMap, isNotNull } from "../../clay/queryFuncs";
import { QuickCacheApi, useQuickRecord } from "../../clay/quick-cache";
import { SaveButton } from "../../clay/save-button";
import { StaticDateTimeWidget } from "../../clay/widgets/DateTimeWidget";
import { DateWidget } from "../../clay/widgets/DateWidget";
import { FormField } from "../../clay/widgets/FormField";
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
import { PersonnelListWidget } from "../project/personnel/list-widget";
import { ManageRoles } from "../project/ProjectRolesWidget.widget";
import { calcProjectSummary, Project, PROJECT_META } from "../project/table";
import { Role } from "../roles/table";
import { useUser } from "../state";
import {
    ROLE_CERTIFIED_FOREMAN,
    ROLE_PROJECT_MANAGER,
    User,
} from "../user/table";
import {
    calcWarrantyReviewHasCoveredItems,
    WarrantyReview,
    WARRANTY_REVIEW_META,
} from "../warranty-review/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource, {
    NotificationSourceComponentProps,
} from "./NotificationSource";
import { useRecordWidget } from "./useRecordWidget";
import { WarrantyReviewDetailsCommon } from "./warranty-review-common";

type Data = WarrantyReview;

const Fields = {
    personnel: PersonnelListWidget,
    reviewDate: FormField(StaticDateTimeWidget),
    remediationWorkDueDate: FormField(DateWidget),
};

function defaultRolesFromProject(
    data: WarrantyReview,
    project: Project,
    role: Link<Role>,
    user: Link<User>
) {
    if (data.personnel.find((x) => x.role === role)) {
        return data;
    }
    return {
        ...data,
        personnel: [
            ...data.personnel,
            ...project.personnel
                .filter((x) => x.role === role)
                .map((x) => ({
                    user: x.user,
                    role,
                    assignedBy: user,
                    assignedDate: new Date(),
                    accepted: false,
                    acceptedDate: null,
                })),
        ],
    };
}

function actionDefaultsForReview(
    state: State,
    data: WarrantyReview,
    project: Project,
    user: Link<User>
) {
    data = defaultRolesFromProject(data, project, ROLE_PROJECT_MANAGER, user);
    data = defaultRolesFromProject(data, project, ROLE_CERTIFIED_FOREMAN, user);
    return {
        state,
        data,
    };
}

function Component(props: Props) {
    const project = useQuickRecord(PROJECT_META, props.data.project);
    const user = useUser();

    React.useEffect(() => {
        if (project) {
            props.dispatch({
                type: "DEFAULTS_FOR_REVIEW",
                project,
                user: user.id,
            });
        }
    }, [!!project, props.dispatch]);

    if (!project) {
        return <></>;
    }

    return (
        <>
            <MessageHeader>
                {calcProjectSummary(project)} Warranty Remediation Work Required
            </MessageHeader>
            <MessageBody>
                <WarrantyReviewDetailsCommon
                    project={project}
                    review={props.data}
                />
                <widgets.reviewDate />
                <ul>
                    {props.data.specificItems
                        .filter((x) => x.covered == "Yes")
                        .map((x) => (
                            <li>
                                {x.description}: {x.actionRequired}
                            </li>
                        ))}
                </ul>
                <ManageRoles
                    personnel={props.data.personnel}
                    dispatch={props.dispatch}
                    status={props.status}
                />
                <widgets.remediationWorkDueDate />
            </MessageBody>
            <MessageFooter>
                <SaveButton />
            </MessageFooter>
        </>
    );
}

function NotificationComponent(props: NotificationSourceComponentProps) {
    const widget = useRecordWidget(Widget, props.id, props.setOpenItem, true);

    return (
        <>
            {widget.component}
            <MessageFooter>
                <Button
                    onClick={() => {
                        window.open("#/warranty-review/edit/" + props.id + "/");
                        props.setOpenItem(null);
                    }}
                    style={{ display: "block", marginLeft: "auto" }}
                >
                    Open Warranty Review
                </Button>
                <Button
                    style={{ marginLeft: "auto", display: "block" }}
                    disabled={!widget.isValid}
                    onClick={widget.onSave}
                >
                    Save
                </Button>
            </MessageFooter>
        </>
    );
}

export const WARRANTY_REMEDIATION_WORK_REQUIRED_SOURCE = NotificationSource({
    key: "warranty-remediation-work-required-source",
    label: "Warranty Remediation Work Required",
    table: WARRANTY_REVIEW_META,
    Component: NotificationComponent,
    date: (review) => review.reviewDate,
    active: (review) =>
        isNotNull(review.reviewDate) &&
        calcWarrantyReviewHasCoveredItems(review) &&
        (!anyMap(review.personnel, (x) => x.role === ROLE_CERTIFIED_FOREMAN) ||
            !anyMap(review.personnel, (x) => x.role === ROLE_PROJECT_MANAGER) ||
            isNull(review.remediationWorkDueDate)),
    sendToCategoryManager: true,
});

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.personnel> &
    WidgetContext<typeof Fields.reviewDate> &
    WidgetContext<typeof Fields.remediationWorkDueDate>;
type ExtraProps = {};
type BaseState = {
    personnel: WidgetState<typeof Fields.personnel>;
    reviewDate: WidgetState<typeof Fields.reviewDate>;
    remediationWorkDueDate: WidgetState<typeof Fields.remediationWorkDueDate>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "PERSONNEL"; action: WidgetAction<typeof Fields.personnel> }
    | { type: "REVIEW_DATE"; action: WidgetAction<typeof Fields.reviewDate> }
    | {
          type: "REMEDIATION_WORK_DUE_DATE";
          action: WidgetAction<typeof Fields.remediationWorkDueDate>;
      }
    | { type: "DEFAULTS_FOR_REVIEW"; project: Project; user: Link<User> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.personnel, data.personnel, cache, "personnel", errors);
    subvalidate(
        Fields.reviewDate,
        data.reviewDate,
        cache,
        "reviewDate",
        errors
    );
    subvalidate(
        Fields.remediationWorkDueDate,
        data.remediationWorkDueDate,
        cache,
        "remediationWorkDueDate",
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
        case "REVIEW_DATE": {
            const inner = Fields.reviewDate.reduce(
                state.reviewDate,
                data.reviewDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, reviewDate: inner.state },
                data: { ...data, reviewDate: inner.data },
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
        case "DEFAULTS_FOR_REVIEW":
            return actionDefaultsForReview(
                state,
                data,
                action.project,
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
    reviewDate: function (
        props: WidgetExtraProps<typeof Fields.reviewDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "REVIEW_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "reviewDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.reviewDate.component
                state={context.state.reviewDate}
                data={context.data.reviewDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Review Date"}
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
        let reviewDateState;
        {
            const inner = Fields.reviewDate.initialize(
                data.reviewDate,
                subcontext,
                subparameters.reviewDate
            );
            reviewDateState = inner.state;
            data = { ...data, reviewDate: inner.data };
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
        let state = {
            initialParameters: parameters,
            personnel: personnelState,
            reviewDate: reviewDateState,
            remediationWorkDueDate: remediationWorkDueDateState,
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
    personnel: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.personnel>
    >;
    reviewDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.reviewDate>
    >;
    remediationWorkDueDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.remediationWorkDueDate>
    >;
};
// END MAGIC -- DO NOT EDIT
