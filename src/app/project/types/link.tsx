import { durationCompare } from ".";
import { storeRecord } from "../../../clay/api";
import { newUUID } from "../../../clay/uuid";
import { DropdownLinkWidget } from "../../../clay/widgets/dropdown-link-widget";
import { LinkWidget } from "../../../clay/widgets/link-widget";
import {
    ANTICIPATED_DURATION_META,
    APPROVAL_TYPE_META,
    COMPETITOR_META,
    THIRD_PARTY_SPECIFIER_META,
} from "./table";
import * as React from "react";

export const ThirdPartySpecifierLinkWidget = LinkWidget({
    table: "ThirdPartySpecifier",
    activeColumn: "active",
    handleNew: async (text) => {
        if (
            confirm(
                "Are you sure you want to add new third-party specifier: " +
                    text
            )
        ) {
            const recordId = newUUID();
            await storeRecord(THIRD_PARTY_SPECIFIER_META, "", {
                id: recordId,
                recordVersion: { version: null },
                name: text,
                active: true,
            });
            return recordId.uuid;
        }
        return null;
    },
});

export const CompetitorLinkWidget = LinkWidget({
    table: "Competitor",
    activeColumn: "active",
    handleNew: async (text) => {
        if (confirm("Are you sure you want to add new competitor: " + text)) {
            const recordId = newUUID();
            await storeRecord(COMPETITOR_META, "", {
                id: recordId,
                recordVersion: { version: null },
                name: text,
                active: true,
            });
            return recordId.uuid;
        }
        return null;
    },
});
export const AnticipatedDurationLinkWidget = DropdownLinkWidget({
    meta: ANTICIPATED_DURATION_META,
    label: (season) => season.name,
    compare: durationCompare,
});
export const ApprovalTypeLinkWidget = DropdownLinkWidget({
    meta: APPROVAL_TYPE_META,
    label: (season) => season.name,
});
