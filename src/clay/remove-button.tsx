import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "react-bootstrap";
import { useListItemContext } from "./widgets/ListWidget";
import * as React from "react";

export function RemoveButton() {
    const listItemContext = useListItemContext();

    return (
        <>
            {listItemContext && listItemContext.remove && (
                <Button variant="danger" onClick={listItemContext.remove}>
                    <FontAwesomeIcon icon={faTrashAlt} />
                </Button>
            )}
        </>
    );
}
