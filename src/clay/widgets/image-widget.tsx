import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as React from "react";
import { Button } from "react-bootstrap";
import { useDropzone } from "react-dropzone";
import { Widget, WidgetStatus } from "./index";
import { SimpleAtomic } from "./simple-atomic";

import FontAwesome = require("react-fontawesome");

type RawImageWidgetState = null;
export type RawImageWidgetAction = {
    type: "SET";
    value: string;
};

type RawImageWidgetProps = {
    state: RawImageWidgetState;
    data: string;
    dispatch: (action: RawImageWidgetAction) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    hideStatus?: boolean;
};

export type RawImageWidget = {
    state: RawImageWidgetState;
    data: string;
    action: RawImageWidgetAction;
    context: {};
    props: {
        style?: React.CSSProperties;
        hideStatus?: boolean;
    };
};

export const RawImageWidget: Widget<
    RawImageWidgetState,
    string,
    {},
    RawImageWidgetAction,
    {
        style?: React.CSSProperties;
        hideStatus?: boolean;
    }
> = {
    ...SimpleAtomic,
    dataMeta: {
        type: "date",
    },
    initialize(data: string) {
        return {
            state: null,
            data,
        };
    },
    component({
        data,
        dispatch,
        status,
        style,
        hideStatus,
    }: RawImageWidgetProps) {
        const onDrop = React.useCallback(
            (files) => {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const response = await fetch("/blobs/", {
                        method: "post",
                        headers: {
                            "Content-Type": files[0].type,
                        },
                        body: reader.result,
                    });
                    const text = await response.text();
                    dispatch({
                        type: "SET",
                        value: text,
                    });
                };
                for (const file of files) {
                    reader.readAsArrayBuffer(file);
                }
            },
            [dispatch]
        );

        const onClear = React.useCallback(
            (files) => {
                dispatch({
                    type: "SET",
                    value: "",
                });
            },
            [dispatch]
        );

        const dropZone = useDropzone({ onDrop });
        return data === "" ? (
            <div {...dropZone.getRootProps()}>
                <input {...dropZone.getInputProps()} />
                Drop Image Here or Click
            </div>
        ) : (
            <div>
                <img
                    style={{ maxHeight: "1in", maxWidth: "1in" }}
                    src={"/blobs/" + data}
                />
                <Button onClick={onClear} variant="danger">
                    <FontAwesomeIcon icon={faTrashAlt} />
                </Button>
            </div>
        );
    },
    reduce(
        state: RawImageWidgetState,
        data: string,
        action: RawImageWidgetAction,
        context: {}
    ) {
        switch (action.type) {
            case "SET":
                return {
                    state,
                    data: action.value,
                    requests: [],
                };
        }
    },
    validate(data: string) {
        if (data !== "") {
            return [];
        } else {
            return [
                {
                    invalid: false,
                    empty: true,
                },
            ];
        }
    },
};
