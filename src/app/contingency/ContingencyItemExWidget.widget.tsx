import React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { DropdownLinkWidget } from "../../clay/widgets/dropdown-link-widget";
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
import { MoneyStatic, MoneyWidget } from "../../clay/widgets/money-widget";
import { QuantityWidget } from "../../clay/widgets/number-widget";
import { TableRow } from "../../clay/widgets/TableRow";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { UNIT_TYPE_META } from "../estimate/types/table";
import { Invoice } from "../invoice/table";
import ProjectDescriptionDetailWidget from "../project/projectDescriptionDetail/ProjectDescriptionDetailWidget.widget";
import {
    calcContingencyItemTotal,
    ContingencyItem,
    CONTINGENCY_ITEM_META,
} from "./table";

export type Data = ContingencyItem;

const Fields = {
    description: TextWidget,
    type: DropdownLinkWidget({
        meta: UNIT_TYPE_META,
        label: (item) => item.name,
        include: (item) => item.contingency,
    }),
    quantity: QuantityWidget,
    rate: MoneyWidget,
    certifiedForemanRate: Optional(MoneyWidget),
    projectDescription: ProjectDescriptionDetailWidget,
};
export type ExtraProps = {
    dividedDescription: boolean;
    invoices?: Invoice[];
};

function Component(props: Props) {
    return (
        <TableRow flexSizes>
            <widgets.description />
            {props.dividedDescription && <widgets.projectDescription />}
            <widgets.quantity />
            <widgets.type />
            <widgets.rate />
            <widgets.certifiedForemanRate />
            <MoneyStatic value={calcContingencyItemTotal(props.data)} />
        </TableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.description> &
    WidgetContext<typeof Fields.type> &
    WidgetContext<typeof Fields.quantity> &
    WidgetContext<typeof Fields.rate> &
    WidgetContext<typeof Fields.certifiedForemanRate> &
    WidgetContext<typeof Fields.projectDescription>;
type BaseState = {
    description: WidgetState<typeof Fields.description>;
    type: WidgetState<typeof Fields.type>;
    quantity: WidgetState<typeof Fields.quantity>;
    rate: WidgetState<typeof Fields.rate>;
    certifiedForemanRate: WidgetState<typeof Fields.certifiedForemanRate>;
    projectDescription: WidgetState<typeof Fields.projectDescription>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "DESCRIPTION"; action: WidgetAction<typeof Fields.description> }
    | { type: "TYPE"; action: WidgetAction<typeof Fields.type> }
    | { type: "QUANTITY"; action: WidgetAction<typeof Fields.quantity> }
    | { type: "RATE"; action: WidgetAction<typeof Fields.rate> }
    | {
          type: "CERTIFIED_FOREMAN_RATE";
          action: WidgetAction<typeof Fields.certifiedForemanRate>;
      }
    | {
          type: "PROJECT_DESCRIPTION";
          action: WidgetAction<typeof Fields.projectDescription>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.description,
        data.description,
        cache,
        "description",
        errors
    );
    subvalidate(Fields.type, data.type, cache, "type", errors);
    subvalidate(Fields.quantity, data.quantity, cache, "quantity", errors);
    subvalidate(Fields.rate, data.rate, cache, "rate", errors);
    subvalidate(
        Fields.certifiedForemanRate,
        data.certifiedForemanRate,
        cache,
        "certifiedForemanRate",
        errors
    );
    subvalidate(
        Fields.projectDescription,
        data.projectDescription,
        cache,
        "projectDescription",
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
        case "TYPE": {
            const inner = Fields.type.reduce(
                state.type,
                data.type,
                action.action,
                subcontext
            );
            return {
                state: { ...state, type: inner.state },
                data: { ...data, type: inner.data },
            };
        }
        case "QUANTITY": {
            const inner = Fields.quantity.reduce(
                state.quantity,
                data.quantity,
                action.action,
                subcontext
            );
            return {
                state: { ...state, quantity: inner.state },
                data: { ...data, quantity: inner.data },
            };
        }
        case "RATE": {
            const inner = Fields.rate.reduce(
                state.rate,
                data.rate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, rate: inner.state },
                data: { ...data, rate: inner.data },
            };
        }
        case "CERTIFIED_FOREMAN_RATE": {
            const inner = Fields.certifiedForemanRate.reduce(
                state.certifiedForemanRate,
                data.certifiedForemanRate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, certifiedForemanRate: inner.state },
                data: { ...data, certifiedForemanRate: inner.data },
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
    type: function (
        props: WidgetExtraProps<typeof Fields.type> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "TYPE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "type", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.type.component
                state={context.state.type}
                data={context.data.type}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Type"}
            />
        );
    },
    quantity: function (
        props: WidgetExtraProps<typeof Fields.quantity> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "QUANTITY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "quantity", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.quantity.component
                state={context.state.quantity}
                data={context.data.quantity}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Quantity"}
            />
        );
    },
    rate: function (
        props: WidgetExtraProps<typeof Fields.rate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "RATE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "rate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.rate.component
                state={context.state.rate}
                data={context.data.rate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Rate"}
            />
        );
    },
    certifiedForemanRate: function (
        props: WidgetExtraProps<typeof Fields.certifiedForemanRate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CERTIFIED_FOREMAN_RATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "certifiedForemanRate",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.certifiedForemanRate.component
                state={context.state.certifiedForemanRate}
                data={context.data.certifiedForemanRate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Certified Foreman Rate"}
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: CONTINGENCY_ITEM_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
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
        let typeState;
        {
            const inner = Fields.type.initialize(
                data.type,
                subcontext,
                subparameters.type
            );
            typeState = inner.state;
            data = { ...data, type: inner.data };
        }
        let quantityState;
        {
            const inner = Fields.quantity.initialize(
                data.quantity,
                subcontext,
                subparameters.quantity
            );
            quantityState = inner.state;
            data = { ...data, quantity: inner.data };
        }
        let rateState;
        {
            const inner = Fields.rate.initialize(
                data.rate,
                subcontext,
                subparameters.rate
            );
            rateState = inner.state;
            data = { ...data, rate: inner.data };
        }
        let certifiedForemanRateState;
        {
            const inner = Fields.certifiedForemanRate.initialize(
                data.certifiedForemanRate,
                subcontext,
                subparameters.certifiedForemanRate
            );
            certifiedForemanRateState = inner.state;
            data = { ...data, certifiedForemanRate: inner.data };
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
        let state = {
            initialParameters: parameters,
            description: descriptionState,
            type: typeState,
            quantity: quantityState,
            rate: rateState,
            certifiedForemanRate: certifiedForemanRateState,
            projectDescription: projectDescriptionState,
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
                <RecordContext meta={CONTINGENCY_ITEM_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    description: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.description>
    >;
    type: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.type>
    >;
    quantity: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.quantity>
    >;
    rate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.rate>
    >;
    certifiedForemanRate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.certifiedForemanRate>
    >;
    projectDescription: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectDescription>
    >;
};
// END MAGIC -- DO NOT EDIT
