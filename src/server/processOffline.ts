import { snakeCase } from "change-case";
import { Pool } from "pg";
import { plural } from "pluralize";
import { PostgresSelect } from "safe-squel";
import { CacheConfig, CACHE_CONFIG } from "../cache";
import { Dictionary } from "../clay/common";
import { UserPermissions } from "../clay/server/api";
import { Context } from "../clay/server/context";
import { readRecords } from "../clay/server/readRecord";
import { select, str } from "../clay/server/squel";
import { hasPermission } from "../permissions";

function makeAdapter(
    config: CacheConfig,
    user: UserPermissions
): (query: PostgresSelect) => void {
    switch (config.type) {
        case "none":
            return (query) => {
                query.where("false");
            };
        case "all":
            return () => {};
        case "list":
            return (query) => {
                let sourceQuery = select()
                    .from(snakeCase(plural(config.source)))
                    .field(str(`unnest(${snakeCase(config.field)})`));

                if (config.subfield) {
                    sourceQuery = select()
                        .from(snakeCase(plural(config.source)))
                        .field(
                            str(
                                `unnest(array(select ${config.subfield} from unnest(${config.field})))`
                            )
                        );
                }
                makeAdapter(CACHE_CONFIG[config.source], user)(sourceQuery);
                query.where("id in ?", sourceQuery);
            };
        case "link":
            return (query) => {
                let sourceQuery = select()
                    .from(snakeCase(plural(config.source)))
                    .field(snakeCase(config.field));

                makeAdapter(CACHE_CONFIG[config.source], user)(sourceQuery);
                query.where("id in ?", sourceQuery);
            };

        case "backlink":
            return (query) => {
                const sourceQuery = select()
                    .from(snakeCase(plural(config.source)))
                    .field("id");
                makeAdapter(CACHE_CONFIG[config.source], user)(sourceQuery);
                query.where(`${config.field} in ? `, sourceQuery);
            };
        case "project":
            return (query) => {
                query
                    .where(
                        "exists (select 1 from unnest(personnel) personnel where personnel.user = ?)",
                        user.id
                    )
                    .where("project_lost_date is null")
                    .where("(completion).date is null");
            };
    }
}
async function sendTable(
    pool: Pool,
    context: Context,
    table: string,
    config: CacheConfig,
    user: UserPermissions
): Promise<[string, any[]]> {
    const cacheClient = await pool.connect();
    try {
        const queryAdapter = makeAdapter(config, user);
        const result = await readRecords(
            cacheClient,
            context,
            user,
            table,
            queryAdapter
        );

        return [table, result.records];
    } finally {
        cacheClient.release();
    }
}

export async function processOffline(
    pool: Pool,
    context: Context,
    user: UserPermissions
) {
    const tables = [];
    for (const table in CACHE_CONFIG) {
        if (hasPermission(user, table, "read")) {
            tables.push(
                sendTable(pool, context, table, CACHE_CONFIG[table], user)
            );
        }
    }

    const resolved = await Promise.all(tables);

    const data: Dictionary<any[]> = {};
    for (const [key, records] of resolved) {
        data[key] = records;
    }

    return {
        records: data,
    };
}
