import { format as formatDate } from "date-fns";
import Decimal from "decimal.js";
import { minBy, some } from "lodash";
import { ROLE_ORDER } from "../app/user/table";
import { COVERED_LABELS } from "../app/warranty-review/table";
import { Dictionary } from "../clay/common";
import { sumMap } from "../clay/queryFuncs";
import { databasePool } from "../clay/server/databasePool";
import { select } from "../clay/server/squel";
import { ensureProjectFolder } from "./new-sharepoint";
import {
    Printable,
    printableRecord,
    printableRecords,
    PrintContext,
} from "./print";
import { UPGRADED_SITES } from "./processProjectFiles";
import { acquireProjectFolder } from "./sharepoint";

async function projectPath(data: any) {
    if (UPGRADED_SITES.has(data.projectNumber)) {
        await ensureProjectFolder(data.projectNumber);
    }
    return (
        (await acquireProjectFolder(data.projectNumber)) +
        "/03 - Dropsheet Forms"
    );
}

async function subProjectPath(data: any) {
    return await projectPath(data.project);
}

const PRINTABLES: Dictionary<Printable> = {
    quoteRequest: {
        template: () => "Quote Request.docx",
        data: async (context: PrintContext, parameters: string[]) => {
            return printableRecord(
                context,
                context.user,
                "Project",
                parameters[0]
            );
        },
        name: (data: any) => {
            return `Quote Request ${data.projectNumber} - ${data.siteAddress.line1} - ${data.customer}`;
        },
        path: projectPath,
    },
    warranty: {
        template: () => "Warranty.docx",
        data: async (context: PrintContext, parameters: string[]) => {
            const projectPromise = printableRecord(
                context,
                context.user,
                "Project",
                parameters[0]
            );

            let warrantyDescriptionOfWork = [];
            const invoices = await context.pool.query(
                select()
                    .field("number")
                    .field("id")
                    .from("invoices")
                    .where("project = ?", parameters[0])
                    .order("number", false)
                    .order("date", false)
                    .limit(1)
                    .toParam()
            );
            if (invoices.rows.length > 0) {
                const invoice = await printableRecord(
                    context,
                    context.user,
                    "Invoice",
                    invoices.rows[0].id
                );
                const project = await projectPromise;

                for (const option of invoice.options) {
                    if (
                        project.warrantyExcludeScopes.indexOf(
                            option.id.uuid
                        ) === -1
                    ) {
                        warrantyDescriptionOfWork.push(option.description);
                    }
                }

                for (const option of invoice.contingencyItems) {
                    if (
                        project.warrantyExcludeScopes.indexOf(
                            option.id.uuid
                        ) === -1
                    ) {
                        warrantyDescriptionOfWork.push(option.description);
                    }
                }
            }

            const project = await projectPromise;
            let warrantyLength = "Varies (see below)";

            const warranties = project.warranties
                .filter((warranty: any) => warranty.active)
                .map((warranty: any) => ({
                    ...warranty,
                    content: warranty.content.replace(
                        "[LENGTH]",
                        warranty.length.legal
                    ),
                }));
            if (
                warranties.length != 0 &&
                !some(
                    warranties,
                    (warranty) =>
                        warranty.length.id.uuid !== warranties[0].length.id.uuid
                )
            ) {
                warrantyLength = project.warranties[0].length.name;
            }

            let yearOfWarrantyReview = "N/A";

            for (const warranty of warranties) {
                if (warranty.scheduleReview && project.completionDate) {
                    yearOfWarrantyReview = new Decimal(
                        project.completionDate.date.getFullYear()
                    )
                        .plus(warranty.length.number)
                        .ceil()
                        .toString();
                }
            }

            return {
                ...project,
                warrantyDescriptionOfWork,
                warranties,
                warrantyLength,
                yearOfWarrantyReview,
            };
        },
        name: (data: any) => {
            return `Warranty ${data.projectNumber} - ${data.siteAddress.line1} - ${data.customer}`;
        },
        path: projectPath,
    },
    finishSchedule: {
        template: () => "Finish Schedule.docx",
        data: async (context: PrintContext, parameters: string[]) => {
            return printableRecord(
                context,
                context.user,
                "Project",
                parameters[0]
            );
        },
        name: (data: any) => {
            return `Finish Schedule ${data.projectNumber} - ${data.siteAddress.line1} - ${data.customer}`;
        },
        path: projectPath,
    },
    quotation: {
        template: (parameters) => `Quotations/${parameters[1]}.docx`,
        data: async (context: PrintContext, parameters: string[]) => {
            return printableRecord(
                context,
                context.user,
                "Quotation",
                parameters[0]
            );
        },
        name: (data: any) => {
            return `Quotation ${
                data.project.projectNumber
            }-${data.number.toString()} - ${data.project.siteAddress.line1} - ${
                data.project.customer
            }`;
        },
        path: subProjectPath,
    },
    detailSheet: {
        template: (parameters) =>
            parameters[1] == "1"
                ? "Change Order Detail Sheet.docx"
                : `Detail Sheet.docx`,
        data: async (context: PrintContext, parameters: string[]) => {
            return printableRecord(
                context,
                context.user,
                "DetailSheet",
                parameters[0]
            );
        },
        name: (data: any) => {
            if (data.change) {
                return `Detail Sheet ${
                    data.project.projectNumber
                } Change Order ${data.number.toString()} - ${
                    data.project.siteAddress.line1
                }`;
            } else {
                return `Detail Sheet ${data.project.projectNumber}  - ${data.project.siteAddress.line1}`;
            }
        },
        async path(data) {
            if (data.certifiedForeman === null) {
                return await acquireProjectFolder(data.project.projectNumber);
            } else {
                return (
                    (await acquireProjectFolder(data.project.projectNumber)) +
                    `/07 - ${data.certifiedForeman.code} - ${data.project.projectNumber}`
                );
            }
        },
    },
    siteVisitReport: {
        template: (parameters) => `Site Visit Report.docx`,
        data: async (context: PrintContext, parameters: string[]) => {
            return printableRecord(
                context,
                context.user,
                "SiteVisitReport",
                parameters[0]
            );
        },
        name: (data: any) => {
            return `Site Visit Report ${
                data.project.projectNumber
            }-${data.number.toString()}`;
        },
        body: (data: any) => {
            return `Here is your Site Visit Report from ${data.user.name} on ${
                data.date && formatDate(data.date, "MMMM d, yyyy")
            }`;
        },
        target: (data: any) => {
            return [data.certifiedForeman.accountEmail];
        },
        path: subProjectPath,
    },
    saltOrder: {
        template: () => "Salt Order Form.docx",
        data: async (context: PrintContext, parameters: string[]) => {
            return printableRecord(
                context,
                context.user,
                "SaltOrder",
                parameters[0]
            );
        },
        name: (data: any) => {
            return `Salt Order ${data.orderNumber} `;
        },
    },
    saltOrderInvoice: {
        template: () => "Salt Order Invoice.docx",
        data: async (context: PrintContext, parameters: string[]) => {
            const result = printableRecord(
                context,
                context.user,
                "SaltOrder",
                parameters[0]
            );
            return result;
        },
        name: (data: any) => {
            return `Salt Order Invoice ${data.orderNumber} `;
        },
    },
    invoice: {
        template: () => "Standard Invoice.docx",
        data: async (context: PrintContext, parameters: string[]) => {
            return printableRecord(
                context,
                context.user,
                "Invoice",
                parameters[0]
            );
        },
        name: (data: any) => {
            return `Invoice ${
                data.project.projectNumber
            }-${data.number.toString()} - ${data.project.siteAddress.line1}`;
        },
        path: subProjectPath,
    },
    engineeredInvoice: {
        template: () => "Engineered Invoice.docx",
        data: async (context: PrintContext, parameters: string[]) => {
            const data = await printableRecord(
                context,
                context.user,
                "Invoice",
                parameters[0]
            );
            //p

            function buildValue(
                rule: any,
                optionValue: (x: any) => any,
                contingencyValue: (x: any) => any
            ) {
                return sumMap(data.options.filter(rule), optionValue).plus(
                    sumMap(data.contingencyItems.filter(rule), contingencyValue)
                );
            }

            function buildSummary(rule: (x: any) => any) {
                const base = {
                    contract: buildValue(
                        rule,
                        (option) => option.total,
                        (item) => item.contractTotal
                    ),
                    toDate: buildValue(
                        rule,
                        (option) => option.amount,
                        (item) => item.dollarTotal
                    ),
                    previous: buildValue(
                        rule,
                        (option) => option.previous.times(option.total),
                        (item) => item.previousMoney
                    ),
                    thisInvoice: buildValue(
                        rule,
                        (option) => option.deltaAmount,
                        (item) => item.deltaAmount
                    ),
                };

                if (base.contract.isZero()) {
                    return {
                        ...base,
                        toDatePct: new Decimal(0),
                        previousPct: new Decimal(0),
                        thisInvoicePct: new Decimal(0),
                        remaining: base.contract.minus(base.toDate),
                    };
                } else {
                    return {
                        ...base,
                        toDatePct: base.toDate.dividedBy(base.contract),
                        previousPct: base.previous.dividedBy(base.contract),
                        thisInvoicePct: base.thisInvoice.dividedBy(
                            base.contract
                        ),
                        remaining: base.contract.minus(base.toDate),
                    };
                }
            }

            function buildSchedules(rule: (x: any) => any) {
                const contingencyItems = data.contingencyItems.filter(rule);
                const contingencyItemsPrevious = sumMap(
                    contingencyItems,
                    (item: any) => item.previousMoney
                );
                const contingencyItemsCompleted = sumMap(
                    contingencyItems,
                    (item: any) => item.quantity.times(item.rate)
                );
                const contingencyItemsCurrent = sumMap(
                    contingencyItems,
                    (item: any) => item.deltaAmount
                );
                const contingencyItemsTotal = sumMap(
                    contingencyItems,
                    (item: any) => item.total.times(item.rate)
                );

                return [
                    ...data.options.filter(rule).map((option: any) => ({
                        description: option.description,
                        contract: option.total,
                        toDatePct: option.completed,
                        toDateAmount: option.amount,
                        previousAmount: option.previous,
                        previousPct: option.previous.dividedBy(option.total),
                        thisAmount: option.deltaAmount,
                        thisPct: option.deltaAmount.dividedBy(option.total),
                        remaining: option.total.minus(option.amount),
                    })),
                    ...(contingencyItemsTotal.isZero()
                        ? []
                        : [
                              {
                                  description: "Contingency",
                                  contract: contingencyItemsTotal,
                                  toDateAmount: contingencyItemsCompleted,
                                  toDatePct:
                                      contingencyItemsCompleted.dividedBy(
                                          contingencyItemsTotal
                                      ),
                                  previousAmount: contingencyItemsPrevious,
                                  previousPct:
                                      contingencyItemsPrevious.dividedBy(
                                          contingencyItemsTotal
                                      ),
                                  thisAmount: contingencyItemsCurrent,
                                  thisPct: contingencyItemsCurrent.dividedBy(
                                      contingencyItemsTotal
                                  ),
                                  remaining: contingencyItemsTotal.minus(
                                      contingencyItemsCompleted
                                  ),
                              },
                          ]),
                ];
            }

            const invoiceIds = await context.pool.query(
                select()
                    .from("invoices")
                    .field("id")
                    .where("project = ?", data.project.id.uuid)
                    .order("number")
                    .toParam()
            );

            const invoices = await printableRecords(
                context,
                context.user,
                "Invoice",
                invoiceIds.rows.map((row) => row.id)
            );

            const totalHolback = sumMap(
                invoices,
                (invoice) => invoice.holdback
            );

            const previousHoldback = totalHolback.minus(data.holdback);

            return {
                ...data,
                invoices,
                summary: {
                    contract: buildSummary((option) => option.number.isZero()),
                    changeOrder: buildSummary(
                        (option) =>
                            !option.number.isZero() &&
                            option.externalChangeOrderNumber !== ""
                    ),
                    timeAndMaterials: buildSummary(
                        (option) =>
                            !option.number.isZero() &&
                            option.externalChangeOrderNumber === ""
                    ),
                    total: buildSummary((option) => true),
                    holdback: {
                        toDate: totalHolback,
                        previous: previousHoldback,
                        thisInvoice: data.holdback,
                    },
                    total2: {
                        toDate: data.invoicedTotal.minus(totalHolback),
                        previous: data.previousTotal.minus(previousHoldback),
                        thisInvoice: data.amountTotal.minus(data.holdback),
                    },
                },
                schedules: {
                    contract: buildSchedules((option) =>
                        option.number.isZero()
                    ),
                    changeOrder: buildSchedules(
                        (option) =>
                            !option.number.isZero() &&
                            option.externalChangeOrderNumber !== ""
                    ),
                    timeAndMaterials: buildSchedules(
                        (option) =>
                            !option.number.isZero() &&
                            option.externalChangeOrderNumber === ""
                    ),
                },
                totals: {
                    holdback: sumMap(invoices, (invoices) => invoices.holdback),
                    gst: sumMap(invoices, (invoice) => invoice.gst),
                    total: sumMap(
                        invoices,
                        (invoice) => invoice.paymentRequested
                    ),
                },
            };
        },
        name: (data: any) => {
            return `Invoice ${
                data.project.projectNumber
            }-${data.number.toString()} - ${data.project.siteAddress.line1}`;
        },
        path: subProjectPath,
    },
    holdbackInvoice: {
        template: () => "Holdback Invoice.docx",
        data: async (context: PrintContext, parameters: string[]) => {
            const finalInvoice = await printableRecord(
                context,
                context.user,
                "Invoice",
                parameters[0]
            );

            const projectId = finalInvoice.project.id.uuid;

            const invoiceIds = await context.pool.query(
                select()
                    .from("invoices")
                    .field("id")
                    .where("project = ?", projectId)
                    .order("number")
                    .toParam()
            );

            const invoices = await printableRecords(
                context,
                context.user,
                "Invoice",
                invoiceIds.rows.map((row) => row.id)
            );

            return {
                ...finalInvoice,
                invoices,
                total: sumMap(invoices, (invoice) => invoice.holdback),
            };
        },
        name: (data: any) => {
            return `Holdback Invoice ${data.project.projectNumber} - ${data.project.siteAddress.line1}`;
        },
        path: subProjectPath,
    },
    payout: {
        template: () => "Office Job Payout Form.docx",
        data: async (context: PrintContext, parameters: string[]) => {
            return printableRecord(
                context,
                context.user,
                "Payout",
                parameters[0]
            );
        },
        name: (data: any) => {
            return `Payout ${data.project.projectNumber} - ${data.project.siteAddress.line1}`;
        },
        path: subProjectPath,
    },
    certifiedForemanPayout: {
        template: () => "CF Job Payout Form.docx",
        data: async (context: PrintContext, parameters: string[]) => {
            const base = await printableRecord(
                context,
                context.user,
                "Payout",
                parameters[0]
            );
            return {
                ...base,
                certifiedForemen: base.certifiedForemen.filter(
                    (row: any) => row.certifiedForeman.id.uuid === parameters[1]
                ),
            };
        },
        name: (data: any) => {
            return `Payout ${data.project.projectNumber} - ${data.project.siteAddress.line1} - ${data.certifiedForemen[0].certifiedForeman.codeName}`;
        },
        path: subProjectPath,
    },
    completionSurvey: {
        template: () => "CF Project Survey.docx",
        data: async (context: PrintContext, parameters: string[]) => {
            return printableRecord(
                context,
                context.user,
                "CompletionSurvey",
                parameters[0]
            );
        },
        name: (data: any) => {
            return `Payout Survey ${data.project.projectNumber} - ${data.project.siteAddress.line1}  - ${data.certifiedForeman.codeName}`;
        },
        target: (data: any) => {
            return [data.certifiedForeman.accountEmail];
        },
        path: subProjectPath,
    },
    customerSurvey: {
        template: () => "Customer Survey Report.docx",
        data: async (context: PrintContext, parameters: string[]) => {
            return printableRecord(
                context,
                context.user,
                "CustomerSurvey",
                parameters[0]
            );
        },
        name: (data: any) => {
            return `Customer Survey ${data.project.projectNumber} - ${data.project.siteAddress.line1}  - ${data.contact.name}`;
        },
        path: subProjectPath,
    },
    coreValueNotice: {
        template: (parameters) => `Core Values ${parameters[1]}.docx`,
        data: async (context: PrintContext, parameters: string[]) => {
            const record = await printableRecord(
                context,
                context.user,
                "CoreValueNotice",
                parameters[0]
            );
            const { pool } = await databasePool;
            const categories: string[] = record.project.descriptionCategories;
            const users = await pool.query(
                select()
                    .from("roles")
                    .from("users")
                    .where("ARRAY[roles.id] && users.roles")
                    .where("? && roles.permissions", [
                        categories.map(
                            (category) => "Project-core-value-email-" + category
                        ),
                    ])
                    .field("users.account_email")
                    .group("users.account_email")
                    .toParam()
            );
            return {
                ...record,
                emails: users.rows.map((row) => row.account_email),
            };
        },
        name: (data: any) => {
            return `Core Value ${data.category.name}  ${
                data.project.projectNumber
            } ${data.date.toISOString()}`;
        },
        target: (data: any) => {
            return [data.certifiedForeman.accountEmail, ...data.emails];
        },
        path: subProjectPath,
    },
    warrantyReview: {
        template() {
            return "Warranty Review.docx";
        },
        async data(context: PrintContext, parameters: string[]) {
            const record = await printableRecord(
                context,
                context.user,
                "WarrantyReview",
                parameters[0]
            );

            const invoices = context.pool.query(
                select()
                    .field("id")
                    .from("invoices")
                    .where("project = ?", record.project.id.uuid)
                    .order("number", false)
                    .order("date", false)
                    .limit(1)
                    .toParam()
            );

            const lastInvoiceId = (await invoices).rows[0]?.id;

            if (lastInvoiceId) {
                const invoice = await printableRecord(
                    context,
                    context.user,
                    "Invoice",
                    lastInvoiceId
                );

                record.projectDescription = [
                    ...invoice.options
                        .filter(
                            (option: any) =>
                                record.project.warrantyExcludeScopes.indexOf(
                                    option.id.uuid
                                ) === -1
                        )
                        .map((x: any) => x.description),
                    ...invoice.contingencyItems
                        .filter(
                            (option: any) =>
                                record.project.warrantyExcludeScopes.indexOf(
                                    option.id.uuid
                                ) === -1
                        )
                        .map((x: any) => x.description),
                ];
            } else {
                record.projectDescription = [];
            }

            record.serviceRepresentative = (
                minBy(record.personnel, (x: any) =>
                    ROLE_ORDER.indexOf(x.role)
                ) || null
            )?.user;

            record.allContacts = [
                ...record.ownersRepresentatives,
                ...record.contacts,
            ];

            for (const item of record.specificItems) {
                item.covered =
                    COVERED_LABELS[
                        item.covered as "Yes" | "Remdal" | "Other"
                    ] || null;
            }

            return record;
        },
        name(data: any) {
            return `Warranty Review ${data.project.projectNumber}`;
        },
        path: subProjectPath,
    },
    warrantyReviewDetailSheet: {
        template: () => "Warranty Detail Sheet.docx",
        data: async (context: PrintContext, parameters: string[]) => {
            const record = await printableRecord(
                context,
                context.user,
                "WarrantyReviewDetailSheet",
                parameters[0]
            );

            return {
                ...record,
                project: record.warrantyReview.project,
                finishSchedules:
                    record.warrantyReview.project.finishScheduleLines.map(
                        (line: any) => ({
                            ...line,
                            highlighted:
                                record.highlightedFinishSchedules.indexOf(
                                    line.id.uuid
                                ) !== -1,
                        })
                    ),
            };
        },
        name: (data: any) => {
            return `Warranty Detail Sheet ${data.warrantyReview.project.projectNumber}`;
        },
        path: (data) => subProjectPath(data.warrantyReview),
    },
};

export default PRINTABLES;
