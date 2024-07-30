import * as Sentry from "@sentry/node";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { format as formatDate } from "date-fns";
import { Decimal } from "decimal.js";
import Docxtemplater, { DXT } from "docxtemplater";
import { Request, Response } from "express";
import { decode, encode } from "html-entities";
import { find } from "lodash";
import fetch from "node-fetch";
import {
    HTMLElement,
    Node,
    parse as parseHTML,
    TextNode,
} from "node-html-parser";
import * as pathlib from "path";
import { Pool } from "pg";
import pluralize from "pluralize";
import { Address } from "../app/address";
import {
    calcPayoutOptionCertifiedForemanAmount,
    PayoutOption,
} from "../app/payout/table";
import { computeScore } from "../app/project/site-visit-report/table";
import { Note } from "../app/quotation/notes/table";
import { TABLES_META } from "../app/tables";
import {
    ROLE_CERTIFIED_FOREMAN,
    ROLE_ESTIMATOR,
    ROLE_PROJECT_MANAGER,
} from "../app/user/table";
import { Dictionary } from "../clay/common";
import { longDate } from "../clay/LocalDate";
import { Meta } from "../clay/meta";
import { Phone } from "../clay/phone";
import { ResolveError, sumMap } from "../clay/queryFuncs";
import { GenerateResponse, UserPermissions } from "../clay/server/api";
import { Context } from "../clay/server/context";
import { databasePool } from "../clay/server/databasePool";
import { readRecords } from "../clay/server/readRecord";
import { sendEmail } from "./email";
import { storeFile } from "./new-sharepoint";
import PRINTABLES from "./printables";
import printErrorResponse from "./printErrorResponse";
import { UPGRADED_SITES } from "./processProjectFiles";
import { resolveUser } from "./resolve-user";
import { getSharepoint, getSharepointAuth } from "./sharepoint";
const JSZip = require("jszip");

const jexl = require("../../jexl") as any;

export type PrintContext = Context & { pool: Pool; user: UserPermissions };

export type Printable = {
    template: (parameters: string[]) => string;
    data: (context: PrintContext, parameters: string[]) => Promise<{}>;
    name: (data: {}) => string;
    body?: (data: {}) => string;
    target?: (data: {}) => string[];
    path?: (data: any) => Promise<string>;
};

function collectLinkedRecords(
    linkedRecords: Dictionary<Set<string>>,
    meta: Meta,
    value: any
) {
    switch (meta.type) {
        case "record":
            for (const [key, fieldMeta] of Object.entries(meta.fields)) {
                collectLinkedRecords(linkedRecords, fieldMeta, value[key]);
            }
            break;
        case "array":
            for (const item of value) {
                collectLinkedRecords(linkedRecords, meta.items, item);
            }
            break;
        case "uuid":
            if (value !== null) {
                switch (meta.linkTo) {
                    case "User":
                    case "Role":
                    case "ContactType":
                    case "SaltProduct":
                    case "Project":
                    case "QuotationType":
                    case "ApplicationType":
                    case "Term":
                    case "Manufacturer":
                    case "CoreValueNoticeCategory":
                    case "ProjectDescriptionCategory":
                    case "ProjectDescription":
                    case "WarrantyLength":
                    case "WarrantyReview":
                    case "UnitType":
                        if (!(meta.linkTo in linkedRecords)) {
                            linkedRecords[meta.linkTo] = new Set();
                        }
                        linkedRecords[meta.linkTo].add(value);
                        break;
                }
            }
            break;
        default:
            break;
    }
}

const ROLES = {
    estimators: ROLE_ESTIMATOR,
    projectManagers: ROLE_PROJECT_MANAGER,
    certifiedForemen: ROLE_CERTIFIED_FOREMAN,
};

function postProcessRecord(name: string, record: any) {
    switch (name) {
        case "Project":
            for (const [key, id] of Object.entries(ROLES)) {
                record[key] = record.personnel
                    .filter((person: any) => person.role?.id?.uuid === id)
                    .map((person: any) => person.user);
            }
            record.allContacts = [
                ...record.billingContacts,
                ...record.contacts,
            ];
            break;
        case "SiteVisitReportQuestion":
            record.response =
                find(
                    record.answers,
                    (answer) => answer.id.uuid === record.selectedAnswer
                ) || null;
            record.outOf = Decimal.max(
                new Decimal(0),
                ...record.answers
                    .map((x: any) => x.score)
                    .filter((x: any) => x != null)
            );
            break;
        case "Payout":
            for (const certifiedForeman of record.certifiedForemen) {
                certifiedForeman.options = record.options.filter(
                    (x: PayoutOption) =>
                        x.certifiedForeman == certifiedForeman.certifiedForeman
                );
                certifiedForeman.originalContractAmount = sumMap(
                    certifiedForeman.options.filter((x: PayoutOption) =>
                        x.number.isZero()
                    ),
                    calcPayoutOptionCertifiedForemanAmount
                );
                certifiedForeman.extras = certifiedForeman.options.filter(
                    (x: PayoutOption) =>
                        !x.number.isZero() &&
                        !calcPayoutOptionCertifiedForemanAmount(x).isZero()
                );
                certifiedForeman.extraTotal = sumMap(
                    certifiedForeman.extras,
                    calcPayoutOptionCertifiedForemanAmount
                );
            }
            break;
        case "SiteVisitReport":
        case "CompletionSurvey":
        case "CustomerSurvey":
            record.totals = computeScore(record);
            break;

        case "OptionFinishSchedule":
        case "DetailSheetFinishSchedule":
        case "FinishSchedule":
            record.application =
                (record.applicationType &&
                    find(
                        record.applicationType.options,
                        (option) => option.id.uuid == record.application
                    )) ||
                null;
            break;
        case "CoreValueNotice":
            record.type =
                (record.category &&
                    find(
                        record.category.types,
                        (option) => option.id.uuid == record.type
                    )) ||
                null;
            break;
        case "DetailSheet":
            for (const option of record.options) {
                option.contractNotes = [];
                for (const contractNote of record.contractNotes) {
                    const items = [];
                    for (const note of contractNote.notes) {
                        const options =
                            note.options === null
                                ? contractNote.options === null
                                    ? record.options
                                          .slice(0, 1)
                                          .map((x: any) => x.id.uuid)
                                    : contractNote.options
                                : note.options;
                        if (
                            note.include &&
                            options.indexOf(option.id.uuid) !== -1
                        ) {
                            items.push(note);
                        }
                    }

                    if (items.length > 0) {
                        option.contractNotes.push({
                            ...contractNote,
                            notes: items,
                        });
                    }
                }

                option.scopeOfWork = [];
                for (const contractNote of record.scopeOfWork) {
                    const items = [];
                    for (const note of contractNote.notes) {
                        const options =
                            note.options === null
                                ? contractNote.options === null
                                    ? record.options
                                          .slice(0, 1)
                                          .map((x: any) => x.id.uuid)
                                    : contractNote.options
                                : note.options;
                        if (
                            note.include &&
                            options.indexOf(option.id.uuid) !== -1
                        ) {
                            items.push(note);
                        }
                    }

                    if (items.length > 0) {
                        option.scopeOfWork.push({
                            ...contractNote,
                            notes: items,
                        });
                    }
                }
            }
            break;

        case "Quotation":
            for (const option of record.options) {
                for (const finishSchedule of option.details.finishSchedule) {
                    finishSchedule.application =
                        find(
                            finishSchedule.applicationType?.options || [],
                            (option) =>
                                option.id.uuid === finishSchedule.application
                        ) || null;
                }

                option.contractNotes = [];
                option.allContractNotes = [];
                for (const contractNote of record.contractNotes) {
                    const items = [];
                    for (const note of contractNote.notes) {
                        const options =
                            note.options === null
                                ? contractNote.options === null
                                    ? record.options
                                          .slice(0, 1)
                                          .map((x: any) => x.id.uuid)
                                    : contractNote.options
                                : note.options;
                        if (
                            note.include &&
                            options.indexOf(option.id.uuid) !== -1
                        ) {
                            items.push(note);
                            option.allContractNotes.push(note);
                        }
                    }

                    if (items.length > 0) {
                        option.contractNotes.push({
                            ...contractNote,
                            notes: items,
                        });
                    }
                }

                option.scopeOfWork = [];
                for (const contractNote of record.scopeOfWork) {
                    const items = [];
                    for (const note of contractNote.notes) {
                        const options =
                            note.options === null
                                ? contractNote.options === null
                                    ? record.options
                                          .slice(0, 1)
                                          .map((x: any) => x.id.uuid)
                                    : contractNote.options
                                : note.options;
                        if (
                            note.include &&
                            options.indexOf(option.id.uuid) !== -1
                        ) {
                            items.push(note);
                        }
                    }

                    if (items.length > 0) {
                        option.scopeOfWork.push({
                            ...contractNote,
                            notes: items,
                        });
                    }
                }
            }

            record.baseBid = record.options[0];
            record.allOptions = record.options.slice();
            record.options.splice(0, 1);
            record.allProjectSpotlightItems = [];
            for (const scopeOfWork of record.scopeOfWork) {
                scopeOfWork.notes = scopeOfWork.notes.filter(
                    (x: Note) => x.include
                );
            }
            for (const noteList of record.projectSpotlightItems) {
                for (const note of noteList.notes) {
                    if (note.include) {
                        record.allProjectSpotlightItems.push(note);
                    }
                }
            }

            break;
    }
}

async function resolveRecord(
    linkedRecordPromises: Dictionary<Promise<Dictionary<any>>>,
    meta: Meta,
    value: any,
    outerRecords: Dictionary<any>
): Promise<any> {
    if (value === undefined) {
        throw new Error("expected value");
    }
    switch (meta.type) {
        case "record":
            const record: Dictionary<any> = {};
            const innerRecords = {
                ...outerRecords,
                [meta.name]: value,
            };
            for (const [key, fieldMeta] of Object.entries(meta.fields)) {
                record[key] = await resolveRecord(
                    linkedRecordPromises,
                    fieldMeta,
                    value[key],
                    innerRecords
                );
            }
            for (const [key, fn] of Object.entries(meta.functions)) {
                const args = [];
                let bad = false;
                for (const parameterType of fn.parameterTypes()) {
                    if (parameterType.type !== "record") {
                        bad = true;
                        break;
                    }

                    if (parameterType.name in innerRecords) {
                        args.push(innerRecords[parameterType.name]);
                    } else {
                        bad = true;
                        break;
                    }
                }
                if (!bad) {
                    try {
                        record[key] = fn.fn(...args);
                    } catch (error) {
                        console.error(
                            "EH",
                            error,
                            error instanceof ResolveError
                        );
                        if (!(error instanceof ResolveError)) {
                            throw error;
                        }
                    }
                }
            }
            postProcessRecord(meta.name, record);
            return record;
        case "array":
            const array = [];
            for (const item of value) {
                array.push(
                    await resolveRecord(
                        linkedRecordPromises,
                        meta.items,
                        item,
                        outerRecords
                    )
                );
            }
            return array;
        case "uuid":
            if (
                meta.linkTo &&
                meta.linkTo in linkedRecordPromises &&
                value !== null
            ) {
                return (await linkedRecordPromises[meta.linkTo])[value] || null;
            } else {
                return value;
            }
        default:
            return value;
    }
}

async function printableRecordsById(
    context: PrintContext,
    user: UserPermissions,
    table: string,
    ids: string[]
): Promise<Dictionary<any>> {
    const records = await printableRecords(context, user, table, ids);
    const result: Dictionary<any> = {};
    for (const record of records) {
        result[record.id.uuid] = record;
    }
    return result;
}
export async function printableRecords(
    context: PrintContext,
    user: UserPermissions,
    table: string,
    ids: string[]
): Promise<any[]> {
    const client = await context.pool.connect();
    let readResult;
    try {
        readResult = await readRecords(client, context, user, table, (query) =>
            query.where("id in ?", ids)
        );
    } finally {
        client.release();
    }
    const meta = TABLES_META[table];

    const linkedRecords: Dictionary<Set<string>> = {};
    for (const record of readResult.records) {
        collectLinkedRecords(linkedRecords, meta, record);
    }
    const linkedRecordPromises: Dictionary<Promise<Dictionary<any>>> = {};
    for (const [tableName, ids] of Object.entries(linkedRecords)) {
        linkedRecordPromises[tableName] = printableRecordsById(
            context,
            user,
            tableName,
            Array.from(ids)
        );
    }

    const result = [];
    for (const record of readResult.records) {
        result.push(
            await resolveRecord(
                linkedRecordPromises,
                meta,
                meta.fromJSON(record),
                {}
            )
        );
    }
    return result;
}

export async function printableRecord(
    context: PrintContext,
    user: UserPermissions,
    table: string,
    id: string
) {
    const result = await printableRecords(context, user, table, [id]);
    if (result.length !== 1) {
        throw new Error(`could not read record ${table} ${id}`);
    }
    return result[0];
}

class UnresolvedTagError extends Error {
    constructor() {
        super();
    }
}

jexl.addTransform("optLine", (line: string): string =>
    line.trim() ? line.trim() + "\n" : ""
);

jexl.addTransform("money", (input: Decimal) => {
    var parts = input.toFixed(2).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return "$" + parts.join(".");
});

jexl.addTransform("address", (input: Address): string => {
    return `${input.line1}\n${input.city}, ${input.province} ${input.postal}`;
});

jexl.addTransform("saltOrderInvoiceLine", (input: any): string => {
    if (input.product.noUnits) {
        return (
            input.quantity.toString() +
            " " +
            pluralize(input.product.name, input.quantity.toNumber())
        );
    } else {
        return `${input.quantity.toString()} ${input.unit} of ${
            input.product.name
        }`;
    }
});

jexl.addTransform("percentage", (input: Decimal, decimals: number = 0) => {
    return (
        input
            .times(100)
            .toDecimalPlaces(decimals + 2)
            .toString() + "%"
    );
});

jexl.addTransform("hiddenCurrency", (input: Decimal) => {
    var digits = input.toFixed(2).replace(".", "");
    return digits.substring(0, 3) + "-" + digits.substring(3);
});

jexl.addTransform("longDate", longDate);

jexl.addTransform("time", (date: Date) => {
    if (date) {
        return formatDate(date, "h:mm a");
    } else {
        return null;
    }
});

jexl.addTransform("uppercase", (text: string) => {
    return text.toUpperCase();
});

jexl.addTransform("negate", (text: Decimal) => {
    return text.negated();
});

jexl.addTransform("isNotEmpty", (items: any) => {
    if (items == null) {
        return false;
    } else if (items instanceof Phone) {
        return items.phone.length > 0;
    } else {
        return items.length > 0;
    }
});

jexl.addTransform("isEmpty", (items: any[]) => {
    if (items == null) {
        return true;
    } else if (items instanceof Phone) {
        return items.phone.length == 0;
    } else {
        return items.length == 0;
    }
});

jexl.addTransform("length", (items: any[]) => {
    return items.length;
});

jexl.addTransform("isZero", (input: Decimal) => input.isZero());
jexl.addTransform("isNotZero", (input: Decimal) => !input.isZero());

function processHtml(
    element: Node,
    context: "root" | "ul" | "p",
    properties: string[]
): string {
    if (element instanceof HTMLElement) {
        switch (element.tagName) {
            default:
                return element.childNodes
                    .map((node) => processHtml(node, context, properties))
                    .join("");
            case "STRONG":
            case "B":
                return element.childNodes
                    .map((node) =>
                        processHtml(node, context, [...properties, "<w:b/>"])
                    )
                    .join("");
            case "BR":
                return "<w:br/>";
            case "P":
                return (
                    "<w:p>" +
                    element.childNodes
                        .map((node) => processHtml(node, "p", properties))
                        .join("") +
                    "</w:p>"
                );
            case "UL":
                return element.childNodes
                    .map((node) => processHtml(node, "ul", properties))
                    .join("");
            case "LI":
                return `<w:p>
  <w:pPr>
    <w:numPr>
      <w:ilvl w:val="0" />
      <w:numId w:val="${context == "ul" ? "ul" : "ol"}" />
    </w:numPr>
  </w:pPr>
    ${element.childNodes
        .map((node) => processHtml(node, "p", properties))
        .join("")}
</w:p>`;
        }
    } else if (element instanceof TextNode) {
        switch (context) {
            case "p":
                return `<w:r><w:rPr>${properties.join(
                    ""
                )}</w:rPr><w:t xml:space="preserve">${encode(
                    decode(element.rawText),
                    {
                        level: "xml",
                    }
                )}</w:t></w:r>`;
            default:
                return "";
        }
    } else {
        console.log("G", element);
    }
    return "";
}

jexl.addTransform("html", (input: string) => {
    const root = parseHTML(input);
    const processed = processHtml(root, "root", []);
    return processed;
});

function resolveTag(s: any, tag: string) {
    if (tag.startsWith("inter:")) {
        return endOfPart(s.length, s.index - 1, tag.slice(6));
    }
    const value = jexl.evalSync(tag.replace(/(’|“|”)/g, "'"), s);
    if (value === null) {
        return "";
    } else if (value instanceof Phone) {
        return value.format();
    } else if (value === undefined) {
        throw new UnresolvedTagError();
    } else if (Array.isArray(value)) {
        return value.map((item, index) => ({
            ...s,
            item,
            index: index + 1,
            singular: value.length === 1,
            length: value.length,
        }));
    }
    return value;
}

function parser(tag: string) {
    return {
        get: function (s: any) {
            return resolveTag(s, tag);
        },
    };
}

function endOfPart(length: number, index: number, inter: string) {
    if (index + 1 == length) {
        return "";
    } else if (index + 2 == length) {
        return inter;
    } else {
        return ", ";
    }
}

jexl.addTransform(
    "formatSeq",
    (input: any[], format: string, inter: string) => {
        const outputs = input
            .map(
                (line, index) =>
                    format.replace(/\[([^\]]+)\]/g, (value) =>
                        resolveTag(line, value.substring(1, value.length - 1))
                    ) + endOfPart(input.length, index, inter)
            )
            .join("");
        return outputs;
    }
);

function printModule(bulletsSource: Buffer): DXT.Module {
    return {
        name: "Dropsheet Print Module",
        requiredAPIVersion: "3.0.0",
        on(event) {
            if (event == "syncing-zip") {
                // This hack tries to resolve numbering in lists in the word document.
                // If you just repeat the xml for repeated section, the lists have the same
                // id numbers and end up continuing one to the other.
                const bulletsTemplate = new JSZip(bulletsSource);
                let numberingTemplate = new DOMParser().parseFromString(
                    bulletsTemplate.file("word/numbering.xml").asText()
                );

                if (this.zip.file("word/numbering.xml")) {
                    // First thing is we grab the current xml and parse it
                    let documentText = this.zip
                        .file("word/document.xml")
                        .asText();
                    let document = new DOMParser().parseFromString(
                        documentText
                    );
                    let numbersText = this.zip
                        .file("word/numbering.xml")
                        .asText();
                    let numbers = new DOMParser().parseFromString(numbersText);

                    // Word files contain a word/numbering.xml which holds all of the
                    // numbering definitions. Each seperate list needs its own definition
                    const numIds: Dictionary<Element> = {};
                    const numbering = numbers
                        .getElementsByTagName("w:numbering")
                        .item(0)!;

                    const templateNumber = numberingTemplate
                        .getElementsByTagName("w:numbering")
                        .item(0)!;
                    const templateAbstractNumbers =
                        templateNumber.getElementsByTagName("w:abstractNum");
                    for (
                        let index = 0;
                        index < templateAbstractNumbers.length;
                        index++
                    ) {
                        const templateAbstractNumber = templateAbstractNumbers
                            .item(index)!
                            .cloneNode(true) as Element;
                        templateAbstractNumber.setAttribute(
                            "w:abstractNumId",
                            "10" +
                                templateAbstractNumber.getAttribute(
                                    "w:abstractNumId"
                                )
                        );
                        numbering.appendChild(templateAbstractNumber);
                    }

                    const nums = numbers.getElementsByTagName("w:num");
                    // First we record how each one was defined
                    for (let index = 0; index < nums.length; index++) {
                        const num = nums.item(index)!;
                        const numId = num.getAttribute("w:numId")!;
                        numIds[numId] = num;
                    }

                    // Then we delete all the old ones
                    for (let index = nums.length - 1; index >= 0; index--) {
                        const num = nums.item(index)!;
                        numbering.removeChild(num);
                    }

                    const ul = document.createElement("w:num");
                    const ulNumId = document.createElement("w:abstractNumId");
                    ulNumId.setAttribute("w:val", "103");
                    ul.appendChild(ulNumId);
                    numIds["ul"] = ul;

                    const ol = document.createElement("w:num");
                    const olNumId = document.createElement("w:abstractNumId");
                    olNumId.setAttribute("w:val", "102");
                    ol.appendChild(olNumId);
                    numIds["ol"] = ol;

                    // Now we go through the list of reference to these ids
                    let nextNumId = 1;
                    const numPrs = document.getElementsByTagName("w:numPr");
                    for (let index = 0; index < numPrs.length; index++) {
                        const numPr = numPrs.item(index)!;
                        const numId = numPr
                            .getElementsByTagName("w:numId")
                            .item(0)!;

                        const pPr = numPr.parentNode!;
                        const p = pPr.parentNode!;
                        const previousP = p.previousSibling as Element | null;

                        // If there is an immediately previous paragraph, we'll assume it parts of the same list
                        // and thus should use the same id
                        if (previousP) {
                            const previousNumPr = previousP
                                .getElementsByTagName("w:numPr")
                                .item(0) as Element | null;
                            if (previousNumPr) {
                                const previousNumId = previousNumPr
                                    .getElementsByTagName("w:numId")
                                    .item(0)!;
                                numId.setAttribute(
                                    "w:val",
                                    previousNumId.getAttribute("w:val")!
                                );

                                continue;
                            }
                        }

                        // If there was no previous paragraph which used a numbering system
                        // Then we need to generate a new list and put this on it.
                        const oldNumId = numId.getAttribute("w:val")!;
                        // start with a copy of the old definition
                        const newNode = numIds[oldNumId].cloneNode(
                            true
                        ) as Element;

                        // we need to add a lvlOverride element that signals that when this
                        // list is referenced, it should start numbering at 1

                        const lvlOverride =
                            document.createElement("w:lvlOverride");
                        lvlOverride.setAttribute("w:ilvl", "0");
                        const startOverride =
                            document.createElement("w:startOverride");
                        startOverride.setAttribute("w:val", "1");
                        lvlOverride.appendChild(startOverride);
                        newNode.appendChild(lvlOverride);
                        newNode.setAttribute("w:numId", `${nextNumId}`);
                        numId.setAttribute("w:val", `${nextNumId}`);
                        numbering.appendChild(newNode);

                        nextNumId++;
                    }

                    // finally save the newly reconfigured xml
                    this.zip.file(
                        "word/document.xml",
                        new XMLSerializer().serializeToString(document)
                    );
                    this.zip.file(
                        "word/numbering.xml",
                        new XMLSerializer().serializeToString(numbers)
                    );
                }
            }
        },
        set(options) {
            if (options.zip) {
                this.zip = options.zip;
            }
        },
    };
}

async function generatePrint(
    templateName: string,
    templateSource: Promise<Buffer>,
    bulletsSource: Promise<Buffer>,
    data: Promise<any>
): Promise<Buffer> {
    const template = new JSZip(await templateSource);
    const templator = new Docxtemplater();
    templator.attachModule(printModule(await bulletsSource));
    templator.setOptions({
        parser,
        linebreaks: true,
    });
    templator.loadZip(template);
    templator.setData(await data);

    templator.render();
    return templator
        .getZip()
        .generate({ type: "nodebuffer", compression: "DEFLATE" });
}

export async function print(
    context: Context,
    pool: Pool,
    user: UserPermissions,
    printable: Printable,
    extra: string[]
) {
    const templateName = printable.template(extra);

    const sharepointAuth = getSharepointAuth();

    const bulletsSource = sharepointAuth
        .then(({ headers }) => {
            let folder = "Shared Documents/Templates/";
            let filename = "Bullets and Numbering.docx";
            return fetch(
                `https://remdalpr.sharepoint.com/sites/Dropsheet/_api/web/GetFolderByServerRelativeUrl(\'${folder}\')/Files(\'${filename}\')/$value`,
                {
                    headers: {
                        ...headers,
                        Accept: "application/json; odata=verbose",
                    },
                }
            );
        })
        .then(async (response) => {
            if (response.status !== 200) {
                throw new Error(
                    "Print: Bullets and Numbering template not found"
                );
            }
            return response.buffer();
        });

    const templateSource = sharepointAuth
        .then(({ headers }) => {
            let folder = "Shared Documents/Templates/";
            let filename = templateName;
            let slashIndex = filename.lastIndexOf("/");
            if (slashIndex !== -1) {
                folder += filename.substring(0, slashIndex + 1);
                filename = filename.substring(slashIndex + 1);
            }
            return fetch(
                `https://remdalpr.sharepoint.com/sites/Dropsheet/_api/web/GetFolderByServerRelativeUrl(\'${folder}\')/Files(\'${filename}\')/$value`,
                {
                    headers: {
                        ...headers,
                        Accept: "application/json; odata=verbose",
                    },
                }
            );
        })
        .then(async (response) => {
            if (response.status !== 200) {
                throw new Error(
                    "Print: " +
                        printable.template(extra) +
                        " template not found"
                );
            }
            return response.buffer();
        });

    const data = printable.data(
        {
            ...context,
            pool,
            user,
        },
        extra
    );

    const ext = templateName.endsWith(".docx") ? ".docx" : ".xlsx";
    const path = data.then((x) => printable.path && printable.path(x));
    const output = generatePrint(
        templateName,
        templateSource,
        bulletsSource,
        data
    );

    const resolved = await data;

    const result = {
        output,
        name: printable.name(resolved),
        ext,
        body: printable.body && printable.body(resolved),
        target: printable.target && printable.target(resolved),
        path,
    };

    return result;
}

export async function generateDocument(
    pool: Pool,
    context: Context,
    user: UserPermissions,
    template: string,
    parameters: string[],
    sendEmails: boolean
): Promise<GenerateResponse> {
    try {
        let { output, name, body, target, ext, path } = await print(
            context,
            pool,
            user,
            PRINTABLES[template],
            parameters
        );

        name = name.replace(/[~"#%&*:<>?\/\\{|}.]/g, "");

        let targetEmails = sendEmails ? (target || []).filter((x) => x) : [];

        const sharepoint = await getSharepoint();
        const fullPath = (await path)!;

        await sharepoint.createFolder(pathlib.dirname(fullPath));
        await sharepoint.createFolder(fullPath);
        const filename = name + ext;

        const document = await output;

        const m = /Project (\d+)/.exec(fullPath);
        let linkingUrl;
        if (m && UPGRADED_SITES.has(m[1])) {
            linkingUrl = await storeFile(fullPath, filename, document);
        } else {
            linkingUrl = await sharepoint.uploadFile(
                fullPath,
                filename,
                document
            );
        }

        //        await storeFile(fullPath, filename, document)

        for (const to of targetEmails) {
            await sendEmail({
                to: to,
                from: "dropsheet@dropsheet.remdal.com",
                subject: name,
                text: body || ".",
                attachments: [
                    {
                        content: document.toString("base64"),
                        filename: name + ext,
                    },
                ],
            });
        }
        return {
            url: linkingUrl,
            target: targetEmails,
        };
    } catch (error: any) {
        console.log("E", error);
        if (error.properties) {
            return {
                url: undefined,
                target: [],
                error: printErrorResponse(
                    ["", template, ...parameters],
                    error.properties
                ),
            };
        } else {
            throw error;
        }
    }
}

export async function serverPrint(request: Request, response: Response) {
    try {
        const parts = request.path.split("/").map(decodeURIComponent);

        const token = request.query.token;

        const { pool, context } = await databasePool;

        const user = await resolveUser(pool, token as string);

        if (!user) {
            response.send(400);
            return;
        }

        const printable = PRINTABLES[parts[1]];
        if (!printable) {
            response.status(404).send();
        } else {
            try {
                const { output, name, path, ext } = await print(
                    context,
                    pool,
                    user,
                    printable,
                    parts.slice(2)
                );

                const pathR = await path;

                if (pathR) {
                    const sharepoint = await getSharepoint();
                    await sharepoint.createFolder(pathR);
                    const files = await sharepoint.listFolder(pathR);
                    let version = 0;
                    while (true) {
                        const filename =
                            version == 0
                                ? name + ext
                                : `${name} (version ${version + 1})` + ext;

                        if (files.indexOf(filename) === -1) {
                            const linkingUrl = await sharepoint.uploadFile(
                                pathR,
                                filename,
                                await output
                            );
                            response.send("ms-word:ofe|u|" + linkingUrl);
                            return;
                        } else {
                            version += 1;
                        }
                    }
                }

                response.set(
                    "content-type",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                );
                response.set(
                    "content-disposition",
                    'attachment; filename="' + name + ext
                );

                response.send(await output);
            } catch (error: any) {
                if (error.properties) {
                    response
                        .status(400)
                        .send(printErrorResponse(parts, error.properties));
                    return;
                } else {
                    throw error;
                }
            }
        }
    } catch (error) {
        console.error(error);
        Sentry.captureException(error);
        response.status(500).send();
    }
}
