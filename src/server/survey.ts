import * as Sentry from "@sentry/node";
import { Request, Response } from "express";
import { fromPairs } from "lodash";
import * as nunjucks from "nunjucks";
import { calcAddressLineFormatted } from "../app/address";
import { CustomerSurveyJSON } from "../app/project/customer-survey/table";
import { JSONToProject } from "../app/project/table";
import { databasePool } from "../clay/server/databasePool";
import patchRecord from "../clay/server/patchRecord";
import readRecord from "../clay/server/readRecord";
import { genUUID } from "../clay/uuid";
import { ROOT_USER } from "./root-user";

nunjucks.configure("templates", { autoescape: true });

export async function serveSurvey(request: Request, response: Response) {
    try {
        const { pool, context } = await databasePool;
        const client = await pool.connect();
        try {
            const { record } = (await readRecord(
                client,
                context,
                ROOT_USER,
                "CustomerSurvey",
                request.params.id
            )) as { record: CustomerSurveyJSON };

            if (record === null) {
                response.sendStatus(404);
            } else {
                const project = await readRecord(
                    client,
                    context,
                    ROOT_USER,
                    "Project",
                    record.project!
                );

                if (project.record === null) {
                    response.sendStatus(404);
                } else {
                    const parsedProject = JSONToProject(project.record as any);
                    const addresses = [
                        parsedProject.siteAddress,
                        ...parsedProject.additionalSiteAddresses,
                    ].map(calcAddressLineFormatted);

                    response.send(
                        nunjucks.render("survey.html", {
                            survey: record,
                            project: project.record,
                            email: record.customerEmail || record.contact.email,
                            addresses,
                        })
                    );
                }
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        Sentry.captureException(error);
        response.status(500).send();
    }
}

export async function serveSurveyPresave(request: Request, response: Response) {
    try {
        const { pool, context } = await databasePool;
        const client = await pool.connect();
        try {
            const { record } = (await readRecord(
                client,
                context,
                ROOT_USER,
                "CustomerSurvey",
                request.body.id
            )) as { record: CustomerSurveyJSON };

            if (record === null) {
                response.sendStatus(404);
            } else if (record.date !== null) {
                response.sendStatus(200);
            } else {
                const patch = {
                    customerEmail: [
                        record.customerEmail,
                        request.body.email || "",
                    ],
                    sections: {
                        _t: "a",
                        ...fromPairs(
                            record.sections.map((section, index) => [
                                index,
                                {
                                    questions: {
                                        _t: "a",
                                        ...fromPairs(
                                            section.questions.map(
                                                (question, index) => [
                                                    index,
                                                    {
                                                        selectedAnswer: [
                                                            question.selectedAnswer,
                                                            request.body[
                                                                question.id
                                                            ] || null,
                                                        ],
                                                        comment: [
                                                            question.comment,
                                                            request.body[
                                                                question.id +
                                                                    "-txt"
                                                            ] || "",
                                                        ],
                                                    },
                                                ]
                                            )
                                        ),
                                    },
                                },
                            ])
                        ),
                    },
                };

                await patchRecord({
                    client,
                    context,
                    tableName: "CustomerSurvey",
                    id: request.body.id,
                    patchIds: [genUUID()],
                    patches: [patch],
                    user: ROOT_USER,
                    form: "Customer Survey",
                    dateTime: new Date(),
                    system: false,
                    override: false,
                });

                response.sendStatus(200);
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        Sentry.captureException(error);
        response.status(500).send();
    }
}

export async function serveSurveySave(request: Request, response: Response) {
    try {
        const { pool, context } = await databasePool;
        const client = await pool.connect();
        try {
            const { record } = (await readRecord(
                client,
                context,
                ROOT_USER,
                "CustomerSurvey",
                request.body.id
            )) as { record: CustomerSurveyJSON };

            if (record === null) {
                response.sendStatus(404);
            } else {
                const patch = {
                    date: [record.date, new Date().toISOString()],
                    customerEmail: [record.customerEmail, request.body.email],
                    sections: {
                        _t: "a",
                        ...fromPairs(
                            record.sections.map((section, index) => [
                                index,
                                {
                                    questions: {
                                        _t: "a",
                                        ...fromPairs(
                                            section.questions.map(
                                                (question, index) => [
                                                    index,
                                                    {
                                                        selectedAnswer: [
                                                            question.selectedAnswer,
                                                            request.body[
                                                                question.id
                                                            ] || null,
                                                        ],
                                                        comment: [
                                                            question.comment,
                                                            request.body[
                                                                question.id +
                                                                    "-txt"
                                                            ] || "",
                                                        ],
                                                    },
                                                ]
                                            )
                                        ),
                                    },
                                },
                            ])
                        ),
                    },
                };

                await patchRecord({
                    client,
                    context,
                    tableName: "CustomerSurvey",
                    id: request.body.id,
                    patchIds: [genUUID()],
                    patches: [patch],
                    user: ROOT_USER,
                    form: "Customer Survey",
                    dateTime: new Date(),
                    system: false,
                    override: false,
                });

                response.send(nunjucks.render("thanks.html"));
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        Sentry.captureException(error);
        response.status(500).send();
    }
}
