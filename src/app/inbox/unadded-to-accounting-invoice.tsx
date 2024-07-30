import { faChevronCircleRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Button, FormControl, Table } from "react-bootstrap";
import { patchRecord, useProjectRecordQuery } from "../../clay/api";
import { sumMap } from "../../clay/queryFuncs";
import { useQuickRecord } from "../../clay/quick-cache";
import { FormWrapper } from "../../clay/widgets/FormField";
import { calcContactDetailSummary } from "../contact/table";
import { formatMoney } from "../estimate/TotalsWidget.widget";
import {
    calcInvoiceAmountTotal,
    calcInvoiceGst,
    calcInvoiceHoldback,
    calcInvoiceIsUnaddedToAccounting,
    calcInvoiceNetClaim,
    calcInvoicePaymentRequested,
    INVOICE_META,
} from "../invoice/table";
import { calcProjectSummary, PROJECT_META } from "../project/table";
import { useCurrentToken, useUser } from "../state";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource from "./NotificationSource";
import { ITEM_TYPE } from "./types";

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const user = useUser();
    const data = useQuickRecord(INVOICE_META, props.id);
    const project = useQuickRecord(PROJECT_META, data?.project || null);
    const allInvoices = useProjectRecordQuery(
        INVOICE_META,
        data?.project || null
    );

    const onAdded = React.useCallback(async () => {
        if (!data) {
            return;
        }
        await patchRecord(INVOICE_META, "inbox", data.id.uuid, {
            addedToAccountingSoftware: {
                date: [null, new Date().toISOString()],
                user: [null, user.id],
            },
        });
        props.setOpenItem(null);
    }, [user.id, data, props.setOpenItem]);

    const currentToken = useCurrentToken();

    const onPrint = React.useCallback(() => {
        window.open(
            "/print/" +
                "invoice" +
                "/" +
                props.id +
                "/" +
                "?token=" +
                currentToken
        );
    }, [props.id, currentToken]);

    if (!data || !project || !allInvoices) {
        return <></>;
    }
    return (
        <>
            <MessageHeader>
                {calcProjectSummary(project)} Add to Accounting
            </MessageHeader>
            <MessageBody>
                <p>This invoice needs to be added to accounting</p>
                <Table>
                    <thead>
                        <tr>
                            <th>Number</th>
                            <th>Invoice Amount</th>
                            <th>Holdback</th>
                            <th>Net Claim</th>
                            <th>GST</th>
                            <th>Payment Requested</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allInvoices.map((invoice) => (
                            <tr key={invoice.id.uuid}>
                                <td>
                                    {invoice.id.uuid == data.id.uuid && (
                                        <>
                                            <FontAwesomeIcon
                                                icon={faChevronCircleRight}
                                            />{" "}
                                        </>
                                    )}
                                    {invoice.number.toString()}
                                </td>
                                <td>
                                    {formatMoney(
                                        calcInvoiceAmountTotal(invoice)
                                    )}
                                </td>
                                <td>
                                    {formatMoney(calcInvoiceHoldback(invoice))}
                                </td>
                                <td>
                                    {formatMoney(calcInvoiceNetClaim(invoice))}
                                </td>
                                <td>{formatMoney(calcInvoiceGst(invoice))}</td>
                                <td>
                                    {formatMoney(
                                        calcInvoicePaymentRequested(invoice)
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <th>Total</th>
                        <th>
                            {formatMoney(
                                sumMap(allInvoices, (invoice) =>
                                    calcInvoiceAmountTotal(invoice)
                                )
                            )}
                        </th>
                        <th>
                            {formatMoney(
                                sumMap(allInvoices, (invoice) =>
                                    calcInvoiceHoldback(invoice)
                                )
                            )}
                        </th>
                        <th>
                            {formatMoney(
                                sumMap(allInvoices, (invoice) =>
                                    calcInvoiceNetClaim(invoice)
                                )
                            )}
                        </th>
                        <th>
                            {formatMoney(
                                sumMap(allInvoices, (invoice) =>
                                    calcInvoiceGst(invoice)
                                )
                            )}
                        </th>
                        <th>
                            {formatMoney(
                                sumMap(allInvoices, (invoice) =>
                                    calcInvoicePaymentRequested(invoice)
                                )
                            )}
                        </th>
                    </tfoot>
                </Table>
                <FormWrapper label="Contact">
                    <FormControl
                        type="text"
                        disabled={true}
                        value={calcContactDetailSummary(data.contact)}
                    />
                </FormWrapper>
                <FormWrapper label="Special Instructions">
                    <div
                        dangerouslySetInnerHTML={{
                            __html: data.specialInstructions,
                        }}
                    />
                </FormWrapper>
            </MessageBody>
            <MessageFooter>
                <Button
                    style={{ marginLeft: "auto", display: "block" }}
                    disabled={false}
                    onClick={onPrint}
                >
                    Print
                </Button>
                <Button
                    style={{ marginLeft: "auto", display: "block" }}
                    disabled={false}
                    onClick={onAdded}
                >
                    Added
                </Button>
            </MessageFooter>
        </>
    );
}

export const UNADDED_TO_ACCOUNTING_INVOICE_SOURCE = NotificationSource({
    key: "unadded-to-accounting-invoice",
    label: "New Invoice",
    Component,
    table: INVOICE_META,
    active: calcInvoiceIsUnaddedToAccounting,
    sendToUsersWithPermission: "Inbox-show-unadded-to-accounting-invoice",
    date: (invoice) => invoice.date,
});
