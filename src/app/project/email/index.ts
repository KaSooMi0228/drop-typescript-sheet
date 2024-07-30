import DataGridPage from "../../../clay/dataGrid/DataGridPage";

export const ProjectEmailsPage = DataGridPage({
    table: "ProjectEmail",
    fallbackSorts: ["id"],
    dataSection: true,
});
