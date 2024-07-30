import * as React from "react";
import { Button, Table } from "react-bootstrap";
import { useProjectRecordQuery } from "../../clay/api";
import { longDate } from "../../clay/LocalDate";
import {
    useQuickAllRecords,
    useQuickCache,
    useQuickRecord,
} from "../../clay/quick-cache";
import { FormWrapper } from "../../clay/widgets/FormField";
import { FieldRow } from "../../clay/widgets/layout";
import { MoneyStatic } from "../../clay/widgets/money-widget";
import { StaticTextField } from "../../clay/widgets/TextWidget";
import { calcAddressLineFormatted } from "../address";
import { INVOICE_META } from "../invoice/table";
import { calcPayoutOptionAmount, PAYOUT_META } from "../payout/table";
import { COMPLETION_SURVEY_META } from "../project/completion-survey/table";
import { DETAIL_SHEET_META } from "../project/detail-sheet/table";
import {
    calcProjectReadyForPayout,
    calcProjectReadyForPayoutDate,
    calcProjectSummary,
    constructPayout,
    PROJECT_META,
} from "../project/table";
import { useUser } from "../state";
import { ROLE_CERTIFIED_FOREMAN, USER_META } from "../user/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource from "./NotificationSource";
import { ITEM_TYPE } from "./types";
import { QUOTATION_META } from "../quotation/table";

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const cache = useQuickCache();
    const user = useUser();
    const project = useQuickRecord(PROJECT_META, props.id);

    const users = useQuickAllRecords(USER_META);

    const detailSheets = useProjectRecordQuery(DETAIL_SHEET_META, props.id);
    const payouts = useProjectRecordQuery(PAYOUT_META, props.id);
    const invoices = useProjectRecordQuery(INVOICE_META, props.id);
    const surveys = useProjectRecordQuery(COMPLETION_SURVEY_META, props.id);
    const quotation = useQuickRecord(QUOTATION_META, project?.selectedQuotation || null)

    const newPayout = React.useMemo(
        () =>
            detailSheets &&
            users &&
            surveys &&
            payouts &&
            project &&
            invoices &&
            quotation !== undefined &&
            constructPayout({
                user,
                users,
                payouts,
                quotation,
                project,
                detailSheets,
                invoices,
                surveys,
            }),
        [user, users, payouts, project, detailSheets, invoices, surveys]
    );

    if (!project || !newPayout) {
        return <></>;
    }
    return (
        <>
            <MessageHeader>
                {calcProjectSummary(project)} Project Ready for Payout
            </MessageHeader>
            <MessageBody>
                <FieldRow>
                    <FormWrapper label="Project Number">
                        <StaticTextField value={project.projectNumber + ""} />
                    </FormWrapper>
                    <FormWrapper label="Project Address">
                        <StaticTextField
                            value={calcAddressLineFormatted(
                                project.siteAddress
                            )}
                        />
                    </FormWrapper>
                </FieldRow>
                <FormWrapper label="Customer">
                    <StaticTextField value={project.customer} />
                </FormWrapper>
                <FieldRow>
                    {project.personnel
                        .filter((entry) => entry.role == ROLE_CERTIFIED_FOREMAN)
                        .map((entry) => (
                            <FormWrapper label="Certified Foreman">
                                <StaticTextField
                                    value={
                                        cache.get(USER_META, entry.user)
                                            ?.name || ""
                                    }
                                />
                            </FormWrapper>
                        ))}
                </FieldRow>
                <FormWrapper label="Final Invoice Date">
                    <StaticTextField
                        value={longDate(project.finalInvoiceDate) || ""}
                    />
                </FormWrapper>
                <Table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {newPayout.options.map((option) => (
                            <tr>
                                <td>{option.description}</td>
                                <td>
                                    <MoneyStatic
                                        value={calcPayoutOptionAmount(option)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

                <Button
                    onClick={() => {
                        window.open("#/project/edit/" + props.id + "/wrapup");
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

export const PROJECT_READY_FOR_PAYOUT_SOURCE = NotificationSource({
    key: "project-ready-for-payout",
    label: "Project Ready For Payout",
    Component,
    table: PROJECT_META,
    active: calcProjectReadyForPayout,
    date: calcProjectReadyForPayoutDate,
    dated: true,
    sendToProjectRoleWithPermission: "Inbox-show-ready-for-payout",
});
