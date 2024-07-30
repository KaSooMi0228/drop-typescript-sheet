import SendGrid from "@sendgrid/mail";
import * as Sentry from "@sentry/node";
import { addDays } from "date-fns";
import {
    format as formatDate,
    utcToZonedTime,
    zonedTimeToUtc,
} from "date-fns-tz";
import { Request, Response } from "express";
import sanitize_filename from "sanitize-filename";
import { promisify } from "util";
import { ContactFollowUpJSON } from "../app/contact/table";
import { ProjectEmailJSON } from "../app/project/email/table";
import { LocalDate } from "../clay/LocalDate";
import { databasePool } from "../clay/server/databasePool";
import patchRecord from "../clay/server/patchRecord";
import queryTable from "../clay/server/queryTable";
import { select, str } from "../clay/server/squel";
import storeRecord from "../clay/server/storeRecord";
import { genUUID } from "../clay/uuid";
import { ROOT_USER } from "./root-user";
import { acquireProjectFolder, getSharepoint } from "./sharepoint";
const emlformat = require("./eml-format");

async function handleEmail(request: Request) {
    const parsed = JSON.parse(request.body.envelope);
    for (const address of parsed.to) {
        if (address == "dropsheet@dropsheet.remdal.com") {
            continue;
        }

        const match =
            /^(project(?:-update)?(?:-follow-up)?-)?(\d+)@dropsheet.remdal.com$/.exec(
                address
            );

        const contact_match = /^contact-(\d+)@dropsheet.remdal.com$/.exec(
            address
        );
        console.log("Target: " + address, match, contact_match);
        if (match) {
            const projectNumber = match[2];
            const update = match[1] === "project-update-";
            const sharepoint = await getSharepoint();

            const pacificTime = { timeZone: "America/Vancouver" };
            const now = utcToZonedTime(
                zonedTimeToUtc(
                    new Date(),
                    Intl.DateTimeFormat().resolvedOptions().timeZone
                ),
                pacificTime.timeZone
            );

            const { pool, context } = await databasePool;
            const project = pool.query(
                select()
                    .from("projects")
                    .where("project_number = ?", projectNumber)
                    .field("id")
                    .field(
                        str(
                            "pending_quote_history[array_upper(pending_quote_history,1)].landing_likelihood"
                        ),
                        "last_landing_likehood"
                    )
                    .toParam()
            );
            const user = pool.query(
                select()
                    .from("users")
                    .where(
                        "account_email = ? or account_email = ?",
                        request.body.from,
                        request.body.from.substring(
                            request.body.from.lastIndexOf("<") + 1,
                            request.body.from.lastIndexOf(">")
                        )
                    )
                    .field("id")
                    .toParam()
            );

            const userId = (await user).rows[0]?.id || null;
            const projectId = (await project).rows[0]?.id || null;
            const lastLandingLikehood =
                (await project).rows[0]?.last_landing_likehood || null;

            if (userId === null) {
                // Don't record e-mails from unknown senders
                return;
            }

            if (!projectId) {
                const message = {
                    to: request.body.from,
                    from: "dropsheet@dropsheet.remdal.com",
                    subject: "Undeliverable " + request.body.subject,
                    text:
                        "Mail was not delivered to unrecognized address: " +
                        address,
                };
                await SendGrid.send(message);
            } else {
                const folder = await acquireProjectFolder(projectNumber);
                const filename = sanitize_filename(
                    request.body.subject +
                        " " +
                        formatDate(now, "Y-M-d p", pacificTime)
                );
                const parsed = await promisify(emlformat.read)(
                    request.body.email
                );
                const rebuilt = await promisify(emlformat.build)(parsed);

                await sharepoint.uploadFile(folder, `${filename}.eml`, rebuilt);

                const email: ProjectEmailJSON = {
                    id: genUUID(),
                    recordVersion: null,
                    sender: userId,
                    update,
                    project: projectId,
                    subject: request.body.subject,
                    addedDateTime: null,
                };

                const client = await pool.connect();
                try {
                    if (match[1] === "project-follow-up-") {
                        const href = `https://remdalpr.sharepoint.com/sites/Dropsheet/Shared%20Documents/Projects/Project%20${projectNumber}/${
                            encodeURIComponent(filename) + ".eml"
                        }`;

                        await patchRecord({
                            client,
                            context,
                            tableName: "Project",
                            id: projectId,
                            user: {
                                id: userId,
                                email: "",
                                permissions: ["Project-read", "Project-write"],
                            },
                            form: "email",
                            dateTime: new Date(),
                            override: false,
                            patches: [
                                {
                                    pendingQuoteHistory: {
                                        _t: "a",
                                        append: {
                                            landingLikelihood:
                                                lastLandingLikehood,
                                            date: new Date().toISOString(),
                                            followupDate: new LocalDate(
                                                addDays(new Date(), 14)
                                            ).toString(),
                                            message: `<p>Follow-up Email Sent<p><p><a href="${href}">Email</a></p>`,
                                            user: userId,
                                        },
                                    },
                                },
                            ],
                            patchIds: [genUUID()],
                        });
                    }

                    await storeRecord({
                        client,
                        context,
                        tableName: "ProjectEmail",
                        user: {
                            id: userId,
                            email: "",
                            permissions: [
                                "ProjectEmail-write",
                                "ProjectEmail-new",
                                "ProjectEmail-read",
                            ],
                        },
                        record: email,
                        form: "email",
                        dateTime: new Date(),
                    });
                } finally {
                    client.release();
                }
            }
        } else if (contact_match) {
            const contactNumber = contact_match[1];
            const sharepoint = await getSharepoint();

            const pacificTime = { timeZone: "America/Vancouver" };
            const now = utcToZonedTime(
                zonedTimeToUtc(
                    new Date(),
                    Intl.DateTimeFormat().resolvedOptions().timeZone
                ),
                pacificTime.timeZone
            );

            const { pool, context } = await databasePool;
            const user = pool.query(
                select()
                    .from("users")
                    .where(
                        "account_email = ? or account_email = ?",
                        request.body.from,
                        request.body.from.substring(
                            request.body.from.lastIndexOf("<") + 1,
                            request.body.from.lastIndexOf(">")
                        )
                    )
                    .field("id")
                    .toParam()
            );

            const client = await pool.connect();
            let contact;
            try {
                contact = await queryTable({
                    client,
                    context,
                    tableName: "Contact",
                    columns: ["id", "followUps"],
                    sorts: [],
                    filters: [
                        {
                            column: "contactNumber",
                            filter: {
                                equal: contactNumber,
                            },
                        },
                    ],
                    user: ROOT_USER,
                });
            } finally {
                client.release();
            }

            const userId = (await user).rows[0]?.id || null;
            const contactId: string | null =
                (contact.rows[0][0] as string) || null;
            const contactFollowUps = contact
                .rows[0][1] as ContactFollowUpJSON[];

            const makeDiff = (
                followsUp: ContactFollowUpJSON[],
                href: string
            ) => {
                if (
                    followsUp.length > 0 &&
                    followsUp[followsUp.length - 1].actual == null
                ) {
                    const original = followsUp[followsUp.length - 1];
                    return {
                        _t: "a",
                        ["" + (followsUp.length - 1)]: {
                            actual: [null, new Date().toISOString()],
                            user: [original.user, userId],
                            message: [
                                original.message,
                                `<p>Email Sent<p><p><a href="${href}">Email</a></p>`,
                            ],
                            activity: [
                                original.activity,
                                "52d7a6f0-a20d-4a20-9027-ad023f3b044c",
                            ],
                        },
                    };
                } else {
                    return {
                        _t: "a",
                        append: {
                            id: genUUID(),
                            scheduled: null,
                            actual: new Date().toISOString(),
                            campaign: null,
                            user: userId,
                            activity: "52d7a6f0-a20d-4a20-9027-ad023f3b044c",
                            message: `<p>Email Sent<p><p><a href="${href}">Email</a></p>`,
                        },
                    };
                }
            };

            if (!contactId) {
                const message = {
                    to: request.body.from,
                    from: "dropsheet@dropsheet.remdal.com",
                    subject: "Undeliverable " + request.body.subject,
                    text:
                        "Mail was not delivered to unrecognized address: " +
                        address,
                };
                await SendGrid.send(message);
            } else {
                await sharepoint.createFolder(
                    "Shared Documents/Contacts/Contact " + contactNumber
                );
                const filename = sanitize_filename(
                    request.body.subject +
                        " " +
                        formatDate(now, "Y-M-d p", pacificTime)
                );
                const parsed = await promisify(emlformat.read)(
                    request.body.email
                );
                const rebuilt = await promisify(emlformat.build)(parsed);

                await sharepoint.uploadFile(
                    `Shared Documents/Contacts/Contact ${contactNumber}/`,
                    `${filename}.eml`,
                    rebuilt
                );

                const client = await pool.connect();
                try {
                    const href = `https://remdalpr.sharepoint.com/sites/Dropsheet/Shared%20Documents/Contacts/Contact%20${contactNumber}/${
                        encodeURIComponent(filename) + ".eml"
                    }`;

                    await patchRecord({
                        client,
                        context,
                        tableName: "Contact",
                        id: contactId,
                        user: {
                            id: userId,
                            email: "",
                            permissions: ["Contact-read", "Contact-write"],
                        },
                        form: "email",
                        dateTime: new Date(),
                        override: false,
                        patches: [
                            {
                                followUps: makeDiff(contactFollowUps, href),
                            },
                        ],
                        patchIds: [genUUID()],
                    });
                } finally {
                    client.release();
                }
            }
        } else {
            const message = {
                to: request.body.from,
                from: "dropsheet@dropsheet.remdal.com",
                subject: "Undeliverable " + request.body.subject,
                text:
                    "Mail was not delivered to unrecognized address type 1: " +
                    address,
            };

            await SendGrid.send(message);
        }
    }
}

export default async function processEmail(
    request: Request,
    response: Response
) {
    try {
        try {
            await handleEmail(request);
            response.send(".");
        } catch (error) {
            console.error(error);
            Sentry.captureException(error, {
                contexts: {
                    details: {
                        message: request.body.email,
                        envelope: request.body.envelope,
                        body: (error as any)?.response?.body,
                    },
                },
            });
            const message = {
                to: request.body.from,
                from: "dropsheet@dropsheet.remdal.com",
                subject: "Undeliverable " + request.body.subject,
                text: "There was an error processing your e-mail.",
            };

            await SendGrid.send(message);

            response.status(200).send();
        }
    } catch (error) {
        console.error(error);
        Sentry.captureException(error);
        response.status(500).send();
    }
}
