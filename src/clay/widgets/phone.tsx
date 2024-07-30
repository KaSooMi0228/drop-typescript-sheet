import * as React from "react";
import { FormControl } from "react-bootstrap";
import ReactTextMask from "react-text-mask";
import { PATTERN, Phone, SHORT_PATTERN } from "../phone";
import { Widget, WidgetStatus } from "./index";
import { SimpleAtomic } from "./simple-atomic";

export type PhoneWidgetAction = {
    type: "SET";
    value: Phone;
};

type PhoneWidgetProps = {
    state: null;
    data: Phone;
    dispatch: (action: PhoneWidgetAction) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    hideStatus?: boolean;
};

export function StaticPhoneWidget(props: { data: Phone }) {
    const longMask = props.data.phone.length > 10;

    return (
        <FormControl
            mask={longMask ? PATTERN : SHORT_PATTERN}
            as={ReactTextMask}
            type="text"
            disabled={true}
            value={props.data.phone}
        />
    );
}

export const PhoneWidget: Widget<
    null,
    Phone,
    {},
    PhoneWidgetAction,
    {
        style?: React.CSSProperties;
        hideStatus?: boolean;
    }
> = {
    ...SimpleAtomic,
    dataMeta: {
        type: "string",
    },
    initialize(data: Phone) {
        return {
            state: null,
            data,
        };
    },
    component({ data, dispatch, status, style, hideStatus }: PhoneWidgetProps) {
        const [focus, setFocus] = React.useState(false);
        const onFocus = React.useCallback(() => {
            setFocus(true);
        }, [setFocus]);
        const onBlur = React.useCallback(() => {
            setFocus(false);
        }, [setFocus]);

        const longMask = focus
            ? data.phone.length >= 10
            : data.phone.length > 10;
        return (
            <FormControl
                mask={longMask ? PATTERN : SHORT_PATTERN}
                as={ReactTextMask}
                type="text"
                disabled={!status.mutable}
                value={data.phone}
                onChange={(event: any) =>
                    dispatch({
                        type: "SET",
                        value: new Phone(
                            (event.target as HTMLInputElement).value
                        ),
                    })
                }
                style={style}
                onFocus={onFocus}
                onBlur={onBlur}
            />
        );
    },
    reduce(state: null, data: Phone, action: PhoneWidgetAction, context: {}) {
        switch (action.type) {
            case "SET":
                return {
                    state: null,
                    data: action.value,
                    requests: [],
                };
        }
    },
    validate(data: Phone) {
        if (data.phone !== "") {
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
