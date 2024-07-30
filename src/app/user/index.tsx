import { AdminCollectionPage } from "../../clay/admin-collection-page";
import { LinkWidget } from "../../clay/widgets/link-widget";
import SquadRowWidget from "./SquadRowWidget.widget";
import {
    ROLE_CERTIFIED_FOREMAN,
    ROLE_PROJECT_MANAGER,
    ROLE_SERVICE_REPRESENTATIVE,
} from "./table";
import * as React from "react";

export const UserLinkWidget = LinkWidget({
    table: "User",
});

function RoleLinkWidget(role: string) {
    return LinkWidget({
        table: "User",
        extraFilter: {
            column: "roles",
            filter: {
                intersects: [role],
            },
        },
        activeColumn: "active",
    });
}

export const ProjectManagerLinkWidget = RoleLinkWidget(ROLE_PROJECT_MANAGER);
export const ServiceRepresentativeLinkWidget = RoleLinkWidget(
    ROLE_SERVICE_REPRESENTATIVE
);

export const CertifiedForemanLinkWidget = LinkWidget({
    table: "User",
    extraFilter: {
        column: "roles",
        filter: {
            intersects: [ROLE_CERTIFIED_FOREMAN],
        },
    },
    activeColumn: "active",
    nameColumn: "codeName",
});

export const SquadPage = AdminCollectionPage({
    meta: SquadRowWidget,
    labelColumn: "name",
    urlPrefix: "#/admin/squads",
    adminCategory: "general",
});
