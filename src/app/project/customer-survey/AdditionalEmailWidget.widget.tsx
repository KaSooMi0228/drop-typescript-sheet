import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { RecordMeta } from "../../../clay/meta";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { EmailWidget } from "../../../clay/widgets/EmailWidget";
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
import { TableRow } from "../../../clay/widgets/TableRow";
import { TextWidget } from "../../../clay/widgets/TextWidget";

//!Data
export type AdditionalEmail = {
    name: string;
    email: string;
};

export type Data = AdditionalEmail;

const Fields = {
    name: TextWidget,
    email: EmailWidget,
};

function Component(props: Props) {
    return (
        <TableRow>
            <widgets.name />
            <widgets.email />
        </TableRow>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
export type AdditionalEmailJSON = {
    name: string;
    email: string;
};

export function JSONToAdditionalEmail(
    json: AdditionalEmailJSON
): AdditionalEmail {
    return {
        name: json.name,
        email: json.email,
    };
}
export type AdditionalEmailBrokenJSON = {
    name?: string;
    email?: string;
};

export function newAdditionalEmail(): AdditionalEmail {
    return JSONToAdditionalEmail(repairAdditionalEmailJSON(undefined));
}
export function repairAdditionalEmailJSON(
    json: AdditionalEmailBrokenJSON | undefined
): AdditionalEmailJSON {
    if (json) {
        return {
            name: json.name || "",
            email: json.email || "",
        };
    } else {
        return {
            name: undefined || "",
            email: undefined || "",
        };
    }
}

export function AdditionalEmailToJSON(
    value: AdditionalEmail
): AdditionalEmailJSON {
    return {
        name: value.name,
        email: value.email,
    };
}

export const ADDITIONAL_EMAIL_META: RecordMeta<
    AdditionalEmail,
    AdditionalEmailJSON,
    AdditionalEmailBrokenJSON
> & { name: "AdditionalEmail" } = {
    name: "AdditionalEmail",
    type: "record",
    repair: repairAdditionalEmailJSON,
    toJSON: AdditionalEmailToJSON,
    fromJSON: JSONToAdditionalEmail,
    fields: {
        name: { type: "string" },
        email: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.email>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    email: WidgetState<typeof Fields.email>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "EMAIL"; action: WidgetAction<typeof Fields.email> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.email, data.email, cache, "email", errors);
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
        case "NAME": {
            const inner = Fields.name.reduce(
                state.name,
                data.name,
                action.action,
                subcontext
            );
            return {
                state: { ...state, name: inner.state },
                data: { ...data, name: inner.data },
            };
        }
        case "EMAIL": {
            const inner = Fields.email.reduce(
                state.email,
                data.email,
                action.action,
                subcontext
            );
            return {
                state: { ...state, email: inner.state },
                data: { ...data, email: inner.data },
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
    name: function (
        props: WidgetExtraProps<typeof Fields.name> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "NAME", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "name", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.name.component
                state={context.state.name}
                data={context.data.name}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Name"}
            />
        );
    },
    email: function (
        props: WidgetExtraProps<typeof Fields.email> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "EMAIL", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "email", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.email.component
                state={context.state.email}
                data={context.data.email}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Email"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ADDITIONAL_EMAIL_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let nameState;
        {
            const inner = Fields.name.initialize(
                data.name,
                subcontext,
                subparameters.name
            );
            nameState = inner.state;
            data = { ...data, name: inner.data };
        }
        let emailState;
        {
            const inner = Fields.email.initialize(
                data.email,
                subcontext,
                subparameters.email
            );
            emailState = inner.state;
            data = { ...data, email: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            email: emailState,
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
                <RecordContext meta={ADDITIONAL_EMAIL_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    name: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.name>
    >;
    email: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.email>
    >;
};
// END MAGIC -- DO NOT EDIT
