import { patch as rawPatch } from "jsondiffpatch";
import { isEqual } from "lodash";

export class MismatchError extends Error {}

export function applyPatch(current: any, patch: any, override: boolean): any {
    if (patch === undefined || patch === null) {
        return current;
    } else if (Array.isArray(patch)) {
        switch (patch.length) {
            case 1:
                if (!override && current !== undefined) {
                    throw new MismatchError(
                        `${JSON.stringify(patch)} but ${JSON.stringify(
                            current
                        )}`
                    );
                }
                return patch[0];
            case 2:
                if (!override && !isEqual(current, patch[0])) {
                    throw new MismatchError(
                        `${JSON.stringify(patch)} but ${JSON.stringify(
                            current
                        )}`
                    );
                }
                return patch[1];
            case 3:
                switch (patch[2]) {
                    case 0:
                        if (!override && !isEqual(current, patch[0])) {
                            throw new MismatchError(JSON.stringify(patch));
                        }
                        return undefined;
                    case 2:
                        if (typeof current == "string") {
                            const result = rawPatch(current, patch);
                            return result;
                        }
                        throw new Error("invalid patch");
                    default:
                        throw new Error("invalid patch");
                }
        }
    } else if (patch._t === "a") {
        const toRemove = [];
        const toInsert = [];
        const toModify = [];

        for (const [key, value_] of Object.entries(patch)) {
            const value = value_ as any;

            if (key === "_t" || key === "append") {
                continue;
            }

            if (key[0] == "_") {
                if (value[2] === 0 || value[2] === 3) {
                    toRemove.push(parseInt(key.slice(1), 10));
                } else {
                    throw new Error("bad patch");
                }
            } else {
                if (value.length === 1) {
                    toInsert.push({
                        index: parseInt(key, 10),
                        value: value[0],
                    });
                } else {
                    toModify.push({
                        index: parseInt(key, 10),
                        delta: value,
                    });
                }
            }
        }
        if (current === undefined && !override) {
            throw new MismatchError("array but is undefined");
        }
        const result: any[] = (current || []).slice();
        toRemove.sort((a, b) => b - a);

        for (const index1 of toRemove) {
            let patchValue = patch["_" + index1];
            let removedValue = result.splice(index1, 1)[0];
            if (patchValue[2] === 3) {
                toInsert.push({
                    index: patchValue[1],
                    value: removedValue,
                });
            } else {
                if (!override && !isEqual(removedValue, patchValue[0])) {
                    throw new MismatchError(
                        `${JSON.stringify(patchValue)} but ${JSON.stringify(
                            removedValue
                        )}`
                    );
                }
            }
        }

        toInsert.sort((a, b) => a.index - b.index);
        for (const insertion of toInsert) {
            result.splice(insertion.index, 0, insertion.value);
        }

        for (const modification of toModify) {
            result[modification.index] = applyPatch(
                result[modification.index],
                modification.delta,
                override
            );
        }

        if (patch["append"] !== undefined) {
            result.push(patch["append"]);
        }

        return result;
    } else {
        const result = { ...current };

        for (const [key, value] of Object.entries(patch)) {
            result[key] = applyPatch(result[key], value, override);
        }

        return result;
    }
}
