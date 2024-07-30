import { Button } from "react-bootstrap";
import { useQuickRecord } from "../../clay/quick-cache";
import {
    calcProjectIsCertifiedForemanMissing,
    calcProjectSummary,
    PROJECT_META,
} from "../project/table";
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
        msg: "This project requires a certified foreman",
        tab: "contractDetails",
    };
    return (
        <>
            <MessageHeader>
                {calcProjectSummary(data)} Assign Roles
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

export const CF_REQUIRED_SOURCE = NotificationSource({
    key: "cf-required",
    label: "CF Required",
    table: PROJECT_META,
    Component,
    active: calcProjectIsCertifiedForemanMissing,
    date: (project) => project.contractDetailsDate,
    sendToCategoryManager: true,
});
