import { Decimal } from "decimal.js";
import * as React from "react";
import { Badge, Button, FormControl, InputGroup } from "react-bootstrap";
import { statusToState, Widget, WidgetStatus } from "./index";
import { rawFormatMoney } from "./money-widget";
import { withCommas } from "./number-widget";
import { SimpleAtomic } from "./simple-atomic";

export type DecimalDefaultWidgetAction =
    | {
          type: "SET";
          percentage?: boolean;
          value: string | Decimal;
      }
    | {
          type: "BLUR";
      }
    | {
          type: "CLEAR";
      };

type DecimalDefaultWidgetProps = {
    state: string | null;
    data: Decimal | null;
    defaultData: Decimal | null;
    dispatch: (action: DecimalDefaultWidgetAction) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    hideStatus?: boolean;
    money?: boolean;
    percentage?: boolean;
    clearable?: boolean;
    showDiff?: boolean;
};

export const DecimalDefaultWidget: Widget<
    string | null,
    Decimal | null,
    {},
    DecimalDefaultWidgetAction,
    {
        style?: React.CSSProperties;
        hideStatus?: boolean;
        money?: boolean;
        percentage?: boolean;
        clearable?: boolean;
        defaultData: Decimal | null;
        showDiff?: boolean;
    }
> = {
    ...SimpleAtomic,
    dataMeta: {
        type: "string",
    },
    initialize(data: Decimal | null) {
        return {
            state: null,
            data,
        };
    },
    component({
        data,
        defaultData,
        dispatch,
        status,
        style,
        hideStatus,
        state,
        money,
        clearable,
        percentage,
        showDiff,
    }: DecimalDefaultWidgetProps) {
        const value = data === null ? defaultData : data;

        const format = (value: Decimal | null) =>
            value === null
                ? ""
                : money
                ? rawFormatMoney(value)
                : percentage
                ? value.times(100).toString()
                : value.toString();

        return (
            <InputGroup style={{ width: "auto" }}>
                {money && (
                    <InputGroup.Prepend>
                        <InputGroup.Text>$</InputGroup.Text>
                    </InputGroup.Prepend>
                )}
                {data !== null && defaultData !== null && showDiff && (
                    <InputGroup.Prepend>
                        <InputGroup.Text>
                            <Badge variant="primary">
                                {data.greaterThan(defaultData) && "+"}
                                {format(
                                    data.minus(defaultData).toDecimalPlaces(2)
                                )}
                            </Badge>
                        </InputGroup.Text>
                    </InputGroup.Prepend>
                )}

                <FormControl
                    type="text"
                    disabled={!status.mutable}
                    value={
                        state === null
                            ? withCommas(false, format(value))
                            : state
                    }
                    onChange={(event: React.SyntheticEvent<{}>) =>
                        dispatch({
                            type: "SET",
                            percentage,
                            value: (event.target as HTMLInputElement).value,
                        })
                    }
                    style={{
                        textAlign: "right",
                        ...style,
                    }}
                    className={
                        "decimal-widget " +
                        (hideStatus
                            ? ""
                            : statusToState(
                                  status.validation,
                                  data === null || data.isZero()
                              ))
                    }
                    onFocus={(event: React.FocusEvent<HTMLInputElement>) => {
                        event.target && event.target.select();
                    }}
                    onBlur={() =>
                        dispatch({
                            type: "BLUR",
                        })
                    }
                />
                {percentage && (
                    <InputGroup.Append>
                        <InputGroup.Text>%</InputGroup.Text>
                    </InputGroup.Append>
                )}

                {clearable && status.mutable && data !== null && (
                    <InputGroup.Append>
                        <Button onClick={() => dispatch({ type: "CLEAR" })}>
                            X
                        </Button>
                    </InputGroup.Append>
                )}
            </InputGroup>
        );
    },
    reduce(
        state: string | null,
        data: Decimal | null,
        action: DecimalDefaultWidgetAction,
        context: {}
    ) {
        switch (action.type) {
            case "SET":
                if (action.value instanceof Decimal) {
                    return {
                        state: null,
                        data: action.percentage
                            ? action.value.dividedBy(100)
                            : action.value,
                    };
                } else {
                    let value;
                    try {
                        value = new Decimal(action.value.replace(/,/g, ""));
                    } catch (error) {
                        return {
                            state: action.value,
                            data,
                        };
                    }
                    return {
                        state: action.value,
                        data: action.percentage ? value.dividedBy(100) : value,
                    };
                }
            case "BLUR":
                return {
                    state: null,
                    data,
                };
            case "CLEAR":
                return {
                    state: null,
                    data: null,
                };
        }
    },
    validate(data: Decimal | null) {
        if (data === null || !data.isZero()) {
            return [];
        } else {
            return [
                {
                    empty: true,
                    invalid: false,
                },
            ];
        }
    },
};
