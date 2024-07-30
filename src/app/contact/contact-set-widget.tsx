import { css } from "glamor";
import { find } from "lodash";
import * as React from "react";
import { Button } from "react-bootstrap";
import Select from "react-select";
import { useQuickAllRecords } from "../../clay/quick-cache";
import { Widget, WidgetResult, WidgetStatus } from "../../clay/widgets";
import { selectStyle } from "../../clay/widgets/SelectLinkWidget";
import { CONTACT_TYPE_META } from "../contact-type/table";
import { ContactDetail, CONTACT_DETAIL_META } from "./table";

type ContactSetWidgetState = {};

type ContactSetWidgetAction = {
    type: "SET";
    value: ContactDetail[];
};

type ContactSetWidgetProps = {
    state: ContactSetWidgetState;
    data: ContactDetail[];
    dispatch: (action: ContactSetWidgetAction) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    contacts: ContactDetail[];
    horizontal?: true;
    selectAll?: boolean;
};

const PERMISSON_LABEL_STYLE = css({
    paddingLeft: ".25in",
    lineHeight: "28px",
    verticalAlign: "text-bottom",
});

const SELECT_CONTAINER = css({
    display: "flex",
    ">div:first-child": {
        flexGrow: 1,
    },
});

function initialize(
    data: ContactDetail[],
    context: {}
): WidgetResult<ContactSetWidgetState, ContactDetail[]> {
    return {
        data,
        state: {},
    };
}
export const ContactSetWidget: Widget<
    ContactSetWidgetState,
    ContactDetail[],
    {},
    ContactSetWidgetAction,
    {
        style?: React.CSSProperties;
        contacts: ContactDetail[];
        horizontal?: true;
        selectAll?: boolean;
    }
> = {
    dataMeta: {
        type: "array",
        items: CONTACT_DETAIL_META,
    },
    initialize,
    component: (props: ContactSetWidgetProps) => {
        const onChange = React.useCallback(
            (selections) => {
                props.dispatch({
                    type: "SET",
                    value: selections ? selections : [],
                });
            },
            [props.dispatch]
        );

        let records = props.contacts;

        const onSelectAll = React.useCallback(
            () =>
                props.dispatch({
                    type: "SET",
                    value: records,
                }),
            [props.dispatch, records]
        );

        const contactTypes = useQuickAllRecords(CONTACT_TYPE_META);

        return (
            <div {...SELECT_CONTAINER}>
                <Select
                    isMulti
                    isDisabled={!props.status.mutable}
                    onChange={onChange}
                    value={records.filter((record) =>
                        find(
                            props.data,
                            (other) => other.contact === record.contact
                        )
                    )}
                    styles={selectStyle(props.status.validation.length > 0)}
                    options={records}
                    getOptionLabel={(area) =>
                        `${area.name} (${
                            find(
                                contactTypes,
                                (contactType) =>
                                    contactType.id.uuid === area.type
                            )?.name
                        })`
                    }
                    getOptionValue={(area) => area.contact || ""}
                    menuPlacement="auto"
                />
                {props.selectAll && (
                    <Button onClick={onSelectAll} style={{ marginLeft: "1em" }}>
                        Select All
                    </Button>
                )}
            </div>
        );
    },
    reduce: (
        state: ContactSetWidgetState,
        data: ContactDetail[],
        action: ContactSetWidgetAction,
        context: {}
    ): WidgetResult<ContactSetWidgetState, ContactDetail[]> => {
        switch (action.type) {
            case "SET":
                return {
                    state,
                    data: action.value,
                };
        }
    },

    validate(data: ContactDetail[]) {
        if (data.length == 0) {
            return [
                {
                    invalid: false,
                    empty: true,
                },
            ];
        } else {
            return [];
        }
    },
};
