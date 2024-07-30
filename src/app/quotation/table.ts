import { parseISO as dateParse } from "date-fns";
import { Decimal } from "decimal.js";
import { Money, Percentage, Quantity } from "../../clay/common";
import { Link } from "../../clay/link";
import { LocalDate } from "../../clay/LocalDate";
import { RecordMeta } from "../../clay/meta";
import { daysAgo, resolve, sumMap } from "../../clay/queryFuncs";
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
import { Area } from "../estimate/area/table";
import { Estimate } from "../estimate/table";
import { TimeAndMaterialsEstimate } from "../estimate/time-and-materials/table";
import {
    JSONToProjectDescriptionDetail,
    ProjectDescriptionDetail,
    ProjectDescriptionDetailJSON,
    ProjectDescriptionDetailToJSON,
    PROJECT_DESCRIPTION_DETAIL_META,
    repairProjectDescriptionDetailJSON,
} from "../project/projectDescriptionDetail/table";
import { Project } from "../project/table";
import { User } from "../user/table";
import {
    JSONToNoteList,
    NoteList,
    NoteListJSON,
    NoteListToJSON,
    NOTE_LIST_META,
    repairNoteListJSON,
} from "./notes/table";
import {
    JSONToOptionFinishSchedule,
    JSONToSourceAreaAction,
    JSONToSourceAreaAllowance,
    JSONToSourceAreaContingency,
    JSONToSourceAreaKey,
    OptionFinishSchedule,
    OptionFinishScheduleJSON,
    OptionFinishScheduleToJSON,
    OPTION_FINISH_SCHEDULE_META,
    repairOptionFinishScheduleJSON,
    repairSourceAreaActionJSON,
    repairSourceAreaAllowanceJSON,
    repairSourceAreaContingencyJSON,
    repairSourceAreaKeyJSON,
    SourceAreaAction,
    SourceAreaActionJSON,
    SourceAreaActionToJSON,
    SourceAreaAllowance,
    SourceAreaAllowanceJSON,
    SourceAreaAllowanceToJSON,
    SourceAreaContingency,
    SourceAreaContingencyJSON,
    SourceAreaContingencyToJSON,
    SourceAreaKey,
    SourceAreaKeyJSON,
    SourceAreaKeyToJSON,
    SOURCE_AREA_ACTION_META,
    SOURCE_AREA_ALLOWANCE_META,
    SOURCE_AREA_CONTINGENCY_META,
    SOURCE_AREA_KEY_META,
} from "./source-area";
import { QuotationType } from "./type/table";

//!Data
export type QuotationCopyRequest = {
    id: UUID;
    addedDateTime: Date | null;
    recordVersion: Version;
    quotation: Link<Quotation>;
    target: Link<Project>;
    user: Link<User>;
    approved: boolean;
};

export function calcQuotationCopyRequestIsUnapproved(
    request: QuotationCopyRequest
): boolean {
    return !request.approved;
}

export function calcQuotationCopyRequestApprovedUsers(
    request: QuotationCopyRequest
): Link<User>[] {
    return [request.user].filter((entry) => request.approved);
}

//!Data
export type ScheduleActionDetail = {
    item: Link<SourceAreaAction>;
    portion: Percentage;
};

//!Data
export type ScheduleAllowanceDetail = {
    item: Link<SourceAreaAllowance>;
    portion: Percentage;
};

//!Data
export type ScheduleContingencyDetail = {
    item: Link<SourceAreaContingency>;
    portion: Percentage;
};

export type SchedulePartKeys = "allowances" | "actions" | "contingencies";

//!Data
export type Schedule = {
    name: string;

    actions: ScheduleActionDetail[];
    allowances: ScheduleAllowanceDetail[];
    contingencies: ScheduleContingencyDetail[];

    oldActions: Link<SourceAreaAction>[];
    oldAllowances: Link<SourceAreaAllowance>[];
    oldContingencies: Link<SourceAreaContingency>[];

    projectDescription: ProjectDescriptionDetail;
};

export function doesScheduleHave(
    schedule: Schedule,
    key: SchedulePartKeys,
    action: Link<SourceAreaAction>
) {
    for (const x of schedule[key]) {
        if (x.item === action && !x.portion.isZero()) {
            return true;
        }
    }
    return false;
}

export function schedulePortion(
    schedule: Schedule,
    key: SchedulePartKeys,
    action: Link<SourceAreaAction>
) {
    for (const x of schedule[key]) {
        if (x.item === action) {
            return x.portion;
        }
    }
    return new Decimal(0);
}

export function doesScheduleHaveAction(
    schedule: Schedule,
    action: Link<SourceAreaAction>
) {
    return doesScheduleHave(schedule, "actions", action);
}

export function doesScheduleHaveAllowance(
    schedule: Schedule,
    allowance: Link<SourceAreaAllowance>
) {
    return doesScheduleHave(schedule, "allowances", allowance);
}

export function doesScheduleHaveContingency(
    schedule: Schedule,
    contingency: Link<SourceAreaContingency>
) {
    return doesScheduleHave(schedule, "contingencies", contingency);
}

//!Data
export type ScheduleDetails = {
    name: string;
    total: Money;
};

//!Data
export type QuotationOptionDetails = {
    areas: SourceAreaKey[];
    actions: SourceAreaAction[];
    contingencies: SourceAreaContingency[];
    allowances: SourceAreaAllowance[];
    finishSchedule: OptionFinishSchedule[];
    schedules: ScheduleDetails[];
    total: Money;
    actionPriceTotal: Money;
    allowancePriceTotal: Money;
    contingencyPriceTotal: Money;
};

//!Data
export type RoleWithPercentage = {
    user: Link<User>;
    percentage: Percentage;
};

//!Data
export type QuotationOption = {
    id: UUID;
    name: string;
    description: string;

    areas: Link<Area>[];
    actions: Link<SourceAreaAction>[];
    hiddenActions: Link<SourceAreaAction>[];
    allowances: Link<SourceAreaAllowance>[];
    contingencies: Link<SourceAreaContingency>[];
    schedules: Schedule[];
    adjustment: Money;
    includedInExpectedContractValue: boolean;
    projectDescription: ProjectDescriptionDetail;

    details: QuotationOptionDetails;
};

//!Data
export type Quotation = {
    id: UUID;
    recordVersion: Version;
    addedDateTime: Date | null;
    modifiedDateTime: Date | null;
    modifiedBy: Link<User>;
    user: Link<User>;
    project: Link<Project>;
    estimates: Link<Estimate | TimeAndMaterialsEstimate>[];
    initializedEstimates: Link<Estimate | TimeAndMaterialsEstimate>[];
    scopeOfWork: NoteList[];
    contractNotes: NoteList[];
    projectSpotlightItems: NoteList[];

    options: QuotationOption[];
    quotationType: Link<QuotationType>;
    addressedContacts: ContactDetail[];
    firstDate: Date | null;
    date: Date | null;
    quoteFollowUpDate: LocalDate | null;
    number: Quantity;
    generated: boolean;
    projectDescription: ProjectDescriptionDetail;
    dividedProjectDescription: boolean;
    change: boolean;
    initialized: boolean;
    superceded: boolean;
    quotedBy: Link<User>[];

    specificationDetails: string;
    numberOfAddendums: Quantity;

    ignoringUnusedItemsBecause: string;
    tags: string[];

    estimators: RoleWithPercentage[];
};

export function calcQuotationUngenerated(quotation: Quotation): boolean {
    return !quotation.generated && daysAgo(quotation.addedDateTime)!.gt(2);
}

export function calcQuotationIsLastQuotation(quotation: Quotation): boolean {
    return resolve("project.lastQuotation") === quotation.id;
}

export function quotationSeason(date: Date | null) {
    if (!date) {
        return null;
    } else if (date.getMonth() >= 11) {
        return date.getFullYear() + 1;
    } else {
        return date.getFullYear();
    }
}

export function calcQuotationExpectedContractValue(
    quotation: Quotation
): Money {
    return sumMap(quotation.options, (option) =>
        option.includedInExpectedContractValue
            ? option.details.total
            : new Decimal(0)
    );
}

// BEGIN MAGIC -- DO NOT EDIT
export type QuotationCopyRequestJSON = {
    id: string;
    addedDateTime: string | null;
    recordVersion: number | null;
    quotation: string | null;
    target: string | null;
    user: string | null;
    approved: boolean;
};

export function JSONToQuotationCopyRequest(
    json: QuotationCopyRequestJSON
): QuotationCopyRequest {
    return {
        id: { uuid: json.id },
        addedDateTime:
            json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
        recordVersion: { version: json.recordVersion },
        quotation: json.quotation,
        target: json.target,
        user: json.user,
        approved: json.approved,
    };
}
export type QuotationCopyRequestBrokenJSON = {
    id?: string;
    addedDateTime?: string | null;
    recordVersion?: number | null;
    quotation?: string | null;
    target?: string | null;
    user?: string | null;
    approved?: boolean;
};

export function newQuotationCopyRequest(): QuotationCopyRequest {
    return JSONToQuotationCopyRequest(
        repairQuotationCopyRequestJSON(undefined)
    );
}
export function repairQuotationCopyRequestJSON(
    json: QuotationCopyRequestBrokenJSON | undefined
): QuotationCopyRequestJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            addedDateTime: json.addedDateTime
                ? new Date(json.addedDateTime!).toISOString()
                : null,
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            quotation: json.quotation || null,
            target: json.target || null,
            user: json.user || null,
            approved: json.approved || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            addedDateTime: undefined
                ? new Date(undefined!).toISOString()
                : null,
            recordVersion: null,
            quotation: undefined || null,
            target: undefined || null,
            user: undefined || null,
            approved: undefined || false,
        };
    }
}

export function QuotationCopyRequestToJSON(
    value: QuotationCopyRequest
): QuotationCopyRequestJSON {
    return {
        id: value.id.uuid,
        addedDateTime:
            value.addedDateTime !== null
                ? value.addedDateTime.toISOString()
                : null,
        recordVersion: value.recordVersion.version,
        quotation: value.quotation,
        target: value.target,
        user: value.user,
        approved: value.approved,
    };
}

export const QUOTATION_COPY_REQUEST_META: RecordMeta<
    QuotationCopyRequest,
    QuotationCopyRequestJSON,
    QuotationCopyRequestBrokenJSON
> & { name: "QuotationCopyRequest" } = {
    name: "QuotationCopyRequest",
    type: "record",
    repair: repairQuotationCopyRequestJSON,
    toJSON: QuotationCopyRequestToJSON,
    fromJSON: JSONToQuotationCopyRequest,
    fields: {
        id: { type: "uuid" },
        addedDateTime: { type: "datetime" },
        recordVersion: { type: "version" },
        quotation: { type: "uuid", linkTo: "Quotation" },
        target: { type: "uuid", linkTo: "Project" },
        user: { type: "uuid", linkTo: "User" },
        approved: { type: "boolean" },
    },
    userFacingKey: null,
    functions: {
        isUnapproved: {
            fn: calcQuotationCopyRequestIsUnapproved,
            parameterTypes: () => [QUOTATION_COPY_REQUEST_META],
            returnType: { type: "boolean" },
        },
        approvedUsers: {
            fn: calcQuotationCopyRequestApprovedUsers,
            parameterTypes: () => [QUOTATION_COPY_REQUEST_META],
            returnType: {
                type: "array",
                items: { type: "uuid", linkTo: "User" },
            },
        },
    },
    segments: {},
};

export type ScheduleActionDetailJSON = {
    item: string | null;
    portion: string;
};

export function JSONToScheduleActionDetail(
    json: ScheduleActionDetailJSON
): ScheduleActionDetail {
    return {
        item: json.item,
        portion: new Decimal(json.portion),
    };
}
export type ScheduleActionDetailBrokenJSON = {
    item?: string | null;
    portion?: string;
};

export function newScheduleActionDetail(): ScheduleActionDetail {
    return JSONToScheduleActionDetail(
        repairScheduleActionDetailJSON(undefined)
    );
}
export function repairScheduleActionDetailJSON(
    json: ScheduleActionDetailBrokenJSON | undefined
): ScheduleActionDetailJSON {
    if (json) {
        return {
            item: json.item || null,
            portion: json.portion || "0",
        };
    } else {
        return {
            item: undefined || null,
            portion: undefined || "0",
        };
    }
}

export function ScheduleActionDetailToJSON(
    value: ScheduleActionDetail
): ScheduleActionDetailJSON {
    return {
        item: value.item,
        portion: value.portion.toString(),
    };
}

export const SCHEDULE_ACTION_DETAIL_META: RecordMeta<
    ScheduleActionDetail,
    ScheduleActionDetailJSON,
    ScheduleActionDetailBrokenJSON
> & { name: "ScheduleActionDetail" } = {
    name: "ScheduleActionDetail",
    type: "record",
    repair: repairScheduleActionDetailJSON,
    toJSON: ScheduleActionDetailToJSON,
    fromJSON: JSONToScheduleActionDetail,
    fields: {
        item: { type: "uuid", linkTo: "SourceAreaAction" },
        portion: { type: "percentage" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type ScheduleAllowanceDetailJSON = {
    item: string | null;
    portion: string;
};

export function JSONToScheduleAllowanceDetail(
    json: ScheduleAllowanceDetailJSON
): ScheduleAllowanceDetail {
    return {
        item: json.item,
        portion: new Decimal(json.portion),
    };
}
export type ScheduleAllowanceDetailBrokenJSON = {
    item?: string | null;
    portion?: string;
};

export function newScheduleAllowanceDetail(): ScheduleAllowanceDetail {
    return JSONToScheduleAllowanceDetail(
        repairScheduleAllowanceDetailJSON(undefined)
    );
}
export function repairScheduleAllowanceDetailJSON(
    json: ScheduleAllowanceDetailBrokenJSON | undefined
): ScheduleAllowanceDetailJSON {
    if (json) {
        return {
            item: json.item || null,
            portion: json.portion || "0",
        };
    } else {
        return {
            item: undefined || null,
            portion: undefined || "0",
        };
    }
}

export function ScheduleAllowanceDetailToJSON(
    value: ScheduleAllowanceDetail
): ScheduleAllowanceDetailJSON {
    return {
        item: value.item,
        portion: value.portion.toString(),
    };
}

export const SCHEDULE_ALLOWANCE_DETAIL_META: RecordMeta<
    ScheduleAllowanceDetail,
    ScheduleAllowanceDetailJSON,
    ScheduleAllowanceDetailBrokenJSON
> & { name: "ScheduleAllowanceDetail" } = {
    name: "ScheduleAllowanceDetail",
    type: "record",
    repair: repairScheduleAllowanceDetailJSON,
    toJSON: ScheduleAllowanceDetailToJSON,
    fromJSON: JSONToScheduleAllowanceDetail,
    fields: {
        item: { type: "uuid", linkTo: "SourceAreaAllowance" },
        portion: { type: "percentage" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type ScheduleContingencyDetailJSON = {
    item: string | null;
    portion: string;
};

export function JSONToScheduleContingencyDetail(
    json: ScheduleContingencyDetailJSON
): ScheduleContingencyDetail {
    return {
        item: json.item,
        portion: new Decimal(json.portion),
    };
}
export type ScheduleContingencyDetailBrokenJSON = {
    item?: string | null;
    portion?: string;
};

export function newScheduleContingencyDetail(): ScheduleContingencyDetail {
    return JSONToScheduleContingencyDetail(
        repairScheduleContingencyDetailJSON(undefined)
    );
}
export function repairScheduleContingencyDetailJSON(
    json: ScheduleContingencyDetailBrokenJSON | undefined
): ScheduleContingencyDetailJSON {
    if (json) {
        return {
            item: json.item || null,
            portion: json.portion || "0",
        };
    } else {
        return {
            item: undefined || null,
            portion: undefined || "0",
        };
    }
}

export function ScheduleContingencyDetailToJSON(
    value: ScheduleContingencyDetail
): ScheduleContingencyDetailJSON {
    return {
        item: value.item,
        portion: value.portion.toString(),
    };
}

export const SCHEDULE_CONTINGENCY_DETAIL_META: RecordMeta<
    ScheduleContingencyDetail,
    ScheduleContingencyDetailJSON,
    ScheduleContingencyDetailBrokenJSON
> & { name: "ScheduleContingencyDetail" } = {
    name: "ScheduleContingencyDetail",
    type: "record",
    repair: repairScheduleContingencyDetailJSON,
    toJSON: ScheduleContingencyDetailToJSON,
    fromJSON: JSONToScheduleContingencyDetail,
    fields: {
        item: { type: "uuid", linkTo: "SourceAreaContingency" },
        portion: { type: "percentage" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type ScheduleJSON = {
    name: string;
    actions: ScheduleActionDetailJSON[];
    allowances: ScheduleAllowanceDetailJSON[];
    contingencies: ScheduleContingencyDetailJSON[];
    oldActions: (string | null)[];
    oldAllowances: (string | null)[];
    oldContingencies: (string | null)[];
    projectDescription: ProjectDescriptionDetailJSON;
};

export function JSONToSchedule(json: ScheduleJSON): Schedule {
    return {
        name: json.name,
        actions: json.actions.map((inner) => JSONToScheduleActionDetail(inner)),
        allowances: json.allowances.map((inner) =>
            JSONToScheduleAllowanceDetail(inner)
        ),
        contingencies: json.contingencies.map((inner) =>
            JSONToScheduleContingencyDetail(inner)
        ),
        oldActions: json.oldActions.map((inner) => inner),
        oldAllowances: json.oldAllowances.map((inner) => inner),
        oldContingencies: json.oldContingencies.map((inner) => inner),
        projectDescription: JSONToProjectDescriptionDetail(
            json.projectDescription
        ),
    };
}
export type ScheduleBrokenJSON = {
    name?: string;
    actions?: ScheduleActionDetailJSON[];
    allowances?: ScheduleAllowanceDetailJSON[];
    contingencies?: ScheduleContingencyDetailJSON[];
    oldActions?: (string | null)[];
    oldAllowances?: (string | null)[];
    oldContingencies?: (string | null)[];
    projectDescription?: ProjectDescriptionDetailJSON;
};

export function newSchedule(): Schedule {
    return JSONToSchedule(repairScheduleJSON(undefined));
}
export function repairScheduleJSON(
    json: ScheduleBrokenJSON | undefined
): ScheduleJSON {
    if (json) {
        return {
            name: json.name || "",
            actions: (json.actions || []).map((inner) =>
                repairScheduleActionDetailJSON(inner)
            ),
            allowances: (json.allowances || []).map((inner) =>
                repairScheduleAllowanceDetailJSON(inner)
            ),
            contingencies: (json.contingencies || []).map((inner) =>
                repairScheduleContingencyDetailJSON(inner)
            ),
            oldActions: (json.oldActions || []).map((inner) => inner || null),
            oldAllowances: (json.oldAllowances || []).map(
                (inner) => inner || null
            ),
            oldContingencies: (json.oldContingencies || []).map(
                (inner) => inner || null
            ),
            projectDescription: repairProjectDescriptionDetailJSON(
                json.projectDescription
            ),
        };
    } else {
        return {
            name: undefined || "",
            actions: (undefined || []).map((inner) =>
                repairScheduleActionDetailJSON(inner)
            ),
            allowances: (undefined || []).map((inner) =>
                repairScheduleAllowanceDetailJSON(inner)
            ),
            contingencies: (undefined || []).map((inner) =>
                repairScheduleContingencyDetailJSON(inner)
            ),
            oldActions: (undefined || []).map((inner) => inner || null),
            oldAllowances: (undefined || []).map((inner) => inner || null),
            oldContingencies: (undefined || []).map((inner) => inner || null),
            projectDescription: repairProjectDescriptionDetailJSON(undefined),
        };
    }
}

export function ScheduleToJSON(value: Schedule): ScheduleJSON {
    return {
        name: value.name,
        actions: value.actions.map((inner) =>
            ScheduleActionDetailToJSON(inner)
        ),
        allowances: value.allowances.map((inner) =>
            ScheduleAllowanceDetailToJSON(inner)
        ),
        contingencies: value.contingencies.map((inner) =>
            ScheduleContingencyDetailToJSON(inner)
        ),
        oldActions: value.oldActions.map((inner) => inner),
        oldAllowances: value.oldAllowances.map((inner) => inner),
        oldContingencies: value.oldContingencies.map((inner) => inner),
        projectDescription: ProjectDescriptionDetailToJSON(
            value.projectDescription
        ),
    };
}

export const SCHEDULE_META: RecordMeta<
    Schedule,
    ScheduleJSON,
    ScheduleBrokenJSON
> & { name: "Schedule" } = {
    name: "Schedule",
    type: "record",
    repair: repairScheduleJSON,
    toJSON: ScheduleToJSON,
    fromJSON: JSONToSchedule,
    fields: {
        name: { type: "string" },
        actions: { type: "array", items: SCHEDULE_ACTION_DETAIL_META },
        allowances: { type: "array", items: SCHEDULE_ALLOWANCE_DETAIL_META },
        contingencies: {
            type: "array",
            items: SCHEDULE_CONTINGENCY_DETAIL_META,
        },
        oldActions: {
            type: "array",
            items: { type: "uuid", linkTo: "SourceAreaAction" },
        },
        oldAllowances: {
            type: "array",
            items: { type: "uuid", linkTo: "SourceAreaAllowance" },
        },
        oldContingencies: {
            type: "array",
            items: { type: "uuid", linkTo: "SourceAreaContingency" },
        },
        projectDescription: PROJECT_DESCRIPTION_DETAIL_META,
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type ScheduleDetailsJSON = {
    name: string;
    total: string;
};

export function JSONToScheduleDetails(
    json: ScheduleDetailsJSON
): ScheduleDetails {
    return {
        name: json.name,
        total: new Decimal(json.total),
    };
}
export type ScheduleDetailsBrokenJSON = {
    name?: string;
    total?: string;
};

export function newScheduleDetails(): ScheduleDetails {
    return JSONToScheduleDetails(repairScheduleDetailsJSON(undefined));
}
export function repairScheduleDetailsJSON(
    json: ScheduleDetailsBrokenJSON | undefined
): ScheduleDetailsJSON {
    if (json) {
        return {
            name: json.name || "",
            total: json.total || "0",
        };
    } else {
        return {
            name: undefined || "",
            total: undefined || "0",
        };
    }
}

export function ScheduleDetailsToJSON(
    value: ScheduleDetails
): ScheduleDetailsJSON {
    return {
        name: value.name,
        total: value.total.toString(),
    };
}

export const SCHEDULE_DETAILS_META: RecordMeta<
    ScheduleDetails,
    ScheduleDetailsJSON,
    ScheduleDetailsBrokenJSON
> & { name: "ScheduleDetails" } = {
    name: "ScheduleDetails",
    type: "record",
    repair: repairScheduleDetailsJSON,
    toJSON: ScheduleDetailsToJSON,
    fromJSON: JSONToScheduleDetails,
    fields: {
        name: { type: "string" },
        total: { type: "money" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type QuotationOptionDetailsJSON = {
    areas: SourceAreaKeyJSON[];
    actions: SourceAreaActionJSON[];
    contingencies: SourceAreaContingencyJSON[];
    allowances: SourceAreaAllowanceJSON[];
    finishSchedule: OptionFinishScheduleJSON[];
    schedules: ScheduleDetailsJSON[];
    total: string;
    actionPriceTotal: string;
    allowancePriceTotal: string;
    contingencyPriceTotal: string;
};

export function JSONToQuotationOptionDetails(
    json: QuotationOptionDetailsJSON
): QuotationOptionDetails {
    return {
        areas: json.areas.map((inner) => JSONToSourceAreaKey(inner)),
        actions: json.actions.map((inner) => JSONToSourceAreaAction(inner)),
        contingencies: json.contingencies.map((inner) =>
            JSONToSourceAreaContingency(inner)
        ),
        allowances: json.allowances.map((inner) =>
            JSONToSourceAreaAllowance(inner)
        ),
        finishSchedule: json.finishSchedule.map((inner) =>
            JSONToOptionFinishSchedule(inner)
        ),
        schedules: json.schedules.map((inner) => JSONToScheduleDetails(inner)),
        total: new Decimal(json.total),
        actionPriceTotal: new Decimal(json.actionPriceTotal),
        allowancePriceTotal: new Decimal(json.allowancePriceTotal),
        contingencyPriceTotal: new Decimal(json.contingencyPriceTotal),
    };
}
export type QuotationOptionDetailsBrokenJSON = {
    areas?: SourceAreaKeyJSON[];
    actions?: SourceAreaActionJSON[];
    contingencies?: SourceAreaContingencyJSON[];
    allowances?: SourceAreaAllowanceJSON[];
    finishSchedule?: OptionFinishScheduleJSON[];
    schedules?: ScheduleDetailsJSON[];
    total?: string;
    actionPriceTotal?: string;
    allowancePriceTotal?: string;
    contingencyPriceTotal?: string;
};

export function newQuotationOptionDetails(): QuotationOptionDetails {
    return JSONToQuotationOptionDetails(
        repairQuotationOptionDetailsJSON(undefined)
    );
}
export function repairQuotationOptionDetailsJSON(
    json: QuotationOptionDetailsBrokenJSON | undefined
): QuotationOptionDetailsJSON {
    if (json) {
        return {
            areas: (json.areas || []).map((inner) =>
                repairSourceAreaKeyJSON(inner)
            ),
            actions: (json.actions || []).map((inner) =>
                repairSourceAreaActionJSON(inner)
            ),
            contingencies: (json.contingencies || []).map((inner) =>
                repairSourceAreaContingencyJSON(inner)
            ),
            allowances: (json.allowances || []).map((inner) =>
                repairSourceAreaAllowanceJSON(inner)
            ),
            finishSchedule: (json.finishSchedule || []).map((inner) =>
                repairOptionFinishScheduleJSON(inner)
            ),
            schedules: (json.schedules || []).map((inner) =>
                repairScheduleDetailsJSON(inner)
            ),
            total: json.total || "0",
            actionPriceTotal: json.actionPriceTotal || "0",
            allowancePriceTotal: json.allowancePriceTotal || "0",
            contingencyPriceTotal: json.contingencyPriceTotal || "0",
        };
    } else {
        return {
            areas: (undefined || []).map((inner) =>
                repairSourceAreaKeyJSON(inner)
            ),
            actions: (undefined || []).map((inner) =>
                repairSourceAreaActionJSON(inner)
            ),
            contingencies: (undefined || []).map((inner) =>
                repairSourceAreaContingencyJSON(inner)
            ),
            allowances: (undefined || []).map((inner) =>
                repairSourceAreaAllowanceJSON(inner)
            ),
            finishSchedule: (undefined || []).map((inner) =>
                repairOptionFinishScheduleJSON(inner)
            ),
            schedules: (undefined || []).map((inner) =>
                repairScheduleDetailsJSON(inner)
            ),
            total: undefined || "0",
            actionPriceTotal: undefined || "0",
            allowancePriceTotal: undefined || "0",
            contingencyPriceTotal: undefined || "0",
        };
    }
}

export function QuotationOptionDetailsToJSON(
    value: QuotationOptionDetails
): QuotationOptionDetailsJSON {
    return {
        areas: value.areas.map((inner) => SourceAreaKeyToJSON(inner)),
        actions: value.actions.map((inner) => SourceAreaActionToJSON(inner)),
        contingencies: value.contingencies.map((inner) =>
            SourceAreaContingencyToJSON(inner)
        ),
        allowances: value.allowances.map((inner) =>
            SourceAreaAllowanceToJSON(inner)
        ),
        finishSchedule: value.finishSchedule.map((inner) =>
            OptionFinishScheduleToJSON(inner)
        ),
        schedules: value.schedules.map((inner) => ScheduleDetailsToJSON(inner)),
        total: value.total.toString(),
        actionPriceTotal: value.actionPriceTotal.toString(),
        allowancePriceTotal: value.allowancePriceTotal.toString(),
        contingencyPriceTotal: value.contingencyPriceTotal.toString(),
    };
}

export const QUOTATION_OPTION_DETAILS_META: RecordMeta<
    QuotationOptionDetails,
    QuotationOptionDetailsJSON,
    QuotationOptionDetailsBrokenJSON
> & { name: "QuotationOptionDetails" } = {
    name: "QuotationOptionDetails",
    type: "record",
    repair: repairQuotationOptionDetailsJSON,
    toJSON: QuotationOptionDetailsToJSON,
    fromJSON: JSONToQuotationOptionDetails,
    fields: {
        areas: { type: "array", items: SOURCE_AREA_KEY_META },
        actions: { type: "array", items: SOURCE_AREA_ACTION_META },
        contingencies: { type: "array", items: SOURCE_AREA_CONTINGENCY_META },
        allowances: { type: "array", items: SOURCE_AREA_ALLOWANCE_META },
        finishSchedule: { type: "array", items: OPTION_FINISH_SCHEDULE_META },
        schedules: { type: "array", items: SCHEDULE_DETAILS_META },
        total: { type: "money" },
        actionPriceTotal: { type: "money" },
        allowancePriceTotal: { type: "money" },
        contingencyPriceTotal: { type: "money" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type RoleWithPercentageJSON = {
    user: string | null;
    percentage: string;
};

export function JSONToRoleWithPercentage(
    json: RoleWithPercentageJSON
): RoleWithPercentage {
    return {
        user: json.user,
        percentage: new Decimal(json.percentage),
    };
}
export type RoleWithPercentageBrokenJSON = {
    user?: string | null;
    percentage?: string;
};

export function newRoleWithPercentage(): RoleWithPercentage {
    return JSONToRoleWithPercentage(repairRoleWithPercentageJSON(undefined));
}
export function repairRoleWithPercentageJSON(
    json: RoleWithPercentageBrokenJSON | undefined
): RoleWithPercentageJSON {
    if (json) {
        return {
            user: json.user || null,
            percentage: json.percentage || "0",
        };
    } else {
        return {
            user: undefined || null,
            percentage: undefined || "0",
        };
    }
}

export function RoleWithPercentageToJSON(
    value: RoleWithPercentage
): RoleWithPercentageJSON {
    return {
        user: value.user,
        percentage: value.percentage.toString(),
    };
}

export const ROLE_WITH_PERCENTAGE_META: RecordMeta<
    RoleWithPercentage,
    RoleWithPercentageJSON,
    RoleWithPercentageBrokenJSON
> & { name: "RoleWithPercentage" } = {
    name: "RoleWithPercentage",
    type: "record",
    repair: repairRoleWithPercentageJSON,
    toJSON: RoleWithPercentageToJSON,
    fromJSON: JSONToRoleWithPercentage,
    fields: {
        user: { type: "uuid", linkTo: "User" },
        percentage: { type: "percentage" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type QuotationOptionJSON = {
    id: string;
    name: string;
    description: string;
    areas: (string | null)[];
    actions: (string | null)[];
    hiddenActions: (string | null)[];
    allowances: (string | null)[];
    contingencies: (string | null)[];
    schedules: ScheduleJSON[];
    adjustment: string;
    includedInExpectedContractValue: boolean;
    projectDescription: ProjectDescriptionDetailJSON;
    details: QuotationOptionDetailsJSON;
};

export function JSONToQuotationOption(
    json: QuotationOptionJSON
): QuotationOption {
    return {
        id: { uuid: json.id },
        name: json.name,
        description: json.description,
        areas: json.areas.map((inner) => inner),
        actions: json.actions.map((inner) => inner),
        hiddenActions: json.hiddenActions.map((inner) => inner),
        allowances: json.allowances.map((inner) => inner),
        contingencies: json.contingencies.map((inner) => inner),
        schedules: json.schedules.map((inner) => JSONToSchedule(inner)),
        adjustment: new Decimal(json.adjustment),
        includedInExpectedContractValue: json.includedInExpectedContractValue,
        projectDescription: JSONToProjectDescriptionDetail(
            json.projectDescription
        ),
        details: JSONToQuotationOptionDetails(json.details),
    };
}
export type QuotationOptionBrokenJSON = {
    id?: string;
    name?: string;
    description?: string;
    areas?: (string | null)[];
    actions?: (string | null)[];
    hiddenActions?: (string | null)[];
    allowances?: (string | null)[];
    contingencies?: (string | null)[];
    schedules?: ScheduleJSON[];
    adjustment?: string;
    includedInExpectedContractValue?: boolean;
    projectDescription?: ProjectDescriptionDetailJSON;
    details?: QuotationOptionDetailsJSON;
};

export function newQuotationOption(): QuotationOption {
    return JSONToQuotationOption(repairQuotationOptionJSON(undefined));
}
export function repairQuotationOptionJSON(
    json: QuotationOptionBrokenJSON | undefined
): QuotationOptionJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            description: json.description || "",
            areas: (json.areas || []).map((inner) => inner || null),
            actions: (json.actions || []).map((inner) => inner || null),
            hiddenActions: (json.hiddenActions || []).map(
                (inner) => inner || null
            ),
            allowances: (json.allowances || []).map((inner) => inner || null),
            contingencies: (json.contingencies || []).map(
                (inner) => inner || null
            ),
            schedules: (json.schedules || []).map((inner) =>
                repairScheduleJSON(inner)
            ),
            adjustment: json.adjustment || "0",
            includedInExpectedContractValue:
                json.includedInExpectedContractValue || false,
            projectDescription: repairProjectDescriptionDetailJSON(
                json.projectDescription
            ),
            details: repairQuotationOptionDetailsJSON(json.details),
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            description: undefined || "",
            areas: (undefined || []).map((inner) => inner || null),
            actions: (undefined || []).map((inner) => inner || null),
            hiddenActions: (undefined || []).map((inner) => inner || null),
            allowances: (undefined || []).map((inner) => inner || null),
            contingencies: (undefined || []).map((inner) => inner || null),
            schedules: (undefined || []).map((inner) =>
                repairScheduleJSON(inner)
            ),
            adjustment: undefined || "0",
            includedInExpectedContractValue: undefined || false,
            projectDescription: repairProjectDescriptionDetailJSON(undefined),
            details: repairQuotationOptionDetailsJSON(undefined),
        };
    }
}

export function QuotationOptionToJSON(
    value: QuotationOption
): QuotationOptionJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        description: value.description,
        areas: value.areas.map((inner) => inner),
        actions: value.actions.map((inner) => inner),
        hiddenActions: value.hiddenActions.map((inner) => inner),
        allowances: value.allowances.map((inner) => inner),
        contingencies: value.contingencies.map((inner) => inner),
        schedules: value.schedules.map((inner) => ScheduleToJSON(inner)),
        adjustment: value.adjustment.toString(),
        includedInExpectedContractValue: value.includedInExpectedContractValue,
        projectDescription: ProjectDescriptionDetailToJSON(
            value.projectDescription
        ),
        details: QuotationOptionDetailsToJSON(value.details),
    };
}

export const QUOTATION_OPTION_META: RecordMeta<
    QuotationOption,
    QuotationOptionJSON,
    QuotationOptionBrokenJSON
> & { name: "QuotationOption" } = {
    name: "QuotationOption",
    type: "record",
    repair: repairQuotationOptionJSON,
    toJSON: QuotationOptionToJSON,
    fromJSON: JSONToQuotationOption,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        description: { type: "string" },
        areas: { type: "array", items: { type: "uuid", linkTo: "Area" } },
        actions: {
            type: "array",
            items: { type: "uuid", linkTo: "SourceAreaAction" },
        },
        hiddenActions: {
            type: "array",
            items: { type: "uuid", linkTo: "SourceAreaAction" },
        },
        allowances: {
            type: "array",
            items: { type: "uuid", linkTo: "SourceAreaAllowance" },
        },
        contingencies: {
            type: "array",
            items: { type: "uuid", linkTo: "SourceAreaContingency" },
        },
        schedules: { type: "array", items: SCHEDULE_META },
        adjustment: { type: "money" },
        includedInExpectedContractValue: { type: "boolean" },
        projectDescription: PROJECT_DESCRIPTION_DETAIL_META,
        details: QUOTATION_OPTION_DETAILS_META,
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type QuotationJSON = {
    id: string;
    recordVersion: number | null;
    addedDateTime: string | null;
    modifiedDateTime: string | null;
    modifiedBy: string | null;
    user: string | null;
    project: string | null;
    estimates: (string | null)[];
    initializedEstimates: (string | null)[];
    scopeOfWork: NoteListJSON[];
    contractNotes: NoteListJSON[];
    projectSpotlightItems: NoteListJSON[];
    options: QuotationOptionJSON[];
    quotationType: string | null;
    addressedContacts: ContactDetailJSON[];
    firstDate: string | null;
    date: string | null;
    quoteFollowUpDate: string | null;
    number: string;
    generated: boolean;
    projectDescription: ProjectDescriptionDetailJSON;
    dividedProjectDescription: boolean;
    change: boolean;
    initialized: boolean;
    superceded: boolean;
    quotedBy: (string | null)[];
    specificationDetails: string;
    numberOfAddendums: string;
    ignoringUnusedItemsBecause: string;
    tags: string[];
    estimators: RoleWithPercentageJSON[];
};

export function JSONToQuotation(json: QuotationJSON): Quotation {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        addedDateTime:
            json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
        modifiedDateTime:
            json.modifiedDateTime !== null
                ? dateParse(json.modifiedDateTime)
                : null,
        modifiedBy: json.modifiedBy,
        user: json.user,
        project: json.project,
        estimates: json.estimates.map((inner) => inner),
        initializedEstimates: json.initializedEstimates.map((inner) => inner),
        scopeOfWork: json.scopeOfWork.map((inner) => JSONToNoteList(inner)),
        contractNotes: json.contractNotes.map((inner) => JSONToNoteList(inner)),
        projectSpotlightItems: json.projectSpotlightItems.map((inner) =>
            JSONToNoteList(inner)
        ),
        options: json.options.map((inner) => JSONToQuotationOption(inner)),
        quotationType: json.quotationType,
        addressedContacts: json.addressedContacts.map((inner) =>
            JSONToContactDetail(inner)
        ),
        firstDate: json.firstDate !== null ? dateParse(json.firstDate) : null,
        date: json.date !== null ? dateParse(json.date) : null,
        quoteFollowUpDate:
            json.quoteFollowUpDate !== null
                ? LocalDate.parse(json.quoteFollowUpDate)
                : null,
        number: new Decimal(json.number),
        generated: json.generated,
        projectDescription: JSONToProjectDescriptionDetail(
            json.projectDescription
        ),
        dividedProjectDescription: json.dividedProjectDescription,
        change: json.change,
        initialized: json.initialized,
        superceded: json.superceded,
        quotedBy: json.quotedBy.map((inner) => inner),
        specificationDetails: json.specificationDetails,
        numberOfAddendums: new Decimal(json.numberOfAddendums),
        ignoringUnusedItemsBecause: json.ignoringUnusedItemsBecause,
        tags: json.tags.map((inner) => inner),
        estimators: json.estimators.map((inner) =>
            JSONToRoleWithPercentage(inner)
        ),
    };
}
export type QuotationBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    addedDateTime?: string | null;
    modifiedDateTime?: string | null;
    modifiedBy?: string | null;
    user?: string | null;
    project?: string | null;
    estimates?: (string | null)[];
    initializedEstimates?: (string | null)[];
    scopeOfWork?: NoteListJSON[];
    contractNotes?: NoteListJSON[];
    projectSpotlightItems?: NoteListJSON[];
    options?: QuotationOptionJSON[];
    quotationType?: string | null;
    addressedContacts?: ContactDetailJSON[];
    firstDate?: string | null;
    date?: string | null;
    quoteFollowUpDate?: string | null;
    number?: string;
    generated?: boolean;
    projectDescription?: ProjectDescriptionDetailJSON;
    dividedProjectDescription?: boolean;
    change?: boolean;
    initialized?: boolean;
    superceded?: boolean;
    quotedBy?: (string | null)[];
    specificationDetails?: string;
    numberOfAddendums?: string;
    ignoringUnusedItemsBecause?: string;
    tags?: string[];
    estimators?: RoleWithPercentageJSON[];
};

export function newQuotation(): Quotation {
    return JSONToQuotation(repairQuotationJSON(undefined));
}
export function repairQuotationJSON(
    json: QuotationBrokenJSON | undefined
): QuotationJSON {
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
            modifiedBy: json.modifiedBy || null,
            user: json.user || null,
            project: json.project || null,
            estimates: (json.estimates || []).map((inner) => inner || null),
            initializedEstimates: (json.initializedEstimates || []).map(
                (inner) => inner || null
            ),
            scopeOfWork: (json.scopeOfWork || []).map((inner) =>
                repairNoteListJSON(inner)
            ),
            contractNotes: (json.contractNotes || []).map((inner) =>
                repairNoteListJSON(inner)
            ),
            projectSpotlightItems: (json.projectSpotlightItems || []).map(
                (inner) => repairNoteListJSON(inner)
            ),
            options: (json.options || []).map((inner) =>
                repairQuotationOptionJSON(inner)
            ),
            quotationType: json.quotationType || null,
            addressedContacts: (json.addressedContacts || []).map((inner) =>
                repairContactDetailJSON(inner)
            ),
            firstDate: json.firstDate
                ? new Date(json.firstDate!).toISOString()
                : null,
            date: json.date ? new Date(json.date!).toISOString() : null,
            quoteFollowUpDate: json.quoteFollowUpDate || null,
            number: json.number || "0",
            generated: json.generated || false,
            projectDescription: repairProjectDescriptionDetailJSON(
                json.projectDescription
            ),
            dividedProjectDescription: json.dividedProjectDescription || false,
            change: json.change || false,
            initialized: json.initialized || false,
            superceded: json.superceded || false,
            quotedBy: (json.quotedBy || []).map((inner) => inner || null),
            specificationDetails: json.specificationDetails || "",
            numberOfAddendums: json.numberOfAddendums || "0",
            ignoringUnusedItemsBecause: json.ignoringUnusedItemsBecause || "",
            tags: (json.tags || []).map((inner) => inner || ""),
            estimators: (json.estimators || []).map((inner) =>
                repairRoleWithPercentageJSON(inner)
            ),
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
            modifiedBy: undefined || null,
            user: undefined || null,
            project: undefined || null,
            estimates: (undefined || []).map((inner) => inner || null),
            initializedEstimates: (undefined || []).map(
                (inner) => inner || null
            ),
            scopeOfWork: (undefined || []).map((inner) =>
                repairNoteListJSON(inner)
            ),
            contractNotes: (undefined || []).map((inner) =>
                repairNoteListJSON(inner)
            ),
            projectSpotlightItems: (undefined || []).map((inner) =>
                repairNoteListJSON(inner)
            ),
            options: (undefined || []).map((inner) =>
                repairQuotationOptionJSON(inner)
            ),
            quotationType: undefined || null,
            addressedContacts: (undefined || []).map((inner) =>
                repairContactDetailJSON(inner)
            ),
            firstDate: undefined ? new Date(undefined!).toISOString() : null,
            date: undefined ? new Date(undefined!).toISOString() : null,
            quoteFollowUpDate: undefined || null,
            number: undefined || "0",
            generated: undefined || false,
            projectDescription: repairProjectDescriptionDetailJSON(undefined),
            dividedProjectDescription: undefined || false,
            change: undefined || false,
            initialized: undefined || false,
            superceded: undefined || false,
            quotedBy: (undefined || []).map((inner) => inner || null),
            specificationDetails: undefined || "",
            numberOfAddendums: undefined || "0",
            ignoringUnusedItemsBecause: undefined || "",
            tags: (undefined || []).map((inner) => inner || ""),
            estimators: (undefined || []).map((inner) =>
                repairRoleWithPercentageJSON(inner)
            ),
        };
    }
}

export function QuotationToJSON(value: Quotation): QuotationJSON {
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
        modifiedBy: value.modifiedBy,
        user: value.user,
        project: value.project,
        estimates: value.estimates.map((inner) => inner),
        initializedEstimates: value.initializedEstimates.map((inner) => inner),
        scopeOfWork: value.scopeOfWork.map((inner) => NoteListToJSON(inner)),
        contractNotes: value.contractNotes.map((inner) =>
            NoteListToJSON(inner)
        ),
        projectSpotlightItems: value.projectSpotlightItems.map((inner) =>
            NoteListToJSON(inner)
        ),
        options: value.options.map((inner) => QuotationOptionToJSON(inner)),
        quotationType: value.quotationType,
        addressedContacts: value.addressedContacts.map((inner) =>
            ContactDetailToJSON(inner)
        ),
        firstDate:
            value.firstDate !== null ? value.firstDate.toISOString() : null,
        date: value.date !== null ? value.date.toISOString() : null,
        quoteFollowUpDate:
            value.quoteFollowUpDate !== null
                ? value.quoteFollowUpDate.toString()
                : null,
        number: value.number.toString(),
        generated: value.generated,
        projectDescription: ProjectDescriptionDetailToJSON(
            value.projectDescription
        ),
        dividedProjectDescription: value.dividedProjectDescription,
        change: value.change,
        initialized: value.initialized,
        superceded: value.superceded,
        quotedBy: value.quotedBy.map((inner) => inner),
        specificationDetails: value.specificationDetails,
        numberOfAddendums: value.numberOfAddendums.toString(),
        ignoringUnusedItemsBecause: value.ignoringUnusedItemsBecause,
        tags: value.tags.map((inner) => inner),
        estimators: value.estimators.map((inner) =>
            RoleWithPercentageToJSON(inner)
        ),
    };
}

export const QUOTATION_META: RecordMeta<
    Quotation,
    QuotationJSON,
    QuotationBrokenJSON
> & { name: "Quotation" } = {
    name: "Quotation",
    type: "record",
    repair: repairQuotationJSON,
    toJSON: QuotationToJSON,
    fromJSON: JSONToQuotation,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        addedDateTime: { type: "datetime" },
        modifiedDateTime: { type: "datetime" },
        modifiedBy: { type: "uuid", linkTo: "User" },
        user: { type: "uuid", linkTo: "User" },
        project: { type: "uuid", linkTo: "Project" },
        estimates: {
            type: "array",
            items: {
                type: "uuid",
                linkTo: "Estimate | TimeAndMaterialsEstimate",
            },
        },
        initializedEstimates: {
            type: "array",
            items: {
                type: "uuid",
                linkTo: "Estimate | TimeAndMaterialsEstimate",
            },
        },
        scopeOfWork: { type: "array", items: NOTE_LIST_META },
        contractNotes: { type: "array", items: NOTE_LIST_META },
        projectSpotlightItems: { type: "array", items: NOTE_LIST_META },
        options: { type: "array", items: QUOTATION_OPTION_META },
        quotationType: { type: "uuid", linkTo: "QuotationType" },
        addressedContacts: { type: "array", items: CONTACT_DETAIL_META },
        firstDate: { type: "datetime" },
        date: { type: "datetime" },
        quoteFollowUpDate: { type: "date" },
        number: { type: "quantity" },
        generated: { type: "boolean" },
        projectDescription: PROJECT_DESCRIPTION_DETAIL_META,
        dividedProjectDescription: { type: "boolean" },
        change: { type: "boolean" },
        initialized: { type: "boolean" },
        superceded: { type: "boolean" },
        quotedBy: { type: "array", items: { type: "uuid", linkTo: "User" } },
        specificationDetails: { type: "string" },
        numberOfAddendums: { type: "quantity" },
        ignoringUnusedItemsBecause: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        estimators: { type: "array", items: ROLE_WITH_PERCENTAGE_META },
    },
    userFacingKey: "number",
    functions: {
        ungenerated: {
            fn: calcQuotationUngenerated,
            parameterTypes: () => [QUOTATION_META],
            returnType: { type: "boolean" },
        },
        isLastQuotation: {
            fn: calcQuotationIsLastQuotation,
            parameterTypes: () => [QUOTATION_META],
            returnType: { type: "boolean" },
        },
        expectedContractValue: {
            fn: calcQuotationExpectedContractValue,
            parameterTypes: () => [QUOTATION_META],
            returnType: { type: "money" },
        },
    },
    segments: {},
};

// END MAGIC -- DO NOT EDIT
