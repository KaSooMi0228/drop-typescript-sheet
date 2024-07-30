import * as React from "react";
import ReactSwitch from "react-switch";
import { Widget, WidgetStatus } from "./index";
import { SimpleAtomic } from "./simple-atomic";

export type DefaultSwitchWidgetAction = {
    type: "SET";
    value: boolean | null;
};

type DefaultSwitchWidgetExtraProps = {
    defaultValue: boolean;
    free: boolean;
    style?: React.CSSProperties;
};

type DefaultSwitchWidgetProps = {
    state: null;
    data: boolean | null;
    dispatch: (action: DefaultSwitchWidgetAction) => void;
    status: WidgetStatus;
} & DefaultSwitchWidgetExtraProps;

export type DefaultSwitchWidgetType = Widget<
    null,
    boolean | null,
    {},
    DefaultSwitchWidgetAction,
    DefaultSwitchWidgetExtraProps
>;

export const DefaultSwitchWidget: DefaultSwitchWidgetType = {
    ...SimpleAtomic,
    dataMeta: {
        type: "boolean",
    },
    initialize(data: boolean | null) {
        return {
            state: null,
            data,
        };
    },
    component({
        data,
        dispatch,
        status,
        defaultValue,
        free,
        style,
    }: DefaultSwitchWidgetProps) {
        return (
            <div style={style}>
                <ReactSwitch
                    checked={data === null ? defaultValue : data}
                    disabled={!status.mutable || !free}
                    onChange={(event) => {
                        dispatch({
                            type: "SET",
                            value: event === defaultValue ? null : event,
                        });
                    }}
                />
            </div>
        );
    },
    reduce(
        state: null,
        data: boolean | null,
        action: DefaultSwitchWidgetAction,
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
