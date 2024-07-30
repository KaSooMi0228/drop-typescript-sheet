import * as React from "react";
import { Dictionary } from "../../clay/common";
import { PageContext } from "../../clay/Page";
import { PaginatedWidget } from "../../clay/paginated-widget";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { SaveButton } from "../../clay/save-button";
import { StaticDateTimeWidget } from "../../clay/widgets/DateTimeWidget";
import { FormField } from "../../clay/widgets/FormField";
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
import { Project, PROJECT_META } from "./table";

export type Data = Project;

export const Fields = {
    finishScheduleNotRequiredDate: FormField(StaticDateTimeWidget),
    finishScheduleNotRequired: FormField(TextWidget),
};

function Component(props: Props) {
    const onSave = React.useCallback(() => {
        props.dispatch({
            type: "FINISH_SCHEDULE_NOT_REQUIRED_DATE",
            action: {
                type: "SET",
                value: new Date(),
            },
        });
    }, [props.dispatch]);

    return (
        <>
            <widgets.finishScheduleNotRequiredDate />
            <widgets.finishScheduleNotRequired label="Reason" />
            <SaveButton
                label="Save"
                preSave={onSave}
                disabled={props.status.validation.length > 0}
            />
        </>
    );
}

export const FinishScheduleSkipWidget = PaginatedWidget<Project, PageContext>({
    dataMeta: PROJECT_META,
    pages() {
        return [
            {
                id: "main",
                title: "Main",
                widget: Widget,
            },
        ];
    },
});

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.finishScheduleNotRequiredDate> &
    WidgetContext<typeof Fields.finishScheduleNotRequired>;
type ExtraProps = {};
type BaseState = {
    finishScheduleNotRequiredDate: WidgetState<
        typeof Fields.finishScheduleNotRequiredDate
    >;
    finishScheduleNotRequired: WidgetState<
        typeof Fields.finishScheduleNotRequired
    >;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "FINISH_SCHEDULE_NOT_REQUIRED_DATE";
          action: WidgetAction<typeof Fields.finishScheduleNotRequiredDate>;
      }
    | {
          type: "FINISH_SCHEDULE_NOT_REQUIRED";
          action: WidgetAction<typeof Fields.finishScheduleNotRequired>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.finishScheduleNotRequiredDate,
        data.finishScheduleNotRequiredDate,
        cache,
        "finishScheduleNotRequiredDate",
        errors
    );
    subvalidate(
        Fields.finishScheduleNotRequired,
        data.finishScheduleNotRequired,
        cache,
        "finishScheduleNotRequired",
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
        case "FINISH_SCHEDULE_NOT_REQUIRED_DATE": {
            const inner = Fields.finishScheduleNotRequiredDate.reduce(
                state.finishScheduleNotRequiredDate,
                data.finishScheduleNotRequiredDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, finishScheduleNotRequiredDate: inner.state },
                data: { ...data, finishScheduleNotRequiredDate: inner.data },
            };
        }
        case "FINISH_SCHEDULE_NOT_REQUIRED": {
            const inner = Fields.finishScheduleNotRequired.reduce(
                state.finishScheduleNotRequired,
                data.finishScheduleNotRequired,
                action.action,
                subcontext
            );
            return {
                state: { ...state, finishScheduleNotRequired: inner.state },
                data: { ...data, finishScheduleNotRequired: inner.data },
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
    finishScheduleNotRequiredDate: function (
        props: WidgetExtraProps<typeof Fields.finishScheduleNotRequiredDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "FINISH_SCHEDULE_NOT_REQUIRED_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "finishScheduleNotRequiredDate",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.finishScheduleNotRequiredDate.component
                state={context.state.finishScheduleNotRequiredDate}
                data={context.data.finishScheduleNotRequiredDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Finish Schedule Not Required Date"}
            />
        );
    },
    finishScheduleNotRequired: function (
        props: WidgetExtraProps<typeof Fields.finishScheduleNotRequired> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "FINISH_SCHEDULE_NOT_REQUIRED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "finishScheduleNotRequired",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.finishScheduleNotRequired.component
                state={context.state.finishScheduleNotRequired}
                data={context.data.finishScheduleNotRequired}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Finish Schedule Not Required"}
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
        let finishScheduleNotRequiredDateState;
        {
            const inner = Fields.finishScheduleNotRequiredDate.initialize(
                data.finishScheduleNotRequiredDate,
                subcontext,
                subparameters.finishScheduleNotRequiredDate
            );
            finishScheduleNotRequiredDateState = inner.state;
            data = { ...data, finishScheduleNotRequiredDate: inner.data };
        }
        let finishScheduleNotRequiredState;
        {
            const inner = Fields.finishScheduleNotRequired.initialize(
                data.finishScheduleNotRequired,
                subcontext,
                subparameters.finishScheduleNotRequired
            );
            finishScheduleNotRequiredState = inner.state;
            data = { ...data, finishScheduleNotRequired: inner.data };
        }
        let state = {
            initialParameters: parameters,
            finishScheduleNotRequiredDate: finishScheduleNotRequiredDateState,
            finishScheduleNotRequired: finishScheduleNotRequiredState,
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
    finishScheduleNotRequiredDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.finishScheduleNotRequiredDate>
    >;
    finishScheduleNotRequired: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.finishScheduleNotRequired>
    >;
};
// END MAGIC -- DO NOT EDIT
