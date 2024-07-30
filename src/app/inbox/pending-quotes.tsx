import React from "react";
import { Button } from "react-bootstrap";
import ProjectQuotingWidget from "../project/ProjectQuotingWidget.widget";
import {
    calcProjectIsQuoteFollowupDue,
    calcProjectIsQuoteFollowupOverDue,
    calcProjectQuoteFollowUpDate,
    calcProjectSummary,
    PROJECT_META,
} from "../project/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource from "./NotificationSource";
import { ITEM_TYPE } from "./types";
import { useRecordWidget } from "./useRecordWidget";

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const { component, data, onSave, isValid } = useRecordWidget(
        ProjectQuotingWidget,
        props.id,
        props.setOpenItem
    );

    const onLost = React.useCallback(() => {
        if (data) {
            window.open("#/project/edit/" + data.id.uuid + "/quotations/");
            props.setOpenItem(null);
        }
    }, [data?.id.uuid]);

    if (!data) {
        return <></>;
    }
    return (
        <>
            <MessageHeader>
                {calcProjectSummary(data)} Pending Follow-Up
            </MessageHeader>
            <MessageBody>{component}</MessageBody>
            <MessageFooter>
                <Button style={{ display: "block" }} onClick={onLost}>
                    Quotations
                </Button>
                <Button
                    onClick={() => {
                        window.open("#/project/edit/" + props.id + "/");
                        props.setOpenItem(null);
                    }}
                    style={{ display: "block", marginLeft: "auto" }}
                >
                    Open Project
                </Button>
                <Button
                    style={{ marginLeft: "auto", display: "block" }}
                    disabled={!isValid}
                    onClick={onSave}
                >
                    Save
                </Button>
            </MessageFooter>
        </>
    );
}

export const PENDING_QUOTE_SOURCE = NotificationSource({
    key: "pending-quote",
    label: "Pending Follow-Up",
    Component,
    table: PROJECT_META,
    active: calcProjectIsQuoteFollowupDue,
    priority: calcProjectIsQuoteFollowupOverDue,
    date: calcProjectQuoteFollowUpDate,
    sendToProjectRoleWithPermission: "Inbox-show-pending-quotes",
});
