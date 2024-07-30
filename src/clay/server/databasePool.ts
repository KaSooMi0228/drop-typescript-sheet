import { TABLES_META } from "../../app/tables";
import { createContext } from "./context";
import { rawDatabasePool } from "./rawDatabasePool";
import updateDatabase from "./updateDatabase";

async function createDatabasePool() {
    const pool = rawDatabasePool();
    const client = await pool.connect();
    await updateDatabase(client, TABLES_META);
    const context = await createContext(client, TABLES_META);
    client.release();
    return { pool, context };
}
export const databasePool = createDatabasePool();
