import * as React from "react";
import ReactSwitch from "react-switch";
import { Widget, WidgetStatus } from "./index";
import { SimpleAtomic } from "./simple-atomic";

export type SwitchWidgetAction = {
    type: "SET";
    value: boolean;
};

type SwitchWidgetProps = {
    state: null;
    data: boolean;
    dispatch: (action: SwitchWidgetAction) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
};

export type SwitchWidgetType = Widget<
    null,
    boolean,
    {},
    SwitchWidgetAction,
    { style?: React.CSSProperties }
>;

export const SwitchWidget: SwitchWidgetType = {
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
    component({ data, dispatch, status, style }: SwitchWidgetProps) {
        return (
            <div style={style}>
                <ReactSwitch
                    checked={data}
                    disabled={!status.mutable}
                    onChange={(event) =>
                        dispatch({
                            type: "SET",
                            value: event,
                        })
                    }
                />
            </div>
        );
    },
    reduce(
        state: null,
        data: boolean,
        action: SwitchWidgetAction,
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
