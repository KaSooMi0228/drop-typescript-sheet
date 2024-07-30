import { faBriefcase, faHouseUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isEqual } from "lodash";
import * as React from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import componentId from "../../clay/componentId";
import { Link } from "../../clay/link";
import { useQuickRecord } from "../../clay/quick-cache";
import { RemoveButton } from "../../clay/remove-button";
import {
    Widget,
    WidgetAction,
    WidgetContext,
    WidgetData,
    WidgetExtraProps,
    WidgetState,
} from "../../clay/widgets/index";
import { ListWidget, useListItemContext } from "../../clay/widgets/ListWidget";
import { COMPANY_META } from "../company/table";
import { ContactDetailWidget } from "./contact-widget";
import { buildCompanyDetail, Contact, CONTACT_META } from "./table";

const LinkWidgetBase = ContactDetailWidget();

export const ContactRowWidget: Widget<
    WidgetState<typeof LinkWidgetBase>,
    WidgetData<typeof LinkWidgetBase>,
    WidgetContext<typeof LinkWidgetBase>,
    WidgetAction<typeof LinkWidgetBase>,
    WidgetExtraProps<typeof LinkWidgetBase> & {
        forbiddenContactsToAdd?: Link<Contact>[];
    }
> = {
    ...LinkWidgetBase,
    component: (props) => {
        const listItemContext = useListItemContext();
        const types = React.useContext(ContactTypesContext);
        const onClear = React.useCallback(() => {
            props.dispatch({
                type: "CLEAR",
            });
        }, [props.dispatch]);

        const onOpen = React.useCallback(() => {
            window.open("#/contact/edit/" + props.data.contact);
        }, [props.data.contact]);

        const original = useQuickRecord(CONTACT_META, props.data.contact);
        const company = useQuickRecord(COMPANY_META, original?.company || null);
        const outOfDate = React.useMemo(() => {
            if (
                original === undefined ||
                original === null ||
                company === undefined
            ) {
                return [];
            }

            const changes = [];
            if (original?.name != props.data.name) {
                changes.push(`Name changed to: ${original?.name}`);
            }
            if (original?.email != props.data.email) {
                changes.push(`Email changed to: ${original?.email}`);
            }
            if (original?.type != props.data.type) {
                changes.push("Title changed");
            }
            if (
                original?.company != props.data.company.company &&
                props.data.company.company !== null
            ) {
                changes.push(`Company changed to ${company?.name}`);
            }
            if (!isEqual(original?.phones, props.data.phones)) {
                changes.push(`Phone number(s) changed`);
            } else if (
                props.data.company.company !== null &&
                !isEqual(buildCompanyDetail(company), props.data.company)
            ) {
                changes.push(`Company contact information updated.`);
            }
            if (original?.unitNumber != props.data.unitNumber) {
                changes.push(`Unit number changed to ${original?.unitNumber}`);
            }
            return changes;
        }, [original, company, props.data]);

        const onUpdate = React.useCallback(() => {
            if (original === undefined || company === undefined) {
                return;
            }
            if (
                window.confirm(
                    "Are you sure you want to update the contact information?"
                )
            ) {
                props.dispatch({
                    type: "SELECT",
                    contact: original,
                    company,
                });
            }
        }, [original, company, props.dispatch]);

        const onRemoveCompany = React.useCallback(() => {
            props.dispatch({
                type: "APPLY_COMPANY",
                company: null,
            });
        }, [props.dispatch]);

        const onAddCompany = React.useCallback(() => {
            props.dispatch({
                type: "APPLY_COMPANY",
                company: company!,
            });
        }, [props.dispatch, company]);

        const tooltipId = componentId();

        return (
            <tr {...listItemContext.draggableProps}>
                <td>{listItemContext.dragHandle}</td>
                <td>
                    {props.data.contact ? (
                        props.data.name
                    ) : (
                        <LinkWidgetBase.component {...props} />
                    )}
                </td>
                <td style={{ verticalAlign: "middle" }}>
                    {props.data.phones[0]?.number?.format()}
                </td>
                <td style={{ verticalAlign: "middle" }}>
                    {props.data.company.name}
                    {props.data.company.company && props.status.mutable && (
                        <Button
                            style={{ marginLeft: "1em" }}
                            onClick={onRemoveCompany}
                        >
                            <FontAwesomeIcon icon={faHouseUser} />
                        </Button>
                    )}
                    {!props.data.company.company &&
                        company &&
                        props.status.mutable && (
                            <Button
                                style={{ marginLeft: "1em" }}
                                onClick={onAddCompany}
                            >
                                <FontAwesomeIcon icon={faBriefcase} />
                            </Button>
                        )}
                </td>
                <td style={{ verticalAlign: "middle" }}>
                    {props.data.type && types[props.data.type]}
                </td>
                {props.status.mutable && (
                    <td>
                        {outOfDate.length > 0 && (
                            <OverlayTrigger
                                placement="right"
                                delay={{ show: 250, hide: 400 }}
                                overlay={
                                    <Tooltip id={tooltipId}>
                                        <ul>
                                            {outOfDate.map((x) => (
                                                <li>{x}</li>
                                            ))}
                                        </ul>
                                    </Tooltip>
                                }
                            >
                                <Button onClick={onUpdate}>Update</Button>
                            </OverlayTrigger>
                        )}
                    </td>
                )}
                <td>
                    {props.data.contact && (
                        <Button onClick={onOpen}>Open</Button>
                    )}
                </td>
                {props.status.mutable && (
                    <td>
                        {listItemContext.remove ? (
                            <RemoveButton />
                        ) : (
                            props.data.contact && (
                                <Button variant="danger" onClick={onClear}>
                                    Change
                                </Button>
                            )
                        )}
                    </td>
                )}
            </tr>
        );
    },
};

export const ContactTypesContext: React.Context<Dictionary<string>> =
    React.createContext({});
const MetaBase = ListWidget(ContactRowWidget);
export const ContactsWidget = {
    ...MetaBase,
    component(props: any) {
        return (
            <MetaBase.component
                {...props}
                itemProps={{
                    forbiddenContactsToAdd: props.forbiddenContactsToAdd || [],
                }}
                extraItemForAdd={props.extraItemForAdd ?? true}
                containerClass="tbody"
            />
        );
    },
};
