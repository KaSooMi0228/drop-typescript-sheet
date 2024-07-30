import { some } from "lodash";
import React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
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
import { MoneyWidget } from "../../clay/widgets/money-widget";
import { SwitchWidget } from "../../clay/widgets/SwitchWidget";
import { BaseTableRow } from "../../clay/widgets/TableRow";
import { TextAreaWidget } from "../../clay/widgets/TextAreaWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { Invoice } from "../invoice/table";
import ProjectDescriptionDetailWidget from "./projectDescriptionDetail/ProjectDescriptionDetailWidget.widget";
import { ProjectSchedule, PROJECT_SCHEDULE_META } from "./schedule";

export type Data = ProjectSchedule;

export const Fields = {
    name: Optional(TextWidget),
    description: TextAreaWidget,
    price: Optional(MoneyWidget),
    certifiedForemanContractAmount: Optional(MoneyWidget),
    projectDescription: ProjectDescriptionDetailWidget,
    contingencyAllowance: SwitchWidget,
};

export type ExtraProps = {
    dividedDescription: boolean;
    invoices?: Invoice[];
};

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);
    if (data.description.indexOf(" as per scope ") !== -1) {
        return [
            ...errors,
            { field: "description", invalid: true, empty: false },
        ];
    } else {
        return errors;
    }
}

function Component(props: Props) {
    const isInvoiced =
        !props.invoices ||
        some(props.invoices, (invoice) =>
            some(
                invoice.options,
                (schedule) =>
                    schedule.id.uuid === props.data.id.uuid &&
                    !schedule.completed.isZero()
            )
        );

    return (
        <BaseTableRow>
            <td>
                <widgets.description />
            </td>
            {props.dividedDescription && <widgets.projectDescription />}
            <td>
                <widgets.contingencyAllowance />
            </td>
            <td>
                <widgets.price readOnly={isInvoiced} />
            </td>
            <td>
                <widgets.certifiedForemanContractAmount />
            </td>
        </BaseTableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.description> &
    WidgetContext<typeof Fields.price> &
    WidgetContext<typeof Fields.certifiedForemanContractAmount> &
    WidgetContext<typeof Fields.projectDescription> &
    WidgetContext<typeof Fields.contingencyAllowance>;
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    description: WidgetState<typeof Fields.description>;
    price: WidgetState<typeof Fields.price>;
    certifiedForemanContractAmount: WidgetState<
        typeof Fields.certifiedForemanContractAmount
    >;
    projectDescription: WidgetState<typeof Fields.projectDescription>;
    contingencyAllowance: WidgetState<typeof Fields.contingencyAllowance>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "DESCRIPTION"; action: WidgetAction<typeof Fields.description> }
    | { type: "PRICE"; action: WidgetAction<typeof Fields.price> }
    | {
          type: "CERTIFIED_FOREMAN_CONTRACT_AMOUNT";
          action: WidgetAction<typeof Fields.certifiedForemanContractAmount>;
      }
    | {
          type: "PROJECT_DESCRIPTION";
          action: WidgetAction<typeof Fields.projectDescription>;
      }
    | {
          type: "CONTINGENCY_ALLOWANCE";
          action: WidgetAction<typeof Fields.contingencyAllowance>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(
        Fields.description,
        data.description,
        cache,
        "description",
        errors
    );
    subvalidate(Fields.price, data.price, cache, "price", errors);
    subvalidate(
        Fields.certifiedForemanContractAmount,
        data.certifiedForemanContractAmount,
        cache,
        "certifiedForemanContractAmount",
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
        Fields.contingencyAllowance,
        data.contingencyAllowance,
        cache,
        "contingencyAllowance",
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
        case "PRICE": {
            const inner = Fields.price.reduce(
                state.price,
                data.price,
                action.action,
                subcontext
            );
            return {
                state: { ...state, price: inner.state },
                data: { ...data, price: inner.data },
            };
        }
        case "CERTIFIED_FOREMAN_CONTRACT_AMOUNT": {
            const inner = Fields.certifiedForemanContractAmount.reduce(
                state.certifiedForemanContractAmount,
                data.certifiedForemanContractAmount,
                action.action,
                subcontext
            );
            return {
                state: {
                    ...state,
                    certifiedForemanContractAmount: inner.state,
                },
                data: { ...data, certifiedForemanContractAmount: inner.data },
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
        case "CONTINGENCY_ALLOWANCE": {
            const inner = Fields.contingencyAllowance.reduce(
                state.contingencyAllowance,
                data.contingencyAllowance,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contingencyAllowance: inner.state },
                data: { ...data, contingencyAllowance: inner.data },
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
    price: function (
        props: WidgetExtraProps<typeof Fields.price> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "PRICE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "price", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.price.component
                state={context.state.price}
                data={context.data.price}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Price"}
            />
        );
    },
    certifiedForemanContractAmount: function (
        props: WidgetExtraProps<
            typeof Fields.certifiedForemanContractAmount
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
                    type: "CERTIFIED_FOREMAN_CONTRACT_AMOUNT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "certifiedForemanContractAmount",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.certifiedForemanContractAmount.component
                state={context.state.certifiedForemanContractAmount}
                data={context.data.certifiedForemanContractAmount}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Certified Foreman Contract Amount"}
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
    contingencyAllowance: function (
        props: WidgetExtraProps<typeof Fields.contingencyAllowance> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTINGENCY_ALLOWANCE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "contingencyAllowance",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contingencyAllowance.component
                state={context.state.contingencyAllowance}
                data={context.data.contingencyAllowance}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contingency Allowance"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PROJECT_SCHEDULE_META,
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
        let priceState;
        {
            const inner = Fields.price.initialize(
                data.price,
                subcontext,
                subparameters.price
            );
            priceState = inner.state;
            data = { ...data, price: inner.data };
        }
        let certifiedForemanContractAmountState;
        {
            const inner = Fields.certifiedForemanContractAmount.initialize(
                data.certifiedForemanContractAmount,
                subcontext,
                subparameters.certifiedForemanContractAmount
            );
            certifiedForemanContractAmountState = inner.state;
            data = { ...data, certifiedForemanContractAmount: inner.data };
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
        let contingencyAllowanceState;
        {
            const inner = Fields.contingencyAllowance.initialize(
                data.contingencyAllowance,
                subcontext,
                subparameters.contingencyAllowance
            );
            contingencyAllowanceState = inner.state;
            data = { ...data, contingencyAllowance: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            description: descriptionState,
            price: priceState,
            certifiedForemanContractAmount: certifiedForemanContractAmountState,
            projectDescription: projectDescriptionState,
            contingencyAllowance: contingencyAllowanceState,
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
                <RecordContext meta={PROJECT_SCHEDULE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
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
    description: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.description>
    >;
    price: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.price>
    >;
    certifiedForemanContractAmount: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.certifiedForemanContractAmount>
    >;
    projectDescription: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectDescription>
    >;
    contingencyAllowance: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contingencyAllowance>
    >;
};
// END MAGIC -- DO NOT EDIT
