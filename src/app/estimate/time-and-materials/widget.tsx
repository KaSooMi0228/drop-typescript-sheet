import { PageContext } from "../../../clay/Page";
import { PaginatedWidget } from "../../../clay/paginated-widget";
import {
    TimeAndMaterialsEstimate,
    TIME_AND_MATERIALS_ESTIMATE_META,
} from "./table";
import TimeAndMaterialsEstimateMainWidget from "./TimeAndMaterialsEstimateMainWidget.widget";
import TimeAndMaterialsEstimateOverviewWidget from "./TimeAndMaterialsEstimateOverviewWidget.widget";
import * as React from "react";

export const TimeAndMaterialsEstimateWidget = PaginatedWidget<
    TimeAndMaterialsEstimate,
    PageContext
>({
    dataMeta: TIME_AND_MATERIALS_ESTIMATE_META,
    pages() {
        return [
            {
                id: "overview",
                title: "Overview",
                widget: TimeAndMaterialsEstimateOverviewWidget,
            },
            {
                id: "main",
                title: "Main",
                widget: TimeAndMaterialsEstimateMainWidget,
            },
        ];
    },
});
