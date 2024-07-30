import * as React from "react";
import { Table } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { SaveDeleteButton } from "../../clay/save-delete-button";
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
import { ListWidget } from "../../clay/widgets/ListWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { Squad, SQUAD_META } from "./table";
import TargetsWidget from "./targets.widget";

export type Data = Squad;

export const Fields = {
    name: FormField(TextWidget),
    azureId: FormField(TextWidget),
    targets: ListWidget(TargetsWidget, { emptyOk: true }),
};

function Component(props: Props) {
    return (
        <>
            <widgets.name />
            <widgets.azureId />
            <Table>
                <thead>
                    <th style={{ width: "2em" }}></th>
                    <th style={{ width: "10em" }}>Fiscal Year</th>
                    <th style={{ width: "12em" }}>Quoting Target</th>
                    <th style={{ width: "12em" }}>Landing Target</th>
                    <th style={{ width: "12em" }}>Managing Target</th>
                </thead>
                <widgets.targets extraItemForAdd containerClass="tbody" />
            </Table>
            <SaveDeleteButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.azureId> &
    WidgetContext<typeof Fields.targets>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    azureId: WidgetState<typeof Fields.azureId>;
    targets: WidgetState<typeof Fields.targets>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "AZURE_ID"; action: WidgetAction<typeof Fields.azureId> }
    | { type: "TARGETS"; action: WidgetAction<typeof Fields.targets> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.azureId, data.azureId, cache, "azureId", errors);
    subvalidate(Fields.targets, data.targets, cache, "targets", errors);
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
        case "AZURE_ID": {
            const inner = Fields.azureId.reduce(
                state.azureId,
                data.azureId,
                action.action,
                subcontext
            );
            return {
                state: { ...state, azureId: inner.state },
                data: { ...data, azureId: inner.data },
            };
        }
        case "TARGETS": {
            const inner = Fields.targets.reduce(
                state.targets,
                data.targets,
                action.action,
                subcontext
            );
            return {
                state: { ...state, targets: inner.state },
                data: { ...data, targets: inner.data },
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
    azureId: function (
        props: WidgetExtraProps<typeof Fields.azureId> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "AZURE_ID",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "azureId", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.azureId.component
                state={context.state.azureId}
                data={context.data.azureId}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Azure Id"}
            />
        );
    },
    targets: function (
        props: WidgetExtraProps<typeof Fields.targets> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "TARGETS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "targets", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.targets.component
                state={context.state.targets}
                data={context.data.targets}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Targets"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: SQUAD_META,
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
        let azureIdState;
        {
            const inner = Fields.azureId.initialize(
                data.azureId,
                subcontext,
                subparameters.azureId
            );
            azureIdState = inner.state;
            data = { ...data, azureId: inner.data };
        }
        let targetsState;
        {
            const inner = Fields.targets.initialize(
                data.targets,
                subcontext,
                subparameters.targets
            );
            targetsState = inner.state;
            data = { ...data, targets: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            azureId: azureIdState,
            targets: targetsState,
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
                <RecordContext meta={SQUAD_META} value={props.data}>
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
    azureId: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.azureId>
    >;
    targets: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.targets>
    >;
};
// END MAGIC -- DO NOT EDIT
