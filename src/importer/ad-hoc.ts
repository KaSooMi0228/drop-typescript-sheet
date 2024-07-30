import { config } from "dotenv";
import { createReadStream } from "fs";
import { Client } from "pg";
import { createInterface } from "readline";
import { createGunzip } from "zlib";
import { TABLES_META } from "../app/tables";
import { Dictionary } from "../clay/common";
import { createContext } from "../clay/server/context";
import { ServerError } from "../clay/server/error";
import patchRecord from "../clay/server/patchRecord";
import queryTable from "../clay/server/queryTable";
import { genUUID } from "../clay/uuid";
import { ROOT_USER } from "../server/root-user";

function readToLines(path: string, onLine: (data: any) => void) {
    const stream = createReadStream(path).pipe(createGunzip());

    return new Promise<void>((resolve, reject) => {
        const reader = createInterface({ input: stream });

        reader.on("line", (line) => {
            onLine(JSON.parse(line));
        });
        reader.on("close", () => {
            resolve();
        });
        reader.on("error", (error) => {
            reject(error);
        });
    });
}

async function main() {
    config();
    const client = new Client();
    await client.connect();

    try {
        const context = await createContext(client, TABLES_META);

        {
            console.log("Getting users");
            const usersQuery = await queryTable({
                client,
                context,
                tableName: "User",
                columns: ["id", "code"],
                user: ROOT_USER,
                sorts: [],
            });

            const users: Dictionary<string> = {};
            for (const row of usersQuery.rows) {
                const [id, code] = row as any;
                if (code) {
                    users[code] = id;
                }
            }

            console.log("Reading DS2 Data");

            const numberToUser: Dictionary<string> = {};
            await readToLines("data/Job.json.gz", (job) => {
                const user = users[job.formCompletedBy];
                if (user) {
                    numberToUser[job.jobNumber] = user;
                }
            });

            console.log("Looking up missing data");

            const result = await queryTable({
                client,
                context,
                tableName: "Project",
                columns: ["id", "projectNumber"],
                user: ROOT_USER,
                filters: [
                    {
                        column: "quoteRequestCompletedBy",
                        filter: {
                            equal: null,
                        },
                    },
                ],
                sorts: [],
            });

            console.log("Patching");

            for (const row of result.rows) {
                const [id, number]: [string, string] = row as any;

                if (numberToUser[number]) {
                    await patchRecord({
                        client,
                        context,
                        tableName: "Project",
                        id,
                        user: ROOT_USER,
                        form: "ad-hoc import",
                        dateTime: new Date(),
                        override: false,
                        patches: [
                            {
                                quoteRequestCompletedBy: [
                                    null,
                                    numberToUser[number],
                                ],
                            },
                        ],
                        patchIds: [genUUID()],
                    });
                }
            }
        }
    } catch (error) {
        if (error instanceof ServerError) {
            console.log(JSON.stringify(error.detail));
            console.error(error.detail);
        } else {
            throw error;
        }
    } finally {
        await client.end();
    }
}
main()
    .then(() => console.log("Finished"))
    .catch((err) => console.error(err));
