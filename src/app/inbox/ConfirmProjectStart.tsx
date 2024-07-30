import Decimal from "decimal.js";
import React from "react";
import { Button, ModalBody, ModalFooter } from "react-bootstrap";
import Modal from "react-modal";
import { patchRecord } from "../../clay/api";
import { longDate } from "../../clay/LocalDate";
import { daysAgo, ifNull, isNull } from "../../clay/queryFuncs";
import { useQuickRecord } from "../../clay/quick-cache";
import { DateWidget } from "../../clay/widgets/DateWidget";
import { FormWrapper } from "../../clay/widgets/FormField";
import ModalHeader from "../ModalHeader";
import { calcProjectSummary, PROJECT_META } from "../project/table";
import { useUser } from "../state";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import NotificationSource from "./NotificationSource";
import { ITEM_TYPE } from "./types";
import { useLocalFieldWidget } from "./useLocalWidget";

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const user = useUser();
    const project = useQuickRecord(PROJECT_META, props.id);

    const onOpenProject = React.useCallback(async () => {
        window.open("#/project/edit/" + props.id + "/");

        props.setOpenItem(null);
    }, [props.id, props.setOpenItem]);

    const onConfirmStart = React.useCallback(async () => {
        await patchRecord(PROJECT_META, "inbox", props.id, {
            projectStartDateConfirmed: {
                user: [null, user.id],
                date: [null, new Date().toISOString()],
            },
        });

        props.setOpenItem(null);
    }, [props.id, user.id, props.setOpenItem]);

    const [isDelaying, setDelaying] = React.useState(false);

    const newProjectStartDate = useLocalFieldWidget(DateWidget, null, {});

    const delayProject = React.useCallback(async () => {
        await patchRecord(PROJECT_META, "inbox", props.id, {
            projectStartDate: [
                project?.projectStartDate!.toString(),
                newProjectStartDate.data!.toString(),
            ],
        });

        props.setOpenItem(null);
    }, [
        props.id,
        project?.projectStartDate,
        newProjectStartDate.data,
        props.setOpenItem,
    ]);
    if (!project) {
        return <></>;
    }
    return (
        <>
            <Modal
                isOpen={isDelaying}
                onRequestClose={() => {
                    setDelaying(false);
                }}
            >
                <ModalHeader>Delay Project Start</ModalHeader>
                <ModalBody>
                    <FormWrapper label="New Project Start Date">
                        {newProjectStartDate.component}
                    </FormWrapper>
                </ModalBody>
                <ModalFooter>
                    <Button
                        disabled={!newProjectStartDate.isValid}
                        onClick={delayProject}
                    >
                        Delay Project
                    </Button>
                </ModalFooter>
            </Modal>

            <MessageHeader>
                {calcProjectSummary(project)} Confirm Project Start
            </MessageHeader>
            <MessageBody>
                <p>
                    Project Scheduled to start on:{" "}
                    {longDate(project.projectStartDate!.asDate())}
                </p>
            </MessageBody>
            <MessageFooter>
                <Button
                    style={{ marginLeft: "auto", display: "block" }}
                    disabled={false}
                    onClick={onOpenProject}
                >
                    Open Project
                </Button>
                <Button
                    style={{ marginLeft: "1em", display: "block" }}
                    disabled={false}
                    onClick={onConfirmStart}
                    variant="success"
                >
                    Confirm Start
                </Button>
                <Button
                    style={{ marginLeft: "1em", display: "block" }}
                    disabled={false}
                    onClick={() => setDelaying(true)}
                    variant="success"
                >
                    Delay Start
                </Button>
            </MessageFooter>
        </>
    );
}

export const PROJECT_CONFIRM_START_SOURCE = NotificationSource({
    key: "project-confirm-start",
    label: "Project Confirm Start",
    Component,
    table: PROJECT_META,
    active: (x) =>
        ifNull(daysAgo(x.projectStartDate), new Decimal("-100")).greaterThan(
            new Decimal("-14")
        ) && isNull(x.projectStartDateConfirmed.user),
    sendToProjectRoleWithPermission: "Inbox-show-confirm-project-start",
    date: (x) => x.projectStartDate,
});
