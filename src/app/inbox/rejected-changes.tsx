import { formatters } from "jsondiffpatch";
import React from "react";
import { Button } from "react-bootstrap";
import { deleteRecord } from "../../clay/api";
import { useQuickCache, useQuickRecord } from "../../clay/quick-cache";
import { CHANGE_REJECTED_META } from "../notice/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import { ITEM_TYPE } from "./types";

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const notice = useQuickRecord(CHANGE_REJECTED_META, props.id);

    const cache = useQuickCache();

    const onDismiss = React.useCallback(() => {
        deleteRecord(CHANGE_REJECTED_META, "inbox", props.id).then(() =>
            props.setOpenItem(null)
        );
    }, [props.id, props.setOpenItem]);

    const [original, setOriginal] = React.useState(undefined);
    //React.useEffect(() => {
    //    fetchRawRecordByTable()
    //}

    if (!notice) {
        return <></>;
    }
    const detail: any = JSON.parse(notice.detail);

    let html = "";
    try {
        html = formatters.html.format(detail.patches[0], {});
    } catch (error) {}

    return (
        <>
            <MessageHeader>Change Could Not Be Saved</MessageHeader>
            <MessageBody>
                Could Not Save
                <div
                    dangerouslySetInnerHTML={{
                        __html: html,
                    }}
                />
            </MessageBody>
            <MessageFooter>
                <Button
                    onClick={onDismiss}
                    style={{ marginLeft: "auto", display: "block" }}
                >
                    Dismiss
                </Button>
            </MessageFooter>
        </>
    );
}

export const REJECTED_CHANGE_SOURCE = {
    Component,
};
