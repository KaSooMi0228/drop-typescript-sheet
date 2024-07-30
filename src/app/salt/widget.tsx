import * as React from "react";
import { useQuery } from "../../clay/api";
import { PageContext } from "../../clay/Page";
import { PaginatedWidget } from "../../clay/paginated-widget";
import { WidgetStatus } from "../../clay/widgets/index";
import { ContactDetail, JSONToContactDetail } from "../contact/table";
import SaltOrderBillingDetailsWidget from "./SaltOrderBillingDetailsWidget.widget";
import SaltOrderOrderDetailsWidget from "./SaltOrderOrderDetailsWidget.widget";
import SaltOrderOrderStatusWidget from "./SaltOrderOrderStatusWidget.widget";
import {
    JSONToSaltOrderLine,
    SaltOrder,
    SaltOrderLine,
    SaltProductJSON,
    SALT_ORDER_META,
} from "./table";

type LastOrderContextType = {
    deliveryContact: ContactDetail | null;
    billingContact: ContactDetail | null;
    customer: string;
    lines: SaltOrderLine[];
};
export const LastOrderContext =
    React.createContext<LastOrderContextType | null>(null);

export const SaltOrderWidgetBase = PaginatedWidget<SaltOrder, PageContext>({
    dataMeta: SALT_ORDER_META,
    pages() {
        return [
            {
                id: "billing-details",
                title: "Billing Details",
                widget: SaltOrderBillingDetailsWidget,
            },
            {
                id: "order-details",
                title: "Order Details",
                widget: SaltOrderOrderDetailsWidget,
            },
            {
                id: "order-status",
                title: "Order Status",
                widget: SaltOrderOrderStatusWidget,
            },
        ];
    },
});

export const SaltOrderWidget = {
    ...SaltOrderWidgetBase,
    component(
        props: React.PropsWithChildren<{
            state: import("../../clay/paginated-widget").PaginatedWidgetState<
                SaltOrder,
                PageContext
            >;
            data: SaltOrder;
            dispatch: (
                action: import("../../clay/paginated-widget").PaginatedWidgetAction<SaltOrder>
            ) => void;
            status: WidgetStatus;
            label?: string | undefined;
        }>
    ) {
        const saltProducts = (
            useQuery(
                {
                    tableName: "SaltProduct",
                    columns: ["."],
                    sorts: ["name"],
                },
                []
            ) || []
        ).map((row) => row[0] as SaltProductJSON);

        const lastOrder = useQuery(
            {
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
                            equal: props.data.deliveryAddress.line1,
                        },
                    },
                    {
                        column: "deliveryAddress.city",
                        filter: {
                            equal: props.data.deliveryAddress.city,
                        },
                    },
                ],
                sorts: ["-orderNumber"],
                limit: 1,
            },
            [props.data.deliveryAddress]
        );

        return (
            <LastOrderContext.Provider
                value={
                    lastOrder && lastOrder[0]
                        ? {
                              deliveryContact: JSONToContactDetail(
                                  lastOrder[0][0] as any
                              ),
                              billingContact: JSONToContactDetail(
                                  lastOrder[0][1] as any
                              ),
                              customer: (lastOrder[0][2] as any) || "",
                              lines: (lastOrder[0][3] as any).map(
                                  JSONToSaltOrderLine
                              ),
                          }
                        : null
                }
            >
                {SaltOrderWidgetBase.component(props)}
            </LastOrderContext.Provider>
        );
    },
};
