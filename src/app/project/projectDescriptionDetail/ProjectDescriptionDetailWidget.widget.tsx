import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../../clay/quick-cache";
import { DropdownLinkWidget } from "../../../clay/widgets/dropdown-link-widget";
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
import { TextWidget } from "../../../clay/widgets/TextWidget";
import {
    PROJECT_DESCRIPTION_CATEGORY_META,
    PROJECT_DESCRIPTION_META,
} from "../../project-description/table";
import {
    ProjectDescriptionDetail,
    PROJECT_DESCRIPTION_DETAIL_META,
} from "./table";

export type Data = ProjectDescriptionDetail;

function validate(data: ProjectDescriptionDetail, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);

    const projectDescription = cache.get(
        PROJECT_DESCRIPTION_META,
        data.description
    );

    if (projectDescription?.requireDetail === false) {
        return errors.filter((error) => error.field !== "custom");
    } else {
        return errors;
    }
}

export const Fields = {
    category: DropdownLinkWidget({
        meta: PROJECT_DESCRIPTION_CATEGORY_META,
        label: (category) => category.name,
    }),
    description: DropdownLinkWidget({
        meta: PROJECT_DESCRIPTION_META,
        label: (description) => description.name,
    }),
    custom: TextWidget,
};

function Component(props: Props) {
    const projectDescription = useQuickRecord(
        PROJECT_DESCRIPTION_META,
        props.data.description
    );

    const includeDescription = React.useCallback(
        (description) => {
            return description.category === props.data.category;
        },
        [props.data.category]
    );

    return (
        <>
            <td>
                <widgets.category />
            </td>
            <td>
                <widgets.description include={includeDescription} />
            </td>
            <td>{projectDescription?.requireDetail && <widgets.custom />}</td>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.category> &
    WidgetContext<typeof Fields.description> &
    WidgetContext<typeof Fields.custom>;
type ExtraProps = {};
type BaseState = {
    category: WidgetState<typeof Fields.category>;
    description: WidgetState<typeof Fields.description>;
    custom: WidgetState<typeof Fields.custom>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "CATEGORY"; action: WidgetAction<typeof Fields.category> }
    | { type: "DESCRIPTION"; action: WidgetAction<typeof Fields.description> }
    | { type: "CUSTOM"; action: WidgetAction<typeof Fields.custom> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.category, data.category, cache, "category", errors);
    subvalidate(
        Fields.description,
        data.description,
        cache,
        "description",
        errors
    );
    subvalidate(Fields.custom, data.custom, cache, "custom", errors);
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
        case "CUSTOM": {
            const inner = Fields.custom.reduce(
                state.custom,
                data.custom,
                action.action,
                subcontext
            );
            return {
                state: { ...state, custom: inner.state },
                data: { ...data, custom: inner.data },
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
    custom: function (
        props: WidgetExtraProps<typeof Fields.custom> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CUSTOM",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "custom", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.custom.component
                state={context.state.custom}
                data={context.data.custom}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Custom"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PROJECT_DESCRIPTION_DETAIL_META,
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
        let customState;
        {
            const inner = Fields.custom.initialize(
                data.custom,
                subcontext,
                subparameters.custom
            );
            customState = inner.state;
            data = { ...data, custom: inner.data };
        }
        let state = {
            initialParameters: parameters,
            category: categoryState,
            description: descriptionState,
            custom: customState,
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
                <RecordContext
                    meta={PROJECT_DESCRIPTION_DETAIL_META}
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
    category: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.category>
    >;
    description: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.description>
    >;
    custom: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.custom>
    >;
};
// END MAGIC -- DO NOT EDIT
