import {
    faCheck,
    faHourglassHalf,
    faTimes,
    IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Badge } from "react-bootstrap";

export function Summary(props: {
    icon: IconDefinition;
    children: React.ReactNode;
    change?: boolean;
    valid?: boolean;
    finalized?: boolean;
    title: string;
}) {
    let valid = props.valid ?? true;
    let finalized = props.finalized ?? true;
    return (
        <div style={{ display: "flex" }}>
            <div
                style={{
                    position: "relative",
                    marginRight: "1.25rem",
                    width: "15em",
                    minHeight: "5em",
                }}
            >
                <div style={{ whiteSpace: "nowrap", marginBottom: "1em" }}>
                    {finalized && (
                        <FontAwesomeIcon
                            icon={faCheck}
                            style={{ color: "green" }}
                        />
                    )}
                    {!valid && (
                        <FontAwesomeIcon
                            icon={faTimes}
                            style={{ color: "red" }}
                        />
                    )}
                    {valid && !finalized && (
                        <FontAwesomeIcon icon={faHourglassHalf} />
                    )}{" "}
                    <span
                        style={{
                            fontWeight: "bold",
                            textTransform: "uppercase",
                        }}
                    >
                        {props.title}
                    </span>
                </div>
                <div></div>
                <FontAwesomeIcon
                    icon={props.icon}
                    size="2x"
                    style={{
                        marginRight: "1em",
                        alignSelf: "center",
                        top: "3em",
                        marginTop: "-25%",
                        left: "2em",
                        transform: "translateX(-50%)",
                        position: "absolute",
                    }}
                />
                {props.change && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: "50%",
                            transform: "translateX(-50%)",
                        }}
                    >
                        <Badge variant="info">CHANGE ORDER</Badge>
                    </div>
                )}
            </div>
            <div>{props.children}</div>
        </div>
    );
}

export function Datum<T>(props: {
    label: string;
    value: T | null | undefined;
    format: (value: T) => React.ReactNode;
}) {
    if (props.value !== null && props.value !== undefined) {
        return (
            <span style={{ marginRight: "10px" }}>
                <b>{props.label}: </b>
                {props.format(props.value)}
            </span>
        );
    } else {
        return <></>;
    }
}
