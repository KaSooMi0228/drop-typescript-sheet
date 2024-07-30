import { config } from "dotenv";
import { chunk, find, isEqual } from "lodash";
import { ClientBase, Pool } from "pg";
import { ProjectPersonnelJSON } from "../app/project/personnel/table";
import { ROLE_ESTIMATOR } from "../app/user/table";
import { FilterDetail } from "../clay/server/api";
import { Context } from "../clay/server/context";
import { databasePool } from "../clay/server/databasePool";
import deleteRecord from "../clay/server/deleteRecord";
import { ServerError } from "../clay/server/error";
import patchRecord from "../clay/server/patchRecord";
import queryTable from "../clay/server/queryTable";
import readRecord from "../clay/server/readRecord";
import storeRecord from "../clay/server/storeRecord";
import { genUUID, uuid5 } from "../clay/uuid";
import { ROOT_USER } from "./root-user";
import { acquireProjectFolder, getSharepoint } from "./sharepoint";

import progress from "cli-progress";
import Decimal from "decimal.js";
import { diff } from "jsondiffpatch";
import { EstimateJSON } from "../app/estimate/table";
import { InvoiceJSON } from "../app/invoice/table";
import {
  CustomerSurveyJSON,
  CustomerSurveyTemplateJSON,
} from "../app/project/customer-survey/table";
import {
  calcProjectStage,
  JSONToProject,
  repairProjectJSON,
} from "../app/project/table";
import { QuotationJSON, RoleWithPercentageJSON } from "../app/quotation/table";
import { TABLES_META } from "../app/tables";
import {
  WarrantyReviewToJSON,
  WARRANTY_REVIEW_META,
} from "../app/warranty-review/table";
import { JSONToWarrantyLength } from "../app/warranty/table";
import { LocalDate } from "../clay/LocalDate";
import { Meta } from "../clay/meta";
import { applyPatch } from "../clay/patch";
import { select, str, update } from "../clay/server/squel";
import { reapplyDesigns, transferDocuments } from "./new-sharepoint";

function extendDate(text: string | null) {
  if (text === null) {
    return null;
  } else {
    return new Date(text).toISOString();
  }
}

class DataFixApi {
  pool: Pool;
  context: Context;

  constructor(pool: Pool, context: Context) {
    this.pool = pool;
    this.context = context;
  }

  async withClient<T>(f: (client: ClientBase) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      return await f(client);
    } finally {
      client.release();
    }
  }

  async queryTable(props: {
    tableName: string;
    columns: string[];
    filters?: FilterDetail[];
    sorts?: string[];
  }) {
    return (
      await this.withClient((client) =>
        queryTable({
          client,
          context: this.context,
          ...props,
          user: ROOT_USER,
          sorts: props.sorts || [],
        })
      )
    ).rows;
  }

  async deleteRecord(tableName: string, id: string) {
    return await this.withClient((client) =>
      deleteRecord({
        client,
        context: this.context,
        user: ROOT_USER,
        tableName,
        id,
        dateTime: new Date(),
        form: "data-fix",
      })
    );
  }

  async patchRecord(tableName: string, id: string, patch: any) {
    return await this.withClient((client) =>
      patchRecord({
        client,
        context: this.context,
        user: ROOT_USER,
        tableName,
        id,
        dateTime: new Date(),
        form: "data-fix",
        patches: [patch],
        patchIds: [genUUID()],
        override: false,
      })
    );
  }

  async storeRecord(tableName: string, record: any) {
    return await this.withClient((client) =>
      storeRecord({
        client,
        context: this.context,
        user: ROOT_USER,
        tableName,
        dateTime: new Date(),
        form: "data-fix",
        record,
      })
    );
  }

  async readRecord(tableName: string, record: string): Promise<any> {
    return (
      await this.withClient((client) =>
        readRecord(client, this.context, ROOT_USER, tableName, record)
      )
    ).record;
  }
}

async function doDataFix(f: (api: DataFixApi) => Promise<void>) {
  config();
  const { pool, context } = await databasePool;
  const api = new DataFixApi(pool, context);
  try {
    await f(api);
  } catch (error) {
    if (error instanceof ServerError) {
      console.error(JSON.stringify(error.detail));
    } else {
      throw error;
    }
  }
}

async function clearOrphans(api: DataFixApi) {
  for (const tableName of [
    "SiteVisitReport",
    "Invoice",
    "Quotation",
    "Payout",
  ]) {
    for (const row of await api.queryTable({
      tableName,
      columns: ["id"],
      filters: [
        {
          column: "project.id",
          filter: {
            equal: null,
          },
        },
      ],
    })) {
      const [id] = row as [string];

      await api.deleteRecord(tableName, id);
    }
  }
}

async function fillInQuotedBy(api: DataFixApi) {
  for (const row of await api.queryTable({
    tableName: "Quotation",
    columns: ["id", "quotedBy", "project.personnel"],
  })) {
    const [id, quotedBy, personnel] = row as [
      string,
      string[],
      ProjectPersonnelJSON[]
    ];

    if (quotedBy.length === 0 && personnel) {
      await api.patchRecord("Quotation", id, {
        quotedBy: [
          [],
          personnel
            .filter((entry) => entry.role === ROLE_ESTIMATOR)
            .map((entry) => entry.user),
        ],
      });
    }
  }
}
/*
async function correctHazmatQuoteDates(api: DataFixApi) {
    const data = [
        {
            "Project Number": "45442",
            "Quotation Date": "2021/05/20",
            "Contract Award": "1680.12",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "45439",
            "Quotation Date": "2021/05/19",
            "Contract Award": "875.12",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "45356",
            "Quotation Date": "2021/03/22",
            "Contract Award": "1970.15",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "45324",
            "Quotation Date": "2021/04/18",
            "Contract Award": "4694.12",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "45257",
            "Quotation Date": "2021/04/11",
            "Contract Award": "1921.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "45208",
            "Quotation Date": "2021/03/09",
            "Contract Award": "1100.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "45163",
            "Quotation Date": "2021/02/23",
            "Contract Award": "3614.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "45161",
            "Quotation Date": "2021/02/23",
            "Contract Award": "1380.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "45143",
            "Quotation Date": "2021/02/18",
            "Contract Award": "2428.52",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "45133",
            "Quotation Date": "2021/02/12",
            "Contract Award": "9405.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "45116",
            "Quotation Date": "2021/02/07",
            "Contract Award": "1290.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "45110",
            "Quotation Date": "2021/02/03",
            "Contract Award": "3912.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "45109",
            "Quotation Date": "2021/02/03",
            "Contract Award": "1380.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "45075",
            "Quotation Date": "2021/01/23",
            "Contract Award": "3390.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "45003",
            "Quotation Date": "2021/01/05",
            "Contract Award": "5804.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "45000",
            "Quotation Date": "2021/01/05",
            "Contract Award": "3860.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44893",
            "Quotation Date": "2020/12/06",
            "Contract Award": "24124.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44872",
            "Quotation Date": "2020/11/17",
            "Contract Award": "800.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44762",
            "Quotation Date": "2020/10/13",
            "Contract Award": "680.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44761",
            "Quotation Date": "2020/10/13",
            "Contract Award": "1274.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44742",
            "Quotation Date": "2020/10/20",
            "Contract Award": "19440.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44741",
            "Quotation Date": "2020/10/20",
            "Contract Award": "21056.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44740",
            "Quotation Date": "2020/10/13",
            "Contract Award": "1422.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44739",
            "Quotation Date": "2020/10/13",
            "Contract Award": "1420.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44737",
            "Quotation Date": "2020/10/08",
            "Contract Award": "664.02",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44732",
            "Quotation Date": "2020/10/08",
            "Contract Award": "4352.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44729",
            "Quotation Date": "2020/10/08",
            "Contract Award": "20570.00",
            "Project Description": "Bio-hazard abatement",
        },
        {
            "Project Number": "44709",
            "Quotation Date": "2021/03/03",
            "Contract Award": "902.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44665",
            "Quotation Date": "2020/09/14",
            "Contract Award": "2600.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44656",
            "Quotation Date": "2020/09/10",
            "Contract Award": "2600.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44653",
            "Quotation Date": "2020/09/20",
            "Contract Award": "2600.00",
            "Project Description": "Mould abatement",
        },
        {
            "Project Number": "44600",
            "Quotation Date": "2020/08/19",
            "Contract Award": "520.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44599",
            "Quotation Date": "2020/08/30",
            "Contract Award": "1000.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44578",
            "Quotation Date": "2020/08/11",
            "Contract Award": "1100.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44569",
            "Quotation Date": "2020/08/20",
            "Contract Award": "15853.83",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44564",
            "Quotation Date": "2020/08/05",
            "Contract Award": "2800.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "44420",
            "Quotation Date": "2020/06/08",
            "Contract Award": "20000.00",
            "Project Description": "Mould abatement",
        },
        {
            "Project Number": "44313",
            "Quotation Date": "2020/04/28",
            "Contract Award": "520.00",
            "Project Description": "Mould abatement",
        },
        {
            "Project Number": "44128",
            "Quotation Date": "2020/02/27",
            "Contract Award": "1800.00",
            "Project Description": "Asbestos abatement",
        },
        {
            "Project Number": "43970",
            "Quotation Date": "2020/01/01",
            "Contract Award": "7500.00",
            "Project Description": "Asbestos abatement",
        },
    ];

    function codeFor(item: string): string {
        switch (item) {
            case "Asbestos abatement":
                return "bceb40fb-cbee-4cbe-9b4c-a1b4b6b4c1e0";
            case "Bio-hazard abatement":
                return "a649f2a9-567c-4567-8e7b-3ce774288f09";
            case "Mould abatement":
                return "561ce74e-1b4e-41b4-97a4-b97a66625754";
            default:
                throw new Error("unknown " + item);
        }
    }

    for (const entry of data) {
        const number = entry["Project Number"];
        const amount = entry["Contract Award"];
        const date = entry["Quotation Date"];
        const description = codeFor(entry["Project Description"]);

        const row = await api.queryTable({
            tableName: "Project",
            columns: ["id"],
            filters: [
                {
                    column: "projectNumber",
                    filter: {
                        equal: number,
                    },
                },
            ],
        });

        if (row.length !== 1) {
            throw new Error("Sadness");
        }
        const id = row[0][0] as string;

        const quotation: QuotationJSON = {
            id: uuid5("hazmart-quote-create-" + number),
            recordVersion: null,
            addedDateTime: null,
            modifiedDateTime: null,
            user: null,
            project: id,
            estimates: [],
            scopeOfWork: [],
            contractNotes: [],
            projectSpotlightItems: [],
            options: [
                {
                    id: uuid5("hazmart-quote-create-" + number + "-option"),
                    name: "Imported",
                    description: "Imported",
                    areas: [],
                    actions: [],
                    hiddenActions: [],
                    allowances: [],
                    schedules: [],
                    adjustment: "0",
                    includedInExpectedContractValue: true,
                    projectDescription: {
                        category: "6e952d96-fa6c-4fa6-87c0-5c7cc65c49a4",
                        description,
                        custom: "",
                    },
                    details: {
                        areas: [],
                        actions: [],
                        allowances: [
                            {
                                id: genUUID(),
                                name: "Import",
                                cost: amount as string,
                                price: amount as string,
                            },
                        ],
                        finishSchedule: [],
                        schedules: [],
                        total: amount as string,
                        actionPriceTotal: amount as string,
                        allowancePriceTotal: amount as string,
                    },
                },
            ],
            quotationType: null,
            addressedContacts: [],
            date: extendDate(date as string),
            quoteFollowUpDate: null,
            number: "1",
            generated: true,
            projectDescription: {
                category: "6e952d96-fa6c-4fa6-87c0-5c7cc65c49a4",
                description,
                custom: "",
            },
            dividedProjectDescription: false,
            change: false,
            initialized: true,
            superceded: false,
            quotedBy: [],
        };

        await api.storeRecord("Quotation", quotation);
    }
}

async function jobNameToTags(api: DataFixApi) {
    for (const row of await api.queryTable({
        tableName: "Project",
        columns: ["id", "name", "tags", "siteAddress"],
        filters: [
            {
                column: "name",
                filter: {
                    not_equal: "",
                },
            },
        ],
    })) {
        const [id, name, tags, siteAddress] = row as [
            string,
            string,
            string[],
            AddressJSON
        ];
        if (name !== siteAddress.line1) {
            if (tags.length == 0) {
                await api.patchRecord("Project", id, {
                    tags: {
                        _t: "a",
                        append: name,
                    },
                });
            }
        }
    }
}

async function fixProjectStages(api: DataFixApi) {
    const projectNumbers = [
        43785, 44699, 45019, 45006, 45146, 45030, 45027, 45174, 45324, 45247,
        45396, 44092, 44453, 45152, 44837, 45202, 45018, 45332, 44722, 44027,
        43174, 45411, 43522, 45266, 45387, 45071, 44664, 42704, 45259, 44812,
        45449, 44088, 44949, 45210, 45559, 44893, 45324, 45439,
    ];

    for (const projectNumber of projectNumbers) {
        console.log(projectNumber);

        const row = await api.queryTable({
            tableName: "Payout",
            columns: ["id"],
            filters: [
                {
                    column: "project.projectNumber",
                    filter: {
                        equal: `${projectNumber}`,
                    },
                },
            ],
        });

        console.log(row);
        if (row.length !== 1) {
            //            throw new Error("Sadness");
        }
    }
}

async function updateDescriptions(api: DataFixApi) {
    for (const row of await api.queryTable({
        tableName: "Project",
        columns: ["id"],
    })) {
        const projectJSON = await api.readRecord("Project", row[0] as string);
        const project = JSONToProject(projectJSON);
        const fixedProject = resolveSchedules(project);
        const patch = diff(ProjectToJSON(project), ProjectToJSON(fixedProject));
        if (patch !== undefined) {
            await api.patchRecord("Project", project.id.uuid, patch);
        }
    }

    for (const row of await api.queryTable({
        tableName: "DetailSheet",
        columns: ["id"],
    })) {
        const projectJSON = await api.readRecord(
            "DetailSheet",
            row[0] as string
        );
        const project = JSONToDetailSheet(projectJSON);
        const fixedProject = resolveDetailSheetSchedules(project);
        const patch = diff(
            DetailSheetToJSON(project),
            DetailSheetToJSON(fixedProject)
        );
        if (patch !== undefined) {
            await api.patchRecord("DetailSheet", project.id.uuid, patch);
        }
    }
}*/

async function setIndustries(api: DataFixApi) {
  for (const row of await api.queryTable({
    tableName: "ContactType",
    columns: ["id", "name"],
  })) {
    const [id, name] = row as [string, string];
    if (name.startsWith("S/T - ")) {
      const newid = uuid5(id + "-industry");
      await api.storeRecord("Industry", {
        id: newid,
        recordVersion: null,
        name: name.substring(6),
      });

      const current = await api.queryTable({
        tableName: "Contact",
        columns: ["id"],
        filters: [
          {
            column: "type",
            filter: {
              equal: id,
            },
          },
        ],
      });
      for (const row of current) {
        let [contactId] = row as [string];
        await api.patchRecord("Contact", contactId, {
          type: [id, "f5bc9381-f856-4f85-8e62-d8e646671b05"],
          industry: [null, newid],
        });
      }
      await api.deleteRecord("ContactType", id);
    }
  }
}

async function setSent(api: DataFixApi) {
  for (const row of await api.queryTable({
    tableName: "CompletionSurvey",
    columns: ["id"],
    filters: [
      {
        column: "sent",
        filter: {
          equal: false,
        },
      },
    ],
  })) {
    await api.patchRecord("CompletionSurvey", row[0] as string, {
      sent: [false, true],
    });
  }
}

async function funkyEstimates(api: DataFixApi) {
  for (const row of await api.queryTable({
    tableName: "Estimate",
    columns: ["id"],
    filters: [
      {
        column: "common.creationDate",
        filter: {
          equal: null,
        },
      },
    ],
  })) {
    const id: string = (row as any)[0];
    const estimate = await api.readRecord("Estimate", id);
    const originalEstimate = JSON.parse(JSON.stringify(estimate));
    for (const action of estimate.actions) {
      if (action.customUnitRate !== null) {
        action.customUnitRate = new Decimal(action.customUnitRate)
          .dividedBy(100)
          .toString();
      }
    }

    if (!isEqual(originalEstimate, estimate)) {
      await api.storeRecord("Estimate", estimate);
    }
  }
}

const SIMPLES = [
  "Payout",
  "Invoice",
  "Payout Survey",
  "Quote Request",
  "Finish Schedule",
  "Holdback Invoice",
  "Warranty",
];

async function docs(api: DataFixApi) {
  const sharepoint = await getSharepoint();
  const rows = await api.queryTable({
    tableName: "Project",
    columns: ["projectNumber"],
    sorts: ["projectNumber"],
  });
  const bar = new progress.SingleBar({}, progress.Presets.shades_classic);
  bar.start(rows.length, 0);
  for (const block of chunk(rows, 10)) {
    await Promise.all(
      block.map(async (row) => {
        try {
          const projectNumber = `${row[0]}`;

          await acquireProjectFolder(projectNumber);

          bar.increment();
        } catch (error) {
          console.error(error);
        }
      })
    );
  }
}

async function warrantyReviews(api: DataFixApi) {
  const { rows } = await api.pool.query(
    select().from("warranty_reviews").field("id").toParam()
  );

  for (const row of rows) {
    await api.deleteRecord("WarrantyReview", row.id);
  }

  const rawWarrantyLengths = await api.queryTable({
    tableName: "WarrantyLength",
    columns: ["."],
  });
  const warrantyLengths = rawWarrantyLengths
    .map((x) => x[0] as any)
    .map(JSONToWarrantyLength);

  for (const [rawProject] of await api.queryTable({
    tableName: "Project",
    columns: ["."],
    filters: [
      {
        column: "warrantyDate",
        filter: {
          not_equal: null,
        },
      },
    ],
  })) {
    const project = JSONToProject(rawProject as any);

    const warranties = project.warranties.filter((warranty) => warranty.active);
    const length =
      warranties.map((warranty) =>
        find(warrantyLengths, (x) => x.id.uuid == warranty.length)
      )[0]?.number || null;

    await api.storeRecord(
      "WarrantyReview",
      WarrantyReviewToJSON({
        ...WARRANTY_REVIEW_META.fromJSON(
          WARRANTY_REVIEW_META.repair(undefined)
        ),
        project: project.id.uuid,
        yearOfWarrantyReview:
          length &&
          project.completionDate &&
          new Decimal(project.completionDate.date.getFullYear())
            .plus(length)
            .ceil(),
        ownersRepresentatives: project.billingContacts,
        contacts: project.contacts,
      })
    );
  }
}

async function buildProjectLog(api: DataFixApi) {
  console.log("1");
  await api.pool.query("delete from project_status_changes");
  console.log(2);
  const rows = await api.pool.query(
    select()
      .from("record_history")
      .where("tablename = ?", "Project")
      .order("id")
      .order("version")
      .field("id")
      .field("user_id")
      .field("changed_time")
      .field("diff")
      .where("version != -1")
      .toParam()
  );
  console.log(rows.rowCount);

  let currentId = null;
  let base = null;
  let previousStage = null;

  for (const row of rows.rows) {
    if (row.id !== currentId) {
      base = applyPatch(undefined, row.diff, true);
      previousStage = null;
    } else {
      base = applyPatch(base, row.diff, true);
    }

    const project = JSONToProject(repairProjectJSON(base));
    const currentStage = calcProjectStage(project);

    if (currentStage != previousStage) {
      await api.pool.query(
        'INSERT INTO project_status_changes (id, record_version, project,status,date,"user") VALUES ($5, 0, $1, $2, $3, $4)',
        [row.id, currentStage, row.changed_time, row.user_id, genUUID()]
      );
    }

    previousStage = currentStage;
    currentId = row.id;
  }
  console.log(3);
}

async function removeBadWarranties(api: DataFixApi) {
  console.log(
    select()
      .from("warranty_reviews")
      .join("projects", undefined, "projects.id = warranty_reviews.project")
      //.where("array_length(projects.warranty_not_required_notes, 1) = 0")
      .field(str("array_length(projects.warranty_not_required_notes, 1)"))

      .field("warranty_reviews.id")
      .toParam()
  );

  const rows = await api.pool.query(
    select()
      .from("warranty_reviews")
      .join("projects", undefined, "projects.id = warranty_reviews.project")
      .where(
        "array_length(projects.warranty_not_required_notes, 1) is not null"
      )
      .field("warranty_reviews.id")
      .toParam()
  );

  for (const row of rows.rows) {
    console.log(row);

    await api.deleteRecord("WarrantyReview", row.id);
  }
}

async function moveFinishScheduleDates(api: DataFixApi) {
  const rows = await api.pool.query(
    select()
      .from("projects")
      .where("finish_schedule_date is not null")
      .where("finish_schedule_not_required != ''")
      .field("id")
      .field("finish_schedule_date", "date")
      .toParam()
  );

  for (const row of rows.rows) {
    console.log(row);

    await api.patchRecord("Project", row.id, {
      finishScheduleDate: [row.date.toISOString(), null],
      finishScheduleNotRequiredDate: [null, row.date.toISOString()],
    });
  }
}

async function moveWarrantyDates(api: DataFixApi) {
  const rows = await api.pool.query(
    select()
      .from("projects")
      .where("warranty_date is not null")
      .where(
        "array_length(projects.warranty_not_required_notes, 1) is not null"
      )
      .field("id")
      .field("warranty_date", "date")
      .toParam()
  );

  for (const row of rows.rows) {
    await api.patchRecord("Project", row.id, {
      warrantyDate: [row.date.toISOString(), null],
      warrantyNotRequiredDate: [null, row.date.toISOString()],
    });
  }
}

async function moveUnitNumbers(api: DataFixApi) {
  const rows = await api.pool.query(
    select()
      .from("projects")
      .where("unit_number != ''")
      .where("(projects.site_address).unit_number = ''")
      .field("id")
      .field("unit_number")
      .toParam()
  );

  for (const row of rows.rows) {
    await api.patchRecord("Project", row.id, {
      siteAddress: {
        unitNumber: ["", row.unit_number],
      },
      unitNumber: [row.unit_number, ""],
    });
  }

  const rows2 = await api.pool.query(
    select()
      .from("companies")
      .where("unit_number != ''")
      .where("(companies.address).unit_number = ''")
      .field("id")
      .field("unit_number")
      .toParam()
  );

  for (const row of rows2.rows) {
    await api.patchRecord("Company", row.id, {
      address: {
        unitNumber: ["", row.unit_number],
      },
      unitNumber: [row.unit_number, ""],
    });
  }
}

/*
async function moveContingencyItemTypes(api: DataFixApi) {
    {
        const rows = await api.queryTable({
            tableName: "ContingencyItemType",
            columns: ["."],
        });
        for (const row of rows) {
            const record = row[0] as ContingencyItemTypeJSON;
            const newRecord: UnitTypeJSON = {
                id: record.id,
                name: record.name,
                recordVersion: null,
                contingency: true,
            };
            await api.storeRecord("UnitType", newRecord);
        }
    }

    const rows = await api.queryTable({
        tableName: "EstimateContingencyItemType",
        columns: ["."],
    });
    for (const row of rows) {
        const record = row[0] as EstimateContingencyItemJSON;
        const newRecord: ItemTypeJSON = {
            id: record.id,
            name: record.name,
            recordVersion: null,
            defaultUnitType: record.type,
            calculator: "Linear",
            substrate: record.substrate,
            defaultHidden: false,
            contingency: true,
            regular: false,
            rates: [
                {
                    id: uuid5(record.id + "-rate-base"),
                    name: "Base",
                    hours: "1",
                    materials: "0",
                    unitType: record.type,
                    unitIncrement: "1",
                },
            ],
        };
        await api.storeRecord("ItemType", newRecord);
    }
}
*/
async function updateRegularItemTypes(api: DataFixApi) {
  {
    const rows = await api.queryTable({
      tableName: "ItemType",
      columns: ["id"],
      filters: [
        {
          column: "contingency",
          filter: {
            equal: false,
          },
        },
      ],
    });
    for (const row of rows) {
      const record = row[0] as string;
      await api.patchRecord("ItemType", record, {
        regular: [false, true],
      });
    }
  }
}

async function mergeUnitTypes(api: DataFixApi) {
  function hasUnitType(meta: Meta): boolean {
    switch (meta.type) {
      case "uuid":
        return meta.linkTo == "UnitType";
      case "record":
        for (const [field, fieldMeta] of Object.entries(meta.fields)) {
          if (hasUnitType(fieldMeta)) {
            return true;
          }
        }
        return false;
      case "array":
        return hasUnitType(meta.items);
      default:
        return false;
    }
  }

  function transform(entry: any, meta: Meta) {
    switch (meta.type) {
      case "uuid":
        if (meta.linkTo == "UnitType") {
          switch (entry) {
            case "2720088c-17d1-4840-8000-000000000000":
              return "3708045a-9682-4968-8456-6045e1a7dffb";
            case "3f68e1b6-e8cf-4280-8000-000000000000":
              return "36c6b7e1-f0f5-4f0f-a60a-be6045eee4ec";
            default:
              return entry;
          }
        } else {
          return entry;
        }
      case "record":
        const result: any = {};
        for (const [field, fieldMeta] of Object.entries(meta.fields)) {
          result[field] = transform(entry[field], fieldMeta);
        }
        return result;
      case "array":
        return entry.map((x: any) => transform(x, meta.items));
      default:
        return entry;
    }
  }

  for (const [name, meta] of Object.entries(TABLES_META)) {
    if (hasUnitType(meta)) {
      console.log(name);
      const rows = await api.queryTable({
        tableName: name,
        columns: ["."],
      });

      for (const row of rows) {
        const base = row[0] as any;
        const transformed = transform(base, meta);

        const patch = diff(base, transformed);
        if (patch !== undefined) {
          await api.patchRecord(name, base.id, patch);
        }
      }
    }
  }

  await api.deleteRecord("UnitType", "2720088c-17d1-4840-8000-000000000000");
  await api.deleteRecord("UnitType", "3f68e1b6-e8cf-4280-8000-000000000000");
}

const DATED_TABLES = [
  "Quotation",
  "DetailSheet",
  "SiteVisitReport",
  "CoreValueNotice",
  "CustomerSurvey",
  "CompletionSurvey",
  "Payout",
  "WarrantyReviewDetailSheet",
  "Invoice",
];

async function updateDatedTables(api: DataFixApi) {
  for (const table of DATED_TABLES) {
    const rows = await api.queryTable({
      tableName: table,
      filters: [
        {
          column: "date",
          filter: {
            not_equal: null,
          },
        },
        {
          column: "firstDate",
          filter: {
            equal: null,
          },
        },
      ],
      columns: ["id", "date"],
    });

    for (const [id, date] of rows) {
      await api.patchRecord(table, id as string, {
        firstDate: [null, date],
      });
    }
  }
}

async function updateProcessed(api: DataFixApi) {
  const { rows } = await api.pool.query(
    select()
      .from("projects")
      .where("(processed_for_payout).date is not null")
      .field("id")
      .field(str("(projects.processed_for_payout).date"))
      .field(str("(projects.processed_for_payout).user"))
      .field(
        str(
          "(select id from payouts where payouts.project = projects.id order by number limit 1)"
        ),
        "payout_id"
      )
      .toParam()
  );

  for (const row of rows) {
    await api.patchRecord("Project", row.id, {
      processedForPayout: {
        user: [row.user, null],
        date: [row.date.toISOString(), null],
      },
      processedForPayouts: {
        _t: "a",
        append: {
          processed: {
            user: row.user,
            date: row.date.toISOString(),
          },
          payout: row.payout_id,
        },
      },
    });
  }
}

async function removeMissingCfs(api: DataFixApi) {
  const { rows } = await api.pool.query(
    select()
      .from("detail_sheets")
      .where(
        "not exists (select 1 from users where id = detail_sheets.certified_foreman)"
      )
      .where("certified_foreman is not null")
      .field("id")
      .field("certified_foreman")
      .toParam()
  );

  for (const row of rows) {
    api.patchRecord("DetailSheet", row.id, {
      certifiedForeman: [row.certified_foreman, null],
    });
  }
}

async function copyToNewSchedules(api: DataFixApi) {
  const { rows } = await api.pool.query(
    select().from("quotations").field("id").toParam()
  );
  for (const { id } of rows) {
    const quotation: QuotationJSON = await api.readRecord("Quotation", id);
    const newQuotation: QuotationJSON = {
      ...quotation,
      options: quotation.options.map((option) => ({
        ...option,
        schedules: option.schedules.map((schedule) => ({
          ...schedule,
          actions: schedule.oldActions.map((action) => ({
            item: action,
            portion: "1",
          })),
          allowances: schedule.oldAllowances.map((action) => ({
            item: action,
            portion: "1",
          })),
          contingencies: schedule.oldContingencies.map((action) => ({
            item: action,
            portion: "1",
          })),
        })),
      })),
    };

    api.storeRecord("Quotation", newQuotation);
  }
}

async function setInitializedEstimates(api: DataFixApi) {
  const { rows } = await api.pool.query(
    select().from("quotations").field("id").where("initialized").toParam()
  );
  for (const row of rows) {
    const quotation = await api.readRecord("Quotation", row.id);
    quotation.initializedEstimates = quotation.estimates;
    await api.storeRecord("Quotation", quotation);
  }
}

async function roundPreviousMoneys(api: DataFixApi) {
  const { rows } = await api.pool.query(
    select().from("invoices").field("id").toParam()
  );
  for (const row of rows) {
    const invoice: InvoiceJSON = await api.readRecord("Invoice", row.id);

    for (const item of invoice.options) {
      item.total = new Decimal(item.total).toDecimalPlaces(2).toString();
    }

    for (const item of invoice.contingencyItems) {
      item.previousMoney = new Decimal(item.previousMoney)
        .toDecimalPlaces(2)
        .toString();
    }

    await api.storeRecord("Invoice", invoice);
  }
}

async function oneFix(api: DataFixApi) {
  await api.patchRecord("Project", "dd64c4f3-5d15-45d1-8243-0824c5faf472", {
    projectAwardDate: ["2023-12-14T19:31:33.949Z", "2023-10-14T19:31:33.949Z"],
  });
}

async function portContingencyItems(api: DataFixApi) {
  const substrateTranslations = new Map();
  const results = await api.pool.query(
    select()
      .from("substrates")
      .field("substrates.name")
      .field("id")
      .field(
        select()
          .from("item_types")
          .order("similarity(substrates.name, item_types.name)", false)
          .limit(1)
          .field("id"),
        "match"
      )
      .toParam()
  );
  console.log(results);

  for (const { id, match } of results.rows) {
    substrateTranslations.set(id, match);
  }

  substrateTranslations.set(
    "1407e6d6-c674-4c67-b62b-a762f4d22855",
    "5658597b-caa2-4400-8000-000000000000"
  );
  substrateTranslations.set(
    "e1e57a31-d8c1-4d8c-825a-ac2589bfef0d",
    "224ac282-1b9c-4760-8000-000000000000"
  );
  substrateTranslations.set(
    "840f000e-8ce3-48ce-b922-6792f7fb2e51",
    "aead8bb4-1381-4138-b8ae-1b8aa6f1eab6"
  );

  const estimates = await api.pool.query(
    select()
      .from("estimates")
      .where("cardinality(contingency_items) > 0")
      .field("id")
      .toParam()
  );

  for (const { id } of estimates.rows) {
    const estimate: EstimateJSON = await api.readRecord("Estimate", id);
    for (const contingencyItem of estimate.contingencyItems) {
      estimate.contingencyItemsV2.push({
        estimate: {
          id: contingencyItem.id,
          name: contingencyItem.name,
          itemType:
            contingencyItem.substrate &&
            substrateTranslations.get(contingencyItem.substrate),
          calculator: "Linear",
          application: null,
          applicationType: null,
          hourRate: contingencyItem.rate,
          materialsRate: "0",
          hourRatio: "1",
          materialsRatio: "0",
          unitIncrement: "1",
          customUnitRate: null,
          markup: contingencyItem.markup,
          copyUnitsFromAction: null,
          finishSchedule: contingencyItem.finishSchedule,
          rateName: "",
          unitType: contingencyItem.type,
        },
        side: {
          hours: null,
          materials: null,
          calculatorUnits: [
            {
              width: contingencyItem.quantity,
              height: "0",
              note: "",
            },
          ],
          sealantCalculatorUnits: [],
          overrideCopyUnits: false,
        },
        areas: contingencyItem.areas,
      });
    }
    estimate.contingencyItems = [];
    await api.storeRecord("Estimate", estimate);
  }
}

async function resolveSurveys(api: DataFixApi) {
  const templates = await api.queryTable({
    tableName: "CustomerSurveyTemplate",
    columns: ["."],
  });
  const questions = new Map();
  for (const row of templates) {
    const template = row[0] as any as CustomerSurveyTemplateJSON;
    for (const section of template.sections) {
      for (const question of section.questions) {
        questions.set(question.id, template.id);
      }
    }
  }

  const rows = await api.queryTable({
    tableName: "CustomerSurvey",
    columns: ["."],
  });
  for (const row of rows) {
    const survey: CustomerSurveyJSON = row[0] as any;
    const candidates = new Set();
    for (const section of survey.sections) {
      for (const question of section.questions) {
        candidates.add(questions.get(question.id));
      }
    }
    if (candidates.size != 1) {
      throw new Error();
    }
    await api.patchRecord("CustomerSurvey", survey.id, {
      template: [null, candidates.values().next().value],
    });
    //    console.log(survey);
  }
}

async function setSurveySent(api: DataFixApi) {
  const rows = await api.queryTable({
    tableName: "CustomerSurvey",
    columns: ["id"],
  });
  for (const row of rows) {
    const id: string = row[0] as any;
    await api.patchRecord("CustomerSurvey", id, {
      sent: [false, true],
    });
    //    console.log(survey);
  }
}

async function fixStatusRecord(api: DataFixApi) {
  {
    const { rows } = await api.pool.query(
      select()
        .from("project_status_changes")
        .where("status = ?", "Invoiced")
        .where(
          "not exists ?",
          select()
            .from("project_status_changes", "i")
            .where(
              "i.project = project_status_changes.project and i.date > project_status_changes.date and i.status = 'Invoiced'"
            )
        )
        .field("project_status_changes.id")
        .join(
          "projects",
          undefined,
          "projects.id = project_status_changes.project"
        )
        .field("final_invoice_date")
        .where("final_invoice_date is not null")
        .field("date")
        .toParam()
    );
    for (const row of rows) {
      await api.pool.query(
        update()
          .table("project_status_changes")
          .set("date", row.final_invoice_date.toISOString())
          .where("id = ?", row.id)
          .toParam()
      );
    }
  }
  {
    const { rows } = await api.pool.query(
      select()
        .from("project_status_changes")
        .where("status = ?", "Completed")
        .where(
          "not exists ?",
          select()
            .from("project_status_changes", "i")
            .where(
              "i.project = project_status_changes.project and i.date > project_status_changes.date and i.status = 'Completed'"
            )
        )
        .field("project_status_changes.id")
        .join(
          "projects",
          undefined,
          "projects.id = project_status_changes.project"
        )
        .field(str("(completion).date"), "completed")
        .where("(completion).date is not null")
        .field("date")
        .toParam()
    );
    for (const row of rows) {
      await api.pool.query(
        update()
          .table("project_status_changes")
          .set("date", row.completed.toISOString())
          .where("id = ?", row.id)
          .toParam()
      );
    }
  }
}

async function fixEstimates(api: DataFixApi) {
  const estimates = await api.pool.query("select id from estimates");

  for (const row of estimates.rows) {
    const estimate: EstimateJSON = await api.readRecord("Estimate", row.id);
    let bad = false;
    for (const area of estimate.areas) {
      for (const side of area.sides) {
        if (side.actions.length > estimate.actions.length) {
          side.actions.length = estimate.actions.length;
          bad = true;
        }
      }
    }
    if (bad) {
      await api.storeRecord("Estimate", estimate);
    }
  }
}

async function copyDocs(api: DataFixApi) {
  const sharepoint = await getSharepoint();
  const rows = await api.queryTable({
    tableName: "Project",
    columns: ["projectNumber"],
    sorts: ["-projectNumber"],
    filters: [
      {
        column: "projectNumber",
        filter: {
          in: [
            "44888",
            "47508",
            "47996",
            "48083",
            "46942",
            "47988",
            "47046",
            "48140",
            "46905",
          ],
        },
      },
    ],
  });
  const bar = new progress.SingleBar({}, progress.Presets.shades_classic);
  bar.start(rows.length, 0);
  for (const block of chunk(rows, 1)) {
    await Promise.all(
      block.map(async (row) => {
        try {
          const projectNumber = `${row[0]}`;

          await transferDocuments(projectNumber);

          bar.increment();
        } catch (error) {
          console.error(error);
        }
      })
    );
  }
}

async function confirmStartDates(api: DataFixApi) {
  const projects = await api.queryTable({
    tableName: "Project",
    columns: ["id", "projectStartDate"],
    filters: [
      {
        column: "projectStartDate",
        filter: {
          not_equal: null,
        },
      },
      {
        column: "projectStartDateConfirmed.user",
        filter: {
          equal: null,
        },
      },
    ],
  });
  for (const project of projects) {
    await api.patchRecord("Project", project[0] as string, {
      projectStartDateConfirmed: {
        user: [null, ROOT_USER.id],
        date: [
          null,
          LocalDate.parse(project[1] as string)
            .asDate()
            .toISOString(),
        ],
      },
    });
  }
}

async function reapplyProjectDesigns(api: DataFixApi) {
  const sharepoint = await getSharepoint();
  for (const projectNumber of [
    "44888",
    "47508",
    "47996",
    "48083",
    "46942",
    "47988",
    "47046",
    "48140",
    "46905",
  ]) {
    await reapplyDesigns(projectNumber);
  }
}

async function fillInEstimators(api: DataFixApi) {
  for (const row of await api.queryTable({
    tableName: "Quotation",
    columns: ["id", "quotedBy", "estimators"],
  })) {
    const [id, quotedBy, estimators] = row as [
      string,
      string[],
      RoleWithPercentageJSON[]
    ];

    if (quotedBy.length !== 0 && estimators.length === 0) {
      await api.patchRecord("Quotation", id, {
        estimators: [
          [],
          quotedBy.map((entry) => ({
            user: entry,
            percentage: new Decimal(1)
              .dividedBy(new Decimal(quotedBy.length))
              .toString(),
          })),
        ],
      });
    }
  }
}

async function fillInManagers(api: DataFixApi) {
  for (const row of await api.queryTable({
    tableName: "DetailSheet",
    columns: ["id", "manager", "managers"],
  })) {
    const [id, manager, managers] = row as [
      string,
      string,
      RoleWithPercentageJSON[]
    ];

    if (manager !== null && managers.length === 0) {
      await api.patchRecord("DetailSheet", id, {
        managers: [
          [],
          [
            {
              user: manager,
              percentage: "1",
            },
          ],
        ],
      });
    }
  }
}

doDataFix(fillInManagers)
  .then(() => {
    console.log("Finished");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
