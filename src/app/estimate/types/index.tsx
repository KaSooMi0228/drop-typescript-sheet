import { DropdownLinkWidget } from "../../../clay/widgets/dropdown-link-widget";
import { SelectLinkWidget } from "../../../clay/widgets/SelectLinkWidget";
import {
    ApplicationTypeOption,
    APPLICATION_TYPE_META,
    APPLICATION_TYPE_OPTION_META,
    ITEM_TYPE_META,
    SUBSTRATE_META,
    UNIT_TYPE_META,
} from "./table";
import * as React from "react";

export const UnitTypeLinkWidget = DropdownLinkWidget({
    meta: UNIT_TYPE_META,
    label: (item) => item.name,
});
export const ItemTypeLinkWidget = DropdownLinkWidget({
    meta: ITEM_TYPE_META,
    label: (item) => item.name,
});
export const SubstrateLinkWidget = DropdownLinkWidget({
    meta: SUBSTRATE_META,
    label: (item) => item.name,
});
export const ApplicationTypeLinkWidget = DropdownLinkWidget({
    meta: APPLICATION_TYPE_META,
    label: (item) => item.name,
});
export const ApplicationWidget = SelectLinkWidget({
    meta: APPLICATION_TYPE_OPTION_META,
    label: (application: ApplicationTypeOption) => application.name,
});
