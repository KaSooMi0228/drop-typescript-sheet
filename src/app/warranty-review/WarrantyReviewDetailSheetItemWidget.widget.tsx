import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { FormField } from "../../clay/widgets/FormField";
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
import { SwitchWidget } from "../../clay/widgets/SwitchWidget";
import {
    WarrantyReviewDetailSheetItem,
    WARRANTY_REVIEW_DETAIL_SHEET_ITEM_META,
} from "./table";

export type Data = WarrantyReviewDetailSheetItem;

const Fields = {
    included: FormField(SwitchWidget),
};

function Component(props: Props) {
    return (
        <>
            <h3>{props.data.description}</h3>
            <p>{props.data.actionRequired}</p>
            <widgets.included />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.included>;
type ExtraProps = {};
type BaseState = {
    included: WidgetState<typeof Fields.included>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "INCLUDED";
    action: WidgetAction<typeof Fields.included>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.included, data.included, cache, "included", errors);
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
        case "INCLUDED": {
            const inner = Fields.included.reduce(
                state.included,
                data.included,
                action.action,
                subcontext
            );
            return {
                state: { ...state, included: inner.state },
                data: { ...data, included: inner.data },
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
    included: function (
        props: WidgetExtraProps<typeof Fields.included> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INCLUDED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "included", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.included.component
                state={context.state.included}
                data={context.data.included}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Included"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WARRANTY_REVIEW_DETAIL_SHEET_ITEM_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let includedState;
        {
            const inner = Fields.included.initialize(
                data.included,
                subcontext,
                subparameters.included
            );
            includedState = inner.state;
            data = { ...data, included: inner.data };
        }
        let state = {
            initialParameters: parameters,
            included: includedState,
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
                    meta={WARRANTY_REVIEW_DETAIL_SHEET_ITEM_META}
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
    included: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.included>
    >;
};
// END MAGIC -- DO NOT EDIT
