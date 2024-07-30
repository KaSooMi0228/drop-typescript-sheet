import { Button } from "react-bootstrap";
import ProjectAccountingWidget from "../project/ProjectAccountingWidget.widget";
import {
    calcProjectIsUnaddedToAccounting,
    calcProjectSummary,
    PROJECT_META,
} from "../project/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource from "./NotificationSource";
import { ITEM_TYPE } from "./types";
import { useRecordWidget } from "./useRecordWidget";
import * as React from "react";

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const { component, data, onSave, isValid } = useRecordWidget(
        ProjectAccountingWidget,
        props.id,
        props.setOpenItem
    );

    if (!data) {
        return <></>;
    }
    return (
        <>
            <MessageHeader>
                {calcProjectSummary(data)} Add Project To Accounting
            </MessageHeader>
            <MessageBody>{component}</MessageBody>
            <MessageFooter>
                <Button
                    onClick={() => {
                        window.open(
                            "#/project/edit/" +
                                props.id +
                                "/summary/accounting/"
                        );
                        props.setOpenItem(null);
                    }}
                    style={{ display: "block", marginLeft: "auto" }}
                >
                    Open Project
                </Button>
                <Button
                    style={{ marginLeft: "1em", display: "block" }}
                    disabled={!isValid}
                    onClick={onSave}
                >
                    Save
                </Button>
            </MessageFooter>
        </>
    );
}

export const UNADDED_TO_ACCOUNTING_SOURCE = NotificationSource({
    key: "unadded-to-accounting",
    label: "New Project",
    Component,
    table: PROJECT_META,
    active: calcProjectIsUnaddedToAccounting,
    sendToUsersWithPermission: "Inbox-show-unadded-to-account",
    date: (project) => project.contractDetailsDate,
});
