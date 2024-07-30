import { parseISO as dateParse } from "date-fns";
import { Decimal } from "decimal.js";
import { find, isNull } from "lodash";
import { Percentage, Quantity } from "../../../clay/common";
import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { daysAgo, firstMatch, maximum } from "../../../clay/queryFuncs";
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
    JSONToSurveyAnswer,
    repairSurveyAnswerJSON,
    SurveyAnswer,
    SurveyAnswerJSON,
    SurveyAnswerToJSON,
    SURVEY_ANSWER_META,
} from "../../project-description/table";
import { User } from "../../user/table";
import { CompletionSurvey } from "../completion-survey/table";
import { CustomerSurvey } from "../customer-survey/table";
import { Project } from "../table";

//!Data
export type SiteVisitReportQuestion = {
    id: UUID;
    question: string;
    sendToCustomer: boolean;
    controlsSection: boolean;
    answers: SurveyAnswer[];
    selectedAnswer: Link<SurveyAnswer>;
    comment: string;
};

export function calcSiteVisitReportQuestionAnswer(
    question: SiteVisitReportQuestion
): SurveyAnswer {
    return firstMatch(
        question.answers,
        (answer) => answer.id.uuid === question.selectedAnswer,
        (x) => x
    )!;
}

export function calcSiteVisitReportQuestionMaxScore(
    question: SiteVisitReportQuestion
): Quantity | null {
    return maximum(question.answers, (answer) => answer.score);
}

//!Data
export type SiteVisitReportSection = {
    name: string;
    questions: SiteVisitReportQuestion[];
};

//!Data
export type SiteVisitReport = {
    id: UUID;
    recordVersion: Version;
    project: Link<Project>;
    firstDate: Date | null;
    date: Date | null;
    addedDateTime: Date | null;
    modifiedDateTime: Date | null;
    user: Link<User>;
    weatherConditions: string;
    numberOfWorkersOnSite: Quantity;
    contacts: ContactDetail[];
    reportOnWorkPlan: string;
    projectIssuesInformationActionItems: string;
    sections: SiteVisitReportSection[];
    number: Quantity;
    certifiedForeman: Link<User>;
    progressToDate: Percentage;
    previousProgressToDate: Percentage;
    mobile: boolean;
};

export const SiteVisitReportSegments = {
    questions: ["questions"],
};

export function calcSiteVisitReportQuestions(
    completionSurvey: SiteVisitReport
): SiteVisitReportQuestion[] {
    return completionSurvey.sections.flatMap((section) => section.questions);
}

export function calcSiteVisitReportUngenerated(
    siteVisitReport: SiteVisitReport
): boolean {
    return (
        isNull(siteVisitReport.date) &&
        daysAgo(siteVisitReport.addedDateTime)!.gt(2)
    );
}

export function computeScore(
    visit: SiteVisitReport | CompletionSurvey | CustomerSurvey
): {
    points: Quantity;
    total: Quantity;
} {
    let points = new Decimal(0);
    let total = new Decimal(0);

    for (const section of visit.sections) {
        for (const question of section.questions) {
            const answer = find(
                question.answers,
                (answer) => answer.id.uuid === question.selectedAnswer
            );
            if (answer && answer.score != null) {
                points = points.plus(answer.score);
                total = total.plus(
                    question.answers.reduce(
                        (m, answer) =>
                            Decimal.max(m, answer.score || new Decimal(0)),
                        new Decimal(0)
                    )
                );
            }
        }
    }
    return { points, total };
}

// BEGIN MAGIC -- DO NOT EDIT
export type SiteVisitReportQuestionJSON = {
    id: string;
    question: string;
    sendToCustomer: boolean;
    controlsSection: boolean;
    answers: SurveyAnswerJSON[];
    selectedAnswer: string | null;
    comment: string;
};

export function JSONToSiteVisitReportQuestion(
    json: SiteVisitReportQuestionJSON
): SiteVisitReportQuestion {
    return {
        id: { uuid: json.id },
        question: json.question,
        sendToCustomer: json.sendToCustomer,
        controlsSection: json.controlsSection,
        answers: json.answers.map((inner) => JSONToSurveyAnswer(inner)),
        selectedAnswer: json.selectedAnswer,
        comment: json.comment,
    };
}
export type SiteVisitReportQuestionBrokenJSON = {
    id?: string;
    question?: string;
    sendToCustomer?: boolean;
    controlsSection?: boolean;
    answers?: SurveyAnswerJSON[];
    selectedAnswer?: string | null;
    comment?: string;
};

export function newSiteVisitReportQuestion(): SiteVisitReportQuestion {
    return JSONToSiteVisitReportQuestion(
        repairSiteVisitReportQuestionJSON(undefined)
    );
}
export function repairSiteVisitReportQuestionJSON(
    json: SiteVisitReportQuestionBrokenJSON | undefined
): SiteVisitReportQuestionJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            question: json.question || "",
            sendToCustomer: json.sendToCustomer || false,
            controlsSection: json.controlsSection || false,
            answers: (json.answers || []).map((inner) =>
                repairSurveyAnswerJSON(inner)
            ),
            selectedAnswer: json.selectedAnswer || null,
            comment: json.comment || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            question: undefined || "",
            sendToCustomer: undefined || false,
            controlsSection: undefined || false,
            answers: (undefined || []).map((inner) =>
                repairSurveyAnswerJSON(inner)
            ),
            selectedAnswer: undefined || null,
            comment: undefined || "",
        };
    }
}

export function SiteVisitReportQuestionToJSON(
    value: SiteVisitReportQuestion
): SiteVisitReportQuestionJSON {
    return {
        id: value.id.uuid,
        question: value.question,
        sendToCustomer: value.sendToCustomer,
        controlsSection: value.controlsSection,
        answers: value.answers.map((inner) => SurveyAnswerToJSON(inner)),
        selectedAnswer: value.selectedAnswer,
        comment: value.comment,
    };
}

export const SITE_VISIT_REPORT_QUESTION_META: RecordMeta<
    SiteVisitReportQuestion,
    SiteVisitReportQuestionJSON,
    SiteVisitReportQuestionBrokenJSON
> & { name: "SiteVisitReportQuestion" } = {
    name: "SiteVisitReportQuestion",
    type: "record",
    repair: repairSiteVisitReportQuestionJSON,
    toJSON: SiteVisitReportQuestionToJSON,
    fromJSON: JSONToSiteVisitReportQuestion,
    fields: {
        id: { type: "uuid" },
        question: { type: "string" },
        sendToCustomer: { type: "boolean" },
        controlsSection: { type: "boolean" },
        answers: { type: "array", items: SURVEY_ANSWER_META },
        selectedAnswer: { type: "uuid", linkTo: "SurveyAnswer" },
        comment: { type: "string" },
    },
    userFacingKey: null,
    functions: {
        answer: {
            fn: calcSiteVisitReportQuestionAnswer,
            parameterTypes: () => [SITE_VISIT_REPORT_QUESTION_META],
            returnType: SURVEY_ANSWER_META,
        },
        maxScore: {
            fn: calcSiteVisitReportQuestionMaxScore,
            parameterTypes: () => [SITE_VISIT_REPORT_QUESTION_META],
            returnType: { type: "quantity?" },
        },
    },
    segments: {},
};

export type SiteVisitReportSectionJSON = {
    name: string;
    questions: SiteVisitReportQuestionJSON[];
};

export function JSONToSiteVisitReportSection(
    json: SiteVisitReportSectionJSON
): SiteVisitReportSection {
    return {
        name: json.name,
        questions: json.questions.map((inner) =>
            JSONToSiteVisitReportQuestion(inner)
        ),
    };
}
export type SiteVisitReportSectionBrokenJSON = {
    name?: string;
    questions?: SiteVisitReportQuestionJSON[];
};

export function newSiteVisitReportSection(): SiteVisitReportSection {
    return JSONToSiteVisitReportSection(
        repairSiteVisitReportSectionJSON(undefined)
    );
}
export function repairSiteVisitReportSectionJSON(
    json: SiteVisitReportSectionBrokenJSON | undefined
): SiteVisitReportSectionJSON {
    if (json) {
        return {
            name: json.name || "",
            questions: (json.questions || []).map((inner) =>
                repairSiteVisitReportQuestionJSON(inner)
            ),
        };
    } else {
        return {
            name: undefined || "",
            questions: (undefined || []).map((inner) =>
                repairSiteVisitReportQuestionJSON(inner)
            ),
        };
    }
}

export function SiteVisitReportSectionToJSON(
    value: SiteVisitReportSection
): SiteVisitReportSectionJSON {
    return {
        name: value.name,
        questions: value.questions.map((inner) =>
            SiteVisitReportQuestionToJSON(inner)
        ),
    };
}

export const SITE_VISIT_REPORT_SECTION_META: RecordMeta<
    SiteVisitReportSection,
    SiteVisitReportSectionJSON,
    SiteVisitReportSectionBrokenJSON
> & { name: "SiteVisitReportSection" } = {
    name: "SiteVisitReportSection",
    type: "record",
    repair: repairSiteVisitReportSectionJSON,
    toJSON: SiteVisitReportSectionToJSON,
    fromJSON: JSONToSiteVisitReportSection,
    fields: {
        name: { type: "string" },
        questions: { type: "array", items: SITE_VISIT_REPORT_QUESTION_META },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type SiteVisitReportJSON = {
    id: string;
    recordVersion: number | null;
    project: string | null;
    firstDate: string | null;
    date: string | null;
    addedDateTime: string | null;
    modifiedDateTime: string | null;
    user: string | null;
    weatherConditions: string;
    numberOfWorkersOnSite: string;
    contacts: ContactDetailJSON[];
    reportOnWorkPlan: string;
    projectIssuesInformationActionItems: string;
    sections: SiteVisitReportSectionJSON[];
    number: string;
    certifiedForeman: string | null;
    progressToDate: string;
    previousProgressToDate: string;
    mobile: boolean;
};

export function JSONToSiteVisitReport(
    json: SiteVisitReportJSON
): SiteVisitReport {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        project: json.project,
        firstDate: json.firstDate !== null ? dateParse(json.firstDate) : null,
        date: json.date !== null ? dateParse(json.date) : null,
        addedDateTime:
            json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
        modifiedDateTime:
            json.modifiedDateTime !== null
                ? dateParse(json.modifiedDateTime)
                : null,
        user: json.user,
        weatherConditions: json.weatherConditions,
        numberOfWorkersOnSite: new Decimal(json.numberOfWorkersOnSite),
        contacts: json.contacts.map((inner) => JSONToContactDetail(inner)),
        reportOnWorkPlan: json.reportOnWorkPlan,
        projectIssuesInformationActionItems:
            json.projectIssuesInformationActionItems,
        sections: json.sections.map((inner) =>
            JSONToSiteVisitReportSection(inner)
        ),
        number: new Decimal(json.number),
        certifiedForeman: json.certifiedForeman,
        progressToDate: new Decimal(json.progressToDate),
        previousProgressToDate: new Decimal(json.previousProgressToDate),
        mobile: json.mobile,
    };
}
export type SiteVisitReportBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    project?: string | null;
    firstDate?: string | null;
    date?: string | null;
    addedDateTime?: string | null;
    modifiedDateTime?: string | null;
    user?: string | null;
    weatherConditions?: string;
    numberOfWorkersOnSite?: string;
    contacts?: ContactDetailJSON[];
    reportOnWorkPlan?: string;
    projectIssuesInformationActionItems?: string;
    sections?: SiteVisitReportSectionJSON[];
    number?: string;
    certifiedForeman?: string | null;
    progressToDate?: string;
    previousProgressToDate?: string;
    mobile?: boolean;
};

export function newSiteVisitReport(): SiteVisitReport {
    return JSONToSiteVisitReport(repairSiteVisitReportJSON(undefined));
}
export function repairSiteVisitReportJSON(
    json: SiteVisitReportBrokenJSON | undefined
): SiteVisitReportJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            project: json.project || null,
            firstDate: json.firstDate
                ? new Date(json.firstDate!).toISOString()
                : null,
            date: json.date ? new Date(json.date!).toISOString() : null,
            addedDateTime: json.addedDateTime
                ? new Date(json.addedDateTime!).toISOString()
                : null,
            modifiedDateTime: json.modifiedDateTime
                ? new Date(json.modifiedDateTime!).toISOString()
                : null,
            user: json.user || null,
            weatherConditions: json.weatherConditions || "",
            numberOfWorkersOnSite: json.numberOfWorkersOnSite || "0",
            contacts: (json.contacts || []).map((inner) =>
                repairContactDetailJSON(inner)
            ),
            reportOnWorkPlan: json.reportOnWorkPlan || "",
            projectIssuesInformationActionItems:
                json.projectIssuesInformationActionItems || "",
            sections: (json.sections || []).map((inner) =>
                repairSiteVisitReportSectionJSON(inner)
            ),
            number: json.number || "0",
            certifiedForeman: json.certifiedForeman || null,
            progressToDate: json.progressToDate || "0",
            previousProgressToDate: json.previousProgressToDate || "0",
            mobile: json.mobile || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            project: undefined || null,
            firstDate: undefined ? new Date(undefined!).toISOString() : null,
            date: undefined ? new Date(undefined!).toISOString() : null,
            addedDateTime: undefined
                ? new Date(undefined!).toISOString()
                : null,
            modifiedDateTime: undefined
                ? new Date(undefined!).toISOString()
                : null,
            user: undefined || null,
            weatherConditions: undefined || "",
            numberOfWorkersOnSite: undefined || "0",
            contacts: (undefined || []).map((inner) =>
                repairContactDetailJSON(inner)
            ),
            reportOnWorkPlan: undefined || "",
            projectIssuesInformationActionItems: undefined || "",
            sections: (undefined || []).map((inner) =>
                repairSiteVisitReportSectionJSON(inner)
            ),
            number: undefined || "0",
            certifiedForeman: undefined || null,
            progressToDate: undefined || "0",
            previousProgressToDate: undefined || "0",
            mobile: undefined || false,
        };
    }
}

export function SiteVisitReportToJSON(
    value: SiteVisitReport
): SiteVisitReportJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        project: value.project,
        firstDate:
            value.firstDate !== null ? value.firstDate.toISOString() : null,
        date: value.date !== null ? value.date.toISOString() : null,
        addedDateTime:
            value.addedDateTime !== null
                ? value.addedDateTime.toISOString()
                : null,
        modifiedDateTime:
            value.modifiedDateTime !== null
                ? value.modifiedDateTime.toISOString()
                : null,
        user: value.user,
        weatherConditions: value.weatherConditions,
        numberOfWorkersOnSite: value.numberOfWorkersOnSite.toString(),
        contacts: value.contacts.map((inner) => ContactDetailToJSON(inner)),
        reportOnWorkPlan: value.reportOnWorkPlan,
        projectIssuesInformationActionItems:
            value.projectIssuesInformationActionItems,
        sections: value.sections.map((inner) =>
            SiteVisitReportSectionToJSON(inner)
        ),
        number: value.number.toString(),
        certifiedForeman: value.certifiedForeman,
        progressToDate: value.progressToDate.toString(),
        previousProgressToDate: value.previousProgressToDate.toString(),
        mobile: value.mobile,
    };
}

export const SITE_VISIT_REPORT_META: RecordMeta<
    SiteVisitReport,
    SiteVisitReportJSON,
    SiteVisitReportBrokenJSON
> & { name: "SiteVisitReport" } = {
    name: "SiteVisitReport",
    type: "record",
    repair: repairSiteVisitReportJSON,
    toJSON: SiteVisitReportToJSON,
    fromJSON: JSONToSiteVisitReport,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        project: { type: "uuid", linkTo: "Project" },
        firstDate: { type: "datetime" },
        date: { type: "datetime" },
        addedDateTime: { type: "datetime" },
        modifiedDateTime: { type: "datetime" },
        user: { type: "uuid", linkTo: "User" },
        weatherConditions: { type: "string" },
        numberOfWorkersOnSite: { type: "quantity" },
        contacts: { type: "array", items: CONTACT_DETAIL_META },
        reportOnWorkPlan: { type: "string" },
        projectIssuesInformationActionItems: { type: "string" },
        sections: { type: "array", items: SITE_VISIT_REPORT_SECTION_META },
        number: { type: "quantity" },
        certifiedForeman: { type: "uuid", linkTo: "User" },
        progressToDate: { type: "percentage" },
        previousProgressToDate: { type: "percentage" },
        mobile: { type: "boolean" },
    },
    userFacingKey: "number",
    functions: {
        questions: {
            fn: calcSiteVisitReportQuestions,
            parameterTypes: () => [SITE_VISIT_REPORT_META],
            returnType: {
                type: "array",
                items: SITE_VISIT_REPORT_QUESTION_META,
            },
        },
        ungenerated: {
            fn: calcSiteVisitReportUngenerated,
            parameterTypes: () => [SITE_VISIT_REPORT_META],
            returnType: { type: "boolean" },
        },
    },
    segments: SiteVisitReportSegments,
};

// END MAGIC -- DO NOT EDIT
