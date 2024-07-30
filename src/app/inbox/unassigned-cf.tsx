import { some } from "lodash";
import { Button } from "react-bootstrap";
import { useQuickRecord } from "../../clay/quick-cache";
import { calcProjectSummary, PROJECT_META } from "../project/table";
import { ROLE_ESTIMATOR } from "../user/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
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

    const details = some(data.personnel, (row) => row.role === ROLE_ESTIMATOR)
        ? {
              msg: "This project requires a certified foreman",
              tab: "contractDetails",
          }
        : {
              msg: "This project requires an estimator",
              tab: "quoting",
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

export const APPROVE_CFS_SOURCE = {
    Component,
};
