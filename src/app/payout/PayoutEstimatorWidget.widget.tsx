import Decimal from "decimal.js";
import * as React from "react";
import { Button } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { Link } from "../../clay/link";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../clay/quick-cache";
import { RemoveButton } from "../../clay/remove-button";
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
import { useListItemContext } from "../../clay/widgets/ListWidget";
import { MoneyStatic, MoneyWidget } from "../../clay/widgets/money-widget";
import {
    PercentageStatic,
    PercentageWidget,
} from "../../clay/widgets/percentage-widget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { hasPermission } from "../../permissions";
import { Role, ROLE_META } from "../roles/table";
import { useUser } from "../state";
import { ROLE_PROJECT_MANAGER, User, USER_META } from "../user/table";
import { ReactContext as PayoutMarginsWidgetReactContext } from "./PayoutMarginsWidget.widget";
import {
    calcCommissionEffectivePercentage,
    calcCommissionPayoutAmount,
    Commission,
    COMMISSION_META,
    Payout,
} from "./table";

export type Data = Commission;

export const Fields = {
    portionPercentage: PercentageWidget,
    commissionPercentage: Optional(PercentageWidget),
    extraPercentage: Optional(PercentageWidget),
    extraAmount: Optional(MoneyWidget),
    extraReason: TextWidget,
};

export type ExtraProps = {
    payout: Payout;
};

function actionConfigureCustom(
    state: State,
    data: Data,
    role: Link<Role>,
    user: User
) {
    return {
        state,
        data: {
            ...data,
            custom: true,
            commissionPercentage: user.commissionsPercentage,
            user: user.id.uuid,
            role,
            rolePercentage:
                role === ROLE_PROJECT_MANAGER
                    ? new Decimal(0.65)
                    : new Decimal(0.35),
        },
    };
}

function initialize(data: Data, context: Context) {
    return {
        state: {
            isAddingExtra: false,
        },
        data,
    };
}

function hasExtra(data: Data) {
    return (
        !data.extraAmount.isZero() ||
        !data.extraPercentage.isZero() ||
        data.extraReason !== ""
    );
}

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);

    if (data.portionPercentage.greaterThan(new Decimal("1.0"))) {
        errors.push({
            invalid: true,
            empty: false,
            field: "portionPercentage",
        });
    }

    if (!hasExtra(data)) {
        return errors.filter((x) => x.field !== "extraReason");
    }

    return errors;
}

export type ExtraState = {
    isAddingExtra: boolean;
};

function actionAddExtra(state: State, data: Data) {
    return {
        state: {
            ...state,
            isAddingExtra: true,
        },
        data,
    };
}

function actionRemoveExtra(state: State, data: Data) {
    return {
        state: {
            ...state,
            isAddingExtra: false,
        },
        data: {
            ...data,
            extraPercentage: new Decimal("0"),
            extraAmount: new Decimal("0"),
            extraReason: "",
        },
    };
}

function Component(props: Props) {
    const userP = useUser();
    const user = useQuickRecord(USER_META, props.data.user);
    const role = useQuickRecord(ROLE_META, props.data.role);
    const payoutContext = React.useContext(PayoutMarginsWidgetReactContext)!;
    const listItemContext = useListItemContext();

    const showingExtra = props.state.isAddingExtra || hasExtra(props.data);

    return (
        <>
            <tr>
                <th>{role?.name}</th>
                <th>{user?.name}</th>
                <td>
                    <widgets.portionPercentage />
                </td>
                <td>
                    <widgets.commissionPercentage
                        readOnly={
                            !hasPermission(
                                userP,
                                "Payout",
                                "override-commissions"
                            )
                        }
                    />
                </td>
                <td>
                    <PercentageStatic
                        value={calcCommissionEffectivePercentage(props.data)}
                    />
                </td>
                <td>
                    <MoneyStatic
                        value={calcCommissionPayoutAmount(
                            props.data,
                            payoutContext.data
                        )}
                    />
                </td>
                <td>
                    {!showingExtra && (
                        <Button
                            onClick={() =>
                                props.dispatch({ type: "ADD_EXTRA" })
                            }
                        >
                            Add Extra
                        </Button>
                    )}
                </td>
                <td>{props.data.custom && <RemoveButton />}</td>
            </tr>
            {showingExtra && (
                <tr>
                    <td>Extra Compensation</td>
                    <td>
                        <widgets.extraAmount />
                    </td>
                    <td>
                        <widgets.extraPercentage />
                    </td>
                    <td colSpan={3}>
                        <widgets.extraReason />
                    </td>
                    <td>
                        <Button
                            onClick={() =>
                                props.dispatch({ type: "REMOVE_EXTRA" })
                            }
                        >
                            Remove Extra
                        </Button>
                    </td>
                </tr>
            )}
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.portionPercentage> &
    WidgetContext<typeof Fields.commissionPercentage> &
    WidgetContext<typeof Fields.extraPercentage> &
    WidgetContext<typeof Fields.extraAmount> &
    WidgetContext<typeof Fields.extraReason>;
type BaseState = {
    portionPercentage: WidgetState<typeof Fields.portionPercentage>;
    commissionPercentage: WidgetState<typeof Fields.commissionPercentage>;
    extraPercentage: WidgetState<typeof Fields.extraPercentage>;
    extraAmount: WidgetState<typeof Fields.extraAmount>;
    extraReason: WidgetState<typeof Fields.extraReason>;
    initialParameters?: string[];
};
export type State = BaseState & ExtraState;

type BaseAction =
    | {
          type: "PORTION_PERCENTAGE";
          action: WidgetAction<typeof Fields.portionPercentage>;
      }
    | {
          type: "COMMISSION_PERCENTAGE";
          action: WidgetAction<typeof Fields.commissionPercentage>;
      }
    | {
          type: "EXTRA_PERCENTAGE";
          action: WidgetAction<typeof Fields.extraPercentage>;
      }
    | { type: "EXTRA_AMOUNT"; action: WidgetAction<typeof Fields.extraAmount> }
    | { type: "EXTRA_REASON"; action: WidgetAction<typeof Fields.extraReason> }
    | { type: "CONFIGURE_CUSTOM"; role: Link<Role>; user: User }
    | { type: "ADD_EXTRA" }
    | { type: "REMOVE_EXTRA" };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.portionPercentage,
        data.portionPercentage,
        cache,
        "portionPercentage",
        errors
    );
    subvalidate(
        Fields.commissionPercentage,
        data.commissionPercentage,
        cache,
        "commissionPercentage",
        errors
    );
    subvalidate(
        Fields.extraPercentage,
        data.extraPercentage,
        cache,
        "extraPercentage",
        errors
    );
    subvalidate(
        Fields.extraAmount,
        data.extraAmount,
        cache,
        "extraAmount",
        errors
    );
    subvalidate(
        Fields.extraReason,
        data.extraReason,
        cache,
        "extraReason",
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
        case "PORTION_PERCENTAGE": {
            const inner = Fields.portionPercentage.reduce(
                state.portionPercentage,
                data.portionPercentage,
                action.action,
                subcontext
            );
            return {
                state: { ...state, portionPercentage: inner.state },
                data: { ...data, portionPercentage: inner.data },
            };
        }
        case "COMMISSION_PERCENTAGE": {
            const inner = Fields.commissionPercentage.reduce(
                state.commissionPercentage,
                data.commissionPercentage,
                action.action,
                subcontext
            );
            return {
                state: { ...state, commissionPercentage: inner.state },
                data: { ...data, commissionPercentage: inner.data },
            };
        }
        case "EXTRA_PERCENTAGE": {
            const inner = Fields.extraPercentage.reduce(
                state.extraPercentage,
                data.extraPercentage,
                action.action,
                subcontext
            );
            return {
                state: { ...state, extraPercentage: inner.state },
                data: { ...data, extraPercentage: inner.data },
            };
        }
        case "EXTRA_AMOUNT": {
            const inner = Fields.extraAmount.reduce(
                state.extraAmount,
                data.extraAmount,
                action.action,
                subcontext
            );
            return {
                state: { ...state, extraAmount: inner.state },
                data: { ...data, extraAmount: inner.data },
            };
        }
        case "EXTRA_REASON": {
            const inner = Fields.extraReason.reduce(
                state.extraReason,
                data.extraReason,
                action.action,
                subcontext
            );
            return {
                state: { ...state, extraReason: inner.state },
                data: { ...data, extraReason: inner.data },
            };
        }
        case "CONFIGURE_CUSTOM":
            return actionConfigureCustom(state, data, action.role, action.user);
        case "ADD_EXTRA":
            return actionAddExtra(state, data);
        case "REMOVE_EXTRA":
            return actionRemoveExtra(state, data);
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
    portionPercentage: function (
        props: WidgetExtraProps<typeof Fields.portionPercentage> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PORTION_PERCENTAGE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "portionPercentage",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.portionPercentage.component
                state={context.state.portionPercentage}
                data={context.data.portionPercentage}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Portion Percentage"}
            />
        );
    },
    commissionPercentage: function (
        props: WidgetExtraProps<typeof Fields.commissionPercentage> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMMISSION_PERCENTAGE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "commissionPercentage",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.commissionPercentage.component
                state={context.state.commissionPercentage}
                data={context.data.commissionPercentage}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Commission Percentage"}
            />
        );
    },
    extraPercentage: function (
        props: WidgetExtraProps<typeof Fields.extraPercentage> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "EXTRA_PERCENTAGE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "extraPercentage", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.extraPercentage.component
                state={context.state.extraPercentage}
                data={context.data.extraPercentage}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Extra Percentage"}
            />
        );
    },
    extraAmount: function (
        props: WidgetExtraProps<typeof Fields.extraAmount> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "EXTRA_AMOUNT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "extraAmount", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.extraAmount.component
                state={context.state.extraAmount}
                data={context.data.extraAmount}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Extra Amount"}
            />
        );
    },
    extraReason: function (
        props: WidgetExtraProps<typeof Fields.extraReason> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "EXTRA_REASON",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "extraReason", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.extraReason.component
                state={context.state.extraReason}
                data={context.data.extraReason}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Extra Reason"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: COMMISSION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        const result = initialize(data, context);
        data = result.data;
        let subparameters: Dictionary<string[]> =
            (result as any).parameters || {};
        let subcontext = context;
        let portionPercentageState;
        {
            const inner = Fields.portionPercentage.initialize(
                data.portionPercentage,
                subcontext,
                subparameters.portionPercentage
            );
            portionPercentageState = inner.state;
            data = { ...data, portionPercentage: inner.data };
        }
        let commissionPercentageState;
        {
            const inner = Fields.commissionPercentage.initialize(
                data.commissionPercentage,
                subcontext,
                subparameters.commissionPercentage
            );
            commissionPercentageState = inner.state;
            data = { ...data, commissionPercentage: inner.data };
        }
        let extraPercentageState;
        {
            const inner = Fields.extraPercentage.initialize(
                data.extraPercentage,
                subcontext,
                subparameters.extraPercentage
            );
            extraPercentageState = inner.state;
            data = { ...data, extraPercentage: inner.data };
        }
        let extraAmountState;
        {
            const inner = Fields.extraAmount.initialize(
                data.extraAmount,
                subcontext,
                subparameters.extraAmount
            );
            extraAmountState = inner.state;
            data = { ...data, extraAmount: inner.data };
        }
        let extraReasonState;
        {
            const inner = Fields.extraReason.initialize(
                data.extraReason,
                subcontext,
                subparameters.extraReason
            );
            extraReasonState = inner.state;
            data = { ...data, extraReason: inner.data };
        }
        let state = {
            initialParameters: parameters,
            ...result.state,
            portionPercentage: portionPercentageState,
            commissionPercentage: commissionPercentageState,
            extraPercentage: extraPercentageState,
            extraAmount: extraAmountState,
            extraReason: extraReasonState,
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
                <RecordContext meta={COMMISSION_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    portionPercentage: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.portionPercentage>
    >;
    commissionPercentage: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.commissionPercentage>
    >;
    extraPercentage: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.extraPercentage>
    >;
    extraAmount: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.extraAmount>
    >;
    extraReason: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.extraReason>
    >;
};
// END MAGIC -- DO NOT EDIT
