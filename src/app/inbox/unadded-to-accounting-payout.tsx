import { Button } from "react-bootstrap";
import { longDate } from "../../clay/LocalDate";
import { useQuickCache, useQuickRecord } from "../../clay/quick-cache";
import { FormWrapper } from "../../clay/widgets/FormField";
import { MoneyStatic } from "../../clay/widgets/money-widget";
import { StaticTextField } from "../../clay/widgets/TextWidget";
import {
    calcPayoutCertifiedForemanAmountTotal,
    calcPayoutCertifiedForemanProfitMargin,
    calcPayoutIsUnaddedToAccounting,
    calcPayoutIsUnaddedToAccountingLabel,
    calcPayoutRemdalAmount,
    calcPayoutRemdalWholeMargin,
    calcPayoutTotalNonCertifiedForemanExpenses,
    PAYOUT_META,
} from "../payout/table";
import { calcProjectSummary, PROJECT_META } from "../project/table";
import { useUser } from "../state";
import { ROLE_ESTIMATOR, ROLE_PROJECT_MANAGER, USER_META } from "../user/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource from "./NotificationSource";
import { ITEM_TYPE } from "./types";
import * as React from "react";

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const user = useUser();
    const cache = useQuickCache();
    const data = useQuickRecord(PAYOUT_META, props.id);
    const project = useQuickRecord(PROJECT_META, data?.project || null);

    if (!data || !project) {
        return <></>;
    }
    return (
        <>
            <MessageHeader>
                {calcProjectSummary(project)} Add to Accounting
            </MessageHeader>
            <MessageBody>
                <p>This payout needs to be added to accounting</p>
                {data.marginVarianceApproved.user !== null && (
                    <>
                        {project.personnel
                            .filter(
                                (entry) => entry.role == ROLE_PROJECT_MANAGER
                            )
                            .map((entry) => (
                                <FormWrapper
                                    label="Project Manager"
                                    key={entry.user}
                                >
                                    <StaticTextField
                                        value={
                                            cache.get(USER_META, entry.user)
                                                ?.name || ""
                                        }
                                    />
                                </FormWrapper>
                            ))}
                        {project.personnel
                            .filter((entry) => entry.role == ROLE_ESTIMATOR)
                            .map((entry) => (
                                <FormWrapper label="Estimator" key={entry.user}>
                                    <StaticTextField
                                        value={
                                            cache.get(USER_META, entry.user)
                                                ?.name || ""
                                        }
                                    />
                                </FormWrapper>
                            ))}
                        <FormWrapper label="Remdal Contact Value">
                            <MoneyStatic value={calcPayoutRemdalAmount(data)} />
                        </FormWrapper>
                        <FormWrapper label="CF Contract Value">
                            <MoneyStatic
                                value={calcPayoutCertifiedForemanAmountTotal(
                                    data
                                )}
                            />
                        </FormWrapper>
                        <FormWrapper label="Non-Certified Foreman Expenses">
                            <MoneyStatic
                                value={calcPayoutTotalNonCertifiedForemanExpenses(
                                    data
                                )}
                            />
                        </FormWrapper>
                        <FormWrapper label="Remdal Profit Margin">
                            <MoneyStatic
                                value={calcPayoutRemdalWholeMargin(data)}
                            />
                        </FormWrapper>
                        {data.certifiedForemen.map((cf) => (
                            <FormWrapper
                                label={
                                    "CF Profit Margin: " +
                                    cache.get(USER_META, cf.certifiedForeman)
                                        ?.code
                                }
                                key={cf.certifiedForeman}
                            >
                                <MoneyStatic
                                    value={calcPayoutCertifiedForemanProfitMargin(
                                        cf,
                                        data
                                    )}
                                />
                            </FormWrapper>
                        ))}
                        <FormWrapper label="Variance Approved">
                            <StaticTextField
                                value={
                                    longDate(
                                        data.marginVarianceApproved.date
                                    ) || ""
                                }
                            />
                        </FormWrapper>
                        <FormWrapper label="Variance Approval Reason">
                            <StaticTextField
                                value={data.marginVarianceReason}
                            />
                        </FormWrapper>
                    </>
                )}
            </MessageBody>
            <MessageFooter>
                <Button
                    onClick={() => {
                        window.open(
                            "#/project/edit/" + project.id.uuid + "/wrapup"
                        );
                    }}
                    style={{ marginTop: "1em", maxWidth: "10em" }}
                >
                    Open Project
                </Button>
            </MessageFooter>
        </>
    );
}

export const UNADDED_TO_ACCOUNTING_PAYOUT_SOURCE = NotificationSource({
    key: "unadded-to-accounting-payout",
    Component,
    table: PAYOUT_META,
    active: calcPayoutIsUnaddedToAccounting,
    label: calcPayoutIsUnaddedToAccountingLabel,
    date: (payout) => payout.date,
    sendToUsersWithPermission: "Inbox-show-unadded-to-accounting-payout",
});
