import React from "react";
import { Dictionary } from "../../../clay/common";
import { DeleteButton } from "../../../clay/delete-button";
import { GenerateButton } from "../../../clay/generate-button";
import { PaginatedWidget } from "../../../clay/paginated-widget";
import { propCheck } from "../../../clay/propCheck";
import {
    QuickCacheApi,
    useQuickRecord,
    useQuickRecords,
} from "../../../clay/quick-cache";
import { DropdownLinkWidget } from "../../../clay/widgets/dropdown-link-widget";
import { FormField } from "../../../clay/widgets/FormField";
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
import { SelectLinkWidget } from "../../../clay/widgets/SelectLinkWidget";
import { RichTextWidget } from "../../rich-text-widget";
import { CONTENT_AREA } from "../../styles";
import { ROLE_CERTIFIED_FOREMAN, USER_META } from "../../user/table";
import { ReactContext as ProjectCertifiedForemenCommunicationWidgetReactContext } from "../ProjectCertifiedForemenCommunicationWidget.widget";
import {
    CoreValueNotice,
    CORE_VALUE_NOTICE_CATEGORY_META,
    CORE_VALUE_NOTICE_META,
    CORE_VALUE_NOTICE_TYPE_META,
} from "./table";

export type Data = CoreValueNotice;

export const Fields = {
    certifiedForeman: FormField(
        SelectLinkWidget({
            meta: USER_META,
            label: (user) => user.name,
        })
    ),
    category: FormField(
        DropdownLinkWidget({
            meta: CORE_VALUE_NOTICE_CATEGORY_META,
            label: (category) => category.name,
        })
    ),
    type: FormField(
        SelectLinkWidget({
            meta: CORE_VALUE_NOTICE_TYPE_META,
            label: (category) => category.name,
        })
    ),
    custom: RichTextWidget,
};

function actionFinalize(state: State, data: Data) {
    return {
        state,
        data: {
            ...data,
            date: data.date || new Date(),
        },
    };
}

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);

    if (data.type !== null) {
        return errors.filter((x) => x.field !== "custom");
    } else if (data.custom !== "") {
        return errors.filter((x) => x.field !== "type");
    } else {
        return errors;
    }
}

function Component(props: Props) {
    const projectContext = React.useContext(
        ProjectCertifiedForemenCommunicationWidgetReactContext
    )!;

    const certifiedForemen = useQuickRecords(
        USER_META,
        projectContext.data.personnel
            .filter((role) => role.role === ROLE_CERTIFIED_FOREMAN)
            .map((x) => x.user!)
    );

    const category = useQuickRecord(
        CORE_VALUE_NOTICE_CATEGORY_META,
        props.data.category
    );

    return (
        <>
            <div {...CONTENT_AREA}>
                <widgets.certifiedForeman records={certifiedForemen} />
                <widgets.category />
                <widgets.type records={category?.types || []} clearable />
                <div
                    dangerouslySetInnerHTML={{
                        __html: category?.introText || "",
                    }}
                />
                <widgets.custom />
                <div
                    dangerouslySetInnerHTML={{
                        __html: category?.conclusionText || "",
                    }}
                />
            </div>
            <div style={{ display: "flex" }}>
                <GenerateButton label="Generate Notice" />
                <DeleteButton />
            </div>
        </>
    );
}

export const CoreValueNoticeWrapperWidget = PaginatedWidget({
    dataMeta: CORE_VALUE_NOTICE_META,
    validate(detailSheet, cache, errors) {
        if (detailSheet.date) {
            return [];
        } else {
            return errors;
        }
    },
    pages() {
        return [
            {
                id: "notice",
                title: "Notice",
                widget: Widget,
            },
        ];
    },
});

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.certifiedForeman> &
    WidgetContext<typeof Fields.category> &
    WidgetContext<typeof Fields.type> &
    WidgetContext<typeof Fields.custom>;
type ExtraProps = {};
type BaseState = {
    certifiedForeman: WidgetState<typeof Fields.certifiedForeman>;
    category: WidgetState<typeof Fields.category>;
    type: WidgetState<typeof Fields.type>;
    custom: WidgetState<typeof Fields.custom>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "CERTIFIED_FOREMAN";
          action: WidgetAction<typeof Fields.certifiedForeman>;
      }
    | { type: "CATEGORY"; action: WidgetAction<typeof Fields.category> }
    | { type: "TYPE"; action: WidgetAction<typeof Fields.type> }
    | { type: "CUSTOM"; action: WidgetAction<typeof Fields.custom> }
    | { type: "FINALIZE" };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.certifiedForeman,
        data.certifiedForeman,
        cache,
        "certifiedForeman",
        errors
    );
    subvalidate(Fields.category, data.category, cache, "category", errors);
    subvalidate(Fields.type, data.type, cache, "type", errors);
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
        case "CERTIFIED_FOREMAN": {
            const inner = Fields.certifiedForeman.reduce(
                state.certifiedForeman,
                data.certifiedForeman,
                action.action,
                subcontext
            );
            return {
                state: { ...state, certifiedForeman: inner.state },
                data: { ...data, certifiedForeman: inner.data },
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
        case "TYPE": {
            const inner = Fields.type.reduce(
                state.type,
                data.type,
                action.action,
                subcontext
            );
            return {
                state: { ...state, type: inner.state },
                data: { ...data, type: inner.data },
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
        case "FINALIZE":
            return actionFinalize(state, data);
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
    certifiedForeman: function (
        props: WidgetExtraProps<typeof Fields.certifiedForeman> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CERTIFIED_FOREMAN",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "certifiedForeman", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.certifiedForeman.component
                state={context.state.certifiedForeman}
                data={context.data.certifiedForeman}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Certified Foreman"}
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
    type: function (
        props: WidgetExtraProps<typeof Fields.type> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "TYPE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "type", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.type.component
                state={context.state.type}
                data={context.data.type}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Type"}
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
    dataMeta: CORE_VALUE_NOTICE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let certifiedForemanState;
        {
            const inner = Fields.certifiedForeman.initialize(
                data.certifiedForeman,
                subcontext,
                subparameters.certifiedForeman
            );
            certifiedForemanState = inner.state;
            data = { ...data, certifiedForeman: inner.data };
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
        let typeState;
        {
            const inner = Fields.type.initialize(
                data.type,
                subcontext,
                subparameters.type
            );
            typeState = inner.state;
            data = { ...data, type: inner.data };
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
            certifiedForeman: certifiedForemanState,
            category: categoryState,
            type: typeState,
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
                <RecordContext meta={CORE_VALUE_NOTICE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    certifiedForeman: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.certifiedForeman>
    >;
    category: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.category>
    >;
    type: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.type>
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
