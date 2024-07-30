import dateParse from "date-fns/parseISO";
import { Project } from "ts-morph";
import { Link } from "../../../../clay/link";
import { RecordMeta } from "../../../../clay/meta";
import { genUUID, UUID } from "../../../../clay/uuid";
import { Version } from "../../../../clay/version";
import { User } from "../../../user/table";
import { WorkplaceInspectionTemplate } from "./admin/table";

//!Data
export type WorkplaceInspectionQuestion = {
    id: UUID;
    question: string;
    answer: "" | "OK" | "Not OK" | "N/A";
    correctiveActionNeeded: boolean;
    violation: string;
    actionsRequired: string;
    priority: "" | "low" | "moderate" | "high";
    responsible: Link<User>;
    deadline: Date | null;
};

//!Data
export type WorkplaceInspectionSection = {
    id: UUID;
    name: string;
    questions: WorkplaceInspectionQuestion[];
};

//!Data
export type WorkplaceInspection = {
    id: UUID;
    recordVersion: Version;
    project: Link<Project>;
    date: Date | null;
    firstDate: Date | null;

    addedDateTime: Date | null;
    modifiedDateTime: Date | null;

    template: Link<WorkplaceInspectionTemplate>;

    user: Link<User>;
    certifiedForeman: Link<User>;
    sections: WorkplaceInspectionSection[];

    notes: string[];
};

// BEGIN MAGIC -- DO NOT EDIT
export type WorkplaceInspectionQuestionJSON = {
    id: string;
    question: string;
    answer: string;
    correctiveActionNeeded: boolean;
    violation: string;
    actionsRequired: string;
    priority: string;
    responsible: string | null;
    deadline: string | null;
};

export function JSONToWorkplaceInspectionQuestion(
    json: WorkplaceInspectionQuestionJSON
): WorkplaceInspectionQuestion {
    return {
        id: { uuid: json.id },
        question: json.question,
        answer: json.answer as any,
        correctiveActionNeeded: json.correctiveActionNeeded,
        violation: json.violation,
        actionsRequired: json.actionsRequired,
        priority: json.priority as any,
        responsible: json.responsible,
        deadline: json.deadline !== null ? dateParse(json.deadline) : null,
    };
}
export type WorkplaceInspectionQuestionBrokenJSON = {
    id?: string;
    question?: string;
    answer?: string;
    correctiveActionNeeded?: boolean;
    violation?: string;
    actionsRequired?: string;
    priority?: string;
    responsible?: string | null;
    deadline?: string | null;
};

export function newWorkplaceInspectionQuestion(): WorkplaceInspectionQuestion {
    return JSONToWorkplaceInspectionQuestion(
        repairWorkplaceInspectionQuestionJSON(undefined)
    );
}
export function repairWorkplaceInspectionQuestionJSON(
    json: WorkplaceInspectionQuestionBrokenJSON | undefined
): WorkplaceInspectionQuestionJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            question: json.question || "",
            answer: json.answer || "",
            correctiveActionNeeded: json.correctiveActionNeeded || false,
            violation: json.violation || "",
            actionsRequired: json.actionsRequired || "",
            priority: json.priority || "",
            responsible: json.responsible || null,
            deadline: json.deadline
                ? new Date(json.deadline!).toISOString()
                : null,
        };
    } else {
        return {
            id: undefined || genUUID(),
            question: undefined || "",
            answer: undefined || "",
            correctiveActionNeeded: undefined || false,
            violation: undefined || "",
            actionsRequired: undefined || "",
            priority: undefined || "",
            responsible: undefined || null,
            deadline: undefined ? new Date(undefined!).toISOString() : null,
        };
    }
}

export function WorkplaceInspectionQuestionToJSON(
    value: WorkplaceInspectionQuestion
): WorkplaceInspectionQuestionJSON {
    return {
        id: value.id.uuid,
        question: value.question,
        answer: value.answer,
        correctiveActionNeeded: value.correctiveActionNeeded,
        violation: value.violation,
        actionsRequired: value.actionsRequired,
        priority: value.priority,
        responsible: value.responsible,
        deadline: value.deadline !== null ? value.deadline.toISOString() : null,
    };
}

export const WORKPLACE_INSPECTION_QUESTION_META: RecordMeta<
    WorkplaceInspectionQuestion,
    WorkplaceInspectionQuestionJSON,
    WorkplaceInspectionQuestionBrokenJSON
> & { name: "WorkplaceInspectionQuestion" } = {
    name: "WorkplaceInspectionQuestion",
    type: "record",
    repair: repairWorkplaceInspectionQuestionJSON,
    toJSON: WorkplaceInspectionQuestionToJSON,
    fromJSON: JSONToWorkplaceInspectionQuestion,
    fields: {
        id: { type: "uuid" },
        question: { type: "string" },
        answer: {
            type: "enum",
            values: ["", "OK", "Not OK", "N/A"],
        },
        correctiveActionNeeded: { type: "boolean" },
        violation: { type: "string" },
        actionsRequired: { type: "string" },
        priority: {
            type: "enum",
            values: ["", "low", "moderate", "high"],
        },
        responsible: { type: "uuid", linkTo: "User" },
        deadline: { type: "datetime" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type WorkplaceInspectionSectionJSON = {
    id: string;
    name: string;
    questions: WorkplaceInspectionQuestionJSON[];
};

export function JSONToWorkplaceInspectionSection(
    json: WorkplaceInspectionSectionJSON
): WorkplaceInspectionSection {
    return {
        id: { uuid: json.id },
        name: json.name,
        questions: json.questions.map((inner) =>
            JSONToWorkplaceInspectionQuestion(inner)
        ),
    };
}
export type WorkplaceInspectionSectionBrokenJSON = {
    id?: string;
    name?: string;
    questions?: WorkplaceInspectionQuestionJSON[];
};

export function newWorkplaceInspectionSection(): WorkplaceInspectionSection {
    return JSONToWorkplaceInspectionSection(
        repairWorkplaceInspectionSectionJSON(undefined)
    );
}
export function repairWorkplaceInspectionSectionJSON(
    json: WorkplaceInspectionSectionBrokenJSON | undefined
): WorkplaceInspectionSectionJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            questions: (json.questions || []).map((inner) =>
                repairWorkplaceInspectionQuestionJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            questions: (undefined || []).map((inner) =>
                repairWorkplaceInspectionQuestionJSON(inner)
            ),
        };
    }
}

export function WorkplaceInspectionSectionToJSON(
    value: WorkplaceInspectionSection
): WorkplaceInspectionSectionJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        questions: value.questions.map((inner) =>
            WorkplaceInspectionQuestionToJSON(inner)
        ),
    };
}

export const WORKPLACE_INSPECTION_SECTION_META: RecordMeta<
    WorkplaceInspectionSection,
    WorkplaceInspectionSectionJSON,
    WorkplaceInspectionSectionBrokenJSON
> & { name: "WorkplaceInspectionSection" } = {
    name: "WorkplaceInspectionSection",
    type: "record",
    repair: repairWorkplaceInspectionSectionJSON,
    toJSON: WorkplaceInspectionSectionToJSON,
    fromJSON: JSONToWorkplaceInspectionSection,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        questions: { type: "array", items: WORKPLACE_INSPECTION_QUESTION_META },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type WorkplaceInspectionJSON = {
    id: string;
    recordVersion: number | null;
    project: string | null;
    date: string | null;
    firstDate: string | null;
    addedDateTime: string | null;
    modifiedDateTime: string | null;
    template: string | null;
    user: string | null;
    certifiedForeman: string | null;
    sections: WorkplaceInspectionSectionJSON[];
    notes: string[];
};

export function JSONToWorkplaceInspection(
    json: WorkplaceInspectionJSON
): WorkplaceInspection {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        project: json.project,
        date: json.date !== null ? dateParse(json.date) : null,
        firstDate: json.firstDate !== null ? dateParse(json.firstDate) : null,
        addedDateTime:
            json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
        modifiedDateTime:
            json.modifiedDateTime !== null
                ? dateParse(json.modifiedDateTime)
                : null,
        template: json.template,
        user: json.user,
        certifiedForeman: json.certifiedForeman,
        sections: json.sections.map((inner) =>
            JSONToWorkplaceInspectionSection(inner)
        ),
        notes: json.notes.map((inner) => inner),
    };
}
export type WorkplaceInspectionBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    project?: string | null;
    date?: string | null;
    firstDate?: string | null;
    addedDateTime?: string | null;
    modifiedDateTime?: string | null;
    template?: string | null;
    user?: string | null;
    certifiedForeman?: string | null;
    sections?: WorkplaceInspectionSectionJSON[];
    notes?: string[];
};

export function newWorkplaceInspection(): WorkplaceInspection {
    return JSONToWorkplaceInspection(repairWorkplaceInspectionJSON(undefined));
}
export function repairWorkplaceInspectionJSON(
    json: WorkplaceInspectionBrokenJSON | undefined
): WorkplaceInspectionJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            project: json.project || null,
            date: json.date ? new Date(json.date!).toISOString() : null,
            firstDate: json.firstDate
                ? new Date(json.firstDate!).toISOString()
                : null,
            addedDateTime: json.addedDateTime
                ? new Date(json.addedDateTime!).toISOString()
                : null,
            modifiedDateTime: json.modifiedDateTime
                ? new Date(json.modifiedDateTime!).toISOString()
                : null,
            template: json.template || null,
            user: json.user || null,
            certifiedForeman: json.certifiedForeman || null,
            sections: (json.sections || []).map((inner) =>
                repairWorkplaceInspectionSectionJSON(inner)
            ),
            notes: (json.notes || []).map((inner) => inner || ""),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            project: undefined || null,
            date: undefined ? new Date(undefined!).toISOString() : null,
            firstDate: undefined ? new Date(undefined!).toISOString() : null,
            addedDateTime: undefined
                ? new Date(undefined!).toISOString()
                : null,
            modifiedDateTime: undefined
                ? new Date(undefined!).toISOString()
                : null,
            template: undefined || null,
            user: undefined || null,
            certifiedForeman: undefined || null,
            sections: (undefined || []).map((inner) =>
                repairWorkplaceInspectionSectionJSON(inner)
            ),
            notes: (undefined || []).map((inner) => inner || ""),
        };
    }
}

export function WorkplaceInspectionToJSON(
    value: WorkplaceInspection
): WorkplaceInspectionJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        project: value.project,
        date: value.date !== null ? value.date.toISOString() : null,
        firstDate:
            value.firstDate !== null ? value.firstDate.toISOString() : null,
        addedDateTime:
            value.addedDateTime !== null
                ? value.addedDateTime.toISOString()
                : null,
        modifiedDateTime:
            value.modifiedDateTime !== null
                ? value.modifiedDateTime.toISOString()
                : null,
        template: value.template,
        user: value.user,
        certifiedForeman: value.certifiedForeman,
        sections: value.sections.map((inner) =>
            WorkplaceInspectionSectionToJSON(inner)
        ),
        notes: value.notes.map((inner) => inner),
    };
}

export const WORKPLACE_INSPECTION_META: RecordMeta<
    WorkplaceInspection,
    WorkplaceInspectionJSON,
    WorkplaceInspectionBrokenJSON
> & { name: "WorkplaceInspection" } = {
    name: "WorkplaceInspection",
    type: "record",
    repair: repairWorkplaceInspectionJSON,
    toJSON: WorkplaceInspectionToJSON,
    fromJSON: JSONToWorkplaceInspection,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        project: { type: "uuid", linkTo: "Project" },
        date: { type: "datetime" },
        firstDate: { type: "datetime" },
        addedDateTime: { type: "datetime" },
        modifiedDateTime: { type: "datetime" },
        template: { type: "uuid", linkTo: "WorkplaceInspectionTemplate" },
        user: { type: "uuid", linkTo: "User" },
        certifiedForeman: { type: "uuid", linkTo: "User" },
        sections: { type: "array", items: WORKPLACE_INSPECTION_SECTION_META },
        notes: { type: "array", items: { type: "string" } },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
