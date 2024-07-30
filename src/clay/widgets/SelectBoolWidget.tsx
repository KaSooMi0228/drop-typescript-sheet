import { css } from "glamor";
import Select from "react-select";
import { statusToState, Widget, WidgetStatus } from "../widgets";
import { SimpleAtomic } from "../widgets/simple-atomic";
import { selectStyle } from "./SelectLinkWidget";
import * as React from "react";

const WIDGET_STYLE = css({
    ".is-valid": {
        backgroundPosition: "center right calc(0.375em + 0.7275rem)",
    },
});
export type SelectWidgetAction = {
    type: "SET";
    value: boolean;
};

type SelectWidgetProps = {
    state: null;
    data: boolean | "";
    dispatch: (action: SelectWidgetAction) => void;
    status: WidgetStatus;
    hideStatus?: boolean;
};

export function SelectBoolWidget(
    false_label: string,
    true_label: string
): Widget<
    null,
    boolean,
    {},
    SelectWidgetAction,
    {
        hideStatus?: boolean;
    }
> {
    const OPTIONS = [
        {
            value: false,
            label: false_label,
        },
        {
            value: true,
            label: true_label,
        },
    ];
    return {
        ...SimpleAtomic,
        dataMeta: {
            type: "string",
        },
        initialize(data: boolean) {
            return {
                state: null,
                data,
            };
        },
        component(props: SelectWidgetProps) {
            return (
                <Select
                    {...WIDGET_STYLE}
                    isDisabled={!props.status.mutable}
                    value={props.data ? OPTIONS[1] : OPTIONS[0]}
                    onChange={(selected) => {
                        if (selected) {
                            props.dispatch({
                                type: "SET",
                                value: selected.value,
                            });
                        }
                    }}
                    styles={selectStyle(props.status.validation.length > 0)}
                    className={
                        props.hideStatus
                            ? ""
                            : statusToState(
                                  props.status.validation,
                                  props.data === null
                              )
                    }
                    getOptionLabel={(option) => option.label}
                    getOptionValue={(option) => `${option.value}`}
                    options={OPTIONS}
                    menuPlacement="auto"
                />
            );
        },
        reduce(
            state: null,
            data: boolean,
            action: SelectWidgetAction,
            context: {}
        ) {
            switch (action.type) {
                case "SET":
                    return {
                        state: null,
                        data: action.value,
                        requests: [],
                    };
            }
        },
        validate(data: boolean) {
            return [];
        },
    };
}
