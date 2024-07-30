import { InputGroup } from "react-bootstrap";
import { NumberWidgets } from "./number-widget";
import * as React from "react";

export const [PercentageWidget, PercentageStatic] = NumberWidgets({
    type: "percentage",
    prefix: null,
    suffix: (
        <InputGroup.Append>
            <InputGroup.Text>%</InputGroup.Text>
        </InputGroup.Append>
    ),
    format: (value) => value.times(100).toString(),
    unformat: (value) => value.dividedBy(100),
    color: (value) => undefined,
});
