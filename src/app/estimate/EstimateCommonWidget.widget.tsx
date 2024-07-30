import * as React from "react";
import { Col, Row } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { DeleteButton } from "../../clay/delete-button";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { DecimalDefaultWidget } from "../../clay/widgets/DecimalDefaultWidget";
import { FormField, OptionalFormField } from "../../clay/widgets/FormField";
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
import { SwitchWidget } from "../../clay/widgets/SwitchWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { EstimateCommon, ESTIMATE_COMMON_META } from "./table";

export type Data = EstimateCommon;

export type ExtraProps = {
    hideMaterials?: boolean;
};

export const Fields = {
    name: OptionalFormField(TextWidget),
    markup: FormField(PercentageWidget),
    materialsMarkup: FormField(DecimalDefaultWidget),
    additionalMarkup: OptionalFormField(PercentageWidget),
    additionalMaterialsMarkup: OptionalFormField(DecimalDefaultWidget),
    additionalAllowancesMarkup: OptionalFormField(DecimalDefaultWidget),
    additionalMarkupNote: FormField(TextWidget),
    markupExclusive: FormField(SwitchWidget),
};

function validate(data: EstimateCommon, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);

    if (
        data.additionalMarkup.isZero() &&
        (data.additionalAllowancesMarkup == null ||
            data.additionalAllowancesMarkup.isZero()) &&
        (data.additionalMaterialsMarkup === null ||
            data.additionalMaterialsMarkup.isZero())
    ) {
        return errors.filter((error) => error.field !== "additionalMarkupNote");
    } else {
        return errors;
    }
}

function Component(props: Props) {
    return (
        <>
            <widgets.name label="Estimate Name" />
            <Row>
                <Col style={{ maxWidth: "15em" }}>
                    <widgets.markup label="Labour Markup" />
                </Col>
                {!props.hideMaterials && (
                    <Col style={{ maxWidth: "15em" }}>
                        <widgets.materialsMarkup
                            percentage
                            defaultData={props.data.markup}
                        />
                    </Col>
                )}
                <Col />
            </Row>
            <Row>
                <Col style={{ maxWidth: "15em" }}>
                    <widgets.additionalMarkup label="Additional Labour Markup" />
                </Col>
                {!props.hideMaterials && (
                    <Col style={{ maxWidth: "15em" }}>
                        <widgets.additionalMaterialsMarkup
                            percentage
                            defaultData={props.data.additionalMarkup}
                        />
                    </Col>
                )}
                <Col style={{ maxWidth: "15em" }}>
                    <widgets.additionalAllowancesMarkup
                        percentage
                        defaultData={props.data.additionalMarkup}
                    />
                </Col>
                <Col>
                    <widgets.additionalMarkupNote />
                </Col>
                {!props.data.markupExclusive && (
                    <Col style={{ maxWidth: "7.5em" }}>
                        <widgets.markupExclusive label="Post-Markup" />
                    </Col>
                )}
            </Row>
            <DeleteButton label="Delete Estimate" />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.markup> &
    WidgetContext<typeof Fields.materialsMarkup> &
    WidgetContext<typeof Fields.additionalMarkup> &
    WidgetContext<typeof Fields.additionalMaterialsMarkup> &
    WidgetContext<typeof Fields.additionalAllowancesMarkup> &
    WidgetContext<typeof Fields.additionalMarkupNote> &
    WidgetContext<typeof Fields.markupExclusive>;
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    markup: WidgetState<typeof Fields.markup>;
    materialsMarkup: WidgetState<typeof Fields.materialsMarkup>;
    additionalMarkup: WidgetState<typeof Fields.additionalMarkup>;
    additionalMaterialsMarkup: WidgetState<
        typeof Fields.additionalMaterialsMarkup
    >;
    additionalAllowancesMarkup: WidgetState<
        typeof Fields.additionalAllowancesMarkup
    >;
    additionalMarkupNote: WidgetState<typeof Fields.additionalMarkupNote>;
    markupExclusive: WidgetState<typeof Fields.markupExclusive>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "MARKUP"; action: WidgetAction<typeof Fields.markup> }
    | {
          type: "MATERIALS_MARKUP";
          action: WidgetAction<typeof Fields.materialsMarkup>;
      }
    | {
          type: "ADDITIONAL_MARKUP";
          action: WidgetAction<typeof Fields.additionalMarkup>;
      }
    | {
          type: "ADDITIONAL_MATERIALS_MARKUP";
          action: WidgetAction<typeof Fields.additionalMaterialsMarkup>;
      }
    | {
          type: "ADDITIONAL_ALLOWANCES_MARKUP";
          action: WidgetAction<typeof Fields.additionalAllowancesMarkup>;
      }
    | {
          type: "ADDITIONAL_MARKUP_NOTE";
          action: WidgetAction<typeof Fields.additionalMarkupNote>;
      }
    | {
          type: "MARKUP_EXCLUSIVE";
          action: WidgetAction<typeof Fields.markupExclusive>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.markup, data.markup, cache, "markup", errors);
    subvalidate(
        Fields.materialsMarkup,
        data.materialsMarkup,
        cache,
        "materialsMarkup",
        errors
    );
    subvalidate(
        Fields.additionalMarkup,
        data.additionalMarkup,
        cache,
        "additionalMarkup",
        errors
    );
    subvalidate(
        Fields.additionalMaterialsMarkup,
        data.additionalMaterialsMarkup,
        cache,
        "additionalMaterialsMarkup",
        errors
    );
    subvalidate(
        Fields.additionalAllowancesMarkup,
        data.additionalAllowancesMarkup,
        cache,
        "additionalAllowancesMarkup",
        errors
    );
    subvalidate(
        Fields.additionalMarkupNote,
        data.additionalMarkupNote,
        cache,
        "additionalMarkupNote",
        errors
    );
    subvalidate(
        Fields.markupExclusive,
        data.markupExclusive,
        cache,
        "markupExclusive",
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
        case "ADDITIONAL_MARKUP": {
            const inner = Fields.additionalMarkup.reduce(
                state.additionalMarkup,
                data.additionalMarkup,
                action.action,
                subcontext
            );
            return {
                state: { ...state, additionalMarkup: inner.state },
                data: { ...data, additionalMarkup: inner.data },
            };
        }
        case "ADDITIONAL_MATERIALS_MARKUP": {
            const inner = Fields.additionalMaterialsMarkup.reduce(
                state.additionalMaterialsMarkup,
                data.additionalMaterialsMarkup,
                action.action,
                subcontext
            );
            return {
                state: { ...state, additionalMaterialsMarkup: inner.state },
                data: { ...data, additionalMaterialsMarkup: inner.data },
            };
        }
        case "ADDITIONAL_ALLOWANCES_MARKUP": {
            const inner = Fields.additionalAllowancesMarkup.reduce(
                state.additionalAllowancesMarkup,
                data.additionalAllowancesMarkup,
                action.action,
                subcontext
            );
            return {
                state: { ...state, additionalAllowancesMarkup: inner.state },
                data: { ...data, additionalAllowancesMarkup: inner.data },
            };
        }
        case "ADDITIONAL_MARKUP_NOTE": {
            const inner = Fields.additionalMarkupNote.reduce(
                state.additionalMarkupNote,
                data.additionalMarkupNote,
                action.action,
                subcontext
            );
            return {
                state: { ...state, additionalMarkupNote: inner.state },
                data: { ...data, additionalMarkupNote: inner.data },
            };
        }
        case "MARKUP_EXCLUSIVE": {
            const inner = Fields.markupExclusive.reduce(
                state.markupExclusive,
                data.markupExclusive,
                action.action,
                subcontext
            );
            return {
                state: { ...state, markupExclusive: inner.state },
                data: { ...data, markupExclusive: inner.data },
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
    additionalMarkup: function (
        props: WidgetExtraProps<typeof Fields.additionalMarkup> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ADDITIONAL_MARKUP",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "additionalMarkup", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.additionalMarkup.component
                state={context.state.additionalMarkup}
                data={context.data.additionalMarkup}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Additional Markup"}
            />
        );
    },
    additionalMaterialsMarkup: function (
        props: WidgetExtraProps<typeof Fields.additionalMaterialsMarkup> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ADDITIONAL_MATERIALS_MARKUP",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "additionalMaterialsMarkup",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.additionalMaterialsMarkup.component
                state={context.state.additionalMaterialsMarkup}
                data={context.data.additionalMaterialsMarkup}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Additional Materials Markup"}
            />
        );
    },
    additionalAllowancesMarkup: function (
        props: WidgetExtraProps<typeof Fields.additionalAllowancesMarkup> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ADDITIONAL_ALLOWANCES_MARKUP",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "additionalAllowancesMarkup",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.additionalAllowancesMarkup.component
                state={context.state.additionalAllowancesMarkup}
                data={context.data.additionalAllowancesMarkup}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Additional Allowances Markup"}
            />
        );
    },
    additionalMarkupNote: function (
        props: WidgetExtraProps<typeof Fields.additionalMarkupNote> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ADDITIONAL_MARKUP_NOTE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "additionalMarkupNote",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.additionalMarkupNote.component
                state={context.state.additionalMarkupNote}
                data={context.data.additionalMarkupNote}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Additional Markup Note"}
            />
        );
    },
    markupExclusive: function (
        props: WidgetExtraProps<typeof Fields.markupExclusive> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MARKUP_EXCLUSIVE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "markupExclusive", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.markupExclusive.component
                state={context.state.markupExclusive}
                data={context.data.markupExclusive}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Markup Exclusive"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ESTIMATE_COMMON_META,
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
        let additionalMarkupState;
        {
            const inner = Fields.additionalMarkup.initialize(
                data.additionalMarkup,
                subcontext,
                subparameters.additionalMarkup
            );
            additionalMarkupState = inner.state;
            data = { ...data, additionalMarkup: inner.data };
        }
        let additionalMaterialsMarkupState;
        {
            const inner = Fields.additionalMaterialsMarkup.initialize(
                data.additionalMaterialsMarkup,
                subcontext,
                subparameters.additionalMaterialsMarkup
            );
            additionalMaterialsMarkupState = inner.state;
            data = { ...data, additionalMaterialsMarkup: inner.data };
        }
        let additionalAllowancesMarkupState;
        {
            const inner = Fields.additionalAllowancesMarkup.initialize(
                data.additionalAllowancesMarkup,
                subcontext,
                subparameters.additionalAllowancesMarkup
            );
            additionalAllowancesMarkupState = inner.state;
            data = { ...data, additionalAllowancesMarkup: inner.data };
        }
        let additionalMarkupNoteState;
        {
            const inner = Fields.additionalMarkupNote.initialize(
                data.additionalMarkupNote,
                subcontext,
                subparameters.additionalMarkupNote
            );
            additionalMarkupNoteState = inner.state;
            data = { ...data, additionalMarkupNote: inner.data };
        }
        let markupExclusiveState;
        {
            const inner = Fields.markupExclusive.initialize(
                data.markupExclusive,
                subcontext,
                subparameters.markupExclusive
            );
            markupExclusiveState = inner.state;
            data = { ...data, markupExclusive: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            markup: markupState,
            materialsMarkup: materialsMarkupState,
            additionalMarkup: additionalMarkupState,
            additionalMaterialsMarkup: additionalMaterialsMarkupState,
            additionalAllowancesMarkup: additionalAllowancesMarkupState,
            additionalMarkupNote: additionalMarkupNoteState,
            markupExclusive: markupExclusiveState,
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
                <RecordContext meta={ESTIMATE_COMMON_META} value={props.data}>
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
    additionalMarkup: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.additionalMarkup>
    >;
    additionalMaterialsMarkup: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.additionalMaterialsMarkup>
    >;
    additionalAllowancesMarkup: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.additionalAllowancesMarkup>
    >;
    additionalMarkupNote: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.additionalMarkupNote>
    >;
    markupExclusive: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.markupExclusive>
    >;
};
// END MAGIC -- DO NOT EDIT
