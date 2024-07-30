import { components } from "react-select";
import * as React from "react";

export function MySelectContainer(props: any) {
    function onKeyDown(event: any) {
        switch (event.key) {
            case "Home":
            case "End":
                return;
            default:
                return props.innerProps.onKeyDown(event);
        }
    }
    return components.SelectContainer({
        ...props,
        innerProps: {
            ...props.innerProps,
            onKeyDown,
        },
    });
}
