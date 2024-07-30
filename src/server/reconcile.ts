import parseDate from "date-fns/parse";
import { find, snakeCase } from "lodash";
import * as nunjucks from "nunjucks";
import pg from "pg";
import { plural } from "pluralize";
import { TABLES_META } from "../app/tables";
import { Dictionary } from "../clay/common";
import { databasePool } from "../clay/server/databasePool";
import { ServerError } from "../clay/server/error";
import patchRecord from "../clay/server/patchRecord";
import queryTable from "../clay/server/queryTable";
import { insert, rstr, select, str } from "../clay/server/squel";
import storeRecord from "../clay/server/storeRecord";
import { genUUID } from "../clay/uuid";
import { updateAzure } from "./azure-reconcile";
import { generateDocument } from "./print";
import { ROOT_USER } from "./root-user";
import { maintain } from "./sqlite";
const htmlToFormattedText = require("html-to-formatted-text");
nunjucks.configure("templates", { autoescape: true });
const USER_ID = "c7d4d727-276d-43b0-8449-8c13d905887b";

async function main() {
    const { pool, context } = await databasePool;

    const client = await pool.connect();
    try {
        await updateAzure(client);

        for (const [name, table] of Object.entries(TABLES_META)) {
            if (name === "ProjectStatusChange") {
                continue;
            }
            let fields: { name: string; dataTypeID: number }[] = [];
            try {
                const result = await client.query(
                    "select * from dropsheet_views." +
                        plural(snakeCase(name)) +
                        " limit 0"
                );
                fields = result.fields.map((field) => ({
                    name: field.name,
                    dataTypeID: field.dataTypeID,
                }));
            } catch (error) {
                if (
                    !(error instanceof pg.DatabaseError) ||
                    error.code !== "42P01"
                ) {
                    throw error;
                }
            }

            const allColumns = context.columns[name];
            const defs: Map<string, string> = new Map();
            for (const [columnName, column] of Object.entries(
                allColumns.inner()
            )) {
                if (
                    !column.subkeyType &&
                    !columnName.startsWith("_") &&
                    columnName.indexOf(".") === -1 &&
                    ["null", "activeEditors", "true", ""].indexOf(
                        columnName
                    ) === -1
                ) {
                    //} && columnName.indexOf("@") !== -1 && columnName != "null" && columnName != "activeEditors" && columnName != "") {
                    defs.set(
                        snakeCase(columnName),
                        "(" +
                            column.expression({}).toString() +
                            ") as " +
                            snakeCase(columnName)
                    );
                }
            }

            const parts: string[] = [];
            for (const field of fields) {
                const defn = defs.get(field.name);
                if (!defn) {
                    switch (field.dataTypeID) {
                        case 2951:
                            parts.push("null::uuid[] as " + field.name);
                            break;
                        case 16:
                            parts.push("false as " + field.name);
                            break;
                        case 1082:
                            parts.push("null::date as " + field.name);
                            break;
                        case 1184:
                            parts.push("null::timestamptz as " + field.name);
                            break;
                        case 25:
                            parts.push("null::text as " + field.name);
                            break;
                        default:
                            throw new Error(
                                field.name + ":" + field.dataTypeID
                            );
                    }
                } else {
                    parts.push(defn);
                    defs.delete(field.name);
                }
            }
            for (const defn of Array.from(defs.values())) {
                parts.push(defn);
            }

            const query =
                "create or replace view dropsheet_views." +
                plural(snakeCase(name)) +
                " as select " +
                parts.join(",") +
                " from " +
                plural(snakeCase(name));
            await client.query(query);
        }

        await client.query(`CREATE OR replace VIEW dropsheet_views.project_status_changes AS
SELECT    project_status_changes.id,
          project_status_changes.record_version,
          project_status_changes.project,
          project_status_changes.status,
          least(project_status_changes.DATE,
          CASE
                    WHEN project_status_changes.status = 'Completed' THEN (projects.completion).DATE
                    ELSE least(projects.final_invoice_date, (projects.completion).date)
          END - make_interval(secs =>
                              (
                                     SELECT count(*)
                                     FROM   project_status_changes x
                                     WHERE  x.project = project_status_changes.project
                                     AND    x.DATE > project_status_changes.DATE ))) AS DATE,
          project_status_changes.USER,
          project_status_changes.DATE AS recorded_date
FROM      project_status_changes
left join projects
ON        (
                    projects.id = project)`);

        console.log("Updating first quotation dates");

        const query = await client.query(
            select()
                .from(
                    select()
                        .from("projects")
                        .field("id")
                        .field(
                            select()
                                .from("quotations")
                                .where("quotations.project = projects.id")
                                .where("date is not null")
                                .field(str("min(date)")),
                            "date"
                        )
                        .where("first_quotation_date is null"),
                    "data"
                )
                .where("date is not null")
                .toParam()
        );

        for (const row of query.rows) {
            console.log("Updating " + row.id);
            await patchRecord({
                client,
                context,
                tableName: "Project",
                id: row.id,
                user: {
                    id: USER_ID,
                    email: "winstone@remdal.com",
                    permissions: ["Project-write", "Project-read"],
                },
                form: "Reconcilation",
                dateTime: new Date(),
                override: false,
                patches: [
                    {
                        firstQuotationDate: [null, row.date.toISOString()],
                    },
                ],
                patchIds: [genUUID()],
            });
        }
        /*
        console.log("Redoing commissions");
        {
            const query = await client.query(
                select()
                    .from("payouts")
                    .field("id")
                    .where(
                        "array_length(managers, 1) > 0 or array_length(estimators, 1) > 0"
                    )
                    .toParam()
            );

            for (const { id } of query.rows) {
                const payout: PayoutJSON = (
                    await readRecord(
                        client,
                        context,
                        {
                            id: USER_ID,
                            email: "winstone@remdal.com",
                            permissions: ["Payout-read"],
                        },
                        "Payout",
                        id,
                        true
                    )
                ).record as any;

                const parsedPayout = JSONToPayout(payout);
                let optionsTotal = sumMap(
                    parsedPayout.options,
                    calcPayoutOptionAmount
                );

                const updatedPayout: PayoutJSON = {
                    ...payout,
                    managers: [],
                    estimators: [],
                    commissions: [
                        ...payout.estimators.map((entry) => ({
                            ...entry,
                            role: ROLE_ESTIMATOR,
                            rolePercentage: "0.35",
                        })),
                        ...payout.managers.map((entry) => ({
                            ...entry,
                            role: ROLE_PROJECT_MANAGER,
                            rolePercentage: "0.65",
                            portionPercentage: sumMap(
                                parsedPayout.options.filter(
                                    (option) => option.manager === entry.user
                                ),
                                calcPayoutOptionAmount
                            )
                                .dividedBy(optionsTotal)
                                .toString(),
                        })),
                    ],
                };

                await storeRecord({
                    client,
                    context,
                    tableName: "Payout",
                    user: {
                        id: USER_ID,
                        email: "winstone@remdal.com",
                        permissions: ["Payout-write", "Payout-read"],
                    },
                    form: "Database Upgrade",
                    dateTime: new Date(),
                    record: updatedPayout,
                });
            }
        }*/
        console.log("Update completion dates");
        {
            const result = await queryTable({
                client,
                context,
                tableName: "Payout",
                columns: ["project", "date", "project.completion.date"],
                filters: [
                    {
                        column: "isComplete",
                        filter: {
                            equal: true,
                        },
                    },
                    {
                        column: "date",
                        filter: {
                            not_equal: null,
                        },
                    },
                    {
                        column: "project.id",
                        filter: {
                            not_equal: null,
                        },
                    },
                ],
                sorts: ["date"],
                user: ROOT_USER,
            });

            const projects: Dictionary<[string, string]> = {};

            for (const row of result.rows) {
                const [projectId, date, completionDate] = row as [
                    string,
                    string,
                    string
                ];
                projects[projectId] = [date, completionDate];
            }

            for (const [projectId, [date, completionDate]] of Object.entries(
                projects
            )) {
                if (completionDate != date) {
                    await patchRecord({
                        client,
                        context,
                        tableName: "Project",
                        id: projectId as string,
                        user: ROOT_USER,
                        form: "Reconcilation",
                        dateTime: new Date(),
                        override: false,
                        patches: [
                            {
                                completion: {
                                    date: [completionDate, date],
                                },
                            },
                        ],
                        patchIds: [genUUID()],
                    });
                }
            }
        }
        console.log("Update final invoice dates");
        {
            const result = await queryTable({
                client,
                context,
                tableName: "Invoice",
                columns: ["project", "date", "project.finalInvoiceDate"],
                filters: [
                    {
                        column: "isComplete",
                        filter: {
                            equal: true,
                        },
                    },
                    {
                        column: "date",
                        filter: {
                            not_equal: null,
                        },
                    },
                    {
                        column: "project.id",
                        filter: {
                            not_equal: null,
                        },
                    },
                ],
                sorts: ["date"],
                user: {
                    id: USER_ID,
                    email: "winstone@remdal.com",
                    permissions: ["Invoice-read"],
                },
            });

            const projects: Dictionary<[string, string]> = {};

            for (const row of result.rows) {
                const [projectId, date, finalInvoiceDate] = row as [
                    string,
                    string,
                    string
                ];
                projects[projectId] = [date, finalInvoiceDate];
            }

            for (const [projectId, [date, finalInvoiceDate]] of Object.entries(
                projects
            )) {
                if (finalInvoiceDate != date) {
                    await patchRecord({
                        client,
                        context,
                        tableName: "Project",
                        id: projectId as string,
                        user: {
                            id: USER_ID,
                            email: "winstone@remdal.com",
                            permissions: ["Project-write", "Project-read"],
                        },
                        form: "Reconcilation",
                        dateTime: new Date(),
                        override: false,
                        patches: [
                            {
                                finalInvoiceDate: [finalInvoiceDate, date],
                            },
                        ],
                        patchIds: [genUUID()],
                    });
                }
            }
        }
        console.log("Final without invoice");
        {
            const result = await queryTable({
                client,
                context,
                tableName: "Project",
                columns: ["id", "finalInvoiceDate", "implFinalInvoiceDate"],
                filters: [
                    {
                        column: "finalInvoiceDate",
                        filter: {
                            not_equal: null,
                        },
                    },
                    {
                        column: "implFinalInvoiceDate",
                        filter: {
                            equal: null,
                        },
                    },
                ],
                sorts: [],
                user: {
                    id: USER_ID,
                    email: "winstone@remdal.com",
                    permissions: ["Project-read"],
                },
            });

            for (const row of result.rows) {
                const [id, date, correct_data] = row as [string, string, null];

                await patchRecord({
                    client,
                    context,
                    tableName: "Project",
                    id: id,
                    user: {
                        id: USER_ID,
                        email: "winstone@remdal.com",
                        permissions: ["Project-write", "Project-read"],
                    },
                    form: "Reconcilation",
                    dateTime: new Date(),
                    override: false,
                    patches: [
                        {
                            finalInvoiceDate: [date, correct_data],
                        },
                    ],
                    patchIds: [genUUID()],
                });
            }
        }

        console.log("Move added dates for invoices");
        {
            const result = await queryTable({
                client,
                context,
                tableName: "Invoice",
                columns: [
                    "id",
                    "addedToAccountingSoftwareDate",
                    "addedToAccountingSoftwareUser",
                ],
                filters: [
                    {
                        column: "addedToAccountingSoftwareDate",
                        filter: {
                            not_equal: null,
                        },
                    },
                ],
                sorts: [],
                user: ROOT_USER,
            });

            for (const row of result.rows) {
                const [projectId, date, user] = row as [
                    string,
                    string | null,
                    string
                ];

                await patchRecord({
                    client,
                    context,
                    tableName: "Invoice",
                    id: projectId as string,
                    user: ROOT_USER,
                    form: "Reconcilation",
                    dateTime: new Date(),
                    override: false,
                    patches: [
                        {
                            addedToAccountingSoftwareDate: [date, null],
                            addedToAccountingSoftwareUser: [user, null],
                            addedToAccountingSoftware: {
                                user: [null, user],
                                date: [null, date],
                            },
                        },
                    ],
                    patchIds: [genUUID()],
                });
            }
        }
        console.log("Move added dates for payouts");
        {
            const result = await queryTable({
                client,
                context,
                tableName: "Payout",
                columns: [
                    "id",
                    "addedToAccountingSoftwareDate",
                    "addedToAccountingSoftwareUser",
                ],
                filters: [
                    {
                        column: "addedToAccountingSoftwareDate",
                        filter: {
                            not_equal: null,
                        },
                    },
                ],
                sorts: [],
                user: ROOT_USER,
            });

            for (const row of result.rows) {
                const [projectId, date, user] = row as [
                    string,
                    string | null,
                    string
                ];

                await patchRecord({
                    client,
                    context,
                    tableName: "Payout",
                    id: projectId as string,
                    user: ROOT_USER,
                    form: "Reconcilation",
                    dateTime: new Date(),
                    override: false,
                    patches: [
                        {
                            addedToAccountingSoftwareDate: [date, null],
                            addedToAccountingSoftwareUser: [user, null],
                            addedToAccountingSoftware: {
                                user: [null, user],
                                date: [null, date],
                            },
                        },
                    ],
                    patchIds: [genUUID()],
                });
            }
        }
        console.log("Move added dates on projects");
        {
            const result = await queryTable({
                client,
                context,
                tableName: "Project",
                columns: [
                    "id",
                    "addedToAccountingSoftwareDate",
                    "addedToAccountingSoftwareUser",
                ],
                filters: [
                    {
                        column: "addedToAccountingSoftwareDate",
                        filter: {
                            not_equal: null,
                        },
                    },
                ],
                sorts: ["projectNumber"],
                user: {
                    id: USER_ID,
                    email: "winstone@remdal.com",
                    permissions: ["Project-read"],
                },
            });

            for (const row of result.rows) {
                const [projectId, date, user] = row as [
                    string,
                    string | null,
                    string
                ];

                await patchRecord({
                    client,
                    context,
                    tableName: "Project",
                    id: projectId as string,
                    user: {
                        id: USER_ID,
                        email: "winstone@remdal.com",
                        permissions: ["Project-write", "Project-read"],
                    },
                    form: "Reconcilation",
                    dateTime: new Date(),
                    override: false,
                    patches: [
                        {
                            addedToAccountingSoftwareDate: [date, null],
                            addedToAccountingSoftwareUser: [user, null],
                            addedToAccountingSoftware: {
                                user: [null, user],
                                date: [null, date],
                            },
                        },
                    ],
                    patchIds: [genUUID()],
                });
            }
        }
        console.log("Fix estimate date");
        {
            const result = await client.query(
                select()
                    .from("estimates")
                    .where("(estimates).common.creation_date is null")
                    .where("record_version != 0")
                    .field("id")
                    .field(str("(estimates).common.name"), "name")
                    .toParam()
            );

            for (const row of result.rows) {
                const parsedDate = parseDate(
                    row.name,
                    "dd/MM/yyyy - h:mm bb",
                    new Date()
                );
                if (!isNaN(parsedDate.getTime())) {
                    await patchRecord({
                        client,
                        context,
                        tableName: "Estimate",
                        id: row.id,
                        user: {
                            id: USER_ID,
                            email: "winstone@remdal.com",
                            permissions: ["Estimate-write", "Estimate-read"],
                        },
                        form: "Reconcilation",
                        dateTime: new Date(),
                        override: false,
                        patches: [
                            {
                                common: {
                                    creationDate: [
                                        null,
                                        parsedDate.toISOString(),
                                    ],
                                },
                            },
                        ],
                        patchIds: [genUUID()],
                    });
                }
            }
        }

        console.log("Update estimate date");
        {
            const result = await client.query(
                select()
                    .from(
                        select()
                            .from("projects")
                            .field("id")
                            .field(
                                select()
                                    .from("estimates")
                                    .where(
                                        "(estimates.common).project = projects.id"
                                    )
                                    .where("(common).creation_date is not null")
                                    .field(str("min((common).creation_date)")),
                                "date"
                            )
                            .where("estimate_date is null")
                            .where("record_version != 0"),
                        "data"
                    )
                    .where("date is not null")
                    .toParam()
            );

            for (const row of result.rows) {
                await patchRecord({
                    client,
                    context,
                    tableName: "Project",
                    id: row.id,
                    user: {
                        id: USER_ID,
                        email: "winstone@remdal.com",
                        permissions: ["Project-write", "Project-read"],
                    },
                    form: "Reconcilation",
                    dateTime: new Date(),
                    override: false,
                    patches: [
                        {
                            estimateDate: [null, row.date.toISOString()],
                        },
                    ],
                    patchIds: [genUUID()],
                });
            }
        }
        console.log("Last Quotation");
        {
            const query = select()
                .from("projects")
                .field("project_number")
                .field("projects.id")
                .field("last_quotation")
                .field("project_quotations.id", "true_last_quotation")
                .left_join(
                    "quotations",
                    "project_quotations",
                    "project_quotations.id = (select id from quotations where quotations.project = projects.id and not quotations.change and not quotations.superceded and quotations.date is not null order by number desc limit 1)"
                )
                .where("last_quotation is distinct from project_quotations.id")
                .order("project_number");

            const result = await client.query(query.toParam());

            for (const row of result.rows) {
                await patchRecord({
                    client,
                    context,
                    tableName: "Project",
                    id: row.id,
                    user: {
                        id: USER_ID,
                        email: "winstone@remdal.com",
                        permissions: ["Project-write", "Project-read"],
                    },
                    form: "Reconcilation",
                    dateTime: new Date(),
                    override: false,
                    patches: [
                        {
                            lastQuotation: [
                                row.last_quotation,
                                row.true_last_quotation,
                            ],
                        },
                    ],
                    patchIds: [genUUID()],
                });
            }
        }
        console.log("Company history");
        {
            const query = select()
                .from("contacts")
                .field("id")
                .field("company")
                .where("array_length(company_history, 1) is null")
                .where("company is not null");

            const result = await client.query(query.toParam());

            for (const row of result.rows) {
                console.log(row);
                await patchRecord({
                    client,
                    context,
                    tableName: "Contact",
                    id: row.id,
                    user: ROOT_USER,
                    form: "Reconcilation",
                    dateTime: new Date(),
                    override: false,
                    patches: [
                        {
                            companyHistory: [
                                [],
                                [
                                    {
                                        user: null,
                                        date: null,
                                        company: row.company,
                                    },
                                ],
                            ],
                        },
                    ],
                    patchIds: [genUUID()],
                });
            }
        }

        {
            const query = select()
                .from("completion_surveys")
                .field("id")
                .field(
                    str(
                        "select project_number from projects where id = completion_surveys.project"
                    ),
                    "project_number"
                )
                .where("not sent")
                .where("extract(epoch from age(date)) > 14");

            const result = await client.query(query.toParam());

            for (const row of result.rows) {
                await generateDocument(
                    pool,
                    context,
                    ROOT_USER,
                    "completionSurvey",
                    [row.id],
                    false
                );

                await patchRecord({
                    client,
                    context,
                    tableName: "CompletionSurvey",
                    id: row.id,
                    user: ROOT_USER,
                    form: "Reconcilation",
                    dateTime: new Date(),
                    override: false,
                    patches: [
                        {
                            sent: [false, true],
                        },
                    ],
                    patchIds: [genUUID()],
                });
            }
        }
        console.log("update quotation late record");
        {
            const result = await queryTable({
                client,
                context,
                tableName: "Project",
                columns: ["id", "quotationRecordedLate"],
                filters: [
                    {
                        column: "lateQuotationMismatch",
                        filter: {
                            equal: true,
                        },
                    },
                ],
                sorts: [],
                user: ROOT_USER,
            });

            for (const row of result.rows) {
                console.log("R", row);
                await storeRecord({
                    client,
                    context,
                    tableName: "QuotationLateRecord",
                    user: ROOT_USER,
                    form: "reconciliation",
                    dateTime: new Date(),
                    record: {
                        id: genUUID(),
                        recordVersion: null,
                        project: row[0],
                        addedDateTime: null,
                        late: !row[1],
                    },
                });
                await patchRecord({
                    client,
                    context,
                    tableName: "Project",
                    id: row[0] as string,
                    dateTime: new Date(),
                    form: "reconciliation",
                    patches: [
                        {
                            quotationRecordedLate: [row[1] as boolean, !row[1]],
                        },
                    ],
                    patchIds: [genUUID()],
                    override: false,
                    user: ROOT_USER,
                });
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
        await client.release();
    }

    console.log("serials");

    for (const [name, meta] of Object.entries(TABLES_META)) {
        const serial = find(
            Object.entries(meta.fields),
            ([_, field]) => field.type === "serial"
        );
        if (serial) {
            console.log(name, serial);
            const table = plural(snakeCase(name));
            const query = select()
                .from(table, "main")
                .field("id")
                .field(snakeCase(serial[0]), "serial")
                .order(snakeCase(serial[0]))
                .where(
                    "not exists(select 1 from record_history where record_history.id = main.id and record_history.tablename = ? and record_history.version = -1)",
                    name
                )
                .limit(100);

            const { rows } = await client.query(query.toParam());

            for (const row of rows) {
                await client.query(
                    insert()
                        .into("record_history")
                        .setFields({
                            id: row.id,
                            tablename: name,
                            version: -1,
                            user_id: null,
                            changed_time: new Date().toISOString(),
                            diff: JSON.stringify({
                                [serial[0]]: [null, row.serial],
                            }),
                        })
                        .toParam()
                );
            }
        }
    }
    console.log("project stage journal");
    {
        const { rows } = await client.query(
            select()
                .from(rstr("dropsheet_views.projects"))
                .where(
                    "stage != ?",
                    select()
                        .field("status")
                        .from("project_status_changes")
                        .where("project = projects.id")
                        .order("date", false)
                        .limit(1)
                )
                .field("id")
                .field("stage")
                .toParam()
        );
        for (const row of rows) {
            await pool.query(
                'INSERT INTO project_status_changes (id, record_version, project,status,date,"user", recorded_date) VALUES ($1, 0, $2, $3, $4, $5, null)',
                [genUUID(), row.id, row.stage, new Date(), null]
            );
        }

        console.log(rows);
    }

    console.log("local database update");

    maintain();
    /*
    console.log("sharepoint folders")

    {
            const result = await queryTable({
                client,
                context,
                tableName: "Project",
                columns: ["id", "projectNumber", "sharepointFolderSuffix", "idealSharepointFolderSuffix"],
                filters: [
                    {
                        column: "incorrectSharepointFolderSuffix",
                        filter: {
                            equal: true,
                        },
                    },
                ],
                sorts: ["projectNumber"],
                user: {
                    id: USER_ID,
                    email: "winstone@remdal.com",
                    permissions: ["Project-read"],
                },
            });

            const sharepoint = await getSharepoint()

            for (const row of result.rows) {
                const [id, number, current, target] = row as [string, string, string, string]

                await sharepoint.renameFolder(
                    resolveFullPath(resolveProjectPath(number, current)),
                    resolveFullPath(resolveProjectPath(number, target)),
                )

                await patchRecord({
                    client,
                    context,
                    tableName: "Project",
                    id: id,
                    user: ROOT_USER,
                    form: "Reconcilation",
                    dateTime: new Date(),
                    override: false,
                    patches: [
                        {
                            sharepointFolderSuffix: [current, target]
                        },
                    ],
                    patchIds: [genUUID()],
                });

                console.log(id, number, current, target)
            }

        }
        */
}
main()
    .then(() => {
        console.log("Finished");
        process.exit(0);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
