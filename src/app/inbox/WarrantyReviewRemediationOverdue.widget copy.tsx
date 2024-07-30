import Decimal from "decimal.js";
import * as React from "react";
import { Button, Table } from "react-bootstrap";
import { daysAgo, isNotNull } from "../../clay/queryFuncs";
import { useQuickCache, useQuickRecord } from "../../clay/quick-cache";
import { FormWrapper } from "../../clay/widgets/FormField";
import { FieldRow } from "../../clay/widgets/layout";
import { StaticTextField } from "../../clay/widgets/TextWidget";
import { calcProjectSummary, PROJECT_META } from "../project/table";
import { ROLE_META } from "../roles/table";
import { USER_META } from "../user/table";
import {
    calcWarrantyReviewIsComplete,
    WARRANTY_REVIEW_META,
} from "../warranty-review/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource, {
    NotificationSourceComponentProps,
} from "./NotificationSource";

function Component(props: NotificationSourceComponentProps) {
    const warrantyReview = useQuickRecord(WARRANTY_REVIEW_META, props.id);
    const project = useQuickRecord(
        PROJECT_META,
        warrantyReview?.project || null
    );
    const cache = useQuickCache();
    const onOpen = React.useCallback(() => {
        window.open(`/#/warranty-review/edit/${props.id}/`);
    }, [props.id]);

    if (!warrantyReview || !project) {
        return <></>;
    }

    return (
        <>
            <MessageHeader>
                {calcProjectSummary(project)} Warranty Remediation Overdue
            </MessageHeader>
            <MessageBody>
                <FieldRow>
                    {warrantyReview.ownersRepresentatives.map((x) => (
                        <FormWrapper label="Owner's Representative">
                            <StaticTextField value={x.name} />
                        </FormWrapper>
                    ))}
                    {warrantyReview.contacts.map((x) => (
                        <FormWrapper label="Customer Contact">
                            <StaticTextField value={x.name} />
                        </FormWrapper>
                    ))}
                </FieldRow>
                <FieldRow>
                    {warrantyReview.personnel.map((entry) => (
                        <FormWrapper
                            label={cache.get(ROLE_META, entry.role)?.name}
                        >
                            <StaticTextField
                                value={
                                    cache.get(USER_META, entry.user)?.name || ""
                                }
                            />
                        </FormWrapper>
                    ))}
                </FieldRow>
                <Table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Action Required</th>
                            <th>Covered</th>
                        </tr>
                    </thead>
                    <tbody>
                        {warrantyReview.specificItems.map((item) => (
                            <tr>
                                <td>{item.description}</td>
                                <td>{item.actionRequired}</td>
                                <th>{item.covered}</th>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </MessageBody>
            <MessageFooter>
                <Button
                    style={{ marginLeft: "auto", display: "block" }}
                    onClick={onOpen}
                >
                    Open
                </Button>
            </MessageFooter>
        </>
    );
}

export const WARRANTY_REVIEW_REMEDIATION_OVERDUE_SOURCE = NotificationSource({
    key: "warranty-remediation-overdue",
    Component,
    table: WARRANTY_REVIEW_META,
    active: (review) =>
        isNotNull(review.remediationWorkDueDate) &&
        !calcWarrantyReviewIsComplete(review) &&
        daysAgo(review.remediationWorkDueDate)!.greaterThan(new Decimal("0")),
    sendToCategoryManager: true,
    label: "Warranty Remediation Overdue",
    date: (review) => review.remediationWorkDueDate,
});
