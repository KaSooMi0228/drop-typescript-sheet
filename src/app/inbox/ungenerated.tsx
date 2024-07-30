import Decimal from "decimal.js";
import { Button } from "react-bootstrap";
import { Link } from "../../clay/link";
import { RecordMeta } from "../../clay/meta";
import { daysAgo, ifNull, isNull } from "../../clay/queryFuncs";
import { useQuickRecord } from "../../clay/quick-cache";
import { PAYOUT_META } from "../payout/table";
import { COMPLETION_SURVEY_META } from "../project/completion-survey/table";
import { CORE_VALUE_NOTICE_META } from "../project/core-values/table";
import { DETAIL_SHEET_META } from "../project/detail-sheet/table";
import { SITE_VISIT_REPORT_META } from "../project/site-visit-report/table";
import { calcProjectSummary, Project, PROJECT_META } from "../project/table";
import { QUOTATION_META } from "../quotation/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource from "./NotificationSource";
import { InboxThreadTable, ITEM_TYPE } from "./types";
import * as React from "react";

function createSource<
    A extends {
        project: Link<Project>;
        date: Date | null;
        addedDateTime: Date | null;
    },
    B,
    C
>(
    meta: RecordMeta<A, B, C> & { name: InboxThreadTable },
    key: string,
    what: string,
    suffix: string
) {
    function Component(props: {
        id: string;
        setOpenItem: (item: ITEM_TYPE | null) => void;
    }) {
        const quotation = useQuickRecord(meta, props.id);

        const project = useQuickRecord(
            PROJECT_META,
            quotation?.project || null
        );

        if (!quotation || !project) {
            return <></>;
        }
        return (
            <>
                <MessageHeader>
                    {calcProjectSummary(project)} Unfinished {what}
                </MessageHeader>
                <MessageBody>
                    You have an unfinished {what} for this project. Please
                    review and complete/correct as necessary.
                </MessageBody>
                <MessageFooter>
                    <Button
                        onClick={() => {
                            window.open(
                                "#/project/edit/" +
                                    quotation.project +
                                    "/" +
                                    suffix
                            );
                            props.setOpenItem(null);
                        }}
                        style={{ display: "block", marginLeft: "auto" }}
                    >
                        Open Project
                    </Button>
                </MessageFooter>
            </>
        );
    }

    return NotificationSource({
        key: "ungenerated-" + suffix+key,
        label: "Unfinished " + what,
        Component,
        table: meta,
        dated: false,
        active: (x) =>
            isNull(x.date) &&
            ifNull(daysAgo(x.addedDateTime), new Decimal(0)).gt(2),
        date: (x) => x.addedDateTime,
        sendToUserColumnIfPermission: "Inbox-show-ungenerated",
    });
}

export const UNGENERATED_QUOTATION_SOURCE = createSource(
    QUOTATION_META,
    "quotation",
    "Quotation",
    "quotations"
);

export const UNGENERATED_DETAIL_SHEET_SOURCE = createSource(
    DETAIL_SHEET_META,
    "detail-sheet",
    "Detail Sheet",
    "certifiedForemenCommunication"
);

export const UNGENERATED_SITE_VISIT_REPORT_SOURCE = createSource(
    SITE_VISIT_REPORT_META,
    "site-visit-report",
    "Site Visit Report",
    "certifiedForemenCommunication"
);

export const UNGENERATED_CORE_VALUE_NOTICE = createSource(
    CORE_VALUE_NOTICE_META,
    "core-value-notice",
    "Core Value Notice",
    "certifiedForemenCommunication"
);
export const UNGENERATED_COMPLETION_SURVEY = createSource(
    COMPLETION_SURVEY_META,
    "wrap-up-survey",
    "Survey",
    "wrap-up"
);
export const UNGENERATED_PAYOUT = createSource(
    PAYOUT_META,
    "payout",
    "Payout Notice",
    "wrap-up"
);
