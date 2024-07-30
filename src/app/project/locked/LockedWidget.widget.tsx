import * as React from "react";
import { Badge } from "react-bootstrap";
import { Dictionary } from "../../../clay/common";
import { Link } from "../../../clay/link";
import { LocalDate } from "../../../clay/LocalDate";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../../clay/quick-cache";
import { RemoveButton } from "../../../clay/remove-button";
import { FormWrapper } from "../../../clay/widgets/FormField";
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
import { hasPermission } from "../../../permissions";
import { RichTextWidget } from "../../rich-text-widget";
import { useUser } from "../../state";
import { User, USER_META } from "../../user/table";
import { Locked, LOCKED_META } from "./table";

export type Data = Locked;

export const Fields = {
    value: RichTextWidget,
};

type ExtraContext = {
    currentUserId: Link<User>;
};

function Component(props: Props) {
    let user = useUser();
    const lockedUser = useQuickRecord(USER_META, props.data.user);

    const canChange =
        user.id === props.data.user ||
        props.data.user === null ||
        hasPermission(user, "Project", "override-locked");

    const listItemContext = useListItemContext();

    return (
        <div {...listItemContext.draggableProps}>
            <FormWrapper
                label={
                    <>
                        {props.label}{" "}
                        {props.data.user && (
                            <Badge
                                variant="info"
                                style={{
                                    fontSize: "8pt",
                                }}
                            >
                                {lockedUser && lockedUser.name}{" "}
                                {props.data.date && props.data.date.toString()}
                            </Badge>
                        )}
                    </>
                }
            >
                <div style={{ display: "flex" }}>
                    <div style={{ display: "none" }}>
                        {listItemContext.dragHandle}
                    </div>
                    <div style={{ flexGrow: 1 }}>
                        <widgets.value readOnly={!canChange} />
                    </div>
                    {canChange && <RemoveButton />}
                </div>
            </FormWrapper>
        </div>
    );
}

export function reduce(
    state: State,
    data: Data,
    action: BaseAction,
    context: Context
) {
    const inner = baseReduce(state, data, action, context);
    switch (action.type) {
        case "VALUE":
            return {
                state: inner.state,
                data: {
                    ...inner.data,
                    user: context.currentUserId,
                    date: new LocalDate(new Date()),
                },
            };
        default:
            return inner;
    }
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.value> & ExtraContext;
type ExtraProps = {};
type BaseState = {
    value: WidgetState<typeof Fields.value>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = { type: "VALUE"; action: WidgetAction<typeof Fields.value> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.value, data.value, cache, "value", errors);
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
        case "VALUE": {
            const inner = Fields.value.reduce(
                state.value,
                data.value,
                action.action,
                subcontext
            );
            return {
                state: { ...state, value: inner.state },
                data: { ...data, value: inner.data },
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
    value: function (
        props: WidgetExtraProps<typeof Fields.value> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "VALUE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "value", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.value.component
                state={context.state.value}
                data={context.data.value}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Value"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: LOCKED_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let valueState;
        {
            const inner = Fields.value.initialize(
                data.value,
                subcontext,
                subparameters.value
            );
            valueState = inner.state;
            data = { ...data, value: inner.data };
        }
        let state = {
            initialParameters: parameters,
            value: valueState,
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
                <RecordContext meta={LOCKED_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
};
export default Widget;
type Widgets = {
    value: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.value>
    >;
};
// END MAGIC -- DO NOT EDIT
