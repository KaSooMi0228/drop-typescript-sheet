import * as React from "react";
import { Alert, Form, Table } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { GenerateButton } from "../../clay/generate-button";
import { propCheck } from "../../clay/propCheck";
import { sumMap } from "../../clay/queryFuncs";
import { QuickCacheApi, useQuickCache } from "../../clay/quick-cache";
import { UUID } from "../../clay/uuid";
import { DateWidget } from "../../clay/widgets/DateWidget";
import {
    FormField,
    FormWrapper,
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
import { QuantityWidget } from "../../clay/widgets/number-widget";
import { StaticListWidget } from "../../clay/widgets/StaticListWidget";
import { SwitchWidget } from "../../clay/widgets/SwitchWidget";
import { TextAreaWidget } from "../../clay/widgets/TextAreaWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { formatMoney } from "../estimate/TotalsWidget.widget";
import ProjectDescriptionDetailFormWidget from "../project/projectDescriptionDetail/ProjectDescriptionDetailFormWidget.widget";
import { ReactContext as ProjectQuotationsWidgetReactContext } from "../project/ProjectQuotationsWidget.widget";
import { CONTENT_AREA, TABLE_LEFT_STYLE } from "../styles";
import QuotationOptionDescriptionWidget from "./QuotationOptionDescriptionWidget.widget";
import { ResolvedOption, resolveOption } from "./resolve-option";
import { Quotation, QuotationOption, QUOTATION_META } from "./table";
import {
    NEW_CONSTRUCTION_QUOTATION_TYPE_ID,
    QUOTATION_TYPE_META,
} from "./type/table";

export type Data = Quotation;

function validate(data: Data, cache: QuickCacheApi) {
    let errors = baseValidate(data, cache);
    if (data.dividedProjectDescription) {
        errors = errors.filter((error) => error.field !== "projectDescription");
    } else {
        errors = errors.filter((error) => error.field !== "options");
    }

    if (data.change) {
        errors = errors.filter((error) => error.field !== "quoteFollowUpDate");
    }

    return errors;
}

export function actionSetIncludeInExpectedValue(
    state: State,
    data: Quotation,
    index: number,
    value: boolean
) {
    return {
        state,
        data: {
            ...data,
            options: data.options.map((option, optionIndex) => ({
                ...option,
                includedInExpectedContractValue:
                    optionIndex == index
                        ? value
                        : option.includedInExpectedContractValue,
            })),
        },
    };
}

const Fields = {
    quoteFollowUpDate: FormField(DateWidget),
    projectDescription: ProjectDescriptionDetailFormWidget,
    dividedProjectDescription: FormField(SwitchWidget),
    options: StaticListWidget(QuotationOptionDescriptionWidget),
    specificationDetails: OptionalFormField(TextWidget),
    numberOfAddendums: OptionalFormField(QuantityWidget),
    ignoringUnusedItemsBecause: OptionalFormField(TextAreaWidget),
};

function Component(props: Props) {
    const cache = useQuickCache();
    const projectContext = React.useContext(
        ProjectQuotationsWidgetReactContext
    )!;
    const quotationType = cache.get(
        QUOTATION_TYPE_META,
        props.data.quotationType
    );

    const optionTotal = React.useCallback(
        (option) => {
            if (props.status.mutable) {
                return resolveOption(cache, props.data, option).total;
            } else {
                return option.details.total;
            }
        },
        [cache, props.data, props.status.mutable]
    );

    const unusedItems = React.useMemo(() => {
        if (!props.status.mutable) {
            return [];
        }

        const entries: {
            name: string;
            kind: string;
        }[] = [];

        function build<T extends { id: UUID }, S>(
            kind: string,
            items: (x: ResolvedOption) => T[],
            name: (x: T) => string,
            include: (x: QuotationOption) => (string | null)[]
        ) {
            const names = new Map();
            const included = new Set();
            for (const option of props.data.options) {
                const resolvedOption = resolveOption(cache, props.data, option);
                for (const item of items(resolvedOption)) {
                    names.set(item.id.uuid, name(item));
                }
                for (const id of include(option)) {
                    included.add(id);
                }
            }

            names.forEach((name, id) => {
                if (!included.has(id)) {
                    entries.push({
                        kind,
                        name,
                    });
                }
            });
        }

        build(
            "Area",
            (x) => x.areas,
            (x) => x.name,
            (x) => x.areas
        );
        build(
            "Action",
            (x) => x.actions,
            (x) => x.name,
            (x) => x.actions
        );
        build(
            "Allowance",
            (x) => x.allowances,
            (x) => x.name,
            (x) => x.allowances
        );
        build(
            "Contingency",
            (x) => x.contingencies,
            (x) => x.description,
            (x) => x.contingencies
        );

        return entries;
    }, [props.status.mutable, props.data, cache]);

    return (
        <>
            <div {...CONTENT_AREA}>
                <FormWrapper label="Expected Contract Value Includes">
                    <table {...TABLE_LEFT_STYLE}>
                        <thead>
                            <tr>
                                <th style={{ width: "10em" }}>Name</th>
                                <th>Description</th>
                                <th style={{ width: "10em" }}>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {props.data.options.map((option, optionIndex) => (
                                <tr>
                                    <td>
                                        <Form.Check
                                            style={{ display: "inline-block" }}
                                            className="checkbox-widget"
                                            type="checkbox"
                                            checked={
                                                option.includedInExpectedContractValue
                                            }
                                            disabled={!props.status.mutable}
                                            onChange={(
                                                event: React.ChangeEvent<HTMLInputElement>
                                            ) =>
                                                props.dispatch({
                                                    type: "SET_INCLUDE_IN_EXPECTED_VALUE",
                                                    index: optionIndex,
                                                    value: event.target.checked,
                                                })
                                            }
                                        />{" "}
                                        {option.name}
                                    </td>
                                    <td>{option.description}</td>
                                    <td>{formatMoney(optionTotal(option))}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th>Total</th>
                                <th />
                                <th>
                                    {formatMoney(
                                        sumMap(
                                            props.data.options.filter(
                                                (option) =>
                                                    option.includedInExpectedContractValue
                                            ),
                                            (option) => optionTotal(option)
                                        )
                                    )}
                                </th>
                            </tr>
                        </tfoot>
                    </table>
                </FormWrapper>
                {props.data.quotationType ===
                    NEW_CONSTRUCTION_QUOTATION_TYPE_ID && (
                    <FieldRow>
                        <widgets.specificationDetails />
                        <widgets.numberOfAddendums />
                    </FieldRow>
                )}

                {props.data.dividedProjectDescription ? (
                    <Table>
                        <thead>
                            <tr>
                                <th>Option</th>
                                <th>Schedule</th>
                                <th>Category</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <widgets.options />
                    </Table>
                ) : (
                    <widgets.projectDescription />
                )}

                <widgets.dividedProjectDescription />

                {!props.data.change && <widgets.quoteFollowUpDate />}

                {unusedItems.length > 0 && (
                    <>
                        <Alert variant="danger">
                            <p>
                                The following items are not used in any option
                                on this quote
                            </p>
                            <ul>
                                {unusedItems.map((x) => (
                                    <li>
                                        {x.kind}: {x.name}
                                    </li>
                                ))}
                            </ul>
                        </Alert>
                        <widgets.ignoringUnusedItemsBecause label="I'm ignoring these unused items because..." />
                    </>
                )}
            </div>

            <GenerateButton
                label="Generate Proposal"
                disabled={
                    unusedItems.length > 0 &&
                    props.data.ignoringUnusedItemsBecause === ""
                }
            />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.quoteFollowUpDate> &
    WidgetContext<typeof Fields.projectDescription> &
    WidgetContext<typeof Fields.dividedProjectDescription> &
    WidgetContext<typeof Fields.options> &
    WidgetContext<typeof Fields.specificationDetails> &
    WidgetContext<typeof Fields.numberOfAddendums> &
    WidgetContext<typeof Fields.ignoringUnusedItemsBecause>;
type ExtraProps = {};
type BaseState = {
    quoteFollowUpDate: WidgetState<typeof Fields.quoteFollowUpDate>;
    projectDescription: WidgetState<typeof Fields.projectDescription>;
    dividedProjectDescription: WidgetState<
        typeof Fields.dividedProjectDescription
    >;
    options: WidgetState<typeof Fields.options>;
    specificationDetails: WidgetState<typeof Fields.specificationDetails>;
    numberOfAddendums: WidgetState<typeof Fields.numberOfAddendums>;
    ignoringUnusedItemsBecause: WidgetState<
        typeof Fields.ignoringUnusedItemsBecause
    >;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "QUOTE_FOLLOW_UP_DATE";
          action: WidgetAction<typeof Fields.quoteFollowUpDate>;
      }
    | {
          type: "PROJECT_DESCRIPTION";
          action: WidgetAction<typeof Fields.projectDescription>;
      }
    | {
          type: "DIVIDED_PROJECT_DESCRIPTION";
          action: WidgetAction<typeof Fields.dividedProjectDescription>;
      }
    | { type: "OPTIONS"; action: WidgetAction<typeof Fields.options> }
    | {
          type: "SPECIFICATION_DETAILS";
          action: WidgetAction<typeof Fields.specificationDetails>;
      }
    | {
          type: "NUMBER_OF_ADDENDUMS";
          action: WidgetAction<typeof Fields.numberOfAddendums>;
      }
    | {
          type: "IGNORING_UNUSED_ITEMS_BECAUSE";
          action: WidgetAction<typeof Fields.ignoringUnusedItemsBecause>;
      }
    | { type: "SET_INCLUDE_IN_EXPECTED_VALUE"; index: number; value: boolean };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.quoteFollowUpDate,
        data.quoteFollowUpDate,
        cache,
        "quoteFollowUpDate",
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
        Fields.dividedProjectDescription,
        data.dividedProjectDescription,
        cache,
        "dividedProjectDescription",
        errors
    );
    subvalidate(Fields.options, data.options, cache, "options", errors);
    subvalidate(
        Fields.specificationDetails,
        data.specificationDetails,
        cache,
        "specificationDetails",
        errors
    );
    subvalidate(
        Fields.numberOfAddendums,
        data.numberOfAddendums,
        cache,
        "numberOfAddendums",
        errors
    );
    subvalidate(
        Fields.ignoringUnusedItemsBecause,
        data.ignoringUnusedItemsBecause,
        cache,
        "ignoringUnusedItemsBecause",
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
        case "QUOTE_FOLLOW_UP_DATE": {
            const inner = Fields.quoteFollowUpDate.reduce(
                state.quoteFollowUpDate,
                data.quoteFollowUpDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, quoteFollowUpDate: inner.state },
                data: { ...data, quoteFollowUpDate: inner.data },
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
        case "DIVIDED_PROJECT_DESCRIPTION": {
            const inner = Fields.dividedProjectDescription.reduce(
                state.dividedProjectDescription,
                data.dividedProjectDescription,
                action.action,
                subcontext
            );
            return {
                state: { ...state, dividedProjectDescription: inner.state },
                data: { ...data, dividedProjectDescription: inner.data },
            };
        }
        case "OPTIONS": {
            const inner = Fields.options.reduce(
                state.options,
                data.options,
                action.action,
                subcontext
            );
            return {
                state: { ...state, options: inner.state },
                data: { ...data, options: inner.data },
            };
        }
        case "SPECIFICATION_DETAILS": {
            const inner = Fields.specificationDetails.reduce(
                state.specificationDetails,
                data.specificationDetails,
                action.action,
                subcontext
            );
            return {
                state: { ...state, specificationDetails: inner.state },
                data: { ...data, specificationDetails: inner.data },
            };
        }
        case "NUMBER_OF_ADDENDUMS": {
            const inner = Fields.numberOfAddendums.reduce(
                state.numberOfAddendums,
                data.numberOfAddendums,
                action.action,
                subcontext
            );
            return {
                state: { ...state, numberOfAddendums: inner.state },
                data: { ...data, numberOfAddendums: inner.data },
            };
        }
        case "IGNORING_UNUSED_ITEMS_BECAUSE": {
            const inner = Fields.ignoringUnusedItemsBecause.reduce(
                state.ignoringUnusedItemsBecause,
                data.ignoringUnusedItemsBecause,
                action.action,
                subcontext
            );
            return {
                state: { ...state, ignoringUnusedItemsBecause: inner.state },
                data: { ...data, ignoringUnusedItemsBecause: inner.data },
            };
        }
        case "SET_INCLUDE_IN_EXPECTED_VALUE":
            return actionSetIncludeInExpectedValue(
                state,
                data,
                action.index,
                action.value
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
    quoteFollowUpDate: function (
        props: WidgetExtraProps<typeof Fields.quoteFollowUpDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "QUOTE_FOLLOW_UP_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "quoteFollowUpDate",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.quoteFollowUpDate.component
                state={context.state.quoteFollowUpDate}
                data={context.data.quoteFollowUpDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Quote Follow up Date"}
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
    dividedProjectDescription: function (
        props: WidgetExtraProps<typeof Fields.dividedProjectDescription> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DIVIDED_PROJECT_DESCRIPTION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "dividedProjectDescription",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.dividedProjectDescription.component
                state={context.state.dividedProjectDescription}
                data={context.data.dividedProjectDescription}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Divided Project Description"}
            />
        );
    },
    options: function (
        props: WidgetExtraProps<typeof Fields.options> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "OPTIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "options", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.options.component
                state={context.state.options}
                data={context.data.options}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Options"}
            />
        );
    },
    specificationDetails: function (
        props: WidgetExtraProps<typeof Fields.specificationDetails> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SPECIFICATION_DETAILS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "specificationDetails",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.specificationDetails.component
                state={context.state.specificationDetails}
                data={context.data.specificationDetails}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Specification Details"}
            />
        );
    },
    numberOfAddendums: function (
        props: WidgetExtraProps<typeof Fields.numberOfAddendums> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "NUMBER_OF_ADDENDUMS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "numberOfAddendums",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.numberOfAddendums.component
                state={context.state.numberOfAddendums}
                data={context.data.numberOfAddendums}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Number of Addendums"}
            />
        );
    },
    ignoringUnusedItemsBecause: function (
        props: WidgetExtraProps<typeof Fields.ignoringUnusedItemsBecause> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "IGNORING_UNUSED_ITEMS_BECAUSE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "ignoringUnusedItemsBecause",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.ignoringUnusedItemsBecause.component
                state={context.state.ignoringUnusedItemsBecause}
                data={context.data.ignoringUnusedItemsBecause}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Ignoring Unused Items Because"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: QUOTATION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let quoteFollowUpDateState;
        {
            const inner = Fields.quoteFollowUpDate.initialize(
                data.quoteFollowUpDate,
                subcontext,
                subparameters.quoteFollowUpDate
            );
            quoteFollowUpDateState = inner.state;
            data = { ...data, quoteFollowUpDate: inner.data };
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
        let dividedProjectDescriptionState;
        {
            const inner = Fields.dividedProjectDescription.initialize(
                data.dividedProjectDescription,
                subcontext,
                subparameters.dividedProjectDescription
            );
            dividedProjectDescriptionState = inner.state;
            data = { ...data, dividedProjectDescription: inner.data };
        }
        let optionsState;
        {
            const inner = Fields.options.initialize(
                data.options,
                subcontext,
                subparameters.options
            );
            optionsState = inner.state;
            data = { ...data, options: inner.data };
        }
        let specificationDetailsState;
        {
            const inner = Fields.specificationDetails.initialize(
                data.specificationDetails,
                subcontext,
                subparameters.specificationDetails
            );
            specificationDetailsState = inner.state;
            data = { ...data, specificationDetails: inner.data };
        }
        let numberOfAddendumsState;
        {
            const inner = Fields.numberOfAddendums.initialize(
                data.numberOfAddendums,
                subcontext,
                subparameters.numberOfAddendums
            );
            numberOfAddendumsState = inner.state;
            data = { ...data, numberOfAddendums: inner.data };
        }
        let ignoringUnusedItemsBecauseState;
        {
            const inner = Fields.ignoringUnusedItemsBecause.initialize(
                data.ignoringUnusedItemsBecause,
                subcontext,
                subparameters.ignoringUnusedItemsBecause
            );
            ignoringUnusedItemsBecauseState = inner.state;
            data = { ...data, ignoringUnusedItemsBecause: inner.data };
        }
        let state = {
            initialParameters: parameters,
            quoteFollowUpDate: quoteFollowUpDateState,
            projectDescription: projectDescriptionState,
            dividedProjectDescription: dividedProjectDescriptionState,
            options: optionsState,
            specificationDetails: specificationDetailsState,
            numberOfAddendums: numberOfAddendumsState,
            ignoringUnusedItemsBecause: ignoringUnusedItemsBecauseState,
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
                <RecordContext meta={QUOTATION_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    quoteFollowUpDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.quoteFollowUpDate>
    >;
    projectDescription: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectDescription>
    >;
    dividedProjectDescription: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.dividedProjectDescription>
    >;
    options: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.options>
    >;
    specificationDetails: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.specificationDetails>
    >;
    numberOfAddendums: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.numberOfAddendums>
    >;
    ignoringUnusedItemsBecause: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.ignoringUnusedItemsBecause>
    >;
};
// END MAGIC -- DO NOT EDIT
