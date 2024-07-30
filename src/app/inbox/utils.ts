import React from "react";
import { useQuickAllRecords } from "../../clay/quick-cache";
import { hasPermission } from "../../permissions";
import { PROJECT_DESCRIPTION_CATEGORY_META } from "../project-description/table";
import { useUser } from "../state";

export function useCategoryManagerFilter(prefix: string = "") {
    const user = useUser();

    const categories = hasPermission(user, "ProjectDescriptionCategory", "read")
        ? useQuickAllRecords(PROJECT_DESCRIPTION_CATEGORY_META)
        : undefined;

    const rfqCategories = React.useMemo(() => {
        return (categories || [])
            .filter((category) =>
                hasPermission(
                    user,
                    "Inbox",
                    "show-unassigned-" + category.id.uuid
                )
            )
            .map((category) => category.id.uuid);
    }, [categories, user]);

    return React.useMemo(() => {
        if (rfqCategories.length) {
            return {
                column: prefix + "descriptionCategories",
                filter: {
                    intersects: rfqCategories,
                },
            };
        } else {
            return {
                column: "null",
                filter: {
                    not_equal: null,
                },
            };
        }
    }, [rfqCategories]);
}
