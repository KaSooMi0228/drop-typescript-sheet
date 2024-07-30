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
import { useListItemContext } from "../../clay/widgets/ListWidget";
import { SelectWidget } from "../../clay/widgets/SelectWidget";
import { BaseTableRow } from "../../clay/widgets/TableRow";
import { TextWidget } from "../../clay/widgets/TextWidget";
import {
    COVERED_LABELS,
    WarrantyReviewSpecificItem,
    WARRANTY_REVIEW_SPECIFIC_ITEM_META,
} from "./table";

export type Data = WarrantyReviewSpecificItem;

export const Fields = {
    covered: SelectWidget<"" | "Yes" | "Remdal" | "Other">(
        Object.entries(COVERED_LABELS).map(([value, label]) => ({
            value,
            label,
        })) as any
    ),

    description: TextWidget,
    actionRequired: TextWidget,
};

export function Component(props: Props) {
    const index = useListItemContext().index;
    return (
        <BaseTableRow>
            <td>{index === undefined ? undefined : index + 1}</td>
            <td>
                <widgets.description />
            </td>
            <td>
                <widgets.actionRequired />
            </td>
            <td>
                <widgets.covered />
            </td>
        </BaseTableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.covered> &
    WidgetContext<typeof Fields.description> &
    WidgetContext<typeof Fields.actionRequired>;
type ExtraProps = {};
type BaseState = {
    covered: WidgetState<typeof Fields.covered>;
    description: WidgetState<typeof Fields.description>;
    actionRequired: WidgetState<typeof Fields.actionRequired>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "COVERED"; action: WidgetAction<typeof Fields.covered> }
    | { type: "DESCRIPTION"; action: WidgetAction<typeof Fields.description> }
    | {
          type: "ACTION_REQUIRED";
          action: WidgetAction<typeof Fields.actionRequired>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.covered, data.covered, cache, "covered", errors);
    subvalidate(
        Fields.description,
        data.description,
        cache,
        "description",
        errors
    );
    subvalidate(
        Fields.actionRequired,
        data.actionRequired,
        cache,
        "actionRequired",
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
        case "COVERED": {
            const inner = Fields.covered.reduce(
                state.covered,
                data.covered,
                action.action,
                subcontext
            );
            return {
                state: { ...state, covered: inner.state },
                data: { ...data, covered: inner.data },
            };
        }
        case "DESCRIPTION": {
            const inner = Fields.description.reduce(
                state.description,
                data.description,
                action.action,
                subcontext
            );
            return {
                state: { ...state, description: inner.state },
                data: { ...data, description: inner.data },
            };
        }
        case "ACTION_REQUIRED": {
            const inner = Fields.actionRequired.reduce(
                state.actionRequired,
                data.actionRequired,
                action.action,
                subcontext
            );
            return {
                state: { ...state, actionRequired: inner.state },
                data: { ...data, actionRequired: inner.data },
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
    covered: function (
        props: WidgetExtraProps<typeof Fields.covered> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COVERED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "covered", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.covered.component
                state={context.state.covered}
                data={context.data.covered}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Covered"}
            />
        );
    },
    description: function (
        props: WidgetExtraProps<typeof Fields.description> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "DESCRIPTION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "description", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.description.component
                state={context.state.description}
                data={context.data.description}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Description"}
            />
        );
    },
    actionRequired: function (
        props: WidgetExtraProps<typeof Fields.actionRequired> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ACTION_REQUIRED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "actionRequired", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.actionRequired.component
                state={context.state.actionRequired}
                data={context.data.actionRequired}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Action Required"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WARRANTY_REVIEW_SPECIFIC_ITEM_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let coveredState;
        {
            const inner = Fields.covered.initialize(
                data.covered,
                subcontext,
                subparameters.covered
            );
            coveredState = inner.state;
            data = { ...data, covered: inner.data };
        }
        let descriptionState;
        {
            const inner = Fields.description.initialize(
                data.description,
                subcontext,
                subparameters.description
            );
            descriptionState = inner.state;
            data = { ...data, description: inner.data };
        }
        let actionRequiredState;
        {
            const inner = Fields.actionRequired.initialize(
                data.actionRequired,
                subcontext,
                subparameters.actionRequired
            );
            actionRequiredState = inner.state;
            data = { ...data, actionRequired: inner.data };
        }
        let state = {
            initialParameters: parameters,
            covered: coveredState,
            description: descriptionState,
            actionRequired: actionRequiredState,
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
                    meta={WARRANTY_REVIEW_SPECIFIC_ITEM_META}
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
    covered: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.covered>
    >;
    description: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.description>
    >;
    actionRequired: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.actionRequired>
    >;
};
// END MAGIC -- DO NOT EDIT
