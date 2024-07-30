import dateParse from "date-fns/parseISO";
import { Decimal } from "decimal.js";
import { Money, Quantity } from "../../clay/common";
import { Link } from "../../clay/link";
import { LocalDate } from "../../clay/LocalDate";
import { RecordMeta } from "../../clay/meta";
import {
    anyMap,
    currentYear,
    filterMap,
    isNotNull,
    isNull,
} from "../../clay/queryFuncs";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";
import {
    ContactDetail,
    ContactDetailJSON,
    ContactDetailToJSON,
    CONTACT_DETAIL_META,
    JSONToContactDetail,
    repairContactDetailJSON,
} from "../contact/table";
import {
    JSONToProjectPersonnel,
    ProjectPersonnel,
    ProjectPersonnelJSON,
    ProjectPersonnelToJSON,
    PROJECT_PERSONNEL_META,
    repairProjectPersonnelJSON,
} from "../project/personnel/table";
import { FinishScheduleLine, Project } from "../project/table";
import { Role } from "../roles/table";
import {
    JSONToUserAndDate,
    repairUserAndDateJSON,
    UserAndDate,
    UserAndDateJSON,
    UserAndDateToJSON,
    USER_AND_DATE_META,
} from "../user-and-date/table";
import { User } from "../user/table";

//!Data
export type WarrantyReviewTemplateInspectionItem = {
    name: string;
};

//!Data
export type WarrantyReviewTemplate = {
    id: UUID;
    recordVersion: Version;
    inspectionItems: WarrantyReviewTemplateInspectionItem[];
};

export const WARRANTY_REVIEW_TEMPLATE_ID =
    "16dd762b-4dd4-43b7-929c-a57b30ae2fff";

//!Data
export type WarrantyReviewInspectionItem = {
    id: UUID;
    name: string;
    evaluation: "" | "Good" | "Requires Attention" | "N/A";
    notes: string;
};

//!Data
export type WarrantyReviewSpecificItem = {
    id: UUID;
    description: string;
    actionRequired: string;
    covered: "" | "Yes" | "Remdal" | "Other";
};

export const COVERED_LABELS = {
    Yes: "Yes. Remdal will attend to this work when weather and schedule permit.",
    Remdal: "No. However, Remdal can provide a quotation for this work upon request.",
    Other: "No. Remdal recommends you seek a quotation from a qualified contractor.",
};

//!Data
export type WarrantyReviewDetailSheetItem = {
    id: UUID;
    description: string;
    actionRequired: string;
    included: boolean;
};

//!Data
export type WarrantyReviewDetailSheet = {
    id: UUID;
    recordVersion: Version;
    addedDateTime: Date | null;
    modifiedDateTime: Date | null;
    firstDate: Date | null;
    date: Date | null;
    addedByUser: Link<User>;
    warrantyReview: Link<WarrantyReview>;
    certifiedForeman: Link<User>;
    scheduledWorkDate: LocalDate | null;
    manager: Link<User>;
    number: Quantity;

    accessRequirements: string[];
    requiredEquipment: string[];
    customerAndProjectNotes: string[];

    items: WarrantyReviewDetailSheetItem[];

    paymentSource: "" | "Remdal" | "WarrantyFund";
    cfPayment: "" | "None" | "Hourly" | "LumpSum";
    cfPaymentAmount: Money;
    cfRate: Money;

    hasNonWarrantyItems: boolean;
    nonWarrantyItems: string;

    highlightedFinishSchedules: Link<FinishScheduleLine>[];
};

//!Data
export type WarrantyInternalNote = {
    date: Date | null;
    user: Link<User>;
    text: string;
};

//!Data
export type WarrantyReview = {
    id: UUID;
    recordVersion: Version;
    project: Link<Project>;
    personnel: ProjectPersonnel[];
    dueDate: LocalDate | null;
    remediationWorkDueDate: LocalDate | null;
    ownersRepresentatives: ContactDetail[];
    contacts: ContactDetail[];
    scheduledDate: LocalDate | null;

    generalInspection: WarrantyReviewInspectionItem[];
    specificItems: WarrantyReviewSpecificItem[];

    reviewDate: Date | null;
    yearOfWarrantyReview: Quantity | null;
    reviewStarted: boolean;
    cancelled: UserAndDate;
    cancellationReason: string;

    internalNotes: WarrantyInternalNote[];

    completionDate: Date | null;
};

export function buildWarrantyReview(project: Project): WarrantyReview {
    return {
        ...WARRANTY_REVIEW_META.fromJSON(
            WARRANTY_REVIEW_META.repair(undefined)
        ),
        project: project.id.uuid,
        yearOfWarrantyReview:
            (length &&
                project.completionDate &&
                new Decimal(project.completionDate.date.getFullYear())
                    .plus(length)
                    .ceil()) ||
            null,
        ownersRepresentatives: project.billingContacts,
        contacts: project.contacts,
    };
}

export function calcWarrantyReviewUnacceptedUsers(
    project: WarrantyReview
): Link<User>[] {
    return filterMap(
        project.personnel,
        (row) => !row.accepted,
        (row) => row.user
    );
}

function calcWarrantyReviewActive(review: WarrantyReview): boolean {
    return (
        isNull(review.cancelled.date) &&
        (isNull(review.reviewDate) || calcWarrantyReviewHasCoveredItems(review))
    );
}

export function calcWarrantyReviewHasProjectManager(
    review: WarrantyReview
): boolean {
    return anyMap(
        review.personnel,
        (entry) => entry.role === "ef529179-ed06-4ed0-9d70-09d7ee143771"
    );
}

export function calcWarrantyReviewIsComplete(review: WarrantyReview): boolean {
    return (
        !calcWarrantyReviewHasCoveredItems(review) ||
        isNotNull(review.completionDate)
    );
}

export function calcWarrantyReviewHasCoveredItems(
    review: WarrantyReview
): boolean {
    return anyMap(review.specificItems, (items) => items.covered === "Yes");
}

function calcWarrantyReviewStage(
    review: WarrantyReview
):
    | "Current"
    | "Overdue"
    | "In Progress"
    | "Work Required"
    | "Completed"
    | "Upcoming"
    | "Cancelled" {
    return isNotNull(review.cancelled.date)
        ? "Cancelled"
        : isNotNull(review.reviewDate)
        ? calcWarrantyReviewIsComplete(review)
            ? "Completed"
            : "Work Required"
        : isNotNull(review.scheduledDate)
        ? "In Progress"
        : currentYear().lessThan(review.yearOfWarrantyReview!)
        ? "Upcoming"
        : currentYear().greaterThan(review.yearOfWarrantyReview!)
        ? "Overdue"
        : "Current";
}

function calcWarrantyReviewColor(review: WarrantyReview): string {
    return isNotNull(review.cancelled.date)
        ? "#b3b3b3"
        : isNotNull(review.reviewDate)
        ? calcWarrantyReviewIsComplete(review)
            ? "#ffff80"
            : "#e5ffe0"
        : isNotNull(review.scheduledDate)
        ? "#ff8b13"
        : currentYear().lessThan(review.yearOfWarrantyReview!)
        ? "#ffffff"
        : currentYear().greaterThan(review.yearOfWarrantyReview!)
        ? "#ff0000"
        : "#e5ffe0";
}

function calcWarrantyReviewStageSort(review: WarrantyReview): string {
    return isNotNull(review.cancelled.date)
        ? "7"
        : isNotNull(review.reviewDate)
        ? !calcWarrantyReviewHasCoveredItems(review)
            ? "5"
            : "4"
        : isNotNull(review.scheduledDate)
        ? "3"
        : currentYear().lessThan(review.yearOfWarrantyReview!)
        ? "6"
        : currentYear().greaterThan(review.yearOfWarrantyReview!)
        ? "2"
        : "1";
}

export function calcWarrantyReviewPersonnelByRole(
    project: WarrantyReview,
    role: Link<Role>
): Link<User>[] {
    return filterMap(
        project.personnel,
        (person) => person.role === role,
        (person) => person.user
    );
}

// BEGIN MAGIC -- DO NOT EDIT
export type WarrantyReviewTemplateInspectionItemJSON = {
    name: string;
};

export function JSONToWarrantyReviewTemplateInspectionItem(
    json: WarrantyReviewTemplateInspectionItemJSON
): WarrantyReviewTemplateInspectionItem {
    return {
        name: json.name,
    };
}
export type WarrantyReviewTemplateInspectionItemBrokenJSON = {
    name?: string;
};

export function newWarrantyReviewTemplateInspectionItem(): WarrantyReviewTemplateInspectionItem {
    return JSONToWarrantyReviewTemplateInspectionItem(
        repairWarrantyReviewTemplateInspectionItemJSON(undefined)
    );
}
export function repairWarrantyReviewTemplateInspectionItemJSON(
    json: WarrantyReviewTemplateInspectionItemBrokenJSON | undefined
): WarrantyReviewTemplateInspectionItemJSON {
    if (json) {
        return {
            name: json.name || "",
        };
    } else {
        return {
            name: undefined || "",
        };
    }
}

export function WarrantyReviewTemplateInspectionItemToJSON(
    value: WarrantyReviewTemplateInspectionItem
): WarrantyReviewTemplateInspectionItemJSON {
    return {
        name: value.name,
    };
}

export const WARRANTY_REVIEW_TEMPLATE_INSPECTION_ITEM_META: RecordMeta<
    WarrantyReviewTemplateInspectionItem,
    WarrantyReviewTemplateInspectionItemJSON,
    WarrantyReviewTemplateInspectionItemBrokenJSON
> & { name: "WarrantyReviewTemplateInspectionItem" } = {
    name: "WarrantyReviewTemplateInspectionItem",
    type: "record",
    repair: repairWarrantyReviewTemplateInspectionItemJSON,
    toJSON: WarrantyReviewTemplateInspectionItemToJSON,
    fromJSON: JSONToWarrantyReviewTemplateInspectionItem,
    fields: {
        name: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type WarrantyReviewTemplateJSON = {
    id: string;
    recordVersion: number | null;
    inspectionItems: WarrantyReviewTemplateInspectionItemJSON[];
};

export function JSONToWarrantyReviewTemplate(
    json: WarrantyReviewTemplateJSON
): WarrantyReviewTemplate {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        inspectionItems: json.inspectionItems.map((inner) =>
            JSONToWarrantyReviewTemplateInspectionItem(inner)
        ),
    };
}
export type WarrantyReviewTemplateBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    inspectionItems?: WarrantyReviewTemplateInspectionItemJSON[];
};

export function newWarrantyReviewTemplate(): WarrantyReviewTemplate {
    return JSONToWarrantyReviewTemplate(
        repairWarrantyReviewTemplateJSON(undefined)
    );
}
export function repairWarrantyReviewTemplateJSON(
    json: WarrantyReviewTemplateBrokenJSON | undefined
): WarrantyReviewTemplateJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            inspectionItems: (json.inspectionItems || []).map((inner) =>
                repairWarrantyReviewTemplateInspectionItemJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            inspectionItems: (undefined || []).map((inner) =>
                repairWarrantyReviewTemplateInspectionItemJSON(inner)
            ),
        };
    }
}

export function WarrantyReviewTemplateToJSON(
    value: WarrantyReviewTemplate
): WarrantyReviewTemplateJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        inspectionItems: value.inspectionItems.map((inner) =>
            WarrantyReviewTemplateInspectionItemToJSON(inner)
        ),
    };
}

export const WARRANTY_REVIEW_TEMPLATE_META: RecordMeta<
    WarrantyReviewTemplate,
    WarrantyReviewTemplateJSON,
    WarrantyReviewTemplateBrokenJSON
> & { name: "WarrantyReviewTemplate" } = {
    name: "WarrantyReviewTemplate",
    type: "record",
    repair: repairWarrantyReviewTemplateJSON,
    toJSON: WarrantyReviewTemplateToJSON,
    fromJSON: JSONToWarrantyReviewTemplate,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        inspectionItems: {
            type: "array",
            items: WARRANTY_REVIEW_TEMPLATE_INSPECTION_ITEM_META,
        },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type WarrantyReviewInspectionItemJSON = {
    id: string;
    name: string;
    evaluation: string;
    notes: string;
};

export function JSONToWarrantyReviewInspectionItem(
    json: WarrantyReviewInspectionItemJSON
): WarrantyReviewInspectionItem {
    return {
        id: { uuid: json.id },
        name: json.name,
        evaluation: json.evaluation as any,
        notes: json.notes,
    };
}
export type WarrantyReviewInspectionItemBrokenJSON = {
    id?: string;
    name?: string;
    evaluation?: string;
    notes?: string;
};

export function newWarrantyReviewInspectionItem(): WarrantyReviewInspectionItem {
    return JSONToWarrantyReviewInspectionItem(
        repairWarrantyReviewInspectionItemJSON(undefined)
    );
}
export function repairWarrantyReviewInspectionItemJSON(
    json: WarrantyReviewInspectionItemBrokenJSON | undefined
): WarrantyReviewInspectionItemJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            evaluation: json.evaluation || "",
            notes: json.notes || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            evaluation: undefined || "",
            notes: undefined || "",
        };
    }
}

export function WarrantyReviewInspectionItemToJSON(
    value: WarrantyReviewInspectionItem
): WarrantyReviewInspectionItemJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        evaluation: value.evaluation,
        notes: value.notes,
    };
}

export const WARRANTY_REVIEW_INSPECTION_ITEM_META: RecordMeta<
    WarrantyReviewInspectionItem,
    WarrantyReviewInspectionItemJSON,
    WarrantyReviewInspectionItemBrokenJSON
> & { name: "WarrantyReviewInspectionItem" } = {
    name: "WarrantyReviewInspectionItem",
    type: "record",
    repair: repairWarrantyReviewInspectionItemJSON,
    toJSON: WarrantyReviewInspectionItemToJSON,
    fromJSON: JSONToWarrantyReviewInspectionItem,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        evaluation: {
            type: "enum",
            values: ["", "Good", "Requires Attention", "N/A"],
        },
        notes: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type WarrantyReviewSpecificItemJSON = {
    id: string;
    description: string;
    actionRequired: string;
    covered: string;
};

export function JSONToWarrantyReviewSpecificItem(
    json: WarrantyReviewSpecificItemJSON
): WarrantyReviewSpecificItem {
    return {
        id: { uuid: json.id },
        description: json.description,
        actionRequired: json.actionRequired,
        covered: json.covered as any,
    };
}
export type WarrantyReviewSpecificItemBrokenJSON = {
    id?: string;
    description?: string;
    actionRequired?: string;
    covered?: string;
};

export function newWarrantyReviewSpecificItem(): WarrantyReviewSpecificItem {
    return JSONToWarrantyReviewSpecificItem(
        repairWarrantyReviewSpecificItemJSON(undefined)
    );
}
export function repairWarrantyReviewSpecificItemJSON(
    json: WarrantyReviewSpecificItemBrokenJSON | undefined
): WarrantyReviewSpecificItemJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            description: json.description || "",
            actionRequired: json.actionRequired || "",
            covered: json.covered || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            description: undefined || "",
            actionRequired: undefined || "",
            covered: undefined || "",
        };
    }
}

export function WarrantyReviewSpecificItemToJSON(
    value: WarrantyReviewSpecificItem
): WarrantyReviewSpecificItemJSON {
    return {
        id: value.id.uuid,
        description: value.description,
        actionRequired: value.actionRequired,
        covered: value.covered,
    };
}

export const WARRANTY_REVIEW_SPECIFIC_ITEM_META: RecordMeta<
    WarrantyReviewSpecificItem,
    WarrantyReviewSpecificItemJSON,
    WarrantyReviewSpecificItemBrokenJSON
> & { name: "WarrantyReviewSpecificItem" } = {
    name: "WarrantyReviewSpecificItem",
    type: "record",
    repair: repairWarrantyReviewSpecificItemJSON,
    toJSON: WarrantyReviewSpecificItemToJSON,
    fromJSON: JSONToWarrantyReviewSpecificItem,
    fields: {
        id: { type: "uuid" },
        description: { type: "string" },
        actionRequired: { type: "string" },
        covered: {
            type: "enum",
            values: ["", "Yes", "Remdal", "Other"],
        },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type WarrantyReviewDetailSheetItemJSON = {
    id: string;
    description: string;
    actionRequired: string;
    included: boolean;
};

export function JSONToWarrantyReviewDetailSheetItem(
    json: WarrantyReviewDetailSheetItemJSON
): WarrantyReviewDetailSheetItem {
    return {
        id: { uuid: json.id },
        description: json.description,
        actionRequired: json.actionRequired,
        included: json.included,
    };
}
export type WarrantyReviewDetailSheetItemBrokenJSON = {
    id?: string;
    description?: string;
    actionRequired?: string;
    included?: boolean;
};

export function newWarrantyReviewDetailSheetItem(): WarrantyReviewDetailSheetItem {
    return JSONToWarrantyReviewDetailSheetItem(
        repairWarrantyReviewDetailSheetItemJSON(undefined)
    );
}
export function repairWarrantyReviewDetailSheetItemJSON(
    json: WarrantyReviewDetailSheetItemBrokenJSON | undefined
): WarrantyReviewDetailSheetItemJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            description: json.description || "",
            actionRequired: json.actionRequired || "",
            included: json.included || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            description: undefined || "",
            actionRequired: undefined || "",
            included: undefined || false,
        };
    }
}

export function WarrantyReviewDetailSheetItemToJSON(
    value: WarrantyReviewDetailSheetItem
): WarrantyReviewDetailSheetItemJSON {
    return {
        id: value.id.uuid,
        description: value.description,
        actionRequired: value.actionRequired,
        included: value.included,
    };
}

export const WARRANTY_REVIEW_DETAIL_SHEET_ITEM_META: RecordMeta<
    WarrantyReviewDetailSheetItem,
    WarrantyReviewDetailSheetItemJSON,
    WarrantyReviewDetailSheetItemBrokenJSON
> & { name: "WarrantyReviewDetailSheetItem" } = {
    name: "WarrantyReviewDetailSheetItem",
    type: "record",
    repair: repairWarrantyReviewDetailSheetItemJSON,
    toJSON: WarrantyReviewDetailSheetItemToJSON,
    fromJSON: JSONToWarrantyReviewDetailSheetItem,
    fields: {
        id: { type: "uuid" },
        description: { type: "string" },
        actionRequired: { type: "string" },
        included: { type: "boolean" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type WarrantyReviewDetailSheetJSON = {
    id: string;
    recordVersion: number | null;
    addedDateTime: string | null;
    modifiedDateTime: string | null;
    firstDate: string | null;
    date: string | null;
    addedByUser: string | null;
    warrantyReview: string | null;
    certifiedForeman: string | null;
    scheduledWorkDate: string | null;
    manager: string | null;
    number: string;
    accessRequirements: string[];
    requiredEquipment: string[];
    customerAndProjectNotes: string[];
    items: WarrantyReviewDetailSheetItemJSON[];
    paymentSource: string;
    cfPayment: string;
    cfPaymentAmount: string;
    cfRate: string;
    hasNonWarrantyItems: boolean;
    nonWarrantyItems: string;
    highlightedFinishSchedules: (string | null)[];
};

export function JSONToWarrantyReviewDetailSheet(
    json: WarrantyReviewDetailSheetJSON
): WarrantyReviewDetailSheet {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        addedDateTime:
            json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
        modifiedDateTime:
            json.modifiedDateTime !== null
                ? dateParse(json.modifiedDateTime)
                : null,
        firstDate: json.firstDate !== null ? dateParse(json.firstDate) : null,
        date: json.date !== null ? dateParse(json.date) : null,
        addedByUser: json.addedByUser,
        warrantyReview: json.warrantyReview,
        certifiedForeman: json.certifiedForeman,
        scheduledWorkDate:
            json.scheduledWorkDate !== null
                ? LocalDate.parse(json.scheduledWorkDate)
                : null,
        manager: json.manager,
        number: new Decimal(json.number),
        accessRequirements: json.accessRequirements.map((inner) => inner),
        requiredEquipment: json.requiredEquipment.map((inner) => inner),
        customerAndProjectNotes: json.customerAndProjectNotes.map(
            (inner) => inner
        ),
        items: json.items.map((inner) =>
            JSONToWarrantyReviewDetailSheetItem(inner)
        ),
        paymentSource: json.paymentSource as any,
        cfPayment: json.cfPayment as any,
        cfPaymentAmount: new Decimal(json.cfPaymentAmount),
        cfRate: new Decimal(json.cfRate),
        hasNonWarrantyItems: json.hasNonWarrantyItems,
        nonWarrantyItems: json.nonWarrantyItems,
        highlightedFinishSchedules: json.highlightedFinishSchedules.map(
            (inner) => inner
        ),
    };
}
export type WarrantyReviewDetailSheetBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    addedDateTime?: string | null;
    modifiedDateTime?: string | null;
    firstDate?: string | null;
    date?: string | null;
    addedByUser?: string | null;
    warrantyReview?: string | null;
    certifiedForeman?: string | null;
    scheduledWorkDate?: string | null;
    manager?: string | null;
    number?: string;
    accessRequirements?: string[];
    requiredEquipment?: string[];
    customerAndProjectNotes?: string[];
    items?: WarrantyReviewDetailSheetItemJSON[];
    paymentSource?: string;
    cfPayment?: string;
    cfPaymentAmount?: string;
    cfRate?: string;
    hasNonWarrantyItems?: boolean;
    nonWarrantyItems?: string;
    highlightedFinishSchedules?: (string | null)[];
};

export function newWarrantyReviewDetailSheet(): WarrantyReviewDetailSheet {
    return JSONToWarrantyReviewDetailSheet(
        repairWarrantyReviewDetailSheetJSON(undefined)
    );
}
export function repairWarrantyReviewDetailSheetJSON(
    json: WarrantyReviewDetailSheetBrokenJSON | undefined
): WarrantyReviewDetailSheetJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            addedDateTime: json.addedDateTime
                ? new Date(json.addedDateTime!).toISOString()
                : null,
            modifiedDateTime: json.modifiedDateTime
                ? new Date(json.modifiedDateTime!).toISOString()
                : null,
            firstDate: json.firstDate
                ? new Date(json.firstDate!).toISOString()
                : null,
            date: json.date ? new Date(json.date!).toISOString() : null,
            addedByUser: json.addedByUser || null,
            warrantyReview: json.warrantyReview || null,
            certifiedForeman: json.certifiedForeman || null,
            scheduledWorkDate: json.scheduledWorkDate || null,
            manager: json.manager || null,
            number: json.number || "0",
            accessRequirements: (json.accessRequirements || []).map(
                (inner) => inner || ""
            ),
            requiredEquipment: (json.requiredEquipment || []).map(
                (inner) => inner || ""
            ),
            customerAndProjectNotes: (json.customerAndProjectNotes || []).map(
                (inner) => inner || ""
            ),
            items: (json.items || []).map((inner) =>
                repairWarrantyReviewDetailSheetItemJSON(inner)
            ),
            paymentSource: json.paymentSource || "",
            cfPayment: json.cfPayment || "",
            cfPaymentAmount: json.cfPaymentAmount || "0",
            cfRate: json.cfRate || "0",
            hasNonWarrantyItems: json.hasNonWarrantyItems || false,
            nonWarrantyItems: json.nonWarrantyItems || "",
            highlightedFinishSchedules: (
                json.highlightedFinishSchedules || []
            ).map((inner) => inner || null),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            addedDateTime: undefined
                ? new Date(undefined!).toISOString()
                : null,
            modifiedDateTime: undefined
                ? new Date(undefined!).toISOString()
                : null,
            firstDate: undefined ? new Date(undefined!).toISOString() : null,
            date: undefined ? new Date(undefined!).toISOString() : null,
            addedByUser: undefined || null,
            warrantyReview: undefined || null,
            certifiedForeman: undefined || null,
            scheduledWorkDate: undefined || null,
            manager: undefined || null,
            number: undefined || "0",
            accessRequirements: (undefined || []).map((inner) => inner || ""),
            requiredEquipment: (undefined || []).map((inner) => inner || ""),
            customerAndProjectNotes: (undefined || []).map(
                (inner) => inner || ""
            ),
            items: (undefined || []).map((inner) =>
                repairWarrantyReviewDetailSheetItemJSON(inner)
            ),
            paymentSource: undefined || "",
            cfPayment: undefined || "",
            cfPaymentAmount: undefined || "0",
            cfRate: undefined || "0",
            hasNonWarrantyItems: undefined || false,
            nonWarrantyItems: undefined || "",
            highlightedFinishSchedules: (undefined || []).map(
                (inner) => inner || null
            ),
        };
    }
}

export function WarrantyReviewDetailSheetToJSON(
    value: WarrantyReviewDetailSheet
): WarrantyReviewDetailSheetJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        addedDateTime:
            value.addedDateTime !== null
                ? value.addedDateTime.toISOString()
                : null,
        modifiedDateTime:
            value.modifiedDateTime !== null
                ? value.modifiedDateTime.toISOString()
                : null,
        firstDate:
            value.firstDate !== null ? value.firstDate.toISOString() : null,
        date: value.date !== null ? value.date.toISOString() : null,
        addedByUser: value.addedByUser,
        warrantyReview: value.warrantyReview,
        certifiedForeman: value.certifiedForeman,
        scheduledWorkDate:
            value.scheduledWorkDate !== null
                ? value.scheduledWorkDate.toString()
                : null,
        manager: value.manager,
        number: value.number.toString(),
        accessRequirements: value.accessRequirements.map((inner) => inner),
        requiredEquipment: value.requiredEquipment.map((inner) => inner),
        customerAndProjectNotes: value.customerAndProjectNotes.map(
            (inner) => inner
        ),
        items: value.items.map((inner) =>
            WarrantyReviewDetailSheetItemToJSON(inner)
        ),
        paymentSource: value.paymentSource,
        cfPayment: value.cfPayment,
        cfPaymentAmount: value.cfPaymentAmount.toString(),
        cfRate: value.cfRate.toString(),
        hasNonWarrantyItems: value.hasNonWarrantyItems,
        nonWarrantyItems: value.nonWarrantyItems,
        highlightedFinishSchedules: value.highlightedFinishSchedules.map(
            (inner) => inner
        ),
    };
}

export const WARRANTY_REVIEW_DETAIL_SHEET_META: RecordMeta<
    WarrantyReviewDetailSheet,
    WarrantyReviewDetailSheetJSON,
    WarrantyReviewDetailSheetBrokenJSON
> & { name: "WarrantyReviewDetailSheet" } = {
    name: "WarrantyReviewDetailSheet",
    type: "record",
    repair: repairWarrantyReviewDetailSheetJSON,
    toJSON: WarrantyReviewDetailSheetToJSON,
    fromJSON: JSONToWarrantyReviewDetailSheet,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        addedDateTime: { type: "datetime" },
        modifiedDateTime: { type: "datetime" },
        firstDate: { type: "datetime" },
        date: { type: "datetime" },
        addedByUser: { type: "uuid", linkTo: "User" },
        warrantyReview: { type: "uuid", linkTo: "WarrantyReview" },
        certifiedForeman: { type: "uuid", linkTo: "User" },
        scheduledWorkDate: { type: "date" },
        manager: { type: "uuid", linkTo: "User" },
        number: { type: "quantity" },
        accessRequirements: { type: "array", items: { type: "string" } },
        requiredEquipment: { type: "array", items: { type: "string" } },
        customerAndProjectNotes: { type: "array", items: { type: "string" } },
        items: { type: "array", items: WARRANTY_REVIEW_DETAIL_SHEET_ITEM_META },
        paymentSource: {
            type: "enum",
            values: ["", "Remdal", "WarrantyFund"],
        },
        cfPayment: {
            type: "enum",
            values: ["", "None", "Hourly", "LumpSum"],
        },
        cfPaymentAmount: { type: "money" },
        cfRate: { type: "money" },
        hasNonWarrantyItems: { type: "boolean" },
        nonWarrantyItems: { type: "string" },
        highlightedFinishSchedules: {
            type: "array",
            items: { type: "uuid", linkTo: "FinishScheduleLine" },
        },
    },
    userFacingKey: "number",
    functions: {},
    segments: {},
};

export type WarrantyInternalNoteJSON = {
    date: string | null;
    user: string | null;
    text: string;
};

export function JSONToWarrantyInternalNote(
    json: WarrantyInternalNoteJSON
): WarrantyInternalNote {
    return {
        date: json.date !== null ? dateParse(json.date) : null,
        user: json.user,
        text: json.text,
    };
}
export type WarrantyInternalNoteBrokenJSON = {
    date?: string | null;
    user?: string | null;
    text?: string;
};

export function newWarrantyInternalNote(): WarrantyInternalNote {
    return JSONToWarrantyInternalNote(
        repairWarrantyInternalNoteJSON(undefined)
    );
}
export function repairWarrantyInternalNoteJSON(
    json: WarrantyInternalNoteBrokenJSON | undefined
): WarrantyInternalNoteJSON {
    if (json) {
        return {
            date: json.date ? new Date(json.date!).toISOString() : null,
            user: json.user || null,
            text: json.text || "",
        };
    } else {
        return {
            date: undefined ? new Date(undefined!).toISOString() : null,
            user: undefined || null,
            text: undefined || "",
        };
    }
}

export function WarrantyInternalNoteToJSON(
    value: WarrantyInternalNote
): WarrantyInternalNoteJSON {
    return {
        date: value.date !== null ? value.date.toISOString() : null,
        user: value.user,
        text: value.text,
    };
}

export const WARRANTY_INTERNAL_NOTE_META: RecordMeta<
    WarrantyInternalNote,
    WarrantyInternalNoteJSON,
    WarrantyInternalNoteBrokenJSON
> & { name: "WarrantyInternalNote" } = {
    name: "WarrantyInternalNote",
    type: "record",
    repair: repairWarrantyInternalNoteJSON,
    toJSON: WarrantyInternalNoteToJSON,
    fromJSON: JSONToWarrantyInternalNote,
    fields: {
        date: { type: "datetime" },
        user: { type: "uuid", linkTo: "User" },
        text: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type WarrantyReviewJSON = {
    id: string;
    recordVersion: number | null;
    project: string | null;
    personnel: ProjectPersonnelJSON[];
    dueDate: string | null;
    remediationWorkDueDate: string | null;
    ownersRepresentatives: ContactDetailJSON[];
    contacts: ContactDetailJSON[];
    scheduledDate: string | null;
    generalInspection: WarrantyReviewInspectionItemJSON[];
    specificItems: WarrantyReviewSpecificItemJSON[];
    reviewDate: string | null;
    yearOfWarrantyReview: string | null;
    reviewStarted: boolean;
    cancelled: UserAndDateJSON;
    cancellationReason: string;
    internalNotes: WarrantyInternalNoteJSON[];
    completionDate: string | null;
};

export function JSONToWarrantyReview(json: WarrantyReviewJSON): WarrantyReview {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        project: json.project,
        personnel: json.personnel.map((inner) => JSONToProjectPersonnel(inner)),
        dueDate: json.dueDate !== null ? LocalDate.parse(json.dueDate) : null,
        remediationWorkDueDate:
            json.remediationWorkDueDate !== null
                ? LocalDate.parse(json.remediationWorkDueDate)
                : null,
        ownersRepresentatives: json.ownersRepresentatives.map((inner) =>
            JSONToContactDetail(inner)
        ),
        contacts: json.contacts.map((inner) => JSONToContactDetail(inner)),
        scheduledDate:
            json.scheduledDate !== null
                ? LocalDate.parse(json.scheduledDate)
                : null,
        generalInspection: json.generalInspection.map((inner) =>
            JSONToWarrantyReviewInspectionItem(inner)
        ),
        specificItems: json.specificItems.map((inner) =>
            JSONToWarrantyReviewSpecificItem(inner)
        ),
        reviewDate:
            json.reviewDate !== null ? dateParse(json.reviewDate) : null,
        yearOfWarrantyReview:
            json.yearOfWarrantyReview !== null
                ? new Decimal(json.yearOfWarrantyReview)
                : null,
        reviewStarted: json.reviewStarted,
        cancelled: JSONToUserAndDate(json.cancelled),
        cancellationReason: json.cancellationReason,
        internalNotes: json.internalNotes.map((inner) =>
            JSONToWarrantyInternalNote(inner)
        ),
        completionDate:
            json.completionDate !== null
                ? dateParse(json.completionDate)
                : null,
    };
}
export type WarrantyReviewBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    project?: string | null;
    personnel?: ProjectPersonnelJSON[];
    dueDate?: string | null;
    remediationWorkDueDate?: string | null;
    ownersRepresentatives?: ContactDetailJSON[];
    contacts?: ContactDetailJSON[];
    scheduledDate?: string | null;
    generalInspection?: WarrantyReviewInspectionItemJSON[];
    specificItems?: WarrantyReviewSpecificItemJSON[];
    reviewDate?: string | null;
    yearOfWarrantyReview?: string | null;
    reviewStarted?: boolean;
    cancelled?: UserAndDateJSON;
    cancellationReason?: string;
    internalNotes?: WarrantyInternalNoteJSON[];
    completionDate?: string | null;
};

export function newWarrantyReview(): WarrantyReview {
    return JSONToWarrantyReview(repairWarrantyReviewJSON(undefined));
}
export function repairWarrantyReviewJSON(
    json: WarrantyReviewBrokenJSON | undefined
): WarrantyReviewJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            project: json.project || null,
            personnel: (json.personnel || []).map((inner) =>
                repairProjectPersonnelJSON(inner)
            ),
            dueDate: json.dueDate || null,
            remediationWorkDueDate: json.remediationWorkDueDate || null,
            ownersRepresentatives: (json.ownersRepresentatives || []).map(
                (inner) => repairContactDetailJSON(inner)
            ),
            contacts: (json.contacts || []).map((inner) =>
                repairContactDetailJSON(inner)
            ),
            scheduledDate: json.scheduledDate || null,
            generalInspection: (json.generalInspection || []).map((inner) =>
                repairWarrantyReviewInspectionItemJSON(inner)
            ),
            specificItems: (json.specificItems || []).map((inner) =>
                repairWarrantyReviewSpecificItemJSON(inner)
            ),
            reviewDate: json.reviewDate
                ? new Date(json.reviewDate!).toISOString()
                : null,
            yearOfWarrantyReview: json.yearOfWarrantyReview || null,
            reviewStarted: json.reviewStarted || false,
            cancelled: repairUserAndDateJSON(json.cancelled),
            cancellationReason: json.cancellationReason || "",
            internalNotes: (json.internalNotes || []).map((inner) =>
                repairWarrantyInternalNoteJSON(inner)
            ),
            completionDate: json.completionDate
                ? new Date(json.completionDate!).toISOString()
                : null,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            project: undefined || null,
            personnel: (undefined || []).map((inner) =>
                repairProjectPersonnelJSON(inner)
            ),
            dueDate: undefined || null,
            remediationWorkDueDate: undefined || null,
            ownersRepresentatives: (undefined || []).map((inner) =>
                repairContactDetailJSON(inner)
            ),
            contacts: (undefined || []).map((inner) =>
                repairContactDetailJSON(inner)
            ),
            scheduledDate: undefined || null,
            generalInspection: (undefined || []).map((inner) =>
                repairWarrantyReviewInspectionItemJSON(inner)
            ),
            specificItems: (undefined || []).map((inner) =>
                repairWarrantyReviewSpecificItemJSON(inner)
            ),
            reviewDate: undefined ? new Date(undefined!).toISOString() : null,
            yearOfWarrantyReview: undefined || null,
            reviewStarted: undefined || false,
            cancelled: repairUserAndDateJSON(undefined),
            cancellationReason: undefined || "",
            internalNotes: (undefined || []).map((inner) =>
                repairWarrantyInternalNoteJSON(inner)
            ),
            completionDate: undefined
                ? new Date(undefined!).toISOString()
                : null,
        };
    }
}

export function WarrantyReviewToJSON(
    value: WarrantyReview
): WarrantyReviewJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        project: value.project,
        personnel: value.personnel.map((inner) =>
            ProjectPersonnelToJSON(inner)
        ),
        dueDate: value.dueDate !== null ? value.dueDate.toString() : null,
        remediationWorkDueDate:
            value.remediationWorkDueDate !== null
                ? value.remediationWorkDueDate.toString()
                : null,
        ownersRepresentatives: value.ownersRepresentatives.map((inner) =>
            ContactDetailToJSON(inner)
        ),
        contacts: value.contacts.map((inner) => ContactDetailToJSON(inner)),
        scheduledDate:
            value.scheduledDate !== null
                ? value.scheduledDate.toString()
                : null,
        generalInspection: value.generalInspection.map((inner) =>
            WarrantyReviewInspectionItemToJSON(inner)
        ),
        specificItems: value.specificItems.map((inner) =>
            WarrantyReviewSpecificItemToJSON(inner)
        ),
        reviewDate:
            value.reviewDate !== null ? value.reviewDate.toISOString() : null,
        yearOfWarrantyReview:
            value.yearOfWarrantyReview !== null
                ? value.yearOfWarrantyReview.toString()
                : null,
        reviewStarted: value.reviewStarted,
        cancelled: UserAndDateToJSON(value.cancelled),
        cancellationReason: value.cancellationReason,
        internalNotes: value.internalNotes.map((inner) =>
            WarrantyInternalNoteToJSON(inner)
        ),
        completionDate:
            value.completionDate !== null
                ? value.completionDate.toISOString()
                : null,
    };
}

export const WARRANTY_REVIEW_META: RecordMeta<
    WarrantyReview,
    WarrantyReviewJSON,
    WarrantyReviewBrokenJSON
> & { name: "WarrantyReview" } = {
    name: "WarrantyReview",
    type: "record",
    repair: repairWarrantyReviewJSON,
    toJSON: WarrantyReviewToJSON,
    fromJSON: JSONToWarrantyReview,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        project: { type: "uuid", linkTo: "Project" },
        personnel: { type: "array", items: PROJECT_PERSONNEL_META },
        dueDate: { type: "date" },
        remediationWorkDueDate: { type: "date" },
        ownersRepresentatives: { type: "array", items: CONTACT_DETAIL_META },
        contacts: { type: "array", items: CONTACT_DETAIL_META },
        scheduledDate: { type: "date" },
        generalInspection: {
            type: "array",
            items: WARRANTY_REVIEW_INSPECTION_ITEM_META,
        },
        specificItems: {
            type: "array",
            items: WARRANTY_REVIEW_SPECIFIC_ITEM_META,
        },
        reviewDate: { type: "datetime" },
        yearOfWarrantyReview: { type: "quantity?" },
        reviewStarted: { type: "boolean" },
        cancelled: USER_AND_DATE_META,
        cancellationReason: { type: "string" },
        internalNotes: { type: "array", items: WARRANTY_INTERNAL_NOTE_META },
        completionDate: { type: "datetime" },
    },
    userFacingKey: null,
    functions: {
        unacceptedUsers: {
            fn: calcWarrantyReviewUnacceptedUsers,
            parameterTypes: () => [WARRANTY_REVIEW_META],
            returnType: {
                type: "array",
                items: { type: "uuid", linkTo: "User" },
            },
        },
        active: {
            fn: calcWarrantyReviewActive,
            parameterTypes: () => [WARRANTY_REVIEW_META],
            returnType: { type: "boolean" },
        },
        hasProjectManager: {
            fn: calcWarrantyReviewHasProjectManager,
            parameterTypes: () => [WARRANTY_REVIEW_META],
            returnType: { type: "boolean" },
        },
        isComplete: {
            fn: calcWarrantyReviewIsComplete,
            parameterTypes: () => [WARRANTY_REVIEW_META],
            returnType: { type: "boolean" },
        },
        hasCoveredItems: {
            fn: calcWarrantyReviewHasCoveredItems,
            parameterTypes: () => [WARRANTY_REVIEW_META],
            returnType: { type: "boolean" },
        },
        stage: {
            fn: calcWarrantyReviewStage,
            parameterTypes: () => [WARRANTY_REVIEW_META],
            returnType: {
                type: "enum",
                values: [
                    "Current",
                    "Overdue",
                    "In Progress",
                    "Work Required",
                    "Completed",
                    "Upcoming",
                    "Cancelled",
                ],
            },
        },
        color: {
            fn: calcWarrantyReviewColor,
            parameterTypes: () => [WARRANTY_REVIEW_META],
            returnType: { type: "string" },
        },
        stageSort: {
            fn: calcWarrantyReviewStageSort,
            parameterTypes: () => [WARRANTY_REVIEW_META],
            returnType: { type: "string" },
        },
        personnelByRole: {
            fn: calcWarrantyReviewPersonnelByRole,
            parameterTypes: () => [
                WARRANTY_REVIEW_META,
                { type: "uuid", linkTo: "Role" },
            ],
            returnType: {
                type: "array",
                items: { type: "uuid", linkTo: "User" },
            },
        },
    },
    segments: {},
};

// END MAGIC -- DO NOT EDIT
