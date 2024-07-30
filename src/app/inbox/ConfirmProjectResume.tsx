import Decimal from "decimal.js";
import React from "react";
import { Button, ModalBody, ModalFooter } from "react-bootstrap";
import Modal from "react-modal";
import { patchRecord } from "../../clay/api";
import { longDate } from "../../clay/LocalDate";
import { daysAgo, ifNull, isNull, lastItem } from "../../clay/queryFuncs";
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
            pauses: {
                _t: "a",
                [project!.pauses.length - 1]: {
                    confirmed: {
                        user: [null, user.id],
                        date: [null, new Date()],
                    },
                },
            },
        });

        props.setOpenItem(null);
    }, [props.id, user.id, project?.pauses.length, props.setOpenItem]);

    const [isDelaying, setDelaying] = React.useState(false);

    const newProjectStartDate = useLocalFieldWidget(DateWidget, null, {});

    const delayProject = React.useCallback(async () => {
        await patchRecord(PROJECT_META, "inbox", props.id, {
            pauses: {
                _t: "a",
                [project!.pauses.length - 1]: {
                    date: [
                        lastItem(project!.pauses, (x) => x.date!.toString()),
                        newProjectStartDate.data!.toString(),
                    ],
                },
            },
        });

        props.setOpenItem(null);
    }, [
        props.id,
        project?.pauses,
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
                <ModalHeader>Delay Project Resume</ModalHeader>
                <ModalBody>
                    <FormWrapper label="New Project Resume Date">
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
                {calcProjectSummary(project)} Confirm Project Resume
            </MessageHeader>
            <MessageBody>
                <p>
                    Project Scheduled to resume on:{" "}
                    {longDate(
                        lastItem(project.pauses, (pause) =>
                            pause.date!.asDate()
                        )
                    )}
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
                    Confirm Resume
                </Button>
                <Button
                    style={{ marginLeft: "1em", display: "block" }}
                    disabled={false}
                    onClick={() => setDelaying(true)}
                    variant="success"
                >
                    Delay Resume
                </Button>
            </MessageFooter>
        </>
    );
}

export const PROJECT_CONFIRM_RESUME_SOURCE = NotificationSource({
    key: "project-confirm-resume",
    label: "Project Confirm Resume",
    Component,
    table: PROJECT_META,
    active: (x) =>
        ifNull(
            lastItem(
                x.pauses,
                (y) =>
                    ifNull(daysAgo(y.date), new Decimal("-100")).greaterThan(
                        new Decimal("-14")
                    ) && isNull(y.confirmed.user)
            ),
            false
        ),
    sendToProjectRoleWithPermission: "Inbox-show-confirm-project-start",
    date: (x) => x.projectStartDate,
});
