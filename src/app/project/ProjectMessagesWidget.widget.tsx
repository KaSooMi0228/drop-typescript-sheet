import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as React from "react";
import { Button, ListGroup, ListGroupItem } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
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
import { TextWidget } from "../../clay/widgets/TextWidget";
import { NEW_THREAD_SOURCE } from "../inbox/NewThreadWidget.widget";
import { OLD_THREAD_SOURCE } from "../inbox/OldThreadWidget.widget";
import { useItems } from "../inbox/threads";
import { ITEM_TYPE } from "../inbox/types";
import { CONTENT_AREA } from "../styles";
import { Project, PROJECT_META } from "./table";

export type Data = Project;

export const Fields = {
    name: Optional(TextWidget),
};

function Component(props: Props) {
    const [openItem, setOpenItem] = React.useState<ITEM_TYPE | null>(null);

    const items = useItems(props.data.id);

    const onNewThread = React.useCallback(() => {
        setOpenItem({
            type: "new-thread",
            id: "",
        });
    }, [setOpenItem]);

    const CurrentComponent =
        openItem &&
        (openItem.type === "thread"
            ? OLD_THREAD_SOURCE.Component
            : NEW_THREAD_SOURCE.Component);

    return (
        <div
            style={{
                display: "flex",
                flexGrow: 1,
                borderTop: "black solid 1px",
                overflowY: "auto",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    borderRight: "solid gray .5px",
                    justifyContent: "space-between",
                    flexGrow: 1,
                }}
            >
                <div {...CONTENT_AREA}>
                    <ListGroup>
                        {items.map((item, index) => (
                            <ListGroupItem
                                key={item.id}
                                onClick={() =>
                                    setOpenItem({
                                        type: item.type,
                                        id: item.id,
                                    })
                                }
                                active={
                                    (openItem &&
                                        openItem.type == item.type &&
                                        openItem.id === item.id) ||
                                    false
                                }
                            >
                                <FontAwesomeIcon icon={item.icon} />{" "}
                                {item.label}
                            </ListGroupItem>
                        ))}
                    </ListGroup>
                </div>
                <Button onClick={onNewThread}>New Thread</Button>
            </div>
            {openItem && CurrentComponent && (
                <div {...CONTENT_AREA}>
                    <CurrentComponent
                        id={openItem.id}
                        key={openItem.id}
                        setOpenItem={setOpenItem}
                        project={props.data.id}
                    />
                </div>
            )}
        </div>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = { type: "NAME"; action: WidgetAction<typeof Fields.name> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PROJECT_META,
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
        let state = {
            initialParameters: parameters,
            name: nameState,
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
                <RecordContext meta={PROJECT_META} value={props.data}>
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
};
// END MAGIC -- DO NOT EDIT
