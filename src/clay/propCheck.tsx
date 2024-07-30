import { isEqual } from "lodash";
import { Dictionary } from "./common";
import * as React from "react";

export function propCheck(
    prevProps: Dictionary<any>,
    nextProps: Dictionary<any>
): boolean {
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    if (prevKeys.length != nextKeys.length) {
        return false;
    }

    for (const key of nextKeys) {
        if (key === "status" || key === "requests") {
            if (!isEqual(prevProps[key], nextProps[key])) {
                return false;
            }
        } else {
            if (prevProps[key] !== nextProps[key]) {
                return false;
            }
        }
    }

    return true;
}

export function propCheckVerbose(
    prevProps: Dictionary<any>,
    nextProps: Dictionary<any>
): boolean {
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    if (prevKeys.length != nextKeys.length) {
        return false;
    }

    for (const key of nextKeys) {
        if (key === "status" || key === "requests") {
            if (!isEqual(prevProps[key], nextProps[key])) {
                return false;
            }
        } else {
            if (prevProps[key] !== nextProps[key]) {
                return false;
            }
        }
    }

    return true;
}
