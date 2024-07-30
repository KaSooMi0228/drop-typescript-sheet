import Database from "better-sqlite3";

// nash

const database = Database("local-database.db");

database
    .prepare(
        `CREATE TABLE IF NOT EXISTS MESSAGES (
    timestamp timestamp,
    user id,
    session id,
    time number,
    message data,
    result data,
    sent boolean,
    error string,
    error_stack string
)
`
    )
    .run();

const insertMessage = database.prepare(
    `INSERT INTO MESSAGES VALUES(CURRENT_TIMESTAMP,?,?,?,?,?,?,?,?)`
);

database
    .prepare(
        `CREATE TABLE IF NOT EXISTS PATCHES (
    id PRIMARY KEY,
    timestamp TIMESTAMP
)`
    )
    .run();

const patchQuery = database.prepare(
    `INSERT OR IGNORE INTO PATCHES VALUES(?, CURRENT_TIMESTAMP)`
);

const beginQuery = database.prepare("BEGIN");
const commitQuery = database.prepare("COMMIT");
const rollbackQuery = database.prepare("ROLLBACK");

export async function recordPatches<T>(f: () => Promise<T>): Promise<T> {
    beginQuery.run();
    try {
        const result = await f();
        commitQuery.run();
        return result;
    } catch (error) {
        rollbackQuery.run();
        throw error;
    }
}

export function recordMessage(
    user: string,
    session: string,
    time: number,
    message: any,
    result: any,
    sent: boolean,
    error: Error | null
) {
    if (
        message.request?.type === "PATCH" ||
        message.request?.type === "GENERATE"
    ) {
        const parameters = [
            user,
            session,
            time,
            JSON.stringify(message),
            JSON.stringify(result) || null,
            sent ? "1" : "0",
            error?.toString() || null,
            error?.stack || null,
        ];
        insertMessage.run(...parameters);
    }
}

export function recordPatch(patchId: string): boolean {
    return patchQuery.run(patchId).changes == 1;
}
export function maintain() {
    database.exec(
        `delete from patches where timestamp < date(julianday(date('now'))-7)`
    );
    database.exec(`
    delete from messages;
    `);
    database.exec("vacuum");
}
