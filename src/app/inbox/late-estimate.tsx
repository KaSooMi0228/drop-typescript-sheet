import { addDays } from "date-fns";
import * as React from "react";
import { Button } from "react-bootstrap";
import { patchRecord } from "../../clay/api";
import { LocalDate, longDate } from "../../clay/LocalDate";
import { useQuickCache, useQuickRecord } from "../../clay/quick-cache";
import { FormWrapper } from "../../clay/widgets/FormField";
import { FieldRow } from "../../clay/widgets/layout";
import { StaticTextField } from "../../clay/widgets/TextWidget";
import EstimateDelayWidget from "../project/estimate-delay.widget";
import {
    calcProjectIsEstimateLate,
    calcProjectSummary,
    EstimateDelayToJSON,
    PROJECT_META,
} from "../project/table";
import { useUser } from "../state";
import { ROLE_ESTIMATOR, USER_META } from "../user/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource from "./NotificationSource";
import { ITEM_TYPE } from "./types";
import { useLocalWidget } from "./useLocalWidget";

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const project = useQuickRecord(PROJECT_META, props.id);
    const cache = useQuickCache();
    const user = useUser();
    const delayWidget = useLocalWidget(EstimateDelayWidget, {
        user: user.id,
        addedDate: new Date(),
        message: "",
        delayUntil: new LocalDate(addDays(new Date(), 7)),
        dismissed: [],
    });

    const onDelay = React.useCallback(async () => {
        await patchRecord(PROJECT_META, "inbox", props.id, {
            estimateDelays: {
                _t: "a",
                append: EstimateDelayToJSON(delayWidget.data),
            },
        });
        props.setOpenItem(null);
    }, [props.setOpenItem, delayWidget.data]);

    if (!project) {
        return <></>;
    }
    return (
        <>
            <MessageHeader>
                {calcProjectSummary(project)} Quotation Late
            </MessageHeader>
            <MessageBody>
                {project.personnel
                    .filter((entry) => entry.role === ROLE_ESTIMATOR)
                    .map((entry) => {
                        <FormWrapper label="Estimator">
                            <StaticTextField
                                value={
                                    cache.get(USER_META, entry.user)?.name || ""
                                }
                            />
                        </FormWrapper>;
                    })}
                <FieldRow>
                    <FormWrapper label="RFQ Entered By">
                        <StaticTextField
                            value={
                                cache.get(
                                    USER_META,
                                    project.quoteRequestCompletedBy
                                )?.name || ""
                            }
                        />
                    </FormWrapper>
                    <FormWrapper label="Quote Request Date">
                        <StaticTextField
                            value={longDate(project.quoteRequestDate) || ""}
                        />
                    </FormWrapper>
                </FieldRow>
                <FormWrapper label="Client's request">
                    <div
                        dangerouslySetInnerHTML={{
                            __html: project.customersRequest.value,
                        }}
                    />
                    {project.additionalCustomersRequests.map((request) => (
                        <div
                            dangerouslySetInnerHTML={{
                                __html: request.value,
                            }}
                        />
                    ))}
                </FormWrapper>
                {delayWidget.component}
            </MessageBody>
            <MessageFooter>
                <Button
                    onClick={() => {
                        window.open(
                            "#/project/edit/" + props.id + "/estimates"
                        );
                        props.setOpenItem(null);
                    }}
                    style={{ marginTop: "1em", maxWidth: "10em" }}
                >
                    Open Project
                </Button>
                <Button
                    style={{ marginLeft: "auto" }}
                    onClick={onDelay}
                    disabled={!delayWidget.isValid}
                >
                    Delay Estimate
                </Button>
            </MessageFooter>
        </>
    );
}

export const LATE_ESTIMATE_SOURCE = NotificationSource({
    key: "late-estimate",
    label: "Late Proposal",
    Component,
    table: PROJECT_META,
    sendToCategoryManager: true,
    sendToProjectRoleWithPermission: "Inbox-show-late-estimate",
    active: calcProjectIsEstimateLate,
    date: (project) => project.quoteRequestDate,
    dated: true,
    priority: true,
});
