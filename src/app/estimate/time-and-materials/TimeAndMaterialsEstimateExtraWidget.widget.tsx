import Decimal from "decimal.js";
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
import { useListItemContext } from "../../../clay/widgets/ListWidget";
import { MoneyStatic, MoneyWidget } from "../../../clay/widgets/money-widget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { useIsMobile } from "../../../useIsMobile";
import {
    TimeAndMaterialsEstimateExtra,
    TIME_AND_MATERIALS_ESTIMATE_EXTRA_META,
} from "./table";
import { ReactContext as TimeAndMaterialsEstimateMainWidgetReactContext } from "./TimeAndMaterialsEstimateMainWidget.widget";

export type Data = TimeAndMaterialsEstimateExtra;

export const Fields = {
    description: TextWidget,
    amount: MoneyWidget,
};

function Component(props: Props) {
    const listItemContext = useListItemContext();
    const estimateContext = React.useContext(
        TimeAndMaterialsEstimateMainWidgetReactContext
    )!;

    const isMobile = useIsMobile();

    return (
        <tr {...listItemContext.draggableProps}>
            <td style={{ display: isMobile ? "none" : undefined }}>
                {listItemContext.dragHandle}
            </td>
            <td colSpan={isMobile ? 1 : 2}>
                <widgets.description />
            </td>
            <td colSpan={isMobile ? 2 : 1}>
                <widgets.amount />
            </td>
            {!isMobile && (
                <td>
                    <MoneyStatic
                        value={props.data.amount.times(
                            new Decimal(1)
                                .plus(estimateContext.data.common.markup)
                                .plus(
                                    estimateContext.data.common.additionalMarkup
                                )
                        )}
                    />
                </td>
            )}
            {!isMobile && (
                <td>
                    <MoneyStatic
                        value={props.data.amount.times(
                            new Decimal(1)
                                .plus(estimateContext.data.common.markup)
                                .plus(
                                    estimateContext.data.common.additionalMarkup
                                )
                        )}
                    />
                </td>
            )}
            <td>
                <RemoveButton />
            </td>
        </tr>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.description> &
    WidgetContext<typeof Fields.amount>;
type ExtraProps = {};
type BaseState = {
    description: WidgetState<typeof Fields.description>;
    amount: WidgetState<typeof Fields.amount>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "DESCRIPTION"; action: WidgetAction<typeof Fields.description> }
    | { type: "AMOUNT"; action: WidgetAction<typeof Fields.amount> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.description,
        data.description,
        cache,
        "description",
        errors
    );
    subvalidate(Fields.amount, data.amount, cache, "amount", errors);
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
        case "AMOUNT": {
            const inner = Fields.amount.reduce(
                state.amount,
                data.amount,
                action.action,
                subcontext
            );
            return {
                state: { ...state, amount: inner.state },
                data: { ...data, amount: inner.data },
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
    amount: function (
        props: WidgetExtraProps<typeof Fields.amount> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "AMOUNT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "amount", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.amount.component
                state={context.state.amount}
                data={context.data.amount}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Amount"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: TIME_AND_MATERIALS_ESTIMATE_EXTRA_META,
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
        let amountState;
        {
            const inner = Fields.amount.initialize(
                data.amount,
                subcontext,
                subparameters.amount
            );
            amountState = inner.state;
            data = { ...data, amount: inner.data };
        }
        let state = {
            initialParameters: parameters,
            description: descriptionState,
            amount: amountState,
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
                    meta={TIME_AND_MATERIALS_ESTIMATE_EXTRA_META}
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
    description: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.description>
    >;
    amount: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.amount>
    >;
};
// END MAGIC -- DO NOT EDIT
