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
import { WarrantyReview, WARRANTY_REVIEW_META } from "./table";
import WarrantyReviewInspectionItemWidget from "./WarrantyReviewInspectionItemWidget.widget";

export type Data = WarrantyReview;

export const Fields = {
    generalInspection: StaticListWidget(WarrantyReviewInspectionItemWidget),
};

function Component(props: Props) {
    return (
        <table>
            <thead>
                <tr>
                    <th></th>
                    <th style={{ width: "20em" }}>Inspected Item</th>
                    <th style={{ width: "20em" }}>Problem Signs</th>
                    <th>Evaluation</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                <widgets.generalInspection />
            </tbody>
        </table>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.generalInspection>;
type ExtraProps = {};
type BaseState = {
    generalInspection: WidgetState<typeof Fields.generalInspection>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "GENERAL_INSPECTION";
    action: WidgetAction<typeof Fields.generalInspection>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.generalInspection,
        data.generalInspection,
        cache,
        "generalInspection",
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
        case "GENERAL_INSPECTION": {
            const inner = Fields.generalInspection.reduce(
                state.generalInspection,
                data.generalInspection,
                action.action,
                subcontext
            );
            return {
                state: { ...state, generalInspection: inner.state },
                data: { ...data, generalInspection: inner.data },
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
    generalInspection: function (
        props: WidgetExtraProps<typeof Fields.generalInspection> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "GENERAL_INSPECTION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "generalInspection",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.generalInspection.component
                state={context.state.generalInspection}
                data={context.data.generalInspection}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "General Inspection"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WARRANTY_REVIEW_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let generalInspectionState;
        {
            const inner = Fields.generalInspection.initialize(
                data.generalInspection,
                subcontext,
                subparameters.generalInspection
            );
            generalInspectionState = inner.state;
            data = { ...data, generalInspection: inner.data };
        }
        let state = {
            initialParameters: parameters,
            generalInspection: generalInspectionState,
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
                <RecordContext meta={WARRANTY_REVIEW_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    generalInspection: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.generalInspection>
    >;
};
// END MAGIC -- DO NOT EDIT
