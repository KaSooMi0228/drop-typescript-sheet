export function escapePattern(literal: string) {
    return literal.replace(/\\/g, "\\\\").replace(/%/g, "\\%");
}

export function toPattern(literal: string) {
    return (
        "%" +
        literal
            .split(" ")
            .map((x) => `${escapePattern(x)}%`)
            .join(" ")
    );
}
