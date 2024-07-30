import Decimal from "decimal.js";
import * as EmailValidator from "email-validator";
import { find, range, some } from "lodash";
import * as React from "react";
import { Button, FormControl, ModalTitle, Table } from "react-bootstrap";
import Modal from "react-modal";
import Select from "react-select";
import ReactSwitch from "react-switch";
import {
    patchRecord,
    PRINT_EVENTS,
    storeRecord,
    useRecordQuery,
} from "../../../clay/api";
import { genUUID, newUUID } from "../../../clay/uuid";
import { FormWrapper } from "../../../clay/widgets/FormField";
import { ListWidget } from "../../../clay/widgets/ListWidget";
import { selectStyle } from "../../../clay/widgets/SelectLinkWidget";
import {
    buildCompanyDetail,
    ContactDetail,
    CONTACT_META,
} from "../../contact/table";
import { useLocalFieldWidget } from "../../inbox/useLocalWidget";
import ModalHeader from "../../ModalHeader";
import { SurveyAnswer } from "../../project-description/table";
import { widgets as projectWidgets } from "../ProjectWidget.widget";
import { calcProjectDescriptionCategories, Project } from "../table";
import AdditionalEmailWidget from "./AdditionalEmailWidget.widget";
import {
    CustomerSurvey,
    CustomerSurveyTemplate,
    CUSTOMER_SURVEY_META,
    CUSTOMER_SURVEY_TEMPLATE_META,
} from "./table";

function contact_rows(
    setTarget: (value: ContactDetail[]) => void,
    contacts: ContactDetail[],
    target: ContactDetail[]
) {
    const updateContact = React.useCallback(
        (contact: ContactDetail, value: boolean) => {
            if (value) {
                setTarget([...target, contact]);
            } else {
                setTarget(target.filter((x) => x.contact !== contact.contact));
            }
        },
        [target, setTarget]
    );

    const updateEmail = React.useCallback(
        (
            contact: ContactDetail,
            event: React.ChangeEvent<HTMLInputElement>
        ) => {
            setTarget(
                target.map((x) => {
                    if (x.contact === contact.contact) {
                        return {
                            ...x,
                            email: event.target.value,
                        };
                    } else {
                        return x;
                    }
                })
            );
        },
        [target, setTarget]
    );

    return contacts.map((contact, index) => {
        const activeTarget = find(target, (x) => contact.contact == x.contact);
        return (
            <tr key={index}>
                <td>
                    <ReactSwitch
                        checked={!!activeTarget}
                        onChange={updateContact.bind(undefined, contact)}
                    />
                </td>
                <td>{contact.name}</td>
                <td>
                    <FormControl
                        type="text"
                        disabled={!activeTarget}
                        value={activeTarget?.email || contact.email}
                        className={
                            activeTarget
                                ? EmailValidator.validate(activeTarget.email)
                                    ? "is-valid"
                                    : "is-invalid"
                                : "is-empty"
                        }
                        onChange={updateEmail.bind(undefined, contact)}
                    />
                </td>
            </tr>
        );
    });
}

const SCALE_1_TO_10_ANSWERS: SurveyAnswer[] = range(1, 11).map((index) => ({
    id: { uuid: "e5991bf7-6577-4ae8-bf11-44b246bab11" + (index - 1) },
    name: `${index}`,
    score: new Decimal(index),
}));

function updateContacts(contacts: ContactDetail[], target: ContactDetail[]) {
    return contacts.map((contact) => {
        const active = find(target, (y) => y.contact == contact.contact);
        if (active && contact.email !== active.email) {
            patchRecord(
                CONTACT_META,
                "project-customer-popup",
                contact.contact!,
                {
                    email: [contact.email, active.email],
                }
            );

            return {
                ...contact,
                email: active.email,
            };
        }
        return contact;
    });
}

const AdditionalEmailsWidget = ListWidget(AdditionalEmailWidget, {
    emptyOk: true,
});

export function CustomerSurveyPopup(props: {
    project: Project;
    requestClose: () => void;
    updateContacts: (
        contacts: ContactDetail[],
        billingContacts: ContactDetail[]
    ) => void;
}) {
    const customerSurveyTemplates =
        useRecordQuery(
            CUSTOMER_SURVEY_TEMPLATE_META,
            {
                filters: [
                    {
                        column: "category",
                        filter: {
                            in: calcProjectDescriptionCategories(props.project),
                        },
                    },
                ],
            },
            [props.project]
        ) || [];
    const [target, setTarget] = React.useState<ContactDetail[]>([]);
    const [surveyTemplate, setSurveyTemplate] =
        React.useState<null | CustomerSurveyTemplate>(null);

    const additionalEmails = useLocalFieldWidget(AdditionalEmailsWidget, [], {
        extraItemForAdd: true,
        containerClass: "tbody",
    });

    const clickGenerate = React.useCallback(() => {
        const generateId = genUUID();

        PRINT_EVENTS.emit("started", {
            id: generateId,
            template: "Customer Survey",
        });
        props.updateContacts(
            updateContacts(props.project.contacts, target),
            updateContacts(props.project.billingContacts, target)
        );

        const allTargets: ContactDetail[] = [
            ...target,
            ...additionalEmails.data.map((entry) => ({
                contact: null,
                name: entry.name,
                email: entry.email,
                phones: [],
                type: null,
                company: buildCompanyDetail(null),
                unitNumber: "",
            })),
        ];

        for (const contact of allTargets) {
            const newSurvey: CustomerSurvey = {
                id: newUUID(),
                template: surveyTemplate!.id.uuid,
                addedDateTime: null,
                addedBy: null,
                firstDate: null,
                date: null,
                recordVersion: { version: null },
                project: props.project.id.uuid,
                sections: surveyTemplate!.sections.map((section) => ({
                    name: section.name,
                    questions: section.questions.map((question) => ({
                        id: question.id,
                        question: question.question,
                        sendToCustomer: question.sendToCustomer,
                        controlsSection: question.controlsSection,
                        answers: question.scale1to10
                            ? SCALE_1_TO_10_ANSWERS
                            : question.answers,
                        selectedAnswer: null,
                        comment: "",
                    })),
                })),
                contact: contact,
                contacts: [],
                customerEmail: "",
                reminderSent: false,
                sent: false,
                dismissedBy: [],
            };
            storeRecord(CUSTOMER_SURVEY_META, "project", newSurvey);
        }
        PRINT_EVENTS.emit("finished", {
            id: generateId,
            target: allTargets.map((x) => x.email),
        });
        props.requestClose();
    }, [
        surveyTemplate,
        props.project,
        target,
        props.requestClose,
        additionalEmails.data,
    ]);

    React.useEffect(() => {
        if (
            surveyTemplate == null &&
            customerSurveyTemplates &&
            customerSurveyTemplates.length === 1
        ) {
            setSurveyTemplate(customerSurveyTemplates[0]);
        }
    }, [surveyTemplate, customerSurveyTemplates]);

    const hasEmails = target.length > 0 || additionalEmails.data.length > 0;

    return (
        <>
            <Modal isOpen={true} onRequestClose={props.requestClose}>
                <ModalHeader>
                    <ModalTitle>Generate Surveys</ModalTitle>
                </ModalHeader>
                <div>
                    <Table>
                        <thead>
                            <th></th>
                            <th>Name</th>
                            <th>Email</th>
                        </thead>
                        <tbody>
                            {contact_rows(
                                setTarget,
                                props.project.billingContacts,
                                target
                            )}
                            {contact_rows(
                                setTarget,
                                props.project.contacts,
                                target
                            )}
                        </tbody>
                        {additionalEmails.component}
                    </Table>
                </div>
                <FormWrapper label="Template">
                    <Select
                        value={surveyTemplate}
                        getOptionLabel={(template) => template.name}
                        getOptionValue={(template) => template.id.uuid}
                        styles={selectStyle(surveyTemplate === null)}
                        options={customerSurveyTemplates || []}
                        onChange={setSurveyTemplate}
                        menuPlacement="auto"
                    />
                </FormWrapper>
                {!hasEmails && (
                    <projectWidgets.customerSurveyMissingReason label="Explain why you're not sending out a customer survey link at this time." />
                )}
                {hasEmails && (
                    <Button
                        disabled={
                            surveyTemplate === null ||
                            !additionalEmails.isValid ||
                            some(
                                target,
                                (x) => !EmailValidator.validate(x.email)
                            )
                        }
                        onClick={clickGenerate}
                    >
                        Generate
                    </Button>
                )}
                {!hasEmails && (
                    <Button
                        onClick={props.requestClose}
                        variant="danger"
                        disabled={
                            props.project.customerSurveyMissingReason === ""
                        }
                    >
                        Do Not Send
                    </Button>
                )}
            </Modal>
        </>
    );
}
