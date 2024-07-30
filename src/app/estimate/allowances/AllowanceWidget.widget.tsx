import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { RemoveButton } from "../../../clay/remove-button";
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
import { LinkSetWidget } from "../../../clay/widgets/link-set-widget";
import { useListItemContext } from "../../../clay/widgets/ListWidget";
import { MoneyStatic, MoneyWidget } from "../../../clay/widgets/money-widget";
import { PercentageWidget } from "../../../clay/widgets/percentage-widget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { AREA_META } from "../area/table";
import { ReactContext as EstimateWidgetReactContext } from "../EstimateWidget.widget";
import { Allowance, allowancePrice, ALLOWANCE_META } from "./table";

export type Data = Allowance;

export const Fields = {
    name: TextWidget,
    cost: MoneyWidget,
    markup: PercentageWidget,
    areas: LinkSetWidget({
        meta: AREA_META,
        name: (area) => area.name,
    }),
};

function Component(props: Props) {
    const estimateContext = React.useContext(EstimateWidgetReactContext);
    if (!estimateContext) {
        throw new Error("Should be used in context");
    }
    const listItemContext = useListItemContext();

    return (
        <tr {...listItemContext.draggableProps}>
            <td>{listItemContext.dragHandle} </td>
            <td>
                <widgets.name />
            </td>
            <td>
                <widgets.cost />
            </td>
            <td>
                <widgets.markup />
            </td>
            <td>
                <MoneyStatic
                    value={allowancePrice(
                        props.data,
                        estimateContext.data.common
                            .additionalAllowancesMarkup ??
                            estimateContext.data.common.additionalMarkup
                    )}
                />
            </td>
            <td>
                <widgets.areas
                    horizontal
                    records={estimateContext.data.areas}
                />
            </td>
            <td>
                <RemoveButton />
            </td>
        </tr>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.cost> &
    WidgetContext<typeof Fields.markup> &
    WidgetContext<typeof Fields.areas>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    cost: WidgetState<typeof Fields.cost>;
    markup: WidgetState<typeof Fields.markup>;
    areas: WidgetState<typeof Fields.areas>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "COST"; action: WidgetAction<typeof Fields.cost> }
    | { type: "MARKUP"; action: WidgetAction<typeof Fields.markup> }
    | { type: "AREAS"; action: WidgetAction<typeof Fields.areas> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.cost, data.cost, cache, "cost", errors);
    subvalidate(Fields.markup, data.markup, cache, "markup", errors);
    subvalidate(Fields.areas, data.areas, cache, "areas", errors);
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
        case "COST": {
            const inner = Fields.cost.reduce(
                state.cost,
                data.cost,
                action.action,
                subcontext
            );
            return {
                state: { ...state, cost: inner.state },
                data: { ...data, cost: inner.data },
            };
        }
        case "MARKUP": {
            const inner = Fields.markup.reduce(
                state.markup,
                data.markup,
                action.action,
                subcontext
            );
            return {
                state: { ...state, markup: inner.state },
                data: { ...data, markup: inner.data },
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
    cost: function (
        props: WidgetExtraProps<typeof Fields.cost> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "COST", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "cost", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.cost.component
                state={context.state.cost}
                data={context.data.cost}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Cost"}
            />
        );
    },
    markup: function (
        props: WidgetExtraProps<typeof Fields.markup> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MARKUP",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "markup", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.markup.component
                state={context.state.markup}
                data={context.data.markup}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Markup"}
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ALLOWANCE_META,
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
        let costState;
        {
            const inner = Fields.cost.initialize(
                data.cost,
                subcontext,
                subparameters.cost
            );
            costState = inner.state;
            data = { ...data, cost: inner.data };
        }
        let markupState;
        {
            const inner = Fields.markup.initialize(
                data.markup,
                subcontext,
                subparameters.markup
            );
            markupState = inner.state;
            data = { ...data, markup: inner.data };
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
        let state = {
            initialParameters: parameters,
            name: nameState,
            cost: costState,
            markup: markupState,
            areas: areasState,
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
                <RecordContext meta={ALLOWANCE_META} value={props.data}>
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
    cost: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.cost>
    >;
    markup: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.markup>
    >;
    areas: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.areas>
    >;
};
// END MAGIC -- DO NOT EDIT
