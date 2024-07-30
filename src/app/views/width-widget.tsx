import Decimal from "decimal.js";
import { css } from "glamor";
import * as React from "react";
import { ResizableBox } from "react-resizable";
import { Widget, WidgetStatus } from "../../clay/widgets/index";
import { SimpleAtomic } from "../../clay/widgets/simple-atomic";

export type WidthWidgetAction = {
    type: "SET";
    value: number;
};

type WidthWidgetProps = {
    state: null;
    data: Decimal;
    dispatch: (action: WidthWidgetAction) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    hideStatus?: boolean;
    name: string;
};

export type WidthWidgetType = Widget<
    null,
    Decimal,
    {},
    WidthWidgetAction,
    {
        style?: React.CSSProperties;
        hideStatus?: boolean;
        name: string;
    }
>;

const BOX_STYLE = css({
    border: "solid 1px black",
    lineHeight: "30px",
    textAlign: "center",
});

export const WidthWidget: WidthWidgetType = {
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
    component(props: WidthWidgetProps) {
        return (
            <ResizableBox
                className="public_fixedDataTable_header"
                width={Math.max(100, props.data.toNumber())}
                height={30}
                axis="x"
                resizeHandles={["e"]}
                onResize={(_, data) => {
                    props.dispatch({
                        type: "SET",
                        value: data.size.width,
                    });
                }}
                {...BOX_STYLE}
            >
                {props.name}
            </ResizableBox>
        );
    },
    reduce(state: null, data: Decimal, action: WidthWidgetAction, context: {}) {
        switch (action.type) {
            case "SET":
                return {
                    state: null,
                    data: new Decimal(action.value),
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
                    invalid: false,
                    empty: true,
                },
            ];
        }
    },
};
