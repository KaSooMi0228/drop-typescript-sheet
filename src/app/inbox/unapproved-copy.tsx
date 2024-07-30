import React from "react";
import { Button } from "react-bootstrap";
import { deleteRecord, patchRecord } from "../../clay/api";
import { Link } from "../../clay/link";
import { useQuickRecord } from "../../clay/quick-cache";
import {
    calcEstimateCopyRequestIsUnapproved,
    ESTIMATE_COPY_REQUEST_META,
    ESTIMATE_META,
} from "../estimate/table";
import { calcProjectSummary, PROJECT_META } from "../project/table";
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
    const data = useQuickRecord(ESTIMATE_COPY_REQUEST_META, props.id);
    const estimate = useQuickRecord(ESTIMATE_META, data?.estimate || null);
    const project = useQuickRecord(
        PROJECT_META,
        estimate?.common.project || null
    );
    const requester = useQuickRecord(USER_META, data?.user || null);
    const target = useQuickRecord(PROJECT_META, data?.target || null);

    const onApprove = React.useCallback(async () => {
        if (!data) {
            return;
        }
        await patchRecord(ESTIMATE_COPY_REQUEST_META, "inbox", props.id, {
            approved: [false, true],
        });

        props.setOpenItem(null);
    }, [user.id, data, project, props.setOpenItem]);

    const onReject = React.useCallback(async () => {
        if (!data) {
            return;
        }

        await deleteRecord(ESTIMATE_COPY_REQUEST_META, "inbox", props.id);

        props.setOpenItem(null);
    }, [user.id, data, project, props.setOpenItem]);

    if (!data || !estimate || !project || !requester || !target) {
        return <></>;
    }
    return (
        <>
            <MessageHeader>
                {calcProjectSummary(target)} Estimate Copy Requested
            </MessageHeader>
            <MessageBody>
                {requester.name} has requested a copy of the estimate from:{" "}
                {calcProjectSummary(project)}
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
                    onClick={onApprove}
                >
                    Approve
                </Button>
            </MessageFooter>
        </>
    );
}

export const UNAPPROVED_ESTIMATE_COPY_SOURCE = NotificationSource({
    key: "unapproved-estimate-copy",
    label: "Estimate Copy Requested",
    Component,
    table: ESTIMATE_COPY_REQUEST_META,
    active: calcEstimateCopyRequestIsUnapproved,
    date: (x) => x.addedDateTime,
    sendToCategoryManager: true,
    sendToProjectRoleWithPermission: "Inbox-show-estimate-copy-request",
});
