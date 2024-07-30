import { LinkWidget } from "../../clay/widgets/link-widget";
import * as React from "react";

export const ContactLinkWidget = LinkWidget({
    table: "Contact",
    openUrl: "#/contact/edit",
    nameColumn: "summary",
});
