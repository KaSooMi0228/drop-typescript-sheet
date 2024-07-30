import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { ValidationError } from "../../../clay/widgets";
import { DropdownLinkWidget } from "../../../clay/widgets/dropdown-link-widget";
import { FormField } from "../../../clay/widgets/FormField";
import {
    RecordContext,
    RecordWidget,
    subStatus,
    subvalidate,
    Widget,
    WidgetAction,
    WidgetContext,
    WidgetExtraProps,
    WidgetProps,
    WidgetResult,
    WidgetState,
    WidgetStatus,
} from "../../../clay/widgets/index";
import { FieldRow } from "../../../clay/widgets/layout";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import {
    QuoteSource,
    QUOTE_SOURCE_CATEGORY_META,
    QUOTE_SOURCE_META,
} from "./table";

export const QuoteSourceCategoryLinkWidget = DropdownLinkWidget({
    meta: QUOTE_SOURCE_CATEGORY_META,
    label: (record) => record.name,
});

export type Data = QuoteSource;

export const Fields = {
    category: FormField(QuoteSourceCategoryLinkWidget),
    detail: FormField(TextWidget),
};

export function validate(
    data: QuoteSource,
    cache: QuickCacheApi
): ValidationError[] {
    if (data.category === null) {
        return [
            {
                field: "category",
                empty: true,
                invalid: false,
            },
        ];
    }

    const quoteSourceCategory = cache.get(
        QUOTE_SOURCE_CATEGORY_META,
        data.category
    );

    if (
        (!quoteSourceCategory || quoteSourceCategory.requireDetail) &&
        data.detail === ""
    ) {
        return [
            {
                field: "detail",
                empty: true,
                invalid: false,
            },
        ];
    } else {
        return [];
    }
}

function Component(props: Props) {
    return (
        <FieldRow>
            <widgets.category label="Source" />
            <widgets.detail label="Source Notes" />
        </FieldRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.category> &
    WidgetContext<typeof Fields.detail>;
type ExtraProps = {};
type BaseState = {
    category: WidgetState<typeof Fields.category>;
    detail: WidgetState<typeof Fields.detail>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "CATEGORY"; action: WidgetAction<typeof Fields.category> }
    | { type: "DETAIL"; action: WidgetAction<typeof Fields.detail> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.category, data.category, cache, "category", errors);
    subvalidate(Fields.detail, data.detail, cache, "detail", errors);
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
        case "CATEGORY": {
            const inner = Fields.category.reduce(
                state.category,
                data.category,
                action.action,
                subcontext
            );
            return {
                state: { ...state, category: inner.state },
                data: { ...data, category: inner.data },
            };
        }
        case "DETAIL": {
            const inner = Fields.detail.reduce(
                state.detail,
                data.detail,
                action.action,
                subcontext
            );
            return {
                state: { ...state, detail: inner.state },
                data: { ...data, detail: inner.data },
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
    category: function (
        props: WidgetExtraProps<typeof Fields.category> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CATEGORY",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "category", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.category.component
                state={context.state.category}
                data={context.data.category}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Category"}
            />
        );
    },
    detail: function (
        props: WidgetExtraProps<typeof Fields.detail> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DETAIL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "detail", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.detail.component
                state={context.state.detail}
                data={context.data.detail}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Detail"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: QUOTE_SOURCE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let categoryState;
        {
            const inner = Fields.category.initialize(
                data.category,
                subcontext,
                subparameters.category
            );
            categoryState = inner.state;
            data = { ...data, category: inner.data };
        }
        let detailState;
        {
            const inner = Fields.detail.initialize(
                data.detail,
                subcontext,
                subparameters.detail
            );
            detailState = inner.state;
            data = { ...data, detail: inner.data };
        }
        let state = {
            initialParameters: parameters,
            category: categoryState,
            detail: detailState,
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
                <RecordContext meta={QUOTE_SOURCE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    category: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.category>
    >;
    detail: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.detail>
    >;
};
// END MAGIC -- DO NOT EDIT
