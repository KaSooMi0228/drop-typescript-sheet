import * as React from "react";
import { Col, Row } from "react-bootstrap";
import ReactSwitch from "react-switch";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import {
    FormField,
    FormWrapper,
    Optional,
} from "../../../clay/widgets/FormField";
import {
    RecordContext,
    RecordWidget,
    subStatus,
    subvalidate,
    useRecordContext,
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
import { SelectLinkWidget } from "../../../clay/widgets/SelectLinkWidget";
import { SelectWidget } from "../../../clay/widgets/SelectWidget";
import { ESTIMATE_META } from "../table";
import { EstimateAction, ESTIMATE_ACTION_META } from "./table";

export type Data = EstimateAction;

const CALCULATOR_OPTIONS = [
    { value: "Square" as "Square", label: "Square" },
    { value: "Linear" as "Linear", label: "Linear" },
    { value: "Sealant" as const, label: "Sealant" },
    { value: "Walls" as "Walls", label: "Walls" },
    { value: "Ceiling" as "Ceiling", label: "Ceiling" },
    { value: "Baseboard" as "Baseboard", label: "Baseboard" },
    { value: "Crown" as "Crown", label: "Crown" },
    { value: "Chair Rail" as "Chair Rail", label: "Chair Rail" },
];
export const CALCULATOR_WIDGET = SelectWidget(CALCULATOR_OPTIONS);

export type ExtraProps = {
    contingency: boolean;
};

export const Fields = {
    calculator: FormField(CALCULATOR_WIDGET),
    copyUnitsFromAction: Optional(
        SelectLinkWidget({
            meta: ESTIMATE_ACTION_META,
            label: (action) => action.name,
        })
    ),
};

function Component(props: Props) {
    const estimateContext = useRecordContext(ESTIMATE_META);
    if (!estimateContext) {
        throw new Error("Expected to be used in estimate");
    }
    const [copyUnitsOn, setCopyUnitsOn] = React.useState(
        props.data.copyUnitsFromAction !== null
    );

    const updateCopyUnitsOn = React.useCallback(
        (value) => {
            setCopyUnitsOn(value);
            if (!value) {
                props.dispatch({
                    type: "COPY_UNITS_FROM_ACTION",
                    action: {
                        type: "SET",
                        value: null,
                    },
                });
            }
        },
        [setCopyUnitsOn, props.dispatch]
    );

    return (
        <>
            <Row style={{ marginBottom: "1em" }}>
                <Col>
                    <widgets.calculator
                        options={CALCULATOR_OPTIONS.filter(
                            (x) =>
                                !props.contingency ||
                                x.value === "Square" ||
                                x.value === "Linear"
                        )}
                    />
                </Col>
                {!props.contingency && (
                    <Col>
                        <FormWrapper label="Copy Units From Action">
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <ReactSwitch
                                    checked={copyUnitsOn}
                                    onChange={updateCopyUnitsOn}
                                />
                                <div style={{ width: "1em" }} />
                                <widgets.copyUnitsFromAction
                                    records={estimateContext.actions.filter(
                                        (action) =>
                                            action.id.uuid !=
                                                props.data.id.uuid &&
                                            !action.copyUnitsFromAction
                                    )}
                                    clearable
                                    readOnly={!copyUnitsOn}
                                />
                            </div>
                        </FormWrapper>
                    </Col>
                )}
            </Row>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.calculator> &
    WidgetContext<typeof Fields.copyUnitsFromAction>;
type BaseState = {
    calculator: WidgetState<typeof Fields.calculator>;
    copyUnitsFromAction: WidgetState<typeof Fields.copyUnitsFromAction>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "CALCULATOR"; action: WidgetAction<typeof Fields.calculator> }
    | {
          type: "COPY_UNITS_FROM_ACTION";
          action: WidgetAction<typeof Fields.copyUnitsFromAction>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.calculator,
        data.calculator,
        cache,
        "calculator",
        errors
    );
    subvalidate(
        Fields.copyUnitsFromAction,
        data.copyUnitsFromAction,
        cache,
        "copyUnitsFromAction",
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
        case "CALCULATOR": {
            const inner = Fields.calculator.reduce(
                state.calculator,
                data.calculator,
                action.action,
                subcontext
            );
            return {
                state: { ...state, calculator: inner.state },
                data: { ...data, calculator: inner.data },
            };
        }
        case "COPY_UNITS_FROM_ACTION": {
            const inner = Fields.copyUnitsFromAction.reduce(
                state.copyUnitsFromAction,
                data.copyUnitsFromAction,
                action.action,
                subcontext
            );
            return {
                state: { ...state, copyUnitsFromAction: inner.state },
                data: { ...data, copyUnitsFromAction: inner.data },
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
    calculator: function (
        props: WidgetExtraProps<typeof Fields.calculator> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CALCULATOR",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "calculator", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.calculator.component
                state={context.state.calculator}
                data={context.data.calculator}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Calculator"}
            />
        );
    },
    copyUnitsFromAction: function (
        props: WidgetExtraProps<typeof Fields.copyUnitsFromAction> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COPY_UNITS_FROM_ACTION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "copyUnitsFromAction",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.copyUnitsFromAction.component
                state={context.state.copyUnitsFromAction}
                data={context.data.copyUnitsFromAction}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Copy Units From Action"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ESTIMATE_ACTION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let calculatorState;
        {
            const inner = Fields.calculator.initialize(
                data.calculator,
                subcontext,
                subparameters.calculator
            );
            calculatorState = inner.state;
            data = { ...data, calculator: inner.data };
        }
        let copyUnitsFromActionState;
        {
            const inner = Fields.copyUnitsFromAction.initialize(
                data.copyUnitsFromAction,
                subcontext,
                subparameters.copyUnitsFromAction
            );
            copyUnitsFromActionState = inner.state;
            data = { ...data, copyUnitsFromAction: inner.data };
        }
        let state = {
            initialParameters: parameters,
            calculator: calculatorState,
            copyUnitsFromAction: copyUnitsFromActionState,
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
                <RecordContext meta={ESTIMATE_ACTION_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    calculator: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.calculator>
    >;
    copyUnitsFromAction: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.copyUnitsFromAction>
    >;
};
// END MAGIC -- DO NOT EDIT
