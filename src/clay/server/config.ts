import arrayBufferToHex from "array-buffer-to-hex";
import bodyParser from "body-parser";
import { Express } from "express";
import { sha256 } from "js-sha256";
import { databasePool } from "./databasePool";

export function configureServer(express: Express) {
    express.use(bodyParser.raw());
    const raw = bodyParser.raw({
        type: "*/*",
        limit: "100mb",
    });

    express.post("/blobs/", (request, response) => {
        raw(request, response, async (err) => {
            try {
                if (err) {
                    throw err;
                }
                const hash = sha256(request.body);
                const { pool } = await databasePool;

                await pool.query({
                    text: "INSERT INTO BLOBS VALUES ($1, $2, $3) ON CONFLICT(id) DO NOTHING",
                    values: [
                        hash,
                        request.headers["content-type"],
                        "\\x" + arrayBufferToHex(request.body),
                    ],
                });

                response.status(200).send(hash);
            } catch (error) {
                console.error(error);
                response.status(500).send();
            }
        });
    });

    express.get("/blobs/:blobId", async (request, response) => {
        try {
            const { pool } = await databasePool;

            const db_response = await pool.query({
                text: "SELECT data, type FROM BLOBS WHERE ID = $1",
                values: [request.params.blobId],
            });

            if (db_response.rows.length == 0) {
                response.status(404).send();
            } else {
                const row = db_response.rows[0];
                response.setHeader("content-type", row.type);
                response.status(200);
                response.send(row.data);
            }
        } catch (error) {
            console.error(error);
            response.status(500).send();
        }
    });
}
