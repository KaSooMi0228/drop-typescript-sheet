import { isNull } from "lodash";
import React from "react";
import { Alert, Button } from "react-bootstrap";
import { patchRecord } from "../../clay/api";
import {
    useQuickAllRecords,
    useQuickCache,
    useQuickRecord,
} from "../../clay/quick-cache";
import { FormWrapper } from "../../clay/widgets/FormField";
import { FieldRow } from "../../clay/widgets/layout";
import { MoneyStatic } from "../../clay/widgets/money-widget";
import { PercentageStatic } from "../../clay/widgets/percentage-widget";
import { TextAreaWidget } from "../../clay/widgets/TextAreaWidget";
import { StaticTextField } from "../../clay/widgets/TextWidget";
import {
    calcPayoutAmountTotal,
    calcPayoutCertifiedForemanAmountTotal,
    calcPayoutCertifiedForemanProfitMargin,
    calcPayoutHasExtraCompensation,
    calcPayoutHasMarginVariance,
    calcPayoutRemdalWholeMargin,
    calcPayoutTotalNonCertifiedForemanExpenses,
    computePayoutMarginVarianceDescription,
    PAYOUT_META,
} from "../payout/table";
import { calcProjectSummary, PROJECT_META } from "../project/table";
import { useUser } from "../state";
import {
    ROLE_CERTIFIED_FOREMAN,
    ROLE_PROJECT_MANAGER,
    USER_META,
} from "../user/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource from "./NotificationSource";
import { ITEM_TYPE } from "./types";
import { useLocalFieldWidget } from "./useLocalWidget";

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const user = useUser();
    const users = useQuickAllRecords(USER_META);
    const cache = useQuickCache();
    const data = useQuickRecord(PAYOUT_META, props.id);
    const project = useQuickRecord(PROJECT_META, data?.project || null);

    const reason = useLocalFieldWidget(TextAreaWidget, "", {});

    const description = React.useMemo(
        () =>
            data &&
            users &&
            computePayoutMarginVarianceDescription(data, users),
        [data, users]
    );

    const onApprove = React.useCallback(async () => {
        if (!data || !description) {
            return;
        }
        await patchRecord(PAYOUT_META, "inbox", props.id, {
            marginVarianceReason: ["", reason.data],
            marginVarianceApproved: {
                user: [null, user.id],
                date: [null, new Date()],
            },
            marginVarianceDescription: [[], description],
        });
        props.setOpenItem(null);
    }, [user.id, reason.data, props.setOpenItem]);

    if (!data || !project) {
        return <></>;
    }
    return (
        <>
            <MessageHeader>
                {calcProjectSummary(project)} Approve Margin Variance
            </MessageHeader>
            <MessageBody>
                <p>Approve Margin Variance</p>
                <FieldRow>
                    {project.personnel
                        .filter((entry) => entry.role == ROLE_PROJECT_MANAGER)
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
                        .filter((entry) => entry.role == ROLE_CERTIFIED_FOREMAN)
                        .map((entry) => (
                            <FormWrapper
                                label="Certified Foreman"
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
                </FieldRow>
                <table>
                    <tr>
                        <td>
                            <FormWrapper label="Remdal Contract Value">
                                <MoneyStatic
                                    value={calcPayoutAmountTotal(data)}
                                />
                            </FormWrapper>
                        </td>
                        <td>
                            <FormWrapper label="CF Contract Value">
                                <MoneyStatic
                                    value={calcPayoutCertifiedForemanAmountTotal(
                                        data
                                    )}
                                />
                            </FormWrapper>
                        </td>
                        <td>
                            <FormWrapper label="Non-Certified Foreman Expenses">
                                <MoneyStatic
                                    value={calcPayoutTotalNonCertifiedForemanExpenses(
                                        data
                                    )}
                                />
                            </FormWrapper>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <FormWrapper label="Remdal Profit Margin">
                                <PercentageStatic
                                    value={calcPayoutRemdalWholeMargin(data)}
                                />
                            </FormWrapper>
                        </td>
                        {data.certifiedForemen.map((cf) => (
                            <td>
                                <FormWrapper
                                    label={
                                        "CF Profit Margin: " +
                                        cache.get(
                                            USER_META,
                                            cf.certifiedForeman
                                        )?.code
                                    }
                                    key={cf.certifiedForeman}
                                >
                                    <PercentageStatic
                                        value={calcPayoutCertifiedForemanProfitMargin(
                                            cf,
                                            data
                                        )}
                                    />
                                </FormWrapper>
                            </td>
                        ))}
                    </tr>
                </table>
                {description && (
                    <Alert variant="danger">
                        <ul>
                            {description.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </Alert>
                )}
                <FormWrapper label="PM's Explanation for Variance">
                    <StaticTextField value={data.marginVarianceExplanation} />
                </FormWrapper>
                <FormWrapper label="Explanation for Variance">
                    {reason.component}
                </FormWrapper>
            </MessageBody>
            <MessageFooter>
                <Button
                    onClick={() => {
                        window.open(
                            "#/project/edit/" +
                                data.project +
                                "/wrapup/payout/" +
                                props.id
                        );
                        props.setOpenItem(null);
                    }}
                >
                    Open Payout
                </Button>
                <Button
                    disabled={!reason.isValid}
                    onClick={onApprove}
                    style={{ marginLeft: "auto", display: "block" }}
                >
                    Approve Margin Variance
                </Button>
            </MessageFooter>
        </>
    );
}

export const APPROVE_MARGIN_VARIANCE_SOURCE = NotificationSource({
    key: "approve-margin-variance",
    label: "Approve Margin Variance",
    Component,
    table: PAYOUT_META,
    active: (payout) =>
        (calcPayoutHasMarginVariance(payout) ||
            calcPayoutHasExtraCompensation(payout)) &&
        isNull(payout.marginVarianceApproved.date) &&
        isNull(payout.addedToAccountingSoftware.date),
    sendToCategoryManager: true,
    sendToUsersWithPermission: "Inbox-show-all-margin-variance-approvals",
    date: (x) => x.addedDateTime,
});
