import dateParse from "date-fns/parseISO";
import { Decimal } from "decimal.js";
import { find } from "lodash";
import { Project } from "ts-morph";
import { Money, Percentage, Quantity } from "../../clay/common";
import { Link } from "../../clay/link";
import { RecordMeta } from "../../clay/meta";
import {
    anyMap,
    daysAgo,
    isNotNull,
    isNull,
    sumMap,
} from "../../clay/queryFuncs";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";
import {
    JSONToProjectDescriptionDetail,
    ProjectDescriptionDetail,
    ProjectDescriptionDetailJSON,
    ProjectDescriptionDetailToJSON,
    PROJECT_DESCRIPTION_DETAIL_META,
    repairProjectDescriptionDetailJSON,
} from "../project/projectDescriptionDetail/table";
import { Quotation } from "../quotation/table";
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
export type PayoutOption = {
    id: UUID;
    name: string;
    description: string;
    number: Quantity;
    total: Money;
    certifiedForemanAmount: Money;
    previous: Percentage;
    completed: Percentage;
    certifiedForeman: Link<User>;
    manager: Link<User>;
    quotations: Link<Quotation>[];
    projectDescription: ProjectDescriptionDetail;
};

export function calcPayoutOptionAmount(option: PayoutOption): Money {
    return option.total
        .times(option.completed)
        .toDecimalPlaces(2)
        .minus(calcPayoutOptionPreviousAmount(option));
}

export function calcPayoutOptionPreviousAmount(option: PayoutOption): Money {
    return option.total.times(option.previous).toDecimalPlaces(2);
}

export function calcPayoutOptionCertifiedForemanAmount(
    option: PayoutOption
): Money {
    return option.certifiedForemanAmount
        .times(option.completed)
        .toDecimalPlaces(2)
        .minus(calcPayoutOptionCertifiedForemanPreviousAmount(option));
}

export function calcPayoutOptionCertifiedForemanPreviousAmount(
    option: PayoutOption
): Money {
    return option.certifiedForemanAmount
        .times(option.previous)
        .toDecimalPlaces(2);
}

//!Data
export type PayoutCertifiedForeman = {
    certifiedForeman: Link<User>;
    certifiedForemanExpenses: Money;
    certifiedForemanExpensesNote: string;
    legacyDeduction: Money;
    warrantyFundPercentage: Percentage;
    taxHoldbackPercentage: Percentage;
    gstPercentage: Percentage;
    previousTopUp: Money;
    topUp: Money;
    topUpDescription: string;
    progressPayoutFoundsAlreadyPaid: Money;
    hasProgressPayout: boolean;
};

//!Data
export type PayoutManager = {
    user: Link<User>;
    commissionPercentage: Percentage;
    portionPercentage: Percentage;
};

//!Data
export type Commission = {
    user: Link<User>;
    role: Link<Role>;
    commissionPercentage: Percentage;
    portionPercentage: Percentage;
    rolePercentage: Percentage;
    extraPercentage: Percentage;
    extraAmount: Money;
    extraReason: string;
    custom: boolean;
};

//!Data
export type PayoutExpense = {
    id: UUID;
    name: string;
    amount: Money;
};

//!Data
export type Payout = {
    id: UUID;
    addedDateTime: Date | null;
    recordVersion: Version;
    project: Link<Project>;
    user: Link<User>;
    number: Quantity;
    firstDate: Date | null;
    date: Date | null;
    options: PayoutOption[];
    certifiedForemen: PayoutCertifiedForeman[];
    estimators: PayoutManager[];
    managers: PayoutManager[];
    expenses: PayoutExpense[];
    commissions: Commission[];
    note: string;
    employeeProfitShare: Percentage;
    addedToAccountingSoftwareDate: Date | null;
    addedToAccountingSoftwareUser: Link<User>;
    addedToAccountingSoftware: UserAndDate;
    skippedCertifiedForemen: boolean;
    marginVarianceApproved: UserAndDate;
    marginVarianceExplanation: string;
    marginVarianceReason: string;
    marginVarianceDescription: string[];
};

export function calcPayoutTotalCertifiedForemanExpenses(payout: Payout): Money {
    return sumMap(payout.certifiedForemen, (x) => x.certifiedForemanExpenses);
}

export function calcPayoutTotalCertifiedForemanTopups(payout: Payout): Money {
    return sumMap(payout.certifiedForemen, (x) => x.topUp);
}

export function calcPayoutCertifiedForemanHasLowProfitMargin(
    cf: PayoutCertifiedForeman,
    payout: Payout
): boolean {
    return calcPayoutCertifiedForemanProfitMargin(cf, payout).lt(
        new Decimal("0.15")
    );
}

export function calcPayoutCertifiedForemanHasHighProfitMargin(
    cf: PayoutCertifiedForeman,
    payout: Payout
): boolean {
    return calcPayoutCertifiedForemanProfitMargin(cf, payout).gt(
        new Decimal("0.30")
    );
}

export function calcPayoutHasLowRemdalProfitMargin(payout: Payout): boolean {
    return calcPayoutRemdalWholeMargin(payout).lt(new Decimal("0.25"));
}

export function calcPayoutHasHighRemdalProfitMargin(payout: Payout): boolean {
    return calcPayoutRemdalWholeMargin(payout).gt(new Decimal("0.40"));
}

export function calcPayoutHasPotentialMarginVariance(payout: Payout): boolean {
    return false;
}

export function calcPayoutHasMarginVariance(payout: Payout): boolean {
    return (
        calcPayoutHasHighRemdalProfitMargin(payout) ||
        calcPayoutHasLowRemdalProfitMargin(payout) ||
        anyMap(
            payout.certifiedForemen,
            (cf) =>
                calcPayoutCertifiedForemanHasLowProfitMargin(cf, payout) ||
                calcPayoutCertifiedForemanHasHighProfitMargin(cf, payout)
        )
    );
}

export function calcPayoutHasExtraCompensation(payout: Payout): boolean {
    return anyMap(
        payout.commissions,
        (c) => !c.extraAmount.isZero() || !c.extraPercentage.isZero()
    );
}

/*export function calcPayoutHasMarginVariance(payout: Payout): boolean {
  return (
    calcPayoutHasPotentialMarginVariance(payout) ||
    calcPayoutHasExtraCompensation(payout)
  );
}*/

export function computePayoutMarginVarianceDescription(
    payout: Payout,
    users: User[]
): string[] {
    const description: string[] = [];

    if (calcPayoutHasLowRemdalProfitMargin(payout)) {
        description.push(
            "Remdal Profit Margin does not meet our typical range"
        );
    }
    if (calcPayoutHasHighRemdalProfitMargin(payout)) {
        description.push("Remdal Profit Margin exceeds our typical range");
    }
    for (const cf of payout.certifiedForemen) {
        const user = find(users, (user) => user.id.uuid == cf.certifiedForeman);
        if (calcPayoutCertifiedForemanHasLowProfitMargin(cf, payout)) {
            description.push(
                `CF (${user?.name}) Profit Margin does not meet our typical range`
            );
        }
        if (calcPayoutCertifiedForemanHasHighProfitMargin(cf, payout)) {
            description.push(
                `CF (${user?.name}) Profit Margin exceeds our typical range`
            );
        }
    }

    for (const commission of payout.commissions) {
        const user = find(users, (user) => user.id.uuid == commission.user);
        if (!commission.extraAmount.isZero()) {
            description.push(
                `(${
                    user?.name
                }) has $${commission.extraAmount.toString()} extra compensation  because ${
                    commission.extraReason
                }`
            );
        }
        if (!commission.extraPercentage.isZero()) {
            description.push(
                `(${user?.name}) has ${commission.extraPercentage
                    .times(100)
                    .toString()}% extra compensation because ${
                    commission.extraReason
                }`
            );
        }
    }

    return description;
}

export function calcPayoutUngenerated(payout: Payout): boolean {
    return isNull(payout.date) && daysAgo(payout.addedDateTime)!.gt(2);
}

export const PayoutSegments = {
    commissions: ["commissions"],
    certifiedForemen: ["certifiedForemen"],
};

export function calcCommissionEffectivePercentage(
    data: Commission
): Percentage {
    return data.commissionPercentage
        .times(data.portionPercentage)
        .times(data.rolePercentage)
        .plus(data.extraPercentage)
        .toDecimalPlaces(6);
}

export function calcCommissionPayoutAmount(
    data: Commission,
    payout: Payout
): Money {
    return calcPayoutPayoutAmount(payout)
        .times(calcCommissionEffectivePercentage(data))
        .toDecimalPlaces(2)
        .plus(data.extraAmount);
}

export function calcPayoutTotalCertifiedForemanBudgetAmountSubtotal(
    data: Payout
): Money {
    return sumMap(data.certifiedForemen, (x) =>
        calcPayoutCertifiedForemanBudgetAmountSubtotal(x, data)
    );
}

export function calcPayoutTotalCertifiedForemanSubtotal(data: Payout): Money {
    return sumMap(data.certifiedForemen, (x) =>
        calcPayoutCertifiedForemanSubtotal(x, data)
    );
}

export function calcPayoutCertifiedForemanBudgetAmountSubtotal(
    data: PayoutCertifiedForeman,
    payout: Payout
): Money {
    return sumMap(
        payout.options.filter(
            (option) => option.certifiedForeman === data.certifiedForeman
        ),
        (option) => calcPayoutOptionCertifiedForemanAmount(option)
    ).plus(data.topUp);
}

export function calcPayoutCertifiedForemanWarrantyFundContribution(
    data: PayoutCertifiedForeman,
    payout: Payout
): Money {
    return calcPayoutCertifiedForemanBudgetAmountSubtotal(data, payout).times(
        data.warrantyFundPercentage
    );
}

export function calcPayoutCertifiedForemanTotalDeductions(
    data: PayoutCertifiedForeman,
    payout: Payout
): Money {
    return calcPayoutCertifiedForemanWarrantyFundContribution(data, payout)
        .plus(data.certifiedForemanExpenses)
        .plus(data.legacyDeduction);
}

export function calcPayoutCertifiedForemanSubtotal(
    data: PayoutCertifiedForeman,
    payout: Payout
): Money {
    return calcPayoutCertifiedForemanBudgetAmountSubtotal(data, payout).minus(
        calcPayoutCertifiedForemanTotalDeductions(data, payout)
    );
}

export function calcPayoutCertifiedForemanTaxHoldbackPayable(
    data: PayoutCertifiedForeman,
    payout: Payout
): Money {
    return calcPayoutCertifiedForemanSubtotal(data, payout)
        .times(data.taxHoldbackPercentage)
        .toDecimalPlaces(2);
}

export function calcPayoutCertifiedForemanGst(
    data: PayoutCertifiedForeman,
    payout: Payout
): Money {
    return calcPayoutCertifiedForemanSubtotal(data, payout)
        .times(data.gstPercentage)
        .toDecimalPlaces(2);
}

export function calcPayoutCertifiedForemanTotalToCertifiedForeman(
    data: PayoutCertifiedForeman,
    payout: Payout
): Money {
    return calcPayoutCertifiedForemanSubtotal(data, payout).minus(
        calcPayoutCertifiedForemanTaxHoldbackPayable(data, payout)
    );
}

export function calcPayoutCertifiedForemanTotalBonus(
    data: PayoutCertifiedForeman,
    payout: Payout
): Money {
    return calcPayoutCertifiedForemanTotalToCertifiedForeman(data, payout)
        .plus(calcPayoutCertifiedForemanGst(data, payout))
        .minus(data.progressPayoutFoundsAlreadyPaid)
        .toDecimalPlaces(2);
}

export function calcPayoutCertifiedForemanProfitMargin(
    data: PayoutCertifiedForeman,
    payout: Payout
): Percentage {
    return calcPayoutCertifiedForemanSubtotal(data, payout).isZero()
        ? new Decimal(0)
        : calcPayoutCertifiedForemanSubtotal(data, payout).dividedBy(
              calcPayoutCertifiedForemanBudgetAmountSubtotal(data, payout)
          );
}

export function calcPayoutExpensesTotal(payout: Payout): Money {
    return sumMap(payout.expenses, (expense) => expense.amount);
}

export function calcPayoutAmountTotal(payout: Payout): Money {
    return sumMap(payout.options, (option) => calcPayoutOptionAmount(option));
}

export function calcPayoutAmountPreviousTotal(payout: Payout): Money {
    return sumMap(payout.options, (option) =>
        calcPayoutOptionPreviousAmount(option)
    );
}

export function calcPayoutAmountAllTimeTotal(payout: Payout): Money {
    return sumMap(payout.options, (option) => option.total);
}

export function calcPayoutCertifiedForemanAmountTotal(payout: Payout): Money {
    return sumMap(payout.options, (option) =>
        calcPayoutOptionCertifiedForemanAmount(option)
    ).plus(sumMap(payout.certifiedForemen, (option) => option.topUp));
}

export function calcPayoutTotalProjectExpenses(payout: Payout): Money {
    return calcPayoutCertifiedForemanAmountTotal(payout).plus(
        calcPayoutTotalNonCertifiedForemanExpenses(payout)
    );
}

export function calcPayoutCertifiedForemanPreviousAmountTotal(
    payout: Payout
): Money {
    return sumMap(payout.options, (option) =>
        calcPayoutOptionCertifiedForemanPreviousAmount(option)
    ).plus(sumMap(payout.certifiedForemen, (option) => option.previousTopUp));
}

export function calcPayoutCertifiedForemanAllTimeAmountTotal(
    payout: Payout
): Money {
    return sumMap(
        payout.options,
        (option) => option.certifiedForemanAmount
    ).plus(
        sumMap(payout.certifiedForemen, (option) =>
            option.topUp.plus(option.previousTopUp)
        )
    );
}

export function calcPayoutHrPayrollSafetyAdmin(payout: Payout): Money {
    return calcPayoutAmountTotal(payout)
        .times(new Decimal("0.01"))
        .toDecimalPlaces(2);
}

export function calcPayoutEmployeeProfitShare(payout: Payout): Money {
    return calcPayoutCertifiedForemanAmountTotal(payout)
        .times(payout.employeeProfitShare)
        .toDecimalPlaces(2);
}

export function calcPayoutTotalNonCertifiedForemanExpenses(
    payout: Payout
): Money {
    return calcPayoutExpensesTotal(payout)
        .plus(calcPayoutHrPayrollSafetyAdmin(payout))
        .plus(calcPayoutEmployeeProfitShare(payout));
}

export function calcPayoutCertifiedForemanWholeMargin(
    payout: Payout
): Percentage {
    return calcPayoutCertifiedForemanAmountTotal(payout)
        .dividedBy(calcPayoutAmountTotal(payout))
        .toDecimalPlaces(6);
}

export function calcPayoutNonCertifiedForemanExpensesWholeMargin(
    payout: Payout
): Percentage {
    return calcPayoutTotalNonCertifiedForemanExpenses(payout)
        .dividedBy(calcPayoutAmountTotal(payout))
        .toDecimalPlaces(6);
}

export function calcPayoutRemdalWholeMargin(payout: Payout): Percentage {
    return calcPayoutRemdalAmount(payout)
        .dividedBy(calcPayoutAmountTotal(payout))
        .toDecimalPlaces(6);
}

export function calcPayoutRemdalAmount(payout: Payout): Money {
    return calcPayoutAmountTotal(payout)
        .minus(calcPayoutTotalNonCertifiedForemanExpenses(payout))
        .minus(calcPayoutCertifiedForemanAmountTotal(payout));
}

export function calcPayoutProjectRevenue(payout: Payout): Money {
    return sumMap(payout.options, (option) => option.total);
}

export function calcPayoutPayoutDivisor(payout: Payout): Quantity {
    return calcPayoutProjectRevenue(payout).lessThan(2000)
        ? new Decimal("5")
        : calcPayoutProjectRevenue(payout).lessThan(10000)
        ? new Decimal("6")
        : new Decimal("7");
}

export function calcPayoutPayoutAmount(payout: Payout): Money {
    return calcPayoutRemdalAmount(payout)
        .dividedBy(calcPayoutPayoutDivisor(payout))
        .toDecimalPlaces(2);
}

export function calcPayoutOriginalContractAmount(payout: Payout): Money {
    return sumMap(
        payout.options.filter((option) => option.number.isZero()),
        (option) => calcPayoutOptionCertifiedForemanAmount(option)
    );
}

export function calcPayoutIsUnaddedToAccountingLabel(payout: Payout): string {
    return isNotNull(payout.marginVarianceApproved)
        ? "New Payout (Margin Variance)"
        : "New Payout";
}

export function calcPayoutIsUnaddedToAccounting(payout: Payout): boolean {
    return (
        isNull(payout.addedToAccountingSoftware.date) && !isNull(payout.date)
    );
}

export function calcPayoutExtras(payout: Payout): PayoutOption[] {
    return payout.options.filter((option) => !option.number.isZero());
}

export function calcPayoutIsComplete(payout: Payout): boolean {
    return (
        !anyMap(payout.options, (option) => option.completed.lt(1)) &&
        !payout.skippedCertifiedForemen
    );
}

// BEGIN MAGIC -- DO NOT EDIT
export type PayoutOptionJSON = {
    id: string;
    name: string;
    description: string;
    number: string;
    total: string;
    certifiedForemanAmount: string;
    previous: string;
    completed: string;
    certifiedForeman: string | null;
    manager: string | null;
    quotations: (string | null)[];
    projectDescription: ProjectDescriptionDetailJSON;
};

export function JSONToPayoutOption(json: PayoutOptionJSON): PayoutOption {
    return {
        id: { uuid: json.id },
        name: json.name,
        description: json.description,
        number: new Decimal(json.number),
        total: new Decimal(json.total),
        certifiedForemanAmount: new Decimal(json.certifiedForemanAmount),
        previous: new Decimal(json.previous),
        completed: new Decimal(json.completed),
        certifiedForeman: json.certifiedForeman,
        manager: json.manager,
        quotations: json.quotations.map((inner) => inner),
        projectDescription: JSONToProjectDescriptionDetail(
            json.projectDescription
        ),
    };
}
export type PayoutOptionBrokenJSON = {
    id?: string;
    name?: string;
    description?: string;
    number?: string;
    total?: string;
    certifiedForemanAmount?: string;
    previous?: string;
    completed?: string;
    certifiedForeman?: string | null;
    manager?: string | null;
    quotations?: (string | null)[];
    projectDescription?: ProjectDescriptionDetailJSON;
};

export function newPayoutOption(): PayoutOption {
    return JSONToPayoutOption(repairPayoutOptionJSON(undefined));
}
export function repairPayoutOptionJSON(
    json: PayoutOptionBrokenJSON | undefined
): PayoutOptionJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            description: json.description || "",
            number: json.number || "0",
            total: json.total || "0",
            certifiedForemanAmount: json.certifiedForemanAmount || "0",
            previous: json.previous || "0",
            completed: json.completed || "0",
            certifiedForeman: json.certifiedForeman || null,
            manager: json.manager || null,
            quotations: (json.quotations || []).map((inner) => inner || null),
            projectDescription: repairProjectDescriptionDetailJSON(
                json.projectDescription
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            description: undefined || "",
            number: undefined || "0",
            total: undefined || "0",
            certifiedForemanAmount: undefined || "0",
            previous: undefined || "0",
            completed: undefined || "0",
            certifiedForeman: undefined || null,
            manager: undefined || null,
            quotations: (undefined || []).map((inner) => inner || null),
            projectDescription: repairProjectDescriptionDetailJSON(undefined),
        };
    }
}

export function PayoutOptionToJSON(value: PayoutOption): PayoutOptionJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        description: value.description,
        number: value.number.toString(),
        total: value.total.toString(),
        certifiedForemanAmount: value.certifiedForemanAmount.toString(),
        previous: value.previous.toString(),
        completed: value.completed.toString(),
        certifiedForeman: value.certifiedForeman,
        manager: value.manager,
        quotations: value.quotations.map((inner) => inner),
        projectDescription: ProjectDescriptionDetailToJSON(
            value.projectDescription
        ),
    };
}

export const PAYOUT_OPTION_META: RecordMeta<
    PayoutOption,
    PayoutOptionJSON,
    PayoutOptionBrokenJSON
> & { name: "PayoutOption" } = {
    name: "PayoutOption",
    type: "record",
    repair: repairPayoutOptionJSON,
    toJSON: PayoutOptionToJSON,
    fromJSON: JSONToPayoutOption,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        description: { type: "string" },
        number: { type: "quantity" },
        total: { type: "money" },
        certifiedForemanAmount: { type: "money" },
        previous: { type: "percentage" },
        completed: { type: "percentage" },
        certifiedForeman: { type: "uuid", linkTo: "User" },
        manager: { type: "uuid", linkTo: "User" },
        quotations: {
            type: "array",
            items: { type: "uuid", linkTo: "Quotation" },
        },
        projectDescription: PROJECT_DESCRIPTION_DETAIL_META,
    },
    userFacingKey: "number",
    functions: {
        amount: {
            fn: calcPayoutOptionAmount,
            parameterTypes: () => [PAYOUT_OPTION_META],
            returnType: { type: "money" },
        },
        previousAmount: {
            fn: calcPayoutOptionPreviousAmount,
            parameterTypes: () => [PAYOUT_OPTION_META],
            returnType: { type: "money" },
        },
        certifiedForemanAmount: {
            fn: calcPayoutOptionCertifiedForemanAmount,
            parameterTypes: () => [PAYOUT_OPTION_META],
            returnType: { type: "money" },
        },
        certifiedForemanPreviousAmount: {
            fn: calcPayoutOptionCertifiedForemanPreviousAmount,
            parameterTypes: () => [PAYOUT_OPTION_META],
            returnType: { type: "money" },
        },
    },
    segments: {},
};

export type PayoutCertifiedForemanJSON = {
    certifiedForeman: string | null;
    certifiedForemanExpenses: string;
    certifiedForemanExpensesNote: string;
    legacyDeduction: string;
    warrantyFundPercentage: string;
    taxHoldbackPercentage: string;
    gstPercentage: string;
    previousTopUp: string;
    topUp: string;
    topUpDescription: string;
    progressPayoutFoundsAlreadyPaid: string;
    hasProgressPayout: boolean;
};

export function JSONToPayoutCertifiedForeman(
    json: PayoutCertifiedForemanJSON
): PayoutCertifiedForeman {
    return {
        certifiedForeman: json.certifiedForeman,
        certifiedForemanExpenses: new Decimal(json.certifiedForemanExpenses),
        certifiedForemanExpensesNote: json.certifiedForemanExpensesNote,
        legacyDeduction: new Decimal(json.legacyDeduction),
        warrantyFundPercentage: new Decimal(json.warrantyFundPercentage),
        taxHoldbackPercentage: new Decimal(json.taxHoldbackPercentage),
        gstPercentage: new Decimal(json.gstPercentage),
        previousTopUp: new Decimal(json.previousTopUp),
        topUp: new Decimal(json.topUp),
        topUpDescription: json.topUpDescription,
        progressPayoutFoundsAlreadyPaid: new Decimal(
            json.progressPayoutFoundsAlreadyPaid
        ),
        hasProgressPayout: json.hasProgressPayout,
    };
}
export type PayoutCertifiedForemanBrokenJSON = {
    certifiedForeman?: string | null;
    certifiedForemanExpenses?: string;
    certifiedForemanExpensesNote?: string;
    legacyDeduction?: string;
    warrantyFundPercentage?: string;
    taxHoldbackPercentage?: string;
    gstPercentage?: string;
    previousTopUp?: string;
    topUp?: string;
    topUpDescription?: string;
    progressPayoutFoundsAlreadyPaid?: string;
    hasProgressPayout?: boolean;
};

export function newPayoutCertifiedForeman(): PayoutCertifiedForeman {
    return JSONToPayoutCertifiedForeman(
        repairPayoutCertifiedForemanJSON(undefined)
    );
}
export function repairPayoutCertifiedForemanJSON(
    json: PayoutCertifiedForemanBrokenJSON | undefined
): PayoutCertifiedForemanJSON {
    if (json) {
        return {
            certifiedForeman: json.certifiedForeman || null,
            certifiedForemanExpenses: json.certifiedForemanExpenses || "0",
            certifiedForemanExpensesNote:
                json.certifiedForemanExpensesNote || "",
            legacyDeduction: json.legacyDeduction || "0",
            warrantyFundPercentage: json.warrantyFundPercentage || "0",
            taxHoldbackPercentage: json.taxHoldbackPercentage || "0",
            gstPercentage: json.gstPercentage || "0",
            previousTopUp: json.previousTopUp || "0",
            topUp: json.topUp || "0",
            topUpDescription: json.topUpDescription || "",
            progressPayoutFoundsAlreadyPaid:
                json.progressPayoutFoundsAlreadyPaid || "0",
            hasProgressPayout: json.hasProgressPayout || false,
        };
    } else {
        return {
            certifiedForeman: undefined || null,
            certifiedForemanExpenses: undefined || "0",
            certifiedForemanExpensesNote: undefined || "",
            legacyDeduction: undefined || "0",
            warrantyFundPercentage: undefined || "0",
            taxHoldbackPercentage: undefined || "0",
            gstPercentage: undefined || "0",
            previousTopUp: undefined || "0",
            topUp: undefined || "0",
            topUpDescription: undefined || "",
            progressPayoutFoundsAlreadyPaid: undefined || "0",
            hasProgressPayout: undefined || false,
        };
    }
}

export function PayoutCertifiedForemanToJSON(
    value: PayoutCertifiedForeman
): PayoutCertifiedForemanJSON {
    return {
        certifiedForeman: value.certifiedForeman,
        certifiedForemanExpenses: value.certifiedForemanExpenses.toString(),
        certifiedForemanExpensesNote: value.certifiedForemanExpensesNote,
        legacyDeduction: value.legacyDeduction.toString(),
        warrantyFundPercentage: value.warrantyFundPercentage.toString(),
        taxHoldbackPercentage: value.taxHoldbackPercentage.toString(),
        gstPercentage: value.gstPercentage.toString(),
        previousTopUp: value.previousTopUp.toString(),
        topUp: value.topUp.toString(),
        topUpDescription: value.topUpDescription,
        progressPayoutFoundsAlreadyPaid:
            value.progressPayoutFoundsAlreadyPaid.toString(),
        hasProgressPayout: value.hasProgressPayout,
    };
}

export const PAYOUT_CERTIFIED_FOREMAN_META: RecordMeta<
    PayoutCertifiedForeman,
    PayoutCertifiedForemanJSON,
    PayoutCertifiedForemanBrokenJSON
> & { name: "PayoutCertifiedForeman" } = {
    name: "PayoutCertifiedForeman",
    type: "record",
    repair: repairPayoutCertifiedForemanJSON,
    toJSON: PayoutCertifiedForemanToJSON,
    fromJSON: JSONToPayoutCertifiedForeman,
    fields: {
        certifiedForeman: { type: "uuid", linkTo: "User" },
        certifiedForemanExpenses: { type: "money" },
        certifiedForemanExpensesNote: { type: "string" },
        legacyDeduction: { type: "money" },
        warrantyFundPercentage: { type: "percentage" },
        taxHoldbackPercentage: { type: "percentage" },
        gstPercentage: { type: "percentage" },
        previousTopUp: { type: "money" },
        topUp: { type: "money" },
        topUpDescription: { type: "string" },
        progressPayoutFoundsAlreadyPaid: { type: "money" },
        hasProgressPayout: { type: "boolean" },
    },
    userFacingKey: null,
    functions: {
        hasLowProfitMargin: {
            fn: calcPayoutCertifiedForemanHasLowProfitMargin,
            parameterTypes: () => [PAYOUT_CERTIFIED_FOREMAN_META, PAYOUT_META],
            returnType: { type: "boolean" },
        },
        hasHighProfitMargin: {
            fn: calcPayoutCertifiedForemanHasHighProfitMargin,
            parameterTypes: () => [PAYOUT_CERTIFIED_FOREMAN_META, PAYOUT_META],
            returnType: { type: "boolean" },
        },
        budgetAmountSubtotal: {
            fn: calcPayoutCertifiedForemanBudgetAmountSubtotal,
            parameterTypes: () => [PAYOUT_CERTIFIED_FOREMAN_META, PAYOUT_META],
            returnType: { type: "money" },
        },
        warrantyFundContribution: {
            fn: calcPayoutCertifiedForemanWarrantyFundContribution,
            parameterTypes: () => [PAYOUT_CERTIFIED_FOREMAN_META, PAYOUT_META],
            returnType: { type: "money" },
        },
        totalDeductions: {
            fn: calcPayoutCertifiedForemanTotalDeductions,
            parameterTypes: () => [PAYOUT_CERTIFIED_FOREMAN_META, PAYOUT_META],
            returnType: { type: "money" },
        },
        subtotal: {
            fn: calcPayoutCertifiedForemanSubtotal,
            parameterTypes: () => [PAYOUT_CERTIFIED_FOREMAN_META, PAYOUT_META],
            returnType: { type: "money" },
        },
        taxHoldbackPayable: {
            fn: calcPayoutCertifiedForemanTaxHoldbackPayable,
            parameterTypes: () => [PAYOUT_CERTIFIED_FOREMAN_META, PAYOUT_META],
            returnType: { type: "money" },
        },
        gst: {
            fn: calcPayoutCertifiedForemanGst,
            parameterTypes: () => [PAYOUT_CERTIFIED_FOREMAN_META, PAYOUT_META],
            returnType: { type: "money" },
        },
        totalToCertifiedForeman: {
            fn: calcPayoutCertifiedForemanTotalToCertifiedForeman,
            parameterTypes: () => [PAYOUT_CERTIFIED_FOREMAN_META, PAYOUT_META],
            returnType: { type: "money" },
        },
        totalBonus: {
            fn: calcPayoutCertifiedForemanTotalBonus,
            parameterTypes: () => [PAYOUT_CERTIFIED_FOREMAN_META, PAYOUT_META],
            returnType: { type: "money" },
        },
        profitMargin: {
            fn: calcPayoutCertifiedForemanProfitMargin,
            parameterTypes: () => [PAYOUT_CERTIFIED_FOREMAN_META, PAYOUT_META],
            returnType: { type: "percentage" },
        },
    },
    segments: {},
};

export type PayoutManagerJSON = {
    user: string | null;
    commissionPercentage: string;
    portionPercentage: string;
};

export function JSONToPayoutManager(json: PayoutManagerJSON): PayoutManager {
    return {
        user: json.user,
        commissionPercentage: new Decimal(json.commissionPercentage),
        portionPercentage: new Decimal(json.portionPercentage),
    };
}
export type PayoutManagerBrokenJSON = {
    user?: string | null;
    commissionPercentage?: string;
    portionPercentage?: string;
};

export function newPayoutManager(): PayoutManager {
    return JSONToPayoutManager(repairPayoutManagerJSON(undefined));
}
export function repairPayoutManagerJSON(
    json: PayoutManagerBrokenJSON | undefined
): PayoutManagerJSON {
    if (json) {
        return {
            user: json.user || null,
            commissionPercentage: json.commissionPercentage || "0",
            portionPercentage: json.portionPercentage || "0",
        };
    } else {
        return {
            user: undefined || null,
            commissionPercentage: undefined || "0",
            portionPercentage: undefined || "0",
        };
    }
}

export function PayoutManagerToJSON(value: PayoutManager): PayoutManagerJSON {
    return {
        user: value.user,
        commissionPercentage: value.commissionPercentage.toString(),
        portionPercentage: value.portionPercentage.toString(),
    };
}

export const PAYOUT_MANAGER_META: RecordMeta<
    PayoutManager,
    PayoutManagerJSON,
    PayoutManagerBrokenJSON
> & { name: "PayoutManager" } = {
    name: "PayoutManager",
    type: "record",
    repair: repairPayoutManagerJSON,
    toJSON: PayoutManagerToJSON,
    fromJSON: JSONToPayoutManager,
    fields: {
        user: { type: "uuid", linkTo: "User" },
        commissionPercentage: { type: "percentage" },
        portionPercentage: { type: "percentage" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type CommissionJSON = {
    user: string | null;
    role: string | null;
    commissionPercentage: string;
    portionPercentage: string;
    rolePercentage: string;
    extraPercentage: string;
    extraAmount: string;
    extraReason: string;
    custom: boolean;
};

export function JSONToCommission(json: CommissionJSON): Commission {
    return {
        user: json.user,
        role: json.role,
        commissionPercentage: new Decimal(json.commissionPercentage),
        portionPercentage: new Decimal(json.portionPercentage),
        rolePercentage: new Decimal(json.rolePercentage),
        extraPercentage: new Decimal(json.extraPercentage),
        extraAmount: new Decimal(json.extraAmount),
        extraReason: json.extraReason,
        custom: json.custom,
    };
}
export type CommissionBrokenJSON = {
    user?: string | null;
    role?: string | null;
    commissionPercentage?: string;
    portionPercentage?: string;
    rolePercentage?: string;
    extraPercentage?: string;
    extraAmount?: string;
    extraReason?: string;
    custom?: boolean;
};

export function newCommission(): Commission {
    return JSONToCommission(repairCommissionJSON(undefined));
}
export function repairCommissionJSON(
    json: CommissionBrokenJSON | undefined
): CommissionJSON {
    if (json) {
        return {
            user: json.user || null,
            role: json.role || null,
            commissionPercentage: json.commissionPercentage || "0",
            portionPercentage: json.portionPercentage || "0",
            rolePercentage: json.rolePercentage || "0",
            extraPercentage: json.extraPercentage || "0",
            extraAmount: json.extraAmount || "0",
            extraReason: json.extraReason || "",
            custom: json.custom || false,
        };
    } else {
        return {
            user: undefined || null,
            role: undefined || null,
            commissionPercentage: undefined || "0",
            portionPercentage: undefined || "0",
            rolePercentage: undefined || "0",
            extraPercentage: undefined || "0",
            extraAmount: undefined || "0",
            extraReason: undefined || "",
            custom: undefined || false,
        };
    }
}

export function CommissionToJSON(value: Commission): CommissionJSON {
    return {
        user: value.user,
        role: value.role,
        commissionPercentage: value.commissionPercentage.toString(),
        portionPercentage: value.portionPercentage.toString(),
        rolePercentage: value.rolePercentage.toString(),
        extraPercentage: value.extraPercentage.toString(),
        extraAmount: value.extraAmount.toString(),
        extraReason: value.extraReason,
        custom: value.custom,
    };
}

export const COMMISSION_META: RecordMeta<
    Commission,
    CommissionJSON,
    CommissionBrokenJSON
> & { name: "Commission" } = {
    name: "Commission",
    type: "record",
    repair: repairCommissionJSON,
    toJSON: CommissionToJSON,
    fromJSON: JSONToCommission,
    fields: {
        user: { type: "uuid", linkTo: "User" },
        role: { type: "uuid", linkTo: "Role" },
        commissionPercentage: { type: "percentage" },
        portionPercentage: { type: "percentage" },
        rolePercentage: { type: "percentage" },
        extraPercentage: { type: "percentage" },
        extraAmount: { type: "money" },
        extraReason: { type: "string" },
        custom: { type: "boolean" },
    },
    userFacingKey: null,
    functions: {
        effectivePercentage: {
            fn: calcCommissionEffectivePercentage,
            parameterTypes: () => [COMMISSION_META],
            returnType: { type: "percentage" },
        },
        payoutAmount: {
            fn: calcCommissionPayoutAmount,
            parameterTypes: () => [COMMISSION_META, PAYOUT_META],
            returnType: { type: "money" },
        },
    },
    segments: {},
};

export type PayoutExpenseJSON = {
    id: string;
    name: string;
    amount: string;
};

export function JSONToPayoutExpense(json: PayoutExpenseJSON): PayoutExpense {
    return {
        id: { uuid: json.id },
        name: json.name,
        amount: new Decimal(json.amount),
    };
}
export type PayoutExpenseBrokenJSON = {
    id?: string;
    name?: string;
    amount?: string;
};

export function newPayoutExpense(): PayoutExpense {
    return JSONToPayoutExpense(repairPayoutExpenseJSON(undefined));
}
export function repairPayoutExpenseJSON(
    json: PayoutExpenseBrokenJSON | undefined
): PayoutExpenseJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            amount: json.amount || "0",
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            amount: undefined || "0",
        };
    }
}

export function PayoutExpenseToJSON(value: PayoutExpense): PayoutExpenseJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        amount: value.amount.toString(),
    };
}

export const PAYOUT_EXPENSE_META: RecordMeta<
    PayoutExpense,
    PayoutExpenseJSON,
    PayoutExpenseBrokenJSON
> & { name: "PayoutExpense" } = {
    name: "PayoutExpense",
    type: "record",
    repair: repairPayoutExpenseJSON,
    toJSON: PayoutExpenseToJSON,
    fromJSON: JSONToPayoutExpense,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        amount: { type: "money" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type PayoutJSON = {
    id: string;
    addedDateTime: string | null;
    recordVersion: number | null;
    project: string | null;
    user: string | null;
    number: string;
    firstDate: string | null;
    date: string | null;
    options: PayoutOptionJSON[];
    certifiedForemen: PayoutCertifiedForemanJSON[];
    estimators: PayoutManagerJSON[];
    managers: PayoutManagerJSON[];
    expenses: PayoutExpenseJSON[];
    commissions: CommissionJSON[];
    note: string;
    employeeProfitShare: string;
    addedToAccountingSoftwareDate: string | null;
    addedToAccountingSoftwareUser: string | null;
    addedToAccountingSoftware: UserAndDateJSON;
    skippedCertifiedForemen: boolean;
    marginVarianceApproved: UserAndDateJSON;
    marginVarianceExplanation: string;
    marginVarianceReason: string;
    marginVarianceDescription: string[];
};

export function JSONToPayout(json: PayoutJSON): Payout {
    return {
        id: { uuid: json.id },
        addedDateTime:
            json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
        recordVersion: { version: json.recordVersion },
        project: json.project,
        user: json.user,
        number: new Decimal(json.number),
        firstDate: json.firstDate !== null ? dateParse(json.firstDate) : null,
        date: json.date !== null ? dateParse(json.date) : null,
        options: json.options.map((inner) => JSONToPayoutOption(inner)),
        certifiedForemen: json.certifiedForemen.map((inner) =>
            JSONToPayoutCertifiedForeman(inner)
        ),
        estimators: json.estimators.map((inner) => JSONToPayoutManager(inner)),
        managers: json.managers.map((inner) => JSONToPayoutManager(inner)),
        expenses: json.expenses.map((inner) => JSONToPayoutExpense(inner)),
        commissions: json.commissions.map((inner) => JSONToCommission(inner)),
        note: json.note,
        employeeProfitShare: new Decimal(json.employeeProfitShare),
        addedToAccountingSoftwareDate:
            json.addedToAccountingSoftwareDate !== null
                ? dateParse(json.addedToAccountingSoftwareDate)
                : null,
        addedToAccountingSoftwareUser: json.addedToAccountingSoftwareUser,
        addedToAccountingSoftware: JSONToUserAndDate(
            json.addedToAccountingSoftware
        ),
        skippedCertifiedForemen: json.skippedCertifiedForemen,
        marginVarianceApproved: JSONToUserAndDate(json.marginVarianceApproved),
        marginVarianceExplanation: json.marginVarianceExplanation,
        marginVarianceReason: json.marginVarianceReason,
        marginVarianceDescription: json.marginVarianceDescription.map(
            (inner) => inner
        ),
    };
}
export type PayoutBrokenJSON = {
    id?: string;
    addedDateTime?: string | null;
    recordVersion?: number | null;
    project?: string | null;
    user?: string | null;
    number?: string;
    firstDate?: string | null;
    date?: string | null;
    options?: PayoutOptionJSON[];
    certifiedForemen?: PayoutCertifiedForemanJSON[];
    estimators?: PayoutManagerJSON[];
    managers?: PayoutManagerJSON[];
    expenses?: PayoutExpenseJSON[];
    commissions?: CommissionJSON[];
    note?: string;
    employeeProfitShare?: string;
    addedToAccountingSoftwareDate?: string | null;
    addedToAccountingSoftwareUser?: string | null;
    addedToAccountingSoftware?: UserAndDateJSON;
    skippedCertifiedForemen?: boolean;
    marginVarianceApproved?: UserAndDateJSON;
    marginVarianceExplanation?: string;
    marginVarianceReason?: string;
    marginVarianceDescription?: string[];
};

export function newPayout(): Payout {
    return JSONToPayout(repairPayoutJSON(undefined));
}
export function repairPayoutJSON(
    json: PayoutBrokenJSON | undefined
): PayoutJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            addedDateTime: json.addedDateTime
                ? new Date(json.addedDateTime!).toISOString()
                : null,
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            project: json.project || null,
            user: json.user || null,
            number: json.number || "0",
            firstDate: json.firstDate
                ? new Date(json.firstDate!).toISOString()
                : null,
            date: json.date ? new Date(json.date!).toISOString() : null,
            options: (json.options || []).map((inner) =>
                repairPayoutOptionJSON(inner)
            ),
            certifiedForemen: (json.certifiedForemen || []).map((inner) =>
                repairPayoutCertifiedForemanJSON(inner)
            ),
            estimators: (json.estimators || []).map((inner) =>
                repairPayoutManagerJSON(inner)
            ),
            managers: (json.managers || []).map((inner) =>
                repairPayoutManagerJSON(inner)
            ),
            expenses: (json.expenses || []).map((inner) =>
                repairPayoutExpenseJSON(inner)
            ),
            commissions: (json.commissions || []).map((inner) =>
                repairCommissionJSON(inner)
            ),
            note: json.note || "",
            employeeProfitShare: json.employeeProfitShare || "0",
            addedToAccountingSoftwareDate: json.addedToAccountingSoftwareDate
                ? new Date(json.addedToAccountingSoftwareDate!).toISOString()
                : null,
            addedToAccountingSoftwareUser:
                json.addedToAccountingSoftwareUser || null,
            addedToAccountingSoftware: repairUserAndDateJSON(
                json.addedToAccountingSoftware
            ),
            skippedCertifiedForemen: json.skippedCertifiedForemen || false,
            marginVarianceApproved: repairUserAndDateJSON(
                json.marginVarianceApproved
            ),
            marginVarianceExplanation: json.marginVarianceExplanation || "",
            marginVarianceReason: json.marginVarianceReason || "",
            marginVarianceDescription: (
                json.marginVarianceDescription || []
            ).map((inner) => inner || ""),
        };
    } else {
        return {
            id: undefined || genUUID(),
            addedDateTime: undefined
                ? new Date(undefined!).toISOString()
                : null,
            recordVersion: null,
            project: undefined || null,
            user: undefined || null,
            number: undefined || "0",
            firstDate: undefined ? new Date(undefined!).toISOString() : null,
            date: undefined ? new Date(undefined!).toISOString() : null,
            options: (undefined || []).map((inner) =>
                repairPayoutOptionJSON(inner)
            ),
            certifiedForemen: (undefined || []).map((inner) =>
                repairPayoutCertifiedForemanJSON(inner)
            ),
            estimators: (undefined || []).map((inner) =>
                repairPayoutManagerJSON(inner)
            ),
            managers: (undefined || []).map((inner) =>
                repairPayoutManagerJSON(inner)
            ),
            expenses: (undefined || []).map((inner) =>
                repairPayoutExpenseJSON(inner)
            ),
            commissions: (undefined || []).map((inner) =>
                repairCommissionJSON(inner)
            ),
            note: undefined || "",
            employeeProfitShare: undefined || "0",
            addedToAccountingSoftwareDate: undefined
                ? new Date(undefined!).toISOString()
                : null,
            addedToAccountingSoftwareUser: undefined || null,
            addedToAccountingSoftware: repairUserAndDateJSON(undefined),
            skippedCertifiedForemen: undefined || false,
            marginVarianceApproved: repairUserAndDateJSON(undefined),
            marginVarianceExplanation: undefined || "",
            marginVarianceReason: undefined || "",
            marginVarianceDescription: (undefined || []).map(
                (inner) => inner || ""
            ),
        };
    }
}

export function PayoutToJSON(value: Payout): PayoutJSON {
    return {
        id: value.id.uuid,
        addedDateTime:
            value.addedDateTime !== null
                ? value.addedDateTime.toISOString()
                : null,
        recordVersion: value.recordVersion.version,
        project: value.project,
        user: value.user,
        number: value.number.toString(),
        firstDate:
            value.firstDate !== null ? value.firstDate.toISOString() : null,
        date: value.date !== null ? value.date.toISOString() : null,
        options: value.options.map((inner) => PayoutOptionToJSON(inner)),
        certifiedForemen: value.certifiedForemen.map((inner) =>
            PayoutCertifiedForemanToJSON(inner)
        ),
        estimators: value.estimators.map((inner) => PayoutManagerToJSON(inner)),
        managers: value.managers.map((inner) => PayoutManagerToJSON(inner)),
        expenses: value.expenses.map((inner) => PayoutExpenseToJSON(inner)),
        commissions: value.commissions.map((inner) => CommissionToJSON(inner)),
        note: value.note,
        employeeProfitShare: value.employeeProfitShare.toString(),
        addedToAccountingSoftwareDate:
            value.addedToAccountingSoftwareDate !== null
                ? value.addedToAccountingSoftwareDate.toISOString()
                : null,
        addedToAccountingSoftwareUser: value.addedToAccountingSoftwareUser,
        addedToAccountingSoftware: UserAndDateToJSON(
            value.addedToAccountingSoftware
        ),
        skippedCertifiedForemen: value.skippedCertifiedForemen,
        marginVarianceApproved: UserAndDateToJSON(value.marginVarianceApproved),
        marginVarianceExplanation: value.marginVarianceExplanation,
        marginVarianceReason: value.marginVarianceReason,
        marginVarianceDescription: value.marginVarianceDescription.map(
            (inner) => inner
        ),
    };
}

export const PAYOUT_META: RecordMeta<Payout, PayoutJSON, PayoutBrokenJSON> & {
    name: "Payout";
} = {
    name: "Payout",
    type: "record",
    repair: repairPayoutJSON,
    toJSON: PayoutToJSON,
    fromJSON: JSONToPayout,
    fields: {
        id: { type: "uuid" },
        addedDateTime: { type: "datetime" },
        recordVersion: { type: "version" },
        project: { type: "uuid", linkTo: "Project" },
        user: { type: "uuid", linkTo: "User" },
        number: { type: "quantity" },
        firstDate: { type: "datetime" },
        date: { type: "datetime" },
        options: { type: "array", items: PAYOUT_OPTION_META },
        certifiedForemen: {
            type: "array",
            items: PAYOUT_CERTIFIED_FOREMAN_META,
        },
        estimators: { type: "array", items: PAYOUT_MANAGER_META },
        managers: { type: "array", items: PAYOUT_MANAGER_META },
        expenses: { type: "array", items: PAYOUT_EXPENSE_META },
        commissions: { type: "array", items: COMMISSION_META },
        note: { type: "string" },
        employeeProfitShare: { type: "percentage" },
        addedToAccountingSoftwareDate: { type: "datetime" },
        addedToAccountingSoftwareUser: { type: "uuid", linkTo: "User" },
        addedToAccountingSoftware: USER_AND_DATE_META,
        skippedCertifiedForemen: { type: "boolean" },
        marginVarianceApproved: USER_AND_DATE_META,
        marginVarianceExplanation: { type: "string" },
        marginVarianceReason: { type: "string" },
        marginVarianceDescription: { type: "array", items: { type: "string" } },
    },
    userFacingKey: "number",
    functions: {
        totalCertifiedForemanExpenses: {
            fn: calcPayoutTotalCertifiedForemanExpenses,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        totalCertifiedForemanTopups: {
            fn: calcPayoutTotalCertifiedForemanTopups,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        hasLowRemdalProfitMargin: {
            fn: calcPayoutHasLowRemdalProfitMargin,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "boolean" },
        },
        hasHighRemdalProfitMargin: {
            fn: calcPayoutHasHighRemdalProfitMargin,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "boolean" },
        },
        hasPotentialMarginVariance: {
            fn: calcPayoutHasPotentialMarginVariance,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "boolean" },
        },
        hasMarginVariance: {
            fn: calcPayoutHasMarginVariance,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "boolean" },
        },
        hasExtraCompensation: {
            fn: calcPayoutHasExtraCompensation,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "boolean" },
        },
        ungenerated: {
            fn: calcPayoutUngenerated,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "boolean" },
        },
        totalCertifiedForemanBudgetAmountSubtotal: {
            fn: calcPayoutTotalCertifiedForemanBudgetAmountSubtotal,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        totalCertifiedForemanSubtotal: {
            fn: calcPayoutTotalCertifiedForemanSubtotal,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        expensesTotal: {
            fn: calcPayoutExpensesTotal,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        amountTotal: {
            fn: calcPayoutAmountTotal,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        amountPreviousTotal: {
            fn: calcPayoutAmountPreviousTotal,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        amountAllTimeTotal: {
            fn: calcPayoutAmountAllTimeTotal,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        certifiedForemanAmountTotal: {
            fn: calcPayoutCertifiedForemanAmountTotal,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        totalProjectExpenses: {
            fn: calcPayoutTotalProjectExpenses,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        certifiedForemanPreviousAmountTotal: {
            fn: calcPayoutCertifiedForemanPreviousAmountTotal,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        certifiedForemanAllTimeAmountTotal: {
            fn: calcPayoutCertifiedForemanAllTimeAmountTotal,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        hrPayrollSafetyAdmin: {
            fn: calcPayoutHrPayrollSafetyAdmin,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        employeeProfitShare: {
            fn: calcPayoutEmployeeProfitShare,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        totalNonCertifiedForemanExpenses: {
            fn: calcPayoutTotalNonCertifiedForemanExpenses,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        certifiedForemanWholeMargin: {
            fn: calcPayoutCertifiedForemanWholeMargin,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "percentage" },
        },
        nonCertifiedForemanExpensesWholeMargin: {
            fn: calcPayoutNonCertifiedForemanExpensesWholeMargin,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "percentage" },
        },
        remdalWholeMargin: {
            fn: calcPayoutRemdalWholeMargin,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "percentage" },
        },
        remdalAmount: {
            fn: calcPayoutRemdalAmount,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        projectRevenue: {
            fn: calcPayoutProjectRevenue,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        payoutDivisor: {
            fn: calcPayoutPayoutDivisor,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "quantity" },
        },
        payoutAmount: {
            fn: calcPayoutPayoutAmount,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        originalContractAmount: {
            fn: calcPayoutOriginalContractAmount,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "money" },
        },
        isUnaddedToAccountingLabel: {
            fn: calcPayoutIsUnaddedToAccountingLabel,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "string" },
        },
        isUnaddedToAccounting: {
            fn: calcPayoutIsUnaddedToAccounting,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "boolean" },
        },
        extras: {
            fn: calcPayoutExtras,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "array", items: PAYOUT_OPTION_META },
        },
        isComplete: {
            fn: calcPayoutIsComplete,
            parameterTypes: () => [PAYOUT_META],
            returnType: { type: "boolean" },
        },
    },
    segments: PayoutSegments,
};

// END MAGIC -- DO NOT EDIT
