import { css } from "glamor";
import * as React from "react";
import { RemoveButton } from "../remove-button";
import { useListItemContext } from "./ListWidget";

const TABLE_ROW_STYLE = css({
    "& td": {
        height: "100%",
    },
    "& div.cell-wrapper": {
        /*display: "flex",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",*/
    },
});

export function BaseTableRow(props: {
    children: React.ReactNode;
    disableMove?: boolean;
}) {
    const listItemContext = useListItemContext();

    return (
        <tr {...listItemContext.draggableProps} {...TABLE_ROW_STYLE}>
            <td
                style={{
                    verticalAlign: "middle",
                    display: props.disableMove ? "none" : undefined,
                }}
            >
                {listItemContext.dragHandle}
            </td>
            {props.children}
            <td>
                <RemoveButton />
            </td>
        </tr>
    );
}

export function TableRow(props: {
    children: React.ReactNode;
    flexSizes?: boolean;
    disableMove?: boolean;
}) {
    const count = React.Children.count(props.children);

    return (
        <BaseTableRow disableMove={props.disableMove}>
            {React.Children.map(props.children, (child, index) => {
                if (child === null) {
                    return null;
                }
                return (
                    <td
                        style={
                            props.flexSizes ? {} : { width: 100 / count + "%" }
                        }
                        key={index}
                    >
                        <div className="cell-wrapper">{child}</div>
                    </td>
                );
            })}
        </BaseTableRow>
    );
}
