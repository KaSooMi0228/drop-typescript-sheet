import Decimal from "decimal.js";

export interface Dictionary<T> {
    [index: string]: T;
}

export type Serial = number | null;

export type Money = Decimal;
export type Percentage = Decimal;
export type Quantity = Decimal;
