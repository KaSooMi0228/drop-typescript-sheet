import React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { CheckboxWidget } from "../../../clay/widgets/CheckboxWidget";
import { StaticDateTimeWidget } from "../../../clay/widgets/DateTimeWidget";
import { DropdownLinkWidget } from "../../../clay/widgets/dropdown-link-widget";
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
} from "../../../clay/widgets/index";
import { ROLE_META } from "../../roles/table";
import { ROLE_CERTIFIED_FOREMAN, USER_META } from "../../user/table";
import { ProjectPersonnel, PROJECT_PERSONNEL_META } from "./table";

export type Data = ProjectPersonnel;
export const Fields = {
    user: DropdownLinkWidget({
        meta: USER_META,
        label: (user) =>
            user.roles.indexOf(ROLE_CERTIFIED_FOREMAN) !== -1
                ? `${user.code} ${user.name}`
                : user.name,
    }),
    assignedBy: DropdownLinkWidget({
        meta: USER_META,
        label: (user) => user.name,
    }),
    assignedDate: StaticDateTimeWidget,
    acceptedDate: StaticDateTimeWidget,
    accepted: CheckboxWidget,
    role: DropdownLinkWidget({
        meta: ROLE_META,
        label: (role) => role.name,
        include: (role) => role.projectRole,
    }),
};

export type ExtraProps = {};

function Component(props: Props) {
    return <></>;
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.user> &
    WidgetContext<typeof Fields.assignedBy> &
    WidgetContext<typeof Fields.assignedDate> &
    WidgetContext<typeof Fields.acceptedDate> &
    WidgetContext<typeof Fields.accepted> &
    WidgetContext<typeof Fields.role>;
type BaseState = {
    user: WidgetState<typeof Fields.user>;
    assignedBy: WidgetState<typeof Fields.assignedBy>;
    assignedDate: WidgetState<typeof Fields.assignedDate>;
    acceptedDate: WidgetState<typeof Fields.acceptedDate>;
    accepted: WidgetState<typeof Fields.accepted>;
    role: WidgetState<typeof Fields.role>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "USER"; action: WidgetAction<typeof Fields.user> }
    | { type: "ASSIGNED_BY"; action: WidgetAction<typeof Fields.assignedBy> }
    | {
          type: "ASSIGNED_DATE";
          action: WidgetAction<typeof Fields.assignedDate>;
      }
    | {
          type: "ACCEPTED_DATE";
          action: WidgetAction<typeof Fields.acceptedDate>;
      }
    | { type: "ACCEPTED"; action: WidgetAction<typeof Fields.accepted> }
    | { type: "ROLE"; action: WidgetAction<typeof Fields.role> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.user, data.user, cache, "user", errors);
    subvalidate(
        Fields.assignedBy,
        data.assignedBy,
        cache,
        "assignedBy",
        errors
    );
    subvalidate(
        Fields.assignedDate,
        data.assignedDate,
        cache,
        "assignedDate",
        errors
    );
    subvalidate(
        Fields.acceptedDate,
        data.acceptedDate,
        cache,
        "acceptedDate",
        errors
    );
    subvalidate(Fields.accepted, data.accepted, cache, "accepted", errors);
    subvalidate(Fields.role, data.role, cache, "role", errors);
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
        case "USER": {
            const inner = Fields.user.reduce(
                state.user,
                data.user,
                action.action,
                subcontext
            );
            return {
                state: { ...state, user: inner.state },
                data: { ...data, user: inner.data },
            };
        }
        case "ASSIGNED_BY": {
            const inner = Fields.assignedBy.reduce(
                state.assignedBy,
                data.assignedBy,
                action.action,
                subcontext
            );
            return {
                state: { ...state, assignedBy: inner.state },
                data: { ...data, assignedBy: inner.data },
            };
        }
        case "ASSIGNED_DATE": {
            const inner = Fields.assignedDate.reduce(
                state.assignedDate,
                data.assignedDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, assignedDate: inner.state },
                data: { ...data, assignedDate: inner.data },
            };
        }
        case "ACCEPTED_DATE": {
            const inner = Fields.acceptedDate.reduce(
                state.acceptedDate,
                data.acceptedDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, acceptedDate: inner.state },
                data: { ...data, acceptedDate: inner.data },
            };
        }
        case "ACCEPTED": {
            const inner = Fields.accepted.reduce(
                state.accepted,
                data.accepted,
                action.action,
                subcontext
            );
            return {
                state: { ...state, accepted: inner.state },
                data: { ...data, accepted: inner.data },
            };
        }
        case "ROLE": {
            const inner = Fields.role.reduce(
                state.role,
                data.role,
                action.action,
                subcontext
            );
            return {
                state: { ...state, role: inner.state },
                data: { ...data, role: inner.data },
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
    user: function (
        props: WidgetExtraProps<typeof Fields.user> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "USER", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "user", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.user.component
                state={context.state.user}
                data={context.data.user}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "User"}
            />
        );
    },
    assignedBy: function (
        props: WidgetExtraProps<typeof Fields.assignedBy> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ASSIGNED_BY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "assignedBy", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.assignedBy.component
                state={context.state.assignedBy}
                data={context.data.assignedBy}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Assigned By"}
            />
        );
    },
    assignedDate: function (
        props: WidgetExtraProps<typeof Fields.assignedDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ASSIGNED_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "assignedDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.assignedDate.component
                state={context.state.assignedDate}
                data={context.data.assignedDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Assigned Date"}
            />
        );
    },
    acceptedDate: function (
        props: WidgetExtraProps<typeof Fields.acceptedDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ACCEPTED_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "acceptedDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.acceptedDate.component
                state={context.state.acceptedDate}
                data={context.data.acceptedDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Accepted Date"}
            />
        );
    },
    accepted: function (
        props: WidgetExtraProps<typeof Fields.accepted> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ACCEPTED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "accepted", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.accepted.component
                state={context.state.accepted}
                data={context.data.accepted}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Accepted"}
            />
        );
    },
    role: function (
        props: WidgetExtraProps<typeof Fields.role> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "ROLE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "role", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.role.component
                state={context.state.role}
                data={context.data.role}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Role"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PROJECT_PERSONNEL_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let userState;
        {
            const inner = Fields.user.initialize(
                data.user,
                subcontext,
                subparameters.user
            );
            userState = inner.state;
            data = { ...data, user: inner.data };
        }
        let assignedByState;
        {
            const inner = Fields.assignedBy.initialize(
                data.assignedBy,
                subcontext,
                subparameters.assignedBy
            );
            assignedByState = inner.state;
            data = { ...data, assignedBy: inner.data };
        }
        let assignedDateState;
        {
            const inner = Fields.assignedDate.initialize(
                data.assignedDate,
                subcontext,
                subparameters.assignedDate
            );
            assignedDateState = inner.state;
            data = { ...data, assignedDate: inner.data };
        }
        let acceptedDateState;
        {
            const inner = Fields.acceptedDate.initialize(
                data.acceptedDate,
                subcontext,
                subparameters.acceptedDate
            );
            acceptedDateState = inner.state;
            data = { ...data, acceptedDate: inner.data };
        }
        let acceptedState;
        {
            const inner = Fields.accepted.initialize(
                data.accepted,
                subcontext,
                subparameters.accepted
            );
            acceptedState = inner.state;
            data = { ...data, accepted: inner.data };
        }
        let roleState;
        {
            const inner = Fields.role.initialize(
                data.role,
                subcontext,
                subparameters.role
            );
            roleState = inner.state;
            data = { ...data, role: inner.data };
        }
        let state = {
            initialParameters: parameters,
            user: userState,
            assignedBy: assignedByState,
            assignedDate: assignedDateState,
            acceptedDate: acceptedDateState,
            accepted: acceptedState,
            role: roleState,
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
                <RecordContext meta={PROJECT_PERSONNEL_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    user: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.user>
    >;
    assignedBy: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.assignedBy>
    >;
    assignedDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.assignedDate>
    >;
    acceptedDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.acceptedDate>
    >;
    accepted: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.accepted>
    >;
    role: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.role>
    >;
};
// END MAGIC -- DO NOT EDIT
