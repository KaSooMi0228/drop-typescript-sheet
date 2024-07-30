import React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { FormField, OptionalFormField } from "../../../clay/widgets/FormField";
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
import { ListWidget } from "../../../clay/widgets/ListWidget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { RichTextWidget } from "../../rich-text-widget";
import { CONTENT_AREA } from "../../styles";
import CoreValueNoticeTypeWidget from "./CoreValueNoticeTypeWidget.widget";
import {
    CoreValueNoticeCategory,
    CORE_VALUE_NOTICE_CATEGORY_META,
} from "./table";

export type Data = CoreValueNoticeCategory;

export const Fields = {
    name: FormField(TextWidget),
    types: ListWidget(CoreValueNoticeTypeWidget),
    introText: OptionalFormField(RichTextWidget),
    conclusionText: OptionalFormField(RichTextWidget),
};

function Component(props: Props) {
    return (
        <>
            <div {...CONTENT_AREA}>
                <widgets.name />
                <table>
                    <widgets.types extraItemForAdd containerClass="tbody" />
                </table>
                <widgets.introText />
                <widgets.conclusionText />
            </div>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.types> &
    WidgetContext<typeof Fields.introText> &
    WidgetContext<typeof Fields.conclusionText>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    types: WidgetState<typeof Fields.types>;
    introText: WidgetState<typeof Fields.introText>;
    conclusionText: WidgetState<typeof Fields.conclusionText>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "TYPES"; action: WidgetAction<typeof Fields.types> }
    | { type: "INTRO_TEXT"; action: WidgetAction<typeof Fields.introText> }
    | {
          type: "CONCLUSION_TEXT";
          action: WidgetAction<typeof Fields.conclusionText>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.types, data.types, cache, "types", errors);
    subvalidate(Fields.introText, data.introText, cache, "introText", errors);
    subvalidate(
        Fields.conclusionText,
        data.conclusionText,
        cache,
        "conclusionText",
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
        case "TYPES": {
            const inner = Fields.types.reduce(
                state.types,
                data.types,
                action.action,
                subcontext
            );
            return {
                state: { ...state, types: inner.state },
                data: { ...data, types: inner.data },
            };
        }
        case "INTRO_TEXT": {
            const inner = Fields.introText.reduce(
                state.introText,
                data.introText,
                action.action,
                subcontext
            );
            return {
                state: { ...state, introText: inner.state },
                data: { ...data, introText: inner.data },
            };
        }
        case "CONCLUSION_TEXT": {
            const inner = Fields.conclusionText.reduce(
                state.conclusionText,
                data.conclusionText,
                action.action,
                subcontext
            );
            return {
                state: { ...state, conclusionText: inner.state },
                data: { ...data, conclusionText: inner.data },
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
    types: function (
        props: WidgetExtraProps<typeof Fields.types> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "TYPES", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "types", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.types.component
                state={context.state.types}
                data={context.data.types}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Types"}
            />
        );
    },
    introText: function (
        props: WidgetExtraProps<typeof Fields.introText> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INTRO_TEXT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "introText", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.introText.component
                state={context.state.introText}
                data={context.data.introText}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Intro Text"}
            />
        );
    },
    conclusionText: function (
        props: WidgetExtraProps<typeof Fields.conclusionText> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONCLUSION_TEXT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "conclusionText", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.conclusionText.component
                state={context.state.conclusionText}
                data={context.data.conclusionText}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Conclusion Text"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: CORE_VALUE_NOTICE_CATEGORY_META,
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
        let typesState;
        {
            const inner = Fields.types.initialize(
                data.types,
                subcontext,
                subparameters.types
            );
            typesState = inner.state;
            data = { ...data, types: inner.data };
        }
        let introTextState;
        {
            const inner = Fields.introText.initialize(
                data.introText,
                subcontext,
                subparameters.introText
            );
            introTextState = inner.state;
            data = { ...data, introText: inner.data };
        }
        let conclusionTextState;
        {
            const inner = Fields.conclusionText.initialize(
                data.conclusionText,
                subcontext,
                subparameters.conclusionText
            );
            conclusionTextState = inner.state;
            data = { ...data, conclusionText: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            types: typesState,
            introText: introTextState,
            conclusionText: conclusionTextState,
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
                    meta={CORE_VALUE_NOTICE_CATEGORY_META}
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
    types: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.types>
    >;
    introText: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.introText>
    >;
    conclusionText: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.conclusionText>
    >;
};
// END MAGIC -- DO NOT EDIT
