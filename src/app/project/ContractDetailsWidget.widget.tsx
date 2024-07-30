import Decimal from "decimal.js";
import { every, some, zip } from "lodash";
import * as React from "react";
import { Form, Table } from "react-bootstrap";
import { ActionButton } from "../../clay/ActionButton";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../clay/quick-cache";
import { newUUID } from "../../clay/uuid";
import { StaticDateTimeWidget } from "../../clay/widgets/DateTimeWidget";
import { DefaultSwitchWidget } from "../../clay/widgets/DefaultSwitchWidget";
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
import { FieldRow } from "../../clay/widgets/layout";
import { LinkSetWidget } from "../../clay/widgets/link-set-widget";
import { ListWidget } from "../../clay/widgets/ListWidget";
import { MoneyStatic, MoneyWidget } from "../../clay/widgets/money-widget";
import { SwitchWidget } from "../../clay/widgets/SwitchWidget";
import { hasPermission } from "../../permissions";
import ContingencyItemWidget from "../contingency/ContingencyItemWidget.widget";
import { OPTION_META } from "../estimate/option/table";
import { Quotation, QUOTATION_META } from "../quotation/table";
import { useUser } from "../state";
import { TABLE_STYLE } from "../styles";
import { PreferredCertifiedForemenWidget } from "./preferred-certified-foreman/widget";
import ProjectDescriptionDetailFormWidget from "./projectDescriptionDetail/ProjectDescriptionDetailFormWidget.widget";
import ProjectScheduleWidget from "./ProjectScheduleWidget.widget";
import { ReactContext as ProjectWidgetReactContext } from "./ProjectWidget.widget";
import { ProjectSchedule } from "./schedule";
import {
    calcProjectContingencyItemsTotal,
    calcProjectLienHoldbackRequiredDefault,
    calcProjectTotalContractValue,
    Project,
    PROJECT_META,
    resolveSchedules,
} from "./table";

export type Data = Project;

export const Fields = {
    contractDetailsDate: StaticDateTimeWidget,
    selectedOptions: Optional(
        LinkSetWidget({
            meta: OPTION_META,
            name: (option) => option.name,
        })
    ),
    projectSchedules: ListWidget(ProjectScheduleWidget, {
        merge: (state, data, incomingState, incomingData) => {
            return {
                state,
                data: {
                    ...data,
                    price: data.price.plus(incomingData.price),
                },
            };
        },
    }),
    projectContingencyItems: ListWidget(ContingencyItemWidget, {
        emptyOk: true,
    }),
    projectSchedulesDividedDescription: FormField(SwitchWidget),
    projectDescription: ProjectDescriptionDetailFormWidget,
    engineeredProject: FormField(SwitchWidget),
    hasContingencyItems: FormField(SwitchWidget),
    lienHoldbackRequiredOverride: FormField(DefaultSwitchWidget),
    preferredCertifiedForemen: PreferredCertifiedForemenWidget,
    anticipatedProjectValue: OptionalFormField(MoneyWidget),
};

function actionImportScheduleFromQuotation(
    state: State,
    data: Project,
    quotation: Quotation
) {
    const selectedOptions = quotation.options.filter(
        (option) => data.selectedOptions.indexOf(option.id.uuid) !== -1
    );

    const projectSchedules = selectedOptions.flatMap((option) => {
        return option.schedules.length > 0
            ? zip(option.schedules, option.details.schedules).map(
                  ([schedule, detail]) => ({
                      id: newUUID(),
                      name: schedule!.name,
                      description: schedule!.name,
                      price: detail!.total,
                      certifiedForemanContractAmount: new Decimal(0),
                      projectDescription: schedule!.projectDescription,
                      contingencyAllowance: false,
                  })
              )
            : [
                  {
                      id: newUUID(),
                      name: option.name,
                      description: option.description,
                      price: option.details.total.minus(
                          option.details.contingencyPriceTotal
                      ),
                      certifiedForemanContractAmount: new Decimal(0),
                      projectDescription: option.projectDescription,
                      contingencyAllowance: false,
                  },
              ].filter((x) => !x.price.isZero());
    });

    const inner = ListWidget(ProjectScheduleWidget).initialize(
        projectSchedules,
        {}
    );

    const contingencyItems = selectedOptions.flatMap((option) =>
        option.details.contingencies.map((contingencyItem) => ({
            id: contingencyItem.id,
            type: contingencyItem.type,
            description: contingencyItem.description,
            quantity: contingencyItem.quantity,
            rate: contingencyItem.priceRate,
            certifiedForemanRate: new Decimal(0),
            projectDescription: option.projectDescription,
        }))
    );

    const inner2 = ListWidget(ContingencyItemWidget).initialize(
        contingencyItems,
        {}
    );

    return {
        state: {
            ...state,
            projectSchedules: inner.state,
            projectContingencyItems: inner2.state,
        },
        data: {
            ...data,
            projectSchedules: inner.data,
            projectSchedulesDividedDescription:
                quotation.dividedProjectDescription,
            projectDescription: quotation.projectDescription,
            projectContingencyItems: inner2.data,
            hasContingencyItems: inner2.data.length > 0,
        },
    };
}

function actionClearSchedule(
    state: State,
    data: Project,
    quotation: Quotation
) {
    const projectSchedules: ProjectSchedule[] = [];

    const inner = ListWidget(ProjectScheduleWidget).initialize(
        projectSchedules,
        {}
    );

    return {
        state: {
            ...state,
            projectSchedules: inner.state,
        },
        data: {
            ...data,
            projectSchedules: inner.data,
            projectSchedulesDividedDescription:
                quotation.dividedProjectDescription,
            projectDescription: quotation.projectDescription,
        },
    };
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
        data: resolveSchedules(inner.data),
    };
}

function validate(project: Project, cache: QuickCacheApi) {
    const errors = baseValidate(project, cache);

    if (project.projectSchedulesDividedDescription) {
        return errors.filter(
            (error) => error.invalid || error.field !== "projectDescription"
        );
    } else {
        return errors.filter(
            (error) =>
                error.invalid ||
                (error.field !== "projectSchedules" &&
                    error.field !== "projectContingencyItems") ||
                every(error.detail!, (detail) =>
                    some(
                        detail.detail!,
                        (detail) => detail.field !== "projectDescription"
                    )
                )
        );
    }
}

function Component(props: Props) {
    const user = useUser();

    const projectContext = React.useContext(ProjectWidgetReactContext)!;

    const quotation = useQuickRecord(
        QUOTATION_META,
        props.data.selectedQuotation
    );

    return (
        <>
            <FormWrapper label="Contract Details Date">
                <div style={{ display: "flex" }}>
                    <widgets.contractDetailsDate />

                    <div style={{ width: "1em" }} />
                    <ActionButton
                        status={props.status}
                        onClick={() =>
                            projectContext.dispatch({
                                type: "CANCEL_CONTRACT_DETAILS",
                            })
                        }
                    >
                        Cancel
                    </ActionButton>
                </div>
            </FormWrapper>
            {quotation && (
                <Table
                    {...TABLE_STYLE}
                    style={{
                        maxWidth: "50em",
                    }}
                >
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left" }}>Remdal Option</th>
                            <th style={{ textAlign: "left" }}>
                                Project Description
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotation.options.map((option) => (
                            <tr key={option.id.uuid}>
                                <td>
                                    <Form.Check
                                        style={{
                                            display: "inline-block",
                                        }}
                                        className="checkbox-widget"
                                        type="checkbox"
                                        checked={
                                            props.data.selectedOptions.indexOf(
                                                option.id.uuid
                                            ) !== -1
                                        }
                                        disabled={!props.status.mutable}
                                        onChange={(
                                            event: React.ChangeEvent<HTMLInputElement>
                                        ) =>
                                            props.dispatch({
                                                type: "SELECTED_OPTIONS",
                                                action: {
                                                    type: "SET",
                                                    value: event.target.checked
                                                        ? [
                                                              ...props.data
                                                                  .selectedOptions,
                                                              option.id.uuid,
                                                          ]
                                                        : props.data.selectedOptions.filter(
                                                              (entry) =>
                                                                  entry !==
                                                                  option.id.uuid
                                                          ),
                                                },
                                            })
                                        }
                                    />{" "}
                                    {option.name}
                                </td>
                                <td>{option.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            <div
                style={{
                    flexGrow: 0,
                    display: "flex",
                    marginTop: "1em",
                }}
            >
                <ActionButton
                    status={props.status}
                    onClick={() =>
                        quotation &&
                        props.dispatch({
                            type: "IMPORT_SCHEDULE_FROM_QUOTATION",
                            quotation,
                        })
                    }
                >
                    Import From Proposal
                </ActionButton>
                <div style={{ width: "1em" }} />
                <ActionButton
                    status={props.status}
                    onClick={() =>
                        quotation &&
                        props.dispatch({
                            type: "CLEAR_SCHEDULE",
                            quotation,
                        })
                    }
                >
                    Clear
                </ActionButton>
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
                            {props.data.projectSchedulesDividedDescription && (
                                <>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th></th>
                                </>
                            )}
                            <th style={{ width: "5em" }}>
                                Contingency Allowance
                            </th>
                            <th style={{ width: "10em" }}>Price</th>
                            <th style={{ width: "1em" }} />
                        </tr>
                    </thead>
                    <widgets.projectSchedules
                        containerClass="tbody"
                        extraItemForAdd
                        itemProps={{
                            dividedDescription:
                                props.data.projectSchedulesDividedDescription,
                        }}
                    />
                    <tfoot>
                        <tr>
                            <th />
                            <th
                                colSpan={
                                    props.data
                                        .projectSchedulesDividedDescription
                                        ? 5
                                        : 2
                                }
                            >
                                Total Contract Value
                            </th>
                            <th>
                                <MoneyStatic
                                    value={calcProjectTotalContractValue(
                                        props.data
                                    )}
                                />
                            </th>
                        </tr>
                    </tfoot>
                </table>
            </div>
            {props.data.hasContingencyItems && (
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
                                {props.data
                                    .projectSchedulesDividedDescription && (
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
                                <th style={{ width: "10em" }}>
                                    Contract Allowance
                                </th>
                                <th style={{ width: "1em" }} />
                            </tr>
                        </thead>
                        <widgets.projectContingencyItems
                            containerClass="tbody"
                            extraItemForAdd
                            itemProps={{
                                dividedDescription:
                                    props.data
                                        .projectSchedulesDividedDescription,
                            }}
                        />
                        <tfoot>
                            <tr>
                                <th />
                                <th
                                    colSpan={
                                        props.data
                                            .projectSchedulesDividedDescription
                                            ? 7
                                            : 4
                                    }
                                >
                                    Total Contingency Value
                                </th>
                                <th>
                                    <MoneyStatic
                                        value={calcProjectContingencyItemsTotal(
                                            props.data
                                        )}
                                    />
                                </th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
            <FieldRow noExpand>
                <widgets.projectSchedulesDividedDescription
                    label="Multi-Category Project"
                    style={{ alignSelf: "center" }}
                />
                <widgets.lienHoldbackRequiredOverride
                    defaultValue={calcProjectLienHoldbackRequiredDefault(
                        props.data
                    )}
                    free={
                        !calcProjectLienHoldbackRequiredDefault(props.data) ||
                        hasPermission(
                            user,
                            "Project",
                            "override-lien-holdback-required"
                        )
                    }
                    label="Lien Holdback Required"
                    style={{ alignSelf: "center" }}
                />
                <widgets.engineeredProject style={{ alignSelf: "center" }} />
                <widgets.hasContingencyItems
                    label="Contingency Items"
                    style={{ alignSelf: "center" }}
                />
            </FieldRow>
            {!props.data.projectSchedulesDividedDescription && (
                <widgets.projectDescription />
            )}
            {props.data.engineeredProject && (
                <widgets.anticipatedProjectValue />
            )}
            <widgets.preferredCertifiedForemen />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.contractDetailsDate> &
    WidgetContext<typeof Fields.selectedOptions> &
    WidgetContext<typeof Fields.projectSchedules> &
    WidgetContext<typeof Fields.projectContingencyItems> &
    WidgetContext<typeof Fields.projectSchedulesDividedDescription> &
    WidgetContext<typeof Fields.projectDescription> &
    WidgetContext<typeof Fields.engineeredProject> &
    WidgetContext<typeof Fields.hasContingencyItems> &
    WidgetContext<typeof Fields.lienHoldbackRequiredOverride> &
    WidgetContext<typeof Fields.preferredCertifiedForemen> &
    WidgetContext<typeof Fields.anticipatedProjectValue>;
type ExtraProps = {};
type BaseState = {
    contractDetailsDate: WidgetState<typeof Fields.contractDetailsDate>;
    selectedOptions: WidgetState<typeof Fields.selectedOptions>;
    projectSchedules: WidgetState<typeof Fields.projectSchedules>;
    projectContingencyItems: WidgetState<typeof Fields.projectContingencyItems>;
    projectSchedulesDividedDescription: WidgetState<
        typeof Fields.projectSchedulesDividedDescription
    >;
    projectDescription: WidgetState<typeof Fields.projectDescription>;
    engineeredProject: WidgetState<typeof Fields.engineeredProject>;
    hasContingencyItems: WidgetState<typeof Fields.hasContingencyItems>;
    lienHoldbackRequiredOverride: WidgetState<
        typeof Fields.lienHoldbackRequiredOverride
    >;
    preferredCertifiedForemen: WidgetState<
        typeof Fields.preferredCertifiedForemen
    >;
    anticipatedProjectValue: WidgetState<typeof Fields.anticipatedProjectValue>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "CONTRACT_DETAILS_DATE";
          action: WidgetAction<typeof Fields.contractDetailsDate>;
      }
    | {
          type: "SELECTED_OPTIONS";
          action: WidgetAction<typeof Fields.selectedOptions>;
      }
    | {
          type: "PROJECT_SCHEDULES";
          action: WidgetAction<typeof Fields.projectSchedules>;
      }
    | {
          type: "PROJECT_CONTINGENCY_ITEMS";
          action: WidgetAction<typeof Fields.projectContingencyItems>;
      }
    | {
          type: "PROJECT_SCHEDULES_DIVIDED_DESCRIPTION";
          action: WidgetAction<
              typeof Fields.projectSchedulesDividedDescription
          >;
      }
    | {
          type: "PROJECT_DESCRIPTION";
          action: WidgetAction<typeof Fields.projectDescription>;
      }
    | {
          type: "ENGINEERED_PROJECT";
          action: WidgetAction<typeof Fields.engineeredProject>;
      }
    | {
          type: "HAS_CONTINGENCY_ITEMS";
          action: WidgetAction<typeof Fields.hasContingencyItems>;
      }
    | {
          type: "LIEN_HOLDBACK_REQUIRED_OVERRIDE";
          action: WidgetAction<typeof Fields.lienHoldbackRequiredOverride>;
      }
    | {
          type: "PREFERRED_CERTIFIED_FOREMEN";
          action: WidgetAction<typeof Fields.preferredCertifiedForemen>;
      }
    | {
          type: "ANTICIPATED_PROJECT_VALUE";
          action: WidgetAction<typeof Fields.anticipatedProjectValue>;
      }
    | { type: "IMPORT_SCHEDULE_FROM_QUOTATION"; quotation: Quotation }
    | { type: "CLEAR_SCHEDULE"; quotation: Quotation };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.contractDetailsDate,
        data.contractDetailsDate,
        cache,
        "contractDetailsDate",
        errors
    );
    subvalidate(
        Fields.selectedOptions,
        data.selectedOptions,
        cache,
        "selectedOptions",
        errors
    );
    subvalidate(
        Fields.projectSchedules,
        data.projectSchedules,
        cache,
        "projectSchedules",
        errors
    );
    subvalidate(
        Fields.projectContingencyItems,
        data.projectContingencyItems,
        cache,
        "projectContingencyItems",
        errors
    );
    subvalidate(
        Fields.projectSchedulesDividedDescription,
        data.projectSchedulesDividedDescription,
        cache,
        "projectSchedulesDividedDescription",
        errors
    );
    subvalidate(
        Fields.projectDescription,
        data.projectDescription,
        cache,
        "projectDescription",
        errors
    );
    subvalidate(
        Fields.engineeredProject,
        data.engineeredProject,
        cache,
        "engineeredProject",
        errors
    );
    subvalidate(
        Fields.hasContingencyItems,
        data.hasContingencyItems,
        cache,
        "hasContingencyItems",
        errors
    );
    subvalidate(
        Fields.lienHoldbackRequiredOverride,
        data.lienHoldbackRequiredOverride,
        cache,
        "lienHoldbackRequiredOverride",
        errors
    );
    subvalidate(
        Fields.preferredCertifiedForemen,
        data.preferredCertifiedForemen,
        cache,
        "preferredCertifiedForemen",
        errors
    );
    subvalidate(
        Fields.anticipatedProjectValue,
        data.anticipatedProjectValue,
        cache,
        "anticipatedProjectValue",
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
        case "CONTRACT_DETAILS_DATE": {
            const inner = Fields.contractDetailsDate.reduce(
                state.contractDetailsDate,
                data.contractDetailsDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contractDetailsDate: inner.state },
                data: { ...data, contractDetailsDate: inner.data },
            };
        }
        case "SELECTED_OPTIONS": {
            const inner = Fields.selectedOptions.reduce(
                state.selectedOptions,
                data.selectedOptions,
                action.action,
                subcontext
            );
            return {
                state: { ...state, selectedOptions: inner.state },
                data: { ...data, selectedOptions: inner.data },
            };
        }
        case "PROJECT_SCHEDULES": {
            const inner = Fields.projectSchedules.reduce(
                state.projectSchedules,
                data.projectSchedules,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectSchedules: inner.state },
                data: { ...data, projectSchedules: inner.data },
            };
        }
        case "PROJECT_CONTINGENCY_ITEMS": {
            const inner = Fields.projectContingencyItems.reduce(
                state.projectContingencyItems,
                data.projectContingencyItems,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectContingencyItems: inner.state },
                data: { ...data, projectContingencyItems: inner.data },
            };
        }
        case "PROJECT_SCHEDULES_DIVIDED_DESCRIPTION": {
            const inner = Fields.projectSchedulesDividedDescription.reduce(
                state.projectSchedulesDividedDescription,
                data.projectSchedulesDividedDescription,
                action.action,
                subcontext
            );
            return {
                state: {
                    ...state,
                    projectSchedulesDividedDescription: inner.state,
                },
                data: {
                    ...data,
                    projectSchedulesDividedDescription: inner.data,
                },
            };
        }
        case "PROJECT_DESCRIPTION": {
            const inner = Fields.projectDescription.reduce(
                state.projectDescription,
                data.projectDescription,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectDescription: inner.state },
                data: { ...data, projectDescription: inner.data },
            };
        }
        case "ENGINEERED_PROJECT": {
            const inner = Fields.engineeredProject.reduce(
                state.engineeredProject,
                data.engineeredProject,
                action.action,
                subcontext
            );
            return {
                state: { ...state, engineeredProject: inner.state },
                data: { ...data, engineeredProject: inner.data },
            };
        }
        case "HAS_CONTINGENCY_ITEMS": {
            const inner = Fields.hasContingencyItems.reduce(
                state.hasContingencyItems,
                data.hasContingencyItems,
                action.action,
                subcontext
            );
            return {
                state: { ...state, hasContingencyItems: inner.state },
                data: { ...data, hasContingencyItems: inner.data },
            };
        }
        case "LIEN_HOLDBACK_REQUIRED_OVERRIDE": {
            const inner = Fields.lienHoldbackRequiredOverride.reduce(
                state.lienHoldbackRequiredOverride,
                data.lienHoldbackRequiredOverride,
                action.action,
                subcontext
            );
            return {
                state: { ...state, lienHoldbackRequiredOverride: inner.state },
                data: { ...data, lienHoldbackRequiredOverride: inner.data },
            };
        }
        case "PREFERRED_CERTIFIED_FOREMEN": {
            const inner = Fields.preferredCertifiedForemen.reduce(
                state.preferredCertifiedForemen,
                data.preferredCertifiedForemen,
                action.action,
                subcontext
            );
            return {
                state: { ...state, preferredCertifiedForemen: inner.state },
                data: { ...data, preferredCertifiedForemen: inner.data },
            };
        }
        case "ANTICIPATED_PROJECT_VALUE": {
            const inner = Fields.anticipatedProjectValue.reduce(
                state.anticipatedProjectValue,
                data.anticipatedProjectValue,
                action.action,
                subcontext
            );
            return {
                state: { ...state, anticipatedProjectValue: inner.state },
                data: { ...data, anticipatedProjectValue: inner.data },
            };
        }
        case "IMPORT_SCHEDULE_FROM_QUOTATION":
            return actionImportScheduleFromQuotation(
                state,
                data,
                action.quotation
            );
        case "CLEAR_SCHEDULE":
            return actionClearSchedule(state, data, action.quotation);
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
    contractDetailsDate: function (
        props: WidgetExtraProps<typeof Fields.contractDetailsDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTRACT_DETAILS_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "contractDetailsDate",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contractDetailsDate.component
                state={context.state.contractDetailsDate}
                data={context.data.contractDetailsDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contract Details Date"}
            />
        );
    },
    selectedOptions: function (
        props: WidgetExtraProps<typeof Fields.selectedOptions> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SELECTED_OPTIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "selectedOptions", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.selectedOptions.component
                state={context.state.selectedOptions}
                data={context.data.selectedOptions}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Selected Options"}
            />
        );
    },
    projectSchedules: function (
        props: WidgetExtraProps<typeof Fields.projectSchedules> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_SCHEDULES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "projectSchedules", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectSchedules.component
                state={context.state.projectSchedules}
                data={context.data.projectSchedules}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Schedules"}
            />
        );
    },
    projectContingencyItems: function (
        props: WidgetExtraProps<typeof Fields.projectContingencyItems> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_CONTINGENCY_ITEMS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "projectContingencyItems",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectContingencyItems.component
                state={context.state.projectContingencyItems}
                data={context.data.projectContingencyItems}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Contingency Items"}
            />
        );
    },
    projectSchedulesDividedDescription: function (
        props: WidgetExtraProps<
            typeof Fields.projectSchedulesDividedDescription
        > & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_SCHEDULES_DIVIDED_DESCRIPTION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "projectSchedulesDividedDescription",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectSchedulesDividedDescription.component
                state={context.state.projectSchedulesDividedDescription}
                data={context.data.projectSchedulesDividedDescription}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Schedules Divided Description"}
            />
        );
    },
    projectDescription: function (
        props: WidgetExtraProps<typeof Fields.projectDescription> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_DESCRIPTION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "projectDescription",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectDescription.component
                state={context.state.projectDescription}
                data={context.data.projectDescription}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Description"}
            />
        );
    },
    engineeredProject: function (
        props: WidgetExtraProps<typeof Fields.engineeredProject> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ENGINEERED_PROJECT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "engineeredProject",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.engineeredProject.component
                state={context.state.engineeredProject}
                data={context.data.engineeredProject}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Engineered Project"}
            />
        );
    },
    hasContingencyItems: function (
        props: WidgetExtraProps<typeof Fields.hasContingencyItems> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "HAS_CONTINGENCY_ITEMS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "hasContingencyItems",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.hasContingencyItems.component
                state={context.state.hasContingencyItems}
                data={context.data.hasContingencyItems}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Has Contingency Items"}
            />
        );
    },
    lienHoldbackRequiredOverride: function (
        props: WidgetExtraProps<typeof Fields.lienHoldbackRequiredOverride> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "LIEN_HOLDBACK_REQUIRED_OVERRIDE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "lienHoldbackRequiredOverride",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.lienHoldbackRequiredOverride.component
                state={context.state.lienHoldbackRequiredOverride}
                data={context.data.lienHoldbackRequiredOverride}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Lien Holdback Required Override"}
            />
        );
    },
    preferredCertifiedForemen: function (
        props: WidgetExtraProps<typeof Fields.preferredCertifiedForemen> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PREFERRED_CERTIFIED_FOREMEN",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "preferredCertifiedForemen",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.preferredCertifiedForemen.component
                state={context.state.preferredCertifiedForemen}
                data={context.data.preferredCertifiedForemen}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Preferred Certified Foremen"}
            />
        );
    },
    anticipatedProjectValue: function (
        props: WidgetExtraProps<typeof Fields.anticipatedProjectValue> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ANTICIPATED_PROJECT_VALUE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "anticipatedProjectValue",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.anticipatedProjectValue.component
                state={context.state.anticipatedProjectValue}
                data={context.data.anticipatedProjectValue}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Anticipated Project Value"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PROJECT_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let contractDetailsDateState;
        {
            const inner = Fields.contractDetailsDate.initialize(
                data.contractDetailsDate,
                subcontext,
                subparameters.contractDetailsDate
            );
            contractDetailsDateState = inner.state;
            data = { ...data, contractDetailsDate: inner.data };
        }
        let selectedOptionsState;
        {
            const inner = Fields.selectedOptions.initialize(
                data.selectedOptions,
                subcontext,
                subparameters.selectedOptions
            );
            selectedOptionsState = inner.state;
            data = { ...data, selectedOptions: inner.data };
        }
        let projectSchedulesState;
        {
            const inner = Fields.projectSchedules.initialize(
                data.projectSchedules,
                subcontext,
                subparameters.projectSchedules
            );
            projectSchedulesState = inner.state;
            data = { ...data, projectSchedules: inner.data };
        }
        let projectContingencyItemsState;
        {
            const inner = Fields.projectContingencyItems.initialize(
                data.projectContingencyItems,
                subcontext,
                subparameters.projectContingencyItems
            );
            projectContingencyItemsState = inner.state;
            data = { ...data, projectContingencyItems: inner.data };
        }
        let projectSchedulesDividedDescriptionState;
        {
            const inner = Fields.projectSchedulesDividedDescription.initialize(
                data.projectSchedulesDividedDescription,
                subcontext,
                subparameters.projectSchedulesDividedDescription
            );
            projectSchedulesDividedDescriptionState = inner.state;
            data = { ...data, projectSchedulesDividedDescription: inner.data };
        }
        let projectDescriptionState;
        {
            const inner = Fields.projectDescription.initialize(
                data.projectDescription,
                subcontext,
                subparameters.projectDescription
            );
            projectDescriptionState = inner.state;
            data = { ...data, projectDescription: inner.data };
        }
        let engineeredProjectState;
        {
            const inner = Fields.engineeredProject.initialize(
                data.engineeredProject,
                subcontext,
                subparameters.engineeredProject
            );
            engineeredProjectState = inner.state;
            data = { ...data, engineeredProject: inner.data };
        }
        let hasContingencyItemsState;
        {
            const inner = Fields.hasContingencyItems.initialize(
                data.hasContingencyItems,
                subcontext,
                subparameters.hasContingencyItems
            );
            hasContingencyItemsState = inner.state;
            data = { ...data, hasContingencyItems: inner.data };
        }
        let lienHoldbackRequiredOverrideState;
        {
            const inner = Fields.lienHoldbackRequiredOverride.initialize(
                data.lienHoldbackRequiredOverride,
                subcontext,
                subparameters.lienHoldbackRequiredOverride
            );
            lienHoldbackRequiredOverrideState = inner.state;
            data = { ...data, lienHoldbackRequiredOverride: inner.data };
        }
        let preferredCertifiedForemenState;
        {
            const inner = Fields.preferredCertifiedForemen.initialize(
                data.preferredCertifiedForemen,
                subcontext,
                subparameters.preferredCertifiedForemen
            );
            preferredCertifiedForemenState = inner.state;
            data = { ...data, preferredCertifiedForemen: inner.data };
        }
        let anticipatedProjectValueState;
        {
            const inner = Fields.anticipatedProjectValue.initialize(
                data.anticipatedProjectValue,
                subcontext,
                subparameters.anticipatedProjectValue
            );
            anticipatedProjectValueState = inner.state;
            data = { ...data, anticipatedProjectValue: inner.data };
        }
        let state = {
            initialParameters: parameters,
            contractDetailsDate: contractDetailsDateState,
            selectedOptions: selectedOptionsState,
            projectSchedules: projectSchedulesState,
            projectContingencyItems: projectContingencyItemsState,
            projectSchedulesDividedDescription:
                projectSchedulesDividedDescriptionState,
            projectDescription: projectDescriptionState,
            engineeredProject: engineeredProjectState,
            hasContingencyItems: hasContingencyItemsState,
            lienHoldbackRequiredOverride: lienHoldbackRequiredOverrideState,
            preferredCertifiedForemen: preferredCertifiedForemenState,
            anticipatedProjectValue: anticipatedProjectValueState,
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
                <RecordContext meta={PROJECT_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
};
export default Widget;
type Widgets = {
    contractDetailsDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contractDetailsDate>
    >;
    selectedOptions: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.selectedOptions>
    >;
    projectSchedules: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectSchedules>
    >;
    projectContingencyItems: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectContingencyItems>
    >;
    projectSchedulesDividedDescription: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectSchedulesDividedDescription>
    >;
    projectDescription: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectDescription>
    >;
    engineeredProject: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.engineeredProject>
    >;
    hasContingencyItems: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.hasContingencyItems>
    >;
    lienHoldbackRequiredOverride: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.lienHoldbackRequiredOverride>
    >;
    preferredCertifiedForemen: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.preferredCertifiedForemen>
    >;
    anticipatedProjectValue: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.anticipatedProjectValue>
    >;
};
// END MAGIC -- DO NOT EDIT
