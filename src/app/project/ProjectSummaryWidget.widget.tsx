import * as React from "react";
import { Button } from "react-bootstrap";
import { storeRecord } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { DeleteButton } from "../../clay/delete-button";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { newUUID } from "../../clay/uuid";
import { Optional } from "../../clay/widgets/FormField";
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
import { EmailPopupButton } from "./email-popup";
import { PersonnelListWidget } from "./personnel/list-widget";
import {
    isProjectLocked,
    Project,
    PROJECT_META,
    PROJECT_UNLOCK_REQUEST_META,
} from "./table";

export type Data = Project;

export const Fields = {
    personnel: Optional(PersonnelListWidget),
};

function Component(props: Props) {
    const requestUnlock = React.useCallback(() => {
        storeRecord(PROJECT_UNLOCK_REQUEST_META, "project", {
            id: newUUID(),
            recordVersion: { version: null },
            project: props.data.id.uuid,
            addedBy: null,
            addedDateTime: null,
        }).then(() => {
            alert("Unlock Requested.");
        });
    }, [props.data.id]);

    return (
        <div>
            <EmailPopupButton
                subject="Project Update"
                project={props.data}
                prefix="update-"
            >
                Send Project Update
            </EmailPopupButton>
            <Button
                onClick={() => {
                    window.open(
                        "/server/project-files/" + props.data.projectNumber
                    );
                }}
            >
                Add Files
            </Button>
            {isProjectLocked(props.data) && (
                <Button onClick={requestUnlock}>Request Unlock</Button>
            )}
            <DeleteButton />
        </div>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.personnel>;
type ExtraProps = {};
type BaseState = {
    personnel: WidgetState<typeof Fields.personnel>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "PERSONNEL";
    action: WidgetAction<typeof Fields.personnel>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.personnel, data.personnel, cache, "personnel", errors);
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
        case "PERSONNEL": {
            const inner = Fields.personnel.reduce(
                state.personnel,
                data.personnel,
                action.action,
                subcontext
            );
            return {
                state: { ...state, personnel: inner.state },
                data: { ...data, personnel: inner.data },
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
    personnel: function (
        props: WidgetExtraProps<typeof Fields.personnel> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PERSONNEL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "personnel", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.personnel.component
                state={context.state.personnel}
                data={context.data.personnel}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Personnel"}
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
        let personnelState;
        {
            const inner = Fields.personnel.initialize(
                data.personnel,
                subcontext,
                subparameters.personnel
            );
            personnelState = inner.state;
            data = { ...data, personnel: inner.data };
        }
        let state = {
            initialParameters: parameters,
            personnel: personnelState,
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
    personnel: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.personnel>
    >;
};
// END MAGIC -- DO NOT EDIT
