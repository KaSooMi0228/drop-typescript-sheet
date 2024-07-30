import { NumberWidgets } from "./number-widget";
import * as React from "react";

export const [DecimalWidget, DecimalStatic] = NumberWidgets({
    type: "quantity",
    prefix: null,
    suffix: null,
    format: (value) => value.toString(),
    unformat: (value) => value,
    color: (value) => undefined,
});
