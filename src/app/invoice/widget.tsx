import { PaginatedWidget } from "../../clay/paginated-widget";
import InvoiceMainWidget from "./InvoiceMainWidget.widget";
import { INVOICE_META } from "./table";
import * as React from "react";

export const InvoiceWidget = PaginatedWidget({
    dataMeta: INVOICE_META,
    pages() {
        return [
            {
                id: "main",
                title: "Invoice Details",
                widget: InvoiceMainWidget,
            },
        ];
    },
});
