import { AdminCollectionPage } from "../../../clay/admin-collection-page";
import DataGridPage from "../../../clay/dataGrid/DataGridPage";
import CustomerSurveyTemplateRowWidget from "./CustomerSurveyTemplateRowWidget.widget";
import * as React from "react";

export const CustomerSurveyTemplatesPage = AdminCollectionPage({
    meta: CustomerSurveyTemplateRowWidget,
    labelColumn: "name",
    urlPrefix: "#/admin/customer-survey-templates",
    title: "Customer Surveys",
    adminCategory: "projects",
});

export const CustomerSurveysPage = DataGridPage({
    table: "CustomerSurvey",
    dataSection: true,
    fallbackSorts: ["id"],
    pageTitle: "Customer Surveys",
});
