import { RecordMeta } from "../../../../../clay/meta";
import { genUUID, UUID } from "../../../../../clay/uuid";
import { Version } from "../../../../../clay/version";

//!Data
export type WorkplaceInspectionTemplateQuestion = {
    id: UUID;
    question: string;
};

//!Data
export type WorkplaceInspectionTemplateSection = {
    id: UUID;
    name: string;
    questions: WorkplaceInspectionTemplateQuestion[];
};

//!Data
export type WorkplaceInspectionTemplate = {
    id: UUID;
    recordVersion: Version;
    sections: WorkplaceInspectionTemplateSection[];
};

export const WORKPLACE_INSPECTION_TEMPLATE_ID =
    "65c4f2c3-64fc-45cc-8a93-688a7031ebfe";

// BEGIN MAGIC -- DO NOT EDIT
export type WorkplaceInspectionTemplateQuestionJSON = {
    id: string;
    question: string;
};

export function JSONToWorkplaceInspectionTemplateQuestion(
    json: WorkplaceInspectionTemplateQuestionJSON
): WorkplaceInspectionTemplateQuestion {
    return {
        id: { uuid: json.id },
        question: json.question,
    };
}
export type WorkplaceInspectionTemplateQuestionBrokenJSON = {
    id?: string;
    question?: string;
};

export function newWorkplaceInspectionTemplateQuestion(): WorkplaceInspectionTemplateQuestion {
    return JSONToWorkplaceInspectionTemplateQuestion(
        repairWorkplaceInspectionTemplateQuestionJSON(undefined)
    );
}
export function repairWorkplaceInspectionTemplateQuestionJSON(
    json: WorkplaceInspectionTemplateQuestionBrokenJSON | undefined
): WorkplaceInspectionTemplateQuestionJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            question: json.question || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            question: undefined || "",
        };
    }
}

export function WorkplaceInspectionTemplateQuestionToJSON(
    value: WorkplaceInspectionTemplateQuestion
): WorkplaceInspectionTemplateQuestionJSON {
    return {
        id: value.id.uuid,
        question: value.question,
    };
}

export const WORKPLACE_INSPECTION_TEMPLATE_QUESTION_META: RecordMeta<
    WorkplaceInspectionTemplateQuestion,
    WorkplaceInspectionTemplateQuestionJSON,
    WorkplaceInspectionTemplateQuestionBrokenJSON
> & { name: "WorkplaceInspectionTemplateQuestion" } = {
    name: "WorkplaceInspectionTemplateQuestion",
    type: "record",
    repair: repairWorkplaceInspectionTemplateQuestionJSON,
    toJSON: WorkplaceInspectionTemplateQuestionToJSON,
    fromJSON: JSONToWorkplaceInspectionTemplateQuestion,
    fields: {
        id: { type: "uuid" },
        question: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type WorkplaceInspectionTemplateSectionJSON = {
    id: string;
    name: string;
    questions: WorkplaceInspectionTemplateQuestionJSON[];
};

export function JSONToWorkplaceInspectionTemplateSection(
    json: WorkplaceInspectionTemplateSectionJSON
): WorkplaceInspectionTemplateSection {
    return {
        id: { uuid: json.id },
        name: json.name,
        questions: json.questions.map((inner) =>
            JSONToWorkplaceInspectionTemplateQuestion(inner)
        ),
    };
}
export type WorkplaceInspectionTemplateSectionBrokenJSON = {
    id?: string;
    name?: string;
    questions?: WorkplaceInspectionTemplateQuestionJSON[];
};

export function newWorkplaceInspectionTemplateSection(): WorkplaceInspectionTemplateSection {
    return JSONToWorkplaceInspectionTemplateSection(
        repairWorkplaceInspectionTemplateSectionJSON(undefined)
    );
}
export function repairWorkplaceInspectionTemplateSectionJSON(
    json: WorkplaceInspectionTemplateSectionBrokenJSON | undefined
): WorkplaceInspectionTemplateSectionJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            questions: (json.questions || []).map((inner) =>
                repairWorkplaceInspectionTemplateQuestionJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            questions: (undefined || []).map((inner) =>
                repairWorkplaceInspectionTemplateQuestionJSON(inner)
            ),
        };
    }
}

export function WorkplaceInspectionTemplateSectionToJSON(
    value: WorkplaceInspectionTemplateSection
): WorkplaceInspectionTemplateSectionJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        questions: value.questions.map((inner) =>
            WorkplaceInspectionTemplateQuestionToJSON(inner)
        ),
    };
}

export const WORKPLACE_INSPECTION_TEMPLATE_SECTION_META: RecordMeta<
    WorkplaceInspectionTemplateSection,
    WorkplaceInspectionTemplateSectionJSON,
    WorkplaceInspectionTemplateSectionBrokenJSON
> & { name: "WorkplaceInspectionTemplateSection" } = {
    name: "WorkplaceInspectionTemplateSection",
    type: "record",
    repair: repairWorkplaceInspectionTemplateSectionJSON,
    toJSON: WorkplaceInspectionTemplateSectionToJSON,
    fromJSON: JSONToWorkplaceInspectionTemplateSection,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        questions: {
            type: "array",
            items: WORKPLACE_INSPECTION_TEMPLATE_QUESTION_META,
        },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type WorkplaceInspectionTemplateJSON = {
    id: string;
    recordVersion: number | null;
    sections: WorkplaceInspectionTemplateSectionJSON[];
};

export function JSONToWorkplaceInspectionTemplate(
    json: WorkplaceInspectionTemplateJSON
): WorkplaceInspectionTemplate {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        sections: json.sections.map((inner) =>
            JSONToWorkplaceInspectionTemplateSection(inner)
        ),
    };
}
export type WorkplaceInspectionTemplateBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    sections?: WorkplaceInspectionTemplateSectionJSON[];
};

export function newWorkplaceInspectionTemplate(): WorkplaceInspectionTemplate {
    return JSONToWorkplaceInspectionTemplate(
        repairWorkplaceInspectionTemplateJSON(undefined)
    );
}
export function repairWorkplaceInspectionTemplateJSON(
    json: WorkplaceInspectionTemplateBrokenJSON | undefined
): WorkplaceInspectionTemplateJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            sections: (json.sections || []).map((inner) =>
                repairWorkplaceInspectionTemplateSectionJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            sections: (undefined || []).map((inner) =>
                repairWorkplaceInspectionTemplateSectionJSON(inner)
            ),
        };
    }
}

export function WorkplaceInspectionTemplateToJSON(
    value: WorkplaceInspectionTemplate
): WorkplaceInspectionTemplateJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        sections: value.sections.map((inner) =>
            WorkplaceInspectionTemplateSectionToJSON(inner)
        ),
    };
}

export const WORKPLACE_INSPECTION_TEMPLATE_META: RecordMeta<
    WorkplaceInspectionTemplate,
    WorkplaceInspectionTemplateJSON,
    WorkplaceInspectionTemplateBrokenJSON
> & { name: "WorkplaceInspectionTemplate" } = {
    name: "WorkplaceInspectionTemplate",
    type: "record",
    repair: repairWorkplaceInspectionTemplateJSON,
    toJSON: WorkplaceInspectionTemplateToJSON,
    fromJSON: JSONToWorkplaceInspectionTemplate,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        sections: {
            type: "array",
            items: WORKPLACE_INSPECTION_TEMPLATE_SECTION_META,
        },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
