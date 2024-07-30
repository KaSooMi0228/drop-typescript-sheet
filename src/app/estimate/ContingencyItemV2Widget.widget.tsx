import { some } from "lodash";
import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
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
import EstimateActionWidget from "./action/EstimateActionWidget.widget";
import SideActionWidget from "./action/SideActionWidget.widget";
import { AREA_META } from "./area/table";
import { ReactContext as ContingencyItemsReactContext } from "./ContingencyItemsV2Widget.widget";
import {
    EstimateContingencyItemV2,
    ESTIMATE_CONTINGENCY_ITEM_V2_META,
} from "./table";

export type Data = EstimateContingencyItemV2;

const Fields = {
    side: SideActionWidget,
    estimate: EstimateActionWidget,
    areas: LinkSetWidget({
        meta: AREA_META,
        name: (area) => area.name,
    }),
};

function Component(props: Props) {
    const itemsContext = React.useContext(ContingencyItemsReactContext)!;
    const estimate = itemsContext.data;
    const actionIndex = estimate.contingencyItemsV2.indexOf(props.data);
    const onRemove = React.useCallback(() => {
        const estimateAction = props.data.estimate;
        if (
            some(
                estimate.contingencyItemsV2,
                (action) =>
                    action.estimate.copyUnitsFromAction ===
                    estimate.contingencyItemsV2[actionIndex].estimate.id.uuid
            )
        ) {
            alert(
                "This contingency item cannot be removed: it is the calculator source for another contingency item."
            );
            return;
        }

        if (
            confirm(
                `Are you sure you want to remove the action "${estimateAction.name}"?`
            )
        ) {
            itemsContext.dispatch({
                type: "CONTINGENCY_ITEMS_V2",
                action: {
                    type: "REMOVE",
                    index: actionIndex,
                },
            });
        }
    }, [itemsContext.dispatch, props.data.estimate, itemsContext.data.actions]);

    const onDuplicate = React.useCallback(() => {
        const estimateAction = props.data.estimate;

        const name = prompt(
            "Name for new action?",
            estimateAction.name + " (copy)"
        );
        if (name) {
            itemsContext.dispatch({
                type: "DUPLICATE_CONTINGENCY_ITEM",
                index: actionIndex,
                name,
            });
        }
    }, [itemsContext.dispatch, props.data.estimate, itemsContext.data.actions]);

    return (
        <widgets.side
            estimateAction={props.data.estimate}
            estimateActionWidget={(widget) => {
                return <widgets.estimate widget={widget} contingency={true} />;
            }}
            onDuplicate={onDuplicate}
            onRemove={onRemove}
            contingency={true}
            areas={<widgets.areas records={estimate.areas} />}
        />
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.side> &
    WidgetContext<typeof Fields.estimate> &
    WidgetContext<typeof Fields.areas>;
type ExtraProps = {};
type BaseState = {
    side: WidgetState<typeof Fields.side>;
    estimate: WidgetState<typeof Fields.estimate>;
    areas: WidgetState<typeof Fields.areas>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "SIDE"; action: WidgetAction<typeof Fields.side> }
    | { type: "ESTIMATE"; action: WidgetAction<typeof Fields.estimate> }
    | { type: "AREAS"; action: WidgetAction<typeof Fields.areas> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.side, data.side, cache, "side", errors);
    subvalidate(Fields.estimate, data.estimate, cache, "estimate", errors);
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
        case "SIDE": {
            const inner = Fields.side.reduce(
                state.side,
                data.side,
                action.action,
                subcontext
            );
            return {
                state: { ...state, side: inner.state },
                data: { ...data, side: inner.data },
            };
        }
        case "ESTIMATE": {
            const inner = Fields.estimate.reduce(
                state.estimate,
                data.estimate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, estimate: inner.state },
                data: { ...data, estimate: inner.data },
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
    side: function (
        props: WidgetExtraProps<typeof Fields.side> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "SIDE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "side", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.side.component
                state={context.state.side}
                data={context.data.side}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Side"}
            />
        );
    },
    estimate: function (
        props: WidgetExtraProps<typeof Fields.estimate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ESTIMATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "estimate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.estimate.component
                state={context.state.estimate}
                data={context.data.estimate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Estimate"}
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
    dataMeta: ESTIMATE_CONTINGENCY_ITEM_V2_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let sideState;
        {
            const inner = Fields.side.initialize(
                data.side,
                subcontext,
                subparameters.side
            );
            sideState = inner.state;
            data = { ...data, side: inner.data };
        }
        let estimateState;
        {
            const inner = Fields.estimate.initialize(
                data.estimate,
                subcontext,
                subparameters.estimate
            );
            estimateState = inner.state;
            data = { ...data, estimate: inner.data };
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
            side: sideState,
            estimate: estimateState,
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
                <RecordContext
                    meta={ESTIMATE_CONTINGENCY_ITEM_V2_META}
                    value={props.data}
                >
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    side: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.side>
    >;
    estimate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.estimate>
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
