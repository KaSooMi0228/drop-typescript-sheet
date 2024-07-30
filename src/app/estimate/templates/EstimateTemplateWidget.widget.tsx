import React from "react";
import { Col, Row } from "react-bootstrap";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { SaveDeleteButton } from "../../../clay/save-delete-button";
import { DecimalDefaultWidget } from "../../../clay/widgets/DecimalDefaultWidget";
import { FormField, OptionalFormField } from "../../../clay/widgets/FormField";
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
import { LinkSetWidget } from "../../../clay/widgets/link-set-widget";
import { ListWidget } from "../../../clay/widgets/ListWidget";
import { MoneyWidget } from "../../../clay/widgets/money-widget";
import { PercentageWidget } from "../../../clay/widgets/percentage-widget";
import { SelectWidget } from "../../../clay/widgets/SelectWidget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import {
    CONTRACT_NOTE_META,
    SCOPE_OF_WORK_META,
} from "../../quotation/notes/table";
import { ESTIMATE_CONTINGENCY_ITEM_TYPE_META } from "../table";
import EstimateTemplateActionWidget from "./EstimateTemplateActionWidget.widget";
import { EstimateTemplate, ESTIMATE_TEMPLATE_META } from "./table";

export type Data = EstimateTemplate;

export const Fields = {
    name: FormField(TextWidget),
    baseHourRate: FormField(MoneyWidget),
    markup: FormField(PercentageWidget),
    materialsMarkup: FormField(DecimalDefaultWidget),
    actions: ListWidget(EstimateTemplateActionWidget),
    kind: FormField(
        SelectWidget([
            { value: "full" as const, label: "Full" },
            {
                value: "time-and-materials" as const,
                label: "Time and Materials",
            },
        ])
    ),
    scopesOfWork: OptionalFormField(
        LinkSetWidget({
            meta: SCOPE_OF_WORK_META,
            name: (note) => note.notes.name,
        })
    ),
    contractNotes: OptionalFormField(
        LinkSetWidget({
            meta: CONTRACT_NOTE_META,
            name: (note) => note.notes.name,
        })
    ),
    contingencyItems: OptionalFormField(
        LinkSetWidget({
            meta: ESTIMATE_CONTINGENCY_ITEM_TYPE_META,
            name: (note) => note.name,
        })
    ),
};

function validate(data: EstimateTemplate, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);
    if (data.kind === "full") {
        return errors;
    } else {
        return errors.filter(
            (error) =>
                error.field !== "actions" && error.field !== "baseHourRate"
        );
    }
}

function Component(props: Props) {
    return (
        <>
            <widgets.name />
            <widgets.kind />
            <widgets.scopesOfWork />
            <widgets.contractNotes />
            <Row>
                {props.data.kind === "full" && (
                    <Col>
                        <widgets.baseHourRate label="Base Hourly Rate" />
                    </Col>
                )}
                <Col>
                    <widgets.markup label="Labour Markup" />
                </Col>
                <Col>
                    <widgets.materialsMarkup
                        percentage
                        defaultData={props.data.markup}
                    />
                </Col>
            </Row>
            {props.data.kind === "full" && (
                <>
                    <widgets.actions
                        extraItemForAdd
                        itemProps={{ template: props.data }}
                    />
                    <widgets.contingencyItems />
                </>
            )}

            <SaveDeleteButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.baseHourRate> &
    WidgetContext<typeof Fields.markup> &
    WidgetContext<typeof Fields.materialsMarkup> &
    WidgetContext<typeof Fields.actions> &
    WidgetContext<typeof Fields.kind> &
    WidgetContext<typeof Fields.scopesOfWork> &
    WidgetContext<typeof Fields.contractNotes> &
    WidgetContext<typeof Fields.contingencyItems>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    baseHourRate: WidgetState<typeof Fields.baseHourRate>;
    markup: WidgetState<typeof Fields.markup>;
    materialsMarkup: WidgetState<typeof Fields.materialsMarkup>;
    actions: WidgetState<typeof Fields.actions>;
    kind: WidgetState<typeof Fields.kind>;
    scopesOfWork: WidgetState<typeof Fields.scopesOfWork>;
    contractNotes: WidgetState<typeof Fields.contractNotes>;
    contingencyItems: WidgetState<typeof Fields.contingencyItems>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | {
          type: "BASE_HOUR_RATE";
          action: WidgetAction<typeof Fields.baseHourRate>;
      }
    | { type: "MARKUP"; action: WidgetAction<typeof Fields.markup> }
    | {
          type: "MATERIALS_MARKUP";
          action: WidgetAction<typeof Fields.materialsMarkup>;
      }
    | { type: "ACTIONS"; action: WidgetAction<typeof Fields.actions> }
    | { type: "KIND"; action: WidgetAction<typeof Fields.kind> }
    | {
          type: "SCOPES_OF_WORK";
          action: WidgetAction<typeof Fields.scopesOfWork>;
      }
    | {
          type: "CONTRACT_NOTES";
          action: WidgetAction<typeof Fields.contractNotes>;
      }
    | {
          type: "CONTINGENCY_ITEMS";
          action: WidgetAction<typeof Fields.contingencyItems>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(
        Fields.baseHourRate,
        data.baseHourRate,
        cache,
        "baseHourRate",
        errors
    );
    subvalidate(Fields.markup, data.markup, cache, "markup", errors);
    subvalidate(
        Fields.materialsMarkup,
        data.materialsMarkup,
        cache,
        "materialsMarkup",
        errors
    );
    subvalidate(Fields.actions, data.actions, cache, "actions", errors);
    subvalidate(Fields.kind, data.kind, cache, "kind", errors);
    subvalidate(
        Fields.scopesOfWork,
        data.scopesOfWork,
        cache,
        "scopesOfWork",
        errors
    );
    subvalidate(
        Fields.contractNotes,
        data.contractNotes,
        cache,
        "contractNotes",
        errors
    );
    subvalidate(
        Fields.contingencyItems,
        data.contingencyItems,
        cache,
        "contingencyItems",
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
        case "BASE_HOUR_RATE": {
            const inner = Fields.baseHourRate.reduce(
                state.baseHourRate,
                data.baseHourRate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, baseHourRate: inner.state },
                data: { ...data, baseHourRate: inner.data },
            };
        }
        case "MARKUP": {
            const inner = Fields.markup.reduce(
                state.markup,
                data.markup,
                action.action,
                subcontext
            );
            return {
                state: { ...state, markup: inner.state },
                data: { ...data, markup: inner.data },
            };
        }
        case "MATERIALS_MARKUP": {
            const inner = Fields.materialsMarkup.reduce(
                state.materialsMarkup,
                data.materialsMarkup,
                action.action,
                subcontext
            );
            return {
                state: { ...state, materialsMarkup: inner.state },
                data: { ...data, materialsMarkup: inner.data },
            };
        }
        case "ACTIONS": {
            const inner = Fields.actions.reduce(
                state.actions,
                data.actions,
                action.action,
                subcontext
            );
            return {
                state: { ...state, actions: inner.state },
                data: { ...data, actions: inner.data },
            };
        }
        case "KIND": {
            const inner = Fields.kind.reduce(
                state.kind,
                data.kind,
                action.action,
                subcontext
            );
            return {
                state: { ...state, kind: inner.state },
                data: { ...data, kind: inner.data },
            };
        }
        case "SCOPES_OF_WORK": {
            const inner = Fields.scopesOfWork.reduce(
                state.scopesOfWork,
                data.scopesOfWork,
                action.action,
                subcontext
            );
            return {
                state: { ...state, scopesOfWork: inner.state },
                data: { ...data, scopesOfWork: inner.data },
            };
        }
        case "CONTRACT_NOTES": {
            const inner = Fields.contractNotes.reduce(
                state.contractNotes,
                data.contractNotes,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contractNotes: inner.state },
                data: { ...data, contractNotes: inner.data },
            };
        }
        case "CONTINGENCY_ITEMS": {
            const inner = Fields.contingencyItems.reduce(
                state.contingencyItems,
                data.contingencyItems,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contingencyItems: inner.state },
                data: { ...data, contingencyItems: inner.data },
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
    baseHourRate: function (
        props: WidgetExtraProps<typeof Fields.baseHourRate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "BASE_HOUR_RATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "baseHourRate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.baseHourRate.component
                state={context.state.baseHourRate}
                data={context.data.baseHourRate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Base Hour Rate"}
            />
        );
    },
    markup: function (
        props: WidgetExtraProps<typeof Fields.markup> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MARKUP",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "markup", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.markup.component
                state={context.state.markup}
                data={context.data.markup}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Markup"}
            />
        );
    },
    materialsMarkup: function (
        props: WidgetExtraProps<typeof Fields.materialsMarkup> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MATERIALS_MARKUP",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "materialsMarkup", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.materialsMarkup.component
                state={context.state.materialsMarkup}
                data={context.data.materialsMarkup}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Materials Markup"}
            />
        );
    },
    actions: function (
        props: WidgetExtraProps<typeof Fields.actions> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ACTIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "actions", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.actions.component
                state={context.state.actions}
                data={context.data.actions}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Actions"}
            />
        );
    },
    kind: function (
        props: WidgetExtraProps<typeof Fields.kind> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "KIND", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "kind", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.kind.component
                state={context.state.kind}
                data={context.data.kind}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Kind"}
            />
        );
    },
    scopesOfWork: function (
        props: WidgetExtraProps<typeof Fields.scopesOfWork> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SCOPES_OF_WORK",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "scopesOfWork", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.scopesOfWork.component
                state={context.state.scopesOfWork}
                data={context.data.scopesOfWork}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Scopes of Work"}
            />
        );
    },
    contractNotes: function (
        props: WidgetExtraProps<typeof Fields.contractNotes> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTRACT_NOTES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "contractNotes", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contractNotes.component
                state={context.state.contractNotes}
                data={context.data.contractNotes}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contract Notes"}
            />
        );
    },
    contingencyItems: function (
        props: WidgetExtraProps<typeof Fields.contingencyItems> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTINGENCY_ITEMS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "contingencyItems", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contingencyItems.component
                state={context.state.contingencyItems}
                data={context.data.contingencyItems}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contingency Items"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ESTIMATE_TEMPLATE_META,
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
        let baseHourRateState;
        {
            const inner = Fields.baseHourRate.initialize(
                data.baseHourRate,
                subcontext,
                subparameters.baseHourRate
            );
            baseHourRateState = inner.state;
            data = { ...data, baseHourRate: inner.data };
        }
        let markupState;
        {
            const inner = Fields.markup.initialize(
                data.markup,
                subcontext,
                subparameters.markup
            );
            markupState = inner.state;
            data = { ...data, markup: inner.data };
        }
        let materialsMarkupState;
        {
            const inner = Fields.materialsMarkup.initialize(
                data.materialsMarkup,
                subcontext,
                subparameters.materialsMarkup
            );
            materialsMarkupState = inner.state;
            data = { ...data, materialsMarkup: inner.data };
        }
        let actionsState;
        {
            const inner = Fields.actions.initialize(
                data.actions,
                subcontext,
                subparameters.actions
            );
            actionsState = inner.state;
            data = { ...data, actions: inner.data };
        }
        let kindState;
        {
            const inner = Fields.kind.initialize(
                data.kind,
                subcontext,
                subparameters.kind
            );
            kindState = inner.state;
            data = { ...data, kind: inner.data };
        }
        let scopesOfWorkState;
        {
            const inner = Fields.scopesOfWork.initialize(
                data.scopesOfWork,
                subcontext,
                subparameters.scopesOfWork
            );
            scopesOfWorkState = inner.state;
            data = { ...data, scopesOfWork: inner.data };
        }
        let contractNotesState;
        {
            const inner = Fields.contractNotes.initialize(
                data.contractNotes,
                subcontext,
                subparameters.contractNotes
            );
            contractNotesState = inner.state;
            data = { ...data, contractNotes: inner.data };
        }
        let contingencyItemsState;
        {
            const inner = Fields.contingencyItems.initialize(
                data.contingencyItems,
                subcontext,
                subparameters.contingencyItems
            );
            contingencyItemsState = inner.state;
            data = { ...data, contingencyItems: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            baseHourRate: baseHourRateState,
            markup: markupState,
            materialsMarkup: materialsMarkupState,
            actions: actionsState,
            kind: kindState,
            scopesOfWork: scopesOfWorkState,
            contractNotes: contractNotesState,
            contingencyItems: contingencyItemsState,
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
                <RecordContext meta={ESTIMATE_TEMPLATE_META} value={props.data}>
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
    baseHourRate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.baseHourRate>
    >;
    markup: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.markup>
    >;
    materialsMarkup: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.materialsMarkup>
    >;
    actions: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.actions>
    >;
    kind: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.kind>
    >;
    scopesOfWork: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.scopesOfWork>
    >;
    contractNotes: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contractNotes>
    >;
    contingencyItems: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contingencyItems>
    >;
};
// END MAGIC -- DO NOT EDIT
