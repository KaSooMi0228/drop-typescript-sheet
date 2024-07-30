import { components, default as ReactSelect } from "react-select";
import makeAnimated from "react-select/animated";
import { SelectComponentsProps } from "react-select/src/Select";
import * as React from "react";

const allOption = {
    label: "Select all",
    value: "*",
};
const noneOption = {
    label: "Select none",
    value: "",
};
type Props = {};
const MySelect = (props: SelectComponentsProps) => {
    return (
        <ReactSelect
            {...props}
            isMulti
            options={[allOption, noneOption, ...props.options]}
            onChange={(selected, event) => {
                if (selected !== null && selected.length > 0) {
                    if (
                        selected[selected.length - 1].value === allOption.value
                    ) {
                        return props.onChange([...props.options]);
                    }
                    if (
                        selected[selected.length - 1].value === noneOption.value
                    ) {
                        return props.onChange([]);
                    }
                    let result = [];
                    if (selected.length === props.options.length) {
                        if (selected.includes(props.allOption)) {
                            result = selected.filter(
                                (option: any) =>
                                    option.value !== allOption.value
                            );
                        } else if (event.action === "select-option") {
                            result = [...props.options];
                        }
                        return props.onChange(result);
                    }
                }

                return props.onChange(selected);
            }}
        />
    );
};

const Option = (props: any) => {
    return (
        <div>
            <components.Option {...props}>
                {props.value !== "*" && props.value !== "" && (
                    <input
                        type="checkbox"
                        checked={props.isSelected}
                        onChange={() => null}
                    />
                )}{" "}
                <label>{props.label}</label>
            </components.Option>
        </div>
    );
};

const ValueContainer = ({ children, ...props }: any) => {
    const currentValues = props.getValue();
    let toBeRendered = children;
    if (currentValues.some((val: any) => val.value === allOption.value)) {
        toBeRendered = [[children[0][0]], children[1]];
    }

    return (
        <components.ValueContainer {...props}>
            {toBeRendered}
        </components.ValueContainer>
    );
};

const MultiValue = (props: any) => {
    let labelToBeDisplayed = `${props.data.label}`;
    if (props.data.value === allOption.value) {
        labelToBeDisplayed = "All is selected";
    }
    return (
        <components.MultiValue {...props}>
            <span>{labelToBeDisplayed}</span>
        </components.MultiValue>
    );
};

const animatedComponents = makeAnimated();

export function SelectSet(props: {
    value: { value: string; label: string }[];
    options: { value: string; label: string }[];
    onChange: (selected: { value: string; label: string }[]) => void;
}) {
    return (
        <span
            className="d-inline-block"
            data-toggle="popover"
            data-trigger="focus"
            data-content="Please selecet account(s)"
        >
            <MySelect
                options={props.options}
                isMulti
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                components={{
                    Option,
                    MultiValue,
                    ValueContainer,
                    animatedComponents,
                }}
                onChange={props.onChange}
                allowSelectAll={true}
                value={props.value}
                styles={{
                    // Fixes the overlapping problem of the component
                    menu: (provided: any) => {
                        return { ...provided, zIndex: 9999 };
                    },
                }}
            />
        </span>
    );
}
