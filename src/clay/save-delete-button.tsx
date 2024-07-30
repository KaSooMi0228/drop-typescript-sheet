import * as React from "react";
import { DeleteButton } from "../clay/delete-button";
import { DuplicateButton, SaveButton } from "./save-button";

export function SaveDeleteButton(props: {
    saveLabel?: string;
    noun?: string;
    duplicate?: boolean;
    preSave?: () => void;
    children?: React.ReactNode;
    printTemplate?: string;
    printParameters?: string[];
}) {
    const noun = props.noun;

    return (
        <div style={{ display: "flex", margin: "10px" }}>
            <SaveButton
                label={props.saveLabel || (noun && "Save " + noun)}
                preSave={props.preSave}
                printTemplate={props.printTemplate}
                printParameters={props.printParameters}
            />
            {props.duplicate && (
                <DuplicateButton label={noun && "Save Duplicate " + noun} />
            )}
            <DeleteButton label={noun && "Delete " + noun} />
            {props.children}
        </div>
    );
}

export function SavePrintButton(props: {
    saveLabel: string;
    printLabel: string;
    preSave?: () => void;
    printTemplate: string;
    printParameters?: string[];
}) {
    return (
        <div style={{ display: "flex", margin: "10px" }}>
            <SaveButton label={props.saveLabel} preSave={props.preSave} />
            <SaveButton
                label={props.printLabel}
                preSave={props.preSave}
                printTemplate={props.printTemplate}
                printParameters={props.printParameters}
            />
        </div>
    );
}

export function SavePrintDeleteButton(props: {
    saveLabel: string;
    printLabel: string;
    deleteLabel: string;
    preSave?: () => void;
    printTemplate: string;
    printParameters?: string[];
}) {
    return (
        <div style={{ display: "flex", margin: "10px" }}>
            <SaveButton label={props.saveLabel} preSave={props.preSave} />
            <SaveButton
                label={props.printLabel}
                preSave={props.preSave}
                printTemplate={props.printTemplate}
                printParameters={props.printParameters}
            />
            <DeleteButton label={props.deleteLabel} />
        </div>
    );
}
