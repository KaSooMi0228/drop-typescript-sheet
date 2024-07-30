import { Decimal } from "decimal.js";
import * as React from "react";
import { Badge, Button, FormControl, InputGroup } from "react-bootstrap";
import { Widget, WidgetStatus } from "./index";
import { SimpleAtomic } from "./simple-atomic";

export function withCommas(
    suppressCommas: boolean | undefined,
    text: string
): string {
    if (suppressCommas) {
        return text;
    }
    var parts = text.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

export type NumberWidgetAction =
    | {
          type: "SET";
          value: string;
      }
    | {
          type: "RESET";
      }
    | {
          type: "BLUR";
      };

type NumberCommonProps = {
    style?: React.CSSProperties;
    fallbackText?: string;
    suppressCommas?: boolean;
};

type MoneyStaticProps = {
    value: Decimal;
} & NumberCommonProps;

type NumberWidgetProps = {
    state: string | null;
    data: Decimal;
    dispatch: (action: NumberWidgetAction) => void;
    status: WidgetStatus;
    hideStatus?: boolean;
    money?: boolean;
    defaultValue?: Decimal;
    badge?: string;
} & NumberCommonProps;

type MoneyWidgetOptions = {
    type: "money" | "quantity" | "percentage";
    prefix: React.ReactElement | null;
    suffix: React.ReactElement | null;
    format: (decimal: Decimal) => string;
    unformat: (decimal: Decimal) => Decimal;
    color: (decimal: Decimal) => undefined | string;
    fallbackText?: string;
    defaultValue?: Decimal;
};

export function NumberWidgets(options: MoneyWidgetOptions): [
    Widget<
        string | null,
        Decimal,
        {},
        NumberWidgetAction,
        {
            hideStatus?: boolean;
            defaultValue?: Decimal;
            base?: string;
            badge?: string;
        } & NumberCommonProps
    >,
    React.SFC<MoneyStaticProps>
] {
    function Static(props: MoneyStaticProps) {
        return NumberWidget.component({
            data: props.value,
            dispatch: () => {},
            state: null,
            status: {
                mutable: false,
                validation: [],
            },
            hideStatus: true,
            style: props.style,
            suppressCommas: props.suppressCommas,
            fallbackText: props.fallbackText,
        });
    }

    const NumberWidget: Widget<
        string | null,
        Decimal,
        {},
        NumberWidgetAction,
        {
            hideStatus?: boolean;
            badge?: string;
        } & NumberCommonProps
    > = {
        ...SimpleAtomic,
        noGrow: true,
        dataMeta: {
            type: options.type,
        },
        initialize(data: Decimal) {
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
            state,
            fallbackText,
            suppressCommas,
            defaultValue,
            badge,
        }: NumberWidgetProps) {
            const [hasFocus, setHasFocus] = React.useState(false);
            const reset = React.useCallback(() => {
                dispatch({
                    type: "RESET",
                });
            }, [dispatch]);
            const effectiveData =
                !data.isZero() || defaultValue === undefined
                    ? data
                    : defaultValue;
            return (
                <InputGroup style={{ width: "auto" }}>
                    {options.prefix}
                    {!data.isZero() && defaultValue !== undefined && (
                        <InputGroup.Prepend>
                            <InputGroup.Text>
                                <Badge variant="primary">
                                    {data.greaterThan(defaultValue) && "+"}
                                    {options.format(data.minus(defaultValue))}
                                </Badge>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    style={{
                                        fontSize: "8pt",
                                        padding: "2px",
                                        width: "3em",
                                    }}
                                    onClick={reset}
                                >
                                    X
                                </Button>
                            </InputGroup.Text>
                        </InputGroup.Prepend>
                    )}
                    {badge && (
                        <InputGroup.Prepend>
                            <InputGroup.Text
                                style={{ padding: "0px", color: "red" }}
                            >
                                <Badge>{badge}</Badge>
                            </InputGroup.Text>
                        </InputGroup.Prepend>
                    )}
                    <FormControl
                        type="text"
                        disabled={!status.mutable}
                        value={
                            state === null
                                ? !hasFocus || !data.isZero()
                                    ? data.isZero() &&
                                      fallbackText !== undefined
                                        ? fallbackText
                                        : withCommas(
                                              suppressCommas,
                                              options.format(effectiveData)
                                          )
                                    : ""
                                : state
                        }
                        onChange={(event: React.SyntheticEvent<{}>) =>
                            dispatch({
                                type: "SET",
                                value: (event.target as HTMLInputElement).value,
                            })
                        }
                        onFocus={(
                            event: React.FocusEvent<HTMLInputElement>
                        ) => {
                            event.target && event.target.select();
                            setHasFocus(true);
                        }}
                        style={{
                            textAlign: "right",
                            color: options.color(data),
                            ...style,
                        }}
                        className={
                            "decimal-widget " +
                            (hideStatus
                                ? ""
                                : status.validation.length > 0
                                ? "is-invalid"
                                : "")
                        }
                        onBlur={() => {
                            setHasFocus(false);
                            if (state) {
                                dispatch({
                                    type: "BLUR",
                                });
                            }
                        }}
                    />
                    {options.suffix}
                </InputGroup>
            );
        },
        reduce(
            state: string | null,
            data: Decimal,
            action: NumberWidgetAction,
            context: {}
        ) {
            switch (action.type) {
                case "SET":
                    let value;
                    try {
                        const filtered = action.value.replace(/,/g, "");
                        value = new Decimal(filtered);
                    } catch (error) {
                        return {
                            state: action.value,
                            data,
                        };
                    }
                    return {
                        state: action.value,
                        data: options.unformat(value),
                    };
                case "RESET": {
                    return {
                        state: null,
                        data: new Decimal(0),
                    };
                }
                case "BLUR":
                    return {
                        state: null,
                        data,
                    };
            }
        },
        validate(data: Decimal) {
            if (!data.isZero()) {
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

    return [NumberWidget, Static];
}

export const [QuantityWidget, QuantityStatic] = NumberWidgets({
    type: "quantity",
    prefix: null,
    suffix: null,
    format: (value) => value.toString(),
    unformat: (value) => value,
    color: (data) => "black",
});
