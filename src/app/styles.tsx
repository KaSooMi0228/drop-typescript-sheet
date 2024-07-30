import { css } from "glamor";
import * as React from "react";

export const CONTENT_AREA = css({
    display: "flex",
    overflowY: "auto",
    flexDirection: "column",
    flexGrow: 1,
    ".active": {
        display: "flex",
    },
});

export const TABLE_DISTINCT_FOOTER = css({
    "& tfoot th": {
        borderTop: "solid 2px blue",
    },
});

export const TABLE_STYLE = css({
    borderSpacing: "100px 0",
    "& td": {
        padding: "2px 5px",
    },
    "& th": {
        padding: "2px 5px",
    },
    "& thead th": {
        textAlign: "center",
    },
});

export const TABLE_LEFT_STYLE = css({
    borderSpacing: "100px 0",
    "& td": {
        padding: "2px 5px",
    },
    "& th": {
        padding: "2px 5px",
    },
    "& thead th": {
        textAlign: "left",
    },
});

export const TABLE_FIXED = css({
    position: "relative",
    "& thead th": {
        position: "sticky",
        top: 0,
        boxShadow: "0 2px 2px -1px rgba(0, 0, 0, 0.4)",
        backgroundColor: "white",
        zIndex: 10,
    },
});
