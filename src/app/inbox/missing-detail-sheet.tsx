import { Button } from "react-bootstrap";
import { useQuickRecord } from "../../clay/quick-cache";
import { calcProjectSummary, PROJECT_META } from "../project/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource from "./NotificationSource";
import { ITEM_TYPE } from "./types";
import * as React from "react";

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const data = useQuickRecord(PROJECT_META, props.id);
    if (!data) {
        return <></>;
    }

    const details = {
        msg: "This project requires an detail sheet",
        tab: "certifiedForemenCommunication",
    };
    return (
        <>
            <MessageHeader>
                {calcProjectSummary(data)} CF Assigned
            </MessageHeader>
            <MessageBody>
                <p>{details.msg}</p>
                <Button
                    onClick={() => {
                        window.open(
                            "#/project/edit/" + props.id + "/" + details.tab
                        );
                        props.setOpenItem(null);
                    }}
                    style={{ marginTop: "1em", maxWidth: "10em" }}
                >
                    Open Project
                </Button>
            </MessageBody>
            <MessageFooter></MessageFooter>
        </>
    );
}

export const MISSING_DETAIL_SHEET_SOURCE = NotificationSource({
    Component,
    key: "missing-detail-sheet",
    label: "CF Assigned",
    table: PROJECT_META,
    active: "certifiedForemanLacksDetailSheet",
    date: (project) => project.contractDetailsDate,
    sendToProjectRoleWithPermission: "Inbox-show-missing-detail-sheet",
});
