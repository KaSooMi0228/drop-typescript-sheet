import * as React from "react";
import { Dictionary } from "../../clay/common";
import { PageContext } from "../../clay/Page";
import { PaginatedWidget } from "../../clay/paginated-widget";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { SaveButton } from "../../clay/save-button";
import { StaticDateTimeWidget } from "../../clay/widgets/DateTimeWidget";
import { DateWidget } from "../../clay/widgets/DateWidget";
import { FormField, FormWrapper } from "../../clay/widgets/FormField";
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
import { StaticTextField, TextWidget } from "../../clay/widgets/TextWidget";
import { calcAddressLineFormatted } from "../address";
import { ContactSetWidget } from "../contact/contact-set-widget";
import { RichTextWidget } from "../rich-text-widget";
import FinishScheduleLineWidget from "./FinishScheduleLineWidget.widget";
import { Project, PROJECT_META } from "./table";

export type Data = Project;

export const Fields = {
    customer: FormField(TextWidget),
    finishScheduleContacts: FormField(ContactSetWidget),
    finishScheduleScopeOfWork: FormField(RichTextWidget),
    completionDate: FormField(DateWidget),
    finishScheduleLines: ListWidget(FinishScheduleLineWidget),
    finishScheduleDate: FormField(StaticDateTimeWidget),
};

function Component(props: Props) {
    const onSave = React.useCallback(() => {
        props.dispatch({
            type: "FINISH_SCHEDULE_DATE",
            action: {
                type: "SET",
                value: new Date(),
            },
        });
    }, [props.dispatch]);

    return (
        <>
            <widgets.finishScheduleDate />
            <widgets.customer label="Client's Name" readOnly />
            <FormWrapper label="Site Address">
                <StaticTextField
                    value={calcAddressLineFormatted(props.data.siteAddress)}
                />
            </FormWrapper>
            <widgets.finishScheduleContacts
                label="Contacts"
                contacts={[
                    ...props.data.billingContacts,
                    ...props.data.contacts,
                ]}
            />
            <widgets.finishScheduleScopeOfWork label="Scope of Work" />
            <widgets.completionDate />
            <table>
                <thead>
                    <th />
                    <th>Substrate</th>
                    <th>Manufacturer</th>
                    <th>Product Name</th>
                    <th>Product Size &amp; Base</th>
                    <th>Colour Name</th>
                    <th>Colour Formula</th>
                </thead>
                <widgets.finishScheduleLines
                    containerClass="tbody"
                    extraItemForAdd
                />
            </table>
            <SaveButton
                label="Generate Finish Schedule"
                printTemplate="finishSchedule"
                preSave={onSave}
                disabled={props.status.validation.length > 0}
            />
        </>
    );
}

export const FinishScheduleWidget = PaginatedWidget<Project, PageContext>({
    dataMeta: PROJECT_META,
    pages() {
        return [
            {
                id: "main",
                title: "Finish Schedule",
                widget: Widget,
            },
        ];
    },
});

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.customer> &
    WidgetContext<typeof Fields.finishScheduleContacts> &
    WidgetContext<typeof Fields.finishScheduleScopeOfWork> &
    WidgetContext<typeof Fields.completionDate> &
    WidgetContext<typeof Fields.finishScheduleLines> &
    WidgetContext<typeof Fields.finishScheduleDate>;
type ExtraProps = {};
type BaseState = {
    customer: WidgetState<typeof Fields.customer>;
    finishScheduleContacts: WidgetState<typeof Fields.finishScheduleContacts>;
    finishScheduleScopeOfWork: WidgetState<
        typeof Fields.finishScheduleScopeOfWork
    >;
    completionDate: WidgetState<typeof Fields.completionDate>;
    finishScheduleLines: WidgetState<typeof Fields.finishScheduleLines>;
    finishScheduleDate: WidgetState<typeof Fields.finishScheduleDate>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "CUSTOMER"; action: WidgetAction<typeof Fields.customer> }
    | {
          type: "FINISH_SCHEDULE_CONTACTS";
          action: WidgetAction<typeof Fields.finishScheduleContacts>;
      }
    | {
          type: "FINISH_SCHEDULE_SCOPE_OF_WORK";
          action: WidgetAction<typeof Fields.finishScheduleScopeOfWork>;
      }
    | {
          type: "COMPLETION_DATE";
          action: WidgetAction<typeof Fields.completionDate>;
      }
    | {
          type: "FINISH_SCHEDULE_LINES";
          action: WidgetAction<typeof Fields.finishScheduleLines>;
      }
    | {
          type: "FINISH_SCHEDULE_DATE";
          action: WidgetAction<typeof Fields.finishScheduleDate>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.customer, data.customer, cache, "customer", errors);
    subvalidate(
        Fields.finishScheduleContacts,
        data.finishScheduleContacts,
        cache,
        "finishScheduleContacts",
        errors
    );
    subvalidate(
        Fields.finishScheduleScopeOfWork,
        data.finishScheduleScopeOfWork,
        cache,
        "finishScheduleScopeOfWork",
        errors
    );
    subvalidate(
        Fields.completionDate,
        data.completionDate,
        cache,
        "completionDate",
        errors
    );
    subvalidate(
        Fields.finishScheduleLines,
        data.finishScheduleLines,
        cache,
        "finishScheduleLines",
        errors
    );
    subvalidate(
        Fields.finishScheduleDate,
        data.finishScheduleDate,
        cache,
        "finishScheduleDate",
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
        case "FINISH_SCHEDULE_CONTACTS": {
            const inner = Fields.finishScheduleContacts.reduce(
                state.finishScheduleContacts,
                data.finishScheduleContacts,
                action.action,
                subcontext
            );
            return {
                state: { ...state, finishScheduleContacts: inner.state },
                data: { ...data, finishScheduleContacts: inner.data },
            };
        }
        case "FINISH_SCHEDULE_SCOPE_OF_WORK": {
            const inner = Fields.finishScheduleScopeOfWork.reduce(
                state.finishScheduleScopeOfWork,
                data.finishScheduleScopeOfWork,
                action.action,
                subcontext
            );
            return {
                state: { ...state, finishScheduleScopeOfWork: inner.state },
                data: { ...data, finishScheduleScopeOfWork: inner.data },
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
        case "FINISH_SCHEDULE_LINES": {
            const inner = Fields.finishScheduleLines.reduce(
                state.finishScheduleLines,
                data.finishScheduleLines,
                action.action,
                subcontext
            );
            return {
                state: { ...state, finishScheduleLines: inner.state },
                data: { ...data, finishScheduleLines: inner.data },
            };
        }
        case "FINISH_SCHEDULE_DATE": {
            const inner = Fields.finishScheduleDate.reduce(
                state.finishScheduleDate,
                data.finishScheduleDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, finishScheduleDate: inner.state },
                data: { ...data, finishScheduleDate: inner.data },
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
    finishScheduleContacts: function (
        props: WidgetExtraProps<typeof Fields.finishScheduleContacts> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "FINISH_SCHEDULE_CONTACTS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "finishScheduleContacts",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.finishScheduleContacts.component
                state={context.state.finishScheduleContacts}
                data={context.data.finishScheduleContacts}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Finish Schedule Contacts"}
            />
        );
    },
    finishScheduleScopeOfWork: function (
        props: WidgetExtraProps<typeof Fields.finishScheduleScopeOfWork> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "FINISH_SCHEDULE_SCOPE_OF_WORK",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "finishScheduleScopeOfWork",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.finishScheduleScopeOfWork.component
                state={context.state.finishScheduleScopeOfWork}
                data={context.data.finishScheduleScopeOfWork}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Finish Schedule Scope of Work"}
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
    finishScheduleLines: function (
        props: WidgetExtraProps<typeof Fields.finishScheduleLines> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "FINISH_SCHEDULE_LINES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "finishScheduleLines",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.finishScheduleLines.component
                state={context.state.finishScheduleLines}
                data={context.data.finishScheduleLines}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Finish Schedule Lines"}
            />
        );
    },
    finishScheduleDate: function (
        props: WidgetExtraProps<typeof Fields.finishScheduleDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "FINISH_SCHEDULE_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "finishScheduleDate",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.finishScheduleDate.component
                state={context.state.finishScheduleDate}
                data={context.data.finishScheduleDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Finish Schedule Date"}
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
        let finishScheduleContactsState;
        {
            const inner = Fields.finishScheduleContacts.initialize(
                data.finishScheduleContacts,
                subcontext,
                subparameters.finishScheduleContacts
            );
            finishScheduleContactsState = inner.state;
            data = { ...data, finishScheduleContacts: inner.data };
        }
        let finishScheduleScopeOfWorkState;
        {
            const inner = Fields.finishScheduleScopeOfWork.initialize(
                data.finishScheduleScopeOfWork,
                subcontext,
                subparameters.finishScheduleScopeOfWork
            );
            finishScheduleScopeOfWorkState = inner.state;
            data = { ...data, finishScheduleScopeOfWork: inner.data };
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
        let finishScheduleLinesState;
        {
            const inner = Fields.finishScheduleLines.initialize(
                data.finishScheduleLines,
                subcontext,
                subparameters.finishScheduleLines
            );
            finishScheduleLinesState = inner.state;
            data = { ...data, finishScheduleLines: inner.data };
        }
        let finishScheduleDateState;
        {
            const inner = Fields.finishScheduleDate.initialize(
                data.finishScheduleDate,
                subcontext,
                subparameters.finishScheduleDate
            );
            finishScheduleDateState = inner.state;
            data = { ...data, finishScheduleDate: inner.data };
        }
        let state = {
            initialParameters: parameters,
            customer: customerState,
            finishScheduleContacts: finishScheduleContactsState,
            finishScheduleScopeOfWork: finishScheduleScopeOfWorkState,
            completionDate: completionDateState,
            finishScheduleLines: finishScheduleLinesState,
            finishScheduleDate: finishScheduleDateState,
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
    finishScheduleContacts: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.finishScheduleContacts>
    >;
    finishScheduleScopeOfWork: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.finishScheduleScopeOfWork>
    >;
    completionDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.completionDate>
    >;
    finishScheduleLines: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.finishScheduleLines>
    >;
    finishScheduleDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.finishScheduleDate>
    >;
};
// END MAGIC -- DO NOT EDIT
