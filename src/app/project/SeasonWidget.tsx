import { isBefore } from "date-fns";
import { css } from "glamor";
import { find } from "lodash";
import Select from "react-select";
import { statusToState, Widget, WidgetStatus } from "../../clay/widgets";
import { selectStyle } from "../../clay/widgets/SelectLinkWidget";
import { SimpleAtomic } from "../../clay/widgets/simple-atomic";
import { hasPermission } from "../../permissions";
import { useUser } from "../state";
import * as React from "react";

const WIDGET_STYLE = css({
    ".is-valid": {
        backgroundPosition: "center right calc(0.375em + 0.7275rem)",
    },
});
export type SelectWidgetAction<T> = {
    type: "SET";
    value: T;
};

type SelectWidgetProps<T> = {
    state: null;
    data: T;
    dispatch: (action: SelectWidgetAction<T>) => void;
    status: WidgetStatus;
    hideStatus?: boolean;
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

function seasonSelectStyle(invalid: boolean) {
    return {
        ...selectStyle(invalid),
        option: (styles: any, data: any) => {
            return {
                ...styles,
                fontStyle: data.data.current ? undefined : "italic",
                backgroundColor: data.data.current ? undefined : "#eaeaea",
            };
        },
    };
}

export const SeasonWidget: Widget<
    null,
    string,
    {},
    SelectWidgetAction<string>,
    {
        hideStatus?: boolean;
    }
> = {
    ...SimpleAtomic,
    dataMeta: {
        type: "string",
    },
    initialize(data: string) {
        return {
            state: null,
            data,
        };
    },
    component(props: SelectWidgetProps<string>) {
        const user = useUser();
        const now = new Date();

        const options: string[] = [];

        if (isBefore(now, new Date(now.getFullYear(), 3, 15))) {
            options.push(
                `Winter ${now.getFullYear() - 1}/${now.getFullYear()}`
            );
        }
        if (isBefore(now, new Date(now.getFullYear(), 10, 1))) {
            options.push(`Summer ${now.getFullYear()}`);
        }
        options.push(`Winter ${now.getFullYear()}/${now.getFullYear() + 1}`);
        options.push(`Summer ${now.getFullYear() + 1}`);

        if (!isBefore(now, new Date(now.getFullYear(), 3, 15))) {
            options.push(
                `Winter ${now.getFullYear() + 1}/${now.getFullYear() + 2}`
            );
        }
        if (!isBefore(now, new Date(now.getFullYear(), 10, 1))) {
            options.push(`Summer ${now.getFullYear() + 2}`);
        }

        const oldOptions: string[] = [];

        if (hasPermission(user, "Project", "extra-seasons")) {
            for (let index = 2021; index >= 2010; index--) {
                const winter = `Winter ${index}/${index + 1}`;
                if (options.indexOf(winter) === -1) {
                    oldOptions.push(winter);
                }
                const summer = `Summer ${index}`;
                if (options.indexOf(summer) === -1) {
                    oldOptions.push(summer);
                }
            }
        }

        if (options.indexOf(props.data) === -1 && props.data !== "") {
            oldOptions.push(props.data);
        }

        const fullOptions = [
            ...options.map((option) => ({
                value: option,
                label: option,
                current: true,
            })),
            ...oldOptions.map((option) => ({
                value: option,
                label: option,
                current: false,
            })),
        ];

        const currentSelected = find(
            fullOptions,
            (option) => option.value === props.data
        );
        return (
            <Select
                {...WIDGET_STYLE}
                isDisabled={!props.status.mutable}
                value={currentSelected}
                onChange={(selected) => {
                    if (selected) {
                        props.dispatch({
                            type: "SET",
                            value: (selected as OptionOf<string>).value,
                        });
                    }
                }}
                styles={seasonSelectStyle(props.status.validation.length > 0)}
                className={
                    props.hideStatus
                        ? ""
                        : statusToState(
                              props.status.validation,
                              props.data === null
                          )
                }
                getOptionLabel={(option) => option.label}
                getOptionValue={(option) => option.value}
                options={fullOptions}
                menuPlacement="auto"
            />
        );
    },
    reduce(
        state: null,
        data: string | null,
        action: SelectWidgetAction<string>,
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
    validate(data: string) {
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
