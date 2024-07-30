import { DropdownLinkWidget } from "../../clay/widgets/dropdown-link-widget";
import { CONTACT_TYPE_META } from "./table";
import * as React from "react";

export const ContactTypeLinkWidget = DropdownLinkWidget({
    meta: CONTACT_TYPE_META,
    label: (contact) => contact.name,
});
