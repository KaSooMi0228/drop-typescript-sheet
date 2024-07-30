import { joinMap } from "../../clay/queryFuncs";
import { useQuickCache } from "../../clay/quick-cache";
import { FormWrapper } from "../../clay/widgets/FormField";
import { FieldRow } from "../../clay/widgets/layout";
import { StaticTextField } from "../../clay/widgets/TextWidget";
import { CONTACT_TYPE_META } from "../contact-type/table";
import { Project } from "../project/table";
import {
    ROLE_CERTIFIED_FOREMAN,
    ROLE_PROJECT_MANAGER,
    USER_META,
} from "../user/table";
import { WarrantyReview } from "../warranty-review/table";
import * as React from "react";

export function WarrantyReviewDetailsCommon(props: {
    project: Project;
    review: WarrantyReview;
}) {
    const cache = useQuickCache();

    return (
        <>
            <FieldRow>
                <FormWrapper label="Client's Name">
                    <StaticTextField value={props.project.customer} />
                </FormWrapper>
            </FieldRow>
            {props.review.ownersRepresentatives.map((billingContact, index) => (
                <FieldRow key={index}>
                    <FormWrapper label="Owners Representatives">
                        <StaticTextField value={billingContact.name} />
                    </FormWrapper>
                    <FormWrapper label="Phone">
                        <StaticTextField
                            value={joinMap(
                                billingContact.phones,
                                "; ",
                                (phone) =>
                                    phone.type + ": " + phone.number.format()
                            )}
                        />
                    </FormWrapper>
                    <FormWrapper label="Company">
                        <StaticTextField
                            value={
                                billingContact.company.name ||
                                "N/A - Personal Residence"
                            }
                        />
                    </FormWrapper>
                    <FormWrapper label="Title">
                        <StaticTextField
                            value={
                                cache.get(
                                    CONTACT_TYPE_META,
                                    billingContact.type
                                )?.name || ""
                            }
                        />
                    </FormWrapper>
                </FieldRow>
            ))}
            {props.project.personnel
                .filter((entry) => entry.role === ROLE_PROJECT_MANAGER)
                .map((entry, index) => (
                    <FieldRow key={index}>
                        <FormWrapper label="Remdal Project Manager">
                            <StaticTextField
                                value={
                                    cache.get(USER_META, entry.user)?.name || ""
                                }
                            />
                        </FormWrapper>
                    </FieldRow>
                ))}
            {props.project.personnel
                .filter((entry) => entry.role === ROLE_CERTIFIED_FOREMAN)
                .map((entry, index) => (
                    <FieldRow key={index}>
                        <FormWrapper label="Remdal Certified Foreman">
                            <StaticTextField
                                value={
                                    cache.get(USER_META, entry.user)?.name || ""
                                }
                            />
                        </FormWrapper>
                    </FieldRow>
                ))}
            {props.review.contacts.map((billingContact, index) => (
                <FieldRow key={index}>
                    <FormWrapper label="Customer Contact">
                        <StaticTextField value={billingContact.name} />
                    </FormWrapper>
                    <FormWrapper label="Phone">
                        <StaticTextField
                            value={joinMap(
                                billingContact.phones,
                                "; ",
                                (phone) =>
                                    phone.type + ": " + phone.number.format()
                            )}
                        />
                    </FormWrapper>
                    <FormWrapper label="Company">
                        <StaticTextField
                            value={
                                billingContact.company.name ||
                                "N/A - Personal Residence"
                            }
                        />
                    </FormWrapper>
                    <FormWrapper label="Title">
                        <StaticTextField
                            value={
                                cache.get(
                                    CONTACT_TYPE_META,
                                    billingContact.type
                                )?.name || ""
                            }
                        />
                    </FormWrapper>
                </FieldRow>
            ))}
        </>
    );
}
