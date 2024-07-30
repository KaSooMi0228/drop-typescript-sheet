import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { EditActionButton, useEditableContext } from "./edit-context";

type Props = {
    label?: string;
};

export type DeleteContext = {
    onDelete?: () => void;
    disabled: boolean;
    deleting: boolean;
    deleted: boolean;
};

const NULL_SAVE_CONTEXT: DeleteContext = {
    disabled: true,
    deleting: false,
    deleted: false,
};

const DeleteReactContext =
    React.createContext<DeleteContext>(NULL_SAVE_CONTEXT);

export function Deleteable(props: DeleteContext & { children: any }) {
    return (
        <DeleteReactContext.Provider value={props}>
            {props.children}
        </DeleteReactContext.Provider>
    );
}

export function DeleteButton(props: Props) {
    const editContext = useEditableContext();
    return (
        <EditActionButton
            action={editContext.delete}
            icon={faTrashAlt}
            label={props.label || editContext.delete?.label || "Delete"}
            onClick={() => {
                editContext.delete && editContext.delete.onClick();
            }}
            variant="danger"
        />
    );
}
