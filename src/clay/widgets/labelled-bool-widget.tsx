import { uniqueId } from "lodash";
import * as React from "react";
import { ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import { Widget, WidgetStatus } from "../widgets/index";
import { SimpleAtomic } from "../widgets/simple-atomic";

export type LabelledBoolWidgetAction = {
    type: "SET";
    value: boolean;
};

type LabelledBoolWidgetProps = {
    state: null;
    data: boolean;
    dispatch: (action: LabelledBoolWidgetAction) => void;
    status: WidgetStatus;
};

export type LabelledBoolWidgetType = Widget<
    null,
    boolean,
    {},
    LabelledBoolWidgetAction,
    {}
>;

export function LabelledBoolWidget(
    true_label: string,
    false_label: string
): LabelledBoolWidgetType {
    return {
        ...SimpleAtomic,
        dataMeta: {
            type: "boolean",
        },
        initialize(data: boolean) {
            return {
                state: null,
                data,
            };
        },
        component({ data, dispatch, status }: LabelledBoolWidgetProps) {
            const id = React.useMemo(uniqueId, []);
            return (
                <div>
                    <ToggleButtonGroup
                        type="radio"
                        value={`${data}`}
                        name="id"
                        onChange={(value: string) =>
                            dispatch({
                                type: "SET",
                                value: value === "true",
                            })
                        }
                    >
                        <ToggleButton
                            value="false"
                            variant={!data ? "primary" : "light"}
                            disabled={!status.mutable}
                        >
                            {false_label}
                        </ToggleButton>

                        <ToggleButton
                            value="true"
                            variant={data ? "primary" : "light"}
                            disabled={!status.mutable}
                        >
                            {true_label}
                        </ToggleButton>
                    </ToggleButtonGroup>
                </div>
            );
        },
        reduce(
            state: null,
            data: boolean,
            action: LabelledBoolWidgetAction,
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
}
