import * as React from "react";
import { Dictionary } from "../../clay/common";
import { longDate } from "../../clay/LocalDate";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickCache } from "../../clay/quick-cache";
import { DateWidget } from "../../clay/widgets/DateWidget";
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
import UserAndDateWidget from "../user-and-date/UserAndDateWidget.widget";
import { USER_META } from "../user/table";
import { ProjectPauseRecord, PROJECT_PAUSE_RECORD_META } from "./table";

export type Data = ProjectPauseRecord;

const Fields = {
    date: Optional(DateWidget),
    confirmed: Optional(UserAndDateWidget),
};

function Component(props: Props) {
    const cache = useQuickCache();
    return (
        <tr>
            <th>Project Paused</th>
            <td>{cache.get(USER_META, props.data.user)?.name}</td>
            <td>{longDate(props.data.addedDateTime)}</td>
            <td>{longDate(props.data.date!.asDate())}</td>
            <td>
                <widgets.confirmed />
            </td>
        </tr>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.date> &
    WidgetContext<typeof Fields.confirmed>;
type ExtraProps = {};
type BaseState = {
    date: WidgetState<typeof Fields.date>;
    confirmed: WidgetState<typeof Fields.confirmed>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "DATE"; action: WidgetAction<typeof Fields.date> }
    | { type: "CONFIRMED"; action: WidgetAction<typeof Fields.confirmed> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.date, data.date, cache, "date", errors);
    subvalidate(Fields.confirmed, data.confirmed, cache, "confirmed", errors);
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
        case "CONFIRMED": {
            const inner = Fields.confirmed.reduce(
                state.confirmed,
                data.confirmed,
                action.action,
                subcontext
            );
            return {
                state: { ...state, confirmed: inner.state },
                data: { ...data, confirmed: inner.data },
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
    confirmed: function (
        props: WidgetExtraProps<typeof Fields.confirmed> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONFIRMED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "confirmed", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.confirmed.component
                state={context.state.confirmed}
                data={context.data.confirmed}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Confirmed"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PROJECT_PAUSE_RECORD_META,
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
        let confirmedState;
        {
            const inner = Fields.confirmed.initialize(
                data.confirmed,
                subcontext,
                subparameters.confirmed
            );
            confirmedState = inner.state;
            data = { ...data, confirmed: inner.data };
        }
        let state = {
            initialParameters: parameters,
            date: dateState,
            confirmed: confirmedState,
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
                    meta={PROJECT_PAUSE_RECORD_META}
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
    date: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.date>
    >;
    confirmed: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.confirmed>
    >;
};
// END MAGIC -- DO NOT EDIT
