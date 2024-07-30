import React from "react";
import { Button } from "react-bootstrap";
import { patchRecord, storeRecord } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { Link } from "../../clay/link";
import { RecordMeta } from "../../clay/meta";
import { propCheck } from "../../clay/propCheck";
import {
    QuickCacheApi,
    useQuickCache,
    useQuickRecord,
} from "../../clay/quick-cache";
import { UserPermissions } from "../../clay/server/api";
import { newUUID } from "../../clay/uuid";
import { FormWrapper } from "../../clay/widgets/FormField";
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
import { StaticTextField } from "../../clay/widgets/TextWidget";
import { calcProjectSummary, Project, PROJECT_META } from "../project/table";
import { RichTextWidget } from "../rich-text-widget";
import { Role, ROLE_META } from "../roles/table";
import { useUser } from "../state";
import { THREAD_META } from "../thread";
import {
    calcWarrantyReviewUnacceptedUsers,
    WarrantyReview,
    WARRANTY_REVIEW_META,
} from "../warranty-review/table";
import { WARRANTY_LENGTH_META } from "../warranty/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource from "./NotificationSource";
import { ITEM_TYPE } from "./types";
import { useLocalWidget } from "./useLocalWidget";
import { WarrantyReviewDetailsCommon } from "./warranty-review-common";

//!Data
export type AcceptRoleData = {
    message: string;
};

export type Data = AcceptRoleData;

export const Fields = {
    message: RichTextWidget,
};

export function Component(props: Props) {
    return <widgets.message />;
}

export function RoleName(props: { roleId: Link<Role> }) {
    const role = useQuickRecord(ROLE_META, props.roleId);
    return <>{role?.name}</>;
}

export function AcceptRoleProjectDetailsWidget(props: {
    review: WarrantyReview;
    project: Project;
}) {
    const cache = useQuickCache();
    return (
        <>
            <WarrantyReviewDetailsCommon
                project={props.project}
                review={props.review}
            />

            {props.project.warranties.map((warranty, index) => (
                <FieldRow key={index}>
                    <FormWrapper label="Warranty">
                        <StaticTextField value={warranty.name} />
                    </FormWrapper>
                    <FormWrapper label="Length">
                        <StaticTextField
                            value={
                                cache.get(WARRANTY_LENGTH_META, warranty.length)
                                    ?.name || ""
                            }
                        />
                    </FormWrapper>
                </FieldRow>
            ))}
            <FormWrapper label="Warranty Review Due Date">
                <StaticTextField
                    value={props.review.dueDate?.toString() || ""}
                />
            </FormWrapper>
        </>
    );
}

export async function rejectRoles(
    user: UserPermissions,
    review: WarrantyReview,
    message: string
) {
    const personnel_patch: any = { _t: "a" };
    review.personnel.forEach((entry, index) => {
        if (!entry.accepted && entry.user === user.id) {
            personnel_patch["_" + index] = [entry, 0, 0];
        }
    });
    await patchRecord(WARRANTY_REVIEW_META, "inbox", review.id.uuid, {
        personnel: personnel_patch,
    });
    await storeRecord(THREAD_META, "inbox", {
        id: newUUID(),
        recordVersion: { version: null },
        to: [
            user.id,
            ...review.personnel
                .filter(
                    (x) => x.user === user.id && !x.accepted && x.assignedBy
                )
                .map((x) => x.assignedBy),
        ],
        subject: "Role Assignment Rejected",
        hidden: [],
        read: [user.id],
        project: [review.id.uuid],
        contacts: [],
        messages: [
            {
                author: user.id,
                datetime: new Date(),
                message: message,
            },
        ],
    });
}

function WrapperComponent(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const user = useUser();
    const data = useQuickRecord(WARRANTY_REVIEW_META, props.id);
    const project = useQuickRecord(PROJECT_META, data?.project || null);
    const form = useLocalWidget(Widget);

    const onReject = React.useCallback(async () => {
        if (!data) {
            return;
        }

        rejectRoles(user, data, form.data.message);

        props.setOpenItem(null);
    }, [user.id, data, form.data.message, props.setOpenItem]);

    const onAccept = React.useCallback(async () => {
        if (!data) {
            return;
        }
        const personnel_patch: any = { _t: "a" };
        data.personnel.forEach((entry, index) => {
            if (!entry.accepted && entry.user === user.id) {
                personnel_patch[index] = {
                    accepted: [false, true],
                    acceptedDate: [null, new Date().toISOString()],
                };
            }
        });
        await patchRecord(WARRANTY_REVIEW_META, "inbox", props.id, {
            personnel: personnel_patch,
        });
        props.setOpenItem(null);
    }, [user.id, data, props.setOpenItem]);

    if (!data || !project) {
        return <></>;
    }
    return (
        <>
            <MessageHeader>
                {calcProjectSummary(project)} Accept Role
            </MessageHeader>
            <MessageBody>
                You have been assigned as:
                <ul>
                    {data.personnel
                        .filter((row) => !row.accepted && row.user === user.id)
                        .map((row, index) => (
                            <li key={index}>
                                <RoleName roleId={row.role} />
                            </li>
                        ))}
                </ul>
                <AcceptRoleProjectDetailsWidget
                    review={data}
                    project={project}
                />
                <FormWrapper label="Reason for Rejection">
                    {form.component}
                </FormWrapper>
            </MessageBody>
            <MessageFooter>
                <Button
                    variant="danger"
                    style={{ marginLeft: "auto", display: "block" }}
                    disabled={!form.isValid}
                    onClick={onReject}
                >
                    Reject
                </Button>
                <Button
                    style={{ marginLeft: "auto", display: "block" }}
                    disabled={false}
                    onClick={onAccept}
                >
                    Accept
                </Button>
            </MessageFooter>
        </>
    );
}

export const UNACCEPTED_WARRANTY_REVIEW_SOURCE = NotificationSource({
    key: "unaccepted-warranty-review",
    label: "Unaccepted Warranty Review",
    Component: WrapperComponent,
    table: WARRANTY_REVIEW_META,
    sendToUsers: calcWarrantyReviewUnacceptedUsers,
    date: (x) => x.dueDate,
});

// BEGIN MAGIC -- DO NOT EDIT
export type AcceptRoleDataJSON = {
    message: string;
};

export function JSONToAcceptRoleData(json: AcceptRoleDataJSON): AcceptRoleData {
    return {
        message: json.message,
    };
}
export type AcceptRoleDataBrokenJSON = {
    message?: string;
};

export function newAcceptRoleData(): AcceptRoleData {
    return JSONToAcceptRoleData(repairAcceptRoleDataJSON(undefined));
}
export function repairAcceptRoleDataJSON(
    json: AcceptRoleDataBrokenJSON | undefined
): AcceptRoleDataJSON {
    if (json) {
        return {
            message: json.message || "",
        };
    } else {
        return {
            message: undefined || "",
        };
    }
}

export function AcceptRoleDataToJSON(
    value: AcceptRoleData
): AcceptRoleDataJSON {
    return {
        message: value.message,
    };
}

export const ACCEPT_ROLE_DATA_META: RecordMeta<
    AcceptRoleData,
    AcceptRoleDataJSON,
    AcceptRoleDataBrokenJSON
> & { name: "AcceptRoleData" } = {
    name: "AcceptRoleData",
    type: "record",
    repair: repairAcceptRoleDataJSON,
    toJSON: AcceptRoleDataToJSON,
    fromJSON: JSONToAcceptRoleData,
    fields: {
        message: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

type Context = WidgetContext<typeof Fields.message>;
type ExtraProps = {};
type BaseState = {
    message: WidgetState<typeof Fields.message>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "MESSAGE";
    action: WidgetAction<typeof Fields.message>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.message, data.message, cache, "message", errors);
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ACCEPT_ROLE_DATA_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
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
        let state = {
            initialParameters: parameters,
            message: messageState,
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
                <RecordContext meta={ACCEPT_ROLE_DATA_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    message: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.message>
    >;
};
// END MAGIC -- DO NOT EDIT
