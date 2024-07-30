import * as React from "react";
import { Button } from "react-bootstrap";
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
import { hasPermission } from "../../permissions";
import { RichTextWidget } from "../rich-text-widget";
import { useUser } from "../state";
import { Help, HELP_META } from "./table";

export type Data = Help;

export const Fields = {
    content: RichTextWidget,
};

function Component(props: Props) {
    const user = useUser();

    return (
        <>
            <h1>{props.data.title}</h1>
            <div
                className="ck-content"
                dangerouslySetInnerHTML={{
                    __html: props.data.content,
                }}
            />

            <div>
                {hasPermission(user, "Help", "write") && (
                    <Button
                        onClick={() =>
                            window.open("#/help/edit/" + props.data.id.uuid)
                        }
                    >
                        Edit
                    </Button>
                )}
            </div>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.content>;
type ExtraProps = {};
type BaseState = {
    content: WidgetState<typeof Fields.content>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "CONTENT";
    action: WidgetAction<typeof Fields.content>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.content, data.content, cache, "content", errors);
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: HELP_META,
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
        let state = {
            initialParameters: parameters,
            content: contentState,
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
                <RecordContext meta={HELP_META} value={props.data}>
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
};
// END MAGIC -- DO NOT EDIT
