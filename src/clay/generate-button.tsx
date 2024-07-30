import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faCopy, faPrint } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { EditActionButton, useEditableContext } from "./edit-context";

type Props = {
    label?: string;
    printTemplate?: string;
    printParameters?: string[];
    disabled?: boolean;
    icon?: IconProp;
    style?: React.CSSProperties;
    detail?: string;
};

export function GenerateButton(props: Props) {
    const editContext = useEditableContext();

    const editAction = editContext.generate;

    if (!editAction) {
        return <></>;
    }

    const icon = faPrint;

    return (
        <EditActionButton
            action={editAction}
            onClick={() => {
                editAction.onClick(props.detail || "");
            }}
            icon={icon}
            label={props.label || "Generate"}
            disabled={props.disabled}
            style={props.style}
            variant="primary"
        />
    );
}

type DuplicateProps = {
    label?: string;
    preSave?: () => void;
    disabled?: boolean;
};

export function DuplicateButton(props: DuplicateProps) {
    const editContext = useEditableContext();

    return (
        <EditActionButton
            action={editContext.duplicate}
            onClick={() => {
                editContext.duplicate && editContext.duplicate.onClick();
            }}
            icon={faCopy}
            label={props.label || "Duplicate"}
            variant="primary"
        />
    );
}
