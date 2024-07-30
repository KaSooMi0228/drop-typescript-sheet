import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { SaveButton } from "../../clay/save-button";
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
import { ListWidget } from "../../clay/widgets/ListWidget";
import { WarrantyReviewTemplate, WARRANTY_REVIEW_TEMPLATE_META } from "./table";
import WarrantyReviewTemplateInspectionItemWidget from "./WarrantyReviewTemplateInspectionItemWidget.widget";

export type Data = WarrantyReviewTemplate;

const Fields = {
    inspectionItems: ListWidget(WarrantyReviewTemplateInspectionItemWidget),
};

function Component(props: Props) {
    return (
        <>
            <table>
                <widgets.inspectionItems
                    extraItemForAdd
                    containerClass="tbody"
                />
            </table>
            <SaveButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.inspectionItems>;
type ExtraProps = {};
type BaseState = {
    inspectionItems: WidgetState<typeof Fields.inspectionItems>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "INSPECTION_ITEMS";
    action: WidgetAction<typeof Fields.inspectionItems>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.inspectionItems,
        data.inspectionItems,
        cache,
        "inspectionItems",
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
        case "INSPECTION_ITEMS": {
            const inner = Fields.inspectionItems.reduce(
                state.inspectionItems,
                data.inspectionItems,
                action.action,
                subcontext
            );
            return {
                state: { ...state, inspectionItems: inner.state },
                data: { ...data, inspectionItems: inner.data },
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
    inspectionItems: function (
        props: WidgetExtraProps<typeof Fields.inspectionItems> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INSPECTION_ITEMS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "inspectionItems", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.inspectionItems.component
                state={context.state.inspectionItems}
                data={context.data.inspectionItems}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Inspection Items"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WARRANTY_REVIEW_TEMPLATE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let inspectionItemsState;
        {
            const inner = Fields.inspectionItems.initialize(
                data.inspectionItems,
                subcontext,
                subparameters.inspectionItems
            );
            inspectionItemsState = inner.state;
            data = { ...data, inspectionItems: inner.data };
        }
        let state = {
            initialParameters: parameters,
            inspectionItems: inspectionItemsState,
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
                    meta={WARRANTY_REVIEW_TEMPLATE_META}
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
    inspectionItems: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.inspectionItems>
    >;
};
// END MAGIC -- DO NOT EDIT
