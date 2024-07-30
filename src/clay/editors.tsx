import formatDistanceToNow from "date-fns/formatDistanceToNow";
import React from "react";
import { Alert } from "react-bootstrap";
import { useUser } from "../app/state";

type EditorsContextType = {
    id: string;
    username: string;
    timestamp: Date;
}[];

export const EditorsContext = React.createContext<EditorsContextType>([]);

export function ShowEditors() {
    const editors = React.useContext(EditorsContext);
    const user = useUser();
    return (
        <div>
            {editors
                .filter((editor) => editor.id != user.id)
                .map((editor, index) => (
                    <Alert key={index} variant="warning">
                        {editor.username} was editing{" "}
                        {formatDistanceToNow(editor.timestamp)} ago
                    </Alert>
                ))}
        </div>
    );
}
