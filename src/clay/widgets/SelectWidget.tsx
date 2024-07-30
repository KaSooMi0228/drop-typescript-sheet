import { css } from "glamor";
import { find } from "lodash";
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
export type SelectWidgetAction<T> = {
    type: "SET";
    value: T | "";
};

type SelectWidgetProps<T> = {
    state: null;
    data: T | "";
    dispatch: (action: SelectWidgetAction<T>) => void;
    status: WidgetStatus;
    hideStatus?: boolean;
    options?: OptionOf<T>[];
    clearable?: boolean;
};

type OptionOf<T> = {
    value: T;
    label: string;
};

const INVALID_STYLE = {
    control: (provided: any) => ({
        ...provided,
        borderColor: "#C71C22",
    }),
};

export function SelectWidget<T extends string>(
    default_options: OptionOf<T>[]
): Widget<
    null,
    T | "",
    {},
    SelectWidgetAction<T>,
    {
        hideStatus?: boolean;
        options?: OptionOf<T>[];
        clearable?: boolean;
    }
> {
    return {
        ...SimpleAtomic,
        dataMeta: {
            type: "string",
        },
        initialize(data: T | "") {
            return {
                state: null,
                data,
            };
        },
        component(props: SelectWidgetProps<T>) {
            const options = props.options || default_options;
            const currentSelected: OptionOf<T> = find(
                options,
                (option) => props.data === option.value
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
                                value: (selected as OptionOf<T>).value,
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
                    options={options}
                    isClearable={props.clearable}
                    menuPlacement="auto"
                />
            );
        },
        reduce(
            state: null,
            data: T | "" | null,
            action: SelectWidgetAction<T>,
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
        validate(data: T | "") {
            if (data !== "") {
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
