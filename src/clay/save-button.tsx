import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faCopy, faPrint, faSave } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { useIsConnected } from "../app/state";
import {
    EditActionButton,
    isActionAvailable,
    useEditableContext,
} from "../clay/edit-context";

type Props = {
    label?: string;
    printTemplate?: string;
    printParameters?: string[];
    preSave?: () => void;
    disabled?: boolean;
    icon?: IconProp;
    style?: React.CSSProperties;
};

export function SaveButton(props: Props) {
    const editContext = useEditableContext();

    // if available use save
    // otherwise, fall back to just printing
    const editAction =
        props.printTemplate &&
        !isActionAvailable(editContext.save) &&
        isActionAvailable(editContext.print)
            ? editContext.print
            : editContext.save;

    const isConnected = useIsConnected();

    if (!editAction || (!isConnected && props.printTemplate)) {
        return <></>;
    }

    const icon = editAction === editContext.save ? faSave : faPrint;

    return (
        <EditActionButton
            action={editAction}
            onClick={() => {
                if (editAction === editContext.save) {
                    if (props.preSave) {
                        props.preSave();
                    }
                    editContext.save.onClick(
                        props.printTemplate || null,
                        props.printParameters || []
                    );
                } else {
                    editContext.print &&
                        props.printTemplate &&
                        editContext.print.onClick(
                            props.printTemplate,
                            props.printParameters || []
                        );
                }
            }}
            icon={props.icon || props.printTemplate ? faPrint : faSave}
            label={props.label || "Save"}
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
