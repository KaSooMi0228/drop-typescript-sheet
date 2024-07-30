import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../../clay/quick-cache";
import { Optional } from "../../../clay/widgets/FormField";
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
import { BaseTableRow } from "../../../clay/widgets/TableRow";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { ApplicationTypeLinkWidget } from "../../estimate/types";
import {
    APPLICATION_TYPE_META,
    APPLICATION_TYPE_OPTION_META,
} from "../../estimate/types/table";
import {
    DetailSheetFinishSchedule,
    DETAIL_SHEET_FINISH_SCHEDULE_META,
} from "./table";

export type Data = DetailSheetFinishSchedule;

function reduce(
    state: State,
    data: Data,
    action: BaseAction,
    context: Context
): WidgetResult<State, Data> {
    switch (action.type) {
        case "APPLICATION_TYPE": {
            switch (action.action.type) {
                case "SET":
                    if (!action.action.value) {
                        return {
                            state,
                            data: {
                                ...data,
                                applicationType: null,
                                application: null,
                            },
                        };
                    } else {
                        return {
                            state,
                            data: {
                                ...data,
                                applicationType: action.action.value.id.uuid,
                                application: action.action.value.default,
                            },
                        };
                    }
            }
        }
        default:
            return baseReduce(state, data, action, context);
    }
}

const Fields = {
    name: TextWidget,
    finishSchedule: TextWidget,
    applicationType: ApplicationTypeLinkWidget,
    application: SelectLinkWidget({
        meta: APPLICATION_TYPE_OPTION_META,
        label: (option) => option.name,
    }),
    colour: Optional(TextWidget),
};

function Component(props: Props) {
    const applicationType = useQuickRecord(
        APPLICATION_TYPE_META,
        props.data.applicationType
    );
    return (
        <BaseTableRow>
            <td>
                <widgets.name />
            </td>
            <td>
                <widgets.finishSchedule />
            </td>
            <td style={{ width: "7.5em" }}>
                <widgets.applicationType />
            </td>
            <td style={{ width: "15em" }}>
                <widgets.application records={applicationType?.options || []} />
            </td>
            <td>
                <widgets.colour />
            </td>
        </BaseTableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.finishSchedule> &
    WidgetContext<typeof Fields.applicationType> &
    WidgetContext<typeof Fields.application> &
    WidgetContext<typeof Fields.colour>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    finishSchedule: WidgetState<typeof Fields.finishSchedule>;
    applicationType: WidgetState<typeof Fields.applicationType>;
    application: WidgetState<typeof Fields.application>;
    colour: WidgetState<typeof Fields.colour>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | {
          type: "FINISH_SCHEDULE";
          action: WidgetAction<typeof Fields.finishSchedule>;
      }
    | {
          type: "APPLICATION_TYPE";
          action: WidgetAction<typeof Fields.applicationType>;
      }
    | { type: "APPLICATION"; action: WidgetAction<typeof Fields.application> }
    | { type: "COLOUR"; action: WidgetAction<typeof Fields.colour> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(
        Fields.finishSchedule,
        data.finishSchedule,
        cache,
        "finishSchedule",
        errors
    );
    subvalidate(
        Fields.applicationType,
        data.applicationType,
        cache,
        "applicationType",
        errors
    );
    subvalidate(
        Fields.application,
        data.application,
        cache,
        "application",
        errors
    );
    subvalidate(Fields.colour, data.colour, cache, "colour", errors);
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
        case "FINISH_SCHEDULE": {
            const inner = Fields.finishSchedule.reduce(
                state.finishSchedule,
                data.finishSchedule,
                action.action,
                subcontext
            );
            return {
                state: { ...state, finishSchedule: inner.state },
                data: { ...data, finishSchedule: inner.data },
            };
        }
        case "APPLICATION_TYPE": {
            const inner = Fields.applicationType.reduce(
                state.applicationType,
                data.applicationType,
                action.action,
                subcontext
            );
            return {
                state: { ...state, applicationType: inner.state },
                data: { ...data, applicationType: inner.data },
            };
        }
        case "APPLICATION": {
            const inner = Fields.application.reduce(
                state.application,
                data.application,
                action.action,
                subcontext
            );
            return {
                state: { ...state, application: inner.state },
                data: { ...data, application: inner.data },
            };
        }
        case "COLOUR": {
            const inner = Fields.colour.reduce(
                state.colour,
                data.colour,
                action.action,
                subcontext
            );
            return {
                state: { ...state, colour: inner.state },
                data: { ...data, colour: inner.data },
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
    finishSchedule: function (
        props: WidgetExtraProps<typeof Fields.finishSchedule> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "FINISH_SCHEDULE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "finishSchedule", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.finishSchedule.component
                state={context.state.finishSchedule}
                data={context.data.finishSchedule}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Finish Schedule"}
            />
        );
    },
    applicationType: function (
        props: WidgetExtraProps<typeof Fields.applicationType> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "APPLICATION_TYPE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "applicationType", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.applicationType.component
                state={context.state.applicationType}
                data={context.data.applicationType}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Application Type"}
            />
        );
    },
    application: function (
        props: WidgetExtraProps<typeof Fields.application> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "APPLICATION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "application", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.application.component
                state={context.state.application}
                data={context.data.application}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Application"}
            />
        );
    },
    colour: function (
        props: WidgetExtraProps<typeof Fields.colour> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COLOUR",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "colour", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.colour.component
                state={context.state.colour}
                data={context.data.colour}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Colour"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: DETAIL_SHEET_FINISH_SCHEDULE_META,
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
        let finishScheduleState;
        {
            const inner = Fields.finishSchedule.initialize(
                data.finishSchedule,
                subcontext,
                subparameters.finishSchedule
            );
            finishScheduleState = inner.state;
            data = { ...data, finishSchedule: inner.data };
        }
        let applicationTypeState;
        {
            const inner = Fields.applicationType.initialize(
                data.applicationType,
                subcontext,
                subparameters.applicationType
            );
            applicationTypeState = inner.state;
            data = { ...data, applicationType: inner.data };
        }
        let applicationState;
        {
            const inner = Fields.application.initialize(
                data.application,
                subcontext,
                subparameters.application
            );
            applicationState = inner.state;
            data = { ...data, application: inner.data };
        }
        let colourState;
        {
            const inner = Fields.colour.initialize(
                data.colour,
                subcontext,
                subparameters.colour
            );
            colourState = inner.state;
            data = { ...data, colour: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            finishSchedule: finishScheduleState,
            applicationType: applicationTypeState,
            application: applicationState,
            colour: colourState,
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
                    meta={DETAIL_SHEET_FINISH_SCHEDULE_META}
                    value={props.data}
                >
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
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
    finishSchedule: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.finishSchedule>
    >;
    applicationType: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.applicationType>
    >;
    application: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.application>
    >;
    colour: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.colour>
    >;
};
// END MAGIC -- DO NOT EDIT
