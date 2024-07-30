import Decimal from "decimal.js";
import { RecordMeta } from "../../../clay/meta";

//!Data
export type QualityRfq = {
    legacy: boolean;
    repeatClient: boolean;
    reasonableTimeline: boolean;
    significantSize: boolean;
    projectFundingInPlace: boolean;
    clearScopeOfWork: boolean;
};

export function calcQualityRfqIsQuality(quality: QualityRfq): boolean {
    return (
        quality.legacy ||
        (quality.repeatClient ? new Decimal(1) : new Decimal(0))
            .plus(quality.reasonableTimeline ? new Decimal(1) : new Decimal(0))
            .plus(quality.significantSize ? new Decimal(1) : new Decimal(0))
            .plus(
                quality.projectFundingInPlace ? new Decimal(1) : new Decimal(0)
            )
            .plus(quality.clearScopeOfWork ? new Decimal(1) : new Decimal(0))
            .greaterThanOrEqualTo(new Decimal(3))
    );
}

// BEGIN MAGIC -- DO NOT EDIT
export type QualityRfqJSON = {
    legacy: boolean;
    repeatClient: boolean;
    reasonableTimeline: boolean;
    significantSize: boolean;
    projectFundingInPlace: boolean;
    clearScopeOfWork: boolean;
};

export function JSONToQualityRfq(json: QualityRfqJSON): QualityRfq {
    return {
        legacy: json.legacy,
        repeatClient: json.repeatClient,
        reasonableTimeline: json.reasonableTimeline,
        significantSize: json.significantSize,
        projectFundingInPlace: json.projectFundingInPlace,
        clearScopeOfWork: json.clearScopeOfWork,
    };
}
export type QualityRfqBrokenJSON = {
    legacy?: boolean;
    repeatClient?: boolean;
    reasonableTimeline?: boolean;
    significantSize?: boolean;
    projectFundingInPlace?: boolean;
    clearScopeOfWork?: boolean;
};

export function newQualityRfq(): QualityRfq {
    return JSONToQualityRfq(repairQualityRfqJSON(undefined));
}
export function repairQualityRfqJSON(
    json: QualityRfqBrokenJSON | undefined
): QualityRfqJSON {
    if (json) {
        return {
            legacy: json.legacy || false,
            repeatClient: json.repeatClient || false,
            reasonableTimeline: json.reasonableTimeline || false,
            significantSize: json.significantSize || false,
            projectFundingInPlace: json.projectFundingInPlace || false,
            clearScopeOfWork: json.clearScopeOfWork || false,
        };
    } else {
        return {
            legacy: undefined || false,
            repeatClient: undefined || false,
            reasonableTimeline: undefined || false,
            significantSize: undefined || false,
            projectFundingInPlace: undefined || false,
            clearScopeOfWork: undefined || false,
        };
    }
}

export function QualityRfqToJSON(value: QualityRfq): QualityRfqJSON {
    return {
        legacy: value.legacy,
        repeatClient: value.repeatClient,
        reasonableTimeline: value.reasonableTimeline,
        significantSize: value.significantSize,
        projectFundingInPlace: value.projectFundingInPlace,
        clearScopeOfWork: value.clearScopeOfWork,
    };
}

export const QUALITY_RFQ_META: RecordMeta<
    QualityRfq,
    QualityRfqJSON,
    QualityRfqBrokenJSON
> & { name: "QualityRfq" } = {
    name: "QualityRfq",
    type: "record",
    repair: repairQualityRfqJSON,
    toJSON: QualityRfqToJSON,
    fromJSON: JSONToQualityRfq,
    fields: {
        legacy: { type: "boolean" },
        repeatClient: { type: "boolean" },
        reasonableTimeline: { type: "boolean" },
        significantSize: { type: "boolean" },
        projectFundingInPlace: { type: "boolean" },
        clearScopeOfWork: { type: "boolean" },
    },
    userFacingKey: null,
    functions: {
        isQuality: {
            fn: calcQualityRfqIsQuality,
            parameterTypes: () => [QUALITY_RFQ_META],
            returnType: { type: "boolean" },
        },
    },
    segments: {},
};

// END MAGIC -- DO NOT EDIT
