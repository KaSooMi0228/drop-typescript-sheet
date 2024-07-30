import { Decimal } from "decimal.js";
import { Percentage } from "../../../clay/common";
import { RecordMeta } from "../../../clay/meta";

//!Data
export type OptionalExtraPercentage = {
    enabled: boolean;
    authorizedBy: string;
    markup: Percentage;
};

//!Data
export type EstimatePercentage = {
    seperate: boolean;
    labour: Percentage;
    materials: Percentage;
};

//!Data
export type Percentages = {
    overhead: EstimatePercentage;
    profit: EstimatePercentage;
    misc: EstimatePercentage;
    additional: EstimatePercentage;
    mpp: OptionalExtraPercentage;
    budget: OptionalExtraPercentage;
};

// BEGIN MAGIC -- DO NOT EDIT
export type OptionalExtraPercentageJSON = {
    enabled: boolean;
    authorizedBy: string;
    markup: string;
};

export function JSONToOptionalExtraPercentage(
    json: OptionalExtraPercentageJSON
): OptionalExtraPercentage {
    return {
        enabled: json.enabled,
        authorizedBy: json.authorizedBy,
        markup: new Decimal(json.markup),
    };
}
export type OptionalExtraPercentageBrokenJSON = {
    enabled?: boolean;
    authorizedBy?: string;
    markup?: string;
};

export function newOptionalExtraPercentage(): OptionalExtraPercentage {
    return JSONToOptionalExtraPercentage(
        repairOptionalExtraPercentageJSON(undefined)
    );
}
export function repairOptionalExtraPercentageJSON(
    json: OptionalExtraPercentageBrokenJSON | undefined
): OptionalExtraPercentageJSON {
    if (json) {
        return {
            enabled: json.enabled || false,
            authorizedBy: json.authorizedBy || "",
            markup: json.markup || "0",
        };
    } else {
        return {
            enabled: undefined || false,
            authorizedBy: undefined || "",
            markup: undefined || "0",
        };
    }
}

export function OptionalExtraPercentageToJSON(
    value: OptionalExtraPercentage
): OptionalExtraPercentageJSON {
    return {
        enabled: value.enabled,
        authorizedBy: value.authorizedBy,
        markup: value.markup.toString(),
    };
}

export const OPTIONAL_EXTRA_PERCENTAGE_META: RecordMeta<
    OptionalExtraPercentage,
    OptionalExtraPercentageJSON,
    OptionalExtraPercentageBrokenJSON
> & { name: "OptionalExtraPercentage" } = {
    name: "OptionalExtraPercentage",
    type: "record",
    repair: repairOptionalExtraPercentageJSON,
    toJSON: OptionalExtraPercentageToJSON,
    fromJSON: JSONToOptionalExtraPercentage,
    fields: {
        enabled: { type: "boolean" },
        authorizedBy: { type: "string" },
        markup: { type: "percentage" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type EstimatePercentageJSON = {
    seperate: boolean;
    labour: string;
    materials: string;
};

export function JSONToEstimatePercentage(
    json: EstimatePercentageJSON
): EstimatePercentage {
    return {
        seperate: json.seperate,
        labour: new Decimal(json.labour),
        materials: new Decimal(json.materials),
    };
}
export type EstimatePercentageBrokenJSON = {
    seperate?: boolean;
    labour?: string;
    materials?: string;
};

export function newEstimatePercentage(): EstimatePercentage {
    return JSONToEstimatePercentage(repairEstimatePercentageJSON(undefined));
}
export function repairEstimatePercentageJSON(
    json: EstimatePercentageBrokenJSON | undefined
): EstimatePercentageJSON {
    if (json) {
        return {
            seperate: json.seperate || false,
            labour: json.labour || "0",
            materials: json.materials || "0",
        };
    } else {
        return {
            seperate: undefined || false,
            labour: undefined || "0",
            materials: undefined || "0",
        };
    }
}

export function EstimatePercentageToJSON(
    value: EstimatePercentage
): EstimatePercentageJSON {
    return {
        seperate: value.seperate,
        labour: value.labour.toString(),
        materials: value.materials.toString(),
    };
}

export const ESTIMATE_PERCENTAGE_META: RecordMeta<
    EstimatePercentage,
    EstimatePercentageJSON,
    EstimatePercentageBrokenJSON
> & { name: "EstimatePercentage" } = {
    name: "EstimatePercentage",
    type: "record",
    repair: repairEstimatePercentageJSON,
    toJSON: EstimatePercentageToJSON,
    fromJSON: JSONToEstimatePercentage,
    fields: {
        seperate: { type: "boolean" },
        labour: { type: "percentage" },
        materials: { type: "percentage" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type PercentagesJSON = {
    overhead: EstimatePercentageJSON;
    profit: EstimatePercentageJSON;
    misc: EstimatePercentageJSON;
    additional: EstimatePercentageJSON;
    mpp: OptionalExtraPercentageJSON;
    budget: OptionalExtraPercentageJSON;
};

export function JSONToPercentages(json: PercentagesJSON): Percentages {
    return {
        overhead: JSONToEstimatePercentage(json.overhead),
        profit: JSONToEstimatePercentage(json.profit),
        misc: JSONToEstimatePercentage(json.misc),
        additional: JSONToEstimatePercentage(json.additional),
        mpp: JSONToOptionalExtraPercentage(json.mpp),
        budget: JSONToOptionalExtraPercentage(json.budget),
    };
}
export type PercentagesBrokenJSON = {
    overhead?: EstimatePercentageJSON;
    profit?: EstimatePercentageJSON;
    misc?: EstimatePercentageJSON;
    additional?: EstimatePercentageJSON;
    mpp?: OptionalExtraPercentageJSON;
    budget?: OptionalExtraPercentageJSON;
};

export function newPercentages(): Percentages {
    return JSONToPercentages(repairPercentagesJSON(undefined));
}
export function repairPercentagesJSON(
    json: PercentagesBrokenJSON | undefined
): PercentagesJSON {
    if (json) {
        return {
            overhead: repairEstimatePercentageJSON(json.overhead),
            profit: repairEstimatePercentageJSON(json.profit),
            misc: repairEstimatePercentageJSON(json.misc),
            additional: repairEstimatePercentageJSON(json.additional),
            mpp: repairOptionalExtraPercentageJSON(json.mpp),
            budget: repairOptionalExtraPercentageJSON(json.budget),
        };
    } else {
        return {
            overhead: repairEstimatePercentageJSON(undefined),
            profit: repairEstimatePercentageJSON(undefined),
            misc: repairEstimatePercentageJSON(undefined),
            additional: repairEstimatePercentageJSON(undefined),
            mpp: repairOptionalExtraPercentageJSON(undefined),
            budget: repairOptionalExtraPercentageJSON(undefined),
        };
    }
}

export function PercentagesToJSON(value: Percentages): PercentagesJSON {
    return {
        overhead: EstimatePercentageToJSON(value.overhead),
        profit: EstimatePercentageToJSON(value.profit),
        misc: EstimatePercentageToJSON(value.misc),
        additional: EstimatePercentageToJSON(value.additional),
        mpp: OptionalExtraPercentageToJSON(value.mpp),
        budget: OptionalExtraPercentageToJSON(value.budget),
    };
}

export const PERCENTAGES_META: RecordMeta<
    Percentages,
    PercentagesJSON,
    PercentagesBrokenJSON
> & { name: "Percentages" } = {
    name: "Percentages",
    type: "record",
    repair: repairPercentagesJSON,
    toJSON: PercentagesToJSON,
    fromJSON: JSONToPercentages,
    fields: {
        overhead: ESTIMATE_PERCENTAGE_META,
        profit: ESTIMATE_PERCENTAGE_META,
        misc: ESTIMATE_PERCENTAGE_META,
        additional: ESTIMATE_PERCENTAGE_META,
        mpp: OPTIONAL_EXTRA_PERCENTAGE_META,
        budget: OPTIONAL_EXTRA_PERCENTAGE_META,
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
