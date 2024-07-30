import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { CheckboxWidget } from "../../../clay/widgets/CheckboxWidget";
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
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { LandingLikelihoodLinkWidget } from "../../project/pending-quote-history";
import { QuotationType, QUOTATION_TYPE_META } from "./table";

export type Data = QuotationType;

export const Fields = {
    name: TextWidget,
    print: CheckboxWidget,
    defaultLandingLikelihood: LandingLikelihoodLinkWidget,
};

function Component(props: Props): React.Component {
    throw new Error("not supported");
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.print> &
    WidgetContext<typeof Fields.defaultLandingLikelihood>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    print: WidgetState<typeof Fields.print>;
    defaultLandingLikelihood: WidgetState<
        typeof Fields.defaultLandingLikelihood
    >;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "PRINT"; action: WidgetAction<typeof Fields.print> }
    | {
          type: "DEFAULT_LANDING_LIKELIHOOD";
          action: WidgetAction<typeof Fields.defaultLandingLikelihood>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.print, data.print, cache, "print", errors);
    subvalidate(
        Fields.defaultLandingLikelihood,
        data.defaultLandingLikelihood,
        cache,
        "defaultLandingLikelihood",
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
        case "PRINT": {
            const inner = Fields.print.reduce(
                state.print,
                data.print,
                action.action,
                subcontext
            );
            return {
                state: { ...state, print: inner.state },
                data: { ...data, print: inner.data },
            };
        }
        case "DEFAULT_LANDING_LIKELIHOOD": {
            const inner = Fields.defaultLandingLikelihood.reduce(
                state.defaultLandingLikelihood,
                data.defaultLandingLikelihood,
                action.action,
                subcontext
            );
            return {
                state: { ...state, defaultLandingLikelihood: inner.state },
                data: { ...data, defaultLandingLikelihood: inner.data },
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
    print: function (
        props: WidgetExtraProps<typeof Fields.print> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "PRINT", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "print", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.print.component
                state={context.state.print}
                data={context.data.print}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Print"}
            />
        );
    },
    defaultLandingLikelihood: function (
        props: WidgetExtraProps<typeof Fields.defaultLandingLikelihood> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DEFAULT_LANDING_LIKELIHOOD",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "defaultLandingLikelihood",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.defaultLandingLikelihood.component
                state={context.state.defaultLandingLikelihood}
                data={context.data.defaultLandingLikelihood}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Default Landing Likelihood"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: QUOTATION_TYPE_META,
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
        let printState;
        {
            const inner = Fields.print.initialize(
                data.print,
                subcontext,
                subparameters.print
            );
            printState = inner.state;
            data = { ...data, print: inner.data };
        }
        let defaultLandingLikelihoodState;
        {
            const inner = Fields.defaultLandingLikelihood.initialize(
                data.defaultLandingLikelihood,
                subcontext,
                subparameters.defaultLandingLikelihood
            );
            defaultLandingLikelihoodState = inner.state;
            data = { ...data, defaultLandingLikelihood: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            print: printState,
            defaultLandingLikelihood: defaultLandingLikelihoodState,
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
                <RecordContext meta={QUOTATION_TYPE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
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
    print: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.print>
    >;
    defaultLandingLikelihood: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.defaultLandingLikelihood>
    >;
};
// END MAGIC -- DO NOT EDIT
