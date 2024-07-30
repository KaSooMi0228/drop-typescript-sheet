import formatISO9075 from "date-fns/formatISO9075";
import * as React from "react";
import { FormControl, Table } from "react-bootstrap";
import ReactSwitch from "react-switch";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../clay/quick-cache";
import {
    RecordWidget,
    subStatus,
    subvalidate,
    ValidationError,
    WidgetAction,
    WidgetContext,
    WidgetExtraProps,
    WidgetProps,
    WidgetResult,
    WidgetState,
    WidgetStatus,
} from "../../clay/widgets";
import { FormWrapper, Optional } from "../../clay/widgets/FormField";
import { RecordContext, Widget } from "../../clay/widgets/index";
import { MoneyStatic } from "../../clay/widgets/money-widget";
import { QuantityWidget } from "../../clay/widgets/number-widget";
import { formatMoney } from "../estimate/TotalsWidget.widget";
import {
    PROJECT_DESCRIPTION_CATEGORY_META,
    PROJECT_DESCRIPTION_META,
} from "../project-description/table";
import { ProjectDescriptionDetail } from "../project/projectDescriptionDetail/table";
import { ReactContext as ProjectInvoicesWidgetReactContext } from "../project/ProjectInvoicesWidget.widget";
import { calcProjectTotalContractValue } from "../project/table";
import { useUser } from "../state";
import { Invoice, INVOICE_META } from "./table";

export type Data = Invoice;

export const Fields = {
    number: Optional(QuantityWidget),
};

function ProjectDescription(props: { data: ProjectDescriptionDetail }) {
    const projectDescriptionCategory = useQuickRecord(
        PROJECT_DESCRIPTION_CATEGORY_META,
        props.data.category
    );
    const projectDescription = useQuickRecord(
        PROJECT_DESCRIPTION_META,
        props.data.description
    );

    return (
        <>
            <td>{projectDescriptionCategory?.name}</td>
            <td>{projectDescription?.name}</td>
            <td>{props.data.custom}</td>
        </>
    );
}

function Component(props: Props) {
    const invoiceContext = React.useContext(ProjectInvoicesWidgetReactContext)!;
    const user = useUser();

    return (
        <>
            <FormWrapper label="Contract Details Date">
                <FormControl
                    type="text"
                    disabled={true}
                    style={{ maxWidth: "2in" }}
                    value={formatISO9075(
                        invoiceContext.data.contractDetailsDate!
                    )}
                />
            </FormWrapper>
            <div style={{ flexGrow: 1 }}>
                <table style={{ width: "100%" }}>
                    <thead>
                        <tr>
                            <th style={{ width: "15em" }}>Name</th>
                            <th>Description</th>
                            {invoiceContext.data
                                .projectSchedulesDividedDescription && (
                                <>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th></th>
                                </>
                            )}
                            <th style={{ width: "5em" }}>
                                Contingency Allowance
                            </th>
                            <th style={{ width: "15em" }}>Price</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {invoiceContext.data.projectSchedules.map(
                            (schedule, index) => (
                                <tr key={index}>
                                    <td>{schedule.name}</td>
                                    <td>{schedule.description}</td>
                                    {invoiceContext.data
                                        .projectSchedulesDividedDescription && (
                                        <ProjectDescription
                                            data={schedule.projectDescription}
                                        />
                                    )}
                                    <td>
                                        <ReactSwitch
                                            onChange={() => {}}
                                            disabled={true}
                                            checked={
                                                schedule.contingencyAllowance
                                            }
                                        />
                                    </td>
                                    <td>{formatMoney(schedule.price)}</td>
                                </tr>
                            )
                        )}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th />
                            <th
                                colSpan={
                                    invoiceContext.data
                                        .projectSchedulesDividedDescription
                                        ? 5
                                        : 2
                                }
                            >
                                Total Contract Value
                            </th>
                            <th>
                                <MoneyStatic
                                    value={calcProjectTotalContractValue(
                                        invoiceContext.data
                                    )}
                                />
                            </th>
                        </tr>
                    </tfoot>
                </table>
            </div>
            {!invoiceContext.data.projectSchedulesDividedDescription && (
                <Table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <ProjectDescription
                            data={invoiceContext.data.projectDescription}
                        />
                    </tbody>
                </Table>
            )}
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.number>;
type ExtraProps = {};
type BaseState = {
    number: WidgetState<typeof Fields.number>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "NUMBER";
    action: WidgetAction<typeof Fields.number>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.number, data.number, cache, "number", errors);
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
        case "NUMBER": {
            const inner = Fields.number.reduce(
                state.number,
                data.number,
                action.action,
                subcontext
            );
            return {
                state: { ...state, number: inner.state },
                data: { ...data, number: inner.data },
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
    number: function (
        props: WidgetExtraProps<typeof Fields.number> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "NUMBER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "number", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.number.component
                state={context.state.number}
                data={context.data.number}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Number"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: INVOICE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let numberState;
        {
            const inner = Fields.number.initialize(
                data.number,
                subcontext,
                subparameters.number
            );
            numberState = inner.state;
            data = { ...data, number: inner.data };
        }
        let state = {
            initialParameters: parameters,
            number: numberState,
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
                <RecordContext meta={INVOICE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    number: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.number>
    >;
};
// END MAGIC -- DO NOT EDIT
