import Decimal from "decimal.js";
import { find } from "lodash";
import * as React from "react";
import { Dictionary } from "../../clay/common";
import { Link } from "../../clay/link";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickAllRecords } from "../../clay/quick-cache";
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
import { PercentageWidget } from "../../clay/widgets/percentage-widget";
import { SelectLinkWidget } from "../../clay/widgets/SelectLinkWidget";
import { TableRow } from "../../clay/widgets/TableRow";
import { PROJECT_META } from "../project/table";
import { Role } from "../roles/table";
import { USER_META } from "../user/table";
import { RoleWithPercentage, ROLE_WITH_PERCENTAGE_META } from "./table";

type Data = RoleWithPercentage;

type ExtraProps = {
    role: Link<Role>;
};

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);
    if (data.percentage.greaterThan(new Decimal("1"))) {
        errors.push({
            empty: false,
            invalid: true,
            field: "percentage",
        });
    }
    return errors;
}

const Fields = {
    user: SelectLinkWidget({
        meta: USER_META,
        label(item) {
            return item.name;
        },
    }),
    percentage: PercentageWidget,
};

function Component(props: Props) {
    const projectContext = useRecordContext(PROJECT_META);

    const users = useQuickAllRecords(USER_META) || [];
    return (
        <TableRow>
            <widgets.user
                records={projectContext.personnel
                    .filter((entry) => entry.role === props.role)
                    .map((entry) =>
                        find(users, (user) => user.id.uuid === entry.user)
                    )
                    .filter((user) => user)
                    .map((user) => user!)}
            />
            <widgets.percentage />
        </TableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.user> &
    WidgetContext<typeof Fields.percentage>;
type BaseState = {
    user: WidgetState<typeof Fields.user>;
    percentage: WidgetState<typeof Fields.percentage>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "USER"; action: WidgetAction<typeof Fields.user> }
    | { type: "PERCENTAGE"; action: WidgetAction<typeof Fields.percentage> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.user, data.user, cache, "user", errors);
    subvalidate(
        Fields.percentage,
        data.percentage,
        cache,
        "percentage",
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
        case "PERCENTAGE": {
            const inner = Fields.percentage.reduce(
                state.percentage,
                data.percentage,
                action.action,
                subcontext
            );
            return {
                state: { ...state, percentage: inner.state },
                data: { ...data, percentage: inner.data },
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
    percentage: function (
        props: WidgetExtraProps<typeof Fields.percentage> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PERCENTAGE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "percentage", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.percentage.component
                state={context.state.percentage}
                data={context.data.percentage}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Percentage"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ROLE_WITH_PERCENTAGE_META,
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
        let percentageState;
        {
            const inner = Fields.percentage.initialize(
                data.percentage,
                subcontext,
                subparameters.percentage
            );
            percentageState = inner.state;
            data = { ...data, percentage: inner.data };
        }
        let state = {
            initialParameters: parameters,
            user: userState,
            percentage: percentageState,
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
                <RecordContext
                    meta={ROLE_WITH_PERCENTAGE_META}
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
    user: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.user>
    >;
    percentage: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.percentage>
    >;
};
// END MAGIC -- DO NOT EDIT
