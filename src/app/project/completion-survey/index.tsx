import DataGridPage from "../../../clay/dataGrid/DataGridPage";
import { TableWidgetPage } from "../../../clay/TableWidgetPage";
import CompletionSurveyTemplateWidget from "./CompletionSurveyTemplateWidget.widget";
import * as React from "react";

export const CompletionSurveyTemplatePage = TableWidgetPage({
    meta: CompletionSurveyTemplateWidget,
    title: () => "Payout Survey Template",
    makeContext: (context) => context,
});

export const PayoutSurveysPage = DataGridPage({
    table: "CompletionSurvey",
    dataSection: true,
    fallbackSorts: ["id"],
    pageTitle: "Payout Surveys",
});
