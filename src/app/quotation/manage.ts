import Decimal from "decimal.js";
import { doRecordQuery, storeRecord } from "../../clay/api";
import { UserPermissions } from "../../clay/server/api";
import { newUUID } from "../../clay/uuid";
import { duplicateEstimate, fetchEstimate } from "../estimate/manage";
import { Project } from "../project/table";
import { Quotation, QUOTATION_META } from "./table";

export function buildDuplicateQuotation(
    quotation: Quotation,
    user: UserPermissions,
    project: Project,
    previousQuotations: Quotation[]
): Quotation {
    return {
        ...quotation,
        project: project.id.uuid,
        id: newUUID(),
        recordVersion: { version: null },
        addedDateTime: null,
        modifiedDateTime: null,
        date: null,
        firstDate: null,
        user: user.id,
        number: previousQuotations
            .reduce(
                (current, quotation) => Decimal.max(current, quotation.number),
                new Decimal(0)
            )
            .plus(1),
        generated: false,
        change: project.projectAwardDate !== null,
        superceded: false,
    };
}

export async function duplicateQuotation(
    quotation: Quotation,
    project: Project,
    user: UserPermissions
) {
    const previousQuotations = doRecordQuery(QUOTATION_META, {
        filters: [
            {
                column: "project",
                filter: {
                    equal: project.id.uuid,
                },
            },
        ],
    });

    const newEstimates = await Promise.all(
        quotation.estimates.map(async (estimateId) => {
            const estimate = await fetchEstimate(estimateId);
            if (estimate) {
                const newEstimateId = await duplicateEstimate(
                    estimate,
                    project,
                    false
                );
                return newEstimateId;
            } else {
                return null;
            }
        })
    );

    const newQuotation = {
        ...buildDuplicateQuotation(
            quotation,
            user,
            project,
            await previousQuotations
        ),
        estimates: newEstimates,
    };

    await storeRecord(QUOTATION_META, "duplicate-quotation", newQuotation);

    return newQuotation;
}
