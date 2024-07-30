import { User } from "@sentry/node";
import dateParse from "date-fns/parseISO";
import { Project } from "ts-morph";
import { Quantity } from "../../../clay/common";
import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { firstMatch, ifNull, isNotNull } from "../../../clay/queryFuncs";
import { genUUID, UUID } from "../../../clay/uuid";
import { Version } from "../../../clay/version";
import {
    ContactDetail,
    ContactDetailJSON,
    ContactDetailToJSON,
    CONTACT_DETAIL_META,
    JSONToContactDetail,
    repairContactDetailJSON,
} from "../../contact/table";
import {
    JSONToSurveySection,
    ProjectDescriptionCategory,
    repairSurveySectionJSON,
    SurveySection,
    SurveySectionJSON,
    SurveySectionToJSON,
    SURVEY_SECTION_META,
} from "../../project-description/table";
import {
    JSONToSiteVisitReportSection,
    repairSiteVisitReportSectionJSON,
    SiteVisitReportQuestion,
    SiteVisitReportSection,
    SiteVisitReportSectionJSON,
    SiteVisitReportSectionToJSON,
    SITE_VISIT_REPORT_QUESTION_META,
    SITE_VISIT_REPORT_SECTION_META,
} from "../site-visit-report/table";

//!Data
export type CustomerSurveyTemplate = {
    id: UUID;
    recordVersion: Version;
    name: string;
    category: Link<ProjectDescriptionCategory>;
    sections: SurveySection[];
};

//!Data
export type CustomerSurvey = {
    id: UUID;
    recordVersion: Version;
    addedDateTime: Date | null;
    firstDate: Date | null;
    date: Date | null;
    addedBy: Link<User>;
    project: Link<Project>;
    contact: ContactDetail;
    contacts: ContactDetail[];
    sections: SiteVisitReportSection[];
    customerEmail: string;
    sent: boolean;
    reminderSent: boolean;
    dismissedBy: Link<User>[];
    template: Link<CustomerSurveyTemplate>;
};

export const CustomerSurveySegments = {
    questions: ["questions"],
};

export function calcCustomerSurveyIsCompleted(survey: CustomerSurvey): boolean {
    return isNotNull(survey.date);
}

export function calcCustomerSurveyQuestions(
    completionSurvey: CustomerSurvey
): SiteVisitReportQuestion[] {
    return completionSurvey.sections.flatMap((section) => section.questions);
}

export function calcCustomerSurveyRfiQuestion(
    survey: CustomerSurvey
): Quantity | null {
    return firstMatch(
        survey.sections.flatMap((section) => section.questions),
        (question) =>
            question.id.uuid === "b8329acc-406d-4406-a695-a269d74cd08b" ||
            question.id.uuid === "a7574e60-2d35-42d3-a552-6a556338f56a" ||
            question.id.uuid === "a9d4a227-b6bc-4b6b-ba92-77a9437aa268",
        (question) =>
            firstMatch(
                question.answers,
                (x) => x.id.uuid === question.selectedAnswer,
                (answer) => answer.score!
            )
    );
}

export function calcCustomerSurveyGiftCardQuestion(
    survey: CustomerSurvey
): string {
    return ifNull(
        firstMatch(
            survey.sections.flatMap((section) => section.questions),
            (question) =>
                question.id.uuid === "aaca2608-110b-4110-b4b6-2b4bd00db6fb" ||
                question.id.uuid === "467d14e9-f945-4f94-9e51-c9e5b64e991a" ||
                question.id.uuid === "77ccbdea-66b0-466b-a5c0-1a5c925290db" ||
                question.id.uuid === "d84e4b04-09f7-409f-9bb5-95bbb0e318e5",
            (question) =>
                firstMatch(
                    question.answers,
                    (x) => x.id.uuid === question.selectedAnswer,
                    (answer) => answer.name
                )
        ),
        ""
    );
}

// BEGIN MAGIC -- DO NOT EDIT
export type CustomerSurveyTemplateJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    category: string | null;
    sections: SurveySectionJSON[];
};

export function JSONToCustomerSurveyTemplate(
    json: CustomerSurveyTemplateJSON
): CustomerSurveyTemplate {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        category: json.category,
        sections: json.sections.map((inner) => JSONToSurveySection(inner)),
    };
}
export type CustomerSurveyTemplateBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    category?: string | null;
    sections?: SurveySectionJSON[];
};

export function newCustomerSurveyTemplate(): CustomerSurveyTemplate {
    return JSONToCustomerSurveyTemplate(
        repairCustomerSurveyTemplateJSON(undefined)
    );
}
export function repairCustomerSurveyTemplateJSON(
    json: CustomerSurveyTemplateBrokenJSON | undefined
): CustomerSurveyTemplateJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            category: json.category || null,
            sections: (json.sections || []).map((inner) =>
                repairSurveySectionJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            category: undefined || null,
            sections: (undefined || []).map((inner) =>
                repairSurveySectionJSON(inner)
            ),
        };
    }
}

export function CustomerSurveyTemplateToJSON(
    value: CustomerSurveyTemplate
): CustomerSurveyTemplateJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        category: value.category,
        sections: value.sections.map((inner) => SurveySectionToJSON(inner)),
    };
}

export const CUSTOMER_SURVEY_TEMPLATE_META: RecordMeta<
    CustomerSurveyTemplate,
    CustomerSurveyTemplateJSON,
    CustomerSurveyTemplateBrokenJSON
> & { name: "CustomerSurveyTemplate" } = {
    name: "CustomerSurveyTemplate",
    type: "record",
    repair: repairCustomerSurveyTemplateJSON,
    toJSON: CustomerSurveyTemplateToJSON,
    fromJSON: JSONToCustomerSurveyTemplate,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        category: { type: "uuid", linkTo: "ProjectDescriptionCategory" },
        sections: { type: "array", items: SURVEY_SECTION_META },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type CustomerSurveyJSON = {
    id: string;
    recordVersion: number | null;
    addedDateTime: string | null;
    firstDate: string | null;
    date: string | null;
    addedBy: string | null;
    project: string | null;
    contact: ContactDetailJSON;
    contacts: ContactDetailJSON[];
    sections: SiteVisitReportSectionJSON[];
    customerEmail: string;
    sent: boolean;
    reminderSent: boolean;
    dismissedBy: (string | null)[];
    template: string | null;
};

export function JSONToCustomerSurvey(json: CustomerSurveyJSON): CustomerSurvey {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        addedDateTime:
            json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
        firstDate: json.firstDate !== null ? dateParse(json.firstDate) : null,
        date: json.date !== null ? dateParse(json.date) : null,
        addedBy: json.addedBy,
        project: json.project,
        contact: JSONToContactDetail(json.contact),
        contacts: json.contacts.map((inner) => JSONToContactDetail(inner)),
        sections: json.sections.map((inner) =>
            JSONToSiteVisitReportSection(inner)
        ),
        customerEmail: json.customerEmail,
        sent: json.sent,
        reminderSent: json.reminderSent,
        dismissedBy: json.dismissedBy.map((inner) => inner),
        template: json.template,
    };
}
export type CustomerSurveyBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    addedDateTime?: string | null;
    firstDate?: string | null;
    date?: string | null;
    addedBy?: string | null;
    project?: string | null;
    contact?: ContactDetailJSON;
    contacts?: ContactDetailJSON[];
    sections?: SiteVisitReportSectionJSON[];
    customerEmail?: string;
    sent?: boolean;
    reminderSent?: boolean;
    dismissedBy?: (string | null)[];
    template?: string | null;
};

export function newCustomerSurvey(): CustomerSurvey {
    return JSONToCustomerSurvey(repairCustomerSurveyJSON(undefined));
}
export function repairCustomerSurveyJSON(
    json: CustomerSurveyBrokenJSON | undefined
): CustomerSurveyJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            addedDateTime: json.addedDateTime
                ? new Date(json.addedDateTime!).toISOString()
                : null,
            firstDate: json.firstDate
                ? new Date(json.firstDate!).toISOString()
                : null,
            date: json.date ? new Date(json.date!).toISOString() : null,
            addedBy: json.addedBy || null,
            project: json.project || null,
            contact: repairContactDetailJSON(json.contact),
            contacts: (json.contacts || []).map((inner) =>
                repairContactDetailJSON(inner)
            ),
            sections: (json.sections || []).map((inner) =>
                repairSiteVisitReportSectionJSON(inner)
            ),
            customerEmail: json.customerEmail || "",
            sent: json.sent || false,
            reminderSent: json.reminderSent || false,
            dismissedBy: (json.dismissedBy || []).map((inner) => inner || null),
            template: json.template || null,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            addedDateTime: undefined
                ? new Date(undefined!).toISOString()
                : null,
            firstDate: undefined ? new Date(undefined!).toISOString() : null,
            date: undefined ? new Date(undefined!).toISOString() : null,
            addedBy: undefined || null,
            project: undefined || null,
            contact: repairContactDetailJSON(undefined),
            contacts: (undefined || []).map((inner) =>
                repairContactDetailJSON(inner)
            ),
            sections: (undefined || []).map((inner) =>
                repairSiteVisitReportSectionJSON(inner)
            ),
            customerEmail: undefined || "",
            sent: undefined || false,
            reminderSent: undefined || false,
            dismissedBy: (undefined || []).map((inner) => inner || null),
            template: undefined || null,
        };
    }
}

export function CustomerSurveyToJSON(
    value: CustomerSurvey
): CustomerSurveyJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        addedDateTime:
            value.addedDateTime !== null
                ? value.addedDateTime.toISOString()
                : null,
        firstDate:
            value.firstDate !== null ? value.firstDate.toISOString() : null,
        date: value.date !== null ? value.date.toISOString() : null,
        addedBy: value.addedBy,
        project: value.project,
        contact: ContactDetailToJSON(value.contact),
        contacts: value.contacts.map((inner) => ContactDetailToJSON(inner)),
        sections: value.sections.map((inner) =>
            SiteVisitReportSectionToJSON(inner)
        ),
        customerEmail: value.customerEmail,
        sent: value.sent,
        reminderSent: value.reminderSent,
        dismissedBy: value.dismissedBy.map((inner) => inner),
        template: value.template,
    };
}

export const CUSTOMER_SURVEY_META: RecordMeta<
    CustomerSurvey,
    CustomerSurveyJSON,
    CustomerSurveyBrokenJSON
> & { name: "CustomerSurvey" } = {
    name: "CustomerSurvey",
    type: "record",
    repair: repairCustomerSurveyJSON,
    toJSON: CustomerSurveyToJSON,
    fromJSON: JSONToCustomerSurvey,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        addedDateTime: { type: "datetime" },
        firstDate: { type: "datetime" },
        date: { type: "datetime" },
        addedBy: { type: "uuid", linkTo: "User" },
        project: { type: "uuid", linkTo: "Project" },
        contact: CONTACT_DETAIL_META,
        contacts: { type: "array", items: CONTACT_DETAIL_META },
        sections: { type: "array", items: SITE_VISIT_REPORT_SECTION_META },
        customerEmail: { type: "string" },
        sent: { type: "boolean" },
        reminderSent: { type: "boolean" },
        dismissedBy: { type: "array", items: { type: "uuid", linkTo: "User" } },
        template: { type: "uuid", linkTo: "CustomerSurveyTemplate" },
    },
    userFacingKey: null,
    functions: {
        isCompleted: {
            fn: calcCustomerSurveyIsCompleted,
            parameterTypes: () => [CUSTOMER_SURVEY_META],
            returnType: { type: "boolean" },
        },
        questions: {
            fn: calcCustomerSurveyQuestions,
            parameterTypes: () => [CUSTOMER_SURVEY_META],
            returnType: {
                type: "array",
                items: SITE_VISIT_REPORT_QUESTION_META,
            },
        },
        rfiQuestion: {
            fn: calcCustomerSurveyRfiQuestion,
            parameterTypes: () => [CUSTOMER_SURVEY_META],
            returnType: { type: "quantity?" },
        },
        giftCardQuestion: {
            fn: calcCustomerSurveyGiftCardQuestion,
            parameterTypes: () => [CUSTOMER_SURVEY_META],
            returnType: { type: "string" },
        },
    },
    segments: CustomerSurveySegments,
};

// END MAGIC -- DO NOT EDIT
