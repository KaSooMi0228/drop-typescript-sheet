import * as React from "react";
import { Button } from "react-bootstrap";
import { patchRecord } from "../../clay/api";
import { lastItem } from "../../clay/queryFuncs";
import { useQuickCache } from "../../clay/quick-cache";
import { FormWrapper } from "../../clay/widgets/FormField";
import { StaticTextArea } from "../../clay/widgets/TextAreaWidget";
import { StaticTextField } from "../../clay/widgets/TextWidget";
import { calcAddressLineFormatted } from "../address";
import ProjectRfqToQWidget from "../project/ProjectRfqToQWidget.widget";
import {
    calcProjectEstimateDelayDate,
    calcProjectEstimateDelayDismissed,
    calcProjectIsEstimateDelayed,
    calcProjectSummary,
    PROJECT_META,
} from "../project/table";
import { useUser } from "../state";
import { ROLE_ESTIMATOR, USER_META } from "../user/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource from "./NotificationSource";
import { ITEM_TYPE } from "./types";
import { useRecordWidget } from "./useRecordWidget";

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const cache = useQuickCache();

    const widget = useRecordWidget(
        ProjectRfqToQWidget,
        props.id,
        props.setOpenItem,
        false
    );
    const user = useUser();
    const data = widget.data;

    const onDismiss = React.useCallback(() => {
        if (!data) {
            throw new Error("Should not happen");
        }
        patchRecord(PROJECT_META, "inbox", props.id, {
            estimateDelays: {
                _t: "a",
                [data.estimateDelays.length - 1]: {
                    dismissed: {
                        _t: "a",
                        append: user.id,
                    },
                },
            },
        });
        props.setOpenItem(null);
    }, [props.id, data, user.id, props.setOpenItem]);

    if (!data) {
        return <></>;
    }
    return (
        <>
            <MessageHeader>{calcProjectSummary(data)}</MessageHeader>
            <MessageBody>
                <FormWrapper label="Client's Name">
                    <StaticTextField value={data.customer} />
                </FormWrapper>
                <FormWrapper label="Site Address">
                    <StaticTextField
                        value={calcAddressLineFormatted(data.siteAddress)}
                    />
                </FormWrapper>
                {data.personnel
                    .filter((entry) => entry.role == ROLE_ESTIMATOR)
                    .map((entry) => (
                        <FormWrapper label="Estimator" key={entry.user}>
                            <StaticTextField
                                value={
                                    cache.get(USER_META, entry.user)?.name || ""
                                }
                            />
                        </FormWrapper>
                    ))}
                <FormWrapper label="Reason for Delay">
                    <StaticTextArea
                        value={
                            lastItem(
                                data.estimateDelays,
                                (delay) => delay.message
                            ) || ""
                        }
                    />
                </FormWrapper>
                {widget.component}
            </MessageBody>
            <MessageFooter>
                <Button disabled={false} variant="danger" onClick={onDismiss}>
                    Dismiss
                </Button>
                <Button
                    style={{ marginLeft: "auto", display: "block" }}
                    onClick={() => {
                        window.open(
                            "#/project/edit/" + props.id + "/estimates"
                        );
                        props.setOpenItem(null);
                    }}
                >
                    Open Project
                </Button>
            </MessageFooter>
        </>
    );
}

export const ESTIMATE_DELAYED_SOURCE = NotificationSource({
    key: "estimate-delayed",
    label: "Proposal Delayed",
    table: PROJECT_META,
    Component,
    active: calcProjectIsEstimateDelayed,
    date: calcProjectEstimateDelayDate,
    dismissed: calcProjectEstimateDelayDismissed,
    sendToQuoteRequestor: true,
    sendToCategoryManager: true,
});
