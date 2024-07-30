import * as React from "react";
import { Button } from "react-bootstrap";
import { patchRecord } from "../../clay/api";
import { Link } from "../../clay/link";
import { useQuickRecord } from "../../clay/quick-cache";
import { UserPermissions } from "../../clay/server/api";
import { hasPermission } from "../../permissions";
import {
    calcProjectIsAcceptanceLate,
    calcProjectSummary,
    Project,
    PROJECT_META,
} from "../project/table";
import { Role, ROLE_META } from "../roles/table";
import { useUser } from "../state";
import { User, USER_META } from "../user/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource from "./NotificationSource";
import { ITEM_TYPE } from "./types";

function RoleName(props: { roleId: Link<Role> }) {
    const role = useQuickRecord(ROLE_META, props.roleId);
    return <>{role?.name}</>;
}

function UserName(props: { userId: Link<User> }) {
    const user = useQuickRecord(USER_META, props.userId);
    return <>{user?.name}</>;
}

export async function rejectRoles(user: UserPermissions, project: Project) {
    const personnel_patch: any = { _t: "a" };
    project.personnel.forEach((entry, index) => {
        if (!entry.accepted) {
            personnel_patch["_" + index] = [entry, 0, 0];
        }
    });
    await patchRecord(PROJECT_META, "inbox", project.id.uuid, {
        personnel: personnel_patch,
    });
}

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const user = useUser();
    const data = useQuickRecord(PROJECT_META, props.id);

    const onReject = React.useCallback(async () => {
        if (!data) {
            return;
        }

        rejectRoles(user, data);

        props.setOpenItem(null);
    }, [user.id, data, props.setOpenItem]);

    const onAccept = React.useCallback(async () => {
        if (!data) {
            return;
        }
        const personnel_patch: any = { _t: "a" };
        data.personnel.forEach((entry, index) => {
            if (!entry.accepted) {
                personnel_patch[index] = {
                    accepted: [false, true],
                    acceptedDate: [null, new Date().toISOString()],
                };
            }
        });
        await patchRecord(PROJECT_META, "inbox", props.id, {
            personnel: personnel_patch,
        });
        props.setOpenItem(null);
    }, [user.id, data, props.setOpenItem]);

    if (!data) {
        return <></>;
    }

    const mayForce = hasPermission(user, "Project", "force-project-role");

    return (
        <>
            <MessageHeader>
                {calcProjectSummary(data)} Role Not Accepted
            </MessageHeader>
            <MessageBody>
                Role has not been accepted
                <ul>
                    {data.personnel
                        .filter((row) => !row.accepted)
                        .map((row, index) => (
                            <li key={index}>
                                <RoleName roleId={row.role} />:{" "}
                                <UserName userId={row.user} />
                            </li>
                        ))}
                </ul>
            </MessageBody>
            <MessageFooter>
                {mayForce && (
                    <>
                        {" "}
                        <Button
                            variant="danger"
                            style={{ marginLeft: "auto", display: "block" }}
                            onClick={onReject}
                        >
                            Force Reject
                        </Button>
                        <Button
                            style={{ marginLeft: "auto", display: "block" }}
                            onClick={onAccept}
                        >
                            Force Accept
                        </Button>
                    </>
                )}
            </MessageFooter>
        </>
    );
}

export const UNACCEPTED_MANAGER_SOURCE = NotificationSource({
    label: "Unaccepted Role",
    key: "unaccepted-manager",
    table: PROJECT_META,
    active: calcProjectIsAcceptanceLate,
    date: (project) => project.quoteRequestDate,
    priority: true,
    dated: true,
    sendToCategoryManager: true,
    Component,
});
