import { faBan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as React from "react";
import { Button } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { Link } from "../../clay/link";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { StaticDateTimeWidget } from "../../clay/widgets/DateTimeWidget";
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
import { useUser } from "../state";
import { UserLinkWidget } from "../user";
import { User } from "../user/table";
import { UserAndDate, USER_AND_DATE_META } from "./table";

export type Data = UserAndDate;

export type ExtraProps = {
    disableSet?: boolean;
    enableReset?: boolean;
    onSet?: () => void;
    setLabel?: string;
};

export const Fields = {
    date: StaticDateTimeWidget,
    user: UserLinkWidget,
};

function actionActivate(state: State, data: UserAndDate, user: Link<User>) {
    return {
        state,
        data: {
            date: new Date(),
            user,
        },
    };
}

function actionDeactivate(state: State, data: UserAndDate) {
    return {
        state,
        data: {
            date: null,
            user: null,
        },
    };
}

function Component(props: Props) {
    const user = useUser();
    const onSet = React.useCallback(() => {
        props.dispatch({
            type: "ACTIVATE",
            user: user.id,
        });
        if (props.onSet) {
            props.onSet();
        }
    }, [user.id, props.dispatch]);

    const onReset = React.useCallback(() => {
        if (confirm("Are you sure want to reset this date?")) {
            props.dispatch({
                type: "DEACTIVATE",
            });
        }
    }, [user.id, props.dispatch]);

    return (
        <div style={{ display: "flex", maxWidth: "25em" }}>
            {props.data.date === null && props.status.mutable ? (
                !props.disableSet && (
                    <Button style={{ width: "100%" }} onClick={onSet}>
                        {props.setLabel || "Set"}
                    </Button>
                )
            ) : (
                <>
                    <widgets.date />
                    <widgets.user readOnly />
                    {props.enableReset && (
                        <Button onClick={onReset} variant="danger">
                            <FontAwesomeIcon icon={faBan} />
                        </Button>
                    )}
                </>
            )}
        </div>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.date> &
    WidgetContext<typeof Fields.user>;
type BaseState = {
    date: WidgetState<typeof Fields.date>;
    user: WidgetState<typeof Fields.user>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "DATE"; action: WidgetAction<typeof Fields.date> }
    | { type: "USER"; action: WidgetAction<typeof Fields.user> }
    | { type: "ACTIVATE"; user: Link<User> }
    | { type: "DEACTIVATE" };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.date, data.date, cache, "date", errors);
    subvalidate(Fields.user, data.user, cache, "user", errors);
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
        case "DATE": {
            const inner = Fields.date.reduce(
                state.date,
                data.date,
                action.action,
                subcontext
            );
            return {
                state: { ...state, date: inner.state },
                data: { ...data, date: inner.data },
            };
        }
        case "USER": {
            const inner = Fields.user.reduce(
                state.user,
                data.user,
                action.action,
                subcontext
            );
            return {
                state: { ...state, user: inner.state },
                data: { ...data, user: inner.data },
            };
        }
        case "ACTIVATE":
            return actionActivate(state, data, action.user);
        case "DEACTIVATE":
            return actionDeactivate(state, data);
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
    date: function (
        props: WidgetExtraProps<typeof Fields.date> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "DATE", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "date", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.date.component
                state={context.state.date}
                data={context.data.date}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Date"}
            />
        );
    },
    user: function (
        props: WidgetExtraProps<typeof Fields.user> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "USER", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "user", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.user.component
                state={context.state.user}
                data={context.data.user}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "User"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: USER_AND_DATE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let dateState;
        {
            const inner = Fields.date.initialize(
                data.date,
                subcontext,
                subparameters.date
            );
            dateState = inner.state;
            data = { ...data, date: inner.data };
        }
        let userState;
        {
            const inner = Fields.user.initialize(
                data.user,
                subcontext,
                subparameters.user
            );
            userState = inner.state;
            data = { ...data, user: inner.data };
        }
        let state = {
            initialParameters: parameters,
            date: dateState,
            user: userState,
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
                <RecordContext meta={USER_AND_DATE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    date: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.date>
    >;
    user: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.user>
    >;
};
// END MAGIC -- DO NOT EDIT
