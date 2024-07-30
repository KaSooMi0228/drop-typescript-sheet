import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import {
    ProjectDescription,
    ProjectDescriptionCategory,
} from "../../project-description/table";

//!Data
export type ProjectDescriptionDetail = {
    category: Link<ProjectDescriptionCategory>;
    description: Link<ProjectDescription>;
    custom: string;
};

// BEGIN MAGIC -- DO NOT EDIT
export type ProjectDescriptionDetailJSON = {
    category: string | null;
    description: string | null;
    custom: string;
};

export function JSONToProjectDescriptionDetail(
    json: ProjectDescriptionDetailJSON
): ProjectDescriptionDetail {
    return {
        category: json.category,
        description: json.description,
        custom: json.custom,
    };
}
export type ProjectDescriptionDetailBrokenJSON = {
    category?: string | null;
    description?: string | null;
    custom?: string;
};

export function newProjectDescriptionDetail(): ProjectDescriptionDetail {
    return JSONToProjectDescriptionDetail(
        repairProjectDescriptionDetailJSON(undefined)
    );
}
export function repairProjectDescriptionDetailJSON(
    json: ProjectDescriptionDetailBrokenJSON | undefined
): ProjectDescriptionDetailJSON {
    if (json) {
        return {
            category: json.category || null,
            description: json.description || null,
            custom: json.custom || "",
        };
    } else {
        return {
            category: undefined || null,
            description: undefined || null,
            custom: undefined || "",
        };
    }
}

export function ProjectDescriptionDetailToJSON(
    value: ProjectDescriptionDetail
): ProjectDescriptionDetailJSON {
    return {
        category: value.category,
        description: value.description,
        custom: value.custom,
    };
}

export const PROJECT_DESCRIPTION_DETAIL_META: RecordMeta<
    ProjectDescriptionDetail,
    ProjectDescriptionDetailJSON,
    ProjectDescriptionDetailBrokenJSON
> & { name: "ProjectDescriptionDetail" } = {
    name: "ProjectDescriptionDetail",
    type: "record",
    repair: repairProjectDescriptionDetailJSON,
    toJSON: ProjectDescriptionDetailToJSON,
    fromJSON: JSONToProjectDescriptionDetail,
    fields: {
        category: { type: "uuid", linkTo: "ProjectDescriptionCategory" },
        description: { type: "uuid", linkTo: "ProjectDescription" },
        custom: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
