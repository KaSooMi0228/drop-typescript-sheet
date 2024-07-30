import { RemoveButton } from "../remove-button";
import { WidgetPropsOf } from "./index";
import { ListWidget, useListItemContext } from "./ListWidget";
import { TextWidget } from "./TextWidget";
import * as React from "react";

const TextLineWidget: typeof TextWidget = {
    ...TextWidget,
    component: (props: WidgetPropsOf<typeof TextWidget>) => {
        const listItemContext = useListItemContext();
        return (
            <li {...listItemContext.draggableProps}>
                <div style={{ display: "flex" }}>
                    <div style={{ width: ".4in" }}>
                        {listItemContext.dragHandle}
                    </div>
                    <TextWidget.component {...props} />
                    <RemoveButton />
                </div>
            </li>
        );
    },
};

const BaseListWidget = ListWidget(TextLineWidget, { emptyOk: true });

export const TextArrayWidget: typeof BaseListWidget = {
    ...BaseListWidget,
    component: (props: WidgetPropsOf<typeof BaseListWidget>) => {
        return (
            <BaseListWidget.component
                {...props}
                extraItemForAdd
                containerClass="ol"
            />
        );
    },
};
