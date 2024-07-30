import { config } from "dotenv";
import { Pool } from "pg";

export function rawDatabasePool() {
    config();

    const pool = new Pool({
        max: 100,
    });
    if (process.env.PGSCHEMA) {
        pool.on("connect", (client) => {
            client.query("SET search_path TO '" + process.env.PGSCHEMA + "'");
        });
    }
    return pool;
}
