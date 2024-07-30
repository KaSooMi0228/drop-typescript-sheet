import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faCheck, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as React from "react";
import { Button } from "react-bootstrap";

export type EditContextAction<T> = {
    onClick: T;
    disabled: boolean;
    active: boolean;
    completed: boolean;
    label?: string;
};

export function isActionAvailable<T>(action?: EditContextAction<T>): boolean {
    return action === undefined ? false : !action.disabled;
}

export type EditContext = {
    save?: EditContextAction<
        (template: string | null, extraParameters?: string[]) => void
    >;
    print?: EditContextAction<
        (template: string, extraParameters?: string[]) => void
    >;
    generate?: EditContextAction<(detail: string) => void>;
    delete?: EditContextAction<() => void>;
    duplicate?: EditContextAction<() => void>;
    substitute?: EditContextAction<(key: string) => void>;
};

const EditReactContext = React.createContext<EditContext>({});

export function Editable(props: EditContext & { children: any }) {
    return (
        <EditReactContext.Provider value={props}>
            {props.children}
        </EditReactContext.Provider>
    );
}

export function useEditableContext() {
    return React.useContext(EditReactContext);
}

type EditActionButtonProps<T> = {
    action?: EditContextAction<T>;
    onClick: () => void;
    icon: IconProp;
    label: string;
    disabled?: boolean;
    variant: "primary" | "danger";
    style?: React.CSSProperties;
};
export function EditActionButton<T>(props: EditActionButtonProps<T>) {
    const action = props.action;
    if (!action) {
        return <></>;
    }

    return (
        <div style={{ ...props.style, marginRight: "20px" }}>
            {" "}
            <Button
                variant={props.variant}
                disabled={action.disabled || props.disabled}
                onClick={props.onClick}
                style={props.style}
            >
                <FontAwesomeIcon icon={props.icon} /> {props.label}{" "}
                {action.active && <FontAwesomeIcon icon={faSpinner} spin />}
                {action.completed && (
                    <FontAwesomeIcon
                        icon={faCheck}
                        style={{ color: "green" }}
                    />
                )}
            </Button>
        </div>
    );
}
