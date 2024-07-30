import * as React from "react";
import { Table } from "react-bootstrap";
import ReactSwitch from "react-switch";
import { useRecordQuery } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { Link } from "../../clay/link";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { DateWidget } from "../../clay/widgets/DateWidget";
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
import { MoneyStatic } from "../../clay/widgets/money-widget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import {
    calcInvoiceContingencyItemContractTotal,
    calcInvoiceContractTotal,
    InvoiceContingencyItem,
    InvoiceOption,
    INVOICE_META,
} from "../invoice/table";
import { Project, PROJECT_META } from "./table";

export type Data = Project;

export const Fields = {
    customer: FormField(TextWidget),
    projectStartDate: FormField(DateWidget),
    completionDate: FormField(DateWidget),
};

function actionSetWarrantyExclude(
    state: State,
    data: Data,
    id: Link<InvoiceOption | InvoiceContingencyItem>,
    value: boolean
) {
    if (!value) {
        return {
            state,
            data: {
                ...data,
                warrantyExcludeScopes: [...data.warrantyExcludeScopes, id],
            },
        };
    } else {
        return {
            state,
            data: {
                ...data,
                warrantyExcludeScopes: data.warrantyExcludeScopes.filter(
                    (x) => x !== id
                ),
            },
        };
    }
}

function Component(props: Props) {
    const invoices =
        useRecordQuery(
            INVOICE_META,
            {
                filters: [
                    {
                        column: "project",
                        filter: {
                            equal: props.data.id.uuid,
                        },
                    },
                ],
                sorts: ["number", "date"],
            },
            [props.data.id.uuid]
        ) || [];

    const lastInvoice = invoices[invoices.length - 1];

    return (
        <>
            {lastInvoice && (
                <Table>
                    <thead>
                        <tr>
                            <th>Items Under Warranty</th>
                            <th>Contract Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lastInvoice.options
                            .filter(
                                (option) =>
                                    props.data.warrantyExcludeScopes.indexOf(
                                        option.id.uuid
                                    ) === -1
                            )
                            .map((option) => (
                                <tr>
                                    <td>
                                        {props.status.mutable && (
                                            <div
                                                style={{
                                                    verticalAlign: "middle",
                                                    marginRight: "1em",
                                                    display: "inline-block",
                                                }}
                                            >
                                                <ReactSwitch
                                                    checked={
                                                        props.data.warrantyExcludeScopes.indexOf(
                                                            option.id.uuid
                                                        ) === -1
                                                    }
                                                    onChange={(value) =>
                                                        props.dispatch({
                                                            type: "SET_WARRANTY_EXCLUDE",
                                                            id: option.id.uuid,
                                                            value: value,
                                                        })
                                                    }
                                                    disabled={
                                                        !props.status.mutable
                                                    }
                                                />
                                            </div>
                                        )}
                                        {option.description}
                                    </td>
                                    <td>
                                        <MoneyStatic value={option.total} />
                                    </td>
                                </tr>
                            ))}
                        {lastInvoice.contingencyItems
                            .filter(
                                (option) =>
                                    props.data.warrantyExcludeScopes.indexOf(
                                        option.id.uuid
                                    ) === -1
                            )
                            .map((option) => (
                                <tr>
                                    <td>
                                        {props.status.mutable && (
                                            <div
                                                style={{
                                                    verticalAlign: "middle",
                                                    marginRight: "1em",
                                                    display: "inline-block",
                                                }}
                                            >
                                                <ReactSwitch
                                                    checked={
                                                        props.data.warrantyExcludeScopes.indexOf(
                                                            option.id.uuid
                                                        ) === -1
                                                    }
                                                    onChange={(value) =>
                                                        props.dispatch({
                                                            type: "SET_WARRANTY_EXCLUDE",
                                                            id: option.id.uuid,
                                                            value: value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        )}
                                        {option.description}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <MoneyStatic
                                            value={calcInvoiceContingencyItemContractTotal(
                                                option
                                            )}
                                        />
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                    {lastInvoice.options.filter(
                        (option) =>
                            props.data.warrantyExcludeScopes.indexOf(
                                option.id.uuid
                            ) !== -1
                    ).length > 0 && (
                        <thead>
                            <tr>
                                <th>Items Not Under Warranty</th>
                                <th>Contract Value</th>
                            </tr>
                        </thead>
                    )}
                    <tbody>
                        {lastInvoice.options
                            .filter(
                                (option) =>
                                    props.data.warrantyExcludeScopes.indexOf(
                                        option.id.uuid
                                    ) !== -1
                            )
                            .map((option) => (
                                <tr>
                                    <td>
                                        {props.status.mutable && (
                                            <div
                                                style={{
                                                    verticalAlign: "middle",
                                                    marginRight: "1em",
                                                    display: "inline-block",
                                                }}
                                            >
                                                <ReactSwitch
                                                    checked={
                                                        props.data.warrantyExcludeScopes.indexOf(
                                                            option.id.uuid
                                                        ) === -1
                                                    }
                                                    onChange={(value) =>
                                                        props.dispatch({
                                                            type: "SET_WARRANTY_EXCLUDE",
                                                            id: option.id.uuid,
                                                            value: value,
                                                        })
                                                    }
                                                    disabled={
                                                        !props.status.mutable
                                                    }
                                                />
                                            </div>
                                        )}
                                        {option.description}
                                    </td>
                                    <td>
                                        <MoneyStatic value={option.total} />
                                    </td>
                                </tr>
                            ))}
                        {lastInvoice.contingencyItems
                            .filter(
                                (option) =>
                                    props.data.warrantyExcludeScopes.indexOf(
                                        option.id.uuid
                                    ) !== -1
                            )
                            .map((option) => (
                                <tr>
                                    <td>
                                        {props.status.mutable && (
                                            <div
                                                style={{
                                                    verticalAlign: "middle",
                                                    marginRight: "1em",
                                                    display: "inline-block",
                                                }}
                                            >
                                                <ReactSwitch
                                                    checked={
                                                        props.data.warrantyExcludeScopes.indexOf(
                                                            option.id.uuid
                                                        ) === -1
                                                    }
                                                    onChange={(value) =>
                                                        props.dispatch({
                                                            type: "SET_WARRANTY_EXCLUDE",
                                                            id: option.id.uuid,
                                                            value: value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        )}
                                        {option.description}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <MoneyStatic
                                            value={calcInvoiceContingencyItemContractTotal(
                                                option
                                            )}
                                        />
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Total Project Revenue</th>
                            <th>
                                <MoneyStatic
                                    value={calcInvoiceContractTotal(
                                        lastInvoice
                                    )}
                                />
                            </th>
                        </tr>
                    </tfoot>
                </Table>
            )}
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.customer> &
    WidgetContext<typeof Fields.projectStartDate> &
    WidgetContext<typeof Fields.completionDate>;
type ExtraProps = {};
type BaseState = {
    customer: WidgetState<typeof Fields.customer>;
    projectStartDate: WidgetState<typeof Fields.projectStartDate>;
    completionDate: WidgetState<typeof Fields.completionDate>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "CUSTOMER"; action: WidgetAction<typeof Fields.customer> }
    | {
          type: "PROJECT_START_DATE";
          action: WidgetAction<typeof Fields.projectStartDate>;
      }
    | {
          type: "COMPLETION_DATE";
          action: WidgetAction<typeof Fields.completionDate>;
      }
    | {
          type: "SET_WARRANTY_EXCLUDE";
          id: Link<InvoiceOption | InvoiceContingencyItem>;
          value: boolean;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.customer, data.customer, cache, "customer", errors);
    subvalidate(
        Fields.projectStartDate,
        data.projectStartDate,
        cache,
        "projectStartDate",
        errors
    );
    subvalidate(
        Fields.completionDate,
        data.completionDate,
        cache,
        "completionDate",
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
        case "CUSTOMER": {
            const inner = Fields.customer.reduce(
                state.customer,
                data.customer,
                action.action,
                subcontext
            );
            return {
                state: { ...state, customer: inner.state },
                data: { ...data, customer: inner.data },
            };
        }
        case "PROJECT_START_DATE": {
            const inner = Fields.projectStartDate.reduce(
                state.projectStartDate,
                data.projectStartDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectStartDate: inner.state },
                data: { ...data, projectStartDate: inner.data },
            };
        }
        case "COMPLETION_DATE": {
            const inner = Fields.completionDate.reduce(
                state.completionDate,
                data.completionDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, completionDate: inner.state },
                data: { ...data, completionDate: inner.data },
            };
        }
        case "SET_WARRANTY_EXCLUDE":
            return actionSetWarrantyExclude(
                state,
                data,
                action.id,
                action.value
            );
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
    customer: function (
        props: WidgetExtraProps<typeof Fields.customer> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CUSTOMER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "customer", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.customer.component
                state={context.state.customer}
                data={context.data.customer}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Customer"}
            />
        );
    },
    projectStartDate: function (
        props: WidgetExtraProps<typeof Fields.projectStartDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_START_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "projectStartDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectStartDate.component
                state={context.state.projectStartDate}
                data={context.data.projectStartDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Start Date"}
            />
        );
    },
    completionDate: function (
        props: WidgetExtraProps<typeof Fields.completionDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMPLETION_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "completionDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.completionDate.component
                state={context.state.completionDate}
                data={context.data.completionDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Completion Date"}
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
        let customerState;
        {
            const inner = Fields.customer.initialize(
                data.customer,
                subcontext,
                subparameters.customer
            );
            customerState = inner.state;
            data = { ...data, customer: inner.data };
        }
        let projectStartDateState;
        {
            const inner = Fields.projectStartDate.initialize(
                data.projectStartDate,
                subcontext,
                subparameters.projectStartDate
            );
            projectStartDateState = inner.state;
            data = { ...data, projectStartDate: inner.data };
        }
        let completionDateState;
        {
            const inner = Fields.completionDate.initialize(
                data.completionDate,
                subcontext,
                subparameters.completionDate
            );
            completionDateState = inner.state;
            data = { ...data, completionDate: inner.data };
        }
        let state = {
            initialParameters: parameters,
            customer: customerState,
            projectStartDate: projectStartDateState,
            completionDate: completionDateState,
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
    customer: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.customer>
    >;
    projectStartDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectStartDate>
    >;
    completionDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.completionDate>
    >;
};
// END MAGIC -- DO NOT EDIT
