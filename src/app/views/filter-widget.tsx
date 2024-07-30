import * as React from "react";
import { renderFilter } from "../../clay/dataGrid/DataGrid";
import { Meta } from "../../clay/meta";
import { Widget, WidgetStatus } from "../../clay/widgets/index";
import { SimpleAtomic } from "../../clay/widgets/simple-atomic";

export type FilterWidgetAction = {
    type: "SET";
    value: string;
};

type FilterWidgetExtraProps = {
    meta: Meta;
    style?: React.CSSProperties;
    hideStatus?: boolean;
};

type FilterWidgetProps = {
    state: null;
    data: string;
    dispatch: (action: FilterWidgetAction) => void;
    status: WidgetStatus;
} & FilterWidgetExtraProps;

export type FilterWidgetType = Widget<
    null,
    string,
    {},
    FilterWidgetAction,
    FilterWidgetExtraProps
>;

export const FilterWidget: FilterWidgetType = {
    ...SimpleAtomic,
    dataMeta: {
        type: "string",
    },
    initialize(data: string) {
        return {
            state: null,
            data,
        };
    },
    component(props: FilterWidgetProps) {
        return renderFilter(
            props.meta,
            props.data,
            (value) =>
                props.dispatch({
                    type: "SET",
                    value: value,
                }),
            200
        );
    },
    reduce(state: null, data: string, action: FilterWidgetAction, context: {}) {
        switch (action.type) {
            case "SET":
                return {
                    state: null,
                    data: action.value,
                    requests: [],
                };
        }
    },
    validate(data: string) {
        if (data !== "") {
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
