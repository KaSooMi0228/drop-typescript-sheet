import { some } from "lodash";
import * as React from "react";
import { Dictionary } from "../../clay/common";
import { PaginatedWidget } from "../../clay/paginated-widget";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { SaveButton } from "../../clay/save-button";
import { newUUID } from "../../clay/uuid";
import { DateTimeWidget } from "../../clay/widgets/DateTimeWidget";
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
import { ListWidget } from "../../clay/widgets/ListWidget";
import {
    WarrantyReview,
    WarrantyReviewTemplate,
    WARRANTY_REVIEW_META,
    WARRANTY_REVIEW_TEMPLATE_ID,
    WARRANTY_REVIEW_TEMPLATE_META,
} from "./table";
import WarrantyReviewGeneralInspectionWidget from "./WarrantyReviewGeneralInspectionWidget.widget";
import WarrantyReviewSpecificItemWidget from "./WarrantyReviewSpecificItemWidget.widget";

export const WarrantyReviewReviewWidget = PaginatedWidget({
    pages(data) {
        return [
            {
                id: "inspection",
                title: "General Inspection",
                widget: WarrantyReviewGeneralInspectionWidget,
            },
            {
                id: "specific-items",
                title: "Specific Items",
                widget: Widget,
            },
        ];
    },
    process(warranty, cache, currentPageId, extra) {
        if (warranty.generalInspection.length != 0) {
            return null;
        }

        const template: WarrantyReviewTemplate | undefined | null = cache.get(
            WARRANTY_REVIEW_TEMPLATE_META,
            WARRANTY_REVIEW_TEMPLATE_ID
        );
        if (!template) {
            return undefined;
        }

        return {
            ...warranty,
            generalInspection: template.inspectionItems.map((item) => ({
                id: newUUID(),
                name: item.name,
                evaluation: "" as const,
                notes: "",
            })),
        };
    },
    dataMeta: WARRANTY_REVIEW_META,
});

export type Data = WarrantyReview;

export const Fields = {
    reviewDate: Optional(DateTimeWidget),
    specificItems: ListWidget(WarrantyReviewSpecificItemWidget),
};

function validate(review: WarrantyReview, cache: QuickCacheApi) {
    const errors = baseValidate(review, cache);
    return errors.filter(
        (error) =>
            error.field != "specificItems" ||
            some(
                review.generalInspection,
                (item) => item.evaluation === "Requires Attention"
            )
    );
}

function Component(props: Props) {
    const setReviewDate = React.useCallback(
        () =>
            props.dispatch({
                type: "REVIEW_DATE",
                action: {
                    type: "SET",
                    value: new Date(),
                },
            }),
        [props.dispatch]
    );
    return (
        <>
            <table>
                <thead>
                    <tr>
                        <th></th>
                        <th>Number</th>
                        <th>Description of Issue</th>
                        <th>Action Required</th>
                        <th>Covered by Remdal Warranty?</th>
                    </tr>
                </thead>
                <widgets.specificItems containerClass="tbody" extraItemForAdd />
            </table>
            <SaveButton
                label="Generate Review"
                preSave={setReviewDate}
                printTemplate="warrantyReview"
            />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.reviewDate> &
    WidgetContext<typeof Fields.specificItems>;
type ExtraProps = {};
type BaseState = {
    reviewDate: WidgetState<typeof Fields.reviewDate>;
    specificItems: WidgetState<typeof Fields.specificItems>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "REVIEW_DATE"; action: WidgetAction<typeof Fields.reviewDate> }
    | {
          type: "SPECIFIC_ITEMS";
          action: WidgetAction<typeof Fields.specificItems>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.reviewDate,
        data.reviewDate,
        cache,
        "reviewDate",
        errors
    );
    subvalidate(
        Fields.specificItems,
        data.specificItems,
        cache,
        "specificItems",
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
        case "REVIEW_DATE": {
            const inner = Fields.reviewDate.reduce(
                state.reviewDate,
                data.reviewDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, reviewDate: inner.state },
                data: { ...data, reviewDate: inner.data },
            };
        }
        case "SPECIFIC_ITEMS": {
            const inner = Fields.specificItems.reduce(
                state.specificItems,
                data.specificItems,
                action.action,
                subcontext
            );
            return {
                state: { ...state, specificItems: inner.state },
                data: { ...data, specificItems: inner.data },
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
    reviewDate: function (
        props: WidgetExtraProps<typeof Fields.reviewDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "REVIEW_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "reviewDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.reviewDate.component
                state={context.state.reviewDate}
                data={context.data.reviewDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Review Date"}
            />
        );
    },
    specificItems: function (
        props: WidgetExtraProps<typeof Fields.specificItems> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SPECIFIC_ITEMS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "specificItems", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.specificItems.component
                state={context.state.specificItems}
                data={context.data.specificItems}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Specific Items"}
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
        let reviewDateState;
        {
            const inner = Fields.reviewDate.initialize(
                data.reviewDate,
                subcontext,
                subparameters.reviewDate
            );
            reviewDateState = inner.state;
            data = { ...data, reviewDate: inner.data };
        }
        let specificItemsState;
        {
            const inner = Fields.specificItems.initialize(
                data.specificItems,
                subcontext,
                subparameters.specificItems
            );
            specificItemsState = inner.state;
            data = { ...data, specificItems: inner.data };
        }
        let state = {
            initialParameters: parameters,
            reviewDate: reviewDateState,
            specificItems: specificItemsState,
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
    reviewDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.reviewDate>
    >;
    specificItems: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.specificItems>
    >;
};
// END MAGIC -- DO NOT EDIT
