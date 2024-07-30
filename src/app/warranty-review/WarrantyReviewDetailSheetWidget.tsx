import { PaginatedWidget } from "../../clay/paginated-widget";
import FinishScheduleTab from "./detail-sheet/FinishSchedule.widget";
import { WARRANTY_REVIEW_DETAIL_SHEET_META } from "./table";
import WarrantyReviewDetailSheetContractDetailsWidget from "./WarrantyReviewDetailSheetContractDetailsWidget.widget";
import WarrantyReviewDetailSheetMainWidget from "./WarrantyReviewDetailSheetMainWidget.widget";
import WarrantyReviewDetailSheetNotesWidget from "./WarrantyReviewDetailSheetNotesWidget.widget";
import WarrantyReviewDetailSheetTaskWidget from "./WarrantyReviewDetailSheetTasksWidget.widget";
import * as React from "react";

export default PaginatedWidget({
    dataMeta: WARRANTY_REVIEW_DETAIL_SHEET_META,
    validate(detailSheet, cache, errors) {
        if (detailSheet.date) {
            return [];
        } else {
            return errors;
        }
    },
    pages() {
        return [
            {
                id: "main",
                title: "Main",
                widget: WarrantyReviewDetailSheetMainWidget,
            },
            {
                id: "tasks",
                title: "Tasks",
                widget: WarrantyReviewDetailSheetTaskWidget,
            },
            {
                id: "finish-schedule",
                title: "Finish Schedule",
                widget: FinishScheduleTab,
            },
            {
                id: "notes",
                title: "Notes",
                widget: WarrantyReviewDetailSheetNotesWidget,
            },
            {
                id: "contractDetails",
                title: "CF Contract Details",
                widget: WarrantyReviewDetailSheetContractDetailsWidget,
            },
        ];
    },
});
