import React from "react";
import { Button } from "react-bootstrap";
import { deleteRecord } from "../../clay/api";
import { Link } from "../../clay/link";
import { useQuickRecord } from "../../clay/quick-cache";
import {
    calcProjectSummary,
    PROJECT_META,
    PROJECT_UNLOCK_REQUEST_META,
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

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const user = useUser();
    const data = useQuickRecord(PROJECT_UNLOCK_REQUEST_META, props.id);
    const project = useQuickRecord(PROJECT_META, data?.project || null);
    const requester = useQuickRecord(USER_META, data?.addedBy || null);

    const onOpenProject = React.useCallback(async () => {
        if (!data) {
            return;
        }

        window.open("#/project/edit/" + data.project + "/");

        await deleteRecord(PROJECT_UNLOCK_REQUEST_META, "inbox", props.id);

        props.setOpenItem(null);
    }, [user.id, data, project, props.setOpenItem]);

    const onReject = React.useCallback(async () => {
        if (!data) {
            return;
        }

        await deleteRecord(PROJECT_UNLOCK_REQUEST_META, "inbox", props.id);

        props.setOpenItem(null);
    }, [user.id, data, project, props.setOpenItem]);

    if (!data || !project || !requester) {
        return <></>;
    }
    return (
        <>
            <MessageHeader>
                {calcProjectSummary(project)} Project Unlock Request
            </MessageHeader>
            <MessageBody>
                {requester.name} has requested this project to be unlocked.
            </MessageBody>
            <MessageFooter>
                <Button
                    style={{ marginLeft: "auto", display: "block" }}
                    disabled={false}
                    variant="danger"
                    onClick={onReject}
                >
                    Reject
                </Button>
                <Button
                    style={{ marginLeft: "auto", display: "block" }}
                    disabled={false}
                    onClick={onOpenProject}
                >
                    Open Project
                </Button>
            </MessageFooter>
        </>
    );
}

export const PROJECT_UNLOCK_REQUEST_SOURCE = NotificationSource({
    key: "project-unlock-request",
    label: "Project Unlock Request",
    Component,
    table: PROJECT_UNLOCK_REQUEST_META,
    active: (x) => true,
    sendToUsersWithPermission: "Inbox-show-unlock-project-requests",
    date: (x) => x.addedDateTime,
});
