import { parseISO as dateParse } from "date-fns";
import { Decimal } from "decimal.js";
import { Money, Quantity } from "../../../clay/common";
import { Link } from "../../../clay/link";
import { LocalDate } from "../../../clay/LocalDate";
import { RecordMeta } from "../../../clay/meta";
import { daysAgo, isNull, sumMap } from "../../../clay/queryFuncs";
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
    ContingencyItem,
    ContingencyItemJSON,
    ContingencyItemToJSON,
    CONTINGENCY_ITEM_META,
    JSONToContingencyItem,
    repairContingencyItemJSON,
} from "../../contingency/table";
import {
    ApplicationType,
    ApplicationTypeOption,
} from "../../estimate/types/table";
import {
    JSONToNoteList,
    NoteList,
    NoteListJSON,
    NoteListToJSON,
    NOTE_LIST_META,
    repairNoteListJSON,
} from "../../quotation/notes/table";
import {
    JSONToSourceAreaAllowance,
    repairSourceAreaAllowanceJSON,
    SourceAreaAllowance,
    SourceAreaAllowanceJSON,
    SourceAreaAllowanceToJSON,
    SOURCE_AREA_ALLOWANCE_META,
} from "../../quotation/source-area";
import {
    JSONToRoleWithPercentage,
    Quotation,
    repairRoleWithPercentageJSON,
    RoleWithPercentage,
    RoleWithPercentageJSON,
    RoleWithPercentageToJSON,
    ROLE_WITH_PERCENTAGE_META,
} from "../../quotation/table";
import { User } from "../../user/table";
import {
    JSONToProjectDescriptionDetail,
    ProjectDescriptionDetail,
    ProjectDescriptionDetailJSON,
    ProjectDescriptionDetailToJSON,
    PROJECT_DESCRIPTION_DETAIL_META,
    repairProjectDescriptionDetailJSON,
} from "../projectDescriptionDetail/table";
import {
    JSONToProjectSchedule,
    ProjectSchedule,
    ProjectScheduleJSON,
    ProjectScheduleToJSON,
    PROJECT_SCHEDULE_META,
    repairProjectScheduleJSON,
} from "../schedule";
import { Project } from "../table";

//!Data
export type BudgetLine = {
    name: string;
    hours: Quantity;
    hourRate: Money;
    materials: Quantity;
    materialsRate: Money;
    originalMaterialsRate: Money | null;
};

export function calcBudgetLineTotal(line: BudgetLine): Money {
    return line.hours
        .times(line.hourRate)
        .plus(line.materials.times(line.materialsRate));
}

//!Data
export type DetailSheetFinishSchedule = {
    name: string;
    finishSchedule: string;
    applicationType: Link<ApplicationType>;
    application: Link<ApplicationTypeOption>;
    colour: string;
};

//!Data
export type DetailSheetOption = {
    id: UUID;
    name: string;
    description: string;
    finishSchedule: DetailSheetFinishSchedule[];
    allowances: SourceAreaAllowance[];
    budget: BudgetLine[];
};

export function calcDetailSheetOptionOverallTotal(
    option: DetailSheetOption
): Money {
    return sumMap(option.budget, (budget) => calcBudgetLineTotal(budget));
}

export function calcDetailSheetOptionHoursTotal(
    option: DetailSheetOption
): Quantity {
    return sumMap(option.budget, (line) => line.hours);
}

export function calcDetailSheetOptionMaterialsTotal(
    option: DetailSheetOption
): Quantity {
    return sumMap(option.budget, (line) => line.materials);
}

//!Data
export type DetailSheet = {
    id: UUID;
    recordVersion: Version;
    project: Link<Project>;
    firstDate: Date | null;
    date: Date | null;
    addedDateTime: Date | null;
    modifiedDateTime: Date | null;
    options: DetailSheetOption[];
    contacts: ContactDetail[];
    scopeOfWork: NoteList[];
    contractNotes: NoteList[];
    user: Link<User>;
    quotations: Link<Quotation>[];
    certifiedForeman: Link<User>;
    manager: Link<User>;
    managers: RoleWithPercentage[];
    change: boolean;
    number: Quantity;
    initialized: boolean;
    projectedStartDate: LocalDate | null;
    accessRequirements: string[];
    requiredEquipment: string[];

    schedules: ProjectSchedule[];
    contingencyItems: ContingencyItem[];
    schedulesDividedDescription: boolean;
    description: ProjectDescriptionDetail;
};

export function resolveDetailSheetSchedules(
    detailSheet: DetailSheet
): DetailSheet {
    if (detailSheet.schedulesDividedDescription) {
        return detailSheet;
    } else {
        return {
            ...detailSheet,
            schedules: detailSheet.schedules.map((projectSchedule) => ({
                ...projectSchedule,
                projectDescription: detailSheet.description,
            })),
            contingencyItems: detailSheet.contingencyItems.map(
                (contingencyItem) => ({
                    ...contingencyItem,
                    projectDescription: detailSheet.description,
                })
            ),
        };
    }
}

export function calcDetailSheetUngenerated(detailSheet: DetailSheet): boolean {
    return (
        isNull(detailSheet.date) && daysAgo(detailSheet.addedDateTime)!.gt(2)
    );
}

export function calcDetailSheetContractValue(detailSheet: DetailSheet): Money {
    return sumMap(
        detailSheet.schedules,
        (schedule) => schedule.certifiedForemanContractAmount
    );
}

// BEGIN MAGIC -- DO NOT EDIT
export type BudgetLineJSON = {
    name: string;
    hours: string;
    hourRate: string;
    materials: string;
    materialsRate: string;
    originalMaterialsRate: string | null;
};

export function JSONToBudgetLine(json: BudgetLineJSON): BudgetLine {
    return {
        name: json.name,
        hours: new Decimal(json.hours),
        hourRate: new Decimal(json.hourRate),
        materials: new Decimal(json.materials),
        materialsRate: new Decimal(json.materialsRate),
        originalMaterialsRate:
            json.originalMaterialsRate !== null
                ? new Decimal(json.originalMaterialsRate)
                : null,
    };
}
export type BudgetLineBrokenJSON = {
    name?: string;
    hours?: string;
    hourRate?: string;
    materials?: string;
    materialsRate?: string;
    originalMaterialsRate?: string | null;
};

export function newBudgetLine(): BudgetLine {
    return JSONToBudgetLine(repairBudgetLineJSON(undefined));
}
export function repairBudgetLineJSON(
    json: BudgetLineBrokenJSON | undefined
): BudgetLineJSON {
    if (json) {
        return {
            name: json.name || "",
            hours: json.hours || "0",
            hourRate: json.hourRate || "0",
            materials: json.materials || "0",
            materialsRate: json.materialsRate || "0",
            originalMaterialsRate: json.originalMaterialsRate || null,
        };
    } else {
        return {
            name: undefined || "",
            hours: undefined || "0",
            hourRate: undefined || "0",
            materials: undefined || "0",
            materialsRate: undefined || "0",
            originalMaterialsRate: undefined || null,
        };
    }
}

export function BudgetLineToJSON(value: BudgetLine): BudgetLineJSON {
    return {
        name: value.name,
        hours: value.hours.toString(),
        hourRate: value.hourRate.toString(),
        materials: value.materials.toString(),
        materialsRate: value.materialsRate.toString(),
        originalMaterialsRate:
            value.originalMaterialsRate !== null
                ? value.originalMaterialsRate.toString()
                : null,
    };
}

export const BUDGET_LINE_META: RecordMeta<
    BudgetLine,
    BudgetLineJSON,
    BudgetLineBrokenJSON
> & { name: "BudgetLine" } = {
    name: "BudgetLine",
    type: "record",
    repair: repairBudgetLineJSON,
    toJSON: BudgetLineToJSON,
    fromJSON: JSONToBudgetLine,
    fields: {
        name: { type: "string" },
        hours: { type: "quantity" },
        hourRate: { type: "money" },
        materials: { type: "quantity" },
        materialsRate: { type: "money" },
        originalMaterialsRate: { type: "money?" },
    },
    userFacingKey: "name",
    functions: {
        total: {
            fn: calcBudgetLineTotal,
            parameterTypes: () => [BUDGET_LINE_META],
            returnType: { type: "money" },
        },
    },
    segments: {},
};

export type DetailSheetFinishScheduleJSON = {
    name: string;
    finishSchedule: string;
    applicationType: string | null;
    application: string | null;
    colour: string;
};

export function JSONToDetailSheetFinishSchedule(
    json: DetailSheetFinishScheduleJSON
): DetailSheetFinishSchedule {
    return {
        name: json.name,
        finishSchedule: json.finishSchedule,
        applicationType: json.applicationType,
        application: json.application,
        colour: json.colour,
    };
}
export type DetailSheetFinishScheduleBrokenJSON = {
    name?: string;
    finishSchedule?: string;
    applicationType?: string | null;
    application?: string | null;
    colour?: string;
};

export function newDetailSheetFinishSchedule(): DetailSheetFinishSchedule {
    return JSONToDetailSheetFinishSchedule(
        repairDetailSheetFinishScheduleJSON(undefined)
    );
}
export function repairDetailSheetFinishScheduleJSON(
    json: DetailSheetFinishScheduleBrokenJSON | undefined
): DetailSheetFinishScheduleJSON {
    if (json) {
        return {
            name: json.name || "",
            finishSchedule: json.finishSchedule || "",
            applicationType: json.applicationType || null,
            application: json.application || null,
            colour: json.colour || "",
        };
    } else {
        return {
            name: undefined || "",
            finishSchedule: undefined || "",
            applicationType: undefined || null,
            application: undefined || null,
            colour: undefined || "",
        };
    }
}

export function DetailSheetFinishScheduleToJSON(
    value: DetailSheetFinishSchedule
): DetailSheetFinishScheduleJSON {
    return {
        name: value.name,
        finishSchedule: value.finishSchedule,
        applicationType: value.applicationType,
        application: value.application,
        colour: value.colour,
    };
}

export const DETAIL_SHEET_FINISH_SCHEDULE_META: RecordMeta<
    DetailSheetFinishSchedule,
    DetailSheetFinishScheduleJSON,
    DetailSheetFinishScheduleBrokenJSON
> & { name: "DetailSheetFinishSchedule" } = {
    name: "DetailSheetFinishSchedule",
    type: "record",
    repair: repairDetailSheetFinishScheduleJSON,
    toJSON: DetailSheetFinishScheduleToJSON,
    fromJSON: JSONToDetailSheetFinishSchedule,
    fields: {
        name: { type: "string" },
        finishSchedule: { type: "string" },
        applicationType: { type: "uuid", linkTo: "ApplicationType" },
        application: { type: "uuid", linkTo: "ApplicationTypeOption" },
        colour: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type DetailSheetOptionJSON = {
    id: string;
    name: string;
    description: string;
    finishSchedule: DetailSheetFinishScheduleJSON[];
    allowances: SourceAreaAllowanceJSON[];
    budget: BudgetLineJSON[];
};

export function JSONToDetailSheetOption(
    json: DetailSheetOptionJSON
): DetailSheetOption {
    return {
        id: { uuid: json.id },
        name: json.name,
        description: json.description,
        finishSchedule: json.finishSchedule.map((inner) =>
            JSONToDetailSheetFinishSchedule(inner)
        ),
        allowances: json.allowances.map((inner) =>
            JSONToSourceAreaAllowance(inner)
        ),
        budget: json.budget.map((inner) => JSONToBudgetLine(inner)),
    };
}
export type DetailSheetOptionBrokenJSON = {
    id?: string;
    name?: string;
    description?: string;
    finishSchedule?: DetailSheetFinishScheduleJSON[];
    allowances?: SourceAreaAllowanceJSON[];
    budget?: BudgetLineJSON[];
};

export function newDetailSheetOption(): DetailSheetOption {
    return JSONToDetailSheetOption(repairDetailSheetOptionJSON(undefined));
}
export function repairDetailSheetOptionJSON(
    json: DetailSheetOptionBrokenJSON | undefined
): DetailSheetOptionJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            description: json.description || "",
            finishSchedule: (json.finishSchedule || []).map((inner) =>
                repairDetailSheetFinishScheduleJSON(inner)
            ),
            allowances: (json.allowances || []).map((inner) =>
                repairSourceAreaAllowanceJSON(inner)
            ),
            budget: (json.budget || []).map((inner) =>
                repairBudgetLineJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            description: undefined || "",
            finishSchedule: (undefined || []).map((inner) =>
                repairDetailSheetFinishScheduleJSON(inner)
            ),
            allowances: (undefined || []).map((inner) =>
                repairSourceAreaAllowanceJSON(inner)
            ),
            budget: (undefined || []).map((inner) =>
                repairBudgetLineJSON(inner)
            ),
        };
    }
}

export function DetailSheetOptionToJSON(
    value: DetailSheetOption
): DetailSheetOptionJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        description: value.description,
        finishSchedule: value.finishSchedule.map((inner) =>
            DetailSheetFinishScheduleToJSON(inner)
        ),
        allowances: value.allowances.map((inner) =>
            SourceAreaAllowanceToJSON(inner)
        ),
        budget: value.budget.map((inner) => BudgetLineToJSON(inner)),
    };
}

export const DETAIL_SHEET_OPTION_META: RecordMeta<
    DetailSheetOption,
    DetailSheetOptionJSON,
    DetailSheetOptionBrokenJSON
> & { name: "DetailSheetOption" } = {
    name: "DetailSheetOption",
    type: "record",
    repair: repairDetailSheetOptionJSON,
    toJSON: DetailSheetOptionToJSON,
    fromJSON: JSONToDetailSheetOption,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        description: { type: "string" },
        finishSchedule: {
            type: "array",
            items: DETAIL_SHEET_FINISH_SCHEDULE_META,
        },
        allowances: { type: "array", items: SOURCE_AREA_ALLOWANCE_META },
        budget: { type: "array", items: BUDGET_LINE_META },
    },
    userFacingKey: "name",
    functions: {
        overallTotal: {
            fn: calcDetailSheetOptionOverallTotal,
            parameterTypes: () => [DETAIL_SHEET_OPTION_META],
            returnType: { type: "money" },
        },
        hoursTotal: {
            fn: calcDetailSheetOptionHoursTotal,
            parameterTypes: () => [DETAIL_SHEET_OPTION_META],
            returnType: { type: "quantity" },
        },
        materialsTotal: {
            fn: calcDetailSheetOptionMaterialsTotal,
            parameterTypes: () => [DETAIL_SHEET_OPTION_META],
            returnType: { type: "quantity" },
        },
    },
    segments: {},
};

export type DetailSheetJSON = {
    id: string;
    recordVersion: number | null;
    project: string | null;
    firstDate: string | null;
    date: string | null;
    addedDateTime: string | null;
    modifiedDateTime: string | null;
    options: DetailSheetOptionJSON[];
    contacts: ContactDetailJSON[];
    scopeOfWork: NoteListJSON[];
    contractNotes: NoteListJSON[];
    user: string | null;
    quotations: (string | null)[];
    certifiedForeman: string | null;
    manager: string | null;
    managers: RoleWithPercentageJSON[];
    change: boolean;
    number: string;
    initialized: boolean;
    projectedStartDate: string | null;
    accessRequirements: string[];
    requiredEquipment: string[];
    schedules: ProjectScheduleJSON[];
    contingencyItems: ContingencyItemJSON[];
    schedulesDividedDescription: boolean;
    description: ProjectDescriptionDetailJSON;
};

export function JSONToDetailSheet(json: DetailSheetJSON): DetailSheet {
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
        options: json.options.map((inner) => JSONToDetailSheetOption(inner)),
        contacts: json.contacts.map((inner) => JSONToContactDetail(inner)),
        scopeOfWork: json.scopeOfWork.map((inner) => JSONToNoteList(inner)),
        contractNotes: json.contractNotes.map((inner) => JSONToNoteList(inner)),
        user: json.user,
        quotations: json.quotations.map((inner) => inner),
        certifiedForeman: json.certifiedForeman,
        manager: json.manager,
        managers: json.managers.map((inner) => JSONToRoleWithPercentage(inner)),
        change: json.change,
        number: new Decimal(json.number),
        initialized: json.initialized,
        projectedStartDate:
            json.projectedStartDate !== null
                ? LocalDate.parse(json.projectedStartDate)
                : null,
        accessRequirements: json.accessRequirements.map((inner) => inner),
        requiredEquipment: json.requiredEquipment.map((inner) => inner),
        schedules: json.schedules.map((inner) => JSONToProjectSchedule(inner)),
        contingencyItems: json.contingencyItems.map((inner) =>
            JSONToContingencyItem(inner)
        ),
        schedulesDividedDescription: json.schedulesDividedDescription,
        description: JSONToProjectDescriptionDetail(json.description),
    };
}
export type DetailSheetBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    project?: string | null;
    firstDate?: string | null;
    date?: string | null;
    addedDateTime?: string | null;
    modifiedDateTime?: string | null;
    options?: DetailSheetOptionJSON[];
    contacts?: ContactDetailJSON[];
    scopeOfWork?: NoteListJSON[];
    contractNotes?: NoteListJSON[];
    user?: string | null;
    quotations?: (string | null)[];
    certifiedForeman?: string | null;
    manager?: string | null;
    managers?: RoleWithPercentageJSON[];
    change?: boolean;
    number?: string;
    initialized?: boolean;
    projectedStartDate?: string | null;
    accessRequirements?: string[];
    requiredEquipment?: string[];
    schedules?: ProjectScheduleJSON[];
    contingencyItems?: ContingencyItemJSON[];
    schedulesDividedDescription?: boolean;
    description?: ProjectDescriptionDetailJSON;
};

export function newDetailSheet(): DetailSheet {
    return JSONToDetailSheet(repairDetailSheetJSON(undefined));
}
export function repairDetailSheetJSON(
    json: DetailSheetBrokenJSON | undefined
): DetailSheetJSON {
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
            options: (json.options || []).map((inner) =>
                repairDetailSheetOptionJSON(inner)
            ),
            contacts: (json.contacts || []).map((inner) =>
                repairContactDetailJSON(inner)
            ),
            scopeOfWork: (json.scopeOfWork || []).map((inner) =>
                repairNoteListJSON(inner)
            ),
            contractNotes: (json.contractNotes || []).map((inner) =>
                repairNoteListJSON(inner)
            ),
            user: json.user || null,
            quotations: (json.quotations || []).map((inner) => inner || null),
            certifiedForeman: json.certifiedForeman || null,
            manager: json.manager || null,
            managers: (json.managers || []).map((inner) =>
                repairRoleWithPercentageJSON(inner)
            ),
            change: json.change || false,
            number: json.number || "0",
            initialized: json.initialized || false,
            projectedStartDate: json.projectedStartDate || null,
            accessRequirements: (json.accessRequirements || []).map(
                (inner) => inner || ""
            ),
            requiredEquipment: (json.requiredEquipment || []).map(
                (inner) => inner || ""
            ),
            schedules: (json.schedules || []).map((inner) =>
                repairProjectScheduleJSON(inner)
            ),
            contingencyItems: (json.contingencyItems || []).map((inner) =>
                repairContingencyItemJSON(inner)
            ),
            schedulesDividedDescription:
                json.schedulesDividedDescription || false,
            description: repairProjectDescriptionDetailJSON(json.description),
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
            options: (undefined || []).map((inner) =>
                repairDetailSheetOptionJSON(inner)
            ),
            contacts: (undefined || []).map((inner) =>
                repairContactDetailJSON(inner)
            ),
            scopeOfWork: (undefined || []).map((inner) =>
                repairNoteListJSON(inner)
            ),
            contractNotes: (undefined || []).map((inner) =>
                repairNoteListJSON(inner)
            ),
            user: undefined || null,
            quotations: (undefined || []).map((inner) => inner || null),
            certifiedForeman: undefined || null,
            manager: undefined || null,
            managers: (undefined || []).map((inner) =>
                repairRoleWithPercentageJSON(inner)
            ),
            change: undefined || false,
            number: undefined || "0",
            initialized: undefined || false,
            projectedStartDate: undefined || null,
            accessRequirements: (undefined || []).map((inner) => inner || ""),
            requiredEquipment: (undefined || []).map((inner) => inner || ""),
            schedules: (undefined || []).map((inner) =>
                repairProjectScheduleJSON(inner)
            ),
            contingencyItems: (undefined || []).map((inner) =>
                repairContingencyItemJSON(inner)
            ),
            schedulesDividedDescription: undefined || false,
            description: repairProjectDescriptionDetailJSON(undefined),
        };
    }
}

export function DetailSheetToJSON(value: DetailSheet): DetailSheetJSON {
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
        options: value.options.map((inner) => DetailSheetOptionToJSON(inner)),
        contacts: value.contacts.map((inner) => ContactDetailToJSON(inner)),
        scopeOfWork: value.scopeOfWork.map((inner) => NoteListToJSON(inner)),
        contractNotes: value.contractNotes.map((inner) =>
            NoteListToJSON(inner)
        ),
        user: value.user,
        quotations: value.quotations.map((inner) => inner),
        certifiedForeman: value.certifiedForeman,
        manager: value.manager,
        managers: value.managers.map((inner) =>
            RoleWithPercentageToJSON(inner)
        ),
        change: value.change,
        number: value.number.toString(),
        initialized: value.initialized,
        projectedStartDate:
            value.projectedStartDate !== null
                ? value.projectedStartDate.toString()
                : null,
        accessRequirements: value.accessRequirements.map((inner) => inner),
        requiredEquipment: value.requiredEquipment.map((inner) => inner),
        schedules: value.schedules.map((inner) => ProjectScheduleToJSON(inner)),
        contingencyItems: value.contingencyItems.map((inner) =>
            ContingencyItemToJSON(inner)
        ),
        schedulesDividedDescription: value.schedulesDividedDescription,
        description: ProjectDescriptionDetailToJSON(value.description),
    };
}

export const DETAIL_SHEET_META: RecordMeta<
    DetailSheet,
    DetailSheetJSON,
    DetailSheetBrokenJSON
> & { name: "DetailSheet" } = {
    name: "DetailSheet",
    type: "record",
    repair: repairDetailSheetJSON,
    toJSON: DetailSheetToJSON,
    fromJSON: JSONToDetailSheet,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        project: { type: "uuid", linkTo: "Project" },
        firstDate: { type: "datetime" },
        date: { type: "datetime" },
        addedDateTime: { type: "datetime" },
        modifiedDateTime: { type: "datetime" },
        options: { type: "array", items: DETAIL_SHEET_OPTION_META },
        contacts: { type: "array", items: CONTACT_DETAIL_META },
        scopeOfWork: { type: "array", items: NOTE_LIST_META },
        contractNotes: { type: "array", items: NOTE_LIST_META },
        user: { type: "uuid", linkTo: "User" },
        quotations: {
            type: "array",
            items: { type: "uuid", linkTo: "Quotation" },
        },
        certifiedForeman: { type: "uuid", linkTo: "User" },
        manager: { type: "uuid", linkTo: "User" },
        managers: { type: "array", items: ROLE_WITH_PERCENTAGE_META },
        change: { type: "boolean" },
        number: { type: "quantity" },
        initialized: { type: "boolean" },
        projectedStartDate: { type: "date" },
        accessRequirements: { type: "array", items: { type: "string" } },
        requiredEquipment: { type: "array", items: { type: "string" } },
        schedules: { type: "array", items: PROJECT_SCHEDULE_META },
        contingencyItems: { type: "array", items: CONTINGENCY_ITEM_META },
        schedulesDividedDescription: { type: "boolean" },
        description: PROJECT_DESCRIPTION_DETAIL_META,
    },
    userFacingKey: "number",
    functions: {
        ungenerated: {
            fn: calcDetailSheetUngenerated,
            parameterTypes: () => [DETAIL_SHEET_META],
            returnType: { type: "boolean" },
        },
        contractValue: {
            fn: calcDetailSheetContractValue,
            parameterTypes: () => [DETAIL_SHEET_META],
            returnType: { type: "money" },
        },
    },
    segments: {},
};

// END MAGIC -- DO NOT EDIT
