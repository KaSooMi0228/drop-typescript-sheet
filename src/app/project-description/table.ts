import { Decimal } from "decimal.js";
import { Quantity } from "../../clay/common";
import { Link } from "../../clay/link";
import { RecordMeta } from "../../clay/meta";
import { maximum } from "../../clay/queryFuncs";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";

//!Data
export type ProjectDescription = {
    id: UUID;
    recordVersion: Version;
    name: string;
    requireDetail: boolean;
    category: Link<ProjectDescriptionCategory>;
};

//!Data
export type SurveyAnswer = {
    id: UUID;
    name: string;
    score: Quantity | null;
};

//!Data
export type SurveyQuestion = {
    id: UUID;
    question: string;
    sendToCustomer: boolean;
    controlsSection: boolean;
    scale1to10: boolean;
    answers: SurveyAnswer[];
};

export function calcSurveyQuestionMaxScore(
    question: SurveyQuestion
): Quantity | null {
    return maximum(question.answers, (answer) => answer.score);
}

//!Data
export type SurveySection = {
    name: string;
    questions: SurveyQuestion[];
};

//!Data
export type ProjectDescriptionCategory = {
    id: UUID;
    recordVersion: Version;
    name: string;
    surveySections: SurveySection[];
    customerSurveySections: SurveySection[];
};

// BEGIN MAGIC -- DO NOT EDIT
export type ProjectDescriptionJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    requireDetail: boolean;
    category: string | null;
};

export function JSONToProjectDescription(
    json: ProjectDescriptionJSON
): ProjectDescription {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        requireDetail: json.requireDetail,
        category: json.category,
    };
}
export type ProjectDescriptionBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    requireDetail?: boolean;
    category?: string | null;
};

export function newProjectDescription(): ProjectDescription {
    return JSONToProjectDescription(repairProjectDescriptionJSON(undefined));
}
export function repairProjectDescriptionJSON(
    json: ProjectDescriptionBrokenJSON | undefined
): ProjectDescriptionJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            requireDetail: json.requireDetail || false,
            category: json.category || null,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            requireDetail: undefined || false,
            category: undefined || null,
        };
    }
}

export function ProjectDescriptionToJSON(
    value: ProjectDescription
): ProjectDescriptionJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        requireDetail: value.requireDetail,
        category: value.category,
    };
}

export const PROJECT_DESCRIPTION_META: RecordMeta<
    ProjectDescription,
    ProjectDescriptionJSON,
    ProjectDescriptionBrokenJSON
> & { name: "ProjectDescription" } = {
    name: "ProjectDescription",
    type: "record",
    repair: repairProjectDescriptionJSON,
    toJSON: ProjectDescriptionToJSON,
    fromJSON: JSONToProjectDescription,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        requireDetail: { type: "boolean" },
        category: { type: "uuid", linkTo: "ProjectDescriptionCategory" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type SurveyAnswerJSON = {
    id: string;
    name: string;
    score: string | null;
};

export function JSONToSurveyAnswer(json: SurveyAnswerJSON): SurveyAnswer {
    return {
        id: { uuid: json.id },
        name: json.name,
        score: json.score !== null ? new Decimal(json.score) : null,
    };
}
export type SurveyAnswerBrokenJSON = {
    id?: string;
    name?: string;
    score?: string | null;
};

export function newSurveyAnswer(): SurveyAnswer {
    return JSONToSurveyAnswer(repairSurveyAnswerJSON(undefined));
}
export function repairSurveyAnswerJSON(
    json: SurveyAnswerBrokenJSON | undefined
): SurveyAnswerJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            score: json.score || null,
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            score: undefined || null,
        };
    }
}

export function SurveyAnswerToJSON(value: SurveyAnswer): SurveyAnswerJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        score: value.score !== null ? value.score.toString() : null,
    };
}

export const SURVEY_ANSWER_META: RecordMeta<
    SurveyAnswer,
    SurveyAnswerJSON,
    SurveyAnswerBrokenJSON
> & { name: "SurveyAnswer" } = {
    name: "SurveyAnswer",
    type: "record",
    repair: repairSurveyAnswerJSON,
    toJSON: SurveyAnswerToJSON,
    fromJSON: JSONToSurveyAnswer,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        score: { type: "quantity?" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type SurveyQuestionJSON = {
    id: string;
    question: string;
    sendToCustomer: boolean;
    controlsSection: boolean;
    scale1to10: boolean;
    answers: SurveyAnswerJSON[];
};

export function JSONToSurveyQuestion(json: SurveyQuestionJSON): SurveyQuestion {
    return {
        id: { uuid: json.id },
        question: json.question,
        sendToCustomer: json.sendToCustomer,
        controlsSection: json.controlsSection,
        scale1to10: json.scale1to10,
        answers: json.answers.map((inner) => JSONToSurveyAnswer(inner)),
    };
}
export type SurveyQuestionBrokenJSON = {
    id?: string;
    question?: string;
    sendToCustomer?: boolean;
    controlsSection?: boolean;
    scale1to10?: boolean;
    answers?: SurveyAnswerJSON[];
};

export function newSurveyQuestion(): SurveyQuestion {
    return JSONToSurveyQuestion(repairSurveyQuestionJSON(undefined));
}
export function repairSurveyQuestionJSON(
    json: SurveyQuestionBrokenJSON | undefined
): SurveyQuestionJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            question: json.question || "",
            sendToCustomer: json.sendToCustomer || false,
            controlsSection: json.controlsSection || false,
            scale1to10: json.scale1to10 || false,
            answers: (json.answers || []).map((inner) =>
                repairSurveyAnswerJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            question: undefined || "",
            sendToCustomer: undefined || false,
            controlsSection: undefined || false,
            scale1to10: undefined || false,
            answers: (undefined || []).map((inner) =>
                repairSurveyAnswerJSON(inner)
            ),
        };
    }
}

export function SurveyQuestionToJSON(
    value: SurveyQuestion
): SurveyQuestionJSON {
    return {
        id: value.id.uuid,
        question: value.question,
        sendToCustomer: value.sendToCustomer,
        controlsSection: value.controlsSection,
        scale1to10: value.scale1to10,
        answers: value.answers.map((inner) => SurveyAnswerToJSON(inner)),
    };
}

export const SURVEY_QUESTION_META: RecordMeta<
    SurveyQuestion,
    SurveyQuestionJSON,
    SurveyQuestionBrokenJSON
> & { name: "SurveyQuestion" } = {
    name: "SurveyQuestion",
    type: "record",
    repair: repairSurveyQuestionJSON,
    toJSON: SurveyQuestionToJSON,
    fromJSON: JSONToSurveyQuestion,
    fields: {
        id: { type: "uuid" },
        question: { type: "string" },
        sendToCustomer: { type: "boolean" },
        controlsSection: { type: "boolean" },
        scale1to10: { type: "boolean" },
        answers: { type: "array", items: SURVEY_ANSWER_META },
    },
    userFacingKey: null,
    functions: {
        maxScore: {
            fn: calcSurveyQuestionMaxScore,
            parameterTypes: () => [SURVEY_QUESTION_META],
            returnType: { type: "quantity?" },
        },
    },
    segments: {},
};

export type SurveySectionJSON = {
    name: string;
    questions: SurveyQuestionJSON[];
};

export function JSONToSurveySection(json: SurveySectionJSON): SurveySection {
    return {
        name: json.name,
        questions: json.questions.map((inner) => JSONToSurveyQuestion(inner)),
    };
}
export type SurveySectionBrokenJSON = {
    name?: string;
    questions?: SurveyQuestionJSON[];
};

export function newSurveySection(): SurveySection {
    return JSONToSurveySection(repairSurveySectionJSON(undefined));
}
export function repairSurveySectionJSON(
    json: SurveySectionBrokenJSON | undefined
): SurveySectionJSON {
    if (json) {
        return {
            name: json.name || "",
            questions: (json.questions || []).map((inner) =>
                repairSurveyQuestionJSON(inner)
            ),
        };
    } else {
        return {
            name: undefined || "",
            questions: (undefined || []).map((inner) =>
                repairSurveyQuestionJSON(inner)
            ),
        };
    }
}

export function SurveySectionToJSON(value: SurveySection): SurveySectionJSON {
    return {
        name: value.name,
        questions: value.questions.map((inner) => SurveyQuestionToJSON(inner)),
    };
}

export const SURVEY_SECTION_META: RecordMeta<
    SurveySection,
    SurveySectionJSON,
    SurveySectionBrokenJSON
> & { name: "SurveySection" } = {
    name: "SurveySection",
    type: "record",
    repair: repairSurveySectionJSON,
    toJSON: SurveySectionToJSON,
    fromJSON: JSONToSurveySection,
    fields: {
        name: { type: "string" },
        questions: { type: "array", items: SURVEY_QUESTION_META },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type ProjectDescriptionCategoryJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    surveySections: SurveySectionJSON[];
    customerSurveySections: SurveySectionJSON[];
};

export function JSONToProjectDescriptionCategory(
    json: ProjectDescriptionCategoryJSON
): ProjectDescriptionCategory {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        surveySections: json.surveySections.map((inner) =>
            JSONToSurveySection(inner)
        ),
        customerSurveySections: json.customerSurveySections.map((inner) =>
            JSONToSurveySection(inner)
        ),
    };
}
export type ProjectDescriptionCategoryBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    surveySections?: SurveySectionJSON[];
    customerSurveySections?: SurveySectionJSON[];
};

export function newProjectDescriptionCategory(): ProjectDescriptionCategory {
    return JSONToProjectDescriptionCategory(
        repairProjectDescriptionCategoryJSON(undefined)
    );
}
export function repairProjectDescriptionCategoryJSON(
    json: ProjectDescriptionCategoryBrokenJSON | undefined
): ProjectDescriptionCategoryJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            surveySections: (json.surveySections || []).map((inner) =>
                repairSurveySectionJSON(inner)
            ),
            customerSurveySections: (json.customerSurveySections || []).map(
                (inner) => repairSurveySectionJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            surveySections: (undefined || []).map((inner) =>
                repairSurveySectionJSON(inner)
            ),
            customerSurveySections: (undefined || []).map((inner) =>
                repairSurveySectionJSON(inner)
            ),
        };
    }
}

export function ProjectDescriptionCategoryToJSON(
    value: ProjectDescriptionCategory
): ProjectDescriptionCategoryJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        surveySections: value.surveySections.map((inner) =>
            SurveySectionToJSON(inner)
        ),
        customerSurveySections: value.customerSurveySections.map((inner) =>
            SurveySectionToJSON(inner)
        ),
    };
}

export const PROJECT_DESCRIPTION_CATEGORY_META: RecordMeta<
    ProjectDescriptionCategory,
    ProjectDescriptionCategoryJSON,
    ProjectDescriptionCategoryBrokenJSON
> & { name: "ProjectDescriptionCategory" } = {
    name: "ProjectDescriptionCategory",
    type: "record",
    repair: repairProjectDescriptionCategoryJSON,
    toJSON: ProjectDescriptionCategoryToJSON,
    fromJSON: JSONToProjectDescriptionCategory,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        surveySections: { type: "array", items: SURVEY_SECTION_META },
        customerSurveySections: { type: "array", items: SURVEY_SECTION_META },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
