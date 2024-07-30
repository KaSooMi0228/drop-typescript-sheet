import { find } from "lodash";
import * as React from "react";
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
import { TabsWidget } from "../../clay/widgets/TabsWidget";
import QuotationOptionWidget from "./QuotationOptionWidget.widget";
import { resolveOption } from "./resolve-option";
import {
    doesScheduleHaveAction,
    doesScheduleHaveAllowance,
    Quotation,
    QUOTATION_META,
} from "./table";

export type Data = Quotation;

const Fields = {
    options: TabsWidget(QuotationOptionWidget, {
        namePrompt: "Name for new option?",
    }),
};

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);

    for (const option of data.options) {
        if (option.schedules.length > 0) {
            const resolvedOption = resolveOption(cache, data, option);
            for (const action of resolvedOption.activeActions) {
                if (
                    !find(option.schedules, (schedule) =>
                        doesScheduleHaveAction(schedule, action.id.uuid)
                    )
                ) {
                    errors.push({
                        empty: true,
                        invalid: false,
                    });
                }
            }
            for (const allowance of resolvedOption.activeAllowances) {
                if (
                    !find(option.schedules, (schedule) =>
                        doesScheduleHaveAllowance(schedule, allowance.id.uuid)
                    )
                ) {
                    errors.push({
                        empty: true,
                        invalid: false,
                    });
                }
            }
        }
    }
    return errors;
}

function Component(props: Props) {
    const actions = React.useCallback(
        (option, index) => {
            return [
                {
                    label: "Duplicate",
                    action: () => {
                        const name = prompt(
                            "Name for new option?",
                            option.name
                        );
                        if (name != null) {
                            props.dispatch({
                                type: "OPTIONS" as const,
                                action: {
                                    index,
                                    type: "DUPLICATE",
                                    action: {
                                        type: "NAME" as const,
                                        action: {
                                            type: "SET" as const,
                                            value: name,
                                        },
                                    },
                                },
                            });
                        }
                    },
                },
                {
                    label: "Rename",
                    action: () => {
                        const name = prompt("Option Name?", option.name);
                        if (name != null) {
                            props.dispatch({
                                type: "OPTIONS" as const,
                                action: {
                                    index,
                                    type: "ITEM",
                                    action: {
                                        type: "NAME" as const,
                                        action: {
                                            type: "SET" as const,
                                            value: name,
                                        },
                                    },
                                },
                            });
                        }
                    },
                },
                {
                    label: "Remove",
                    action: () => {
                        if (
                            confirm(
                                "Are you sure you want to delete this option?"
                            )
                        ) {
                            props.dispatch({
                                type: "OPTIONS" as const,
                                action: {
                                    index,
                                    type: "REMOVE",
                                },
                            });
                        }
                    },
                },
            ];
        },
        [props.dispatch]
    );

    return (
        <>
            <widgets.options
                newLabel="New Option"
                labelForItem={(item) => item.name}
                actions={actions}
            />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.options>;
type ExtraProps = {};
type BaseState = {
    options: WidgetState<typeof Fields.options>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "OPTIONS";
    action: WidgetAction<typeof Fields.options>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
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
    dataMeta: QUOTATION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
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
            options: optionsState,
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
                <RecordContext meta={QUOTATION_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    options: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.options>
    >;
};
// END MAGIC -- DO NOT EDIT
