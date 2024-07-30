import { faIdCard, faToolbox } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Button, Dropdown } from "react-bootstrap";
import { storeRecord } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { newUUID, UUID } from "../../clay/uuid";
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
import { LinkSetWidget } from "../../clay/widgets/link-set-widget";
import { ListWidget } from "../../clay/widgets/ListWidget";
import { SimpleListWrapper } from "../../clay/widgets/SimpleListWrapper";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { ContactLinkWidget } from "../contact/link";
import { ProjectLinkWidget } from "../project/link";
import { RichTextWidget } from "../rich-text-widget";
import { useUser } from "../state";
import { THREAD_META } from "../thread";
import { USER_META } from "../user/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import { NewThreadData, NEW_THREAD_DATA_META } from "./OldThreadWidget.widget";
import { ITEM_TYPE } from "./types";
import { useLocalWidget } from "./useLocalWidget";

export type Data = NewThreadData;

export const Fields = {
    to: FormField(
        LinkSetWidget({
            meta: USER_META,
            name: (user) => user.name,
            filter: (user) => user.active,
        })
    ),
    subject: FormField(TextWidget),
    message: RichTextWidget,
    projects: ListWidget(
        SimpleListWrapper(
            ProjectLinkWidget,
            <td>
                <FontAwesomeIcon icon={faToolbox} style={{ width: "2em" }} />
            </td>
        ),
        { emptyOk: true }
    ),
    contacts: ListWidget(
        SimpleListWrapper(
            ContactLinkWidget,
            <td>
                <FontAwesomeIcon icon={faIdCard} style={{ width: "2em" }} />
            </td>
        ),
        { emptyOk: true }
    ),
};

function actionAttachProject(state: State, data: NewThreadData) {
    return {
        state: {
            ...state,
            projects: {
                ...state.projects,
                items: [...state.projects.items, { text: null }],
            },
        },
        data: {
            ...data,
            projects: [...data.projects, null],
        },
    };
}

function actionAttachContact(state: State, data: NewThreadData) {
    return {
        state: {
            ...state,
            contacts: {
                ...state.contacts,
                items: [...state.contacts.items, { text: null }],
            },
        },
        data: {
            ...data,
            contacts: [...data.contacts, null],
        },
    };
}

export function Component(props: Props) {
    return (
        <MessageBody>
            <widgets.to />
            <widgets.subject />
            <widgets.message />
            <table>
                <widgets.projects containerClass="tbody" />
                <widgets.contacts containerClass="tbody" />
            </table>
        </MessageBody>
    );
}

function NewThread(props: {
    setOpenItem: (item: ITEM_TYPE | null) => void;
    project?: UUID;
}) {
    const user = useUser();

    const { component, data, isValid, dispatch } = useLocalWidget(Widget);

    const onSend = React.useCallback(() => {
        storeRecord(THREAD_META, "inbox", {
            id: newUUID(),
            recordVersion: { version: null },
            subject: data.subject,
            to: [user.id, ...data.to],
            hidden: [user.id],
            read: [user.id],
            project: props.project
                ? [props.project.uuid, ...data.projects]
                : data.projects,
            contacts: data.contacts,
            messages: [
                {
                    author: user.id,
                    datetime: new Date(),
                    message: data.message,
                },
            ],
        }).then((result) =>
            props.setOpenItem({
                type: "thread",
                id: result!.id.uuid,
            })
        );
    }, [data, user, props.project, props.setOpenItem]);

    const onCancel = React.useCallback(() => {
        props.setOpenItem(null);
    }, [props.setOpenItem]);

    const clickAttachProject = React.useCallback(
        () =>
            dispatch({
                type: "ATTACH_PROJECT",
            }),
        [dispatch]
    );
    const clickAttachContact = React.useCallback(
        () =>
            dispatch({
                type: "ATTACH_CONTACT",
            }),
        [dispatch]
    );

    return (
        <>
            <MessageHeader>New Thread</MessageHeader>
            {component}
            <MessageFooter>
                <Dropdown style={{ display: "block" }} drop="up">
                    <Dropdown.Toggle id="dropdown-attach">
                        Attach
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={clickAttachProject}>
                            <FontAwesomeIcon icon={faToolbox} /> Project
                        </Dropdown.Item>
                        <Dropdown.Item onClick={clickAttachContact}>
                            <FontAwesomeIcon icon={faIdCard} /> Contact
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                <Button
                    style={{ marginLeft: "auto", display: "block" }}
                    disabled={!isValid}
                    onClick={onSend}
                >
                    Send
                </Button>
                <Button
                    variant="danger"
                    style={{ display: "block", marginLeft: "auto" }}
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            </MessageFooter>
        </>
    );
}

export const NEW_THREAD_SOURCE = {
    Component: NewThread,
};

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.to> &
    WidgetContext<typeof Fields.subject> &
    WidgetContext<typeof Fields.message> &
    WidgetContext<typeof Fields.projects> &
    WidgetContext<typeof Fields.contacts>;
type ExtraProps = {};
type BaseState = {
    to: WidgetState<typeof Fields.to>;
    subject: WidgetState<typeof Fields.subject>;
    message: WidgetState<typeof Fields.message>;
    projects: WidgetState<typeof Fields.projects>;
    contacts: WidgetState<typeof Fields.contacts>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "TO"; action: WidgetAction<typeof Fields.to> }
    | { type: "SUBJECT"; action: WidgetAction<typeof Fields.subject> }
    | { type: "MESSAGE"; action: WidgetAction<typeof Fields.message> }
    | { type: "PROJECTS"; action: WidgetAction<typeof Fields.projects> }
    | { type: "CONTACTS"; action: WidgetAction<typeof Fields.contacts> }
    | { type: "ATTACH_PROJECT" }
    | { type: "ATTACH_CONTACT" };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.to, data.to, cache, "to", errors);
    subvalidate(Fields.subject, data.subject, cache, "subject", errors);
    subvalidate(Fields.message, data.message, cache, "message", errors);
    subvalidate(Fields.projects, data.projects, cache, "projects", errors);
    subvalidate(Fields.contacts, data.contacts, cache, "contacts", errors);
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
        case "TO": {
            const inner = Fields.to.reduce(
                state.to,
                data.to,
                action.action,
                subcontext
            );
            return {
                state: { ...state, to: inner.state },
                data: { ...data, to: inner.data },
            };
        }
        case "SUBJECT": {
            const inner = Fields.subject.reduce(
                state.subject,
                data.subject,
                action.action,
                subcontext
            );
            return {
                state: { ...state, subject: inner.state },
                data: { ...data, subject: inner.data },
            };
        }
        case "MESSAGE": {
            const inner = Fields.message.reduce(
                state.message,
                data.message,
                action.action,
                subcontext
            );
            return {
                state: { ...state, message: inner.state },
                data: { ...data, message: inner.data },
            };
        }
        case "PROJECTS": {
            const inner = Fields.projects.reduce(
                state.projects,
                data.projects,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projects: inner.state },
                data: { ...data, projects: inner.data },
            };
        }
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
        case "ATTACH_PROJECT":
            return actionAttachProject(state, data);
        case "ATTACH_CONTACT":
            return actionAttachContact(state, data);
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
    to: function (
        props: WidgetExtraProps<typeof Fields.to> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "TO", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "to", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.to.component
                state={context.state.to}
                data={context.data.to}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "To"}
            />
        );
    },
    subject: function (
        props: WidgetExtraProps<typeof Fields.subject> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SUBJECT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "subject", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.subject.component
                state={context.state.subject}
                data={context.data.subject}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Subject"}
            />
        );
    },
    message: function (
        props: WidgetExtraProps<typeof Fields.message> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "MESSAGE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "message", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.message.component
                state={context.state.message}
                data={context.data.message}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Message"}
            />
        );
    },
    projects: function (
        props: WidgetExtraProps<typeof Fields.projects> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECTS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "projects", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projects.component
                state={context.state.projects}
                data={context.data.projects}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Projects"}
            />
        );
    },
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: NEW_THREAD_DATA_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let toState;
        {
            const inner = Fields.to.initialize(
                data.to,
                subcontext,
                subparameters.to
            );
            toState = inner.state;
            data = { ...data, to: inner.data };
        }
        let subjectState;
        {
            const inner = Fields.subject.initialize(
                data.subject,
                subcontext,
                subparameters.subject
            );
            subjectState = inner.state;
            data = { ...data, subject: inner.data };
        }
        let messageState;
        {
            const inner = Fields.message.initialize(
                data.message,
                subcontext,
                subparameters.message
            );
            messageState = inner.state;
            data = { ...data, message: inner.data };
        }
        let projectsState;
        {
            const inner = Fields.projects.initialize(
                data.projects,
                subcontext,
                subparameters.projects
            );
            projectsState = inner.state;
            data = { ...data, projects: inner.data };
        }
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
        let state = {
            initialParameters: parameters,
            to: toState,
            subject: subjectState,
            message: messageState,
            projects: projectsState,
            contacts: contactsState,
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
                <RecordContext meta={NEW_THREAD_DATA_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    to: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.to>
    >;
    subject: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.subject>
    >;
    message: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.message>
    >;
    projects: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projects>
    >;
    contacts: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contacts>
    >;
};
// END MAGIC -- DO NOT EDIT
