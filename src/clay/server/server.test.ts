import { deepStrictEqual, strictEqual } from "assert";
import { Client } from "pg";
import { createContext } from "./context";
import { ServerError } from "./error";
import queryTable from "./queryTable";
import readRecord, { readRecords } from "./readRecord";
import storeRecord from "./storeRecord";
import { TABLES_META } from "./testSchema";
import { TABLES_META as TABLES_META_2 } from "./testSchema2";
import updateDatabase from "./updateDatabase";

async function withClient(client: Client, block: (client: Client) => void) {
    await client.connect();
    try {
        await block(client);
    } finally {
        await client.end();
    }
}

function makeTime(index: number) {
    return new Date(1000 + 100 * index);
}

describe("server", () => {
    it("has a working system", async () => {
        // First we connect to the main postgres database
        // and create an empty database
        await withClient(
            new Client({
                user: "postgres",
                database: "postgres",
                password: "password",
                host: "localhost",
            }),
            async (postgresClient) => {
                await postgresClient.query(
                    "DROP DATABASE IF EXISTS dropsheet_test"
                );
                await postgresClient.query("CREATE DATABASE dropsheet_test");
            }
        );

        await withClient(
            new Client({
                user: "postgres",
                password: "password",
                host: "localhost",
                database: "dropsheet_test",
            }),
            async (client) => {
                await updateDatabase(client, TABLES_META);
                let context = await createContext(client, TABLES_META);

                const USER_ID_1 = "24dd8e9d-72b6-4bcb-a2b1-96de5461afab";
                const RECORD_ID_1 = "24dd8e9d-72b6-4bcb-a2b1-96de5461afae";
                const RECORD_ID_2 = "24dd8e9d-72b6-4bcb-a2b1-96de5461afaa";

                const GOOD_RECORD = {
                    id: RECORD_ID_1,
                    recordVersion: null,
                    mother: {
                        name: "Eve",
                        happy: true,
                    },
                    father: {
                        name: "Adam",
                        happy: false,
                    },
                    children: [
                        {
                            name: "Cain",
                            happy: false,
                        },
                        {
                            name: "Abel",
                            happy: true,
                        },
                        {
                            name: "Seth",
                            happy: false,
                        },
                    ],
                };

                const USER = {
                    id: USER_ID_1,
                    email: "",
                    admin: true,
                    permissions: [],
                };

                deepStrictEqual(
                    await storeRecord({
                        client,
                        context,
                        tableName: "Family",
                        record: GOOD_RECORD,
                        user: USER,
                        form: "store on first schema",
                        dateTime: makeTime(0),
                    }),
                    {
                        record: {
                            ...GOOD_RECORD,
                            recordVersion: 0,
                        },
                    }
                );

                try {
                    await storeRecord({
                        client,
                        context,
                        tableName: "Family",
                        record: {
                            id: RECORD_ID_2,
                            recordVersion: null,
                        },
                        user: USER,
                        form: "will fail",
                        dateTime: makeTime(1),
                    });
                    throw new Error("Expected");
                } catch (error) {
                    strictEqual(true, error instanceof ServerError);
                    deepStrictEqual(
                        (error as any).detail.status,
                        "INVALID_RECORD"
                    );
                }

                deepStrictEqual(
                    await readRecord(
                        client,
                        context,
                        USER,
                        "Family",
                        RECORD_ID_1
                    ),
                    {
                        record: {
                            ...GOOD_RECORD,
                            recordVersion: 0,
                        },
                    }
                );

                await updateDatabase(client, TABLES_META_2);
                context = await createContext(client, TABLES_META_2);

                try {
                    await storeRecord({
                        client,
                        context,
                        tableName: "Family",
                        record: {
                            ...GOOD_RECORD,
                            id: RECORD_ID_2,
                        },
                        user: USER,
                        form: "will fail due to old schema",
                        dateTime: makeTime(2),
                    });
                } catch (error) {
                    strictEqual(true, error instanceof ServerError);
                    deepStrictEqual(
                        (error as any).detail.status,
                        "INVALID_RECORD"
                    );
                }

                const GOOD_RECORD_2 = {
                    id: RECORD_ID_2,
                    recordVersion: null,
                    mother: {
                        name: "George",
                        age: "600",
                        favoriteColor: "Blue",
                        happy: false,
                        holiday: null,
                    },
                    father: {
                        name: "Mary",
                        age: "900",
                        favoriteColor: "Pink",
                        happy: true,
                        holiday: "2017-06-05",
                    },
                    surname: "Smith",
                    currentLocation: "Place",
                    children: [
                        {
                            name: "Will",
                            age: "230",
                            favoriteColor: "Green",
                            happy: false,
                            holiday: "2010-05-06",
                        },
                        {
                            name: "Scott",
                            age: "189",
                            favoriteColor: "Red",
                            happy: true,
                            holiday: "2009-01-01",
                        },
                        {
                            name: "Pops",
                            age: "200",
                            favoriteColor: "Purple",
                            happy: false,
                            holiday: null,
                        },
                    ],
                };

                deepStrictEqual(
                    await storeRecord({
                        client,
                        context,
                        tableName: "Family",
                        record: GOOD_RECORD_2,
                        user: USER,
                        form: "second record",
                        dateTime: makeTime(4),
                    }),
                    {
                        record: {
                            ...GOOD_RECORD_2,
                            recordVersion: 0,
                        },
                    }
                );

                deepStrictEqual(
                    await readRecord(
                        client,
                        context,
                        USER,
                        "Family",
                        RECORD_ID_2
                    ),
                    {
                        record: {
                            ...GOOD_RECORD_2,
                            recordVersion: 0,
                        },
                    }
                );

                deepStrictEqual(
                    await readRecord(
                        client,
                        context,
                        USER,
                        "Family",
                        RECORD_ID_1
                    ),
                    {
                        record: {
                            id: RECORD_ID_1,
                            recordVersion: 0,
                            mother: {
                                name: "Eve",
                                age: "0",
                                happy: true,
                                favoriteColor: "",
                                holiday: null,
                            },
                            father: {
                                name: "Adam",
                                age: "0",
                                happy: false,
                                favoriteColor: "",
                                holiday: null,
                            },
                            surname: "",
                            currentLocation: "",
                            children: [
                                {
                                    name: "Cain",
                                    age: "0",
                                    favoriteColor: "",
                                    happy: false,
                                    holiday: null,
                                },
                                {
                                    name: "Abel",
                                    age: "0",
                                    favoriteColor: "",
                                    happy: true,
                                    holiday: null,
                                },
                                {
                                    name: "Seth",
                                    age: "0",
                                    favoriteColor: "",
                                    happy: false,
                                    holiday: null,
                                },
                            ],
                        },
                    }
                );

                deepStrictEqual(
                    await storeRecord({
                        client,
                        context,
                        tableName: "Family",
                        record: {
                            ...GOOD_RECORD_2,
                            recordVersion: 0,
                            currentLocation: "utopia",
                        },
                        user: USER,
                        form: "update currentLocation to utopia",
                        dateTime: makeTime(5),
                    }),
                    {
                        record: {
                            ...GOOD_RECORD_2,
                            currentLocation: "utopia",
                            recordVersion: 1,
                        },
                    }
                );

                deepStrictEqual(
                    await readRecord(
                        client,
                        context,
                        USER,
                        "Family",
                        RECORD_ID_2
                    ),
                    {
                        record: {
                            ...GOOD_RECORD_2,
                            recordVersion: 1,
                            currentLocation: "utopia",
                        },
                    }
                );

                deepStrictEqual(
                    await storeRecord({
                        client,
                        context,
                        tableName: "Family",
                        record: {
                            ...GOOD_RECORD_2,
                            recordVersion: 0,
                            surname: "Washington",
                        },
                        user: USER,
                        form: "update surname",
                        dateTime: makeTime(6),
                    }),
                    {
                        record: {
                            ...GOOD_RECORD_2,
                            recordVersion: 2,
                            currentLocation: "utopia",
                            surname: "Washington",
                        },
                    }
                );

                deepStrictEqual(
                    await readRecord(
                        client,
                        context,
                        USER,
                        "Family",
                        RECORD_ID_2
                    ),
                    {
                        record: {
                            ...GOOD_RECORD_2,
                            recordVersion: 2,
                            currentLocation: "utopia",
                            surname: "Washington",
                        },
                    }
                );

                const MY_RECORD_1 = {
                    id: RECORD_ID_1,
                    recordVersion: 0,
                    mother: {
                        name: "Eve",
                        age: "0",
                        happy: true,
                        favoriteColor: "Black",
                        holiday: "1986-03-10",
                    },
                    father: {
                        name: "Adam",
                        age: "0",
                        happy: false,
                        favoriteColor: "",
                        holiday: "1984-12-01",
                    },
                    surname: "",
                    currentLocation: "",
                    children: [
                        {
                            name: "Cain",
                            age: "0",
                            favoriteColor: "Red",
                            happy: false,
                            holiday: null,
                        },
                        {
                            name: "Abel",
                            age: "0",
                            favoriteColor: "",
                            happy: true,
                            holiday: null,
                        },
                        {
                            name: "Seth",
                            age: "0",
                            favoriteColor: "Purple",
                            happy: false,
                            holiday: null,
                        },
                    ],
                };

                deepStrictEqual(
                    await storeRecord({
                        client,
                        context,
                        tableName: "Family",
                        record: {
                            ...MY_RECORD_1,
                            recordVersion: 0,
                        },
                        user: USER,
                        form: "update half of stuff",
                        dateTime: makeTime(10),
                    }),
                    {
                        record: {
                            ...MY_RECORD_1,
                            recordVersion: 1,
                        },
                    }
                );

                const MY_RECORD_2 = {
                    id: RECORD_ID_1,
                    recordVersion: 0,
                    mother: {
                        name: "Eve",
                        age: "0",
                        happy: true,
                        favoriteColor: "",
                        holiday: null,
                    },
                    father: {
                        name: "Adam",
                        age: "0",
                        happy: false,
                        favoriteColor: "Blue",
                        holiday: null,
                    },
                    surname: "",
                    currentLocation: "",
                    children: [
                        {
                            name: "Cain",
                            age: "0",
                            favoriteColor: "",
                            happy: false,
                            holiday: null,
                        },
                        {
                            name: "Abel",
                            age: "0",
                            favoriteColor: "Orange",
                            happy: true,
                            holiday: null,
                        },
                        {
                            name: "Seth",
                            age: "0",
                            favoriteColor: "",
                            happy: false,
                            holiday: null,
                        },
                    ],
                };

                const STORED_RECORD = {
                    id: RECORD_ID_1,
                    recordVersion: 2,
                    mother: {
                        name: "Eve",
                        age: "0",
                        happy: true,
                        favoriteColor: "Black",
                        holiday: "1986-03-10",
                    },
                    father: {
                        name: "Adam",
                        age: "0",
                        happy: false,
                        favoriteColor: "Blue",
                        holiday: "1984-12-01",
                    },
                    surname: "",
                    currentLocation: "",
                    children: [
                        {
                            name: "Cain",
                            age: "0",
                            happy: false,
                            favoriteColor: "Red",
                            holiday: null,
                        },
                        {
                            name: "Abel",
                            age: "0",
                            favoriteColor: "Orange",
                            happy: true,
                            holiday: null,
                        },
                        {
                            name: "Seth",
                            age: "0",
                            favoriteColor: "Purple",
                            happy: false,
                            holiday: null,
                        },
                    ],
                };

                deepStrictEqual(
                    await storeRecord({
                        client,
                        context,
                        tableName: "Family",
                        record: {
                            ...MY_RECORD_2,
                            recordVersion: 0,
                        },
                        user: USER,
                        form: "update other half",
                        dateTime: makeTime(11),
                    }),
                    {
                        record: STORED_RECORD,
                    }
                );

                deepStrictEqual(
                    await readRecord(
                        client,
                        context,
                        USER,
                        "Family",
                        RECORD_ID_1
                    ),
                    {
                        record: STORED_RECORD,
                    }
                );

                deepStrictEqual(
                    await storeRecord({
                        client,
                        context,
                        tableName: "Family",
                        record: STORED_RECORD,
                        user: USER,
                        form: "empty update",
                        dateTime: makeTime(12),
                    }),
                    {
                        record: {
                            ...STORED_RECORD,
                            recordVersion: 3,
                        },
                    }
                );
                /*
                deepStrictEqual(
                    await fetchHistory(
                        client,
                        context,
                        USER,
                        "Family",
                        RECORD_ID_1
                    ),
                    {
                        changes: [
                            {
                                changedTime: makeTime(0).toISOString(),
                                recordVersion: 0,
                                userId: USER_ID_1,
                                form: "store on first schema",
                                diff: {
                                    children: {
                                        _t: "a",
                                        0: [
                                            {
                                                happy: false,
                                                name: "Cain"
                                            }
                                        ],
                                        1: [
                                            {
                                                happy: true,
                                                name: "Abel"
                                            }
                                        ],
                                        2: [
                                            {
                                                happy: false,
                                                name: "Seth"
                                            }
                                        ]
                                    },
                                    father: {
                                        name: ["", "Adam"]
                                    },
                                    mother: {
                                        name: ["", "Eve"],
                                        happy: [false, true]
                                    }
                                }
                            },
                            {
                                changedTime: makeTime(10).toISOString(),
                                recordVersion: 1,
                                userId: USER_ID_1,
                                form: "update half of stuff",
                                diff: {
                                    children: {
                                        _t: "a",
                                        0: {
                                            favoriteColor: ["", "Red"]
                                        },
                                        2: {
                                            favoriteColor: ["", "Purple"]
                                        }
                                    },
                                    mother: {
                                        favoriteColor: ["", "Black"],
                                        holiday: [null, "1986-03-10"]
                                    },
                                    father: {
                                        holiday: [null, "1984-12-01"]
                                    }
                                }
                            },
                            {
                                changedTime: makeTime(11).toISOString(),
                                recordVersion: 2,
                                userId: USER_ID_1,
                                form: "update other half",
                                diff: {
                                    children: {
                                        _t: "a",
                                        1: {
                                            favoriteColor: ["", "Orange"]
                                        }
                                    },
                                    father: {
                                        favoriteColor: ["", "Blue"]
                                    }
                                }
                            },
                            {
                                changedTime: makeTime(12).toISOString(),
                                recordVersion: 3,
                                userId: USER_ID_1,
                                form: "empty update",
                                diff: null
                            }
                        ]
                    }
                );*/

                deepStrictEqual(
                    await queryTable({
                        client,
                        context,
                        user: USER,
                        tableName: "Family",
                        columns: ["mother.name", "surname"],
                        sorts: [],
                    }),
                    {
                        rows: [
                            ["George", "Washington"],
                            ["Eve", ""],
                        ],
                    }
                );

                deepStrictEqual(
                    await readRecords(client, context, USER, "Family"),
                    {
                        records: [
                            {
                                ...GOOD_RECORD_2,
                                recordVersion: 2,
                                currentLocation: "utopia",
                                surname: "Washington",
                            },
                            {
                                id: RECORD_ID_1,
                                recordVersion: 3,
                                mother: {
                                    name: "Eve",
                                    age: "0",
                                    happy: true,
                                    favoriteColor: "Black",
                                    holiday: "1986-03-10",
                                },
                                father: {
                                    name: "Adam",
                                    age: "0",
                                    happy: false,
                                    favoriteColor: "Blue",
                                    holiday: "1984-12-01",
                                },
                                surname: "",
                                currentLocation: "",
                                children: [
                                    {
                                        name: "Cain",
                                        age: "0",
                                        happy: false,
                                        favoriteColor: "Red",
                                        holiday: null,
                                    },
                                    {
                                        name: "Abel",
                                        age: "0",
                                        favoriteColor: "Orange",
                                        happy: true,
                                        holiday: null,
                                    },
                                    {
                                        name: "Seth",
                                        age: "0",
                                        favoriteColor: "Purple",
                                        happy: false,
                                        holiday: null,
                                    },
                                ],
                            },
                        ],
                    }
                );
            }
        );
    }).timeout(5 * 60 * 1000);
});
