import React from "react";
import { Button } from "react-bootstrap";
import { patchRecord } from "../../clay/api";
import { isEmpty } from "../../clay/queryFuncs";
import { useQuickCache, useQuickRecord } from "../../clay/quick-cache";
import {
    calcProjectSummary,
    Project,
    ProjectBrokenJSON,
    ProjectJSON,
    PROJECT_META,
} from "../project/table";
import { useUser } from "../state";
import { ROLE_OBSERVER, USER_META } from "../user/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource from "./NotificationSource";
import { ITEM_TYPE } from "./types";

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const user = useUser();
    const data = useQuickRecord(PROJECT_META, props.id);

    const onReject = React.useCallback(() => {
        patchRecord(PROJECT_META, "Inbox", props.id, {
            accessRequests: {
                _t: "a",
                _0: [data!.accessRequests[0], 0, 0],
            },
        }).then(() => props.setOpenItem(null));
    }, [data?.id.uuid, props.id, data]);

    const onApprove = React.useCallback(() => {
        patchRecord(PROJECT_META, "Inbox", props.id, {
            accessRequests: {
                _t: "a",
                _0: [data!.accessRequests[0], 0, 0],
            },
            personnel: {
                _t: "a",
                append: {
                    user: data!.accessRequests[0],
                    assignedBy: user.id,
                    assignedDate: new Date().toISOString(),
                    accepted: true,
                    acceptedDate: new Date().toISOString(),
                    role: ROLE_OBSERVER,
                },
            },
        }).then(() => props.setOpenItem(null));
    }, [props.setOpenItem, props.id, data]);

    const cache = useQuickCache();

    if (!data) {
        return <></>;
    }
    return (
        <>
            <MessageHeader>
                {calcProjectSummary(data)} Access Requested
            </MessageHeader>
            <MessageBody>
                {data.accessRequests.slice(0, 1).map((request) => (
                    <p>
                        {request && cache.get(USER_META, request)?.name} has
                        requested access
                    </p>
                ))}
            </MessageBody>
            <MessageFooter>
                <Button style={{ display: "block" }} onClick={onReject}>
                    Reject
                </Button>
                <Button
                    style={{ marginLeft: "auto", display: "block" }}
                    onClick={onApprove}
                >
                    Approve
                </Button>
            </MessageFooter>
        </>
    );
}

export const ACCESS_REQUESTED_SOURCE = NotificationSource<
    Project,
    ProjectJSON,
    ProjectBrokenJSON
>({
    key: "access-request",
    label: "Access Requested",
    Component,
    table: PROJECT_META,
    date: null,
    sendToCategoryManager: true,
    active(project: Project) {
        return !isEmpty(project.accessRequests);
    },
});
