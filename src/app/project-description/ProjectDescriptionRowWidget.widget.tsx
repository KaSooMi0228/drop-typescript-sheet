import { ColumnCellProps } from "fixed-data-table-2";
import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { CheckboxWidget } from "../../clay/widgets/CheckboxWidget";
import { DropdownLinkWidget } from "../../clay/widgets/dropdown-link-widget";
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
import { TextWidget } from "../../clay/widgets/TextWidget";
import {
    ProjectDescription,
    PROJECT_DESCRIPTION_CATEGORY_META,
    PROJECT_DESCRIPTION_META,
} from "./table";

export type Data = ProjectDescription;

export const Fields = {
    name: TextWidget,
    requireDetail: CheckboxWidget,
    category: DropdownLinkWidget({
        meta: PROJECT_DESCRIPTION_CATEGORY_META,
        label: (record) => record.name,
    }),
};

export type ExtraProps = ColumnCellProps;

function Component(props: Props): React.Component {
    throw new Error("not supported");
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.requireDetail> &
    WidgetContext<typeof Fields.category>;
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    requireDetail: WidgetState<typeof Fields.requireDetail>;
    category: WidgetState<typeof Fields.category>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | {
          type: "REQUIRE_DETAIL";
          action: WidgetAction<typeof Fields.requireDetail>;
      }
    | { type: "CATEGORY"; action: WidgetAction<typeof Fields.category> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(
        Fields.requireDetail,
        data.requireDetail,
        cache,
        "requireDetail",
        errors
    );
    subvalidate(Fields.category, data.category, cache, "category", errors);
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
        case "REQUIRE_DETAIL": {
            const inner = Fields.requireDetail.reduce(
                state.requireDetail,
                data.requireDetail,
                action.action,
                subcontext
            );
            return {
                state: { ...state, requireDetail: inner.state },
                data: { ...data, requireDetail: inner.data },
            };
        }
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
    requireDetail: function (
        props: WidgetExtraProps<typeof Fields.requireDetail> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "REQUIRE_DETAIL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "requireDetail", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.requireDetail.component
                state={context.state.requireDetail}
                data={context.data.requireDetail}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Require Detail"}
            />
        );
    },
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PROJECT_DESCRIPTION_META,
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
        let requireDetailState;
        {
            const inner = Fields.requireDetail.initialize(
                data.requireDetail,
                subcontext,
                subparameters.requireDetail
            );
            requireDetailState = inner.state;
            data = { ...data, requireDetail: inner.data };
        }
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
        let state = {
            initialParameters: parameters,
            name: nameState,
            requireDetail: requireDetailState,
            category: categoryState,
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
                    meta={PROJECT_DESCRIPTION_META}
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
    name: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.name>
    >;
    requireDetail: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.requireDetail>
    >;
    category: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.category>
    >;
};
// END MAGIC -- DO NOT EDIT
