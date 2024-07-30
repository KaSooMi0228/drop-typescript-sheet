import { Decimal } from "decimal.js";
import { css } from "glamor";
import { find } from "lodash";
import Select from "react-select";
import { statusToState, Widget, WidgetStatus } from "../widgets";
import { SimpleAtomic } from "../widgets/simple-atomic";
import * as React from "react";

const WIDGET_STYLE = css({
    ".is-valid": {
        backgroundPosition: "center right calc(0.375em + 0.7275rem)",
    },
});
export type SelectNumberWidgetAction = {
    type: "SET";
    value: Decimal;
};

type SelectNumberWidgetProps = {
    state: null;
    data: Decimal;
    dispatch: (action: SelectNumberWidgetAction) => void;
    status: WidgetStatus;
    hideStatus?: boolean;
};

type OptionOf = {
    value: Decimal;
    label: string;
};

const INVALID_STYLE = {
    control: (provided: any) => ({
        ...provided,
        borderColor: "#C71C22",
    }),
};

export function SelectNumberWidget(options: OptionOf[]): Widget<
    null,
    Decimal,
    {},
    SelectNumberWidgetAction,
    {
        hideStatus?: boolean;
    }
> {
    return {
        ...SimpleAtomic,
        dataMeta: {
            type: "string",
        },
        initialize(data: Decimal) {
            return {
                state: null,
                data,
            };
        },
        component(props: SelectNumberWidgetProps) {
            const currentSelected: OptionOf = find(options, (option) =>
                props.data.equals(option.value)
            )!;
            return (
                <Select
                    {...WIDGET_STYLE}
                    isDisabled={!props.status.mutable}
                    value={currentSelected}
                    onChange={(selected) => {
                        if (selected) {
                            props.dispatch({
                                type: "SET",
                                value: (selected as OptionOf).value,
                            });
                        }
                    }}
                    styles={
                        props.status.validation.length > 0
                            ? INVALID_STYLE
                            : undefined
                    }
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
                    options={options}
                    menuPlacement="auto"
                />
            );
        },
        reduce(
            state: null,
            data: Decimal,
            action: SelectNumberWidgetAction,
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
        validate(data: Decimal) {
            if (!data.isZero()) {
                return [];
            } else {
                return [
                    {
                        empty: true,
                        invalid: false,
                    },
                ];
            }
        },
    };
}
