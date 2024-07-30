import React from "react";
import { Button, ButtonProps } from "react-bootstrap";
import { WidgetStatus } from "./widgets";

export function ActionButton(
    props: ButtonProps & {
        status: WidgetStatus;
        children: React.ReactNode;
        onClick: () => void;
    }
) {
    const { status, ...otherProps } = props;
    return <Button {...otherProps} disabled={!status.mutable} />;
}
