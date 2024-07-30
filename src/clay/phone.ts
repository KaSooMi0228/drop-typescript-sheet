import { conformToMask } from "react-text-mask";

export const SHORT_PATTERN = [
    /[1-9]/,
    /\d/,
    /\d/,
    "-",
    /\d/,
    /\d/,
    /\d/,
    "-",
    /\d/,
    /\d/,
    /\d/,
    /\d/,
];
export const PATTERN = [
    /[1-9]/,
    /\d/,
    /\d/,
    "-",
    /\d/,
    /\d/,
    /\d/,
    "-",
    /\d/,
    /\d/,
    /\d/,
    /\d/,
    " ",
    "e",
    "x",
    "t",
    " ",
    /\d/,
    /\d/,
    /\d/,
    /\d/,
    /\d/,
];

export class Phone {
    phone: string;

    constructor(phone: string) {
        this.phone = phone.replace(/\D/g, "");
    }

    format() {
        if (this.phone === "") {
            return "";
        }
        const base = conformToMask(
            this.phone,
            SHORT_PATTERN,
            {}
        ).conformedValue;
        if (this.phone.length > 10) {
            return base + " ext " + this.phone.slice(10);
        } else {
            return base;
        }
    }
}
