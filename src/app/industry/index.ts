import { AdminTablePage } from "../../clay/admin-table";
import IndustryWidget from "./IndustryWidget.widget";

export const IndustrysPage = AdminTablePage({
    adminCategory: "contacts",
    rowWidget: IndustryWidget,
    compare: (lhs, rhs) => lhs.name.localeCompare(rhs.name),
    columns: [
        {
            id: "name",
            label: "Name",
            width: 400,
        },
    ],
});
