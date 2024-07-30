import { OutsideClickHandler } from "@lani.ground/react-outside-click-handler";
import Decimal from "decimal.js";
import { css } from "glamor";
import { find, some } from "lodash";
import React, { useRef } from "react";
import { Button, Form } from "react-bootstrap";
import Select, { components } from "react-select";
import { Dictionary } from "../../clay/common";
import { Link } from "../../clay/link";
import { propCheck } from "../../clay/propCheck";
import { sumMap } from "../../clay/queryFuncs";
import { QuickCacheApi, useQuickCache } from "../../clay/quick-cache";
import {
    FormField,
    FormWrapper,
    Optional,
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
import { LinkSetWidget } from "../../clay/widgets/link-set-widget";
import { ListWidget } from "../../clay/widgets/ListWidget";
import { MoneyStatic, MoneyWidget } from "../../clay/widgets/money-widget";
import { NumberWidgetAction } from "../../clay/widgets/number-widget";
import { PercentageWidget } from "../../clay/widgets/percentage-widget";
import { selectStyle } from "../../clay/widgets/SelectLinkWidget";
import { TextAreaWidget } from "../../clay/widgets/TextAreaWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { formatMoney, formatNumber } from "../estimate/TotalsWidget.widget";
import { TABLE_STYLE } from "../styles";
import { ReactContext as QuotationOptionsWidgetReactContext } from "./QuotationOptionsWidget.widget";
import { resolveOption } from "./resolve-option";
import ScheduleWidget from "./ScheduleWidget.widget";
import {
    SourceArea,
    SourceAreaAction,
    SourceAreaAllowance,
    SourceAreaContingency,
    SOURCE_AREA_ACTION_META,
    SOURCE_AREA_ALLOWANCE_META,
    SOURCE_AREA_CONTINGENCY_META,
    SOURCE_AREA_META,
} from "./source-area";
import {
    doesScheduleHave,
    QuotationOption,
    QUOTATION_OPTION_META,
    Schedule,
    SchedulePartKeys,
    schedulePortion,
} from "./table";

export type Data = QuotationOption;

const Fields = {
    name: FormField(TextWidget),
    areas: FormField(
        LinkSetWidget({
            meta: SOURCE_AREA_META,
            name: (area) => area.name,
        })
    ),
    schedules: ListWidget(ScheduleWidget, { emptyOk: true }),
    actions: Optional(
        LinkSetWidget({
            meta: SOURCE_AREA_ACTION_META,
            name: (action) => action.name,
        })
    ),
    hiddenActions: Optional(
        LinkSetWidget({
            meta: SOURCE_AREA_ACTION_META,
            name: (action) => action.name,
        })
    ),
    allowances: Optional(
        LinkSetWidget({
            meta: SOURCE_AREA_ALLOWANCE_META,
            name: (action) => action.name,
        })
    ),
    contingencies: Optional(
        LinkSetWidget({
            meta: SOURCE_AREA_CONTINGENCY_META,
            name: (action) => action.description,
        })
    ),
    adjustment: OptionalFormField(MoneyWidget),
    description: FormField(TextAreaWidget),
};

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);
    if (data.description.indexOf(" as per scope ") !== -1) {
        return [
            ...errors,
            {
                field: "description",
                invalid: true,
                empty: false,
            },
        ];
    }
    return errors;
}

export function reduce(
    state: State,
    data: Data,
    action: BaseAction,
    context: Context
): WidgetResult<State, Data> {
    const inner = baseReduce(state, data, action, context);

    if (inner.data.schedules.length > 0 && !inner.data.adjustment.isZero()) {
        // Ensure that if there is a schedule, adjustment is always zero
        return {
            ...inner,
            data: {
                ...inner.data,
                adjustment: new Decimal(0),
            },
        };
    }

    return inner;
}

function actionSetSchedule(
    state: State,
    data: QuotationOption,
    id: string,
    schedule_index: number,
    key: SchedulePartKeys
): { state: State; data: Data } {
    return {
        state,
        data: {
            ...data,
            schedules: data.schedules.map((schedule, index) => ({
                ...schedule,
                [key]:
                    index === schedule_index
                        ? [
                              ...schedule[key].filter((x) => x.item !== id),
                              { item: id, portion: new Decimal(1) },
                          ]
                        : schedule[key].filter((x) => x.item !== id),
            })),
        },
    };
}

function actionSetSchedulePortion(
    state: State,
    data: QuotationOption,
    id: string,
    schedule_index: number,
    key: SchedulePartKeys,
    portion: Decimal
): { state: State; data: Data } {
    return {
        state,
        data: {
            ...data,
            schedules: data.schedules.map((schedule, index) =>
                index === schedule_index
                    ? {
                          ...schedule,
                          [key]: [
                              ...schedule[key].filter((x) => x.item !== id),
                              { item: id, portion },
                          ],
                      }
                    : schedule
            ),
        },
    };
}

export function actionSetActionState(
    state: State,
    data: QuotationOption,
    action_id: string,
    value: boolean,
    defaultHiddenActions: Set<String>
) {
    if (value) {
        return {
            state,
            data: {
                ...data,
                actions: [...data.actions, action_id],
                hiddenActions: defaultHiddenActions.has(action_id)
                    ? [...data.hiddenActions, action_id]
                    : data.hiddenActions.filter((id) => id != action_id),
            },
        };
    } else {
        return {
            state,
            data: {
                ...data,
                actions: data.actions.filter((id) => id != action_id),
            },
        };
    }
}

export function actionSetAllActions(
    state: State,
    data: QuotationOption,
    actions: string[],
    hiddenActions: string[]
) {
    return {
        state,
        data: {
            ...data,
            actions: actions,
            hiddenActions: hiddenActions,
        },
    };
}

const MORE_TABLE_STYLE = css({
    "& td": {
        border: "solid .5px rgb(128,128,128)",
    },
});

type IndexedSchedule = Schedule & { index: number };

const ZERO = new Decimal(0);

function ScheduleControlSingleValue() {
    return <></>;
}

function ScheduleControlInput(
    part_key: SchedulePartKeys,
    id: string,
    props: any
) {
    const value = React.useMemo(() => {
        return props.options
            .filter((x: Schedule) => doesScheduleHave(x, part_key, id))
            .map(
                (x: Schedule) =>
                    `${x.name}: ${find(x[part_key], (y) => y.item === id)!
                        .portion.times(100)
                        .toString()}%`
            )
            .join(", ");
    }, [id, part_key, props.options]);
    return components.Input({ ...props, value });
}

function ScheduleControlValueContainer(
    ref: React.MutableRefObject<any>,
    part_key: SchedulePartKeys,
    id: string,
    props: any
) {
    const value = React.useMemo(() => {
        return props.options
            .filter((x: Schedule) => doesScheduleHave(x, part_key, id))
            .map(
                (x: Schedule) =>
                    `${x.name}: ${find(x[part_key], (y) => y.item === id)!
                        .portion.times(100)
                        .toString()}%`
            )
            .join(", ");
    }, [id, part_key, props.options]);
    const onClick = React.useCallback(() => {
        if (ref.current.menuListRef) {
            ref.current.onMenuClose();
        } else {
            ref.current.openMenu("first");
        }
    }, [ref]);
    return (
        <div onClick={onClick} style={{ padding: "0.5em", flex: 1 }}>
            {value}
        </div>
    );
}

function ScheduleSelectOption(
    item: Link<SourceAreaAction | SourceAreaAllowance | SourceAreaContingency>,
    part_key: SchedulePartKeys,
    status: WidgetStatus,
    dispatch: (action: Action) => void,
    props: any
) {
    const data: IndexedSchedule = props.data;
    const detail = find(data[part_key], (x) => x.item === item) || null;
    const value = detail?.portion || ZERO;

    const [state, setState] = React.useState<string | null>(null);

    const localDispatch = React.useCallback(
        (action: NumberWidgetAction) => {
            const result = PercentageWidget.reduce(state, value, action, {});

            if (state != result.state) {
                setState(result.state);
            }
            if (!result.data.equals(value)) {
                dispatch({
                    type: "SET_SCHEDULE_PORTION",
                    id: item!,
                    schedule_index: data.index,
                    key: part_key,
                    portion: result.data,
                });
            }
        },
        [setState, state, value]
    );

    const onClick = React.useCallback((event) => {
        event.stopPropagation();
    }, []);

    return (
        <components.Option {...props}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label>{props.label}</label>
                <div onClick={onClick}>
                    <PercentageWidget.component
                        data={value}
                        status={{ mutable: status.mutable, validation: [] }}
                        dispatch={localDispatch}
                        state={state}
                    />
                </div>
            </div>
        </components.Option>
    );
}

function ScheduleControlWidget(props: {
    scheduleOptions: IndexedSchedule[];
    status: WidgetStatus;
    dispatch: Props["dispatch"];
    item: SourceAreaAction | SourceAreaAllowance | SourceAreaContingency;
    part_key: SchedulePartKeys;
    menuPlacement: "auto" | "top";
}) {
    const ref = useRef<any>();

    React.useEffect(() => {
        if (ref.current) {
            const originalInputBlur = ref.current.onInputBlur;
            ref.current.onInputBlur = function (event: any) {
                // by default react-select tries to refocus on it input whenever we refocus
                // anywhere within the menu, disable that, by doing nothing
                if (
                    ref.current.menuListRef &&
                    ref.current.menuListRef.contains(event.relatedTarget)
                ) {
                    return;
                }
                // but otherwise, accept the default handling which will make the dropdown go away
                originalInputBlur.call(ref.current, event);
            };
            ref.current.onMenuMouseDown = (event: Event) => {
                // All mouse down in the menu by default refocus the input
                // we don't want that so we replace the default handler with a do-nothing handler
            };
            ref.current.onKeyDown = (event: Event) => {};
        }
    }, [ref.current]);

    const scheduleValue =
        find(props.scheduleOptions, (schedule) =>
            doesScheduleHave(schedule, props.part_key, props.item.id.uuid)
        ) || null;

    const totalAssigned = props.scheduleOptions.reduce(
        (total, schedule) =>
            total.plus(
                schedulePortion(schedule, props.part_key, props.item.id.uuid)
            ),
        new Decimal(0)
    );

    const Input = React.useMemo(
        () =>
            ScheduleControlInput.bind(
                undefined,
                props.part_key,
                props.item.id.uuid
            ),
        [props.part_key, props.item.id.uuid]
    );
    const ValueContainer = React.useMemo(
        () =>
            ScheduleControlValueContainer.bind(
                undefined,
                ref,
                props.part_key,
                props.item.id.uuid
            ),
        [props.part_key, props.item.id.uuid]
    );

    const Option = React.useMemo(() => {
        return ScheduleSelectOption.bind(
            undefined,
            props.item.id.uuid,
            props.part_key,
            props.status,
            props.dispatch
        );
    }, [
        props.item.id.uuid,
        props.part_key,
        props.status.mutable,
        props.dispatch,
    ]);

    const onOutsideClick = React.useCallback(() => {
        ref.current.onMenuClose();
    }, [ref]);

    return (
        <OutsideClickHandler onOutsideClick={onOutsideClick}>
            <Select
                ref={ref}
                options={props.scheduleOptions}
                getOptionLabel={(schedule) => schedule.name}
                isDisabled={!props.status.mutable}
                styles={selectStyle(totalAssigned.lessThan(new Decimal(1)))}
                getOptionValue={(schedule) => `${schedule.index}`}
                onChange={(selected) => {
                    if (selected) {
                        props.dispatch({
                            type: "SET_SCHEDULE",
                            key: props.part_key,
                            schedule_index: (selected as any).index,
                            id: props.item.id.uuid,
                        });
                    }
                }}
                components={{
                    Option,
                    ValueContainer,
                    SingleValue: ScheduleControlSingleValue,
                    Input,
                }}
                value={scheduleValue}
                menuPlacement={props.menuPlacement}
            />
        </OutsideClickHandler>
    );
}

const ROW_STYLES = {
    included: css({
        backgroundColor: "rgb(250, 176, 120)",
    }),
    shown: css({
        backgroundColor: "#a0ffa0",
    }),
    skipped: css({
        backgroundColor: "#ffb0b0",
        "& .stat": {
            fontStyle: "italic",
        },
    }),
};

function Component(props: Props) {
    const quotationContext = React.useContext(
        QuotationOptionsWidgetReactContext
    )!;
    const cache = useQuickCache();

    const resolved = props.status.mutable
        ? resolveOption(cache, quotationContext.data, props.data)
        : {
              ...props.data.details,
              defaultHiddenActions: new Set([]),
              activeActions: props.data.details.actions,
          };

    const enableSchedule = React.useCallback(() => {
        props.dispatch({
            type: "SCHEDULES" as const,
            action: {
                type: "NEW" as const,
                actions: [],
            },
        });
    }, [props.dispatch]);

    const useScheduleActive = props.data.schedules.length > 0;

    const selectAllActions = React.useCallback(
        () =>
            props.dispatch({
                type: "SET_ALL_ACTIONS",
                actions: resolved.actions.map((action) => action.id.uuid),
                hiddenActions: Array.from(resolved.defaultHiddenActions),
            }),
        [props.dispatch, resolved.actions, resolved.defaultHiddenActions]
    );

    const selectNoneActions = React.useCallback(
        () =>
            props.dispatch({
                type: "SET_ALL_ACTIONS",
                actions: [],
                hiddenActions: [],
            }),
        [props.dispatch]
    );

    const selectAllAllowances = React.useCallback(
        () =>
            props.dispatch({
                type: "ALLOWANCES",
                action: {
                    type: "SET",
                    value: resolved.allowances.map((action) => action.id.uuid),
                },
            }),
        [props.dispatch, resolved.allowances]
    );

    const selectNoneContingencies = React.useCallback(
        () =>
            props.dispatch({
                type: "CONTINGENCIES",
                action: {
                    type: "SET",
                    value: [],
                },
            }),
        [props.dispatch]
    );

    const selectAllContingencies = React.useCallback(
        () =>
            props.dispatch({
                type: "CONTINGENCIES",
                action: {
                    type: "SET",
                    value: resolved.contingencies.map(
                        (action) => action.id.uuid
                    ),
                },
            }),
        [props.dispatch, resolved.allowances]
    );

    const selectNoneAllowances = React.useCallback(
        () =>
            props.dispatch({
                type: "ALLOWANCES",
                action: {
                    type: "SET",
                    value: [],
                },
            }),
        [props.dispatch]
    );

    const scheduleOptions = React.useMemo(
        () =>
            props.data.schedules.map((schedule, index) => ({
                ...schedule,
                index,
            })),
        [props.data.schedules]
    );

    return (
        <>
            <widgets.description label="Project Description" />
            <widgets.areas records={resolved.areas as SourceArea[]} selectAll />
            {useScheduleActive && (
                <FormWrapper label={"Schedule of Values"}>
                    <table {...TABLE_STYLE}>
                        <thead>
                            <tr>
                                <th style={{ width: "2.5em" }}></th>
                                <th>Name</th>
                                <th style={{ width: "10em" }}>Total</th>
                                <th style={{ width: "2.5em" }}></th>
                            </tr>
                        </thead>

                        <widgets.schedules
                            extraItemForAdd
                            containerClass="tbody"
                            itemFn={(index) => ({
                                total:
                                    resolved.schedules[index]?.total ||
                                    new Decimal("0"),
                            })}
                        />
                    </table>
                </FormWrapper>
            )}
            {!useScheduleActive && props.status.mutable && (
                <Button onClick={enableSchedule}>Add Schedule of Values</Button>
            )}

            <div
                style={{
                    display: "flex",
                    flexDirection: "row-reverse",
                    marginTop: "2em",
                    marginBottom: "2em",
                }}
            >
                {props.status.mutable && (
                    <div
                        style={{
                            flexGrow: 0,
                            display: "flex",
                            flexDirection: "column",
                            marginTop: "1em",
                            marginLeft: "1em",
                        }}
                    >
                        <Button onClick={selectAllActions}>
                            Select All Actions
                        </Button>{" "}
                        <div style={{ height: "1em" }} />
                        <Button onClick={selectNoneActions}>Select None</Button>
                    </div>
                )}
                <div
                    style={{
                        flexGrow: 1,
                    }}
                >
                    <table
                        {...TABLE_STYLE}
                        {...MORE_TABLE_STYLE}
                        style={{
                            width: "100%",
                        }}
                    >
                        <thead>
                            <tr>
                                <th>Include</th>
                                <th>Hide</th>
                                <th>Actions</th>
                                {scheduleOptions.length > 0 && (
                                    <th>Schedule</th>
                                )}
                                <th>Finish Schedule</th>
                                <th>Hours</th>
                                <th>Materials</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resolved.actions.map((action) => {
                                const included = some(
                                    resolved.activeActions,
                                    (resolved_action) =>
                                        action.id.uuid ==
                                        resolved_action.id.uuid
                                );
                                const shown =
                                    included &&
                                    props.data.hiddenActions.indexOf(
                                        action.id.uuid
                                    ) === -1;

                                return (
                                    <tr
                                        {...(included
                                            ? shown
                                                ? ROW_STYLES.shown
                                                : ROW_STYLES.included
                                            : ROW_STYLES.skipped)}
                                    >
                                        <td
                                            style={{
                                                width: "4em",
                                                textAlign: "center",
                                            }}
                                        >
                                            <Form.Check
                                                style={{
                                                    display: "inline-block",
                                                }}
                                                className="checkbox-widget"
                                                type="checkbox"
                                                checked={included}
                                                disabled={!props.status.mutable}
                                                onChange={(
                                                    event: React.ChangeEvent<HTMLInputElement>
                                                ) => {
                                                    props.dispatch({
                                                        type: "SET_ACTION_STATE",
                                                        action_id:
                                                            action.id.uuid,
                                                        value: event.target
                                                            .checked,
                                                        defaultHiddenActions:
                                                            resolved.defaultHiddenActions,
                                                    });
                                                }}
                                            />
                                        </td>
                                        <td
                                            style={{
                                                width: "4em",
                                                textAlign: "center",
                                            }}
                                        >
                                            {included && (
                                                <Form.Check
                                                    style={{
                                                        display: "inline-block",
                                                    }}
                                                    className="checkbox-widget"
                                                    type="checkbox"
                                                    checked={!shown}
                                                    disabled={
                                                        !props.status.mutable
                                                    }
                                                    onChange={(
                                                        event: React.ChangeEvent<HTMLInputElement>
                                                    ) =>
                                                        props.dispatch({
                                                            type: "HIDDEN_ACTIONS",
                                                            action: {
                                                                type: "SET",
                                                                value: event
                                                                    .target
                                                                    .checked
                                                                    ? [
                                                                          ...props
                                                                              .data
                                                                              .hiddenActions,
                                                                          action
                                                                              .id
                                                                              .uuid,
                                                                      ]
                                                                    : props.data.hiddenActions.filter(
                                                                          (
                                                                              entry
                                                                          ) =>
                                                                              entry !==
                                                                              action
                                                                                  .id
                                                                                  .uuid
                                                                      ),
                                                            },
                                                        })
                                                    }
                                                />
                                            )}
                                        </td>
                                        <td style={{ width: "10em" }}>
                                            {action.name}
                                        </td>
                                        {scheduleOptions.length > 0 && (
                                            <td style={{ width: "33%" }}>
                                                {included && (
                                                    <ScheduleControlWidget
                                                        scheduleOptions={
                                                            scheduleOptions
                                                        }
                                                        status={props.status}
                                                        dispatch={
                                                            props.dispatch
                                                        }
                                                        item={action}
                                                        part_key="actions"
                                                        menuPlacement="auto"
                                                    />
                                                )}
                                            </td>
                                        )}
                                        <td
                                            style={{
                                                opacity:
                                                    props.data.hiddenActions.indexOf(
                                                        action.id.uuid
                                                    ) === -1
                                                        ? undefined
                                                        : 0.5,
                                            }}
                                        >
                                            {action.finishSchedule !== "" &&
                                                action.finishSchedule}
                                        </td>
                                        <td
                                            className="stat"
                                            style={{
                                                width: "5em",
                                            }}
                                        >
                                            {formatNumber(action.hours)}
                                        </td>
                                        <td
                                            className="stat"
                                            style={{
                                                width: "5em",
                                            }}
                                        >
                                            {formatNumber(action.materials)}
                                        </td>
                                        <td
                                            className="stat"
                                            style={{
                                                width: "7.5em",
                                            }}
                                        >
                                            {formatMoney(action.price)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th />
                                <th />
                                <th>Total</th>
                                <th></th>
                                {scheduleOptions.length > 0 && <th></th>}
                                <th style={{ textAlign: "right" }}>
                                    {formatNumber(
                                        resolved.activeActions.reduce(
                                            (total, action) =>
                                                total.plus(action.hours),
                                            new Decimal(0)
                                        )
                                    )}
                                </th>
                                <th style={{ textAlign: "right" }}>
                                    {formatNumber(
                                        resolved.activeActions.reduce(
                                            (total, action) =>
                                                total.plus(action.materials),
                                            new Decimal(0)
                                        )
                                    )}
                                </th>
                                <th style={{ textAlign: "right" }}>
                                    {formatMoney(resolved.actionPriceTotal)}
                                </th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {resolved.contingencies.length === 0 ? (
                "Contingencies: None"
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row-reverse",
                    }}
                >
                    <div
                        style={{
                            flexGrow: 0,
                            display: "flex",
                            flexDirection: "column",
                            marginTop: "1em",
                            marginLeft: "1em",
                        }}
                    >
                        <Button onClick={selectAllContingencies}>
                            Select All Contingencies
                        </Button>
                        <div style={{ height: "1em" }} />
                        <Button onClick={selectNoneContingencies}>
                            Select None
                        </Button>
                    </div>
                    <div
                        style={{
                            flexGrow: 1,
                        }}
                    >
                        <table {...TABLE_STYLE}>
                            <thead>
                                <tr>
                                    <th>Contingencies</th>
                                    <th>Hours</th>
                                    <th>Materials</th>
                                    <th>Units</th>
                                    <th>Unit Rate</th>
                                    {scheduleOptions.length > 0 && (
                                        <th>Schedule</th>
                                    )}
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resolved.contingencies.map((contingency) => {
                                    const included =
                                        props.data.contingencies.indexOf(
                                            contingency.id.uuid
                                        ) !== -1;

                                    return (
                                        <tr
                                            style={{
                                                opacity: included
                                                    ? undefined
                                                    : 0.5,
                                            }}
                                        >
                                            <td style={{ minWidth: "10em" }}>
                                                <Form.Check
                                                    style={{
                                                        display: "inline-block",
                                                    }}
                                                    className="checkbox-widget"
                                                    type="checkbox"
                                                    checked={included}
                                                    disabled={
                                                        !props.status.mutable
                                                    }
                                                    onChange={(
                                                        event: React.ChangeEvent<HTMLInputElement>
                                                    ) =>
                                                        props.dispatch({
                                                            type: "CONTINGENCIES",
                                                            action: {
                                                                type: "SET",
                                                                value: event
                                                                    .target
                                                                    .checked
                                                                    ? [
                                                                          ...props
                                                                              .data
                                                                              .contingencies,
                                                                          contingency
                                                                              .id
                                                                              .uuid,
                                                                      ]
                                                                    : props.data.contingencies.filter(
                                                                          (
                                                                              entry
                                                                          ) =>
                                                                              entry !==
                                                                              contingency
                                                                                  .id
                                                                                  .uuid
                                                                      ),
                                                            },
                                                        })
                                                    }
                                                />{" "}
                                                {contingency.description}
                                            </td>
                                            <td>
                                                {contingency.hours.toString()}
                                            </td>
                                            <td>
                                                {contingency.materials.toString()}
                                            </td>
                                            <td>
                                                {contingency.quantity.toString()}
                                            </td>
                                            <td>
                                                {formatMoney(
                                                    contingency.priceRate
                                                )}
                                            </td>
                                            {scheduleOptions.length > 0 && (
                                                <td style={{ width: "33%" }}>
                                                    {included && (
                                                        <ScheduleControlWidget
                                                            scheduleOptions={
                                                                scheduleOptions
                                                            }
                                                            status={
                                                                props.status
                                                            }
                                                            dispatch={
                                                                props.dispatch
                                                            }
                                                            item={contingency}
                                                            part_key="contingencies"
                                                            menuPlacement="auto"
                                                        />
                                                    )}
                                                </td>
                                            )}
                                            <td>
                                                {formatMoney(
                                                    contingency.quantity.times(
                                                        contingency.priceRate
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th>Total</th>{" "}
                                    {scheduleOptions.length > 0 && <th></th>}
                                    <th>
                                        {sumMap(
                                            resolved.contingencies,
                                            (x) => x.hours
                                        ).toString()}
                                    </th>
                                    <th>
                                        {sumMap(
                                            resolved.contingencies,
                                            (x) => x.materials
                                        ).toString()}
                                    </th>
                                    <th />
                                    <th />
                                    <th>
                                        {formatMoney(
                                            resolved.contingencyPriceTotal
                                        )}
                                    </th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {resolved.allowances.length === 0 ? (
                "Allowances: None"
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row-reverse",
                    }}
                >
                    <div
                        style={{
                            flexGrow: 0,
                            display: "flex",
                            flexDirection: "column",
                            marginTop: "1em",
                            marginLeft: "1em",
                        }}
                    >
                        <Button onClick={selectAllAllowances}>
                            Select All Allowances
                        </Button>
                        <div style={{ height: "1em" }} />
                        <Button onClick={selectNoneAllowances}>
                            Select None
                        </Button>
                    </div>
                    <div
                        style={{
                            flexGrow: 1,
                        }}
                    >
                        <table {...TABLE_STYLE}>
                            <thead>
                                <tr>
                                    <th>Allowances</th>{" "}
                                    {scheduleOptions.length > 0 && (
                                        <th>Schedule</th>
                                    )}
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resolved.allowances.map((allowance) => {
                                    const included =
                                        props.data.allowances.indexOf(
                                            allowance.id.uuid
                                        ) !== -1;
                                    return (
                                        <tr
                                            style={{
                                                opacity: included
                                                    ? undefined
                                                    : 0.5,
                                            }}
                                        >
                                            <td style={{ minWidth: "10em" }}>
                                                <Form.Check
                                                    style={{
                                                        display: "inline-block",
                                                    }}
                                                    className="checkbox-widget"
                                                    type="checkbox"
                                                    checked={included}
                                                    disabled={
                                                        !props.status.mutable
                                                    }
                                                    onChange={(
                                                        event: React.ChangeEvent<HTMLInputElement>
                                                    ) =>
                                                        props.dispatch({
                                                            type: "ALLOWANCES",
                                                            action: {
                                                                type: "SET",
                                                                value: event
                                                                    .target
                                                                    .checked
                                                                    ? [
                                                                          ...props
                                                                              .data
                                                                              .allowances,
                                                                          allowance
                                                                              .id
                                                                              .uuid,
                                                                      ]
                                                                    : props.data.allowances.filter(
                                                                          (
                                                                              entry
                                                                          ) =>
                                                                              entry !==
                                                                              allowance
                                                                                  .id
                                                                                  .uuid
                                                                      ),
                                                            },
                                                        })
                                                    }
                                                />{" "}
                                                {allowance.name}
                                            </td>
                                            {scheduleOptions.length > 0 && (
                                                <td style={{ width: "6in" }}>
                                                    {included && (
                                                        <ScheduleControlWidget
                                                            scheduleOptions={
                                                                scheduleOptions
                                                            }
                                                            status={
                                                                props.status
                                                            }
                                                            dispatch={
                                                                props.dispatch
                                                            }
                                                            item={allowance}
                                                            part_key="allowances"
                                                            menuPlacement="top"
                                                        />
                                                    )}
                                                </td>
                                            )}
                                            <td>
                                                {formatMoney(allowance.price)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th>Total</th>{" "}
                                    {scheduleOptions.length > 0 && <th></th>}
                                    <th>
                                        {formatMoney(
                                            resolved.allowancePriceTotal
                                        )}
                                    </th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                }}
            >
                <FormWrapper label="Actions Total">
                    <MoneyStatic value={resolved.actionPriceTotal} />
                </FormWrapper>
                <div style={{ width: "1em" }} />
                <FormWrapper label="Contingencies Total">
                    <MoneyStatic value={resolved.contingencyPriceTotal} />
                </FormWrapper>
                <div style={{ width: "1em" }} />

                <FormWrapper label="Allowances Total">
                    <MoneyStatic value={resolved.allowancePriceTotal} />
                </FormWrapper>
                <div style={{ width: "1em" }} />

                <widgets.adjustment
                    label="Manual Adjustment"
                    readOnly={scheduleOptions.length > 0}
                />

                <div style={{ width: "1em" }} />
                <FormWrapper label="Total Option Price">
                    <MoneyStatic value={resolved.total} />
                </FormWrapper>
            </div>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.areas> &
    WidgetContext<typeof Fields.schedules> &
    WidgetContext<typeof Fields.actions> &
    WidgetContext<typeof Fields.hiddenActions> &
    WidgetContext<typeof Fields.allowances> &
    WidgetContext<typeof Fields.contingencies> &
    WidgetContext<typeof Fields.adjustment> &
    WidgetContext<typeof Fields.description>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    areas: WidgetState<typeof Fields.areas>;
    schedules: WidgetState<typeof Fields.schedules>;
    actions: WidgetState<typeof Fields.actions>;
    hiddenActions: WidgetState<typeof Fields.hiddenActions>;
    allowances: WidgetState<typeof Fields.allowances>;
    contingencies: WidgetState<typeof Fields.contingencies>;
    adjustment: WidgetState<typeof Fields.adjustment>;
    description: WidgetState<typeof Fields.description>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "AREAS"; action: WidgetAction<typeof Fields.areas> }
    | { type: "SCHEDULES"; action: WidgetAction<typeof Fields.schedules> }
    | { type: "ACTIONS"; action: WidgetAction<typeof Fields.actions> }
    | {
          type: "HIDDEN_ACTIONS";
          action: WidgetAction<typeof Fields.hiddenActions>;
      }
    | { type: "ALLOWANCES"; action: WidgetAction<typeof Fields.allowances> }
    | {
          type: "CONTINGENCIES";
          action: WidgetAction<typeof Fields.contingencies>;
      }
    | { type: "ADJUSTMENT"; action: WidgetAction<typeof Fields.adjustment> }
    | { type: "DESCRIPTION"; action: WidgetAction<typeof Fields.description> }
    | {
          type: "SET_SCHEDULE";
          id: string;
          schedule_index: number;
          key: SchedulePartKeys;
      }
    | {
          type: "SET_SCHEDULE_PORTION";
          id: string;
          schedule_index: number;
          key: SchedulePartKeys;
          portion: Decimal;
      }
    | {
          type: "SET_ACTION_STATE";
          action_id: string;
          value: boolean;
          defaultHiddenActions: Set<String>;
      }
    | { type: "SET_ALL_ACTIONS"; actions: string[]; hiddenActions: string[] };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.areas, data.areas, cache, "areas", errors);
    subvalidate(Fields.schedules, data.schedules, cache, "schedules", errors);
    subvalidate(Fields.actions, data.actions, cache, "actions", errors);
    subvalidate(
        Fields.hiddenActions,
        data.hiddenActions,
        cache,
        "hiddenActions",
        errors
    );
    subvalidate(
        Fields.allowances,
        data.allowances,
        cache,
        "allowances",
        errors
    );
    subvalidate(
        Fields.contingencies,
        data.contingencies,
        cache,
        "contingencies",
        errors
    );
    subvalidate(
        Fields.adjustment,
        data.adjustment,
        cache,
        "adjustment",
        errors
    );
    subvalidate(
        Fields.description,
        data.description,
        cache,
        "description",
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
        case "NAME": {
            const inner = Fields.name.reduce(
                state.name,
                data.name,
                action.action,
                subcontext
            );
            return {
                state: { ...state, name: inner.state },
                data: { ...data, name: inner.data },
            };
        }
        case "AREAS": {
            const inner = Fields.areas.reduce(
                state.areas,
                data.areas,
                action.action,
                subcontext
            );
            return {
                state: { ...state, areas: inner.state },
                data: { ...data, areas: inner.data },
            };
        }
        case "SCHEDULES": {
            const inner = Fields.schedules.reduce(
                state.schedules,
                data.schedules,
                action.action,
                subcontext
            );
            return {
                state: { ...state, schedules: inner.state },
                data: { ...data, schedules: inner.data },
            };
        }
        case "ACTIONS": {
            const inner = Fields.actions.reduce(
                state.actions,
                data.actions,
                action.action,
                subcontext
            );
            return {
                state: { ...state, actions: inner.state },
                data: { ...data, actions: inner.data },
            };
        }
        case "HIDDEN_ACTIONS": {
            const inner = Fields.hiddenActions.reduce(
                state.hiddenActions,
                data.hiddenActions,
                action.action,
                subcontext
            );
            return {
                state: { ...state, hiddenActions: inner.state },
                data: { ...data, hiddenActions: inner.data },
            };
        }
        case "ALLOWANCES": {
            const inner = Fields.allowances.reduce(
                state.allowances,
                data.allowances,
                action.action,
                subcontext
            );
            return {
                state: { ...state, allowances: inner.state },
                data: { ...data, allowances: inner.data },
            };
        }
        case "CONTINGENCIES": {
            const inner = Fields.contingencies.reduce(
                state.contingencies,
                data.contingencies,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contingencies: inner.state },
                data: { ...data, contingencies: inner.data },
            };
        }
        case "ADJUSTMENT": {
            const inner = Fields.adjustment.reduce(
                state.adjustment,
                data.adjustment,
                action.action,
                subcontext
            );
            return {
                state: { ...state, adjustment: inner.state },
                data: { ...data, adjustment: inner.data },
            };
        }
        case "DESCRIPTION": {
            const inner = Fields.description.reduce(
                state.description,
                data.description,
                action.action,
                subcontext
            );
            return {
                state: { ...state, description: inner.state },
                data: { ...data, description: inner.data },
            };
        }
        case "SET_SCHEDULE":
            return actionSetSchedule(
                state,
                data,
                action.id,
                action.schedule_index,
                action.key
            );
        case "SET_SCHEDULE_PORTION":
            return actionSetSchedulePortion(
                state,
                data,
                action.id,
                action.schedule_index,
                action.key,
                action.portion
            );
        case "SET_ACTION_STATE":
            return actionSetActionState(
                state,
                data,
                action.action_id,
                action.value,
                action.defaultHiddenActions
            );
        case "SET_ALL_ACTIONS":
            return actionSetAllActions(
                state,
                data,
                action.actions,
                action.hiddenActions
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
    name: function (
        props: WidgetExtraProps<typeof Fields.name> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "NAME", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "name", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.name.component
                state={context.state.name}
                data={context.data.name}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Name"}
            />
        );
    },
    areas: function (
        props: WidgetExtraProps<typeof Fields.areas> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "AREAS", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "areas", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.areas.component
                state={context.state.areas}
                data={context.data.areas}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Areas"}
            />
        );
    },
    schedules: function (
        props: WidgetExtraProps<typeof Fields.schedules> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SCHEDULES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "schedules", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.schedules.component
                state={context.state.schedules}
                data={context.data.schedules}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Schedules"}
            />
        );
    },
    actions: function (
        props: WidgetExtraProps<typeof Fields.actions> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ACTIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "actions", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.actions.component
                state={context.state.actions}
                data={context.data.actions}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Actions"}
            />
        );
    },
    hiddenActions: function (
        props: WidgetExtraProps<typeof Fields.hiddenActions> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "HIDDEN_ACTIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "hiddenActions", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.hiddenActions.component
                state={context.state.hiddenActions}
                data={context.data.hiddenActions}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Hidden Actions"}
            />
        );
    },
    allowances: function (
        props: WidgetExtraProps<typeof Fields.allowances> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ALLOWANCES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "allowances", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.allowances.component
                state={context.state.allowances}
                data={context.data.allowances}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Allowances"}
            />
        );
    },
    contingencies: function (
        props: WidgetExtraProps<typeof Fields.contingencies> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTINGENCIES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "contingencies", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contingencies.component
                state={context.state.contingencies}
                data={context.data.contingencies}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contingencies"}
            />
        );
    },
    adjustment: function (
        props: WidgetExtraProps<typeof Fields.adjustment> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ADJUSTMENT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "adjustment", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.adjustment.component
                state={context.state.adjustment}
                data={context.data.adjustment}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Adjustment"}
            />
        );
    },
    description: function (
        props: WidgetExtraProps<typeof Fields.description> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DESCRIPTION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "description", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.description.component
                state={context.state.description}
                data={context.data.description}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Description"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: QUOTATION_OPTION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let nameState;
        {
            const inner = Fields.name.initialize(
                data.name,
                subcontext,
                subparameters.name
            );
            nameState = inner.state;
            data = { ...data, name: inner.data };
        }
        let areasState;
        {
            const inner = Fields.areas.initialize(
                data.areas,
                subcontext,
                subparameters.areas
            );
            areasState = inner.state;
            data = { ...data, areas: inner.data };
        }
        let schedulesState;
        {
            const inner = Fields.schedules.initialize(
                data.schedules,
                subcontext,
                subparameters.schedules
            );
            schedulesState = inner.state;
            data = { ...data, schedules: inner.data };
        }
        let actionsState;
        {
            const inner = Fields.actions.initialize(
                data.actions,
                subcontext,
                subparameters.actions
            );
            actionsState = inner.state;
            data = { ...data, actions: inner.data };
        }
        let hiddenActionsState;
        {
            const inner = Fields.hiddenActions.initialize(
                data.hiddenActions,
                subcontext,
                subparameters.hiddenActions
            );
            hiddenActionsState = inner.state;
            data = { ...data, hiddenActions: inner.data };
        }
        let allowancesState;
        {
            const inner = Fields.allowances.initialize(
                data.allowances,
                subcontext,
                subparameters.allowances
            );
            allowancesState = inner.state;
            data = { ...data, allowances: inner.data };
        }
        let contingenciesState;
        {
            const inner = Fields.contingencies.initialize(
                data.contingencies,
                subcontext,
                subparameters.contingencies
            );
            contingenciesState = inner.state;
            data = { ...data, contingencies: inner.data };
        }
        let adjustmentState;
        {
            const inner = Fields.adjustment.initialize(
                data.adjustment,
                subcontext,
                subparameters.adjustment
            );
            adjustmentState = inner.state;
            data = { ...data, adjustment: inner.data };
        }
        let descriptionState;
        {
            const inner = Fields.description.initialize(
                data.description,
                subcontext,
                subparameters.description
            );
            descriptionState = inner.state;
            data = { ...data, description: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            areas: areasState,
            schedules: schedulesState,
            actions: actionsState,
            hiddenActions: hiddenActionsState,
            allowances: allowancesState,
            contingencies: contingenciesState,
            adjustment: adjustmentState,
            description: descriptionState,
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
                <RecordContext meta={QUOTATION_OPTION_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
};
export default Widget;
type Widgets = {
    name: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.name>
    >;
    areas: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.areas>
    >;
    schedules: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.schedules>
    >;
    actions: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.actions>
    >;
    hiddenActions: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.hiddenActions>
    >;
    allowances: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.allowances>
    >;
    contingencies: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contingencies>
    >;
    adjustment: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.adjustment>
    >;
    description: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.description>
    >;
};
// END MAGIC -- DO NOT EDIT
