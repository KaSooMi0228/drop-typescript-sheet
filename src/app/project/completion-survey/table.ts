import { User } from "@sentry/node";
import dateParse from "date-fns/parseISO";
import { Project } from "ts-morph";
import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { daysAgo, isNull } from "../../../clay/queryFuncs";
import { genUUID, UUID } from "../../../clay/uuid";
import { Version } from "../../../clay/version";
import {
    JSONToSurveySection,
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
export type CompletionSurveyTemplate = {
    id: UUID;
    recordVersion: Version;
    surveySections: SurveySection[];
};

export const COMPLETION_SURVEY_TEMPLATE_ID =
    "551d1b77-ba5d-4734-ae2e-d13392bd8fe5";

//!Data
export type CompletionSurvey = {
    id: UUID;
    addedDateTime: Date | null;
    recordVersion: Version;
    project: Link<Project>;
    certifiedForeman: Link<User>;
    firstDate: Date | null;
    date: Date | null;
    user: Link<User>;
    sections: SiteVisitReportSection[];
    sent: boolean;
};

export const CompletionSurveySegments = {
    questions: ["questions"],
};

export function calcCompletionSurveyQuestions(
    completionSurvey: CompletionSurvey
): SiteVisitReportQuestion[] {
    return completionSurvey.sections.flatMap((section) => section.questions);
}

export function calcCompletionSurveyUngenerated(
    completionSurvey: CompletionSurvey
): boolean {
    return (
        isNull(completionSurvey.date) &&
        daysAgo(completionSurvey.addedDateTime)!.gt(2)
    );
}

// BEGIN MAGIC -- DO NOT EDIT
export type CompletionSurveyTemplateJSON = {
    id: string;
    recordVersion: number | null;
    surveySections: SurveySectionJSON[];
};

export function JSONToCompletionSurveyTemplate(
    json: CompletionSurveyTemplateJSON
): CompletionSurveyTemplate {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        surveySections: json.surveySections.map((inner) =>
            JSONToSurveySection(inner)
        ),
    };
}
export type CompletionSurveyTemplateBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    surveySections?: SurveySectionJSON[];
};

export function newCompletionSurveyTemplate(): CompletionSurveyTemplate {
    return JSONToCompletionSurveyTemplate(
        repairCompletionSurveyTemplateJSON(undefined)
    );
}
export function repairCompletionSurveyTemplateJSON(
    json: CompletionSurveyTemplateBrokenJSON | undefined
): CompletionSurveyTemplateJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            surveySections: (json.surveySections || []).map((inner) =>
                repairSurveySectionJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            surveySections: (undefined || []).map((inner) =>
                repairSurveySectionJSON(inner)
            ),
        };
    }
}

export function CompletionSurveyTemplateToJSON(
    value: CompletionSurveyTemplate
): CompletionSurveyTemplateJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        surveySections: value.surveySections.map((inner) =>
            SurveySectionToJSON(inner)
        ),
    };
}

export const COMPLETION_SURVEY_TEMPLATE_META: RecordMeta<
    CompletionSurveyTemplate,
    CompletionSurveyTemplateJSON,
    CompletionSurveyTemplateBrokenJSON
> & { name: "CompletionSurveyTemplate" } = {
    name: "CompletionSurveyTemplate",
    type: "record",
    repair: repairCompletionSurveyTemplateJSON,
    toJSON: CompletionSurveyTemplateToJSON,
    fromJSON: JSONToCompletionSurveyTemplate,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        surveySections: { type: "array", items: SURVEY_SECTION_META },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type CompletionSurveyJSON = {
    id: string;
    addedDateTime: string | null;
    recordVersion: number | null;
    project: string | null;
    certifiedForeman: string | null;
    firstDate: string | null;
    date: string | null;
    user: string | null;
    sections: SiteVisitReportSectionJSON[];
    sent: boolean;
};

export function JSONToCompletionSurvey(
    json: CompletionSurveyJSON
): CompletionSurvey {
    return {
        id: { uuid: json.id },
        addedDateTime:
            json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
        recordVersion: { version: json.recordVersion },
        project: json.project,
        certifiedForeman: json.certifiedForeman,
        firstDate: json.firstDate !== null ? dateParse(json.firstDate) : null,
        date: json.date !== null ? dateParse(json.date) : null,
        user: json.user,
        sections: json.sections.map((inner) =>
            JSONToSiteVisitReportSection(inner)
        ),
        sent: json.sent,
    };
}
export type CompletionSurveyBrokenJSON = {
    id?: string;
    addedDateTime?: string | null;
    recordVersion?: number | null;
    project?: string | null;
    certifiedForeman?: string | null;
    firstDate?: string | null;
    date?: string | null;
    user?: string | null;
    sections?: SiteVisitReportSectionJSON[];
    sent?: boolean;
};

export function newCompletionSurvey(): CompletionSurvey {
    return JSONToCompletionSurvey(repairCompletionSurveyJSON(undefined));
}
export function repairCompletionSurveyJSON(
    json: CompletionSurveyBrokenJSON | undefined
): CompletionSurveyJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            addedDateTime: json.addedDateTime
                ? new Date(json.addedDateTime!).toISOString()
                : null,
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            project: json.project || null,
            certifiedForeman: json.certifiedForeman || null,
            firstDate: json.firstDate
                ? new Date(json.firstDate!).toISOString()
                : null,
            date: json.date ? new Date(json.date!).toISOString() : null,
            user: json.user || null,
            sections: (json.sections || []).map((inner) =>
                repairSiteVisitReportSectionJSON(inner)
            ),
            sent: json.sent || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            addedDateTime: undefined
                ? new Date(undefined!).toISOString()
                : null,
            recordVersion: null,
            project: undefined || null,
            certifiedForeman: undefined || null,
            firstDate: undefined ? new Date(undefined!).toISOString() : null,
            date: undefined ? new Date(undefined!).toISOString() : null,
            user: undefined || null,
            sections: (undefined || []).map((inner) =>
                repairSiteVisitReportSectionJSON(inner)
            ),
            sent: undefined || false,
        };
    }
}

export function CompletionSurveyToJSON(
    value: CompletionSurvey
): CompletionSurveyJSON {
    return {
        id: value.id.uuid,
        addedDateTime:
            value.addedDateTime !== null
                ? value.addedDateTime.toISOString()
                : null,
        recordVersion: value.recordVersion.version,
        project: value.project,
        certifiedForeman: value.certifiedForeman,
        firstDate:
            value.firstDate !== null ? value.firstDate.toISOString() : null,
        date: value.date !== null ? value.date.toISOString() : null,
        user: value.user,
        sections: value.sections.map((inner) =>
            SiteVisitReportSectionToJSON(inner)
        ),
        sent: value.sent,
    };
}

export const COMPLETION_SURVEY_META: RecordMeta<
    CompletionSurvey,
    CompletionSurveyJSON,
    CompletionSurveyBrokenJSON
> & { name: "CompletionSurvey" } = {
    name: "CompletionSurvey",
    type: "record",
    repair: repairCompletionSurveyJSON,
    toJSON: CompletionSurveyToJSON,
    fromJSON: JSONToCompletionSurvey,
    fields: {
        id: { type: "uuid" },
        addedDateTime: { type: "datetime" },
        recordVersion: { type: "version" },
        project: { type: "uuid", linkTo: "Project" },
        certifiedForeman: { type: "uuid", linkTo: "User" },
        firstDate: { type: "datetime" },
        date: { type: "datetime" },
        user: { type: "uuid", linkTo: "User" },
        sections: { type: "array", items: SITE_VISIT_REPORT_SECTION_META },
        sent: { type: "boolean" },
    },
    userFacingKey: null,
    functions: {
        questions: {
            fn: calcCompletionSurveyQuestions,
            parameterTypes: () => [COMPLETION_SURVEY_META],
            returnType: {
                type: "array",
                items: SITE_VISIT_REPORT_QUESTION_META,
            },
        },
        ungenerated: {
            fn: calcCompletionSurveyUngenerated,
            parameterTypes: () => [COMPLETION_SURVEY_META],
            returnType: { type: "boolean" },
        },
    },
    segments: CompletionSurveySegments,
};

// END MAGIC -- DO NOT EDIT
