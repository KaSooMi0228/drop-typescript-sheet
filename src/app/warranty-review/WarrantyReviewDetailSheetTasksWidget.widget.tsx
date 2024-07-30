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
import { StaticListWidget } from "../../clay/widgets/StaticListWidget";
import {
    WarrantyReviewDetailSheet,
    WARRANTY_REVIEW_DETAIL_SHEET_META,
} from "./table";
import WarrantyReviewDetailSheetItemWidget from "./WarrantyReviewDetailSheetItemWidget.widget";

export type Data = WarrantyReviewDetailSheet;

export const Fields = {
    items: StaticListWidget(WarrantyReviewDetailSheetItemWidget),
};

export function Component(props: Props) {
    return (
        <>
            <widgets.items />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.items>;
type ExtraProps = {};
type BaseState = {
    items: WidgetState<typeof Fields.items>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = { type: "ITEMS"; action: WidgetAction<typeof Fields.items> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.items, data.items, cache, "items", errors);
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
        case "ITEMS": {
            const inner = Fields.items.reduce(
                state.items,
                data.items,
                action.action,
                subcontext
            );
            return {
                state: { ...state, items: inner.state },
                data: { ...data, items: inner.data },
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
    items: function (
        props: WidgetExtraProps<typeof Fields.items> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "ITEMS", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "items", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.items.component
                state={context.state.items}
                data={context.data.items}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Items"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WARRANTY_REVIEW_DETAIL_SHEET_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let itemsState;
        {
            const inner = Fields.items.initialize(
                data.items,
                subcontext,
                subparameters.items
            );
            itemsState = inner.state;
            data = { ...data, items: inner.data };
        }
        let state = {
            initialParameters: parameters,
            items: itemsState,
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
                    meta={WARRANTY_REVIEW_DETAIL_SHEET_META}
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
    items: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.items>
    >;
};
// END MAGIC -- DO NOT EDIT
