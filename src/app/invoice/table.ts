import dateParse from "date-fns/parseISO";
import { Decimal } from "decimal.js";
import { Money, Percentage, Quantity } from "../../clay/common";
import { Link } from "../../clay/link";
import { LocalDate } from "../../clay/LocalDate";
import { RecordMeta } from "../../clay/meta";
import { anyMap, isNull, sumMap } from "../../clay/queryFuncs";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";
import { Term } from "../../terms/table";
import {
    ContactDetail,
    ContactDetailJSON,
    ContactDetailToJSON,
    CONTACT_DETAIL_META,
    JSONToContactDetail,
    repairContactDetailJSON,
} from "../contact/table";
import { ContingencyItem } from "../contingency/table";
import { UnitType } from "../estimate/types/table";
import {
    JSONToProjectDescriptionDetail,
    ProjectDescriptionDetail,
    ProjectDescriptionDetailJSON,
    ProjectDescriptionDetailToJSON,
    PROJECT_DESCRIPTION_DETAIL_META,
    repairProjectDescriptionDetailJSON,
} from "../project/projectDescriptionDetail/table";
import { Project } from "../project/table";
import { Quotation } from "../quotation/table";
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
export type InvoiceOption = {
    id: UUID;
    name: string;
    description: string;
    number: Quantity;
    total: Money;
    previous: Money;
    completed: Percentage;
    quotations: Link<Quotation>[];
    projectDescription: ProjectDescriptionDetail;
    externalChangeOrderNumber: string;
};
//!Data
export type InvoiceContingencyItemMaterial = {
    date: LocalDate | null;
    name: string;
    description: string;
    invoice: string;
    amount: Money;
};

//!Data
export type InvoiceContingencyItem = {
    id: UUID;
    contingencyItem: Link<ContingencyItem>;
    type: Link<UnitType>;
    quantity: Quantity;
    number: Quantity;
    total: Quantity;
    rate: Money;
    certifiedForemanRate: Money;
    name: string;
    description: string;
    previousQuantity: Money;
    previousMoney: Money;
    projectDescription: ProjectDescriptionDetail;
    externalChangeOrderNumber: string;
    materials: InvoiceContingencyItemMaterial[];
};

export function calcInvoiceContingencyItemContractTotal(
    item: InvoiceContingencyItem
): Money {
    return item.total.times(item.rate).toDecimalPlaces(2);
}

export function calcInvoiceContingencyItemsContractTotal(
    invoice: Invoice
): Money {
    return sumMap(invoice.contingencyItems, (item) =>
        calcInvoiceContingencyItemContractTotal(item)
    );
}

export function calcInvoiceContingencyPreviousTotal(invoice: Invoice): Money {
    return sumMap(invoice.contingencyItems, (item) => item.previousMoney);
}

export function calcInvoiceContingencyItemDollarTotal(
    item: InvoiceContingencyItem
): Money {
    return calcInvoiceContingencyItemDeltaAmount(item).plus(item.previousMoney);
}

export function calcInvoiceContingencyItemPercentageToDate(
    item: InvoiceContingencyItem
): Percentage {
    return item.quantity.plus(item.previousQuantity).dividedBy(item.total);
}

export function calcInvoiceContingencyItemPercentageOver(
    item: InvoiceContingencyItem
): Percentage {
    return item.quantity.plus(item.previousQuantity).greaterThan(item.total)
        ? item.quantity
              .plus(item.previousQuantity)
              .dividedBy(item.total)
              .minus(new Decimal(1))
        : new Decimal(0);
}

export function calcInvoiceContingencyItemCertifiedForemanTotal(
    item: InvoiceContingencyItem
): Money {
    return item.quantity.times(item.certifiedForemanRate).toDecimalPlaces(2);
}

export function calcInvoiceContingencyItemDelta(
    option: InvoiceContingencyItem
): Money {
    return option.quantity;
}

export function calcInvoiceContingencyItemDeltaAmount(
    item: InvoiceContingencyItem
): Money {
    return item.quantity.times(item.rate).toDecimalPlaces(2);
}

export function calcInvoiceContingencyItemsDeltaAmount(
    invoice: Invoice
): Money {
    return sumMap(invoice.contingencyItems, (item) =>
        calcInvoiceContingencyItemDeltaAmount(item)
    );
}

export function calcInvoiceOptionAmount(option: InvoiceOption): Money {
    return option.total.times(option.completed).toDecimalPlaces(2);
}

export function calcInvoiceOptionDeltaAmount(option: InvoiceOption): Money {
    return option.total.times(option.completed.minus(option.previous));
}

export function calcInvoiceIsUnaddedToAccounting(invoice: Invoice): boolean {
    return (
        isNull(invoice.addedToAccountingSoftware.date) && !isNull(invoice.date)
    );
}

//!Data
export type Invoice = {
    id: UUID;
    recordVersion: Version;
    project: Link<Project>;
    user: Link<User>;
    number: Quantity;
    firstDate: Date | null;
    date: Date | null;
    holdback: boolean;
    options: InvoiceOption[];
    previousTotal: Money;
    specialInstructions: string;
    contact: ContactDetail;
    term: Link<Term>;
    contingencyItems: InvoiceContingencyItem[];
    addedToAccountingSoftware: UserAndDate;
    addedToAccountingSoftwareDate: Date | null;
    addedToAccountingSoftwareUser: Link<User>;
    engineered: boolean;
    externalInvoiceNumber: string;
    materialsPst: Percentage;
    materialsOverhead: Percentage;
    materialsProfit: Percentage;
};

export function calcInvoiceContingencyItemsTotal(invoice: Invoice): Money {
    return sumMap(invoice.contingencyItems, (item) =>
        calcInvoiceContingencyItemDollarTotal(item)
    );
}

export function calcInvoiceContractTotal(invoice: Invoice): Money {
    return sumMap(invoice.options, (option) => option.total).plus(
        calcInvoiceContingencyItemsContractTotal(invoice)
    );
}

export function calcInvoiceInvoicedTotal(invoice: Invoice): Money {
    return sumMap(invoice.options, (option) => calcInvoiceOptionAmount(option))
        .plus(calcInvoiceContingencyItemsTotal(invoice))
        .toDecimalPlaces(2);
}

export function calcInvoiceAmountTotal(invoice: Invoice): Money {
    return calcInvoiceInvoicedTotal(invoice).minus(invoice.previousTotal);
}

export function calcInvoiceHoldback(invoice: Invoice): Money {
    return invoice.holdback
        ? calcInvoiceAmountTotal(invoice)
              .times(new Decimal("0.10"))
              .toDecimalPlaces(2)
        : new Decimal(0);
}

export function calcInvoiceNetClaim(invoice: Invoice): Money {
    return calcInvoiceAmountTotal(invoice).minus(calcInvoiceHoldback(invoice));
}

export function calcInvoiceGst(invoice: Invoice): Money {
    return calcInvoiceNetClaim(invoice)
        .times(new Decimal("0.05"))
        .toDecimalPlaces(2);
}

export function calcInvoicePaymentRequested(invoice: Invoice): Money {
    return calcInvoiceNetClaim(invoice).plus(calcInvoiceGst(invoice));
}

export function calcInvoiceIsComplete(invoice: Invoice): boolean {
    return !anyMap(invoice.options, (option) => option.completed.lt(1));
}

// BEGIN MAGIC -- DO NOT EDIT
export type InvoiceOptionJSON = {
    id: string;
    name: string;
    description: string;
    number: string;
    total: string;
    previous: string;
    completed: string;
    quotations: (string | null)[];
    projectDescription: ProjectDescriptionDetailJSON;
    externalChangeOrderNumber: string;
};

export function JSONToInvoiceOption(json: InvoiceOptionJSON): InvoiceOption {
    return {
        id: { uuid: json.id },
        name: json.name,
        description: json.description,
        number: new Decimal(json.number),
        total: new Decimal(json.total),
        previous: new Decimal(json.previous),
        completed: new Decimal(json.completed),
        quotations: json.quotations.map((inner) => inner),
        projectDescription: JSONToProjectDescriptionDetail(
            json.projectDescription
        ),
        externalChangeOrderNumber: json.externalChangeOrderNumber,
    };
}
export type InvoiceOptionBrokenJSON = {
    id?: string;
    name?: string;
    description?: string;
    number?: string;
    total?: string;
    previous?: string;
    completed?: string;
    quotations?: (string | null)[];
    projectDescription?: ProjectDescriptionDetailJSON;
    externalChangeOrderNumber?: string;
};

export function newInvoiceOption(): InvoiceOption {
    return JSONToInvoiceOption(repairInvoiceOptionJSON(undefined));
}
export function repairInvoiceOptionJSON(
    json: InvoiceOptionBrokenJSON | undefined
): InvoiceOptionJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            name: json.name || "",
            description: json.description || "",
            number: json.number || "0",
            total: json.total || "0",
            previous: json.previous || "0",
            completed: json.completed || "0",
            quotations: (json.quotations || []).map((inner) => inner || null),
            projectDescription: repairProjectDescriptionDetailJSON(
                json.projectDescription
            ),
            externalChangeOrderNumber: json.externalChangeOrderNumber || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            name: undefined || "",
            description: undefined || "",
            number: undefined || "0",
            total: undefined || "0",
            previous: undefined || "0",
            completed: undefined || "0",
            quotations: (undefined || []).map((inner) => inner || null),
            projectDescription: repairProjectDescriptionDetailJSON(undefined),
            externalChangeOrderNumber: undefined || "",
        };
    }
}

export function InvoiceOptionToJSON(value: InvoiceOption): InvoiceOptionJSON {
    return {
        id: value.id.uuid,
        name: value.name,
        description: value.description,
        number: value.number.toString(),
        total: value.total.toString(),
        previous: value.previous.toString(),
        completed: value.completed.toString(),
        quotations: value.quotations.map((inner) => inner),
        projectDescription: ProjectDescriptionDetailToJSON(
            value.projectDescription
        ),
        externalChangeOrderNumber: value.externalChangeOrderNumber,
    };
}

export const INVOICE_OPTION_META: RecordMeta<
    InvoiceOption,
    InvoiceOptionJSON,
    InvoiceOptionBrokenJSON
> & { name: "InvoiceOption" } = {
    name: "InvoiceOption",
    type: "record",
    repair: repairInvoiceOptionJSON,
    toJSON: InvoiceOptionToJSON,
    fromJSON: JSONToInvoiceOption,
    fields: {
        id: { type: "uuid" },
        name: { type: "string" },
        description: { type: "string" },
        number: { type: "quantity" },
        total: { type: "money" },
        previous: { type: "money" },
        completed: { type: "percentage" },
        quotations: {
            type: "array",
            items: { type: "uuid", linkTo: "Quotation" },
        },
        projectDescription: PROJECT_DESCRIPTION_DETAIL_META,
        externalChangeOrderNumber: { type: "string" },
    },
    userFacingKey: "number",
    functions: {
        amount: {
            fn: calcInvoiceOptionAmount,
            parameterTypes: () => [INVOICE_OPTION_META],
            returnType: { type: "money" },
        },
        deltaAmount: {
            fn: calcInvoiceOptionDeltaAmount,
            parameterTypes: () => [INVOICE_OPTION_META],
            returnType: { type: "money" },
        },
    },
    segments: {},
};

export type InvoiceContingencyItemMaterialJSON = {
    date: string | null;
    name: string;
    description: string;
    invoice: string;
    amount: string;
};

export function JSONToInvoiceContingencyItemMaterial(
    json: InvoiceContingencyItemMaterialJSON
): InvoiceContingencyItemMaterial {
    return {
        date: json.date !== null ? LocalDate.parse(json.date) : null,
        name: json.name,
        description: json.description,
        invoice: json.invoice,
        amount: new Decimal(json.amount),
    };
}
export type InvoiceContingencyItemMaterialBrokenJSON = {
    date?: string | null;
    name?: string;
    description?: string;
    invoice?: string;
    amount?: string;
};

export function newInvoiceContingencyItemMaterial(): InvoiceContingencyItemMaterial {
    return JSONToInvoiceContingencyItemMaterial(
        repairInvoiceContingencyItemMaterialJSON(undefined)
    );
}
export function repairInvoiceContingencyItemMaterialJSON(
    json: InvoiceContingencyItemMaterialBrokenJSON | undefined
): InvoiceContingencyItemMaterialJSON {
    if (json) {
        return {
            date: json.date || null,
            name: json.name || "",
            description: json.description || "",
            invoice: json.invoice || "",
            amount: json.amount || "0",
        };
    } else {
        return {
            date: undefined || null,
            name: undefined || "",
            description: undefined || "",
            invoice: undefined || "",
            amount: undefined || "0",
        };
    }
}

export function InvoiceContingencyItemMaterialToJSON(
    value: InvoiceContingencyItemMaterial
): InvoiceContingencyItemMaterialJSON {
    return {
        date: value.date !== null ? value.date.toString() : null,
        name: value.name,
        description: value.description,
        invoice: value.invoice,
        amount: value.amount.toString(),
    };
}

export const INVOICE_CONTINGENCY_ITEM_MATERIAL_META: RecordMeta<
    InvoiceContingencyItemMaterial,
    InvoiceContingencyItemMaterialJSON,
    InvoiceContingencyItemMaterialBrokenJSON
> & { name: "InvoiceContingencyItemMaterial" } = {
    name: "InvoiceContingencyItemMaterial",
    type: "record",
    repair: repairInvoiceContingencyItemMaterialJSON,
    toJSON: InvoiceContingencyItemMaterialToJSON,
    fromJSON: JSONToInvoiceContingencyItemMaterial,
    fields: {
        date: { type: "date" },
        name: { type: "string" },
        description: { type: "string" },
        invoice: { type: "string" },
        amount: { type: "money" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type InvoiceContingencyItemJSON = {
    id: string;
    contingencyItem: string | null;
    type: string | null;
    quantity: string;
    number: string;
    total: string;
    rate: string;
    certifiedForemanRate: string;
    name: string;
    description: string;
    previousQuantity: string;
    previousMoney: string;
    projectDescription: ProjectDescriptionDetailJSON;
    externalChangeOrderNumber: string;
    materials: InvoiceContingencyItemMaterialJSON[];
};

export function JSONToInvoiceContingencyItem(
    json: InvoiceContingencyItemJSON
): InvoiceContingencyItem {
    return {
        id: { uuid: json.id },
        contingencyItem: json.contingencyItem,
        type: json.type,
        quantity: new Decimal(json.quantity),
        number: new Decimal(json.number),
        total: new Decimal(json.total),
        rate: new Decimal(json.rate),
        certifiedForemanRate: new Decimal(json.certifiedForemanRate),
        name: json.name,
        description: json.description,
        previousQuantity: new Decimal(json.previousQuantity),
        previousMoney: new Decimal(json.previousMoney),
        projectDescription: JSONToProjectDescriptionDetail(
            json.projectDescription
        ),
        externalChangeOrderNumber: json.externalChangeOrderNumber,
        materials: json.materials.map((inner) =>
            JSONToInvoiceContingencyItemMaterial(inner)
        ),
    };
}
export type InvoiceContingencyItemBrokenJSON = {
    id?: string;
    contingencyItem?: string | null;
    type?: string | null;
    quantity?: string;
    number?: string;
    total?: string;
    rate?: string;
    certifiedForemanRate?: string;
    name?: string;
    description?: string;
    previousQuantity?: string;
    previousMoney?: string;
    projectDescription?: ProjectDescriptionDetailJSON;
    externalChangeOrderNumber?: string;
    materials?: InvoiceContingencyItemMaterialJSON[];
};

export function newInvoiceContingencyItem(): InvoiceContingencyItem {
    return JSONToInvoiceContingencyItem(
        repairInvoiceContingencyItemJSON(undefined)
    );
}
export function repairInvoiceContingencyItemJSON(
    json: InvoiceContingencyItemBrokenJSON | undefined
): InvoiceContingencyItemJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            contingencyItem: json.contingencyItem || null,
            type: json.type || null,
            quantity: json.quantity || "0",
            number: json.number || "0",
            total: json.total || "0",
            rate: json.rate || "0",
            certifiedForemanRate: json.certifiedForemanRate || "0",
            name: json.name || "",
            description: json.description || "",
            previousQuantity: json.previousQuantity || "0",
            previousMoney: json.previousMoney || "0",
            projectDescription: repairProjectDescriptionDetailJSON(
                json.projectDescription
            ),
            externalChangeOrderNumber: json.externalChangeOrderNumber || "",
            materials: (json.materials || []).map((inner) =>
                repairInvoiceContingencyItemMaterialJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            contingencyItem: undefined || null,
            type: undefined || null,
            quantity: undefined || "0",
            number: undefined || "0",
            total: undefined || "0",
            rate: undefined || "0",
            certifiedForemanRate: undefined || "0",
            name: undefined || "",
            description: undefined || "",
            previousQuantity: undefined || "0",
            previousMoney: undefined || "0",
            projectDescription: repairProjectDescriptionDetailJSON(undefined),
            externalChangeOrderNumber: undefined || "",
            materials: (undefined || []).map((inner) =>
                repairInvoiceContingencyItemMaterialJSON(inner)
            ),
        };
    }
}

export function InvoiceContingencyItemToJSON(
    value: InvoiceContingencyItem
): InvoiceContingencyItemJSON {
    return {
        id: value.id.uuid,
        contingencyItem: value.contingencyItem,
        type: value.type,
        quantity: value.quantity.toString(),
        number: value.number.toString(),
        total: value.total.toString(),
        rate: value.rate.toString(),
        certifiedForemanRate: value.certifiedForemanRate.toString(),
        name: value.name,
        description: value.description,
        previousQuantity: value.previousQuantity.toString(),
        previousMoney: value.previousMoney.toString(),
        projectDescription: ProjectDescriptionDetailToJSON(
            value.projectDescription
        ),
        externalChangeOrderNumber: value.externalChangeOrderNumber,
        materials: value.materials.map((inner) =>
            InvoiceContingencyItemMaterialToJSON(inner)
        ),
    };
}

export const INVOICE_CONTINGENCY_ITEM_META: RecordMeta<
    InvoiceContingencyItem,
    InvoiceContingencyItemJSON,
    InvoiceContingencyItemBrokenJSON
> & { name: "InvoiceContingencyItem" } = {
    name: "InvoiceContingencyItem",
    type: "record",
    repair: repairInvoiceContingencyItemJSON,
    toJSON: InvoiceContingencyItemToJSON,
    fromJSON: JSONToInvoiceContingencyItem,
    fields: {
        id: { type: "uuid" },
        contingencyItem: { type: "uuid", linkTo: "ContingencyItem" },
        type: { type: "uuid", linkTo: "UnitType" },
        quantity: { type: "quantity" },
        number: { type: "quantity" },
        total: { type: "quantity" },
        rate: { type: "money" },
        certifiedForemanRate: { type: "money" },
        name: { type: "string" },
        description: { type: "string" },
        previousQuantity: { type: "money" },
        previousMoney: { type: "money" },
        projectDescription: PROJECT_DESCRIPTION_DETAIL_META,
        externalChangeOrderNumber: { type: "string" },
        materials: {
            type: "array",
            items: INVOICE_CONTINGENCY_ITEM_MATERIAL_META,
        },
    },
    userFacingKey: "name",
    functions: {
        contractTotal: {
            fn: calcInvoiceContingencyItemContractTotal,
            parameterTypes: () => [INVOICE_CONTINGENCY_ITEM_META],
            returnType: { type: "money" },
        },
        dollarTotal: {
            fn: calcInvoiceContingencyItemDollarTotal,
            parameterTypes: () => [INVOICE_CONTINGENCY_ITEM_META],
            returnType: { type: "money" },
        },
        percentageToDate: {
            fn: calcInvoiceContingencyItemPercentageToDate,
            parameterTypes: () => [INVOICE_CONTINGENCY_ITEM_META],
            returnType: { type: "percentage" },
        },
        percentageOver: {
            fn: calcInvoiceContingencyItemPercentageOver,
            parameterTypes: () => [INVOICE_CONTINGENCY_ITEM_META],
            returnType: { type: "percentage" },
        },
        certifiedForemanTotal: {
            fn: calcInvoiceContingencyItemCertifiedForemanTotal,
            parameterTypes: () => [INVOICE_CONTINGENCY_ITEM_META],
            returnType: { type: "money" },
        },
        delta: {
            fn: calcInvoiceContingencyItemDelta,
            parameterTypes: () => [INVOICE_CONTINGENCY_ITEM_META],
            returnType: { type: "money" },
        },
        deltaAmount: {
            fn: calcInvoiceContingencyItemDeltaAmount,
            parameterTypes: () => [INVOICE_CONTINGENCY_ITEM_META],
            returnType: { type: "money" },
        },
    },
    segments: {},
};

export type InvoiceJSON = {
    id: string;
    recordVersion: number | null;
    project: string | null;
    user: string | null;
    number: string;
    firstDate: string | null;
    date: string | null;
    holdback: boolean;
    options: InvoiceOptionJSON[];
    previousTotal: string;
    specialInstructions: string;
    contact: ContactDetailJSON;
    term: string | null;
    contingencyItems: InvoiceContingencyItemJSON[];
    addedToAccountingSoftware: UserAndDateJSON;
    addedToAccountingSoftwareDate: string | null;
    addedToAccountingSoftwareUser: string | null;
    engineered: boolean;
    externalInvoiceNumber: string;
    materialsPst: string;
    materialsOverhead: string;
    materialsProfit: string;
};

export function JSONToInvoice(json: InvoiceJSON): Invoice {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        project: json.project,
        user: json.user,
        number: new Decimal(json.number),
        firstDate: json.firstDate !== null ? dateParse(json.firstDate) : null,
        date: json.date !== null ? dateParse(json.date) : null,
        holdback: json.holdback,
        options: json.options.map((inner) => JSONToInvoiceOption(inner)),
        previousTotal: new Decimal(json.previousTotal),
        specialInstructions: json.specialInstructions,
        contact: JSONToContactDetail(json.contact),
        term: json.term,
        contingencyItems: json.contingencyItems.map((inner) =>
            JSONToInvoiceContingencyItem(inner)
        ),
        addedToAccountingSoftware: JSONToUserAndDate(
            json.addedToAccountingSoftware
        ),
        addedToAccountingSoftwareDate:
            json.addedToAccountingSoftwareDate !== null
                ? dateParse(json.addedToAccountingSoftwareDate)
                : null,
        addedToAccountingSoftwareUser: json.addedToAccountingSoftwareUser,
        engineered: json.engineered,
        externalInvoiceNumber: json.externalInvoiceNumber,
        materialsPst: new Decimal(json.materialsPst),
        materialsOverhead: new Decimal(json.materialsOverhead),
        materialsProfit: new Decimal(json.materialsProfit),
    };
}
export type InvoiceBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    project?: string | null;
    user?: string | null;
    number?: string;
    firstDate?: string | null;
    date?: string | null;
    holdback?: boolean;
    options?: InvoiceOptionJSON[];
    previousTotal?: string;
    specialInstructions?: string;
    contact?: ContactDetailJSON;
    term?: string | null;
    contingencyItems?: InvoiceContingencyItemJSON[];
    addedToAccountingSoftware?: UserAndDateJSON;
    addedToAccountingSoftwareDate?: string | null;
    addedToAccountingSoftwareUser?: string | null;
    engineered?: boolean;
    externalInvoiceNumber?: string;
    materialsPst?: string;
    materialsOverhead?: string;
    materialsProfit?: string;
};

export function newInvoice(): Invoice {
    return JSONToInvoice(repairInvoiceJSON(undefined));
}
export function repairInvoiceJSON(
    json: InvoiceBrokenJSON | undefined
): InvoiceJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            project: json.project || null,
            user: json.user || null,
            number: json.number || "0",
            firstDate: json.firstDate
                ? new Date(json.firstDate!).toISOString()
                : null,
            date: json.date ? new Date(json.date!).toISOString() : null,
            holdback: json.holdback || false,
            options: (json.options || []).map((inner) =>
                repairInvoiceOptionJSON(inner)
            ),
            previousTotal: json.previousTotal || "0",
            specialInstructions: json.specialInstructions || "",
            contact: repairContactDetailJSON(json.contact),
            term: json.term || null,
            contingencyItems: (json.contingencyItems || []).map((inner) =>
                repairInvoiceContingencyItemJSON(inner)
            ),
            addedToAccountingSoftware: repairUserAndDateJSON(
                json.addedToAccountingSoftware
            ),
            addedToAccountingSoftwareDate: json.addedToAccountingSoftwareDate
                ? new Date(json.addedToAccountingSoftwareDate!).toISOString()
                : null,
            addedToAccountingSoftwareUser:
                json.addedToAccountingSoftwareUser || null,
            engineered: json.engineered || false,
            externalInvoiceNumber: json.externalInvoiceNumber || "",
            materialsPst: json.materialsPst || "0",
            materialsOverhead: json.materialsOverhead || "0",
            materialsProfit: json.materialsProfit || "0",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            project: undefined || null,
            user: undefined || null,
            number: undefined || "0",
            firstDate: undefined ? new Date(undefined!).toISOString() : null,
            date: undefined ? new Date(undefined!).toISOString() : null,
            holdback: undefined || false,
            options: (undefined || []).map((inner) =>
                repairInvoiceOptionJSON(inner)
            ),
            previousTotal: undefined || "0",
            specialInstructions: undefined || "",
            contact: repairContactDetailJSON(undefined),
            term: undefined || null,
            contingencyItems: (undefined || []).map((inner) =>
                repairInvoiceContingencyItemJSON(inner)
            ),
            addedToAccountingSoftware: repairUserAndDateJSON(undefined),
            addedToAccountingSoftwareDate: undefined
                ? new Date(undefined!).toISOString()
                : null,
            addedToAccountingSoftwareUser: undefined || null,
            engineered: undefined || false,
            externalInvoiceNumber: undefined || "",
            materialsPst: undefined || "0",
            materialsOverhead: undefined || "0",
            materialsProfit: undefined || "0",
        };
    }
}

export function InvoiceToJSON(value: Invoice): InvoiceJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        project: value.project,
        user: value.user,
        number: value.number.toString(),
        firstDate:
            value.firstDate !== null ? value.firstDate.toISOString() : null,
        date: value.date !== null ? value.date.toISOString() : null,
        holdback: value.holdback,
        options: value.options.map((inner) => InvoiceOptionToJSON(inner)),
        previousTotal: value.previousTotal.toString(),
        specialInstructions: value.specialInstructions,
        contact: ContactDetailToJSON(value.contact),
        term: value.term,
        contingencyItems: value.contingencyItems.map((inner) =>
            InvoiceContingencyItemToJSON(inner)
        ),
        addedToAccountingSoftware: UserAndDateToJSON(
            value.addedToAccountingSoftware
        ),
        addedToAccountingSoftwareDate:
            value.addedToAccountingSoftwareDate !== null
                ? value.addedToAccountingSoftwareDate.toISOString()
                : null,
        addedToAccountingSoftwareUser: value.addedToAccountingSoftwareUser,
        engineered: value.engineered,
        externalInvoiceNumber: value.externalInvoiceNumber,
        materialsPst: value.materialsPst.toString(),
        materialsOverhead: value.materialsOverhead.toString(),
        materialsProfit: value.materialsProfit.toString(),
    };
}

export const INVOICE_META: RecordMeta<
    Invoice,
    InvoiceJSON,
    InvoiceBrokenJSON
> & { name: "Invoice" } = {
    name: "Invoice",
    type: "record",
    repair: repairInvoiceJSON,
    toJSON: InvoiceToJSON,
    fromJSON: JSONToInvoice,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        project: { type: "uuid", linkTo: "Project" },
        user: { type: "uuid", linkTo: "User" },
        number: { type: "quantity" },
        firstDate: { type: "datetime" },
        date: { type: "datetime" },
        holdback: { type: "boolean" },
        options: { type: "array", items: INVOICE_OPTION_META },
        previousTotal: { type: "money" },
        specialInstructions: { type: "string" },
        contact: CONTACT_DETAIL_META,
        term: { type: "uuid", linkTo: "Term" },
        contingencyItems: {
            type: "array",
            items: INVOICE_CONTINGENCY_ITEM_META,
        },
        addedToAccountingSoftware: USER_AND_DATE_META,
        addedToAccountingSoftwareDate: { type: "datetime" },
        addedToAccountingSoftwareUser: { type: "uuid", linkTo: "User" },
        engineered: { type: "boolean" },
        externalInvoiceNumber: { type: "string" },
        materialsPst: { type: "percentage" },
        materialsOverhead: { type: "percentage" },
        materialsProfit: { type: "percentage" },
    },
    userFacingKey: "number",
    functions: {
        contingencyItemsContractTotal: {
            fn: calcInvoiceContingencyItemsContractTotal,
            parameterTypes: () => [INVOICE_META],
            returnType: { type: "money" },
        },
        contingencyPreviousTotal: {
            fn: calcInvoiceContingencyPreviousTotal,
            parameterTypes: () => [INVOICE_META],
            returnType: { type: "money" },
        },
        contingencyItemsDeltaAmount: {
            fn: calcInvoiceContingencyItemsDeltaAmount,
            parameterTypes: () => [INVOICE_META],
            returnType: { type: "money" },
        },
        isUnaddedToAccounting: {
            fn: calcInvoiceIsUnaddedToAccounting,
            parameterTypes: () => [INVOICE_META],
            returnType: { type: "boolean" },
        },
        contingencyItemsTotal: {
            fn: calcInvoiceContingencyItemsTotal,
            parameterTypes: () => [INVOICE_META],
            returnType: { type: "money" },
        },
        contractTotal: {
            fn: calcInvoiceContractTotal,
            parameterTypes: () => [INVOICE_META],
            returnType: { type: "money" },
        },
        invoicedTotal: {
            fn: calcInvoiceInvoicedTotal,
            parameterTypes: () => [INVOICE_META],
            returnType: { type: "money" },
        },
        amountTotal: {
            fn: calcInvoiceAmountTotal,
            parameterTypes: () => [INVOICE_META],
            returnType: { type: "money" },
        },
        holdback: {
            fn: calcInvoiceHoldback,
            parameterTypes: () => [INVOICE_META],
            returnType: { type: "money" },
        },
        netClaim: {
            fn: calcInvoiceNetClaim,
            parameterTypes: () => [INVOICE_META],
            returnType: { type: "money" },
        },
        gst: {
            fn: calcInvoiceGst,
            parameterTypes: () => [INVOICE_META],
            returnType: { type: "money" },
        },
        paymentRequested: {
            fn: calcInvoicePaymentRequested,
            parameterTypes: () => [INVOICE_META],
            returnType: { type: "money" },
        },
        isComplete: {
            fn: calcInvoiceIsComplete,
            parameterTypes: () => [INVOICE_META],
            returnType: { type: "boolean" },
        },
    },
    segments: {},
};

// END MAGIC -- DO NOT EDIT
