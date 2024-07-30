import { camelCase } from "change-case";
import { createWriteStream, readFileSync } from "fs";
import * as iconv from "iconv-lite";
import { LevelUp } from "levelup";
import { Transform } from "stream";
import { createGzip } from "zlib";
import { Dictionary } from "../clay/common";

const level: (filename: string) => LevelUp = require("level"); //tslint:disable-line

type Field = {
    table: string;
    name: string;
    typeid: string;
};

function decodeBuffer(bufferValue: Buffer | "") {
    if (bufferValue === "") {
        return "";
    }
    return bufferValue === null ? null : iconv.decode(bufferValue, "win1252");
}

async function expandRecords(
    database: LevelUp,
    fieldsByTable: Dictionary<Field[]>,
    table: string,
    value: string
) {
    if (value === null) {
        return [];
    }
    const items: string[] = [];
    await new Promise((resolve, reject) => {
        database
            .createReadStream({
                gt: table + "@P" + value + "I",
                lt: table + "@P" + value + "J",
            })
            .on("data", (data) => {
                items.push(data.value);
            })
            .on("error", (error) => reject(error))
            .on("end", () => {
                resolve(null);
            });
    });
    const records = [];
    for (const item of items) {
        records.push(
            await doExpandRecord(database, fieldsByTable, table, item)
        );
    }
    return records;
}

async function expandRecord(
    database: LevelUp,
    fieldsByTable: Dictionary<Field[]>,
    table: string,
    value: string
) {
    if (value === null) {
        return null;
    }
    let record;
    try {
        record = await database.get(table + "@I" + value);
    } catch (error) {
        return null;
    }
    return await doExpandRecord(database, fieldsByTable, table, record);
}

async function doExpandRecord(
    database: LevelUp,
    fieldsByTable: Dictionary<Field[]>,
    table: string,
    rawRecord: string
) {
    const record = JSON.parse(rawRecord);
    for (const field of fieldsByTable[table] || []) {
        if (field.typeid.startsWith("@")) {
            record[camelCase(field.name)] = await expandRecords(
                database,
                fieldsByTable,
                field.typeid.substring(1),
                record[camelCase(field.name)]
            );
        } else if (field.typeid === "*Contact" || field.typeid === "*Company") {
            record[camelCase(field.name)] = await expandRecord(
                database,
                fieldsByTable,
                field.typeid.substring(1),
                record[camelCase(field.name)]
            );
        }
    }
    if (table === "UDSO") {
        const other = await expandRecord(
            database,
            fieldsByTable,
            "Budgets",
            record.id
        );
        if (other) {
            record.theBudget = other.theBudget;
            record.name = other.name;
        }
    }
    return record;
}

async function expand(
    database: LevelUp,
    fieldsByTable: Dictionary<Field[]>,
    table: string
) {
    console.log("Expanding: ", table);
    function expandRecord(chunk: any, encoding: string, callback: any) {
        doExpandRecord(database, fieldsByTable, table, chunk.value)
            .then((result) => {
                callback(null, JSON.stringify(result) + "\n");
            })
            .catch((error) => {
                callback(error);
            });
    }

    return new Promise((resolve, reject) => {
        database
            .createReadStream({ gt: table + "@I", lt: table + "@J" })
            .pipe(
                new Transform({
                    writableObjectMode: true,
                    transform: expandRecord,
                })
            )
            .pipe(createGzip())
            .pipe(createWriteStream("data/" + table + ".json.gz"))
            .on("error", (error) => reject(error))
            .on("finish", () => {
                resolve(null);
            });
    });
}

async function expandData() {
    const fieldsByTable = JSON.parse(readFileSync("data/schema.json", "utf-8"));
    const database = level("data.db");

    await expand(database, fieldsByTable, "Job");
    await expand(database, fieldsByTable, "Contact");
    await expand(database, fieldsByTable, "ContactType");
    await expand(database, fieldsByTable, "Company");
    await expand(database, fieldsByTable, "NewEstimate");
    await expand(database, fieldsByTable, "Manager");
    await expand(database, fieldsByTable, "ItemTypes");
    await expand(database, fieldsByTable, "UnitTypes");
    await expand(database, fieldsByTable, "TemplateType");
    await expand(database, fieldsByTable, "FinishSchedule");
    await expand(database, fieldsByTable, "RateInformation");
    await expand(database, fieldsByTable, "SaltProduct");
    await expand(database, fieldsByTable, "CustomerRelation");
    await expand(database, fieldsByTable, "ScopeOfWork");
    await expand(database, fieldsByTable, "YourProjectItems");
    await expand(database, fieldsByTable, "ContractNotes");
    await expand(database, fieldsByTable, "SVRT");
    await database.close();
}

async function main() {
    await expandData();
}

main()
    .then(() => console.log("Finished"))
    .catch((err) => console.error(err));
