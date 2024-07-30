import { faTruck } from "@fortawesome/free-solid-svg-icons";
import Decimal from "decimal.js";
import { AdminCollectionPage } from "../../clay/admin-collection-page";
import { Dictionary } from "../../clay/common";
import { GridWithEditor } from "../../clay/dataGrid/gridWithEditor";
import { LocalDate } from "../../clay/LocalDate";
import { PageContext } from "../../clay/Page";
import { WidgetRequest } from "../../clay/widgets";
import BulkSaltDeliveryWidget from "./BulkSaltDeliveryWidget.widget";
import SaltProductWidget from "./SaltProductWidget.widget";
import {
    BulkSaltDelivery,
    calcSaltOrderPendingAmount,
    JSONToSaltPrice,
    SaltOrder,
    SaltOrderLine,
    SaltPrice,
    SaltProductJSON,
    SALT_ORDER_META,
} from "./table";
import { SaltOrderWidget } from "./widget";
import * as React from "react";

export const SaltProductPage = AdminCollectionPage({
    meta: SaltProductWidget,
    labelColumn: "name",
    urlPrefix: "#/admin/salt",
});

function isPriceMatch(line: SaltOrderLine, price: SaltPrice): boolean {
    if (line.quantity.lessThan(price.minQty)) {
        return false;
    }
    return true;
}

function resolvePrice(
    date: LocalDate | null,
    line: SaltOrderLine,
    products: any
): Decimal {
    if (!products) {
        return line.price;
    }

    for (const product of products.records as SaltProductJSON[]) {
        if (product.id === line.product) {
            const prices = product.noUnits
                ? product.prices
                : line.unit === "bags"
                ? product.bagPrices
                : product.pailPrices;
            let bestPrice = new Decimal(0);
            for (const price of prices) {
                const parsedPrice = JSONToSaltPrice(price);
                if (isPriceMatch(line, parsedPrice)) {
                    const month = date ? date.date.getMonth() : 1;
                    const earlyBird = month == 8 || month == 9;
                    bestPrice = earlyBird
                        ? parsedPrice.earlyPrice
                        : parsedPrice.price;
                }
            }
            return bestPrice;
        }
    }

    return line.price;
}
export const SaltOrderPage = GridWithEditor({
    prefix: "#/salt",
    newTitle: "New Order",
    meta: SaltOrderWidget,
    makeContext: (context) => context,
    colorColumn: "color",
    textColorColumn: "textColor",
    //    colorAppliedColumn: "orderNumber",
    fallbackSorts: ["-orderNumber"],
    title: (record) => {
        return "Salt Order";
    },
    initialize: (order: SaltOrder, context: PageContext) => {
        return {
            ...order,
            orderDate: order.orderDate || new LocalDate(new Date()),
            terms: order.orderDate !== null ? order.terms : "Net 30",
            enteredBy:
                order.orderDate !== null
                    ? order.enteredBy
                    : context.currentUserId,
        };
    },
    updater: (order: SaltOrder, requests: Dictionary<any>) => {
        if (order.deliveredDate !== null) {
            // do not update orders which have already been delivered
            return order;
        }
        return {
            ...order,
            lines: order.lines.map((line) => ({
                ...line,
                price: resolvePrice(order.orderDate, line, requests.products),
            })),
        };
    },
    locked: (order: SaltOrder) => {
        return (
            calcSaltOrderPendingAmount(order).isZero() && order.lines.length > 0
        );
        //(calcSaltOrderPendingAmount(order).isZero() &&
        //                order.payments.length > 0) ||
        //order.cancelled
    },
    bulkActions: [
        {
            name: "Mark Delivered",
            icon: faTruck,
            detail: BulkSaltDeliveryWidget,
            extraFilters: [
                {
                    column: "deliveredDate",
                    filter: { equal: null },
                },
                {
                    column: "active",
                    filter: { equal: true },
                },
            ],
            meta: SALT_ORDER_META,
            apply: (order: SaltOrder, detail: BulkSaltDelivery) => ({
                ...order,
                deliveredDate: detail.deliveredDate,
                deliveredBy: detail.deliveredBy,
            }),
        },
    ],
    requests: (_, order: SaltOrder) => {
        const requests: Dictionary<WidgetRequest> = {};

        requests.products = {
            type: "RECORDS",
            request: {
                tableName: "SaltProduct",
            },
        };

        if (order.deliveryAddress.line1 !== "") {
            requests.lastOrder = {
                type: "QUERY",
                request: {
                    tableName: "SaltOrder",
                    columns: [
                        "deliveryContact",
                        "billingContact",
                        "customer",
                        "lines",
                        "id",
                    ],
                    filters: [
                        {
                            column: "deliveryAddress.line1",
                            filter: {
                                equal: order.deliveryAddress.line1,
                            },
                        },
                        {
                            column: "deliveryAddress.city",
                            filter: {
                                equal: order.deliveryAddress.city,
                            },
                        },
                    ],
                    sorts: ["-orderNumber"],
                    limit: 1,
                },
            };
        }

        return requests;
    },
});
