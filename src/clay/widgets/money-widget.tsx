import { Decimal } from "decimal.js";
import { InputGroup } from "react-bootstrap";
import { Money } from "../common";
import { NumberWidgets } from "./number-widget";
import * as React from "react";

export function rawFormatMoney(number: Money) {
    let base = number.toFixed();
    const index = base.indexOf(".");
    if (index == -1) {
        return base + ".00";
    } else {
        let places = base.length - (index + 1);
        while (places < 2) {
            base += "0";
            places += 1;
        }
        return base;
    }
}

export const [MoneyWidget, MoneyStatic] = NumberWidgets({
    type: "money",
    prefix: (
        <InputGroup.Prepend>
            <InputGroup.Text>$</InputGroup.Text>
        </InputGroup.Prepend>
    ),
    suffix: null,
    format: (value) => rawFormatMoney(value),
    unformat: (value) => value,
    color: (data) =>
        data.greaterThanOrEqualTo(new Decimal(0)) ? "black" : "red",
});
