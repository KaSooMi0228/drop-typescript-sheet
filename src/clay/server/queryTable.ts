import { snakeCase } from "change-case";
import { uniqueId } from "lodash";
import { ClientBase } from "pg";
import { plural } from "pluralize";
import { Expression } from "safe-squel";
import { format } from "sql-formatter";
import { Meta } from "../meta";
import { FilterDetail, QueryTableResult, UserPermissions } from "./api";
import { Context } from "./context";
import { Column } from "./createColumns";
import { ServerError, verifyPermission } from "./error";
import { databaseDecode } from "./readRecord";
import { expr, rstr, select, str } from "./squel";

type QueryTableRequest = {
    client: ClientBase;
    context: Context;
    tableName: string;
    columns: string[];
    sorts: string[];
    filters?: FilterDetail[];
    limit?: number;
    segment?: string;
    user: UserPermissions;
};

export function resolveColumn(column: Column, name: string): Column | null {
    if (name == ".") {
        return column;
    }
    let trailingPeriod = false;
    if (name.endsWith(".")) {
        trailingPeriod = true;
        name = name.substring(0, name.length - 1);
    }
    const parts = name.split(".");
    if (trailingPeriod) {
        parts.push(".");
    }
    for (const part of parts) {
        if (part === "") {
            continue;
        }
        column = column.inner()[part];
        if (!column) {
            return null;
        }
    }
    return column;
}

export default async function queryTable(
    parameters: QueryTableRequest
): Promise<QueryTableResult> {
    verifyPermission(parameters.user, parameters.tableName, "read");

    const query = select().from(snakeCase(plural(parameters.tableName)));

    const segmentOffsets = [];
    if (parameters.segment) {
        let segmentIndex = 0;
        for (const part of parameters.context.metas[parameters.tableName]
            .segments[parameters.segment]) {
            const tableName = "S" + segmentIndex++;
            query.cross_join(
                rstr(
                    `unnest(?) with ordinality`,
                    resolveColumn(
                        parameters.context.columns[parameters.tableName],
                        part
                    )!.expression({})
                ),
                tableName
            );
            segmentOffsets.push(`${tableName}.ordinality`);
        }
    }

    const availableColumns =
        parameters.context.columns[
            parameters.tableName +
                (parameters.segment ? "@" + parameters.segment : "")
        ];
    function decodeColumn(column: string) {
        const parts = column.split("@");
        const columnKey = parts[0];
        const columnSubKey = parts[1] || null;

        const columnDetail = resolveColumn(availableColumns, columnKey);
        if (!columnDetail) {
            throw new ServerError({
                status: "INVALID_COLUMN",
                column,
            });
        }

        if (columnSubKey) {
            return {
                expression: columnDetail.expression({
                    __key: str("?", columnSubKey),
                }),
                meta: columnDetail.meta,
            };
        } else {
            return {
                expression: columnDetail.expression({}),
                meta: columnDetail.meta,
            };
        }
    }

    let index = 0;
    const metas: Meta[] = [];
    for (const [columnName, column] of Object.entries(parameters.columns)) {
        const decodedColumn = decodeColumn(column);
        metas.push(decodedColumn.meta);
        query.field(decodedColumn.expression, "c" + index);
        index += 1;
    }

    for (let column of parameters.sorts) {
        let reversed = false;
        if (column.startsWith("-")) {
            reversed = true;
            column = column.slice(1);
        }

        const sortColumn = decodeColumn(
            resolveColumn(availableColumns, column + "Sort")
                ? column + "Sort"
                : column
        );

        if (sortColumn.meta.type === "string") {
            query.field(
                str("naturalsort(lower(?))", sortColumn.expression),
                "c" + index
            );
        } else {
            query.field(sortColumn.expression, "c" + index);
        }
        query.order("c" + index, !reversed);
        index += 1;
    }
    for (const segment_offset of segmentOffsets) {
        query.order(segment_offset);
    }
    const withs: string[] = [];
    if (parameters.filters) {
        const applyFilter = (expression: Expression, filter: any) => {
            if (filter.or !== undefined) {
                if (filter.or.length !== 0) {
                    const innerExpression = expr();
                    for (const item of filter.or) {
                        const subExpression = expr();
                        applyFilter(subExpression, item);
                        innerExpression.or(subExpression);
                    }
                    expression.and(innerExpression);
                } else {
                    expression.and("false");
                }
            } else if (filter.and !== undefined) {
                for (const item of filter.and) {
                    const subExpression = expr();
                    applyFilter(subExpression, item);
                    expression.and(subExpression);
                }
            } else if (filter.not !== undefined) {
                const subExpression = expr();
                applyFilter(subExpression, filter.not);
                expression.and("not ?", subExpression);
            } else {
                let columnDetail = decodeColumn(filter.column);
                if (!columnDetail) {
                    throw new ServerError({
                        status: "INVALID_COLUMN",
                        column: filter.column,
                    });
                }
                let userFilterRewrite = false;
                if (
                    parameters.tableName === "Project" &&
                    filter.column.startsWith("personnelByRole.name@")
                ) {
                    userFilterRewrite = true;
                    columnDetail = {
                        expression: str("name"),
                        meta: {
                            type: "string",
                        },
                    };
                    expression.and(
                        `exists (select 1 from unnest(personnel) where "role" = ?::uuid and "user" in (select id from W${withs.length}))`,
                        filter.column.slice("personnelByRole.name@".length)
                    );
                    expression = expr();
                } else if (
                    filter.column.startsWith("project.personnelByRole.name@")
                ) {
                    userFilterRewrite = true;
                    columnDetail = {
                        expression: str("name"),
                        meta: {
                            type: "string",
                        },
                    };
                    expression.and(
                        `exists (select 1 from unnest((select y.personnel from projects y where y.id = project)) where "role" = ?::uuid and "user" in (select id from W${withs.length}))`,
                        filter.column.slice(
                            "project.personnelByRole.name@".length
                        )
                    );
                    expression = expr();
                }
                if (filter.filter.like !== undefined) {
                    if (columnDetail.meta.type === "array") {
                        const tableName = uniqueId("T");
                        expression.and(
                            `coalesce((select bool_or(${tableName} ilike ?) from unnest(?) ${tableName}), false)`,
                            filter.filter.like,
                            columnDetail.expression
                        );
                    } else {
                        expression.and(
                            "? ilike ? ",
                            columnDetail.expression,
                            filter.filter.like
                        );
                    }
                }
                if (filter.filter.equal !== undefined) {
                    if (filter.filter.equal === null) {
                        expression.and("? is null ", columnDetail.expression);
                    } else {
                        if (columnDetail.meta.type === "array") {
                            if (filter.filter.ignore_case) {
                                const tableName = uniqueId("T");
                                expression.and(
                                    `coalesce((select bool_or(lower(${tableName}) = lower(?)) from unnest(?) ${tableName}), false)`,
                                    filter.filter.equal,
                                    columnDetail.expression
                                );
                            } else {
                                const tableName = uniqueId("T");
                                expression.and(
                                    `coalesce((select bool_or(${tableName} = ?) from unnest(?) ${tableName}), false)`,
                                    filter.filter.equal,
                                    columnDetail.expression
                                );
                            }
                        } else {
                            if (filter.filter.ignore_case) {
                                expression.and(
                                    "lower(?) = lower(?)",
                                    columnDetail.expression,
                                    filter.filter.equal
                                );
                            } else {
                                expression.and(
                                    "? = ? ",
                                    columnDetail.expression,
                                    filter.filter.equal
                                );
                            }
                        }
                    }
                }
                if (filter.filter.not_equal !== undefined) {
                    if (filter.filter.not_equal === null) {
                        expression.and(
                            "? is not null ",
                            columnDetail.expression
                        );
                    } else {
                        if (columnDetail.meta.type === "array") {
                            const tableName = uniqueId("T");
                            if (filter.filter.ignore_case) {
                                expression.and(
                                    `coalesce((select bool_or(lower(${tableName}) != lower(?)) from unnest(?) ${tableName}), false)`,
                                    filter.filter.not_equal,
                                    columnDetail.expression
                                );
                            } else {
                                expression.and(
                                    `coalesce((select bool_or(${tableName} != ?) from unnest(?) ${tableName}), false)`,
                                    filter.filter.not_equal,
                                    columnDetail.expression
                                );
                            }
                        } else {
                            if (filter.filter.ignore_case) {
                                expression.and(
                                    "lower(?) != lower(?)",
                                    columnDetail.expression,
                                    filter.filter.not_equal
                                );
                            } else {
                                expression.and(
                                    "? != ?",
                                    columnDetail.expression,
                                    filter.filter.not_equal
                                );
                            }
                        }
                    }
                }
                if (filter.filter.greater !== undefined) {
                    expression.and(
                        "? > ? ",
                        columnDetail.expression,
                        filter.filter.greater
                    );
                }
                if (filter.filter.lesser !== undefined) {
                    expression.and(
                        "? < ? ",
                        columnDetail.expression,
                        filter.filter.lesser
                    );
                }

                if (filter.filter.in !== undefined) {
                    if (filter.filter.in.length == 0) {
                        // in the case that the filter has an empty in-clause,
                        // postgres gets angry about that. We resolve this by
                        // simply returning an empty result since that is the only possible outcome
                        expression.and("false");
                    } else {
                        expression.and(
                            "? in ? ",
                            columnDetail.expression,
                            filter.filter.in
                        );
                    }
                }

                if (filter.filter.intersects !== undefined) {
                    if (filter.filter.intersects.length == 0) {
                        expression.and("false");
                    } else if (
                        columnDetail.meta.type === "array" &&
                        columnDetail.meta.items.type === "uuid"
                    ) {
                        expression.and(
                            `? && ARRAY[${filter.filter.intersects
                                .map(() => "?::uuid")
                                .join(",")}]`,
                            columnDetail.expression,
                            ...filter.filter.intersects
                        );
                    } else {
                        expression.and(
                            `? && ARRAY[${filter.filter.intersects
                                .map(() => "?")
                                .join(",")}]`,
                            columnDetail.expression,
                            ...filter.filter.intersects
                        );
                    }
                }

                if (userFilterRewrite) {
                    withs.push(
                        `W${
                            withs.length
                        } AS MATERIALIZED (SELECT id FROM users WHERE ${expression.toString()})`
                    );
                }
            }
            return null;
        };
        const expression = expr();
        for (const filter of parameters.filters) {
            const result = applyFilter(expression, filter);
            if (result !== null) {
                return result;
            }
        }
        query.where(expression);
    }

    if (parameters.limit !== undefined) {
        query.field(str("count(*) over()"), "full_count");
        query.limit(parameters.limit);
    }

    try {
        const before = new Date();

        const param = query.toParam();

        if (withs.length != 0) {
            param.text = `WITH ${withs.join(",")} ${param.text}`;
        }

        const result = await parameters.client.query(param);

        const after = new Date();

        if (process.env.LOG_QUERIES) {
            console.log("Time: " + (after.getTime() - before.getTime()));
            console.log(
                format(query.toString(), {
                    language: "postgresql",
                }) + "\n\n"
            );
        }

        return {
            rows: result.rows.map((row) =>
                metas.map((column: Meta, columnIndex: number) =>
                    databaseDecode(
                        parameters.context,
                        column,
                        row["c" + columnIndex]
                    )
                )
            ),
            full_count:
                parameters.limit && result.rows.length > 0
                    ? parseInt(result.rows[0].full_count, 0)
                    : result.rows.length,
        };
    } catch (error) {
        console.log(format(query.toString(), { language: "postgresql" }));
        throw error;
    }
}
