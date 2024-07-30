import { PaginatedWidget } from "../../clay/paginated-widget";
import { QuickCacheApi } from "../../clay/quick-cache";
import { calcUserCodeName, USER_META } from "../user/table";
import PayoutAdminWidget from "./PayoutAdminWidget.widget";
import PayoutMainWidget, {
    PayoutCFWidgetFactory,
} from "./PayoutMainWidget.widget";
import PayoutMarginsWidget from "./PayoutMarginsWidget.widget";
import PayoutNotesWidget from "./PayoutNotesWidget.widget";
import { PAYOUT_META } from "./table";
import * as React from "react";

export const PayoutWidget = PaginatedWidget({
    dataMeta: PAYOUT_META,
    validate(detailSheet, cache, errors) {
        if (detailSheet.date) {
            return [];
        } else {
            return errors;
        }
    },
    pages(data) {
        return [
            {
                id: "main",
                title: "Contract Amount",
                widget: PayoutMainWidget,
            },
            ...data.certifiedForemen.map((section, index) => ({
                id: `cf-${index}`,
                title: (cache: QuickCacheApi) => {
                    const user = cache.get(
                        USER_META,
                        data.certifiedForemen[index].certifiedForeman
                    );
                    if (user) {
                        return calcUserCodeName(user);
                    } else {
                        return "...";
                    }
                },
                widget: PayoutCFWidgetFactory(index),
            })),
            {
                id: "notes",
                title: "Non-CF Expenses",
                widget: PayoutNotesWidget,
            },
            {
                id: "margins",
                title: "Margins",
                widget: PayoutMarginsWidget,
            },
            {
                id: "admin",
                title: "Admin",
                widget: PayoutAdminWidget,
                admin: true,
            },
        ];
    },
});
