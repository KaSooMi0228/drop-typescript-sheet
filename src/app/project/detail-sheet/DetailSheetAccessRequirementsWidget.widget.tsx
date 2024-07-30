import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
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
import { ListWidget } from "../../../clay/widgets/ListWidget";
import { SimpleListWrapper } from "../../../clay/widgets/SimpleListWrapper";
import { TextAreaWidget } from "../../../clay/widgets/TextAreaWidget";
import { DetailSheet, DETAIL_SHEET_META } from "./table";

export type Data = DetailSheet;

const Fields = {
    accessRequirements: ListWidget(SimpleListWrapper(TextAreaWidget), {
        emptyOk: true,
    }),
    requiredEquipment: ListWidget(SimpleListWrapper(TextAreaWidget), {
        emptyOk: true,
    }),
};

function Component(props: Props) {
    return (
        <>
            <FormWrapper label="Access Requirements">
                <table>
                    <widgets.accessRequirements extraItemForAdd />
                </table>
            </FormWrapper>
            <FormWrapper label="Required Equipment">
                <table>
                    <widgets.requiredEquipment extraItemForAdd />
                </table>
            </FormWrapper>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.accessRequirements> &
    WidgetContext<typeof Fields.requiredEquipment>;
type ExtraProps = {};
type BaseState = {
    accessRequirements: WidgetState<typeof Fields.accessRequirements>;
    requiredEquipment: WidgetState<typeof Fields.requiredEquipment>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "ACCESS_REQUIREMENTS";
          action: WidgetAction<typeof Fields.accessRequirements>;
      }
    | {
          type: "REQUIRED_EQUIPMENT";
          action: WidgetAction<typeof Fields.requiredEquipment>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.accessRequirements,
        data.accessRequirements,
        cache,
        "accessRequirements",
        errors
    );
    subvalidate(
        Fields.requiredEquipment,
        data.requiredEquipment,
        cache,
        "requiredEquipment",
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
        case "ACCESS_REQUIREMENTS": {
            const inner = Fields.accessRequirements.reduce(
                state.accessRequirements,
                data.accessRequirements,
                action.action,
                subcontext
            );
            return {
                state: { ...state, accessRequirements: inner.state },
                data: { ...data, accessRequirements: inner.data },
            };
        }
        case "REQUIRED_EQUIPMENT": {
            const inner = Fields.requiredEquipment.reduce(
                state.requiredEquipment,
                data.requiredEquipment,
                action.action,
                subcontext
            );
            return {
                state: { ...state, requiredEquipment: inner.state },
                data: { ...data, requiredEquipment: inner.data },
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
    accessRequirements: function (
        props: WidgetExtraProps<typeof Fields.accessRequirements> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ACCESS_REQUIREMENTS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "accessRequirements",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.accessRequirements.component
                state={context.state.accessRequirements}
                data={context.data.accessRequirements}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Access Requirements"}
            />
        );
    },
    requiredEquipment: function (
        props: WidgetExtraProps<typeof Fields.requiredEquipment> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "REQUIRED_EQUIPMENT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "requiredEquipment",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.requiredEquipment.component
                state={context.state.requiredEquipment}
                data={context.data.requiredEquipment}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Required Equipment"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: DETAIL_SHEET_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let accessRequirementsState;
        {
            const inner = Fields.accessRequirements.initialize(
                data.accessRequirements,
                subcontext,
                subparameters.accessRequirements
            );
            accessRequirementsState = inner.state;
            data = { ...data, accessRequirements: inner.data };
        }
        let requiredEquipmentState;
        {
            const inner = Fields.requiredEquipment.initialize(
                data.requiredEquipment,
                subcontext,
                subparameters.requiredEquipment
            );
            requiredEquipmentState = inner.state;
            data = { ...data, requiredEquipment: inner.data };
        }
        let state = {
            initialParameters: parameters,
            accessRequirements: accessRequirementsState,
            requiredEquipment: requiredEquipmentState,
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
                <RecordContext meta={DETAIL_SHEET_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    accessRequirements: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.accessRequirements>
    >;
    requiredEquipment: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.requiredEquipment>
    >;
};
// END MAGIC -- DO NOT EDIT
