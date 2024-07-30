import * as React from "react";
import { FormControl } from "react-bootstrap";
import TextareaAutosize from "react-textarea-autosize";
import { statusToState, Widget, WidgetStatus } from "./index";
import { SimpleAtomic } from "./simple-atomic";

export type TextAreaWidgetAction = {
    type: "SET";
    value: string;
};

type TextAreaWidgetProps = {
    state: null;
    data: string;
    dispatch: (action: TextAreaWidgetAction) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    hideStatus?: boolean;
    fixedSize?: boolean;
};

export type TextAreaWidgetType = Widget<
    null,
    string,
    {},
    TextAreaWidgetAction,
    {
        style?: React.CSSProperties;
        hideStatus?: boolean;
        fixedSize?: boolean;
    }
>;

export const TextAreaWidget: TextAreaWidgetType = {
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
    component({
        data,
        dispatch,
        status,
        style,
        hideStatus,
        fixedSize,
    }: TextAreaWidgetProps) {
        return (
            <FormControl
                as={fixedSize ? "textarea" : TextareaAutosize}
                disabled={!status.mutable}
                value={data}
                onChange={(event: React.SyntheticEvent<{}>) =>
                    dispatch({
                        type: "SET",
                        value: (event.target as HTMLInputElement).value,
                    })
                }
                style={style}
                className={
                    hideStatus
                        ? ""
                        : statusToState(status.validation, data === "")
                }
            />
        );
    },
    reduce(
        state: null,
        data: string,
        action: TextAreaWidgetAction,
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

export function StaticTextArea(props: { value: string }) {
    return (
        <FormControl
            as={TextareaAutosize}
            disabled={true}
            value={props.value}
        />
    );
}
