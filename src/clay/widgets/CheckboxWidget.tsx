import * as React from "react";
import { Form } from "react-bootstrap";
import { Widget, WidgetStatus } from "./index";
import { SimpleAtomic } from "./simple-atomic";

export type CheckboxWidgetAction = {
    type: "SET";
    value: boolean;
};

type CheckboxWidgetProps = {
    state: null;
    data: boolean;
    dispatch: (action: CheckboxWidgetAction) => void;
    status: WidgetStatus;
    checkLabel?: string;
};

export type CheckboxWidget = {
    state: null;
    data: boolean;
    action: CheckboxWidgetAction;
    context: {};
    props: {
        checkLabel?: string;
    };
};

export const CheckboxWidget: Widget<
    CheckboxWidget["state"],
    CheckboxWidget["data"],
    CheckboxWidget["context"],
    CheckboxWidget["action"],
    CheckboxWidget["props"]
> = {
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
    component({ data, dispatch, status, checkLabel }: CheckboxWidgetProps) {
        return (
            <Form.Check
                className="checkbox-widget"
                type="checkbox"
                checked={data}
                label={checkLabel}
                disabled={!status.mutable}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    dispatch({
                        type: "SET",
                        value: (event.target as HTMLInputElement).checked,
                    })
                }
            />
        );
    },
    reduce(
        state: null,
        data: boolean,
        action: CheckboxWidgetAction,
        context: {}
    ) {
        switch (action.type) {
            case "SET":
                return {
                    state: null,
                    data: action.value,
                    requests: [],
                };
        }
    },
    validate() {
        return [];
    },
};
