import React from "react";
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
import { StaticListWidget } from "../../clay/widgets/StaticListWidget";
import ProjectDescriptionDetailWidget from "../project/projectDescriptionDetail/ProjectDescriptionDetailWidget.widget";
import ScheduleDescriptionWidget from "./ScheduleDescriptionWidget.widget";
import { QuotationOption, QUOTATION_OPTION_META } from "./table";

export type Data = QuotationOption;

const Fields = {
    projectDescription: ProjectDescriptionDetailWidget,
    schedules: StaticListWidget(ScheduleDescriptionWidget),
};

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);
    if (data.schedules.length > 0) {
        return errors.filter((error) => error.field !== "projectDescription");
    }
    return errors;
}

function Component(props: Props) {
    if (props.data.schedules.length > 0) {
        return <widgets.schedules itemProps={{ option: props.data }} />;
    } else {
        return (
            <tr>
                <td>{props.data.name}</td>
                <td></td>
                <widgets.projectDescription />
            </tr>
        );
    }
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.projectDescription> &
    WidgetContext<typeof Fields.schedules>;
type ExtraProps = {};
type BaseState = {
    projectDescription: WidgetState<typeof Fields.projectDescription>;
    schedules: WidgetState<typeof Fields.schedules>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "PROJECT_DESCRIPTION";
          action: WidgetAction<typeof Fields.projectDescription>;
      }
    | { type: "SCHEDULES"; action: WidgetAction<typeof Fields.schedules> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.projectDescription,
        data.projectDescription,
        cache,
        "projectDescription",
        errors
    );
    subvalidate(Fields.schedules, data.schedules, cache, "schedules", errors);
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
        case "PROJECT_DESCRIPTION": {
            const inner = Fields.projectDescription.reduce(
                state.projectDescription,
                data.projectDescription,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectDescription: inner.state },
                data: { ...data, projectDescription: inner.data },
            };
        }
        case "SCHEDULES": {
            const inner = Fields.schedules.reduce(
                state.schedules,
                data.schedules,
                action.action,
                subcontext
            );
            return {
                state: { ...state, schedules: inner.state },
                data: { ...data, schedules: inner.data },
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
    projectDescription: function (
        props: WidgetExtraProps<typeof Fields.projectDescription> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_DESCRIPTION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "projectDescription",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectDescription.component
                state={context.state.projectDescription}
                data={context.data.projectDescription}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Description"}
            />
        );
    },
    schedules: function (
        props: WidgetExtraProps<typeof Fields.schedules> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SCHEDULES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "schedules", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.schedules.component
                state={context.state.schedules}
                data={context.data.schedules}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Schedules"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: QUOTATION_OPTION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let projectDescriptionState;
        {
            const inner = Fields.projectDescription.initialize(
                data.projectDescription,
                subcontext,
                subparameters.projectDescription
            );
            projectDescriptionState = inner.state;
            data = { ...data, projectDescription: inner.data };
        }
        let schedulesState;
        {
            const inner = Fields.schedules.initialize(
                data.schedules,
                subcontext,
                subparameters.schedules
            );
            schedulesState = inner.state;
            data = { ...data, schedules: inner.data };
        }
        let state = {
            initialParameters: parameters,
            projectDescription: projectDescriptionState,
            schedules: schedulesState,
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
                <RecordContext meta={QUOTATION_OPTION_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    projectDescription: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectDescription>
    >;
    schedules: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.schedules>
    >;
};
// END MAGIC -- DO NOT EDIT
