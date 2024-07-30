import { parseExpressionAt } from "acorn";
import { snakeCase } from "change-case";
import { BlockStatement, Expression, Node } from "estree";
import { camelCase, fromPairs, mapValues, uniqueId, zip } from "lodash";
import { plural } from "pluralize";
import { FunctionBlock } from "safe-squel";
import "../../app/inbox/notification-sources";
import {
    ROLE_CERTIFIED_FOREMAN,
    ROLE_ESTIMATOR,
    ROLE_PROJECT_MANAGER,
} from "../../app/user/table";
import { Dictionary } from "../common";
import { Meta, RecordMeta } from "../meta";
import { resolveColumn } from "./queryTable";
import { rstr, select, str } from "./squel";

function parseExpression(text: string) {
    const parsed = parseExpressionAt(text);
    if (parsed.type === "CallExpression") {
        return parseExpressionAt("function " + text);
    } else {
        return parsed;
    }
}

function lazy<X>(f: () => X) {
    let resolved: X | null = null;
    return function () {
        if (!resolved) {
            resolved = f();
        }
        return resolved;
    };
}

const CONSTANTS: Dictionary<BaseColumn> = {
    ROLE_PROJECT_MANAGER: {
        meta: {
            type: "uuid",
        },
        expression: () => str("?", ROLE_PROJECT_MANAGER),
    },
    ROLE_ESTIMATOR: {
        meta: {
            type: "uuid",
        },
        expression: () => str("?", ROLE_ESTIMATOR),
    },
    ROLE_CERTIFIED_FOREMAN: {
        meta: {
            type: "uuid",
        },
        expression: () => str("?", ROLE_CERTIFIED_FOREMAN),
    },
};

type Variables = Dictionary<FunctionBlock>;

export type BaseColumn = {
    meta: Meta;
    expression: (variables: Variables) => FunctionBlock;
};

export type LoneColumn = BaseColumn & {
    subkeyType: null | string;
};

export type Column = BaseColumn & {
    subkeyType: null | string;
    inner: () => Dictionary<Column>;
};

function createColumnForMeta(
    tableMetas: Dictionary<RecordMeta<any, any, any>>,
    meta: Meta,
    value: (variables: Variables) => FunctionBlock,
    scope: Dictionary<(variables: Variables) => FunctionBlock>,
    seen: Set<string>,
    segment_columns: Dictionary<FunctionBlock>
): Column {
    if (!meta) {
        throw new Error("mising meta");
    }
    function sqlForExpression(
        ast: Node,
        meta: Meta,
        symbols: Dictionary<Meta>,
        columns: Dictionary<Column>
    ): BaseColumn {
        switch (ast.type) {
            case "NewExpression": {
                const argument = ast.arguments[0];
                switch (argument.type) {
                    case "Literal":
                        return {
                            meta: { type: "quantity" },
                            expression: (_) =>
                                str("?::decimal", argument.value),
                        };
                    default:
                        console.error(ast);
                        throw new Error("Unexpected " + ast.arguments[0].type);
                }
            }
            case "UnaryExpression":
                switch (ast.operator) {
                    case "!":
                        const inner = sqlForExpression(
                            ast.argument,
                            meta,
                            symbols,
                            columns
                        );

                        return {
                            meta: { type: "boolean" },
                            expression: (symbols) =>
                                str(`NOT ?`, inner.expression(symbols)),
                        };
                    default:
                        throw new Error("Unsupported: " + ast.operator);
                }
            case "LogicalExpression": {
                const left = sqlForExpression(ast.left, meta, symbols, columns);
                const right = sqlForExpression(
                    ast.right,
                    meta,
                    symbols,
                    columns
                );

                let operator: string;
                switch (ast.operator) {
                    case "&&":
                        operator = "AND";
                        break;
                    case "||":
                        operator = "OR";
                        break;
                }

                return {
                    meta: { type: "boolean" },
                    expression: (key) =>
                        str(
                            `? ${operator} ?`,
                            left.expression(key),
                            right.expression(key)
                        ),
                };
            }

            case "BinaryExpression":
                switch (ast.operator) {
                    case "+":
                        return {
                            meta: { type: "string" },
                            expression: (key) =>
                                str(
                                    "? || ?",
                                    sqlForExpression(
                                        ast.left,
                                        meta,
                                        symbols,
                                        columns
                                    ).expression(key),
                                    sqlForExpression(
                                        ast.right,
                                        meta,
                                        symbols,
                                        columns
                                    ).expression(key)
                                ),
                        };
                    case "===":
                    case "!==":
                    case ">":
                    case ">=": {
                        const left = sqlForExpression(
                            ast.left,
                            meta,
                            symbols,
                            columns
                        );
                        const right = sqlForExpression(
                            ast.right,
                            meta,
                            symbols,
                            columns
                        );

                        let operator: string;
                        switch (ast.operator) {
                            case "===":
                                operator = "=";
                                break;
                            case "!==":
                                operator = "!=";
                                break;
                            case ">":
                                operator = ">";
                                break;
                            case ">=":
                                operator = ">=";
                                break;
                        }

                        return {
                            meta: { type: "boolean" },
                            expression: (key) =>
                                str(
                                    `? ${operator} ?`,
                                    left.expression(key),
                                    right.expression(key)
                                ),
                        };
                    }

                    default:
                        throw new Error(
                            "Unsupported binary operator " + ast.operator
                        );
                }
            case "CallExpression":
                const callee =
                    ast.callee.type == "SequenceExpression"
                        ? ast.callee.expressions[1]
                        : ast.callee;
                switch (callee.type) {
                    case "MemberExpression":
                        if (callee.property.type != "Identifier") {
                            throw new Error("Expected identifier");
                        }

                        switch (callee.property.name) {
                            case "sumMap": {
                                const tableName = uniqueId("T");

                                const base = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );

                                if (base.meta.type !== "array") {
                                    throw new Error("invalid");
                                }
                                const inner = sqlForFunctionExpression(
                                    ast.arguments[1],
                                    base.meta.items,
                                    symbols,
                                    columns,
                                    () => str(tableName)
                                );
                                return {
                                    meta: inner.meta,
                                    expression: (symbols) =>
                                        str(
                                            "coalesce((select sum(?) from unnest(?) as " +
                                                tableName +
                                                "), 0)",
                                            inner.expression(symbols),
                                            base.expression(symbols)
                                        ),
                                };
                            }
                            case "firstMatch": {
                                const tableName = uniqueId("T");

                                const base = sqlForExpression(
                                    ast.arguments[0] as Expression,
                                    meta,
                                    symbols,
                                    columns
                                );

                                if (base.meta.type !== "array") {
                                    throw new Error("invalid");
                                }
                                const condition = sqlForFunctionExpression(
                                    ast.arguments[1] as Expression,
                                    base.meta.items,
                                    symbols,
                                    columns,
                                    () => str(tableName)
                                );
                                const inner = sqlForFunctionExpression(
                                    ast.arguments[2] as Expression,
                                    base.meta.items,
                                    symbols,
                                    columns,
                                    () => str(tableName)
                                );
                                return {
                                    meta: inner.meta,
                                    expression: (key) =>
                                        str(
                                            "select ? from unnest(?) as " +
                                                tableName +
                                                " where ? limit 1",
                                            inner.expression(key),
                                            base.expression(key),
                                            condition.expression(key)
                                        ),
                                };
                            }
                            case "isNotNull":
                                const inner = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );

                                return {
                                    meta: { type: "boolean" },
                                    expression: (key) =>
                                        str(
                                            `? IS NOT NULL`,
                                            inner.expression(key)
                                        ),
                                };

                            case "isNull": {
                                const inner = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );

                                return {
                                    meta: { type: "boolean" },
                                    expression: (key) =>
                                        str(`? IS NULL`, inner.expression(key)),
                                };
                            }
                            case "ifNull": {
                                const inner = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );
                                const inner2 = sqlForExpression(
                                    ast.arguments[1],
                                    meta,
                                    symbols,
                                    columns
                                );

                                return {
                                    meta: inner.meta,
                                    expression: (key) =>
                                        str(
                                            `COALESCE(?,?)`,
                                            inner.expression(key),

                                            inner2.expression(key)
                                        ),
                                };
                            }

                            case "toDecimalPlaces": {
                                const expression = sqlForExpression(
                                    callee.object,
                                    meta,
                                    symbols,
                                    columns
                                );
                                const places = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );
                                return {
                                    meta: expression.meta,
                                    expression: (key) =>
                                        str(
                                            "ROUND(?,?)",
                                            expression.expression(key),
                                            places.expression(key)
                                        ),
                                };
                            }

                            case "times":
                                const left = sqlForExpression(
                                    callee.object,
                                    meta,
                                    symbols,
                                    columns
                                );
                                const right = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );
                                // The logic is this:
                                // 1) If money is involved, the result is money
                                // 2) Any other combination of things isn't a percentage
                                // 3) So its gotta be a quantity
                                const type =
                                    left.meta.type === "money" ||
                                    right.meta.type === "money"
                                        ? "money"
                                        : "quantity";

                                return {
                                    meta: { type },
                                    expression: (key) =>
                                        str(
                                            "? * ?",
                                            left.expression(key),
                                            right.expression(key)
                                        ),
                                };
                            case "lessThan":
                            case "greaterThanOrEqualTo":
                            case "greaterThan": {
                                const left = sqlForExpression(
                                    callee.object,
                                    meta,
                                    symbols,
                                    columns
                                );
                                const right = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );

                                let op: string;
                                switch (callee.property.name) {
                                    case "lessThan":
                                        op = "<";
                                        break;
                                    case "greaterThanOrEqualTo":
                                        op = ">=";
                                    case "greaterThan":
                                        op = ">";
                                }

                                return {
                                    meta: { type: "boolean" },
                                    expression: (key) =>
                                        str(
                                            `? ${op} ?`,
                                            left.expression(key),
                                            right.expression(key)
                                        ),
                                };
                            }
                            case "dividedBy": {
                                const left = sqlForExpression(
                                    callee.object,
                                    meta,
                                    symbols,
                                    columns
                                );
                                const right = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );

                                return {
                                    meta: { type: "percentage" },
                                    expression: (key) =>
                                        str(
                                            `? / NULLIF(?, 0)`,
                                            left.expression(key),
                                            right.expression(key)
                                        ),
                                };
                            }
                            case "plus":
                            case "minus": {
                                const left = sqlForExpression(
                                    callee.object,
                                    meta,
                                    symbols,
                                    columns
                                );
                                const right = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );

                                let operator: string;
                                switch (callee.property.name) {
                                    case "plus":
                                        operator = "+";
                                        break;
                                    case "minus":
                                        operator = "-";
                                        break;
                                }
                                // The logic is this:
                                // 1) If money is involved, the result is money
                                // 2) Any other combination of things isn't a percentage
                                // 3) So its gotta be a quantity
                                const type =
                                    left.meta.type === "money" ||
                                    right.meta.type === "money"
                                        ? "money"
                                        : "quantity";

                                return {
                                    meta: { type },
                                    expression: (key) =>
                                        str(
                                            `? ${operator} ?`,
                                            left.expression(key),
                                            right.expression(key)
                                        ),
                                };
                            }
                            case "isZero": {
                                const inner = sqlForExpression(
                                    callee.object,
                                    meta,
                                    symbols,
                                    columns
                                );

                                return {
                                    meta: { type: "boolean" },
                                    expression: (key) =>
                                        str(`? = 0`, inner.expression(key)),
                                };
                            }
                            case "lt": {
                                const inner = sqlForExpression(
                                    callee.object,
                                    meta,
                                    symbols,
                                    columns
                                );

                                const inner2 = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );

                                return {
                                    meta: { type: "boolean" },
                                    expression: (key) =>
                                        str(
                                            `? < ?`,
                                            inner.expression(key),
                                            inner2.expression(key)
                                        ),
                                };
                            }
                            case "gt": {
                                const inner = sqlForExpression(
                                    callee.object,
                                    meta,
                                    symbols,
                                    columns
                                );

                                const inner2 = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );

                                return {
                                    meta: { type: "boolean" },
                                    expression: (key) =>
                                        str(
                                            `? > ?`,
                                            inner.expression(key),
                                            inner2.expression(key)
                                        ),
                                };
                            }
                            case "isEmpty": {
                                const inner = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );

                                return {
                                    meta: { type: "boolean" },
                                    expression: (key) =>
                                        str(
                                            `array_length(?, 1) IS NULL`,
                                            inner.expression(key)
                                        ),
                                };
                            }
                            case "ageDays": {
                                const inner = sqlForExpression(
                                    callee.object,
                                    meta,
                                    symbols,
                                    columns
                                );

                                return {
                                    meta: { type: "quantity" },
                                    expression: (key) =>
                                        str(
                                            `extract(epoch from age(?)) / (24*60*60)`,
                                            inner.expression(key)
                                        ),
                                };
                            }
                            case "currentYear": {
                                return {
                                    meta: { type: "quantity" },
                                    expression: (key) =>
                                        str(`extract(year from current_date)`),
                                };
                            }
                            case "daysAgo": {
                                const inner = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );

                                return {
                                    meta: { type: "quantity" },
                                    expression: (key) =>
                                        str(
                                            `extract(epoch from age(?)) / (24*60*60)`,
                                            inner.expression(key)
                                        ),
                                };
                            }
                            case "maximum": {
                                const tableName = uniqueId("T");
                                const base = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );
                                if (base.meta.type !== "array") {
                                    throw new Error("invalid");
                                }
                                const transform = sqlForFunctionExpression(
                                    ast.arguments[1],
                                    base.meta.items,
                                    symbols,
                                    columns,
                                    (_) => str(tableName)
                                );
                                return {
                                    meta: base.meta.items,
                                    expression: (key) =>
                                        str(
                                            "(select max(?) from unnest(?) as " +
                                                tableName +
                                                ")",
                                            transform.expression(key),
                                            base.expression(key)
                                        ),
                                };
                            }
                            case "lastItem": {
                                const base = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );
                                if (base.meta.type !== "array") {
                                    throw new Error("invalid");
                                }
                                const inner = sqlForFunctionExpression(
                                    ast.arguments[1],
                                    base.meta.items,
                                    symbols,
                                    columns,
                                    (key) =>
                                        str(
                                            "?[array_upper(?, 1)]",
                                            base.expression(key),
                                            base.expression(key)
                                        )
                                );
                                return {
                                    expression: (key) =>
                                        str(
                                            "case when array_length(?,1) is null then null else ? end",
                                            base.expression(key),
                                            inner.expression(key)
                                        ),
                                    meta: inner.meta,
                                };
                            }
                            case "joinMap": {
                                const tableName = uniqueId("T");

                                const base = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );
                                if (base.meta.type !== "array") {
                                    throw new Error("invalid");
                                }
                                const inner = sqlForFunctionExpression(
                                    ast.arguments[2],
                                    base.meta.items,
                                    symbols,
                                    columns,
                                    (_) => str(tableName)
                                );
                                const seperator = sqlForExpression(
                                    ast.arguments[1],
                                    base.meta.items,
                                    symbols,
                                    columns
                                );
                                return {
                                    meta: { type: "string" },
                                    expression: (key) =>
                                        str(
                                            "coalesce((select string_agg(?, ?) from unnest(?) as " +
                                                tableName +
                                                "), '')",
                                            inner.expression(key),
                                            seperator.expression(key),
                                            base.expression(key)
                                        ),
                                };
                            }
                            case "flatMap": {
                                const tableName = uniqueId("T");

                                const base = sqlForExpression(
                                    callee.object,
                                    meta,
                                    symbols,
                                    columns
                                );
                                if (base.meta.type !== "array") {
                                    throw new Error("invalid");
                                }

                                const inner2 = sqlForFunctionExpression(
                                    ast.arguments[0],
                                    base.meta.items,
                                    symbols,
                                    columns,
                                    (_) => str(tableName)
                                );

                                if (!inner2 || !inner2.meta) {
                                    console.error(ast.arguments[0]);
                                    throw new Error("Failed");
                                }

                                if (inner2.meta.type !== "array") {
                                    throw new Error("expected array");
                                }

                                return {
                                    meta: {
                                        type: "array",
                                        items: inner2.meta.items,
                                    },
                                    expression: (key) => {
                                        return str(
                                            "(select flatMap(?) from unnest(?) as " +
                                                tableName +
                                                ")",
                                            inner2.expression(key),
                                            base.expression(key)
                                        );
                                    },
                                };
                            }
                            case "map": {
                                const tableName = uniqueId("T");

                                const base = sqlForExpression(
                                    callee.object,
                                    meta,
                                    symbols,
                                    columns
                                );
                                if (base.meta.type !== "array") {
                                    throw new Error("invalid");
                                }

                                const inner2 = sqlForFunctionExpression(
                                    ast.arguments[0],
                                    base.meta.items,
                                    symbols,
                                    columns,
                                    (_) => str(tableName)
                                );

                                return {
                                    meta: { type: "array", items: inner2.meta },
                                    expression: (key) => {
                                        return str(
                                            "(select coalesce(array_agg(?),'{}') from unnest(?) as " +
                                                tableName +
                                                ")",
                                            inner2.expression(key),
                                            base.expression(key)
                                        );
                                    },
                                };
                            }

                            case "filterMap": {
                                const tableName = uniqueId("T");

                                const base = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );
                                if (base.meta.type !== "array") {
                                    throw new Error("invalid");
                                }
                                const inner = sqlForFunctionExpression(
                                    ast.arguments[1],
                                    base.meta.items,
                                    symbols,
                                    columns,
                                    (_) => str(tableName)
                                );
                                const inner2 = sqlForFunctionExpression(
                                    ast.arguments[2],
                                    base.meta.items,
                                    symbols,
                                    columns,
                                    (_) => str(tableName)
                                );

                                return {
                                    meta: { type: "array", items: inner2.meta },
                                    expression: (key) => {
                                        return str(
                                            "(select coalesce(array_agg(?),'{}') from unnest(?) as " +
                                                tableName +
                                                " where ?)",
                                            inner2.expression(key),
                                            base.expression(key),
                                            inner.expression(key)
                                        );
                                    },
                                };
                            }
                            case "anyMap": {
                                const tableName = uniqueId("T");

                                const base = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );
                                if (base.meta.type !== "array") {
                                    throw new Error("invalid");
                                }
                                const inner = sqlForFunctionExpression(
                                    ast.arguments[1],
                                    base.meta.items,
                                    symbols,
                                    columns,
                                    (_) => str(tableName)
                                );
                                return {
                                    meta: { type: "boolean" },
                                    expression: (key) => {
                                        return str(
                                            "coalesce((select bool_or(?) from unnest(?) as " +
                                                tableName +
                                                "), false)",
                                            inner.expression(key),
                                            base.expression(key)
                                        );
                                    },
                                };
                            }
                            case "uniqueMap": {
                                const tableName = uniqueId("T");

                                const base = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );
                                if (base.meta.type !== "array") {
                                    throw new Error("invalid");
                                }
                                const inner1 = sqlForFunctionExpression(
                                    ast.arguments[1],
                                    base.meta.items,
                                    symbols,
                                    columns,
                                    (_) => str(tableName)
                                );

                                return {
                                    meta: { type: "array", items: inner1.meta },
                                    expression: (key) => {
                                        return str(
                                            "(select coalesce(array_agg(distinct ?),'{}') from unnest(?) as " +
                                                tableName +
                                                ")",
                                            inner1.expression(key),
                                            base.expression(key)
                                        );
                                    },
                                };
                            }

                            case "format": {
                                const inner = sqlForExpression(
                                    callee.object,
                                    meta,
                                    symbols,
                                    columns
                                );
                                return {
                                    meta: { type: "string" },
                                    expression: (key) =>
                                        str(
                                            "regexp_replace(?, '(\\d{3})(\\d{3})(\\d{4})', '\\1-\\2-\\3')",
                                            inner.expression(key)
                                        ),
                                };
                            }
                            case "extractYear": {
                                const inner = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );
                                return {
                                    meta: { type: "quantity" },
                                    expression: (key) =>
                                        str(
                                            "extract(year from ?)",
                                            inner.expression(key)
                                        ),
                                };
                            }
                            case "filter": {
                                const tableName = uniqueId("T");

                                const base = sqlForExpression(
                                    callee.object,
                                    meta,
                                    symbols,
                                    columns
                                );
                                if (base.meta.type !== "array") {
                                    throw new Error("invalid");
                                }
                                const inner = sqlForFunctionExpression(
                                    ast.arguments[0],
                                    base.meta.items,
                                    symbols,
                                    columns,
                                    (_) => str(tableName)
                                );
                                return {
                                    meta: base.meta,
                                    expression: (key) =>
                                        str(
                                            "array(select " +
                                                tableName +
                                                " from unnest(?) as " +
                                                tableName +
                                                " where ?)",
                                            base.expression(key),
                                            inner.expression(key)
                                        ),
                                };
                            }
                            case "setDifference": {
                                const tableName = uniqueId("T");
                                const lhs = sqlForExpression(
                                    ast.arguments[0],
                                    meta,
                                    symbols,
                                    columns
                                );
                                if (lhs.meta.type !== "array") {
                                    throw new Error("invalid");
                                }
                                const rhs = sqlForExpression(
                                    ast.arguments[1],
                                    meta,
                                    symbols,
                                    columns
                                );

                                if (lhs.meta.type !== "array") {
                                    throw new Error("invalid");
                                }

                                return {
                                    meta: lhs.meta,
                                    expression: (key) =>
                                        str(
                                            `array_diff(?, ?)`,
                                            lhs.expression(key),
                                            rhs.expression(key)
                                        ),
                                };
                            }
                            case "resolve": {
                                const argument = ast.arguments[0];
                                if (argument.type !== "Literal") {
                                    throw new Error("Expected literal");
                                }
                                const value = argument.value as string;
                                const result = resolveColumn(
                                    {
                                        inner() {
                                            return columns;
                                        },
                                    } as any,
                                    value
                                );
                                if (!result) {
                                    return {
                                        meta: { type: "string" },
                                        expression: (key) => str("NULL"),
                                    };
                                    throw new Error("Unknown column: " + value);
                                }
                                return result;
                            }
                            case "concat": {
                                const parts = [
                                    sqlForExpression(
                                        callee.object,
                                        meta,
                                        symbols,
                                        columns
                                    ),
                                    ...ast.arguments.map((argument) =>
                                        sqlForExpression(
                                            argument,
                                            meta,
                                            symbols,
                                            columns
                                        )
                                    ),
                                ];
                                return {
                                    meta: { type: "string" },
                                    expression: (key) =>
                                        str(
                                            parts.map((_) => "?").join(" || "),
                                            ...parts.map((part) =>
                                                part.expression(key)
                                            )
                                        ),
                                };
                            }
                            case "selectArray": {
                                const items = ast.arguments.map((argument) =>
                                    sqlForExpression(
                                        argument,
                                        meta,
                                        symbols,
                                        columns
                                    )
                                );

                                return {
                                    meta: items[0].meta,
                                    expression: (key) =>
                                        str(
                                            `coalesce(${items.map(
                                                (_item) => "?"
                                            )})`,
                                            ...items.map((item) => {
                                                const identifier =
                                                    uniqueId("T");
                                                return select()
                                                    .from(
                                                        rstr(
                                                            "unnest(?)",
                                                            item.expression(key)
                                                        ),
                                                        identifier
                                                    )
                                                    .field(
                                                        str(
                                                            `array_agg(${identifier})`
                                                        )
                                                    );
                                            })
                                        ),
                                };
                            }
                            default:
                                if (callee.property.name.startsWith("calc")) {
                                    const resolved = sqlForExpression(
                                        ast.arguments[0],
                                        meta,
                                        symbols,
                                        columns
                                    );
                                    if (resolved.meta.type != "record") {
                                        throw new Error("Expected record");
                                    }
                                    const name = camelCase(
                                        callee.property.name.substring(
                                            4 + resolved.meta.name.length
                                        )
                                    );
                                    const func = resolved.meta.functions[name];
                                    if (!func) {
                                        throw new Error(
                                            "Unknown function " +
                                                callee.property.name +
                                                " for " +
                                                resolved.meta.name
                                        );
                                    }
                                    let expression = parseExpression(
                                        func.fn.toString()
                                    ) as Expression;

                                    const parameters = ast.arguments.map(
                                        (argument) =>
                                            sqlForExpression(
                                                argument,
                                                meta,
                                                symbols,
                                                columns
                                            )
                                    );
                                    return sqlForFunction(
                                        expression,
                                        parameters.map(
                                            (parameter) => parameter.meta
                                        ),
                                        columns,
                                        (symbols) =>
                                            parameters.map((parameter) =>
                                                parameter.expression(symbols)
                                            )
                                    );
                                }
                                throw new Error(
                                    "Unsupported function " +
                                        callee.property.name
                                );
                        }

                    case "Identifier":
                        if (callee.name.startsWith("calc")) {
                            const resolved = sqlForExpression(
                                ast.arguments[0],
                                meta,
                                symbols,
                                columns
                            );
                            if (resolved.meta.type != "record") {
                                throw new Error("Expected record");
                            }
                            const name = camelCase(
                                callee.name.substring(
                                    4 + resolved.meta.name.length
                                )
                            );
                            const func = resolved.meta.functions[name];
                            if (!func) {
                                throw new Error(
                                    "Unknown function " +
                                        callee.name +
                                        " for " +
                                        resolved.meta.name
                                );
                            }
                            let expression = parseExpression(
                                func.fn.toString()
                            ) as Expression;

                            const parameters = ast.arguments.map((argument) =>
                                sqlForExpression(
                                    argument,
                                    meta,
                                    symbols,
                                    columns
                                )
                            );
                            return sqlForFunction(
                                expression,
                                parameters.map((parameter) => parameter.meta),
                                columns,
                                (symbols) =>
                                    parameters.map((parameter) =>
                                        parameter.expression(symbols)
                                    )
                            );
                        }
                    default:
                        console.error(ast.callee);
                        throw new Error(
                            "Unsupported function " + ast.callee.type
                        );
                }
            case "Identifier":
                if (symbols[ast.name]) {
                    return {
                        meta: symbols[ast.name],
                        expression: (key) => key[ast.name],
                    };
                } else {
                    throw new Error("Unsupported identifier " + ast.name);
                }
            case "MemberExpression":
                if (ast.property.type !== "Identifier") {
                    throw new Error("Unsupported");
                }
                if (ast.property.name === "uuid") {
                    return sqlForExpression(
                        ast.object as Expression,
                        meta,
                        symbols,
                        columns
                    );
                }
                const value = CONSTANTS[ast.property.name];
                if (value) {
                    return value;
                } else {
                    const inner = sqlForExpression(
                        ast.object as Expression,
                        meta,
                        symbols,
                        columns
                    );
                    const innerMeta = inner.meta as RecordMeta<{}, {}, {}>;
                    const name = ast.property.name;
                    if (!innerMeta.fields[name]) {
                        throw new Error(
                            `Field ${name} not found on ${innerMeta.name}`
                        );
                    }
                    return {
                        meta: innerMeta.fields[name],
                        expression: (key) =>
                            str("?." + snakeCase(name), inner.expression(key)),
                    };
                }
            case "Literal":
                return {
                    meta: { type: "string" },
                    expression: (key) => str("?", ast.value),
                };
            case "ConditionalExpression": {
                const condition = sqlForExpression(
                    ast.test,
                    meta,
                    symbols,
                    columns
                );
                const whenTrue = sqlForExpression(
                    ast.consequent,
                    meta,
                    symbols,
                    columns
                );
                const whenFalse = sqlForExpression(
                    ast.alternate,
                    meta,
                    symbols,
                    columns
                );

                return {
                    meta: whenTrue.meta,
                    expression: (key) =>
                        str(
                            "case when ? then ? else ? end",
                            condition.expression(key),
                            whenTrue.expression(key),
                            whenFalse.expression(key)
                        ),
                };
            }
            case "ArrayExpression": {
                const inner = ast.elements.map((element) =>
                    sqlForExpression(element, meta, symbols, columns)
                );
                return {
                    meta: {
                        type: "array",
                        items: inner[0]?.meta,
                    },
                    expression: (key) =>
                        str(
                            `ARRAY[${inner.map((_) => "?").join(",")}]`,
                            ...inner.map((item) => item.expression(key))
                        ),
                };
            }
            case "TemplateLiteral": {
                const parts: BaseColumn[] = [];
                for (let index = 0; index < ast.quasis.length; index++) {
                    parts.push(
                        sqlForExpression(
                            {
                                type: "Literal",
                                value: ast.quasis[index].value.cooked,
                            } as any,
                            meta,
                            symbols,
                            columns
                        )
                    );
                    if (!ast.quasis[index].tail) {
                        parts.push(
                            sqlForExpression(
                                ast.expressions[index],
                                meta,
                                symbols,
                                columns
                            )
                        );
                    }
                }
                return {
                    meta: {
                        type: "string",
                    },
                    expression: (key) =>
                        str(
                            parts.map((_) => "?").join(" || "),
                            ...parts.map((part) => part.expression(key))
                        ),
                };
            }
            default:
                throw new Error("Unsupported H " + ast.type);
        }
    }

    function sqlForFunction(
        expression: Node,
        metas: Meta[],
        columns: Dictionary<Column>,
        exprs: (symbols: Variables) => FunctionBlock[]
    ): BaseColumn {
        if (
            expression.type !== "FunctionExpression" &&
            expression.type !== "ArrowFunctionExpression"
        ) {
            throw new Error(
                "Expected FunctionExpression got " + expression.type
            );
        }

        if (expression.params.length != metas.length) {
            throw new Error("Argument length mismatch");
        }

        const names = expression.params.map((param_) => {
            const param = param_!;
            if (param.type !== "Identifier") {
                throw new Error("Expect identifier");
            }
            return param.name;
        });

        const symbols = fromPairs(zip(names, metas));

        const returnArgument = extractReturnExpression(expression.body);

        const column = sqlForExpression(
            returnArgument as Expression,
            meta,
            symbols,
            columns
        );
        return {
            ...column,
            expression: (symbols) => {
                let resolved = exprs(symbols);
                let variables: Variables = fromPairs(zip(names, resolved));
                return column.expression(variables);
            },
        };
    }

    function extractReturnExpression(node: Expression | BlockStatement) {
        if (node.type === "BlockStatement") {
            const returnStatement = node.body[0];
            if (
                node.body.length !== 1 ||
                returnStatement.type != "ReturnStatement"
            ) {
                throw new Error("Expected single return");
            }
            return returnStatement.argument!;
        } else {
            return node;
        }
    }

    function sqlForFunctionExpression(
        expression: Node,
        meta: Meta,
        symbols: Dictionary<Meta>,
        columns: Dictionary<Column>,
        expr: (symbols: Variables) => FunctionBlock
    ): BaseColumn {
        if (!meta) {
            throw new Error("Missing meta");
        }

        if (
            expression.type !== "FunctionExpression" &&
            expression.type !== "ArrowFunctionExpression"
        ) {
            throw new Error(
                "Expected FunctionExpression got " + expression.type
            );
        }

        if (expression.params.length != 1) {
            throw new Error("only single parameter functions supported");
        }

        const firstParameter = expression.params[0];
        if (firstParameter.type !== "Identifier") {
            throw new Error("Expect identifier");
        }

        const recordName = firstParameter.name;

        const returnArgument = extractReturnExpression(expression.body);
        const newSymbols = {
            ...symbols,
            [recordName]: meta,
        };

        const column = sqlForExpression(
            returnArgument as Expression,
            meta,
            newSymbols,
            columns
        );

        if (!column.meta) {
            console.error(returnArgument);
            throw new Error("Missing meta");
        }
        return {
            ...column,
            expression: (symbols) =>
                column.expression({
                    ...symbols,
                    [recordName]: expr(symbols),
                }),
        };
    }

    switch (meta.type) {
        case "record": {
            const innerScope = {
                ...scope,
                [meta.name]: value,
            };

            const inner = lazy(() => {
                const columns: Dictionary<Column> = {};

                for (const [key, tableMeta] of Object.entries(tableMetas)) {
                    if (!tableMeta) {
                        console.log(key);
                    }
                    for (const [fieldKey, fieldMeta] of Object.entries(
                        tableMeta.fields
                    )) {
                        if (
                            fieldMeta.type === "uuid" &&
                            fieldMeta.linkTo === meta.name &&
                            fieldKey == camelCase(fieldMeta.linkTo)
                        ) {
                            const tableName = uniqueId("T");
                            const relatedValue = (variables: Variables) => {
                                return str(
                                    "?",
                                    select()
                                        .from(snakeCase(plural(key)), tableName)
                                        .field(
                                            str(
                                                "coalesce(array_agg(" +
                                                    tableName +
                                                    "), '{}')"
                                            )
                                        )
                                        .where(
                                            tableName +
                                                "." +
                                                snakeCase(fieldKey) +
                                                " = " +
                                                value(variables) +
                                                ".id"
                                        )
                                );
                            };
                            innerScope[tableMeta.name + "[]"] = relatedValue;
                            columns[camelCase(plural(key))] = {
                                meta: {
                                    type: "array",
                                    items: tableMeta,
                                },
                                expression: relatedValue,
                                subkeyType: null,
                                inner: () => ({}),
                            };

                            if (
                                tableMeta.fields.number &&
                                meta.name === "Project" &&
                                seen.size === 1
                            ) {
                                const tableName = uniqueId("T");
                                const relatedValue = (variables: Variables) => {
                                    return str(
                                        "?",
                                        select()
                                            .from(
                                                snakeCase(plural(key)),
                                                tableName
                                            )
                                            .field(str(tableName))
                                            .where(
                                                tableName +
                                                    "." +
                                                    fieldKey +
                                                    " = " +
                                                    value(variables) +
                                                    ".id"
                                            )
                                            .order("number", false)
                                            .limit(1)
                                    );
                                };

                                const lastFieldKey = "last" + key;
                                const innerSeen = new Set(seen);
                                innerSeen.add(meta.name);

                                const innerColumn = createColumnForMeta(
                                    tableMetas,
                                    tableMeta,
                                    relatedValue,
                                    innerScope,
                                    innerSeen,
                                    {}
                                );
                                columns[lastFieldKey] = innerColumn;
                            }
                        }
                    }
                }

                for (const [fieldKey, fieldMeta] of Object.entries(
                    meta.fields
                )) {
                    if (fieldKey in meta.functions) {
                        // this field overriden by a function
                        continue;
                    }
                    const segmentColumn = segment_columns[fieldKey];

                    const innerColumn = (function () {
                        if (segmentColumn) {
                            if (fieldMeta.type !== "array") {
                                throw new Error(
                                    "All segment columns should be arrays"
                                );
                            }
                            return createColumnForMeta(
                                tableMetas,
                                fieldMeta.items,
                                (symbols) => segmentColumn,
                                innerScope,
                                seen,
                                {}
                            );
                        } else {
                            return createColumnForMeta(
                                tableMetas,
                                fieldMeta,
                                (symbols) =>
                                    str(
                                        "?." + snakeCase(fieldKey),
                                        value(symbols)
                                    ),
                                innerScope,
                                seen,
                                {}
                            );
                        }
                    })();

                    columns[fieldKey] = innerColumn;
                }

                for (const [fieldKey, func] of Object.entries(meta.functions)) {
                    let expression = parseExpression(
                        func.fn.toString()
                    ) as Expression;

                    const resolvedParameters = (variables: Variables) => {
                        return func.parameterTypes().map((parameter) => {
                            switch (parameter.type) {
                                case "record":
                                    return innerScope[parameter.name](
                                        variables
                                    );
                                case "array":
                                    switch (parameter.items.type) {
                                        case "record":
                                            return innerScope[
                                                parameter.items.name + "[]"
                                            ](variables);
                                        default:
                                            throw new Error();
                                    }
                                case "uuid":
                                    return variables.__key;
                                default:
                                    throw new Error();
                            }
                        });
                    };

                    const resolved = {
                        ...sqlForFunction(
                            expression,
                            func.parameterTypes(),
                            columns,
                            resolvedParameters
                        ),
                        meta: func.returnType,
                    };

                    let subkeyType = null;
                    for (const parameter of func.parameterTypes()) {
                        if (parameter.type === "uuid") {
                            subkeyType = parameter.linkTo;
                        }
                    }

                    const segmentColumn = segment_columns[fieldKey];

                    const innerColumn = (function () {
                        if (segmentColumn) {
                            if (resolved.meta.type !== "array") {
                                throw new Error(
                                    "All segment columns should be arrays"
                                );
                            }
                            return createColumnForMeta(
                                tableMetas,
                                resolved.meta.items,
                                (symbols) => segmentColumn,
                                innerScope,
                                seen,
                                {}
                            );
                        } else {
                            return createColumnForMeta(
                                tableMetas,
                                resolved.meta,
                                resolved.expression,
                                innerScope,
                                seen,
                                {}
                            );
                        }
                    })();
                    innerColumn.subkeyType = subkeyType || null;

                    columns[fieldKey] = innerColumn;
                }
                return columns;
            });
            return {
                meta,
                subkeyType: null,
                expression: value,
                inner,
            };
        }
        case "uuid": {
            const inner = lazy(() => {
                const columns: Dictionary<Column> = {};
                const linkTo = meta.linkTo;
                if (linkTo && !seen.has(linkTo) && seen.size < 3) {
                    const innerSeen = new Set(seen);
                    innerSeen.add(linkTo);
                    const tableMeta = tableMetas[linkTo];
                    if (tableMeta) {
                        const tableName = uniqueId("T");
                        const fieldValue = str(tableName);

                        const rawInnerColumn = createColumnForMeta(
                            tableMetas,
                            tableMeta,
                            (_key) => fieldValue,
                            {},
                            innerSeen,
                            {}
                        );
                        const innerColumn = transformColumn(
                            rawInnerColumn,
                            (innerFieldColumn) => ({
                                meta: innerFieldColumn.meta,
                                subkeyType: innerFieldColumn.subkeyType,
                                expression: (key) =>
                                    str(
                                        "?",
                                        select()
                                            .from(
                                                snakeCase(plural(linkTo)),
                                                tableName
                                            )
                                            .where("id = ?", value(key))
                                            .field(
                                                innerFieldColumn.expression(key)
                                            )
                                    ),
                            })
                        );

                        for (const [
                            innerFieldKey,
                            innerFieldColumn,
                        ] of Object.entries(innerColumn.inner())) {
                            columns[innerFieldKey] = innerFieldColumn;
                        }
                        columns["."] = {
                            meta: tableMeta,
                            subkeyType: null,
                            expression: (key) =>
                                str(
                                    "?",
                                    select()
                                        .from(
                                            snakeCase(plural(linkTo)),
                                            tableName
                                        )
                                        .where("id = ?", value(key))
                                        .field(tableName.toLowerCase())
                                ),
                            inner: () => ({}),
                        };
                    }
                }
                return columns;
            });
            return {
                meta,
                expression: value,
                subkeyType: null,
                inner,
            };
        }
        case "array": {
            const tableName = uniqueId("T");
            const inner = createColumnForMeta(
                tableMetas,
                meta.items,
                (_key) => str(tableName),
                scope,
                seen,
                {}
            );
            return transformColumn(inner, (innerFieldColumn) => ({
                meta: {
                    type: "array",
                    items: innerFieldColumn.meta,
                },
                subkeyType: null,
                expression: (key) =>
                    str(
                        "?",
                        select()
                            .field(
                                str(
                                    "coalesce(array_agg(?), '{}')",
                                    innerFieldColumn.expression(key)
                                )
                            )
                            .from(rstr("unnest(?)", value(key)), tableName)
                    ),
            }));
        }

        case "null":
        case "array?":
        case "binary":
            return {
                meta: { type: "string" },
                subkeyType: null,
                expression: () => str("NULL"),
                inner: () => ({}),
            };
        case "version":
        case "string":
        case "money":
        case "percentage":
        case "quantity":
        case "money?":
        case "boolean?":
        case "percentage?":
        case "quantity?":
        case "boolean":
        case "date":
        case "phone":
        case "datetime":
        case "enum":
        case "serial":
            return {
                meta,
                subkeyType: null,
                expression: value,
                inner: () => ({}),
            };
    }
}

function transformColumn(
    column: Column,
    f: (x: LoneColumn) => LoneColumn
): Column {
    return {
        ...f(column),
        inner: lazy(() => {
            return mapValues(column.inner(), (y) => transformColumn(y, f));
        }),
    };
}

export default function createColumns(
    tableMetas: Dictionary<RecordMeta<any, any, any>>
): Dictionary<Column> {
    function createColumnForTable(
        meta: RecordMeta<any, any, any>,
        segment_columns: string[]
    ): Column {
        const base = createColumnForMeta(
            tableMetas,
            meta,
            (_key) => str(snakeCase(plural(meta.name))),
            {},
            new Set([meta.name]),
            fromPairs(
                segment_columns.map((key, index) => [key, str("S" + index)])
            )
        );
        const inner = lazy(() => {
            return {
                ...base.inner(),
                ".": base,
                null: {
                    meta: { type: "string" },
                    subkeyType: null,
                    expression: () => str("NULL"),
                    inner: () => ({}),
                },
            } satisfies Dictionary<Column>;
        });
        return {
            ...base,
            inner,
        };
    }
    const columns = mapValues(tableMetas, (value) =>
        createColumnForTable(value, [])
    );

    for (const [key, meta] of Object.entries(tableMetas)) {
        for (const [segment, segment_columns] of Object.entries(
            meta.segments
        )) {
            columns[key + "@" + segment] = createColumnForTable(
                meta,

                segment_columns
            );
        }
    }
    return columns;
}
