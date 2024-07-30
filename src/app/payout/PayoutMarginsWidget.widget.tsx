import Decimal from "decimal.js";
import { css } from "glamor";
import { groupBy, some } from "lodash";
import * as React from "react";
import { Alert, Button, Table } from "react-bootstrap";
import Select from "react-select";
import { useRecordQuery } from "../../clay/api";
import { Dictionary, Money, Percentage } from "../../clay/common";
import { GenerateButton } from "../../clay/generate-button";
import { Link } from "../../clay/link";
import { propCheck } from "../../clay/propCheck";
import { sumMap } from "../../clay/queryFuncs";
import {
    QuickCacheApi,
    useQuickAllRecords,
    useQuickCache,
    useQuickRecord,
} from "../../clay/quick-cache";
import { useQuickAllRecordsSorted } from "../../clay/widgets/dropdown-link-widget";
import { FormField, FormWrapper, Optional } from "../../clay/widgets/FormField";
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
import { FieldRow } from "../../clay/widgets/layout";
import { ListWidget } from "../../clay/widgets/ListWidget";
import { MoneyStatic } from "../../clay/widgets/money-widget";
import { PercentageStatic } from "../../clay/widgets/percentage-widget";
import { selectStyle } from "../../clay/widgets/SelectLinkWidget";
import { SelectWidget } from "../../clay/widgets/SelectWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { useLocalFieldWidget } from "../inbox/useLocalWidget";
import {
    getFiscalYear,
    projectIsFromPreviousFiscalYear,
    PROJECT_META,
} from "../project/table";
import { RichTextWidget } from "../rich-text-widget";
import { Role } from "../roles/table";
import { useUser } from "../state";
import { CONTENT_AREA } from "../styles";
import {
    calcUserLabel,
    ROLE_ESTIMATOR,
    ROLE_PROJECT_MANAGER,
    User,
    USER_META,
} from "../user/table";
import PayoutEstimatorWidget from "./PayoutEstimatorWidget.widget";
import { usePreviousPayouts } from "./previous-payouts";
import {
    calcPayoutAmountTotal,
    calcPayoutCertifiedForemanBudgetAmountSubtotal,
    calcPayoutCertifiedForemanSubtotal,
    calcPayoutHasMarginVariance,
    calcPayoutPayoutAmount,
    calcPayoutRemdalAmount,
    calcPayoutTotalNonCertifiedForemanExpenses,
    calcPayoutTotalProjectExpenses,
    Commission,
    computePayoutMarginVarianceDescription,
    Payout,
    PayoutCertifiedForeman,
    PAYOUT_META,
} from "./table";

export type Data = Payout;

export const Fields = {
    commissions: ListWidget(PayoutEstimatorWidget),
    note: Optional(RichTextWidget),
    marginVarianceExplanation: FormField(TextWidget),
};

function validate(data: Payout, cache: QuickCacheApi) {
    let errors = baseValidate(data, cache);

    if (!calcPayoutHasMarginVariance(data)) {
        errors = errors.filter((x) => x.field !== "marginVarianceExplanation");
    }

    if (errors.length > 0) {
        return errors;
    } else {
        const invalidRoles = new Set(
            Object.entries(
                groupBy(data.commissions, (comission) => comission.role)
            )
                .filter(
                    ([_, comissions]) =>
                        !sumMap(
                            comissions,
                            (comission) => comission.portionPercentage
                        ).equals(1)
                )
                .map(([role, _]) => role)
        );

        const errors = data.commissions
            .map<[Commission, number]>((comission, index) => [comission, index])
            .filter(([comission, index]: [Commission, number]) =>
                invalidRoles.has(comission.role!)
            )
            .map(([_, index]) => ({
                field: index + "",
                empty: false,
                invalid: true,
                detail: [
                    {
                        field: "portionPercentage",
                        invalid: true,
                        empty: false,
                    },
                ],
            }));

        if (errors.length > 0) {
            return [
                {
                    field: "commissions",
                    invalid: true,
                    empty: false,
                    detail: errors,
                },
            ];
        } else {
            return [];
        }
    }
}

function reduce(
    state: State,
    data: Data,
    action: BaseAction,
    context: Context
): WidgetResult<State, Data> {
    if (
        action.type === "COMMISSIONS" &&
        action.action.type == "ITEM" &&
        action.action.action.type == "PORTION_PERCENTAGE" &&
        action.action.action.action.type === "SET" &&
        data.commissions.filter(
            (commission) =>
                commission.role ===
                data.commissions[(action.action as any).index].role
        ).length == 2 &&
        /^\d+(.\d+)?$/.test(action.action.action.action.value)
    ) {
        const targetRole = data.commissions[action.action.index].role;
        const value = action.action.action.action.value;
        const percentage = new Decimal(
            (action as any).action.action.action.value
        ).dividedBy(100);
        return {
            state: {
                ...state,
                commissions: {
                    ...state.commissions,
                    items: state.commissions.items.map((item, index) => {
                        if (index === (action.action as any).index) {
                            return {
                                ...item,
                                portionPercentage: value,
                            };
                        } else {
                            return item;
                        }
                    }),
                },
            },
            data: {
                ...data,
                commissions: data.commissions.map((commission, index) => {
                    if (commission.role != targetRole) {
                        return commission;
                    } else if (index === (action.action as any).index) {
                        return {
                            ...commission,
                            portionPercentage: percentage,
                        };
                    } else {
                        return {
                            ...commission,
                            portionPercentage: new Decimal(1).minus(percentage),
                        };
                    }
                }),
            },
        };
    }
    return baseReduce(state, data, action, context);
}

function CFPercentOfWhole(props: {
    certifiedForeman: PayoutCertifiedForeman;
    payout: Payout;
}) {
    const cf = useQuickRecord(
        USER_META,
        props.certifiedForeman.certifiedForeman
    );

    const previousPayouts =
        useRecordQuery(
            PAYOUT_META,
            {
                filters: [
                    {
                        column: "project",
                        filter: {
                            equal: props.payout.project,
                        },
                    },
                    {
                        column: "number",
                        filter: {
                            lesser: props.payout.number.toString(),
                        },
                    },
                    {
                        column: "date",
                        filter: {
                            not_equal: null,
                        },
                    },
                ],
            },
            [props.payout.project, props.payout.number]
        ) || [];

    const previousPayoutCfs = previousPayouts.flatMap((payout) =>
        payout.certifiedForemen
            .filter(
                (x) =>
                    x.certifiedForeman ==
                    props.certifiedForeman.certifiedForeman
            )
            .map((x) => ({ ...x, payout }))
    );

    const hasPreviousPayouts = previousPayouts.length > 0;

    if (!cf) {
        return <></>;
    }

    const current = calcPayoutCertifiedForemanBudgetAmountSubtotal(
        props.certifiedForeman,
        props.payout
    );
    const currentDenom = calcPayoutAmountTotal(props.payout);
    const previous = sumMap(previousPayoutCfs, (x) =>
        calcPayoutCertifiedForemanSubtotal(x, x.payout)
    );
    const previousDenom = sumMap(previousPayoutCfs, (x) =>
        calcPayoutCertifiedForemanBudgetAmountSubtotal(x, x.payout)
    );

    return (
        <tr>
            <th colSpan={2}>{calcUserLabel(cf)} Contract Amount</th>
            <td>
                <MoneyStatic value={current} />
            </td>
            <td>
                <PercentageStatic
                    value={current.dividedBy(currentDenom).toDecimalPlaces(6)}
                />
            </td>
            {hasPreviousPayouts && (
                <td>
                    <PercentageStatic
                        value={previous
                            .dividedBy(previousDenom)
                            .toDecimalPlaces(6)}
                    />
                </td>
            )}
            {hasPreviousPayouts && (
                <td>
                    <PercentageStatic
                        value={previous
                            .plus(current)
                            .dividedBy(previousDenom.plus(currentDenom))
                            .toDecimalPlaces(6)}
                    />
                </td>
            )}
        </tr>
    );
}

const ROW_BORDER = css({
    "& th, & td": {
        borderTop: "solid 1px black !important",
    },
});

function AddComissionsWidget(props: {
    dispatch: (action: Action) => void;
    stopAdding: () => void;
}) {
    const currentUserMeta = useUser();
    const currentUser = useQuickRecord(USER_META, currentUserMeta.id);
    const projectRoles = [
        {
            id: ROLE_ESTIMATOR,
            name: "Estimator",
        },
        {
            id: ROLE_PROJECT_MANAGER,
            name: "Project Manager",
        },
    ];

    const users =
        useQuickAllRecordsSorted(USER_META, (user) => calcUserLabel(user)) ??
        [];
    const [role, setRole] = React.useState<null | {
        id: Link<Role>;
        name: string;
    }>(null);
    const [user, setUser] = React.useState<null | User>(null);
    const onRoleChange = React.useCallback(
        (selected) => {
            if (selected) {
                setRole(selected);
                setUser(null);
            }
        },
        [setRole, setUser]
    );
    const onUserChange = React.useCallback(
        (selected) => {
            if (selected) {
                setUser(selected);
            }
        },
        [setUser]
    );
    const onAdd = React.useCallback(() => {
        if (!currentUser) {
            return;
        }
        props.dispatch({
            type: "COMMISSIONS",
            action: {
                type: "NEW",
                actions: [
                    {
                        type: "CONFIGURE_CUSTOM",
                        user: user!,
                        role: role!.id,
                    },
                ],
            },
        });
        props.stopAdding();
    }, [props.dispatch, user, role, currentUser]);

    return (
        <FieldRow>
            <FormWrapper
                label="Role"
                style={{ width: "29ch", flexGrow: 0, flexBasis: "initial" }}
            >
                <Select
                    menuPlacement="auto"
                    value={role}
                    options={projectRoles}
                    getOptionLabel={(role) => role.name}
                    getOptionValue={(role) => role.id!}
                    onChange={onRoleChange}
                    styles={selectStyle(false)}
                />
            </FormWrapper>
            <FormWrapper label="Name">
                <Select
                    menuPlacement="auto"
                    value={user}
                    options={users.filter(
                        (user) =>
                            role &&
                            user.roles.indexOf(role.id) !== -1 &&
                            user.active
                    )}
                    getOptionLabel={calcUserLabel}
                    getOptionValue={(user) => user.id.uuid}
                    onChange={onUserChange}
                    styles={selectStyle(false)}
                />
            </FormWrapper>
            <div
                style={{
                    flexGrow: 0,
                    verticalAlign: "bottom",
                }}
            >
                <Button
                    style={{
                        marginTop: "32px",
                    }}
                    onClick={onAdd}
                >
                    Add
                </Button>
            </div>
        </FieldRow>
    );
}

function Component(props: Props) {
    const project = useRecordContext(PROJECT_META);
    const cache = useQuickCache();
    const users = useQuickAllRecords(USER_META);
    const marginVariance = React.useMemo(
        () => computePayoutMarginVarianceDescription(props.data, users || []),
        [props.data, users]
    );

    const previousPayouts = usePreviousPayouts();

    const hasPreviousPayouts = previousPayouts.length > 0;

    function pcells(
        f: (payout: Payout) => Percentage,
        g: (payout: Payout) => Money
    ) {
        const current = f(props.data);
        const current_denom = g(props.data);
        const previous = sumMap(previousPayouts, f);
        const previous_denom = sumMap(previousPayouts, g);

        return (
            <>
                <td>
                    <MoneyStatic value={current} />
                </td>
                <td style={{ width: "12em" }}>
                    {
                        <PercentageStatic
                            value={current
                                .dividedBy(current_denom)
                                .toDecimalPlaces(6)}
                        />
                    }
                </td>
                {hasPreviousPayouts && (
                    <td style={{ width: "12em" }}>
                        <PercentageStatic
                            value={previous
                                .dividedBy(previous_denom)
                                .toDecimalPlaces(6)}
                        />
                    </td>
                )}
                {hasPreviousPayouts && (
                    <td style={{ width: "12em" }}>
                        <PercentageStatic
                            value={previous
                                .plus(current)
                                .dividedBy(previous_denom.plus(current_denom))
                                .toDecimalPlaces(6)}
                        />
                    </td>
                )}
            </>
        );
    }

    function cells(f: (payout: Payout) => Money) {
        const current = f(props.data);
        const previous = sumMap(previousPayouts, f);
        return (
            <>
                <td style={{ width: "12em" }}>
                    {<MoneyStatic value={current} />}
                </td>
                {hasPreviousPayouts && (
                    <td style={{ width: "12em" }}>
                        <MoneyStatic value={previous} />
                    </td>
                )}
                {hasPreviousPayouts && (
                    <td style={{ width: "12em" }}>
                        <MoneyStatic value={previous.plus(current)} />
                    </td>
                )}
            </>
        );
    }

    const isProcessed = some(
        project.processedForPayouts,
        (x) => x.payout == null || x.payout == props.data.id.uuid
    );

    const maybeBackdate =
        projectIsFromPreviousFiscalYear(project) && props.data.date === null;
    const backdateYear = getFiscalYear(new Date()) - 1;

    const backdateWidget = useLocalFieldWidget(
        SelectWidget([
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
        ]),
        "",
        {}
    );

    const [isAdding, setIsAdding] = React.useState(false);
    const startAdding = React.useCallback(
        () => setIsAdding(true),
        [setIsAdding]
    );
    const stopAdding = React.useCallback(
        () => setIsAdding(false),
        [setIsAdding]
    );

    const payoutDisabled =
        !isProcessed || (maybeBackdate && backdateWidget.data === "");
    const payoutDetail =
        maybeBackdate && backdateWidget.data === "yes"
            ? "backdate-" + backdateYear
            : "";

    return (
        <>
            <div {...CONTENT_AREA}>
                <Table>
                    {hasPreviousPayouts && (
                        <thead>
                            <tr>
                                <th />
                                <th />
                                <th />
                                <th>Current Payout</th>
                                <th>Previous Payouts</th>
                                <th>Total Project to Date</th>
                            </tr>
                        </thead>
                    )}

                    <tbody>
                        {props.data.certifiedForemen.map((certifiedForeman) => (
                            <CFPercentOfWhole
                                key={certifiedForeman.certifiedForeman}
                                certifiedForeman={certifiedForeman}
                                payout={props.data}
                            />
                        ))}
                        <tr>
                            <th colSpan={2}>Non-CF Expenses</th>
                            {pcells(
                                calcPayoutTotalNonCertifiedForemanExpenses,
                                calcPayoutAmountTotal
                            )}
                        </tr>
                        <tr {...ROW_BORDER}>
                            <th colSpan={2}>Total Project Expenses</th>
                            {pcells(
                                calcPayoutTotalProjectExpenses,
                                calcPayoutAmountTotal
                            )}
                        </tr>
                        <tr>
                            <th colSpan={2}>Remdal Margin</th>
                            {pcells(
                                calcPayoutRemdalAmount,
                                calcPayoutAmountTotal
                            )}
                        </tr>
                        <tr>
                            <th colSpan={2}>
                                Estimator &amp; Project Manager Compensation
                            </th>
                            {pcells(
                                calcPayoutPayoutAmount,
                                calcPayoutAmountTotal
                            )}
                        </tr>
                        <tr {...ROW_BORDER}>
                            <th>Role</th>
                            <th>User</th>
                            <th style={{ width: "12em" }}>% of Job</th>
                            <th style={{ width: "12em" }}>Commission %</th>
                            <th style={{ width: "12em" }}>Effective %</th>
                            <th style={{ width: "12em" }}>Amount</th>
                            <th />
                        </tr>
                    </tbody>
                    <widgets.commissions containerClass="tbody" />
                </Table>
                {isAdding ? (
                    <AddComissionsWidget
                        dispatch={props.dispatch}
                        stopAdding={stopAdding}
                    />
                ) : (
                    <>
                        <div
                            style={{
                                marginBottom: "1em",
                            }}
                        >
                            <Button onClick={startAdding}>
                                Add Other Personnel for Compensation{" "}
                            </Button>
                        </div>
                    </>
                )}

                <widgets.note />
                <div style={{ height: "1em" }} />
            </div>
            {calcPayoutHasMarginVariance(props.data) && (
                <>
                    <Alert variant="danger">
                        <ul>
                            {marginVariance.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </Alert>
                    <widgets.marginVarianceExplanation label="Explanation for Margin Variance" />
                </>
            )}
            {!isProcessed && (
                <Alert variant="danger">
                    Project has not been processed for payout.
                </Alert>
            )}
            {maybeBackdate && (
                <FormWrapper
                    label={
                        "Should this payout be back-dated to " +
                        backdateYear +
                        "?"
                    }
                >
                    {backdateWidget.component}
                </FormWrapper>
            )}
            <GenerateButton
                label="Generate Payout"
                disabled={payoutDisabled}
                detail={payoutDetail}
            />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.commissions> &
    WidgetContext<typeof Fields.note> &
    WidgetContext<typeof Fields.marginVarianceExplanation>;
type ExtraProps = {};
type BaseState = {
    commissions: WidgetState<typeof Fields.commissions>;
    note: WidgetState<typeof Fields.note>;
    marginVarianceExplanation: WidgetState<
        typeof Fields.marginVarianceExplanation
    >;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "COMMISSIONS"; action: WidgetAction<typeof Fields.commissions> }
    | { type: "NOTE"; action: WidgetAction<typeof Fields.note> }
    | {
          type: "MARGIN_VARIANCE_EXPLANATION";
          action: WidgetAction<typeof Fields.marginVarianceExplanation>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.commissions,
        data.commissions,
        cache,
        "commissions",
        errors
    );
    subvalidate(Fields.note, data.note, cache, "note", errors);
    subvalidate(
        Fields.marginVarianceExplanation,
        data.marginVarianceExplanation,
        cache,
        "marginVarianceExplanation",
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
        case "COMMISSIONS": {
            const inner = Fields.commissions.reduce(
                state.commissions,
                data.commissions,
                action.action,
                subcontext
            );
            return {
                state: { ...state, commissions: inner.state },
                data: { ...data, commissions: inner.data },
            };
        }
        case "NOTE": {
            const inner = Fields.note.reduce(
                state.note,
                data.note,
                action.action,
                subcontext
            );
            return {
                state: { ...state, note: inner.state },
                data: { ...data, note: inner.data },
            };
        }
        case "MARGIN_VARIANCE_EXPLANATION": {
            const inner = Fields.marginVarianceExplanation.reduce(
                state.marginVarianceExplanation,
                data.marginVarianceExplanation,
                action.action,
                subcontext
            );
            return {
                state: { ...state, marginVarianceExplanation: inner.state },
                data: { ...data, marginVarianceExplanation: inner.data },
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
    commissions: function (
        props: WidgetExtraProps<typeof Fields.commissions> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMMISSIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "commissions", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.commissions.component
                state={context.state.commissions}
                data={context.data.commissions}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Commissions"}
            />
        );
    },
    note: function (
        props: WidgetExtraProps<typeof Fields.note> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "NOTE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "note", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.note.component
                state={context.state.note}
                data={context.data.note}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Note"}
            />
        );
    },
    marginVarianceExplanation: function (
        props: WidgetExtraProps<typeof Fields.marginVarianceExplanation> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MARGIN_VARIANCE_EXPLANATION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "marginVarianceExplanation",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.marginVarianceExplanation.component
                state={context.state.marginVarianceExplanation}
                data={context.data.marginVarianceExplanation}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Margin Variance Explanation"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PAYOUT_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let commissionsState;
        {
            const inner = Fields.commissions.initialize(
                data.commissions,
                subcontext,
                subparameters.commissions
            );
            commissionsState = inner.state;
            data = { ...data, commissions: inner.data };
        }
        let noteState;
        {
            const inner = Fields.note.initialize(
                data.note,
                subcontext,
                subparameters.note
            );
            noteState = inner.state;
            data = { ...data, note: inner.data };
        }
        let marginVarianceExplanationState;
        {
            const inner = Fields.marginVarianceExplanation.initialize(
                data.marginVarianceExplanation,
                subcontext,
                subparameters.marginVarianceExplanation
            );
            marginVarianceExplanationState = inner.state;
            data = { ...data, marginVarianceExplanation: inner.data };
        }
        let state = {
            initialParameters: parameters,
            commissions: commissionsState,
            note: noteState,
            marginVarianceExplanation: marginVarianceExplanationState,
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
                <RecordContext meta={PAYOUT_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
};
export default Widget;
type Widgets = {
    commissions: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.commissions>
    >;
    note: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.note>
    >;
    marginVarianceExplanation: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.marginVarianceExplanation>
    >;
};
// END MAGIC -- DO NOT EDIT
