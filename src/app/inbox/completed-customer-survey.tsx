import { format as formatDate } from "date-fns";
import Decimal from "decimal.js";
import { find } from "lodash";
import * as React from "react";
import { Button } from "react-bootstrap";
import { generateDocument, patchRecord } from "../../clay/api";
import { daysAgo } from "../../clay/queryFuncs";
import { useQuickCache, useQuickRecord } from "../../clay/quick-cache";
import { FormWrapper } from "../../clay/widgets/FormField";
import { FieldRow } from "../../clay/widgets/layout";
import { QuantityStatic } from "../../clay/widgets/number-widget";
import { StaticTextField } from "../../clay/widgets/TextWidget";
import {
    calcCustomerSurveyIsCompleted,
    CUSTOMER_SURVEY_META,
} from "../project/customer-survey/table";
import { computeScore } from "../project/site-visit-report/table";
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

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const user = useUser();
    const customerSurvey = useQuickRecord(CUSTOMER_SURVEY_META, props.id);

    const project = useQuickRecord(
        PROJECT_META,
        customerSurvey?.project || null
    );

    const cache = useQuickCache();

    const onDismiss = React.useCallback(() => {
        patchRecord(CUSTOMER_SURVEY_META, "inbox", props.id, {
            dismissedBy: {
                _t: "a",
                append: user.id,
            },
        });
        props.setOpenItem(null);
    }, [props.id, props.setOpenItem]);

    const onGenerate = React.useCallback(() => {
        generateDocument("customerSurvey", [props.id], true);
    }, [props.id]);

    if (!customerSurvey || !project) {
        return <></>;
    }

    const score = computeScore(customerSurvey);

    const rfiQuestion = customerSurvey.sections
        .flatMap((section) => section.questions)
        .filter((question) => question.answers.length == 10)[0];
    const rfiAnswer =
        rfiQuestion &&
        find(
            rfiQuestion.answers,
            (answer) => answer.id.uuid === rfiQuestion.selectedAnswer
        );
    return (
        <>
            <MessageHeader>
                {calcProjectSummary(project)} Customer Survey Completed
            </MessageHeader>
            <MessageBody>
                <FieldRow>
                    <FormWrapper label="Completed By">
                        <StaticTextField value={customerSurvey.contact.name} />
                    </FormWrapper>
                    <FormWrapper label="Client">
                        <StaticTextField value={project.customer} />
                    </FormWrapper>
                </FieldRow>
                <FieldRow>
                    {project.personnel
                        .filter((x) => x.role === ROLE_PROJECT_MANAGER)
                        .map((x) => (
                            <FormWrapper key={x.user} label="Project Manager">
                                <StaticTextField
                                    value={
                                        cache.get(USER_META, x.user)?.name || ""
                                    }
                                />
                            </FormWrapper>
                        ))}
                    {project.personnel
                        .filter((x) => x.role === ROLE_CERTIFIED_FOREMAN)
                        .map((x) => (
                            <FormWrapper key={x.user} label="Certified Foreman">
                                <StaticTextField
                                    value={
                                        cache.get(USER_META, x.user)?.name || ""
                                    }
                                />
                            </FormWrapper>
                        ))}
                </FieldRow>
                <FieldRow>
                    {customerSurvey.addedDateTime && (
                        <FormWrapper label="Date Requested">
                            <StaticTextField
                                value={formatDate(
                                    customerSurvey.addedDateTime,
                                    "Y-M-d p"
                                )}
                            />
                        </FormWrapper>
                    )}
                    {customerSurvey.date && (
                        <FormWrapper label="Date Completed">
                            <StaticTextField
                                value={formatDate(
                                    customerSurvey.date,
                                    "Y-M-d p"
                                )}
                            />
                        </FormWrapper>
                    )}
                </FieldRow>
                <FieldRow>
                    <FormWrapper label="Overall Score">
                        <StaticTextField
                            value={
                                score.points
                                    .dividedBy(score.total)
                                    .times(100)
                                    .round() + "%"
                            }
                        />
                    </FormWrapper>
                    <FormWrapper label="RFI">
                        <StaticTextField value={rfiAnswer?.name || ""} />
                    </FormWrapper>
                </FieldRow>
                {customerSurvey.sections.map((section) => (
                    <>
                        <h2>{section.name}</h2>
                        {section.questions.map((question) => {
                            const answer = find(
                                question.answers,
                                (answer) =>
                                    answer.id.uuid == question.selectedAnswer
                            );
                            return (
                                <>
                                    <FormWrapper label={question.question}>
                                        {answer && (
                                            <FieldRow>
                                                <StaticTextField
                                                    value={answer.name}
                                                />
                                                {answer.score && (
                                                    <QuantityStatic
                                                        value={answer.score}
                                                    />
                                                )}
                                            </FieldRow>
                                        )}
                                        <textarea disabled>
                                            {question.comment}
                                        </textarea>
                                    </FormWrapper>
                                </>
                            );
                        })}
                    </>
                ))}
            </MessageBody>
            <MessageFooter>
                <Button disabled={false} variant="danger" onClick={onDismiss}>
                    Dismiss
                </Button>
                <Button
                    style={{ marginLeft: "auto", display: "block" }}
                    disabled={false}
                    onClick={onGenerate}
                >
                    Generate
                </Button>
                <Button
                    style={{ marginLeft: "1em", display: "block" }}
                    onClick={() => {
                        window.open(
                            "#/project/edit/" + customerSurvey.project + "/"
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

export const CUSTOMER_SURVEY_COMPLETED_SOURCE = NotificationSource({
    Component,
    key: "customer-survey-completed",
    label: "Customer Survey Completed",
    table: CUSTOMER_SURVEY_META,
    active: (survey) =>
        calcCustomerSurveyIsCompleted(survey) &&
        daysAgo(survey.date)!.lt(new Decimal(30)),
    sendToProjectRoleWithPermission: "Inbox-show-my-completed-customer-surveys",
    sendToUsersWithPermission: "Inbox-show-all-completed-customer-surveys",
    sendToCategoryManager: true,
    date: (x) => x.date,
    dismissed: (x) => x.dismissedBy,
});
