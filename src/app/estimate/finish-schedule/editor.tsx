import { AdminCollectionPage } from "../../../clay/admin-collection-page";
import FinishScheduleRowWidget from "./FinishScheduleRowWidget.widget";
import * as React from "react";

export const FinishSchedulePage = AdminCollectionPage({
    meta: FinishScheduleRowWidget,
    adminCategory: "estimates",
    labelColumn: "name",
    urlPrefix: "#/admin/finish-schedules",
    title: "Finish Schedule Options",
});
