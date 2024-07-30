import * as React from "react";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { SaveButton } from "../../clay/save-button";
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
import { PercentageWidget } from "../../clay/widgets/percentage-widget";
import { General, GENERAL_META } from "./table";

export type Data = General;

const Fields = {
    aCfBonusPercentage: FormField(PercentageWidget),
};

function Component(props: Props) {
    return (
        <>
            <widgets.aCfBonusPercentage label='"A" CF Bonus Percentage' />
            <SaveButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.aCfBonusPercentage>;
type ExtraProps = {};
type BaseState = {
    aCfBonusPercentage: WidgetState<typeof Fields.aCfBonusPercentage>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "A_CF_BONUS_PERCENTAGE";
    action: WidgetAction<typeof Fields.aCfBonusPercentage>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.aCfBonusPercentage,
        data.aCfBonusPercentage,
        cache,
        "aCfBonusPercentage",
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
        case "A_CF_BONUS_PERCENTAGE": {
            const inner = Fields.aCfBonusPercentage.reduce(
                state.aCfBonusPercentage,
                data.aCfBonusPercentage,
                action.action,
                subcontext
            );
            return {
                state: { ...state, aCfBonusPercentage: inner.state },
                data: { ...data, aCfBonusPercentage: inner.data },
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
    aCfBonusPercentage: function (
        props: WidgetExtraProps<typeof Fields.aCfBonusPercentage> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "A_CF_BONUS_PERCENTAGE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "aCfBonusPercentage",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.aCfBonusPercentage.component
                state={context.state.aCfBonusPercentage}
                data={context.data.aCfBonusPercentage}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "A Cf Bonus Percentage"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: GENERAL_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let aCfBonusPercentageState;
        {
            const inner = Fields.aCfBonusPercentage.initialize(
                data.aCfBonusPercentage,
                subcontext,
                subparameters.aCfBonusPercentage
            );
            aCfBonusPercentageState = inner.state;
            data = { ...data, aCfBonusPercentage: inner.data };
        }
        let state = {
            initialParameters: parameters,
            aCfBonusPercentage: aCfBonusPercentageState,
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
                <RecordContext meta={GENERAL_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    aCfBonusPercentage: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.aCfBonusPercentage>
    >;
};
// END MAGIC -- DO NOT EDIT
