import Decimal from "decimal.js";
import { some } from "lodash";
import * as React from "react";
import { Table } from "react-bootstrap";
import { useRecordQuery } from "../../../clay/api";
import { Dictionary } from "../../../clay/common";
import { DeleteButton } from "../../../clay/delete-button";
import { propCheck } from "../../../clay/propCheck";
import { sumMap } from "../../../clay/queryFuncs";
import { QuickCacheApi, useQuickRecords } from "../../../clay/quick-cache";
import { DateWidget } from "../../../clay/widgets/DateWidget";
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
import { SelectLinkWidget } from "../../../clay/widgets/SelectLinkWidget";
import { ContactSetWidget } from "../../contact/contact-set-widget";
import { INVOICE_META } from "../../invoice/table";
import RoleWithPercentage from "../../quotation/RoleWithPercentage.widget";
import { QUOTATION_META } from "../../quotation/table";
import {
    ROLE_CERTIFIED_FOREMAN,
    ROLE_PROJECT_MANAGER,
    USER_META,
} from "../../user/table";
import { ReactContext as ProjectCertifiedForemenCommunicationWidgetReactContext } from "../ProjectCertifiedForemenCommunicationWidget.widget";
import { DetailSheet, DETAIL_SHEET_META } from "./table";

export type Data = DetailSheet;

export const Fields = {
    contacts: OptionalFormField(ContactSetWidget),
    quotations: OptionalFormField(
        LinkSetWidget({
            meta: QUOTATION_META,
            name: (quotation) => {
                return `${quotation.number}`;
            },
        })
    ),
    certifiedForeman: OptionalFormField(
        SelectLinkWidget({
            meta: USER_META,
            label: (user) => user.name,
        })
    ),
    managers: ListWidget(RoleWithPercentage),
    projectedStartDate: FormField(DateWidget),
};

function validate(data: DetailSheet, cache: QuickCacheApi) {
    let errors = baseValidate(data, cache);

    if (!sumMap(data.managers, (x) => x.percentage).equals(new Decimal("1"))) {
        data.managers.forEach((value, index) => {
            errors.push({
                invalid: true,
                empty: false,
                field: "managers",
                detail: [
                    {
                        invalid: true,
                        empty: false,
                        field: index + "",
                        detail: [
                            {
                                invalid: true,
                                empty: false,
                                field: "percentage",
                            },
                        ],
                    },
                ],
            });
        });
    }
    if (data.change) {
        return errors.filter((error) => error.field !== "projectedStartDate");
    } else {
        return errors;
    }
}

function Component(props: Props) {
    const projectContext = React.useContext(
        ProjectCertifiedForemenCommunicationWidgetReactContext
    )!;

    const quotations = useRecordQuery(
        QUOTATION_META,
        {
            filters: [
                {
                    column: "project",
                    filter: {
                        equal: projectContext.data.id.uuid,
                    },
                },
                {
                    column: "change",
                    filter: {
                        equal: props.data.change,
                    },
                },
            ],
        },
        [projectContext.data.id.uuid]
    );

    const certifiedForemen = useQuickRecords(
        USER_META,
        projectContext.data.personnel
            .filter((role) => role.role === ROLE_CERTIFIED_FOREMAN)
            .map((x) => x.user!)
    );
    const managers = useQuickRecords(
        USER_META,
        projectContext.data.personnel
            .filter((entry) => entry.role === ROLE_PROJECT_MANAGER)
            .map((entry) => entry.user!)
    );
    const invoices = useRecordQuery(
        INVOICE_META,
        {
            filters: [
                {
                    column: "project",
                    filter: {
                        equal: props.data.project,
                    },
                },
            ],
            sorts: ["number"],
        },
        [props.data.id.uuid]
        // Only ask for the list of invoice if
        // no invoice is currently open
    );

    const isInvoiced =
        !invoices ||
        some(invoices, (invoice) =>
            some(
                invoice.options,
                (schedule) =>
                    some(
                        props.data.schedules,
                        (item) => schedule.id.uuid === item.id.uuid
                    ) && !schedule.completed.isZero()
            )
        );
    return (
        <>
            <widgets.contacts
                contacts={[
                    ...projectContext.data.billingContacts,
                    ...projectContext.data.contacts,
                ]}
                selectAll
            />
            <widgets.quotations
                records={quotations || []}
                readOnly={!props.data.change || props.data.initialized}
            />
            <widgets.certifiedForeman records={certifiedForemen} />
            <Table style={{ width: "max-content" }}>
                <thead>
                    <tr>
                        <th />
                        <th>Manager</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <widgets.managers
                    containerClass="tbody"
                    extraItemForAdd
                    itemProps={{ role: ROLE_PROJECT_MANAGER }}
                />
            </Table>
            {!props.data.change && <widgets.projectedStartDate />}
            {!isInvoiced && <DeleteButton />}
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.contacts> &
    WidgetContext<typeof Fields.quotations> &
    WidgetContext<typeof Fields.certifiedForeman> &
    WidgetContext<typeof Fields.managers> &
    WidgetContext<typeof Fields.projectedStartDate>;
type ExtraProps = {};
type BaseState = {
    contacts: WidgetState<typeof Fields.contacts>;
    quotations: WidgetState<typeof Fields.quotations>;
    certifiedForeman: WidgetState<typeof Fields.certifiedForeman>;
    managers: WidgetState<typeof Fields.managers>;
    projectedStartDate: WidgetState<typeof Fields.projectedStartDate>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "CONTACTS"; action: WidgetAction<typeof Fields.contacts> }
    | { type: "QUOTATIONS"; action: WidgetAction<typeof Fields.quotations> }
    | {
          type: "CERTIFIED_FOREMAN";
          action: WidgetAction<typeof Fields.certifiedForeman>;
      }
    | { type: "MANAGERS"; action: WidgetAction<typeof Fields.managers> }
    | {
          type: "PROJECTED_START_DATE";
          action: WidgetAction<typeof Fields.projectedStartDate>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.contacts, data.contacts, cache, "contacts", errors);
    subvalidate(
        Fields.quotations,
        data.quotations,
        cache,
        "quotations",
        errors
    );
    subvalidate(
        Fields.certifiedForeman,
        data.certifiedForeman,
        cache,
        "certifiedForeman",
        errors
    );
    subvalidate(Fields.managers, data.managers, cache, "managers", errors);
    subvalidate(
        Fields.projectedStartDate,
        data.projectedStartDate,
        cache,
        "projectedStartDate",
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
        case "CONTACTS": {
            const inner = Fields.contacts.reduce(
                state.contacts,
                data.contacts,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contacts: inner.state },
                data: { ...data, contacts: inner.data },
            };
        }
        case "QUOTATIONS": {
            const inner = Fields.quotations.reduce(
                state.quotations,
                data.quotations,
                action.action,
                subcontext
            );
            return {
                state: { ...state, quotations: inner.state },
                data: { ...data, quotations: inner.data },
            };
        }
        case "CERTIFIED_FOREMAN": {
            const inner = Fields.certifiedForeman.reduce(
                state.certifiedForeman,
                data.certifiedForeman,
                action.action,
                subcontext
            );
            return {
                state: { ...state, certifiedForeman: inner.state },
                data: { ...data, certifiedForeman: inner.data },
            };
        }
        case "MANAGERS": {
            const inner = Fields.managers.reduce(
                state.managers,
                data.managers,
                action.action,
                subcontext
            );
            return {
                state: { ...state, managers: inner.state },
                data: { ...data, managers: inner.data },
            };
        }
        case "PROJECTED_START_DATE": {
            const inner = Fields.projectedStartDate.reduce(
                state.projectedStartDate,
                data.projectedStartDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectedStartDate: inner.state },
                data: { ...data, projectedStartDate: inner.data },
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
    contacts: function (
        props: WidgetExtraProps<typeof Fields.contacts> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTACTS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "contacts", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contacts.component
                state={context.state.contacts}
                data={context.data.contacts}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contacts"}
            />
        );
    },
    quotations: function (
        props: WidgetExtraProps<typeof Fields.quotations> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "QUOTATIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "quotations", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.quotations.component
                state={context.state.quotations}
                data={context.data.quotations}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Quotations"}
            />
        );
    },
    certifiedForeman: function (
        props: WidgetExtraProps<typeof Fields.certifiedForeman> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CERTIFIED_FOREMAN",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "certifiedForeman", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.certifiedForeman.component
                state={context.state.certifiedForeman}
                data={context.data.certifiedForeman}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Certified Foreman"}
            />
        );
    },
    managers: function (
        props: WidgetExtraProps<typeof Fields.managers> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MANAGERS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "managers", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.managers.component
                state={context.state.managers}
                data={context.data.managers}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Managers"}
            />
        );
    },
    projectedStartDate: function (
        props: WidgetExtraProps<typeof Fields.projectedStartDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECTED_START_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "projectedStartDate",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectedStartDate.component
                state={context.state.projectedStartDate}
                data={context.data.projectedStartDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Projected Start Date"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: DETAIL_SHEET_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let contactsState;
        {
            const inner = Fields.contacts.initialize(
                data.contacts,
                subcontext,
                subparameters.contacts
            );
            contactsState = inner.state;
            data = { ...data, contacts: inner.data };
        }
        let quotationsState;
        {
            const inner = Fields.quotations.initialize(
                data.quotations,
                subcontext,
                subparameters.quotations
            );
            quotationsState = inner.state;
            data = { ...data, quotations: inner.data };
        }
        let certifiedForemanState;
        {
            const inner = Fields.certifiedForeman.initialize(
                data.certifiedForeman,
                subcontext,
                subparameters.certifiedForeman
            );
            certifiedForemanState = inner.state;
            data = { ...data, certifiedForeman: inner.data };
        }
        let managersState;
        {
            const inner = Fields.managers.initialize(
                data.managers,
                subcontext,
                subparameters.managers
            );
            managersState = inner.state;
            data = { ...data, managers: inner.data };
        }
        let projectedStartDateState;
        {
            const inner = Fields.projectedStartDate.initialize(
                data.projectedStartDate,
                subcontext,
                subparameters.projectedStartDate
            );
            projectedStartDateState = inner.state;
            data = { ...data, projectedStartDate: inner.data };
        }
        let state = {
            initialParameters: parameters,
            contacts: contactsState,
            quotations: quotationsState,
            certifiedForeman: certifiedForemanState,
            managers: managersState,
            projectedStartDate: projectedStartDateState,
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
                <RecordContext meta={DETAIL_SHEET_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    contacts: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contacts>
    >;
    quotations: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.quotations>
    >;
    certifiedForeman: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.certifiedForeman>
    >;
    managers: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.managers>
    >;
    projectedStartDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectedStartDate>
    >;
};
// END MAGIC -- DO NOT EDIT
