import { find, groupBy } from "lodash";
import * as React from "react";
import { Alert, Badge, Breadcrumb } from "react-bootstrap";
import { BaseAction, Page } from "../clay/Page";
import { useQuickAllRecords } from "../clay/quick-cache";
import { UserPermissions } from "../clay/server/api";
import { LABELS } from "./inbox/sources";
import { useInboxItemsFor } from "./inbox/use-inbox-items";
import { Role, ROLE_META } from "./roles/table";
import { ROLE_BASIC_ACCESS, User, USER_META } from "./user/table";

type State = {};
type Action = BaseAction;

function ObserveUser(props: { user: User; roles: Role[] }) {
    const user = React.useMemo(() => {
        return resolveUser(props.user, props.roles);
    }, [props.user, props.roles]);

    const notifications = useInboxItemsFor(user);

    const groups = groupBy(notifications, (item) => item.type);

    return (
        <>
            <h1>
                {props.user.name} ({notifications.length})
            </h1>
            {Object.entries(groups).map(([key, value]) => {
                return (
                    <Alert variant="secondary">
                        <span>{(LABELS as any)[key]}</span>
                        <Badge>{value.length}</Badge>
                    </Alert>
                );
            })}
        </>
    );
}

function resolveUser(user: User, roles: Role[]): UserPermissions {
    return {
        id: user.id.uuid,
        email: user.accountEmail,
        permissions: user.roles.flatMap(
            (role) => find(roles, (x) => role === x.id.uuid)?.permissions || []
        ),
    };
}

export const ObserverPage: Page<State, Action> = {
    initialize(segments, parameters) {
        return {
            state: {},
            requests: [],
        };
    },
    reduce(state, action, context) {
        switch (action.type) {
            case "PAGE_ACTIVATED":
            case "HEARTBEAT":
                return {
                    state,
                    requests: [],
                };
            case "UPDATE_PARAMETERS":
                return {
                    state: {},
                    requests: [],
                };
        }
    },
    component(props) {
        const users = useQuickAllRecords(USER_META);
        const roles = useQuickAllRecords(ROLE_META);

        return (
            (users && roles && (
                <>
                    {users
                        .filter(
                            (user) =>
                                user.active &&
                                user.roles.indexOf(ROLE_BASIC_ACCESS) !== -1
                        )
                        .map((user) => (
                            <ObserveUser user={user} roles={roles} />
                        ))}
                </>
            )) ||
            null
        );
    },
    headerComponent() {
        return (
            <>
                <Breadcrumb>
                    <Breadcrumb.Item active>Observer</Breadcrumb.Item>
                </Breadcrumb>
                <div style={{ flexGrow: 1 }} />
            </>
        );
    },
    encodeState(state) {
        return {
            segments: [],
            parameters: {},
        };
    },
    hasUnsavedChanges() {
        return false;
    },
    title() {
        return "Observer";
    },
    beforeUnload() {
        return false;
    },
};
