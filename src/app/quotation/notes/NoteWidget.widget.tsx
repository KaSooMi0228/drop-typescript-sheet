import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { Link } from "../../../clay/link";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { RemoveButton } from "../../../clay/remove-button";
import { CheckboxWidget } from "../../../clay/widgets/CheckboxWidget";
import { DefaultLinkSetWidget } from "../../../clay/widgets/default-link-set-widget";
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
import { useListItemContext } from "../../../clay/widgets/ListWidget";
import { TextAreaWidget } from "../../../clay/widgets/TextAreaWidget";
import {
    DetailSheet,
    DetailSheetOption,
} from "../../project/detail-sheet/table";
import { Quotation, QuotationOption } from "../table";
import { Note, NOTE_META } from "./table";

export type Data = Note;

const Fields = {
    content: TextAreaWidget,
    include: CheckboxWidget,
    options: DefaultLinkSetWidget<DetailSheetOption | QuotationOption>({
        name: (option) => option.name,
    }),
};

export type ExtraProps = {
    quotation?: Quotation | DetailSheet;
    defaultOptions: Link<QuotationOption>[];
};

function Component(props: Props) {
    const listItemContext = useListItemContext();

    return (
        <tr
            {...listItemContext.draggableProps}
            style={{
                ...listItemContext.draggableProps.style,
                marginBottom: "5px",
                opacity: props.data.include ? undefined : 0.5,
            }}
        >
            <td style={{ width: "1em" }}>{listItemContext.dragHandle}</td>

            <td style={{ width: "1em" }}>
                <widgets.include />
            </td>
            <td style={{ width: "100%" }}>
                <widgets.content />
            </td>

            {props.quotation && (
                <td style={{ width: "21.75em" }}>
                    <div style={{ width: "21.75em" }}>
                        <widgets.options
                            style={{ maxWidth: "5em" }}
                            records={props.quotation.options}
                            default={props.defaultOptions}
                        />
                    </div>
                </td>
            )}
            <td style={{ width: "1em" }}>
                <RemoveButton />
            </td>
        </tr>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.content> &
    WidgetContext<typeof Fields.include> &
    WidgetContext<typeof Fields.options>;
type BaseState = {
    content: WidgetState<typeof Fields.content>;
    include: WidgetState<typeof Fields.include>;
    options: WidgetState<typeof Fields.options>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "CONTENT"; action: WidgetAction<typeof Fields.content> }
    | { type: "INCLUDE"; action: WidgetAction<typeof Fields.include> }
    | { type: "OPTIONS"; action: WidgetAction<typeof Fields.options> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.content, data.content, cache, "content", errors);
    subvalidate(Fields.include, data.include, cache, "include", errors);
    subvalidate(Fields.options, data.options, cache, "options", errors);
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
        case "CONTENT": {
            const inner = Fields.content.reduce(
                state.content,
                data.content,
                action.action,
                subcontext
            );
            return {
                state: { ...state, content: inner.state },
                data: { ...data, content: inner.data },
            };
        }
        case "INCLUDE": {
            const inner = Fields.include.reduce(
                state.include,
                data.include,
                action.action,
                subcontext
            );
            return {
                state: { ...state, include: inner.state },
                data: { ...data, include: inner.data },
            };
        }
        case "OPTIONS": {
            const inner = Fields.options.reduce(
                state.options,
                data.options,
                action.action,
                subcontext
            );
            return {
                state: { ...state, options: inner.state },
                data: { ...data, options: inner.data },
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
    content: function (
        props: WidgetExtraProps<typeof Fields.content> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTENT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "content", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.content.component
                state={context.state.content}
                data={context.data.content}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Content"}
            />
        );
    },
    include: function (
        props: WidgetExtraProps<typeof Fields.include> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "INCLUDE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "include", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.include.component
                state={context.state.include}
                data={context.data.include}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Include"}
            />
        );
    },
    options: function (
        props: WidgetExtraProps<typeof Fields.options> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "OPTIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "options", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.options.component
                state={context.state.options}
                data={context.data.options}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Options"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: NOTE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let contentState;
        {
            const inner = Fields.content.initialize(
                data.content,
                subcontext,
                subparameters.content
            );
            contentState = inner.state;
            data = { ...data, content: inner.data };
        }
        let includeState;
        {
            const inner = Fields.include.initialize(
                data.include,
                subcontext,
                subparameters.include
            );
            includeState = inner.state;
            data = { ...data, include: inner.data };
        }
        let optionsState;
        {
            const inner = Fields.options.initialize(
                data.options,
                subcontext,
                subparameters.options
            );
            optionsState = inner.state;
            data = { ...data, options: inner.data };
        }
        let state = {
            initialParameters: parameters,
            content: contentState,
            include: includeState,
            options: optionsState,
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
                <RecordContext meta={NOTE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    content: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.content>
    >;
    include: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.include>
    >;
    options: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.options>
    >;
};
// END MAGIC -- DO NOT EDIT
