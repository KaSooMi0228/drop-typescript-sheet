import * as React from "react";
import { Navbar } from "react-bootstrap";
import { CONTENT_AREA } from "../styles";

export function MessageHeader(props: { children: React.ReactNode }) {
    return <Navbar bg="light">{props.children}</Navbar>;
}

export function MessageBody(props: { children: React.ReactNode }) {
    return (
        <div {...CONTENT_AREA} style={{ margin: "1em" }}>
            {props.children}
        </div>
    );
}

export function MessageFooter(props: { children?: React.ReactNode }) {
    return <Navbar bg="light">{props.children}</Navbar>;
}
