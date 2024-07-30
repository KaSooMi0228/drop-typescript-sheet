import Decimal from "decimal.js";
import { Money, Quantity } from "../../../clay/common";
import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { sumMap } from "../../../clay/queryFuncs";
import { genUUID, UUID } from "../../../clay/uuid";
import { Version } from "../../../clay/version";
import {
    EstimateCommon,
    EstimateCommonJSON,
    EstimateCommonToJSON,
    ESTIMATE_COMMON_META,
    JSONToEstimateCommon,
    repairEstimateCommonJSON,
} from "../table";

//!Data
export type TimeAndMaterialsEstimateProduct = {
    id: UUID;
    recordVersion: Version;
    name: string;
    cost: Money;
};

//!Data
export type TimeAndMaterialsEstimateLine = {
    product: Link<TimeAndMaterialsEstimateProduct>;
    quantity: Quantity;
    cost: Money;
};

export function calcTimeAndMaterialsEstimateLineTotalCost(
    line: TimeAndMaterialsEstimateLine
): Money {
    return line.quantity.times(line.cost);
}

//!Data
export type TimeAndMaterialsEstimateExtra = {
    description: string;
    amount: Money;
};

//!Data
export type TimeAndMaterialsEstimate = {
    id: UUID;
    recordVersion: Version;
    common: EstimateCommon;

    lines: TimeAndMaterialsEstimateLine[];
    extras: TimeAndMaterialsEstimateExtra[];
};

export function calcTimeAndMaterialsEstimateSubTotal(
    order: TimeAndMaterialsEstimate
): Money {
    return sumMap(order.lines, (line) => line.quantity.times(line.cost)).plus(
        sumMap(order.extras, (line) => line.amount)
    );
}

export function calcTimeAndMaterialsEstimateTotal(
    order: TimeAndMaterialsEstimate
): Money {
    return calcTimeAndMaterialsEstimateSubTotal(order).times(
        new Decimal(1)
            .plus(order.common.markup)
            .plus(order.common.additionalMarkup)
    );
}

// BEGIN MAGIC -- DO NOT EDIT
export type TimeAndMaterialsEstimateProductJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    cost: string;
};

export function JSONToTimeAndMaterialsEstimateProduct(
    json: TimeAndMaterialsEstimateProductJSON
): TimeAndMaterialsEstimateProduct {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        cost: new Decimal(json.cost),
    };
}
export type TimeAndMaterialsEstimateProductBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    cost?: string;
};

export function newTimeAndMaterialsEstimateProduct(): TimeAndMaterialsEstimateProduct {
    return JSONToTimeAndMaterialsEstimateProduct(
        repairTimeAndMaterialsEstimateProductJSON(undefined)
    );
}
export function repairTimeAndMaterialsEstimateProductJSON(
    json: TimeAndMaterialsEstimateProductBrokenJSON | undefined
): TimeAndMaterialsEstimateProductJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            cost: json.cost || "0",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            cost: undefined || "0",
        };
    }
}

export function TimeAndMaterialsEstimateProductToJSON(
    value: TimeAndMaterialsEstimateProduct
): TimeAndMaterialsEstimateProductJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        cost: value.cost.toString(),
    };
}

export const TIME_AND_MATERIALS_ESTIMATE_PRODUCT_META: RecordMeta<
    TimeAndMaterialsEstimateProduct,
    TimeAndMaterialsEstimateProductJSON,
    TimeAndMaterialsEstimateProductBrokenJSON
> & { name: "TimeAndMaterialsEstimateProduct" } = {
    name: "TimeAndMaterialsEstimateProduct",
    type: "record",
    repair: repairTimeAndMaterialsEstimateProductJSON,
    toJSON: TimeAndMaterialsEstimateProductToJSON,
    fromJSON: JSONToTimeAndMaterialsEstimateProduct,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        cost: { type: "money" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type TimeAndMaterialsEstimateLineJSON = {
    product: string | null;
    quantity: string;
    cost: string;
};

export function JSONToTimeAndMaterialsEstimateLine(
    json: TimeAndMaterialsEstimateLineJSON
): TimeAndMaterialsEstimateLine {
    return {
        product: json.product,
        quantity: new Decimal(json.quantity),
        cost: new Decimal(json.cost),
    };
}
export type TimeAndMaterialsEstimateLineBrokenJSON = {
    product?: string | null;
    quantity?: string;
    cost?: string;
};

export function newTimeAndMaterialsEstimateLine(): TimeAndMaterialsEstimateLine {
    return JSONToTimeAndMaterialsEstimateLine(
        repairTimeAndMaterialsEstimateLineJSON(undefined)
    );
}
export function repairTimeAndMaterialsEstimateLineJSON(
    json: TimeAndMaterialsEstimateLineBrokenJSON | undefined
): TimeAndMaterialsEstimateLineJSON {
    if (json) {
        return {
            product: json.product || null,
            quantity: json.quantity || "0",
            cost: json.cost || "0",
        };
    } else {
        return {
            product: undefined || null,
            quantity: undefined || "0",
            cost: undefined || "0",
        };
    }
}

export function TimeAndMaterialsEstimateLineToJSON(
    value: TimeAndMaterialsEstimateLine
): TimeAndMaterialsEstimateLineJSON {
    return {
        product: value.product,
        quantity: value.quantity.toString(),
        cost: value.cost.toString(),
    };
}

export const TIME_AND_MATERIALS_ESTIMATE_LINE_META: RecordMeta<
    TimeAndMaterialsEstimateLine,
    TimeAndMaterialsEstimateLineJSON,
    TimeAndMaterialsEstimateLineBrokenJSON
> & { name: "TimeAndMaterialsEstimateLine" } = {
    name: "TimeAndMaterialsEstimateLine",
    type: "record",
    repair: repairTimeAndMaterialsEstimateLineJSON,
    toJSON: TimeAndMaterialsEstimateLineToJSON,
    fromJSON: JSONToTimeAndMaterialsEstimateLine,
    fields: {
        product: { type: "uuid", linkTo: "TimeAndMaterialsEstimateProduct" },
        quantity: { type: "quantity" },
        cost: { type: "money" },
    },
    userFacingKey: null,
    functions: {
        totalCost: {
            fn: calcTimeAndMaterialsEstimateLineTotalCost,
            parameterTypes: () => [TIME_AND_MATERIALS_ESTIMATE_LINE_META],
            returnType: { type: "money" },
        },
    },
    segments: {},
};

export type TimeAndMaterialsEstimateExtraJSON = {
    description: string;
    amount: string;
};

export function JSONToTimeAndMaterialsEstimateExtra(
    json: TimeAndMaterialsEstimateExtraJSON
): TimeAndMaterialsEstimateExtra {
    return {
        description: json.description,
        amount: new Decimal(json.amount),
    };
}
export type TimeAndMaterialsEstimateExtraBrokenJSON = {
    description?: string;
    amount?: string;
};

export function newTimeAndMaterialsEstimateExtra(): TimeAndMaterialsEstimateExtra {
    return JSONToTimeAndMaterialsEstimateExtra(
        repairTimeAndMaterialsEstimateExtraJSON(undefined)
    );
}
export function repairTimeAndMaterialsEstimateExtraJSON(
    json: TimeAndMaterialsEstimateExtraBrokenJSON | undefined
): TimeAndMaterialsEstimateExtraJSON {
    if (json) {
        return {
            description: json.description || "",
            amount: json.amount || "0",
        };
    } else {
        return {
            description: undefined || "",
            amount: undefined || "0",
        };
    }
}

export function TimeAndMaterialsEstimateExtraToJSON(
    value: TimeAndMaterialsEstimateExtra
): TimeAndMaterialsEstimateExtraJSON {
    return {
        description: value.description,
        amount: value.amount.toString(),
    };
}

export const TIME_AND_MATERIALS_ESTIMATE_EXTRA_META: RecordMeta<
    TimeAndMaterialsEstimateExtra,
    TimeAndMaterialsEstimateExtraJSON,
    TimeAndMaterialsEstimateExtraBrokenJSON
> & { name: "TimeAndMaterialsEstimateExtra" } = {
    name: "TimeAndMaterialsEstimateExtra",
    type: "record",
    repair: repairTimeAndMaterialsEstimateExtraJSON,
    toJSON: TimeAndMaterialsEstimateExtraToJSON,
    fromJSON: JSONToTimeAndMaterialsEstimateExtra,
    fields: {
        description: { type: "string" },
        amount: { type: "money" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type TimeAndMaterialsEstimateJSON = {
    id: string;
    recordVersion: number | null;
    common: EstimateCommonJSON;
    lines: TimeAndMaterialsEstimateLineJSON[];
    extras: TimeAndMaterialsEstimateExtraJSON[];
};

export function JSONToTimeAndMaterialsEstimate(
    json: TimeAndMaterialsEstimateJSON
): TimeAndMaterialsEstimate {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        common: JSONToEstimateCommon(json.common),
        lines: json.lines.map((inner) =>
            JSONToTimeAndMaterialsEstimateLine(inner)
        ),
        extras: json.extras.map((inner) =>
            JSONToTimeAndMaterialsEstimateExtra(inner)
        ),
    };
}
export type TimeAndMaterialsEstimateBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    common?: EstimateCommonJSON;
    lines?: TimeAndMaterialsEstimateLineJSON[];
    extras?: TimeAndMaterialsEstimateExtraJSON[];
};

export function newTimeAndMaterialsEstimate(): TimeAndMaterialsEstimate {
    return JSONToTimeAndMaterialsEstimate(
        repairTimeAndMaterialsEstimateJSON(undefined)
    );
}
export function repairTimeAndMaterialsEstimateJSON(
    json: TimeAndMaterialsEstimateBrokenJSON | undefined
): TimeAndMaterialsEstimateJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            common: repairEstimateCommonJSON(json.common),
            lines: (json.lines || []).map((inner) =>
                repairTimeAndMaterialsEstimateLineJSON(inner)
            ),
            extras: (json.extras || []).map((inner) =>
                repairTimeAndMaterialsEstimateExtraJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            common: repairEstimateCommonJSON(undefined),
            lines: (undefined || []).map((inner) =>
                repairTimeAndMaterialsEstimateLineJSON(inner)
            ),
            extras: (undefined || []).map((inner) =>
                repairTimeAndMaterialsEstimateExtraJSON(inner)
            ),
        };
    }
}

export function TimeAndMaterialsEstimateToJSON(
    value: TimeAndMaterialsEstimate
): TimeAndMaterialsEstimateJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        common: EstimateCommonToJSON(value.common),
        lines: value.lines.map((inner) =>
            TimeAndMaterialsEstimateLineToJSON(inner)
        ),
        extras: value.extras.map((inner) =>
            TimeAndMaterialsEstimateExtraToJSON(inner)
        ),
    };
}

export const TIME_AND_MATERIALS_ESTIMATE_META: RecordMeta<
    TimeAndMaterialsEstimate,
    TimeAndMaterialsEstimateJSON,
    TimeAndMaterialsEstimateBrokenJSON
> & { name: "TimeAndMaterialsEstimate" } = {
    name: "TimeAndMaterialsEstimate",
    type: "record",
    repair: repairTimeAndMaterialsEstimateJSON,
    toJSON: TimeAndMaterialsEstimateToJSON,
    fromJSON: JSONToTimeAndMaterialsEstimate,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        common: ESTIMATE_COMMON_META,
        lines: { type: "array", items: TIME_AND_MATERIALS_ESTIMATE_LINE_META },
        extras: {
            type: "array",
            items: TIME_AND_MATERIALS_ESTIMATE_EXTRA_META,
        },
    },
    userFacingKey: null,
    functions: {
        subTotal: {
            fn: calcTimeAndMaterialsEstimateSubTotal,
            parameterTypes: () => [TIME_AND_MATERIALS_ESTIMATE_META],
            returnType: { type: "money" },
        },
        total: {
            fn: calcTimeAndMaterialsEstimateTotal,
            parameterTypes: () => [TIME_AND_MATERIALS_ESTIMATE_META],
            returnType: { type: "money" },
        },
    },
    segments: {},
};

// END MAGIC -- DO NOT EDIT
