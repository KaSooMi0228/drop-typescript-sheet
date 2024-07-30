import { Decimal } from "decimal.js";
import { Money } from "../../clay/common";
import { RecordMeta } from "../../clay/meta";
import { genUUID, UUID } from "../../clay/uuid";
import {
    JSONToProjectDescriptionDetail,
    ProjectDescriptionDetail,
    ProjectDescriptionDetailJSON,
    ProjectDescriptionDetailToJSON,
    PROJECT_DESCRIPTION_DETAIL_META,
    repairProjectDescriptionDetailJSON,
} from "./projectDescriptionDetail/table";

//!Data
export type ProjectSchedule = {
    id: UUID;
    name: string;
    description: string;
    price: Money;
    certifiedForemanContractAmount: Money;
    projectDescription: ProjectDescriptionDetail;
    contingencyAllowance: boolean;
};

// BEGIN MAGIC -- DO NOT EDIT
export type ProjectScheduleJSON = {
    id: string;
    name: string;
    description: string;
    price: string;
    certifiedForemanContractAmount: string;
    projectDescription: ProjectDescriptionDetailJSON;
    contingencyAllowance: boolean;
};

export function JSONToProjectSchedule(
    json: ProjectScheduleJSON
): ProjectSchedule {
    return {
        id: { uuid: json.id },
        name: json.name,
        description: json.description,
        price: new Decimal(json.price),
        certifiedForemanContractAmount: new Decimal(
            json.certifiedForemanContractAmount
        ),
        projectDescription: JSONToProjectDescriptionDetail(
            json.projectDescription
        ),
        contingencyAllowance: json.contingencyAllowance,
    };
}
export type ProjectScheduleBrokenJSON = {
    id?: string;
    name?: string;
    description?: string;
    price?: string;
    certifiedForemanContractAmount?: string;
    projectDescription?: ProjectDescriptionDetailJSON;
    contingencyAllowance?: boolean;
};

export function newProjectSchedule(): ProjectSchedule {
    return JSONToProjectSchedule(repairProjectScheduleJSON(undefined));
}
export function repairProjectScheduleJSON(
    json: ProjectScheduleBrokenJSON | undefined
): ProjectScheduleJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            description: json.description || "",
            price: json.price || "0",
            certifiedForemanContractAmount:
                json.certifiedForemanContractAmount || "0",
            projectDescription: repairProjectDescriptionDetailJSON(
                json.projectDescription
            ),
            contingencyAllowance: json.contingencyAllowance || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            description: undefined || "",
            price: undefined || "0",
            certifiedForemanContractAmount: undefined || "0",
            projectDescription: repairProjectDescriptionDetailJSON(undefined),
            contingencyAllowance: undefined || false,
        };
    }
}

export function ProjectScheduleToJSON(
    value: ProjectSchedule
): ProjectScheduleJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        description: value.description,
        price: value.price.toString(),
        certifiedForemanContractAmount:
            value.certifiedForemanContractAmount.toString(),
        projectDescription: ProjectDescriptionDetailToJSON(
            value.projectDescription
        ),
        contingencyAllowance: value.contingencyAllowance,
    };
}

export const PROJECT_SCHEDULE_META: RecordMeta<
    ProjectSchedule,
    ProjectScheduleJSON,
    ProjectScheduleBrokenJSON
> & { name: "ProjectSchedule" } = {
    name: "ProjectSchedule",
    type: "record",
    repair: repairProjectScheduleJSON,
    toJSON: ProjectScheduleToJSON,
    fromJSON: JSONToProjectSchedule,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        description: { type: "string" },
        price: { type: "money" },
        certifiedForemanContractAmount: { type: "money" },
        projectDescription: PROJECT_DESCRIPTION_DETAIL_META,
        contingencyAllowance: { type: "boolean" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
