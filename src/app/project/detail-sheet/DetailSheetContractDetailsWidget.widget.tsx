import Decimal from "decimal.js";
import { every, some } from "lodash";
import * as React from "react";
import { useRecordQuery } from "../../../clay/api";
import { Dictionary } from "../../../clay/common";
import { GenerateButton } from "../../../clay/generate-button";
import { propCheck } from "../../../clay/propCheck";
import { sumMap } from "../../../clay/queryFuncs";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { FormField, FormWrapper } from "../../../clay/widgets/FormField";
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
import { ListWidget } from "../../../clay/widgets/ListWidget";
import { MoneyStatic } from "../../../clay/widgets/money-widget";
import { PercentageStatic } from "../../../clay/widgets/percentage-widget";
import { SwitchWidget } from "../../../clay/widgets/SwitchWidget";
import ContingencyItemExWidget from "../../contingency/ContingencyItemExWidget.widget";
import { INVOICE_META } from "../../invoice/table";
import { CONTENT_AREA, TABLE_STYLE } from "../../styles";
import ProjectDescriptionDetailFormWidget from "../projectDescriptionDetail/ProjectDescriptionDetailFormWidget.widget";
import ProjectScheduleExWidget from "../ProjectScheduleExWidget.widget";
import {
    DetailSheet,
    DETAIL_SHEET_META,
    resolveDetailSheetSchedules,
} from "./table";

export type Data = DetailSheet;

export const Fields = {
    schedules: ListWidget(ProjectScheduleExWidget),
    contingencyItems: ListWidget(ContingencyItemExWidget, { emptyOk: true }),
    description: ProjectDescriptionDetailFormWidget,
    schedulesDividedDescription: FormField(SwitchWidget),
};

function validate(data: Data, cache: QuickCacheApi) {
    let errors = baseValidate(data, cache);

    if (data.change) {
        errors = errors.filter((error) => error.field !== "projectedStartDate");
    }

    if (data.schedulesDividedDescription) {
        errors = errors.filter((error) => error.field !== "description");
    } else {
        errors = errors.filter(
            (error) =>
                error.invalid ||
                (error.field !== "schedules" &&
                    error.field !== "contingencyItems") ||
                every(error.detail!, (detail) =>
                    some(
                        detail.detail!,
                        (detail) => detail.field !== "projectDescription"
                    )
                )
        );
    }

    return errors;
}

function reduce(
    state: State,
    data: Data,
    action: BaseAction,
    context: Context
): WidgetResult<State, Data> {
    const inner = baseReduce(state, data, action, context);
    return {
        state: inner.state,
        data: resolveDetailSheetSchedules(inner.data),
    };
}

function actionFinalize(state: State, data: Data) {
    return {
        state,
        data: {
            ...data,
            date: data.date || new Date(),
        },
    };
}

function Component(props: Props) {
    const invoices = useRecordQuery(
        INVOICE_META,
        {
            filters: [
                {
                    column: "project",
                    filter: {
                        equal: props.data.project,
                    },
                },
            ],
            sorts: ["number"],
        },
        [props.data.id.uuid]
        // Only ask for the list of invoice if
        // no invoice is currently open
    );
    const preSave = React.useCallback(() => {
        props.dispatch({
            type: "FINALIZE",
        });
    }, [props.dispatch]);
    return (
        <>
            <div {...CONTENT_AREA}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row-reverse",
                        marginTop: "2em",
                        marginBottom: "2em",
                    }}
                >
                    <table
                        {...TABLE_STYLE}
                        style={{
                            width: "100%",
                            maxWidth: "75em",
                            marginRight: "auto",
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={{ width: "2em" }} />
                                <th>Description</th>
                                {props.data.schedulesDividedDescription && (
                                    <>
                                        <th>Category</th>
                                        <th>Description</th>
                                        <th></th>
                                    </>
                                )}
                                <th style={{ width: "5em" }}>
                                    Contingency Allowance
                                </th>
                                <th style={{ width: "11em" }}>
                                    Remdal Contract Amount
                                </th>
                                <th style={{ width: "11em" }}>
                                    CF Contract Amount
                                </th>
                                <th style={{ width: "1em" }} />
                            </tr>
                        </thead>
                        <widgets.schedules
                            containerClass="tbody"
                            extraItemForAdd
                            itemProps={{
                                invoices,
                                dividedDescription:
                                    props.data.schedulesDividedDescription,
                            }}
                        />
                        <tfoot>
                            <tr>
                                <th />
                                <th
                                    colSpan={
                                        props.data.schedulesDividedDescription
                                            ? 5
                                            : 2
                                    }
                                    style={{
                                        textAlign: "right",
                                    }}
                                >
                                    Total
                                </th>
                                <th>
                                    <MoneyStatic
                                        value={sumMap(
                                            props.data.schedules,
                                            (schedule) => schedule.price
                                        )}
                                    />
                                </th>
                                <th>
                                    <MoneyStatic
                                        value={sumMap(
                                            props.data.schedules,
                                            (schedule) =>
                                                schedule.certifiedForemanContractAmount
                                        )}
                                    />
                                </th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row-reverse",
                        marginTop: "2em",
                        marginBottom: "2em",
                    }}
                >
                    <table
                        {...TABLE_STYLE}
                        style={{
                            width: "100%",
                            maxWidth: "75em",
                            marginRight: "auto",
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={{ width: "2em" }} />
                                <th>Description</th>
                                {props.data.schedulesDividedDescription && (
                                    <>
                                        <th>Category</th>
                                        <th>Description</th>
                                        <th></th>
                                    </>
                                )}
                                <th style={{ width: "10em" }}>
                                    Quantity for Project
                                </th>
                                <th style={{ width: "10em" }}>Unit Type</th>
                                <th style={{ width: "10em" }}>Unit Rate</th>
                                <th style={{ width: "10em" }}>CF Unit Rate</th>
                                <th style={{ width: "10em" }}>
                                    Remdal Contract Allowance
                                </th>
                                <th style={{ width: "1em" }} />
                            </tr>
                        </thead>
                        <widgets.contingencyItems
                            containerClass="tbody"
                            extraItemForAdd
                            itemProps={{
                                invoices,
                                dividedDescription:
                                    props.data.schedulesDividedDescription,
                            }}
                        />
                        <tfoot>
                            <tr>
                                <th />
                                <th
                                    colSpan={
                                        props.data.schedulesDividedDescription
                                            ? 5
                                            : 2
                                    }
                                    style={{
                                        textAlign: "right",
                                    }}
                                >
                                    Total
                                </th>
                                <th>
                                    <MoneyStatic
                                        value={sumMap(
                                            props.data.schedules,
                                            (schedule) => schedule.price
                                        )}
                                    />
                                </th>
                                <th>
                                    <MoneyStatic
                                        value={sumMap(
                                            props.data.schedules,
                                            (schedule) =>
                                                schedule.certifiedForemanContractAmount
                                        )}
                                    />
                                </th>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <widgets.schedulesDividedDescription label="Multi-Category Detail Sheet" />
                {!props.data.schedulesDividedDescription && (
                    <widgets.description />
                )}
                <div
                    style={{
                        maxWidth: "62.25em",
                        marginRight: "auto",
                        width: "100%",
                    }}
                >
                    <FormWrapper
                        label="Estimated Total CF Percentage of Contract"
                        style={{
                            marginLeft: "auto",
                            width: "12em",
                        }}
                    >
                        <PercentageStatic
                            value={sumMap(
                                props.data.schedules,
                                (schedule) =>
                                    schedule.certifiedForemanContractAmount
                            )
                                .dividedBy(
                                    sumMap(
                                        props.data.schedules,
                                        (schedule) => schedule.price
                                    )
                                )
                                .toDecimalPlaces(6)}
                        />
                    </FormWrapper>
                    <FormWrapper
                        label="Estimated Remdal GM after CF Costs"
                        style={{
                            marginLeft: "auto",
                            width: "12em",
                        }}
                    >
                        <PercentageStatic
                            value={new Decimal(1)
                                .minus(
                                    sumMap(
                                        props.data.schedules,
                                        (schedule) =>
                                            schedule.certifiedForemanContractAmount
                                    )
                                        .dividedBy(
                                            sumMap(
                                                props.data.schedules,
                                                (schedule) => schedule.price
                                            )
                                        )
                                        .toDecimalPlaces(6)
                                )
                                .toDecimalPlaces(6)}
                        />
                    </FormWrapper>
                </div>
            </div>
            <GenerateButton label="Generate Detail Sheet" />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.schedules> &
    WidgetContext<typeof Fields.contingencyItems> &
    WidgetContext<typeof Fields.description> &
    WidgetContext<typeof Fields.schedulesDividedDescription>;
type ExtraProps = {};
type BaseState = {
    schedules: WidgetState<typeof Fields.schedules>;
    contingencyItems: WidgetState<typeof Fields.contingencyItems>;
    description: WidgetState<typeof Fields.description>;
    schedulesDividedDescription: WidgetState<
        typeof Fields.schedulesDividedDescription
    >;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "SCHEDULES"; action: WidgetAction<typeof Fields.schedules> }
    | {
          type: "CONTINGENCY_ITEMS";
          action: WidgetAction<typeof Fields.contingencyItems>;
      }
    | { type: "DESCRIPTION"; action: WidgetAction<typeof Fields.description> }
    | {
          type: "SCHEDULES_DIVIDED_DESCRIPTION";
          action: WidgetAction<typeof Fields.schedulesDividedDescription>;
      }
    | { type: "FINALIZE" };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.schedules, data.schedules, cache, "schedules", errors);
    subvalidate(
        Fields.contingencyItems,
        data.contingencyItems,
        cache,
        "contingencyItems",
        errors
    );
    subvalidate(
        Fields.description,
        data.description,
        cache,
        "description",
        errors
    );
    subvalidate(
        Fields.schedulesDividedDescription,
        data.schedulesDividedDescription,
        cache,
        "schedulesDividedDescription",
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
        case "CONTINGENCY_ITEMS": {
            const inner = Fields.contingencyItems.reduce(
                state.contingencyItems,
                data.contingencyItems,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contingencyItems: inner.state },
                data: { ...data, contingencyItems: inner.data },
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
        case "SCHEDULES_DIVIDED_DESCRIPTION": {
            const inner = Fields.schedulesDividedDescription.reduce(
                state.schedulesDividedDescription,
                data.schedulesDividedDescription,
                action.action,
                subcontext
            );
            return {
                state: { ...state, schedulesDividedDescription: inner.state },
                data: { ...data, schedulesDividedDescription: inner.data },
            };
        }
        case "FINALIZE":
            return actionFinalize(state, data);
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
    contingencyItems: function (
        props: WidgetExtraProps<typeof Fields.contingencyItems> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTINGENCY_ITEMS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "contingencyItems", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contingencyItems.component
                state={context.state.contingencyItems}
                data={context.data.contingencyItems}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contingency Items"}
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
    schedulesDividedDescription: function (
        props: WidgetExtraProps<typeof Fields.schedulesDividedDescription> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SCHEDULES_DIVIDED_DESCRIPTION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "schedulesDividedDescription",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.schedulesDividedDescription.component
                state={context.state.schedulesDividedDescription}
                data={context.data.schedulesDividedDescription}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Schedules Divided Description"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: DETAIL_SHEET_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
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
        let contingencyItemsState;
        {
            const inner = Fields.contingencyItems.initialize(
                data.contingencyItems,
                subcontext,
                subparameters.contingencyItems
            );
            contingencyItemsState = inner.state;
            data = { ...data, contingencyItems: inner.data };
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
        let schedulesDividedDescriptionState;
        {
            const inner = Fields.schedulesDividedDescription.initialize(
                data.schedulesDividedDescription,
                subcontext,
                subparameters.schedulesDividedDescription
            );
            schedulesDividedDescriptionState = inner.state;
            data = { ...data, schedulesDividedDescription: inner.data };
        }
        let state = {
            initialParameters: parameters,
            schedules: schedulesState,
            contingencyItems: contingencyItemsState,
            description: descriptionState,
            schedulesDividedDescription: schedulesDividedDescriptionState,
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
                <RecordContext meta={DETAIL_SHEET_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
};
export default Widget;
type Widgets = {
    schedules: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.schedules>
    >;
    contingencyItems: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contingencyItems>
    >;
    description: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.description>
    >;
    schedulesDividedDescription: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.schedulesDividedDescription>
    >;
};
// END MAGIC -- DO NOT EDIT
