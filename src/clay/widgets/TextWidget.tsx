import * as React from "react";
import { Button, FormControl, InputGroup } from "react-bootstrap";
import { statusToState, Widget, WidgetStatus } from "./index";
import { SimpleAtomic } from "./simple-atomic";

export type TextWidgetAction =
    | {
          type: "SET";
          value: string;
      }
    | {
          type: "BLUR";
      };

type TextWidgetProps = {
    state: boolean;
    data: string;
    dispatch: (action: TextWidgetAction) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    hideStatus?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
    placeholder?: string;
    clearable?: boolean;
};

export type TextWidgetType = Widget<
    boolean,
    string,
    {},
    TextWidgetAction,
    {
        style?: React.CSSProperties;
        hideStatus?: boolean;
        onFocus?: () => void;
        onBlur?: () => void;
        placeholder?: string;
        clearable?: boolean;
    }
>;

export const TextWidget: TextWidgetType = {
    ...SimpleAtomic,
    dataMeta: {
        type: "string",
    },
    initialize(data: string) {
        return {
            state: false,
            data,
        };
    },
    component({
        data,
        dispatch,
        status,
        state,
        style,
        onFocus,
        onBlur,
        hideStatus,
        placeholder,
        clearable,
    }: TextWidgetProps) {
        const reset = React.useCallback(() => {
            dispatch({
                type: "SET",
                value: "",
            });
        }, [dispatch]);

        return (
            <InputGroup>
                <FormControl
                    type="text"
                    disabled={!status.mutable}
                    value={data}
                    onChange={(event: React.SyntheticEvent<{}>) =>
                        dispatch({
                            type: "SET",
                            value: (event.target as HTMLInputElement).value,
                        })
                    }
                    onBlur={() => {
                        onBlur && onBlur();
                        state && dispatch({ type: "BLUR" });
                    }}
                    style={{ ...style, flexGrow: 1 }}
                    onFocus={onFocus}
                    className={
                        hideStatus
                            ? ""
                            : statusToState(status.validation, data === "")
                    }
                    placeholder={placeholder}
                />
                {clearable && (
                    <InputGroup.Append>
                        <Button
                            variant="danger"
                            size="sm"
                            style={{ fontSize: "8pt", padding: "2px" }}
                            onClick={reset}
                        >
                            X
                        </Button>
                    </InputGroup.Append>
                )}
            </InputGroup>
        );
    },
    reduce(
        state: boolean,
        data: string,
        action: TextWidgetAction,
        context: {}
    ) {
        switch (action.type) {
            case "SET":
                return {
                    state: true,
                    data: action.value,
                };
            case "BLUR":
                return {
                    state: false,
                    data: data.trim().replace(/ +/, " "),
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

export function StaticTextField(props: { value: string }) {
    return <FormControl type="text" disabled={true} value={props.value} />;
}
