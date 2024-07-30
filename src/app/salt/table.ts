import Decimal from "decimal.js";
import { Money, Percentage, Quantity, Serial } from "../../clay/common";
import { Link } from "../../clay/link";
import { LocalDate } from "../../clay/LocalDate";
import { RecordMeta } from "../../clay/meta";
import {
    isEmpty,
    isNotNull,
    joinMap,
    lastItem,
    sumMap,
} from "../../clay/queryFuncs";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";
import {
    Address,
    AddressJSON,
    AddressToJSON,
    ADDRESS_META,
    JSONToAddress,
    repairAddressJSON,
} from "../address";
import {
    ContactDetail,
    ContactDetailJSON,
    ContactDetailToJSON,
    CONTACT_DETAIL_META,
    JSONToContactDetail,
    repairContactDetailJSON,
} from "../contact/table";
import {
    DatedString,
    DatedStringJSON,
    DatedStringToJSON,
    DATED_STRING_META,
    JSONToDatedString,
    repairDatedStringJSON,
} from "../dated-strings/table";
import { User } from "../user/table";

//!Data
export type SaltPrice = {
    minQty: Quantity;
    firstDate: LocalDate | null;
    price: Money;
    earlyPrice: Money;
};

//!Data
export type SaltProduct = {
    id: UUID;
    recordVersion: Version;
    name: string;
    noUnits: boolean;
    prices: SaltPrice[];
    bagPrices: SaltPrice[];
    pailPrices: SaltPrice[];
};

//!Data
export type SaltOrderLine = {
    product: Link<SaltProduct>;
    unit: "bags" | "pails" | "items";
    quantity: Quantity;
    price: Money;
};

export function calcSaltOrderLineTotalCost(line: SaltOrderLine): Money {
    return line.quantity.times(line.price);
}

//!Data
export type SaltOrderPayment = {
    date: LocalDate | null;
    amount: Money;
    chequeNumber: string;
};

//!Data
export type SaltOrderExtra = {
    description: string;
    amount: Money;
};

//!Data
export type SaltOrder = {
    id: UUID;
    recordVersion: Version;

    enteredBy: Link<User>;

    orderDate: LocalDate | null;
    orderNumber: Serial;
    orderedBy: string;

    billingContact: ContactDetail;
    deliveryContact: ContactDetail;

    purchaseOrderNumber: string;
    terms: string;
    customer: string;
    deliveryAddress: Address;
    specialInstructions: DatedString[];
    lines: SaltOrderLine[];
    discount: Percentage;

    deliveredBy: string;
    deliveredDate: LocalDate | null;
    invoicedDate: LocalDate | null;
    extras: SaltOrderExtra[];
    payments: SaltOrderPayment[];

    pstExempt: boolean;
    cancelled: boolean;

    writeOff: Money;
};

export function calcSaltOrderTextColor(order: SaltOrder): string {
    return order.cancelled ? "#ff0000" : "#000000";
}

export function calcSaltOrderColor(order: SaltOrder): string {
    return calcSaltOrderActive(order)
        ? isNotNull(order.deliveredDate)
            ? "#e6faff"
            : (order.orderDate as LocalDate).ageDays() > 7
            ? "#f2f300"
            : "#ffffff"
        : "#e0e1e2";
}

export function calcSaltOrderPaymentDate(order: SaltOrder): LocalDate | null {
    return lastItem(order.payments, (payment) => payment.date);
}

export function calcSaltOrderSpecialInstructionsList(order: SaltOrder): string {
    return joinMap(order.specialInstructions, " / ", (item) => item.text);
}

export function calcSaltOrderSubTotal(order: SaltOrder): Money {
    return sumMap(order.lines, (line) => line.quantity.times(line.price)).plus(
        sumMap(order.extras, (line) => line.amount)
    );
}

export function calcSaltOrderTotalPayments(order: SaltOrder): Money {
    return sumMap(order.payments, (payment) => payment.amount);
}

export function calcSaltOrderPendingAmount(order: SaltOrder): Money {
    return calcSaltOrderTotal(order)
        .minus(calcSaltOrderTotalPayments(order))
        .minus(order.writeOff);
}

export function calcSaltOrderDiscountAmount(order: SaltOrder): Money {
    return calcSaltOrderSubTotal(order).times(order.discount);
}

export function calcSaltOrderPreTaxTotal(order: SaltOrder): Money {
    return calcSaltOrderSubTotal(order).minus(
        calcSaltOrderDiscountAmount(order)
    );
}

export function calcSaltOrderPst(order: SaltOrder): Money {
    return order.pstExempt
        ? new Decimal("0.0")
        : calcSaltOrderPreTaxTotal(order).times(new Decimal("0.07"));
}

export function calcSaltOrderGst(order: SaltOrder): Money {
    return calcSaltOrderPreTaxTotal(order).times(new Decimal("0.05"));
}

export function calcSaltOrderTotal(order: SaltOrder): Money {
    return calcSaltOrderPreTaxTotal(order)
        .plus(calcSaltOrderGst(order))
        .plus(calcSaltOrderPst(order))
        .toDecimalPlaces(2);
}

export function calcSaltOrderOrderBags(
    order: SaltOrder,
    product: Link<SaltProduct>
): Quantity {
    return sumMap(order.lines, (line) =>
        line.product === product && line.unit === "bags"
            ? line.quantity
            : new Decimal(0)
    );
}

export function calcSaltOrderOrderPails(
    order: SaltOrder,
    product: Link<SaltProduct>
): Quantity {
    return sumMap(order.lines, (line) =>
        line.product === product && line.unit === "pails"
            ? line.quantity
            : new Decimal(0)
    );
}

export function calcSaltOrderOrderItems(
    order: SaltOrder,
    product: Link<SaltProduct>
): Quantity {
    return sumMap(order.lines, (line) =>
        line.product === product ? line.quantity : new Decimal(0)
    );
}

export function calcSaltOrderPending(order: SaltOrder): boolean {
    return (
        calcSaltOrderPendingAmount(order).isZero() && !isEmpty(order.payments)
    );
}

export function calcSaltOrderActive(order: SaltOrder): boolean {
    return !(calcSaltOrderPending(order) || order.cancelled);
}

//!Data
export type BulkSaltDelivery = {
    deliveredBy: string;
    deliveredDate: LocalDate | null;
};

// BEGIN MAGIC -- DO NOT EDIT
export type SaltPriceJSON = {
    minQty: string;
    firstDate: string | null;
    price: string;
    earlyPrice: string;
};

export function JSONToSaltPrice(json: SaltPriceJSON): SaltPrice {
    return {
        minQty: new Decimal(json.minQty),
        firstDate:
            json.firstDate !== null ? LocalDate.parse(json.firstDate) : null,
        price: new Decimal(json.price),
        earlyPrice: new Decimal(json.earlyPrice),
    };
}
export type SaltPriceBrokenJSON = {
    minQty?: string;
    firstDate?: string | null;
    price?: string;
    earlyPrice?: string;
};

export function newSaltPrice(): SaltPrice {
    return JSONToSaltPrice(repairSaltPriceJSON(undefined));
}
export function repairSaltPriceJSON(
    json: SaltPriceBrokenJSON | undefined
): SaltPriceJSON {
    if (json) {
        return {
            minQty: json.minQty || "0",
            firstDate: json.firstDate || null,
            price: json.price || "0",
            earlyPrice: json.earlyPrice || "0",
        };
    } else {
        return {
            minQty: undefined || "0",
            firstDate: undefined || null,
            price: undefined || "0",
            earlyPrice: undefined || "0",
        };
    }
}

export function SaltPriceToJSON(value: SaltPrice): SaltPriceJSON {
    return {
        minQty: value.minQty.toString(),
        firstDate: value.firstDate !== null ? value.firstDate.toString() : null,
        price: value.price.toString(),
        earlyPrice: value.earlyPrice.toString(),
    };
}

export const SALT_PRICE_META: RecordMeta<
    SaltPrice,
    SaltPriceJSON,
    SaltPriceBrokenJSON
> & { name: "SaltPrice" } = {
    name: "SaltPrice",
    type: "record",
    repair: repairSaltPriceJSON,
    toJSON: SaltPriceToJSON,
    fromJSON: JSONToSaltPrice,
    fields: {
        minQty: { type: "quantity" },
        firstDate: { type: "date" },
        price: { type: "money" },
        earlyPrice: { type: "money" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type SaltProductJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    noUnits: boolean;
    prices: SaltPriceJSON[];
    bagPrices: SaltPriceJSON[];
    pailPrices: SaltPriceJSON[];
};

export function JSONToSaltProduct(json: SaltProductJSON): SaltProduct {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        noUnits: json.noUnits,
        prices: json.prices.map((inner) => JSONToSaltPrice(inner)),
        bagPrices: json.bagPrices.map((inner) => JSONToSaltPrice(inner)),
        pailPrices: json.pailPrices.map((inner) => JSONToSaltPrice(inner)),
    };
}
export type SaltProductBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    noUnits?: boolean;
    prices?: SaltPriceJSON[];
    bagPrices?: SaltPriceJSON[];
    pailPrices?: SaltPriceJSON[];
};

export function newSaltProduct(): SaltProduct {
    return JSONToSaltProduct(repairSaltProductJSON(undefined));
}
export function repairSaltProductJSON(
    json: SaltProductBrokenJSON | undefined
): SaltProductJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            noUnits: json.noUnits || false,
            prices: (json.prices || []).map((inner) =>
                repairSaltPriceJSON(inner)
            ),
            bagPrices: (json.bagPrices || []).map((inner) =>
                repairSaltPriceJSON(inner)
            ),
            pailPrices: (json.pailPrices || []).map((inner) =>
                repairSaltPriceJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            noUnits: undefined || false,
            prices: (undefined || []).map((inner) =>
                repairSaltPriceJSON(inner)
            ),
            bagPrices: (undefined || []).map((inner) =>
                repairSaltPriceJSON(inner)
            ),
            pailPrices: (undefined || []).map((inner) =>
                repairSaltPriceJSON(inner)
            ),
        };
    }
}

export function SaltProductToJSON(value: SaltProduct): SaltProductJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        noUnits: value.noUnits,
        prices: value.prices.map((inner) => SaltPriceToJSON(inner)),
        bagPrices: value.bagPrices.map((inner) => SaltPriceToJSON(inner)),
        pailPrices: value.pailPrices.map((inner) => SaltPriceToJSON(inner)),
    };
}

export const SALT_PRODUCT_META: RecordMeta<
    SaltProduct,
    SaltProductJSON,
    SaltProductBrokenJSON
> & { name: "SaltProduct" } = {
    name: "SaltProduct",
    type: "record",
    repair: repairSaltProductJSON,
    toJSON: SaltProductToJSON,
    fromJSON: JSONToSaltProduct,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        noUnits: { type: "boolean" },
        prices: { type: "array", items: SALT_PRICE_META },
        bagPrices: { type: "array", items: SALT_PRICE_META },
        pailPrices: { type: "array", items: SALT_PRICE_META },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type SaltOrderLineJSON = {
    product: string | null;
    unit: string;
    quantity: string;
    price: string;
};

export function JSONToSaltOrderLine(json: SaltOrderLineJSON): SaltOrderLine {
    return {
        product: json.product,
        unit: json.unit as any,
        quantity: new Decimal(json.quantity),
        price: new Decimal(json.price),
    };
}
export type SaltOrderLineBrokenJSON = {
    product?: string | null;
    unit?: string;
    quantity?: string;
    price?: string;
};

export function newSaltOrderLine(): SaltOrderLine {
    return JSONToSaltOrderLine(repairSaltOrderLineJSON(undefined));
}
export function repairSaltOrderLineJSON(
    json: SaltOrderLineBrokenJSON | undefined
): SaltOrderLineJSON {
    if (json) {
        return {
            product: json.product || null,
            unit: json.unit || "bags",
            quantity: json.quantity || "0",
            price: json.price || "0",
        };
    } else {
        return {
            product: undefined || null,
            unit: undefined || "bags",
            quantity: undefined || "0",
            price: undefined || "0",
        };
    }
}

export function SaltOrderLineToJSON(value: SaltOrderLine): SaltOrderLineJSON {
    return {
        product: value.product,
        unit: value.unit,
        quantity: value.quantity.toString(),
        price: value.price.toString(),
    };
}

export const SALT_ORDER_LINE_META: RecordMeta<
    SaltOrderLine,
    SaltOrderLineJSON,
    SaltOrderLineBrokenJSON
> & { name: "SaltOrderLine" } = {
    name: "SaltOrderLine",
    type: "record",
    repair: repairSaltOrderLineJSON,
    toJSON: SaltOrderLineToJSON,
    fromJSON: JSONToSaltOrderLine,
    fields: {
        product: { type: "uuid", linkTo: "SaltProduct" },
        unit: {
            type: "enum",
            values: ["bags", "pails", "items"],
        },
        quantity: { type: "quantity" },
        price: { type: "money" },
    },
    userFacingKey: null,
    functions: {
        totalCost: {
            fn: calcSaltOrderLineTotalCost,
            parameterTypes: () => [SALT_ORDER_LINE_META],
            returnType: { type: "money" },
        },
    },
    segments: {},
};

export type SaltOrderPaymentJSON = {
    date: string | null;
    amount: string;
    chequeNumber: string;
};

export function JSONToSaltOrderPayment(
    json: SaltOrderPaymentJSON
): SaltOrderPayment {
    return {
        date: json.date !== null ? LocalDate.parse(json.date) : null,
        amount: new Decimal(json.amount),
        chequeNumber: json.chequeNumber,
    };
}
export type SaltOrderPaymentBrokenJSON = {
    date?: string | null;
    amount?: string;
    chequeNumber?: string;
};

export function newSaltOrderPayment(): SaltOrderPayment {
    return JSONToSaltOrderPayment(repairSaltOrderPaymentJSON(undefined));
}
export function repairSaltOrderPaymentJSON(
    json: SaltOrderPaymentBrokenJSON | undefined
): SaltOrderPaymentJSON {
    if (json) {
        return {
            date: json.date || null,
            amount: json.amount || "0",
            chequeNumber: json.chequeNumber || "",
        };
    } else {
        return {
            date: undefined || null,
            amount: undefined || "0",
            chequeNumber: undefined || "",
        };
    }
}

export function SaltOrderPaymentToJSON(
    value: SaltOrderPayment
): SaltOrderPaymentJSON {
    return {
        date: value.date !== null ? value.date.toString() : null,
        amount: value.amount.toString(),
        chequeNumber: value.chequeNumber,
    };
}

export const SALT_ORDER_PAYMENT_META: RecordMeta<
    SaltOrderPayment,
    SaltOrderPaymentJSON,
    SaltOrderPaymentBrokenJSON
> & { name: "SaltOrderPayment" } = {
    name: "SaltOrderPayment",
    type: "record",
    repair: repairSaltOrderPaymentJSON,
    toJSON: SaltOrderPaymentToJSON,
    fromJSON: JSONToSaltOrderPayment,
    fields: {
        date: { type: "date" },
        amount: { type: "money" },
        chequeNumber: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type SaltOrderExtraJSON = {
    description: string;
    amount: string;
};

export function JSONToSaltOrderExtra(json: SaltOrderExtraJSON): SaltOrderExtra {
    return {
        description: json.description,
        amount: new Decimal(json.amount),
    };
}
export type SaltOrderExtraBrokenJSON = {
    description?: string;
    amount?: string;
};

export function newSaltOrderExtra(): SaltOrderExtra {
    return JSONToSaltOrderExtra(repairSaltOrderExtraJSON(undefined));
}
export function repairSaltOrderExtraJSON(
    json: SaltOrderExtraBrokenJSON | undefined
): SaltOrderExtraJSON {
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

export function SaltOrderExtraToJSON(
    value: SaltOrderExtra
): SaltOrderExtraJSON {
    return {
        description: value.description,
        amount: value.amount.toString(),
    };
}

export const SALT_ORDER_EXTRA_META: RecordMeta<
    SaltOrderExtra,
    SaltOrderExtraJSON,
    SaltOrderExtraBrokenJSON
> & { name: "SaltOrderExtra" } = {
    name: "SaltOrderExtra",
    type: "record",
    repair: repairSaltOrderExtraJSON,
    toJSON: SaltOrderExtraToJSON,
    fromJSON: JSONToSaltOrderExtra,
    fields: {
        description: { type: "string" },
        amount: { type: "money" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type SaltOrderJSON = {
    id: string;
    recordVersion: number | null;
    enteredBy: string | null;
    orderDate: string | null;
    orderNumber: number | null;
    orderedBy: string;
    billingContact: ContactDetailJSON;
    deliveryContact: ContactDetailJSON;
    purchaseOrderNumber: string;
    terms: string;
    customer: string;
    deliveryAddress: AddressJSON;
    specialInstructions: DatedStringJSON[];
    lines: SaltOrderLineJSON[];
    discount: string;
    deliveredBy: string;
    deliveredDate: string | null;
    invoicedDate: string | null;
    extras: SaltOrderExtraJSON[];
    payments: SaltOrderPaymentJSON[];
    pstExempt: boolean;
    cancelled: boolean;
    writeOff: string;
};

export function JSONToSaltOrder(json: SaltOrderJSON): SaltOrder {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        enteredBy: json.enteredBy,
        orderDate:
            json.orderDate !== null ? LocalDate.parse(json.orderDate) : null,
        orderNumber: json.orderNumber,
        orderedBy: json.orderedBy,
        billingContact: JSONToContactDetail(json.billingContact),
        deliveryContact: JSONToContactDetail(json.deliveryContact),
        purchaseOrderNumber: json.purchaseOrderNumber,
        terms: json.terms,
        customer: json.customer,
        deliveryAddress: JSONToAddress(json.deliveryAddress),
        specialInstructions: json.specialInstructions.map((inner) =>
            JSONToDatedString(inner)
        ),
        lines: json.lines.map((inner) => JSONToSaltOrderLine(inner)),
        discount: new Decimal(json.discount),
        deliveredBy: json.deliveredBy,
        deliveredDate:
            json.deliveredDate !== null
                ? LocalDate.parse(json.deliveredDate)
                : null,
        invoicedDate:
            json.invoicedDate !== null
                ? LocalDate.parse(json.invoicedDate)
                : null,
        extras: json.extras.map((inner) => JSONToSaltOrderExtra(inner)),
        payments: json.payments.map((inner) => JSONToSaltOrderPayment(inner)),
        pstExempt: json.pstExempt,
        cancelled: json.cancelled,
        writeOff: new Decimal(json.writeOff),
    };
}
export type SaltOrderBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    enteredBy?: string | null;
    orderDate?: string | null;
    orderNumber?: number | null;
    orderedBy?: string;
    billingContact?: ContactDetailJSON;
    deliveryContact?: ContactDetailJSON;
    purchaseOrderNumber?: string;
    terms?: string;
    customer?: string;
    deliveryAddress?: AddressJSON;
    specialInstructions?: DatedStringJSON[];
    lines?: SaltOrderLineJSON[];
    discount?: string;
    deliveredBy?: string;
    deliveredDate?: string | null;
    invoicedDate?: string | null;
    extras?: SaltOrderExtraJSON[];
    payments?: SaltOrderPaymentJSON[];
    pstExempt?: boolean;
    cancelled?: boolean;
    writeOff?: string;
};

export function newSaltOrder(): SaltOrder {
    return JSONToSaltOrder(repairSaltOrderJSON(undefined));
}
export function repairSaltOrderJSON(
    json: SaltOrderBrokenJSON | undefined
): SaltOrderJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            enteredBy: json.enteredBy || null,
            orderDate: json.orderDate || null,
            orderNumber:
                json.orderNumber === undefined ? null : json.orderNumber,
            orderedBy: json.orderedBy || "",
            billingContact: repairContactDetailJSON(json.billingContact),
            deliveryContact: repairContactDetailJSON(json.deliveryContact),
            purchaseOrderNumber: json.purchaseOrderNumber || "",
            terms: json.terms || "",
            customer: json.customer || "",
            deliveryAddress: repairAddressJSON(json.deliveryAddress),
            specialInstructions: (json.specialInstructions || []).map((inner) =>
                repairDatedStringJSON(inner)
            ),
            lines: (json.lines || []).map((inner) =>
                repairSaltOrderLineJSON(inner)
            ),
            discount: json.discount || "0",
            deliveredBy: json.deliveredBy || "",
            deliveredDate: json.deliveredDate || null,
            invoicedDate: json.invoicedDate || null,
            extras: (json.extras || []).map((inner) =>
                repairSaltOrderExtraJSON(inner)
            ),
            payments: (json.payments || []).map((inner) =>
                repairSaltOrderPaymentJSON(inner)
            ),
            pstExempt: json.pstExempt || false,
            cancelled: json.cancelled || false,
            writeOff: json.writeOff || "0",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            enteredBy: undefined || null,
            orderDate: undefined || null,
            orderNumber: null,
            orderedBy: undefined || "",
            billingContact: repairContactDetailJSON(undefined),
            deliveryContact: repairContactDetailJSON(undefined),
            purchaseOrderNumber: undefined || "",
            terms: undefined || "",
            customer: undefined || "",
            deliveryAddress: repairAddressJSON(undefined),
            specialInstructions: (undefined || []).map((inner) =>
                repairDatedStringJSON(inner)
            ),
            lines: (undefined || []).map((inner) =>
                repairSaltOrderLineJSON(inner)
            ),
            discount: undefined || "0",
            deliveredBy: undefined || "",
            deliveredDate: undefined || null,
            invoicedDate: undefined || null,
            extras: (undefined || []).map((inner) =>
                repairSaltOrderExtraJSON(inner)
            ),
            payments: (undefined || []).map((inner) =>
                repairSaltOrderPaymentJSON(inner)
            ),
            pstExempt: undefined || false,
            cancelled: undefined || false,
            writeOff: undefined || "0",
        };
    }
}

export function SaltOrderToJSON(value: SaltOrder): SaltOrderJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        enteredBy: value.enteredBy,
        orderDate: value.orderDate !== null ? value.orderDate.toString() : null,
        orderNumber: value.orderNumber,
        orderedBy: value.orderedBy,
        billingContact: ContactDetailToJSON(value.billingContact),
        deliveryContact: ContactDetailToJSON(value.deliveryContact),
        purchaseOrderNumber: value.purchaseOrderNumber,
        terms: value.terms,
        customer: value.customer,
        deliveryAddress: AddressToJSON(value.deliveryAddress),
        specialInstructions: value.specialInstructions.map((inner) =>
            DatedStringToJSON(inner)
        ),
        lines: value.lines.map((inner) => SaltOrderLineToJSON(inner)),
        discount: value.discount.toString(),
        deliveredBy: value.deliveredBy,
        deliveredDate:
            value.deliveredDate !== null
                ? value.deliveredDate.toString()
                : null,
        invoicedDate:
            value.invoicedDate !== null ? value.invoicedDate.toString() : null,
        extras: value.extras.map((inner) => SaltOrderExtraToJSON(inner)),
        payments: value.payments.map((inner) => SaltOrderPaymentToJSON(inner)),
        pstExempt: value.pstExempt,
        cancelled: value.cancelled,
        writeOff: value.writeOff.toString(),
    };
}

export const SALT_ORDER_META: RecordMeta<
    SaltOrder,
    SaltOrderJSON,
    SaltOrderBrokenJSON
> & { name: "SaltOrder" } = {
    name: "SaltOrder",
    type: "record",
    repair: repairSaltOrderJSON,
    toJSON: SaltOrderToJSON,
    fromJSON: JSONToSaltOrder,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        enteredBy: { type: "uuid", linkTo: "User" },
        orderDate: { type: "date" },
        orderNumber: { type: "serial" },
        orderedBy: { type: "string" },
        billingContact: CONTACT_DETAIL_META,
        deliveryContact: CONTACT_DETAIL_META,
        purchaseOrderNumber: { type: "string" },
        terms: { type: "string" },
        customer: { type: "string" },
        deliveryAddress: ADDRESS_META,
        specialInstructions: { type: "array", items: DATED_STRING_META },
        lines: { type: "array", items: SALT_ORDER_LINE_META },
        discount: { type: "percentage" },
        deliveredBy: { type: "string" },
        deliveredDate: { type: "date" },
        invoicedDate: { type: "date" },
        extras: { type: "array", items: SALT_ORDER_EXTRA_META },
        payments: { type: "array", items: SALT_ORDER_PAYMENT_META },
        pstExempt: { type: "boolean" },
        cancelled: { type: "boolean" },
        writeOff: { type: "money" },
    },
    userFacingKey: "orderNumber",
    functions: {
        textColor: {
            fn: calcSaltOrderTextColor,
            parameterTypes: () => [SALT_ORDER_META],
            returnType: { type: "string" },
        },
        color: {
            fn: calcSaltOrderColor,
            parameterTypes: () => [SALT_ORDER_META],
            returnType: { type: "string" },
        },
        paymentDate: {
            fn: calcSaltOrderPaymentDate,
            parameterTypes: () => [SALT_ORDER_META],
            returnType: { type: "date" },
        },
        specialInstructionsList: {
            fn: calcSaltOrderSpecialInstructionsList,
            parameterTypes: () => [SALT_ORDER_META],
            returnType: { type: "string" },
        },
        subTotal: {
            fn: calcSaltOrderSubTotal,
            parameterTypes: () => [SALT_ORDER_META],
            returnType: { type: "money" },
        },
        totalPayments: {
            fn: calcSaltOrderTotalPayments,
            parameterTypes: () => [SALT_ORDER_META],
            returnType: { type: "money" },
        },
        pendingAmount: {
            fn: calcSaltOrderPendingAmount,
            parameterTypes: () => [SALT_ORDER_META],
            returnType: { type: "money" },
        },
        discountAmount: {
            fn: calcSaltOrderDiscountAmount,
            parameterTypes: () => [SALT_ORDER_META],
            returnType: { type: "money" },
        },
        preTaxTotal: {
            fn: calcSaltOrderPreTaxTotal,
            parameterTypes: () => [SALT_ORDER_META],
            returnType: { type: "money" },
        },
        pst: {
            fn: calcSaltOrderPst,
            parameterTypes: () => [SALT_ORDER_META],
            returnType: { type: "money" },
        },
        gst: {
            fn: calcSaltOrderGst,
            parameterTypes: () => [SALT_ORDER_META],
            returnType: { type: "money" },
        },
        total: {
            fn: calcSaltOrderTotal,
            parameterTypes: () => [SALT_ORDER_META],
            returnType: { type: "money" },
        },
        orderBags: {
            fn: calcSaltOrderOrderBags,
            parameterTypes: () => [
                SALT_ORDER_META,
                { type: "uuid", linkTo: "SaltProduct" },
            ],
            returnType: { type: "quantity" },
        },
        orderPails: {
            fn: calcSaltOrderOrderPails,
            parameterTypes: () => [
                SALT_ORDER_META,
                { type: "uuid", linkTo: "SaltProduct" },
            ],
            returnType: { type: "quantity" },
        },
        orderItems: {
            fn: calcSaltOrderOrderItems,
            parameterTypes: () => [
                SALT_ORDER_META,
                { type: "uuid", linkTo: "SaltProduct" },
            ],
            returnType: { type: "quantity" },
        },
        pending: {
            fn: calcSaltOrderPending,
            parameterTypes: () => [SALT_ORDER_META],
            returnType: { type: "boolean" },
        },
        active: {
            fn: calcSaltOrderActive,
            parameterTypes: () => [SALT_ORDER_META],
            returnType: { type: "boolean" },
        },
    },
    segments: {},
};

export type BulkSaltDeliveryJSON = {
    deliveredBy: string;
    deliveredDate: string | null;
};

export function JSONToBulkSaltDelivery(
    json: BulkSaltDeliveryJSON
): BulkSaltDelivery {
    return {
        deliveredBy: json.deliveredBy,
        deliveredDate:
            json.deliveredDate !== null
                ? LocalDate.parse(json.deliveredDate)
                : null,
    };
}
export type BulkSaltDeliveryBrokenJSON = {
    deliveredBy?: string;
    deliveredDate?: string | null;
};

export function newBulkSaltDelivery(): BulkSaltDelivery {
    return JSONToBulkSaltDelivery(repairBulkSaltDeliveryJSON(undefined));
}
export function repairBulkSaltDeliveryJSON(
    json: BulkSaltDeliveryBrokenJSON | undefined
): BulkSaltDeliveryJSON {
    if (json) {
        return {
            deliveredBy: json.deliveredBy || "",
            deliveredDate: json.deliveredDate || null,
        };
    } else {
        return {
            deliveredBy: undefined || "",
            deliveredDate: undefined || null,
        };
    }
}

export function BulkSaltDeliveryToJSON(
    value: BulkSaltDelivery
): BulkSaltDeliveryJSON {
    return {
        deliveredBy: value.deliveredBy,
        deliveredDate:
            value.deliveredDate !== null
                ? value.deliveredDate.toString()
                : null,
    };
}

export const BULK_SALT_DELIVERY_META: RecordMeta<
    BulkSaltDelivery,
    BulkSaltDeliveryJSON,
    BulkSaltDeliveryBrokenJSON
> & { name: "BulkSaltDelivery" } = {
    name: "BulkSaltDelivery",
    type: "record",
    repair: repairBulkSaltDeliveryJSON,
    toJSON: BulkSaltDeliveryToJSON,
    fromJSON: JSONToBulkSaltDelivery,
    fields: {
        deliveredBy: { type: "string" },
        deliveredDate: { type: "date" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
