import * as React from "react";
import { Dictionary } from "../../clay/common";
import { PageContext } from "../../clay/Page";
import { PaginatedWidget } from "../../clay/paginated-widget";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { SaveButton } from "../../clay/save-button";
import { StaticDateTimeWidget } from "../../clay/widgets/DateTimeWidget";
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
import { ListWidget } from "../../clay/widgets/ListWidget";
import { hasPermission } from "../../permissions";
import { useUser } from "../state";
import UserAndDateWidget from "../user-and-date/UserAndDateWidget.widget";
import LockedWidget from "./locked/LockedWidget.widget";
import { Project, PROJECT_META } from "./table";

export type Data = Project;

export const Fields = {
    warrantyNotRequiredDate: FormField(StaticDateTimeWidget),
    warrantyNotRequiredNotes: FormField(ListWidget(LockedWidget)),
    warrantyNotRequiredApproval: OptionalFormField(UserAndDateWidget),
};

function Component(props: Props) {
    const user = useUser();
    const onSave = React.useCallback(() => {
        props.dispatch({
            type: "WARRANTY_NOT_REQUIRED_DATE",
            action: {
                type: "SET",
                value: new Date(),
            },
        });
    }, [props.dispatch]);

    return (
        <>
            <widgets.warrantyNotRequiredDate />
            <widgets.warrantyNotRequiredNotes
                label="Why is a warranty not required?"
                addButtonText="Add Note"
            />
            <widgets.warrantyNotRequiredApproval
                label="Warranty exemption authorized by"
                disableSet={
                    !hasPermission(
                        user,
                        "Project",
                        "approve-warranty-not-required"
                    )
                }
                enableReset={hasPermission(
                    user,
                    "Project",
                    "approve-warranty-not-required"
                )}
                setLabel="Approve Warranty Exemption"
            />
            <SaveButton
                label="Save"
                preSave={onSave}
                disabled={props.status.validation.length > 0}
            />
        </>
    );
}

export const WarrantySkipWidget = PaginatedWidget<Project, PageContext>({
    dataMeta: PROJECT_META,
    pages() {
        return [
            {
                id: "main",
                title: "Main",
                widget: Widget,
            },
        ];
    },
});

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.warrantyNotRequiredDate> &
    WidgetContext<typeof Fields.warrantyNotRequiredNotes> &
    WidgetContext<typeof Fields.warrantyNotRequiredApproval>;
type ExtraProps = {};
type BaseState = {
    warrantyNotRequiredDate: WidgetState<typeof Fields.warrantyNotRequiredDate>;
    warrantyNotRequiredNotes: WidgetState<
        typeof Fields.warrantyNotRequiredNotes
    >;
    warrantyNotRequiredApproval: WidgetState<
        typeof Fields.warrantyNotRequiredApproval
    >;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "WARRANTY_NOT_REQUIRED_DATE";
          action: WidgetAction<typeof Fields.warrantyNotRequiredDate>;
      }
    | {
          type: "WARRANTY_NOT_REQUIRED_NOTES";
          action: WidgetAction<typeof Fields.warrantyNotRequiredNotes>;
      }
    | {
          type: "WARRANTY_NOT_REQUIRED_APPROVAL";
          action: WidgetAction<typeof Fields.warrantyNotRequiredApproval>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.warrantyNotRequiredDate,
        data.warrantyNotRequiredDate,
        cache,
        "warrantyNotRequiredDate",
        errors
    );
    subvalidate(
        Fields.warrantyNotRequiredNotes,
        data.warrantyNotRequiredNotes,
        cache,
        "warrantyNotRequiredNotes",
        errors
    );
    subvalidate(
        Fields.warrantyNotRequiredApproval,
        data.warrantyNotRequiredApproval,
        cache,
        "warrantyNotRequiredApproval",
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
        case "WARRANTY_NOT_REQUIRED_DATE": {
            const inner = Fields.warrantyNotRequiredDate.reduce(
                state.warrantyNotRequiredDate,
                data.warrantyNotRequiredDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, warrantyNotRequiredDate: inner.state },
                data: { ...data, warrantyNotRequiredDate: inner.data },
            };
        }
        case "WARRANTY_NOT_REQUIRED_NOTES": {
            const inner = Fields.warrantyNotRequiredNotes.reduce(
                state.warrantyNotRequiredNotes,
                data.warrantyNotRequiredNotes,
                action.action,
                subcontext
            );
            return {
                state: { ...state, warrantyNotRequiredNotes: inner.state },
                data: { ...data, warrantyNotRequiredNotes: inner.data },
            };
        }
        case "WARRANTY_NOT_REQUIRED_APPROVAL": {
            const inner = Fields.warrantyNotRequiredApproval.reduce(
                state.warrantyNotRequiredApproval,
                data.warrantyNotRequiredApproval,
                action.action,
                subcontext
            );
            return {
                state: { ...state, warrantyNotRequiredApproval: inner.state },
                data: { ...data, warrantyNotRequiredApproval: inner.data },
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
    warrantyNotRequiredDate: function (
        props: WidgetExtraProps<typeof Fields.warrantyNotRequiredDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "WARRANTY_NOT_REQUIRED_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "warrantyNotRequiredDate",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.warrantyNotRequiredDate.component
                state={context.state.warrantyNotRequiredDate}
                data={context.data.warrantyNotRequiredDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Warranty Not Required Date"}
            />
        );
    },
    warrantyNotRequiredNotes: function (
        props: WidgetExtraProps<typeof Fields.warrantyNotRequiredNotes> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "WARRANTY_NOT_REQUIRED_NOTES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "warrantyNotRequiredNotes",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.warrantyNotRequiredNotes.component
                state={context.state.warrantyNotRequiredNotes}
                data={context.data.warrantyNotRequiredNotes}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Warranty Not Required Notes"}
            />
        );
    },
    warrantyNotRequiredApproval: function (
        props: WidgetExtraProps<typeof Fields.warrantyNotRequiredApproval> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "WARRANTY_NOT_REQUIRED_APPROVAL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "warrantyNotRequiredApproval",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.warrantyNotRequiredApproval.component
                state={context.state.warrantyNotRequiredApproval}
                data={context.data.warrantyNotRequiredApproval}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Warranty Not Required Approval"}
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
        let warrantyNotRequiredDateState;
        {
            const inner = Fields.warrantyNotRequiredDate.initialize(
                data.warrantyNotRequiredDate,
                subcontext,
                subparameters.warrantyNotRequiredDate
            );
            warrantyNotRequiredDateState = inner.state;
            data = { ...data, warrantyNotRequiredDate: inner.data };
        }
        let warrantyNotRequiredNotesState;
        {
            const inner = Fields.warrantyNotRequiredNotes.initialize(
                data.warrantyNotRequiredNotes,
                subcontext,
                subparameters.warrantyNotRequiredNotes
            );
            warrantyNotRequiredNotesState = inner.state;
            data = { ...data, warrantyNotRequiredNotes: inner.data };
        }
        let warrantyNotRequiredApprovalState;
        {
            const inner = Fields.warrantyNotRequiredApproval.initialize(
                data.warrantyNotRequiredApproval,
                subcontext,
                subparameters.warrantyNotRequiredApproval
            );
            warrantyNotRequiredApprovalState = inner.state;
            data = { ...data, warrantyNotRequiredApproval: inner.data };
        }
        let state = {
            initialParameters: parameters,
            warrantyNotRequiredDate: warrantyNotRequiredDateState,
            warrantyNotRequiredNotes: warrantyNotRequiredNotesState,
            warrantyNotRequiredApproval: warrantyNotRequiredApprovalState,
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
    warrantyNotRequiredDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.warrantyNotRequiredDate>
    >;
    warrantyNotRequiredNotes: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.warrantyNotRequiredNotes>
    >;
    warrantyNotRequiredApproval: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.warrantyNotRequiredApproval>
    >;
};
// END MAGIC -- DO NOT EDIT
