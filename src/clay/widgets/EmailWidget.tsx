import * as EmailValidator from "email-validator";
import { TextWidget } from "./TextWidget";
import * as React from "react";

export const EmailWidget = {
    ...TextWidget,
    validate(text: string) {
        if (text === "") {
            return [
                {
                    empty: true,
                    invalid: false,
                },
            ];
        } else if (EmailValidator.validate(text)) {
            return [];
        } else {
            return [
                {
                    empty: false,
                    invalid: true,
                },
            ];
        }
    },
};
