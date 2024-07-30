import { DropdownLinkWidget } from "../../../clay/widgets/dropdown-link-widget";
import { LANDING_LIKELIHOOD_META } from "./table";
import * as React from "react";

export const LandingLikelihoodLinkWidget = DropdownLinkWidget({
    meta: LANDING_LIKELIHOOD_META,
    label: (record) => record.name,
    compare: (lhs, rhs) => lhs.number.comparedTo(rhs.number),
});
