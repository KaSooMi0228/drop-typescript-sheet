import { format as formatDate } from "date-fns";
import Decimal from "decimal.js";
import * as React from "react";
import { FormControl, Table } from "react-bootstrap";
import { useRecordQuery } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { DeleteButton } from "../../clay/delete-button";
import { propCheck } from "../../clay/propCheck";
import { sumMap } from "../../clay/queryFuncs";
import { QuickCacheApi, useQuickAllRecords } from "../../clay/quick-cache";
import { DropdownLinkWidget } from "../../clay/widgets/dropdown-link-widget";
import {
    FormField,
    FormWrapper,
    OptionalFormField,
} from "../../clay/widgets/FormField";
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
import { FieldRow } from "../../clay/widgets/layout";
import { LinkSetWidget } from "../../clay/widgets/link-set-widget";
import { ListWidget } from "../../clay/widgets/ListWidget";
import { TagsWidget } from "../../clay/widgets/tags-widget";
import { ContactSetWidget } from "../contact/contact-set-widget";
import { ESTIMATE_META } from "../estimate/table";
import { TIME_AND_MATERIALS_ESTIMATE_META } from "../estimate/time-and-materials/table";
import { ReactContext as ProjectQuotationsWidgetReactContext } from "../project/ProjectQuotationsWidget.widget";
import { ROLE_ESTIMATOR, USER_META } from "../user/table";
import EstimatorWidget from "./RoleWithPercentage.widget";
import { Quotation, QUOTATION_META } from "./table";
import { QUOTATION_TYPE_META } from "./type/table";

export type Data = Quotation;

const Fields = {
    estimates: FormField(
        LinkSetWidget({
            meta: ESTIMATE_META,
            name: (estimate) =>
                `${estimate.common.name} ${
                    estimate.common.creationDate &&
                    formatDate(estimate.common.creationDate, "Y-M-d p")
                }`,
        })
    ),
    quotationType: FormField(
        DropdownLinkWidget({
            meta: QUOTATION_TYPE_META,
            label: (record) => record.name,
        })
    ),
    addressedContacts: FormField(ContactSetWidget),
    estimators: ListWidget(EstimatorWidget),
    tags: OptionalFormField(TagsWidget),
};

function validate(data: Data, cache: QuickCacheApi) {
    const errors = baseValidate(data, cache);

    if (
        !sumMap(data.estimators, (x) => x.percentage).equals(new Decimal("1"))
    ) {
        data.estimators.forEach((value, index) => {
            errors.push({
                invalid: true,
                empty: false,
                field: "estimators",
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

    if (data.initialized) {
        return errors.filter((error) => error.field != "estimates");
    } else {
        return errors;
    }
}

function Component(props: Props) {
    const projectContext = React.useContext(
        ProjectQuotationsWidgetReactContext
    )!;
    const fullEstimates =
        useRecordQuery(
            ESTIMATE_META,
            {
                filters: [
                    {
                        column: "common.project",
                        filter: {
                            equal: props.data.project,
                        },
                    },
                ],
                sorts: ["common.creationDate"],
            },
            [props.data.project]
        ) || [];

    const timeAndMaterialEstimates =
        useRecordQuery(
            TIME_AND_MATERIALS_ESTIMATE_META,
            {
                filters: [
                    {
                        column: "common.project",
                        filter: {
                            equal: props.data.project,
                        },
                    },
                ],
                sorts: ["common.creationDate"],
            },
            [props.data.project]
        ) || [];

    const estimates = [...fullEstimates, ...timeAndMaterialEstimates];

    const users = useQuickAllRecords(USER_META) || [];

    return (
        <>
            <FieldRow>
                <widgets.estimates records={estimates as any} />
            </FieldRow>
            <Table style={{ width: "max-content" }}>
                <thead>
                    <tr>
                        <th />
                        <th>Estimator</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <widgets.estimators
                    containerClass="tbody"
                    extraItemForAdd
                    itemProps={{ role: ROLE_ESTIMATOR }}
                />
            </Table>
            <FieldRow>
                <FormWrapper label="Proposal Number">
                    <FormControl
                        type="text"
                        readOnly
                        value={`${projectContext.data.projectNumber}-${props.data.number}`}
                    />
                </FormWrapper>

                <widgets.quotationType label="Proposal Type" />
            </FieldRow>
            <FieldRow>
                <widgets.addressedContacts
                    label="Address Proposal To:"
                    contacts={[
                        ...projectContext.data.billingContacts,
                        ...projectContext.data.contacts,
                    ]}
                />

                <widgets.tags />
            </FieldRow>
            <DeleteButton />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.estimates> &
    WidgetContext<typeof Fields.quotationType> &
    WidgetContext<typeof Fields.addressedContacts> &
    WidgetContext<typeof Fields.estimators> &
    WidgetContext<typeof Fields.tags>;
type ExtraProps = {};
type BaseState = {
    estimates: WidgetState<typeof Fields.estimates>;
    quotationType: WidgetState<typeof Fields.quotationType>;
    addressedContacts: WidgetState<typeof Fields.addressedContacts>;
    estimators: WidgetState<typeof Fields.estimators>;
    tags: WidgetState<typeof Fields.tags>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "ESTIMATES"; action: WidgetAction<typeof Fields.estimates> }
    | {
          type: "QUOTATION_TYPE";
          action: WidgetAction<typeof Fields.quotationType>;
      }
    | {
          type: "ADDRESSED_CONTACTS";
          action: WidgetAction<typeof Fields.addressedContacts>;
      }
    | { type: "ESTIMATORS"; action: WidgetAction<typeof Fields.estimators> }
    | { type: "TAGS"; action: WidgetAction<typeof Fields.tags> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.estimates, data.estimates, cache, "estimates", errors);
    subvalidate(
        Fields.quotationType,
        data.quotationType,
        cache,
        "quotationType",
        errors
    );
    subvalidate(
        Fields.addressedContacts,
        data.addressedContacts,
        cache,
        "addressedContacts",
        errors
    );
    subvalidate(
        Fields.estimators,
        data.estimators,
        cache,
        "estimators",
        errors
    );
    subvalidate(Fields.tags, data.tags, cache, "tags", errors);
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
        case "ESTIMATES": {
            const inner = Fields.estimates.reduce(
                state.estimates,
                data.estimates,
                action.action,
                subcontext
            );
            return {
                state: { ...state, estimates: inner.state },
                data: { ...data, estimates: inner.data },
            };
        }
        case "QUOTATION_TYPE": {
            const inner = Fields.quotationType.reduce(
                state.quotationType,
                data.quotationType,
                action.action,
                subcontext
            );
            return {
                state: { ...state, quotationType: inner.state },
                data: { ...data, quotationType: inner.data },
            };
        }
        case "ADDRESSED_CONTACTS": {
            const inner = Fields.addressedContacts.reduce(
                state.addressedContacts,
                data.addressedContacts,
                action.action,
                subcontext
            );
            return {
                state: { ...state, addressedContacts: inner.state },
                data: { ...data, addressedContacts: inner.data },
            };
        }
        case "ESTIMATORS": {
            const inner = Fields.estimators.reduce(
                state.estimators,
                data.estimators,
                action.action,
                subcontext
            );
            return {
                state: { ...state, estimators: inner.state },
                data: { ...data, estimators: inner.data },
            };
        }
        case "TAGS": {
            const inner = Fields.tags.reduce(
                state.tags,
                data.tags,
                action.action,
                subcontext
            );
            return {
                state: { ...state, tags: inner.state },
                data: { ...data, tags: inner.data },
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
    estimates: function (
        props: WidgetExtraProps<typeof Fields.estimates> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ESTIMATES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "estimates", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.estimates.component
                state={context.state.estimates}
                data={context.data.estimates}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Estimates"}
            />
        );
    },
    quotationType: function (
        props: WidgetExtraProps<typeof Fields.quotationType> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "QUOTATION_TYPE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "quotationType", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.quotationType.component
                state={context.state.quotationType}
                data={context.data.quotationType}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Quotation Type"}
            />
        );
    },
    addressedContacts: function (
        props: WidgetExtraProps<typeof Fields.addressedContacts> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ADDRESSED_CONTACTS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "addressedContacts",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.addressedContacts.component
                state={context.state.addressedContacts}
                data={context.data.addressedContacts}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Addressed Contacts"}
            />
        );
    },
    estimators: function (
        props: WidgetExtraProps<typeof Fields.estimators> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ESTIMATORS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "estimators", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.estimators.component
                state={context.state.estimators}
                data={context.data.estimators}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Estimators"}
            />
        );
    },
    tags: function (
        props: WidgetExtraProps<typeof Fields.tags> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "TAGS", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "tags", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.tags.component
                state={context.state.tags}
                data={context.data.tags}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Tags"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: QUOTATION_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let estimatesState;
        {
            const inner = Fields.estimates.initialize(
                data.estimates,
                subcontext,
                subparameters.estimates
            );
            estimatesState = inner.state;
            data = { ...data, estimates: inner.data };
        }
        let quotationTypeState;
        {
            const inner = Fields.quotationType.initialize(
                data.quotationType,
                subcontext,
                subparameters.quotationType
            );
            quotationTypeState = inner.state;
            data = { ...data, quotationType: inner.data };
        }
        let addressedContactsState;
        {
            const inner = Fields.addressedContacts.initialize(
                data.addressedContacts,
                subcontext,
                subparameters.addressedContacts
            );
            addressedContactsState = inner.state;
            data = { ...data, addressedContacts: inner.data };
        }
        let estimatorsState;
        {
            const inner = Fields.estimators.initialize(
                data.estimators,
                subcontext,
                subparameters.estimators
            );
            estimatorsState = inner.state;
            data = { ...data, estimators: inner.data };
        }
        let tagsState;
        {
            const inner = Fields.tags.initialize(
                data.tags,
                subcontext,
                subparameters.tags
            );
            tagsState = inner.state;
            data = { ...data, tags: inner.data };
        }
        let state = {
            initialParameters: parameters,
            estimates: estimatesState,
            quotationType: quotationTypeState,
            addressedContacts: addressedContactsState,
            estimators: estimatorsState,
            tags: tagsState,
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
                <RecordContext meta={QUOTATION_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    estimates: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.estimates>
    >;
    quotationType: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.quotationType>
    >;
    addressedContacts: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.addressedContacts>
    >;
    estimators: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.estimators>
    >;
    tags: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.tags>
    >;
};
// END MAGIC -- DO NOT EDIT
