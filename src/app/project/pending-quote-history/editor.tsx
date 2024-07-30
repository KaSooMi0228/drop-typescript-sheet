import { AdminTablePage } from "../../../clay/admin-table";
import LandingLikelihoodWidget from "./LandingLikelihoodWidget.widget";
import * as React from "react";

export const LandingLikelihoodPage = AdminTablePage({
    rowWidget: LandingLikelihoodWidget,
    compare: (lhs, rhs) => lhs.number.comparedTo(rhs.number),
    columns: [
        {
            id: "number",
            label: "Number",
            width: 400,
        },
        {
            id: "name",
            label: "Name",
            width: 100,
        },
        {
            id: "weighting",
            label: "Weighting",
        },
    ],
});
