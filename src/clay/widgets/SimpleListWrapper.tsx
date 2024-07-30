import React from "react";
import { Widget } from ".";
import { TableRow } from "./TableRow";

export function SimpleListWrapper<
    StateType,
    DataType,
    ContextType,
    ActionType,
    ExtraPropsType
>(
    inner: Widget<StateType, DataType, ContextType, ActionType, ExtraPropsType>,
    extra?: React.ReactNode
): Widget<StateType, DataType, ContextType, ActionType, ExtraPropsType> {
    return {
        ...inner,
        component: (props) => {
            return (
                <TableRow>
                    <>
                        {extra}
                        <inner.component {...props} />
                    </>
                </TableRow>
            );
        },
    };
}
