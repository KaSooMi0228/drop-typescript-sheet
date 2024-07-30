import React from "react";
import { Button, ButtonProps } from "react-bootstrap";
import CLAY_CONFIG from "../clay-config";

export function OpenButton(
    props: ButtonProps & { children: React.ReactNode; style: {} }
) {
    if (CLAY_CONFIG.usePopups) {
        let { href, ...extraProps } = props;
        return (
            <Button
                {...extraProps}
                onClick={() => {
                    window.open(href);
                }}
            />
        );
    } else {
        return <Button {...props} />;
    }
}
