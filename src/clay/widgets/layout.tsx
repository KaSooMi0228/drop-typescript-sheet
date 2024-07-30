import * as React from "react";

export function FieldRow(props: {
    children: React.ReactNode;
    noExpand?: boolean;
    style?: React.CSSProperties;
}) {
    return (
        <div
            className={props.noExpand ? "field-row no-expand" : "field-row"}
            style={props.style}
        >
            {props.children}
        </div>
    );
}
