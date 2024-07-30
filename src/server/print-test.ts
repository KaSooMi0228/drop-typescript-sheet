import { config } from "dotenv";
import { writeFileSync } from "fs";
import { databasePool } from "../clay/server/databasePool";
import { print } from "./print";
import PRINTABLES from "./printables";
import { ROOT_USER } from "./root-user";

async function main() {
    config();

    const { pool, context } = await databasePool;
    /*
    const result = await print(
        context,
        pool,
        ROOT_USER,
        PRINTABLES.engineeredInvoice,
        ["a16a18a7-7c39-47c3-828e-8028409c2d4d"]
    );*/

    const result = await print(
        context,
        pool,
        ROOT_USER,
        PRINTABLES.warrantyReview,
        ["190e4f36-58bf-458b-927d-1927650f4988"]
    );

    writeFileSync("output.docx", result.output);
}
main()
    .then(() => console.log("Finished"))
    .catch((err) => {
        console.error(err);

        if (err.properties) {
            if (err.properties.id === "multi_error") {
                for (const error of err.properties.errors) {
                    switch (error.properties.id) {
                        case "scopeparser_execution_failed":
                            console.log(
                                "ERROR:" + error.properties.explanation
                            );
                            break;
                        default:
                            console.log(error);
                    }
                }
            } else {
                console.log(err.properties.id, Object.keys(err.properties));
            }
        }
    });
