import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { RemoveButton } from "../../clay/remove-button";
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
import { useListItemContext } from "../../clay/widgets/ListWidget";
import { PhoneWidget } from "../../clay/widgets/phone";
import { SelectWidget } from "../../clay/widgets/SelectWidget";
import { ContactPhone, CONTACT_PHONE_META } from "./table";

export type Data = ContactPhone;

export const Fields = {
    type: SelectWidget([
        {
            value: "home",
            label: "Home",
        },
        {
            value: "cell",
            label: "Cell",
        },
        {
            value: "office",
            label: "Office",
        },
        {
            value: "direct",
            label: "Direct",
        },
        {
            value: "fax",
            label: "Fax",
        },
        {
            value: "other",
            label: "Other",
        },
    ]),
    number: PhoneWidget,
};

function Component(props: Props) {
    const listItemContext = useListItemContext();

    return (
        <tr {...listItemContext.draggableProps}>
            <td>{listItemContext.dragHandle}</td>
            <td
                style={{
                    width: "7.5em",
                }}
            >
                <widgets.type />
            </td>
            <td>
                <widgets.number />
            </td>
            <td>
                <RemoveButton />
            </td>
        </tr>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.type> &
    WidgetContext<typeof Fields.number>;
type ExtraProps = {};
type BaseState = {
    type: WidgetState<typeof Fields.type>;
    number: WidgetState<typeof Fields.number>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "TYPE"; action: WidgetAction<typeof Fields.type> }
    | { type: "NUMBER"; action: WidgetAction<typeof Fields.number> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.type, data.type, cache, "type", errors);
    subvalidate(Fields.number, data.number, cache, "number", errors);
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
        case "NUMBER": {
            const inner = Fields.number.reduce(
                state.number,
                data.number,
                action.action,
                subcontext
            );
            return {
                state: { ...state, number: inner.state },
                data: { ...data, number: inner.data },
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
    number: function (
        props: WidgetExtraProps<typeof Fields.number> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "NUMBER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "number", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.number.component
                state={context.state.number}
                data={context.data.number}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Number"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: CONTACT_PHONE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
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
        let numberState;
        {
            const inner = Fields.number.initialize(
                data.number,
                subcontext,
                subparameters.number
            );
            numberState = inner.state;
            data = { ...data, number: inner.data };
        }
        let state = {
            initialParameters: parameters,
            type: typeState,
            number: numberState,
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
                <RecordContext meta={CONTACT_PHONE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    type: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.type>
    >;
    number: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.number>
    >;
};
// END MAGIC -- DO NOT EDIT
