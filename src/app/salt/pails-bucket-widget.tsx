import { uniqueId } from "lodash";
import * as React from "react";
import { ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import { Widget, WidgetStatus } from "../../clay/widgets/index";
import { SimpleAtomic } from "../../clay/widgets/simple-atomic";

export type PailsBagsWidgetAction = {
    type: "SET";
    value: "pails" | "bags" | "items";
};

type PailsBagsWidgetProps = {
    state: null;
    data: "pails" | "bags" | "items";
    dispatch: (action: PailsBagsWidgetAction) => void;
    status: WidgetStatus;
};

export type PailsBagsWidgetType = Widget<
    null,
    "pails" | "bags" | "items",
    {},
    PailsBagsWidgetAction,
    {}
>;

export const PailsBagsWidget: PailsBagsWidgetType = {
    ...SimpleAtomic,
    dataMeta: {
        type: "enum",
        values: ["pails", "bags", "items"],
    },
    initialize(data: "pails" | "bags" | "items") {
        return {
            state: null,
            data,
        };
    },
    component({ data, dispatch, status }: PailsBagsWidgetProps) {
        const id = React.useMemo(uniqueId, []);
        return (
            <ToggleButtonGroup
                type="radio"
                value={data}
                name="id"
                onChange={(value: "pails" | "bags" | "items") =>
                    dispatch({
                        type: "SET",
                        value,
                    })
                }
            >
                <ToggleButton
                    value="pails"
                    variant={data === "pails" ? "primary" : "light"}
                    disabled={!status.mutable}
                >
                    Pails
                </ToggleButton>
                <ToggleButton
                    value="bags"
                    variant={data === "bags" ? "primary" : "light"}
                    disabled={!status.mutable}
                >
                    Bags
                </ToggleButton>
            </ToggleButtonGroup>
        );
    },
    reduce(
        state: null,
        data: "pails" | "bags" | "items",
        action: PailsBagsWidgetAction,
        context: {}
    ) {
        switch (action.type) {
            case "SET":
                return {
                    state: null,
                    data: action.value,
                };
        }
    },
    validate() {
        return [];
    },
};
