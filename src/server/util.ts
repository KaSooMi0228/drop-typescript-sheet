import { databasePool } from "../clay/server/databasePool";
import readRecord from "../clay/server/readRecord";
import { ROOT_USER } from "./root-user";

export async function quickReadRecord(tableName: string, id: string) {
    const { pool, context } = await databasePool;

    const client = await pool.connect();
    try {
        return (
            await readRecord(client, context, ROOT_USER, tableName, id, false)
        ).record;
    } finally {
        client.release();
    }
}
