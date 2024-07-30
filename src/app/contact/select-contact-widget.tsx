import { css } from "glamor";
import { find } from "lodash";
import * as React from "react";
import Select from "react-select";
import { useQuickAllRecords } from "../../clay/quick-cache";
import { Widget, WidgetResult, WidgetStatus } from "../../clay/widgets";
import { selectStyle } from "../../clay/widgets/SelectLinkWidget";
import { CONTACT_TYPE_META } from "../contact-type/table";
import { ContactDetail, CONTACT_DETAIL_META } from "./table";

type SelectContactWidgetState = {};

type SelectContactWidgetAction = {
    type: "SET";
    value: ContactDetail;
};

type SelectContactWidgetProps = {
    state: SelectContactWidgetState;
    data: ContactDetail;
    dispatch: (action: SelectContactWidgetAction) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    contacts: ContactDetail[];
    horizontal?: true;
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
    data: ContactDetail,
    context: {}
): WidgetResult<SelectContactWidgetState, ContactDetail> {
    return {
        data,
        state: {},
    };
}
export const SelectContactWidget: Widget<
    SelectContactWidgetState,
    ContactDetail,
    {},
    SelectContactWidgetAction,
    {
        style?: React.CSSProperties;
        contacts: ContactDetail[];
        horizontal?: true;
    }
> = {
    dataMeta: {
        type: "array",
        items: CONTACT_DETAIL_META,
    },
    initialize,
    component: (props: SelectContactWidgetProps) => {
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

        const contactTypes = useQuickAllRecords(CONTACT_TYPE_META);

        return (
            <div {...SELECT_CONTAINER}>
                <Select
                    isDisabled={!props.status.mutable}
                    onChange={onChange}
                    value={find(
                        records,
                        (other) => other.contact === props.data.contact
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
            </div>
        );
    },
    reduce: (
        state: SelectContactWidgetState,
        data: ContactDetail,
        action: SelectContactWidgetAction,
        context: {}
    ): WidgetResult<SelectContactWidgetState, ContactDetail> => {
        switch (action.type) {
            case "SET":
                return {
                    state,
                    data: action.value,
                };
        }
    },

    validate(data: ContactDetail) {
        if (data.contact === null) {
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
