import * as React from "react";
import { Alert } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { GenerateButton } from "../../clay/generate-button";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
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
import { TextAreaWidget } from "../../clay/widgets/TextAreaWidget";
import UserAndDateWidget from "../user-and-date/UserAndDateWidget.widget";
import {
    calcPayoutHasExtraCompensation,
    calcPayoutHasMarginVariance,
    Payout,
    PAYOUT_META,
} from "./table";

export type Data = Payout;

export const Fields = {
    addedToAccountingSoftware: FormField(UserAndDateWidget),
    marginVarianceApproved: FormField(UserAndDateWidget),
    marginVarianceReason: OptionalFormField(TextAreaWidget),
};

function Component(props: Props) {
    const needsMarginVarianceApproval =
        (calcPayoutHasExtraCompensation(props.data) ||
            calcPayoutHasMarginVariance(props.data)) &&
        props.data.marginVarianceApproved.date === null;

    return (
        <>
            <widgets.addedToAccountingSoftware
                label="Payout Processing Date"
                disableSet={true}
                enableReset={true}
            />
            {needsMarginVarianceApproval && (
                <Alert variant="danger">
                    Margin Variance Requires Approval
                </Alert>
            )}
            {props.data.marginVarianceReason.length > 0 && (
                <Alert variant="danger">
                    <ul>
                        {props.data.marginVarianceDescription.map(
                            (item, index) => (
                                <li key={index}>{item}</li>
                            )
                        )}
                    </ul>
                </Alert>
            )}
            <widgets.marginVarianceApproved />
            <widgets.marginVarianceReason />
            <GenerateButton
                disabled={needsMarginVarianceApproval}
                style={{ marginTop: "1em" }}
                detail="final"
            />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.addedToAccountingSoftware> &
    WidgetContext<typeof Fields.marginVarianceApproved> &
    WidgetContext<typeof Fields.marginVarianceReason>;
type ExtraProps = {};
type BaseState = {
    addedToAccountingSoftware: WidgetState<
        typeof Fields.addedToAccountingSoftware
    >;
    marginVarianceApproved: WidgetState<typeof Fields.marginVarianceApproved>;
    marginVarianceReason: WidgetState<typeof Fields.marginVarianceReason>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "ADDED_TO_ACCOUNTING_SOFTWARE";
          action: WidgetAction<typeof Fields.addedToAccountingSoftware>;
      }
    | {
          type: "MARGIN_VARIANCE_APPROVED";
          action: WidgetAction<typeof Fields.marginVarianceApproved>;
      }
    | {
          type: "MARGIN_VARIANCE_REASON";
          action: WidgetAction<typeof Fields.marginVarianceReason>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.addedToAccountingSoftware,
        data.addedToAccountingSoftware,
        cache,
        "addedToAccountingSoftware",
        errors
    );
    subvalidate(
        Fields.marginVarianceApproved,
        data.marginVarianceApproved,
        cache,
        "marginVarianceApproved",
        errors
    );
    subvalidate(
        Fields.marginVarianceReason,
        data.marginVarianceReason,
        cache,
        "marginVarianceReason",
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
        case "ADDED_TO_ACCOUNTING_SOFTWARE": {
            const inner = Fields.addedToAccountingSoftware.reduce(
                state.addedToAccountingSoftware,
                data.addedToAccountingSoftware,
                action.action,
                subcontext
            );
            return {
                state: { ...state, addedToAccountingSoftware: inner.state },
                data: { ...data, addedToAccountingSoftware: inner.data },
            };
        }
        case "MARGIN_VARIANCE_APPROVED": {
            const inner = Fields.marginVarianceApproved.reduce(
                state.marginVarianceApproved,
                data.marginVarianceApproved,
                action.action,
                subcontext
            );
            return {
                state: { ...state, marginVarianceApproved: inner.state },
                data: { ...data, marginVarianceApproved: inner.data },
            };
        }
        case "MARGIN_VARIANCE_REASON": {
            const inner = Fields.marginVarianceReason.reduce(
                state.marginVarianceReason,
                data.marginVarianceReason,
                action.action,
                subcontext
            );
            return {
                state: { ...state, marginVarianceReason: inner.state },
                data: { ...data, marginVarianceReason: inner.data },
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
    addedToAccountingSoftware: function (
        props: WidgetExtraProps<typeof Fields.addedToAccountingSoftware> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ADDED_TO_ACCOUNTING_SOFTWARE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "addedToAccountingSoftware",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.addedToAccountingSoftware.component
                state={context.state.addedToAccountingSoftware}
                data={context.data.addedToAccountingSoftware}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Added to Accounting Software"}
            />
        );
    },
    marginVarianceApproved: function (
        props: WidgetExtraProps<typeof Fields.marginVarianceApproved> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MARGIN_VARIANCE_APPROVED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "marginVarianceApproved",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.marginVarianceApproved.component
                state={context.state.marginVarianceApproved}
                data={context.data.marginVarianceApproved}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Margin Variance Approved"}
            />
        );
    },
    marginVarianceReason: function (
        props: WidgetExtraProps<typeof Fields.marginVarianceReason> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MARGIN_VARIANCE_REASON",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "marginVarianceReason",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.marginVarianceReason.component
                state={context.state.marginVarianceReason}
                data={context.data.marginVarianceReason}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Margin Variance Reason"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PAYOUT_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let addedToAccountingSoftwareState;
        {
            const inner = Fields.addedToAccountingSoftware.initialize(
                data.addedToAccountingSoftware,
                subcontext,
                subparameters.addedToAccountingSoftware
            );
            addedToAccountingSoftwareState = inner.state;
            data = { ...data, addedToAccountingSoftware: inner.data };
        }
        let marginVarianceApprovedState;
        {
            const inner = Fields.marginVarianceApproved.initialize(
                data.marginVarianceApproved,
                subcontext,
                subparameters.marginVarianceApproved
            );
            marginVarianceApprovedState = inner.state;
            data = { ...data, marginVarianceApproved: inner.data };
        }
        let marginVarianceReasonState;
        {
            const inner = Fields.marginVarianceReason.initialize(
                data.marginVarianceReason,
                subcontext,
                subparameters.marginVarianceReason
            );
            marginVarianceReasonState = inner.state;
            data = { ...data, marginVarianceReason: inner.data };
        }
        let state = {
            initialParameters: parameters,
            addedToAccountingSoftware: addedToAccountingSoftwareState,
            marginVarianceApproved: marginVarianceApprovedState,
            marginVarianceReason: marginVarianceReasonState,
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
                <RecordContext meta={PAYOUT_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    addedToAccountingSoftware: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.addedToAccountingSoftware>
    >;
    marginVarianceApproved: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.marginVarianceApproved>
    >;
    marginVarianceReason: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.marginVarianceReason>
    >;
};
// END MAGIC -- DO NOT EDIT
