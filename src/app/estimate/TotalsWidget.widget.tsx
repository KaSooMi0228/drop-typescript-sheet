import Decimal from "decimal.js";
import { css } from "glamor";
import { range, some } from "lodash";
import * as React from "react";
import { Button, ButtonGroup, Col, Row, Table } from "react-bootstrap";
import { useLocalStorage } from "usehooks-ts";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { FormWrapper } from "../../clay/widgets/FormField";
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
import { MoneyWidget, rawFormatMoney } from "../../clay/widgets/money-widget";
import { withCommas } from "../../clay/widgets/number-widget";
import { SelectSet } from "../../clay/widgets/select-set";
import { TABLE_FIXED } from "../styles";
import { resolveAction, resolveSideAction } from "./action/table";
import { allowanceCost, allowancePrice } from "./allowances/table";
import {
    calcEstimateContingencyItemCost,
    calcEstimateContingencyItemPrice,
    contingencySide,
    Estimate,
    ESTIMATE_META,
} from "./table";

export type Data = Estimate;

export const Fields = {
    baseHourRate: MoneyWidget,
};

export function formatMoney(number: Decimal) {
    return "$" + withCommas(false, rawFormatMoney(number));
}

export function formatNumber(number: Decimal) {
    return withCommas(false, number.toDecimalPlaces(1).toString());
}

const MONEY_COL = css({
    textAlign: "right",
});

type V = {
    value: string;
    label: string;
};

type VT = [V[], (values: V[]) => void];

type VTX = (f: () => V[]) => VT;

function createTotalsState(): VTX {
    let memory: string[] | null = null;
    return (provider: () => { label: string; value: string }[]) => {
        const [value, set] = React.useState<{ label: string; value: string }[]>(
            () => {
                return provider().filter(
                    (x) => memory === null || memory.indexOf(x.value) !== -1
                );
            }
        );
        function mySet(value: { label: string; value: string }[]) {
            memory = value.map((x) => x.value);
            set(value);
        }
        return [value, mySet];
    };
}

const useSelectedAreas = createTotalsState();
const useSelectedActions = createTotalsState();

function Component(props: Props) {
    const availableActions = React.useMemo(() => {
        return props.data.actions
            .filter((estimateAction, actionIndex) =>
                some(props.data.areas, (area) =>
                    some(area.sides, (side) => {
                        if (side.actions[actionIndex]) {
                            const resolvedAction = resolveSideAction(
                                estimateAction,
                                side.actions[actionIndex],
                                side,
                                props.data,
                                false
                            );
                            return (
                                !resolvedAction.hoursCost.isZero() ||
                                !resolvedAction.materialsCost.isZero()
                            );
                        } else {
                            return false;
                        }
                    })
                )
            )
            .map((action) => ({
                value: action.id.uuid,
                label: action.name,
            }));
    }, [props.data]);

    const [selectedAreas, setSelectedAreas] = useSelectedAreas(() =>
        props.data.areas.map((area) => ({
            value: area.id.uuid,
            label: area.name,
        }))
    );

    const [selectedActions, setSelectedActions] = useSelectedActions(
        () => availableActions
    );

    const [displayBy, setDisplayBy] = useLocalStorage<
        "area" | "side" | "phase" | "action"
    >("estimate-totals-display-by", "action");

    let totals: Dictionary<{
        hours: Decimal;
        materials: Decimal;
        cost: Decimal;
        price: Decimal;
        hoursCost: Decimal;
        materialsCost: Decimal;
    }> = {};

    for (const area of props.data.areas) {
        if (
            some(
                selectedAreas,
                (selectedArea) => selectedArea.value === area.id.uuid
            )
        ) {
            let sideIndex = -1;
            for (const side of area.sides) {
                sideIndex += 1;

                for (let index = 0; index < side.actions.length; index++) {
                    const estimateAction = props.data.actions[index];

                    if (
                        some(
                            selectedActions,
                            (selectedAction) =>
                                selectedAction.value === estimateAction.id.uuid
                        )
                    ) {
                        const resolvedAction = resolveSideAction(
                            estimateAction,
                            side.actions[index],
                            side,
                            props.data,
                            false
                        );

                        let key;
                        switch (displayBy) {
                            case "area":
                                key = area.id.uuid;
                                break;
                            case "phase":
                                key = `${area.phase}`;
                                break;
                            case "side":
                                key = `${area.id.uuid}-${sideIndex}`;
                                break;
                            case "action":
                                key = estimateAction.id.uuid;
                                break;
                            default:
                                throw new Error("unreachable");
                        }

                        if (!(key in totals)) {
                            totals[key] = {
                                hours: new Decimal(0),
                                materials: new Decimal(0),
                                cost: new Decimal(0),
                                price: new Decimal(0),
                                hoursCost: new Decimal(0),
                                materialsCost: new Decimal(0),
                            };
                        }

                        const target = totals[key];

                        target.hours = target.hours.plus(resolvedAction.hours);
                        target.materials = target.materials.plus(
                            resolvedAction.materials
                        );
                        target.cost = target.cost.plus(
                            resolvedAction.hoursCost.plus(
                                resolvedAction.materialsCost
                            )
                        );
                        target.hoursCost = target.hoursCost.plus(
                            resolvedAction.hoursCost
                        );
                        target.materialsCost = target.materialsCost.plus(
                            resolvedAction.materialsCost
                        );
                        target.price = target.price.plus(
                            resolvedAction.hoursPrice.plus(
                                resolvedAction.materialsPrice
                            )
                        );
                    }
                }
            }
        }
    }

    let groups: {
        value: string;
        label: string;
    }[];
    switch (displayBy) {
        case "area":
            groups = props.data.areas.map((area) => ({
                label: area.name,
                value: area.id.uuid,
            }));
            break;
        case "phase":
            const finalPhase = Decimal.max(
                ...props.data.areas.map((area) => area.phase)
            );
            groups = range(1, finalPhase.toNumber() + 1).map((phase) => ({
                label: phase + "",
                value: phase + "",
            }));
            break;
        case "side":
            groups = [];
            for (const area of props.data.areas) {
                if (
                    some(
                        selectedAreas,
                        (selectedArea) => selectedArea.value === area.id.uuid
                    )
                ) {
                    let sideIndex = -1;
                    for (const side of area.sides) {
                        sideIndex += 1;
                        let key = `${area.id.uuid}-${sideIndex}`;

                        groups.push({
                            value: key,
                            label: area.name + " - " + side.name,
                        });
                    }
                }
            }

            break;
        case "action":
            groups = availableActions;
            break;
    }

    const overall = {
        hours: new Decimal(0),
        materials: new Decimal(0),
        cost: new Decimal(0),
        price: new Decimal(0),
        hoursCost: new Decimal(0),
        materialsCost: new Decimal(0),
    };
    for (const row of Object.values(totals)) {
        overall.hours = overall.hours.plus(row.hours);
        overall.materials = overall.materials.plus(row.materials);
        overall.cost = overall.cost.plus(row.cost);
        overall.price = overall.price.plus(row.price);
        overall.hoursCost = overall.hoursCost.plus(row.hoursCost);
        overall.materialsCost = overall.materialsCost.plus(row.materialsCost);
    }

    let allowanceTotalCost = new Decimal(0);
    let allowanceTotalPrice = new Decimal(0);
    for (const allowance of props.data.allowances) {
        if (allowance.areas.length == 0) {
            allowanceTotalCost = allowanceTotalCost.plus(
                allowanceCost(allowance)
            );
            allowanceTotalPrice = allowanceTotalPrice.plus(
                allowancePrice(
                    allowance,
                    props.data.common.additionalAllowancesMarkup ||
                        props.data.common.additionalMarkup
                )
            );
        } else {
            for (const area of allowance.areas) {
                if (
                    some(
                        selectedAreas,
                        (selectedArea) => selectedArea.value === area
                    )
                ) {
                    allowanceTotalCost = allowanceTotalCost.plus(
                        allowance.cost
                    );
                    allowanceTotalPrice = allowanceTotalPrice.plus(
                        allowance.cost
                            .times(new Decimal(1).plus(allowance.markup))
                            .times(
                                new Decimal(1).plus(
                                    props.data.common
                                        .additionalAllowancesMarkup ||
                                        props.data.common.additionalMarkup
                                )
                            )
                            .toDecimalPlaces(2)
                    );
                }
            }
        }
    }

    let contingencyItemTotalCost = new Decimal(0);
    let contingencyItemTotalPrice = new Decimal(0);
    for (const contingencyItem of props.data.contingencyItems) {
        contingencyItemTotalCost = contingencyItemTotalCost.plus(
            calcEstimateContingencyItemCost(contingencyItem)
        );
        contingencyItemTotalPrice = contingencyItemTotalPrice.plus(
            calcEstimateContingencyItemPrice(contingencyItem)
        );
    }

    for (const contingencyItem of props.data.contingencyItemsV2) {
        const resolved = resolveAction(
            contingencyItem.estimate,
            contingencyItem.side,
            contingencySide(props.data),
            props.data,
            true
        );
        contingencyItemTotalCost = resolved.hoursCost
            .plus(resolved.materialsCost)
            .plus(contingencyItemTotalCost);
        contingencyItemTotalPrice = resolved.hoursPrice
            .plus(resolved.materialsPrice)
            .plus(contingencyItemTotalPrice);
    }

    return (
        <>
            <Row>
                <Col>
                    <FormWrapper label="Areas">
                        <SelectSet
                            options={props.data.areas.map((area) => ({
                                label: area.name,
                                value: area.id.uuid,
                            }))}
                            value={selectedAreas}
                            onChange={setSelectedAreas}
                        />
                    </FormWrapper>
                </Col>
                <Col>
                    <FormWrapper label="Actions">
                        <SelectSet
                            options={availableActions}
                            value={selectedActions}
                            onChange={setSelectedActions}
                        />
                    </FormWrapper>
                </Col>
            </Row>
            <Row>
                <Col>
                    <FormWrapper label="Display By">
                        <ButtonGroup>
                            <Button
                                variant={
                                    displayBy === "area"
                                        ? "primary"
                                        : "secondary"
                                }
                                onClick={setDisplayBy.bind(null, "area")}
                            >
                                Area
                            </Button>
                            <Button
                                variant={
                                    displayBy === "phase"
                                        ? "primary"
                                        : "secondary"
                                }
                                onClick={setDisplayBy.bind(null, "phase")}
                            >
                                Phase
                            </Button>
                            <Button
                                variant={
                                    displayBy === "side"
                                        ? "primary"
                                        : "secondary"
                                }
                                onClick={setDisplayBy.bind(null, "side")}
                            >
                                Side
                            </Button>
                            <Button
                                variant={
                                    displayBy === "action"
                                        ? "primary"
                                        : "secondary"
                                }
                                onClick={setDisplayBy.bind(null, "action")}
                            >
                                Action
                            </Button>
                        </ButtonGroup>
                    </FormWrapper>
                </Col>
            </Row>
            <Table {...TABLE_FIXED}>
                <thead>
                    <tr>
                        <th />
                        <th {...MONEY_COL}>Hours</th>
                        <th {...MONEY_COL}>Materials</th>
                        <th {...MONEY_COL}>Labour Cost</th>
                        <th {...MONEY_COL}>Materials Cost</th>
                        <th {...MONEY_COL}>Cost</th>
                        <th {...MONEY_COL}>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {groups.map((group) => {
                        const total = totals[group.value] || {
                            hours: new Decimal(0),
                            materials: new Decimal(0),
                            cost: new Decimal(0),
                            price: new Decimal(0),
                            hoursCost: new Decimal(0),
                            materialsCost: new Decimal(0),
                        };
                        return (
                            <tr key={group.value}>
                                <td>{group.label}</td>
                                <td {...MONEY_COL}>
                                    {formatNumber(total.hours)}
                                </td>
                                <td {...MONEY_COL}>
                                    {formatNumber(total.materials)}
                                </td>
                                <td {...MONEY_COL}>
                                    {formatMoney(total.hoursCost)}
                                </td>
                                <td {...MONEY_COL}>
                                    {formatMoney(total.materialsCost)}
                                </td>
                                <td {...MONEY_COL}>
                                    {formatMoney(total.cost)}
                                </td>
                                <td {...MONEY_COL}>
                                    {formatMoney(total.price)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr>
                        <th>Estimate Totals</th>
                        <th {...MONEY_COL}>{formatNumber(overall.hours)}</th>
                        <th {...MONEY_COL}>
                            {formatNumber(overall.materials)}
                        </th>

                        <td {...MONEY_COL}>{formatMoney(overall.hoursCost)}</td>
                        <td {...MONEY_COL}>
                            {formatMoney(overall.materialsCost)}
                        </td>
                        <th {...MONEY_COL}>{formatMoney(overall.cost)}</th>
                        <th {...MONEY_COL}>{formatMoney(overall.price)}</th>
                    </tr>

                    <tr style={{ fontStyle: "italic" }}>
                        <td>Contingency Items</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td {...MONEY_COL}>
                            {formatMoney(contingencyItemTotalCost)}
                        </td>
                        <td {...MONEY_COL}>
                            {formatMoney(contingencyItemTotalPrice)}
                        </td>
                    </tr>
                    <tr style={{ fontStyle: "italic" }}>
                        <td>Allowances</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td {...MONEY_COL}>
                            {formatMoney(allowanceTotalCost)}
                        </td>
                        <td {...MONEY_COL}>
                            {formatMoney(allowanceTotalPrice)}
                        </td>
                    </tr>
                    <tr style={{ borderTopStyle: "double" }}>
                        <th>Overall</th>
                        <th {...MONEY_COL}>{formatNumber(overall.hours)}</th>
                        <th {...MONEY_COL}>
                            {formatNumber(overall.materials)}
                        </th>
                        <th {...MONEY_COL}>{formatMoney(overall.hoursCost)}</th>
                        <th {...MONEY_COL}>
                            {formatMoney(overall.materialsCost)}
                        </th>

                        <th {...MONEY_COL}>
                            {formatMoney(
                                overall.cost
                                    .plus(allowanceTotalCost)
                                    .plus(contingencyItemTotalCost)
                            )}
                        </th>
                        <th {...MONEY_COL}>
                            {formatMoney(
                                overall.price
                                    .plus(allowanceTotalPrice)
                                    .plus(contingencyItemTotalPrice)
                            )}
                        </th>
                    </tr>
                </tfoot>
            </Table>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.baseHourRate>;
type ExtraProps = {};
type BaseState = {
    baseHourRate: WidgetState<typeof Fields.baseHourRate>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "BASE_HOUR_RATE";
    action: WidgetAction<typeof Fields.baseHourRate>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.baseHourRate,
        data.baseHourRate,
        cache,
        "baseHourRate",
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
        case "BASE_HOUR_RATE": {
            const inner = Fields.baseHourRate.reduce(
                state.baseHourRate,
                data.baseHourRate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, baseHourRate: inner.state },
                data: { ...data, baseHourRate: inner.data },
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
    baseHourRate: function (
        props: WidgetExtraProps<typeof Fields.baseHourRate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "BASE_HOUR_RATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "baseHourRate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.baseHourRate.component
                state={context.state.baseHourRate}
                data={context.data.baseHourRate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Base Hour Rate"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ESTIMATE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let baseHourRateState;
        {
            const inner = Fields.baseHourRate.initialize(
                data.baseHourRate,
                subcontext,
                subparameters.baseHourRate
            );
            baseHourRateState = inner.state;
            data = { ...data, baseHourRate: inner.data };
        }
        let state = {
            initialParameters: parameters,
            baseHourRate: baseHourRateState,
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
                <RecordContext meta={ESTIMATE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    baseHourRate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.baseHourRate>
    >;
};
// END MAGIC -- DO NOT EDIT
