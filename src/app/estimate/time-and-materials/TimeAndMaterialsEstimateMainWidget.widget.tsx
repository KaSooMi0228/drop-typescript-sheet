import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import {
    atLeastOneOf,
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
import { MoneyStatic } from "../../../clay/widgets/money-widget";
import { useIsMobile } from "../../../useIsMobile";
import { useUser } from "../../state";
import { CONTENT_AREA, TABLE_STYLE } from "../../styles";
import {
    calcTimeAndMaterialsEstimateTotal,
    TimeAndMaterialsEstimate,
    TIME_AND_MATERIALS_ESTIMATE_META,
} from "./table";
import TimeAndMaterialsEstimateExtraWidget from "./TimeAndMaterialsEstimateExtraWidget.widget";
import TimeAndMaterialsEstimateLineWidget from "./TimeAndMaterialsEstimateLineWidget.widget";

export type Data = TimeAndMaterialsEstimate;
export const Fields = {
    lines: ListWidget(TimeAndMaterialsEstimateLineWidget),
    extras: ListWidget(TimeAndMaterialsEstimateExtraWidget),
};

function validate(data: TimeAndMaterialsEstimate, cache: QuickCacheApi) {
    let errors = baseValidate(data, cache);

    return atLeastOneOf(errors, "lines", "extras");
}

function Component(props: Props) {
    const user = useUser();

    const isMobile = useIsMobile();

    return (
        <>
            <div {...CONTENT_AREA}>
                <table {...TABLE_STYLE} style={{ width: "100%" }}>
                    <thead>
                        <tr>
                            <th
                                style={{
                                    display: isMobile ? "none" : undefined,
                                }}
                            />
                            <th colSpan={isMobile ? 2 : 1}>Items</th>
                            <th style={{ width: "100px" }}>Quantity</th>
                            {!isMobile && (
                                <th style={{ width: "150px" }}>Cost</th>
                            )}
                            {!isMobile && (
                                <th style={{ width: "150px" }}>Price</th>
                            )}
                            {!isMobile && (
                                <th style={{ width: "175px" }}>Total Price</th>
                            )}
                            <th style={{ width: "25px" }} />
                        </tr>
                    </thead>
                    <widgets.lines containerClass="tbody" extraItemForAdd />
                    <tr>
                        <th
                            style={{ display: isMobile ? "none" : undefined }}
                        />
                        <th colSpan={isMobile ? 3 : 4}>Extras</th>
                    </tr>

                    <widgets.extras containerClass="tbody" extraItemForAdd />
                    {
                        <tfoot>
                            <tr>
                                <th
                                    style={{
                                        display: isMobile ? "none" : undefined,
                                    }}
                                />
                                <th>Total</th>
                                {!isMobile && <th />}
                                {!isMobile && <th />}
                                {!isMobile && <th />}
                                <th colSpan={2}>
                                    <MoneyStatic
                                        value={calcTimeAndMaterialsEstimateTotal(
                                            props.data
                                        )}
                                    />
                                </th>
                            </tr>
                        </tfoot>
                    }
                </table>
            </div>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.lines> &
    WidgetContext<typeof Fields.extras>;
type ExtraProps = {};
type BaseState = {
    lines: WidgetState<typeof Fields.lines>;
    extras: WidgetState<typeof Fields.extras>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "LINES"; action: WidgetAction<typeof Fields.lines> }
    | { type: "EXTRAS"; action: WidgetAction<typeof Fields.extras> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.lines, data.lines, cache, "lines", errors);
    subvalidate(Fields.extras, data.extras, cache, "extras", errors);
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
        case "LINES": {
            const inner = Fields.lines.reduce(
                state.lines,
                data.lines,
                action.action,
                subcontext
            );
            return {
                state: { ...state, lines: inner.state },
                data: { ...data, lines: inner.data },
            };
        }
        case "EXTRAS": {
            const inner = Fields.extras.reduce(
                state.extras,
                data.extras,
                action.action,
                subcontext
            );
            return {
                state: { ...state, extras: inner.state },
                data: { ...data, extras: inner.data },
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
    lines: function (
        props: WidgetExtraProps<typeof Fields.lines> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "LINES", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "lines", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.lines.component
                state={context.state.lines}
                data={context.data.lines}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Lines"}
            />
        );
    },
    extras: function (
        props: WidgetExtraProps<typeof Fields.extras> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "EXTRAS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "extras", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.extras.component
                state={context.state.extras}
                data={context.data.extras}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Extras"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: TIME_AND_MATERIALS_ESTIMATE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let linesState;
        {
            const inner = Fields.lines.initialize(
                data.lines,
                subcontext,
                subparameters.lines
            );
            linesState = inner.state;
            data = { ...data, lines: inner.data };
        }
        let extrasState;
        {
            const inner = Fields.extras.initialize(
                data.extras,
                subcontext,
                subparameters.extras
            );
            extrasState = inner.state;
            data = { ...data, extras: inner.data };
        }
        let state = {
            initialParameters: parameters,
            lines: linesState,
            extras: extrasState,
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
                <RecordContext
                    meta={TIME_AND_MATERIALS_ESTIMATE_META}
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
    lines: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.lines>
    >;
    extras: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.extras>
    >;
};
// END MAGIC -- DO NOT EDIT
