import React from "react";
import { Button } from "react-bootstrap";
import { deleteRecord } from "../../clay/api";
import { Link } from "../../clay/link";
import { useQuickRecord } from "../../clay/quick-cache";
import {
    duplicateEstimate,
    EstimateHandle,
    useEstimateHandle,
} from "../estimate/manage";
import {
    calcEstimateCopyRequestApprovedUsers,
    EstimateCopyRequest,
    ESTIMATE_COPY_REQUEST_META,
} from "../estimate/table";
import { calcProjectSummary, Project, PROJECT_META } from "../project/table";
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

export async function handleAccept(
    target: Project,
    estimate: EstimateHandle,
    data: EstimateCopyRequest
) {
    if (await duplicateEstimate(estimate, target)) {
        await deleteRecord(ESTIMATE_COPY_REQUEST_META, "inbox", data.id.uuid);
    }
}

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const user = useUser();
    const data = useQuickRecord(ESTIMATE_COPY_REQUEST_META, props.id);
    const estimate = useEstimateHandle(data?.estimate || null);
    const project = useQuickRecord(
        PROJECT_META,
        estimate?.common.project || null
    );
    const requester = useQuickRecord(USER_META, data?.user || null);
    const target = useQuickRecord(PROJECT_META, data?.target || null);

    const onApprove = React.useCallback(async () => {
        if (!data || !target || !estimate) {
            return;
        }
        handleAccept(target, estimate, data).then(() => {
            props.setOpenItem(null);
        });
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
                {calcProjectSummary(target)} Estimate Copy Approved
            </MessageHeader>
            <MessageBody>
                Estimate copy approved from {calcProjectSummary(project)}
            </MessageBody>
            <MessageFooter>
                <Button
                    style={{ marginLeft: "auto", display: "block" }}
                    disabled={false}
                    variant="danger"
                    onClick={onReject}
                >
                    Cancel
                </Button>
                <Button
                    style={{ marginLeft: "auto", display: "block" }}
                    disabled={false}
                    onClick={onApprove}
                >
                    Copy
                </Button>
            </MessageFooter>
        </>
    );
}

export const APPROVED_ESTIMATE_COPY_SOURCE = NotificationSource({
    key: "approved-estimate-copy",
    label: "Estimate Copy Approved",
    Component,
    table: ESTIMATE_COPY_REQUEST_META,
    sendToUsers: calcEstimateCopyRequestApprovedUsers,
    date: (x) => x.addedDateTime,
});
