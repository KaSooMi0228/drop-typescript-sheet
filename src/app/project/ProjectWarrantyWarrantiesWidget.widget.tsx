import { some } from "lodash";
import * as React from "react";
import { Table } from "react-bootstrap";
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
import { StaticListWidget } from "../../clay/widgets/StaticListWidget";
import WarrantyWidget from "../warranty/WarrantyWidget.widget";
import { Project, PROJECT_META } from "./table";

export type Data = Project;

export const Fields = {
    warranties: StaticListWidget(WarrantyWidget),
};

function validate(project: Project, cache: QuickCacheApi) {
    const errors = baseValidate(project, cache);

    if (!some(project.warranties, (warranty) => warranty.active)) {
        errors.push({
            field: "warranties",
            empty: true,
            invalid: false,
        });
    }

    return errors;
}

function Component(props: Props) {
    return (
        <>
            <Table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Warranty Length</th>
                        <th>Schedule Warranty Review?</th>
                    </tr>
                </thead>
                <tbody>
                    <widgets.warranties />
                </tbody>
            </Table>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.warranties>;
type ExtraProps = {};
type BaseState = {
    warranties: WidgetState<typeof Fields.warranties>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "WARRANTIES";
    action: WidgetAction<typeof Fields.warranties>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.warranties,
        data.warranties,
        cache,
        "warranties",
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
        case "WARRANTIES": {
            const inner = Fields.warranties.reduce(
                state.warranties,
                data.warranties,
                action.action,
                subcontext
            );
            return {
                state: { ...state, warranties: inner.state },
                data: { ...data, warranties: inner.data },
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
    warranties: function (
        props: WidgetExtraProps<typeof Fields.warranties> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "WARRANTIES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "warranties", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.warranties.component
                state={context.state.warranties}
                data={context.data.warranties}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Warranties"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PROJECT_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let warrantiesState;
        {
            const inner = Fields.warranties.initialize(
                data.warranties,
                subcontext,
                subparameters.warranties
            );
            warrantiesState = inner.state;
            data = { ...data, warranties: inner.data };
        }
        let state = {
            initialParameters: parameters,
            warranties: warrantiesState,
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
                <RecordContext meta={PROJECT_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    warranties: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.warranties>
    >;
};
// END MAGIC -- DO NOT EDIT
