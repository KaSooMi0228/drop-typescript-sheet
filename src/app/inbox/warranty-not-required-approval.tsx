import { Button } from "react-bootstrap";
import {
    calcProjectIsWarrantyNotRequiredUnapproved,
    calcProjectSummary,
    PROJECT_META,
} from "../project/table";
import WarrantySkipMainWidget from "../project/WarrantySkipMainWidget.widget";
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
        WarrantySkipMainWidget,
        props.id,
        props.setOpenItem
    );

    if (!data) {
        return <></>;
    }
    return (
        <>
            <MessageHeader>
                {calcProjectSummary(data)} Warranty Exemption Request
            </MessageHeader>
            <MessageBody>{component}</MessageBody>
            <MessageFooter>
                <Button
                    onClick={() => {
                        window.open("#/project/edit/" + props.id + "/wrap-up/");
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

export const UNAPPROVED_WARANTY_EXEMPTION = NotificationSource({
    key: "warranty-not-required-approval",
    label: "Warranty Exemption Request",
    table: PROJECT_META,
    active: calcProjectIsWarrantyNotRequiredUnapproved,
    sendToCategoryManager: true,
    dated: true,
    priority: true,
    date(project) {
        return project.warrantyNotRequiredDate;
    },
    Component,
});
