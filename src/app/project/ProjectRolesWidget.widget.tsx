import { faTimes, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { find, range, some } from "lodash";
import React from "react";
import { Badge, Button, Table } from "react-bootstrap";
import Select from "react-select";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../clay/quick-cache";
import { useQuickAllRecordsSorted } from "../../clay/widgets/dropdown-link-widget";
import { FormWrapper, Optional } from "../../clay/widgets/FormField";
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
import { ListAction } from "../../clay/widgets/ListWidget";
import { selectStyle } from "../../clay/widgets/SelectLinkWidget";
import { hasPermission } from "../../permissions";
import { Role, ROLE_META } from "../roles/table";
import { useUser } from "../state";
import {
    calcUserLabel,
    ROLE_CERTIFIED_FOREMAN,
    ROLE_OBSERVER,
    ROLE_ORDER,
    ROLE_SERVICE_REPRESENTATIVE,
    User,
    USER_META,
} from "../user/table";
import { PersonnelListWidget } from "./personnel/list-widget";
import { Action as ProjectPersonnelWidgetAction } from "./personnel/ProjectPersonnelWidget.widget";
import { ProjectPersonnel } from "./personnel/table";
import { Project, PROJECT_META } from "./table";

export type Data = Project;

export const Fields = {
    personnel: Optional(PersonnelListWidget),
};

function AddWidget(props: {
    personnel: ProjectPersonnel[];
    dispatch: (action: {
        type: "PERSONNEL";
        action: ListAction<ProjectPersonnelWidgetAction>;
    }) => void;
    stopAdding: () => void;
}) {
    const currentUserMeta = useUser();
    const currentUser = useQuickRecord(USER_META, currentUserMeta.id);
    const projectRoles = (
        useQuickAllRecordsSorted(ROLE_META, (role) => role.name) ?? []
    ).filter(
        (role) =>
            role.projectRole &&
            (role.id.uuid !== ROLE_CERTIFIED_FOREMAN ||
                hasPermission(
                    currentUserMeta,
                    "Project",
                    "assign-certified-foreman"
                ))
    );
    const users =
        useQuickAllRecordsSorted(USER_META, (user) => calcUserLabel(user)) ??
        [];
    const [role, setRole] = React.useState<null | Role>(null);
    const [user, setUser] = React.useState<null | User>(null);
    const onRoleChange = React.useCallback(
        (selected) => {
            if (selected) {
                setRole(selected);
                setUser(null);
            }
        },
        [setRole, setUser]
    );
    const onUserChange = React.useCallback(
        (selected) => {
            if (selected) {
                setUser(selected);
            }
        },
        [setUser]
    );
    const onAdd = React.useCallback(() => {
        if (!currentUser) {
            return;
        }
        props.dispatch({
            type: "PERSONNEL",
            action: {
                type: "NEW",
                actions: [
                    {
                        type: "ROLE",
                        action: {
                            type: "SET",
                            value: role,
                        },
                    },
                    {
                        type: "USER",
                        action: {
                            type: "SET",
                            value: user,
                        },
                    },
                    {
                        type: "ASSIGNED_BY",
                        action: {
                            type: "SET",
                            value: currentUser,
                        },
                    },
                    {
                        type: "ASSIGNED_DATE",
                        action: {
                            type: "SET",
                            value: new Date(),
                        },
                    },
                    {
                        type: "ACCEPTED",
                        action: {
                            type: "SET",
                            value:
                                role?.id.uuid == ROLE_CERTIFIED_FOREMAN ||
                                role?.id.uuid === ROLE_SERVICE_REPRESENTATIVE ||
                                role?.id.uuid === ROLE_OBSERVER ||
                                user === currentUser,
                        },
                    },
                    {
                        type: "ACCEPTED_DATE",
                        action: {
                            type: "SET",
                            value:
                                role?.id.uuid == ROLE_CERTIFIED_FOREMAN ||
                                role?.id.uuid === ROLE_SERVICE_REPRESENTATIVE ||
                                role?.id.uuid === ROLE_OBSERVER ||
                                user === currentUser
                                    ? new Date()
                                    : null,
                        },
                    },
                ],
            },
        });
        props.stopAdding();
    }, [props.dispatch, user, role, currentUser]);

    return (
        <FieldRow>
            <FormWrapper
                label="Role"
                style={{ width: "29ch", flexGrow: 0, flexBasis: "initial" }}
            >
                <Select
                    menuPlacement="auto"
                    value={role}
                    options={projectRoles}
                    getOptionLabel={(role) => role.name}
                    getOptionValue={(role) => role.id.uuid}
                    onChange={onRoleChange}
                    styles={selectStyle(false)}
                />
            </FormWrapper>
            <FormWrapper label="Name">
                <Select
                    menuPlacement="auto"
                    value={user}
                    options={users.filter(
                        (user) =>
                            role &&
                            user.roles.indexOf(role.id.uuid) !== -1 &&
                            user.active &&
                            !find(
                                props.personnel,
                                (entry) =>
                                    entry.role == role.id.uuid &&
                                    entry.user == user.id.uuid
                            )
                    )}
                    getOptionLabel={calcUserLabel}
                    getOptionValue={(user) => user.id.uuid}
                    onChange={onUserChange}
                    styles={selectStyle(false)}
                />
            </FormWrapper>
            <div
                style={{
                    flexGrow: 0,
                    verticalAlign: "bottom",
                }}
            >
                <Button
                    style={{
                        marginTop: "32px",
                    }}
                    onClick={onAdd}
                >
                    Add
                </Button>
            </div>
        </FieldRow>
    );
}

function RowRole(props: {
    index: number;
    role: ProjectPersonnel;
    dispatch: (action: Action) => void;
}) {
    const role = useQuickRecord(ROLE_META, props.role.role);
    const user = useQuickRecord(USER_META, props.role.user);
    const remove = React.useCallback(() => {
        if (confirm("Are you sure you want to remove?")) {
            props.dispatch({
                type: "PERSONNEL",
                action: {
                    type: "REMOVE",
                    index: props.index,
                },
            });
        }
    }, [props.dispatch, props.index, role, user]);
    return (
        <tr>
            <td style={{ width: "30ch" }}>{role?.name}</td>
            <td>
                {user && calcUserLabel(user)}{" "}
                {!props.role.accepted && <Badge>Not Accepted</Badge>}
            </td>
            <td style={{ width: "2em" }}>
                <Button variant="danger" onClick={remove}>
                    <FontAwesomeIcon icon={faTrashAlt} />
                </Button>
            </td>
        </tr>
    );
}

export function ManageRoles(props: {
    personnel: ProjectPersonnel[];
    dispatch: (action: {
        type: "PERSONNEL";
        action: ListAction<ProjectPersonnelWidgetAction>;
    }) => void;
    status: WidgetStatus;
}) {
    const [isAdding, setIsAdding] = React.useState(false);
    const startAdding = React.useCallback(
        () => setIsAdding(true),
        [setIsAdding]
    );
    const stopAdding = React.useCallback(
        () => setIsAdding(false),
        [setIsAdding]
    );

    const roles = range(props.personnel.length);
    roles.sort((aIndex, bIndex) => {
        const a = props.personnel[aIndex];
        const b = props.personnel[bIndex];
        const aRoleIndex = ROLE_ORDER.indexOf(a.role || "");
        const bRoleIndex = ROLE_ORDER.indexOf(b.role || "");
        return aRoleIndex - bRoleIndex;
    });

    const requireRole = some(
        props.status.validation,
        (entry) => entry.field === "personnel" && entry.empty
    );

    return (
        <>
            <Table bordered>
                <thead>
                    <tr>
                        <th>Role</th>
                        <th>Name</th>
                        <th />
                    </tr>
                </thead>
                <tbody>
                    {roles.map((index) => (
                        <RowRole
                            key={index}
                            role={props.personnel[index]}
                            index={index}
                            dispatch={props.dispatch}
                        />
                    ))}
                </tbody>
            </Table>
            {isAdding ? (
                <AddWidget
                    dispatch={props.dispatch}
                    stopAdding={stopAdding}
                    personnel={props.personnel}
                />
            ) : (
                <>
                    <div
                        style={{
                            marginBottom: "1em",
                        }}
                    >
                        <Button onClick={startAdding}>
                            Add User{" "}
                            {requireRole && (
                                <FontAwesomeIcon
                                    icon={faTimes}
                                    style={{ color: "red" }}
                                />
                            )}
                        </Button>
                    </div>
                </>
            )}
        </>
    );
}

function Component(props: Props) {
    return (
        <ManageRoles
            personnel={props.data.personnel}
            dispatch={props.dispatch}
            status={props.status}
        />
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
