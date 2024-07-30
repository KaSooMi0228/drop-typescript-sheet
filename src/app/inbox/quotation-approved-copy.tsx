import React from "react";
import { Button } from "react-bootstrap";
import { deleteRecord } from "../../clay/api";
import { Link } from "../../clay/link";
import { useQuickRecord } from "../../clay/quick-cache";
import { UserPermissions } from "../../clay/server/api";
import { calcProjectSummary, Project, PROJECT_META } from "../project/table";
import { duplicateQuotation } from "../quotation/manage";
import {
    calcQuotationCopyRequestApprovedUsers,
    Quotation,
    QuotationCopyRequest,
    QUOTATION_COPY_REQUEST_META,
    QUOTATION_META,
} from "../quotation/table";
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
    quotation: Quotation,
    data: QuotationCopyRequest,
    user: UserPermissions
) {
    const newQuotation = await duplicateQuotation(quotation, target, user);
    if (newQuotation) {
        await deleteRecord(QUOTATION_COPY_REQUEST_META, "inbox", data.id.uuid);
        window.open(
            `#/project/edit/${target.id.uuid}/quotations/quotation/${newQuotation.id.uuid}/`
        );
    }
}

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const user = useUser();
    const data = useQuickRecord(QUOTATION_COPY_REQUEST_META, props.id);
    const quotation = useQuickRecord(QUOTATION_META, data?.quotation || null);
    const project = useQuickRecord(PROJECT_META, quotation?.project || null);
    const requester = useQuickRecord(USER_META, data?.user || null);
    const target = useQuickRecord(PROJECT_META, data?.target || null);

    const onApprove = React.useCallback(async () => {
        if (!data || !target || !quotation) {
            return;
        }
        handleAccept(target, quotation, data, user).then(() => {
            props.setOpenItem(null);
        });
    }, [user, data, project, props.setOpenItem]);

    const onReject = React.useCallback(async () => {
        if (!data) {
            return;
        }

        await deleteRecord(QUOTATION_COPY_REQUEST_META, "inbox", props.id);

        props.setOpenItem(null);
    }, [user.id, data, project, props.setOpenItem]);

    if (!data || !quotation || !project || !requester || !target) {
        return <></>;
    }
    return (
        <>
            <MessageHeader>
                {calcProjectSummary(target)} Proposal Copy Approved
            </MessageHeader>
            <MessageBody>
                Proposal copy approved from {calcProjectSummary(project)}
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

export const APPROVED_QUOTATION_COPY_SOURCE = NotificationSource({
    key: "approved-quotation-copy",
    label: "Proposal Copy Approved",
    Component,
    table: QUOTATION_COPY_REQUEST_META,
    sendToUsers: calcQuotationCopyRequestApprovedUsers,
    date: (x) => x.addedDateTime,
});
