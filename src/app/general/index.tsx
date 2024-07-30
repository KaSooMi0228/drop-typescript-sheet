import { TableWidgetPage } from "../../clay/TableWidgetPage";
import GeneralWidget from "./GeneralWidget.widget";
import * as React from "react";

export const GeneralSettingsPage = TableWidgetPage({
    meta: GeneralWidget,
    title: () => "General Settings",
    makeContext: (context) => context,
});
