import * as React from "react";
import { Dictionary } from "../../clay/common";
import { DeleteButton } from "../../clay/delete-button";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickRecords } from "../../clay/quick-cache";
import { DateWidget } from "../../clay/widgets/DateWidget";
import { FormField } from "../../clay/widgets/FormField";
import {
    RecordContext,
    RecordWidget,
    subStatus,
    subvalidate,
    useRecordContext,
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
import { SelectLinkWidget } from "../../clay/widgets/SelectLinkWidget";
import {
    ROLE_CERTIFIED_FOREMAN,
    ROLE_PROJECT_MANAGER,
    USER_META,
} from "../user/table";
import {
    WarrantyReviewDetailSheet,
    WARRANTY_REVIEW_DETAIL_SHEET_META,
    WARRANTY_REVIEW_META,
} from "./table";

export type Data = WarrantyReviewDetailSheet;
const UserDropdown = SelectLinkWidget({
    meta: USER_META,
    label: (user) => user.name,
});
export const Fields = {
    certifiedForeman: FormField(UserDropdown),
    manager: FormField(UserDropdown),
    scheduledWorkDate: FormField(DateWidget),
};

export function Component(props: Props) {
    const review = useRecordContext(WARRANTY_REVIEW_META);

    const certifiedForemen = useQuickRecords(
        USER_META,
        review.personnel
            .filter((role) => role.role === ROLE_CERTIFIED_FOREMAN)
            .map((x) => x.user!)
    );
    const managers = useQuickRecords(
        USER_META,
        review.personnel
            .filter((entry) => entry.role === ROLE_PROJECT_MANAGER)
            .map((entry) => entry.user!)
    );

    return (
        <>
            <widgets.manager records={managers} />
            <widgets.certifiedForeman records={certifiedForemen} />
            <widgets.scheduledWorkDate />
            <DeleteButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.certifiedForeman> &
    WidgetContext<typeof Fields.manager> &
    WidgetContext<typeof Fields.scheduledWorkDate>;
type ExtraProps = {};
type BaseState = {
    certifiedForeman: WidgetState<typeof Fields.certifiedForeman>;
    manager: WidgetState<typeof Fields.manager>;
    scheduledWorkDate: WidgetState<typeof Fields.scheduledWorkDate>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "CERTIFIED_FOREMAN";
          action: WidgetAction<typeof Fields.certifiedForeman>;
      }
    | { type: "MANAGER"; action: WidgetAction<typeof Fields.manager> }
    | {
          type: "SCHEDULED_WORK_DATE";
          action: WidgetAction<typeof Fields.scheduledWorkDate>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.certifiedForeman,
        data.certifiedForeman,
        cache,
        "certifiedForeman",
        errors
    );
    subvalidate(Fields.manager, data.manager, cache, "manager", errors);
    subvalidate(
        Fields.scheduledWorkDate,
        data.scheduledWorkDate,
        cache,
        "scheduledWorkDate",
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
        case "CERTIFIED_FOREMAN": {
            const inner = Fields.certifiedForeman.reduce(
                state.certifiedForeman,
                data.certifiedForeman,
                action.action,
                subcontext
            );
            return {
                state: { ...state, certifiedForeman: inner.state },
                data: { ...data, certifiedForeman: inner.data },
            };
        }
        case "MANAGER": {
            const inner = Fields.manager.reduce(
                state.manager,
                data.manager,
                action.action,
                subcontext
            );
            return {
                state: { ...state, manager: inner.state },
                data: { ...data, manager: inner.data },
            };
        }
        case "SCHEDULED_WORK_DATE": {
            const inner = Fields.scheduledWorkDate.reduce(
                state.scheduledWorkDate,
                data.scheduledWorkDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, scheduledWorkDate: inner.state },
                data: { ...data, scheduledWorkDate: inner.data },
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
    certifiedForeman: function (
        props: WidgetExtraProps<typeof Fields.certifiedForeman> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CERTIFIED_FOREMAN",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "certifiedForeman", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.certifiedForeman.component
                state={context.state.certifiedForeman}
                data={context.data.certifiedForeman}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Certified Foreman"}
            />
        );
    },
    manager: function (
        props: WidgetExtraProps<typeof Fields.manager> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MANAGER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "manager", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.manager.component
                state={context.state.manager}
                data={context.data.manager}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Manager"}
            />
        );
    },
    scheduledWorkDate: function (
        props: WidgetExtraProps<typeof Fields.scheduledWorkDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SCHEDULED_WORK_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "scheduledWorkDate",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.scheduledWorkDate.component
                state={context.state.scheduledWorkDate}
                data={context.data.scheduledWorkDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Scheduled Work Date"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WARRANTY_REVIEW_DETAIL_SHEET_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let certifiedForemanState;
        {
            const inner = Fields.certifiedForeman.initialize(
                data.certifiedForeman,
                subcontext,
                subparameters.certifiedForeman
            );
            certifiedForemanState = inner.state;
            data = { ...data, certifiedForeman: inner.data };
        }
        let managerState;
        {
            const inner = Fields.manager.initialize(
                data.manager,
                subcontext,
                subparameters.manager
            );
            managerState = inner.state;
            data = { ...data, manager: inner.data };
        }
        let scheduledWorkDateState;
        {
            const inner = Fields.scheduledWorkDate.initialize(
                data.scheduledWorkDate,
                subcontext,
                subparameters.scheduledWorkDate
            );
            scheduledWorkDateState = inner.state;
            data = { ...data, scheduledWorkDate: inner.data };
        }
        let state = {
            initialParameters: parameters,
            certifiedForeman: certifiedForemanState,
            manager: managerState,
            scheduledWorkDate: scheduledWorkDateState,
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
                <RecordContext
                    meta={WARRANTY_REVIEW_DETAIL_SHEET_META}
                    value={props.data}
                >
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    certifiedForeman: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.certifiedForeman>
    >;
    manager: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.manager>
    >;
    scheduledWorkDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.scheduledWorkDate>
    >;
};
// END MAGIC -- DO NOT EDIT
