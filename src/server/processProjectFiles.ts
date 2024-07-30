import * as Sentry from "@sentry/node";
import { Request, Response } from "express";
import { ensureProjectFolder } from "./new-sharepoint";
import { acquireProjectFolder } from "./sharepoint";

export const UPGRADED_SITES = new Set([
    "44888",
    "47508",
    "47996",
    "48083",
    "46942",
    "47988",
    "47046",
    "48140",
    "46905",
]);

export default async function processProjectFiles(
    request: Request,
    response: Response
) {
    try {
        const projectNumber = request.params.projectNumber;
        if (!/^\d+$/.test(projectNumber)) {
            response.sendStatus(400);
            return;
        }

        if (UPGRADED_SITES.has(projectNumber)) {
            await ensureProjectFolder(projectNumber);
            const url =
                "https://remdalpr.sharepoint.com/sites/project" + projectNumber;

            response.redirect(url);
        } else {
            const folder = await acquireProjectFolder(projectNumber);

            const url =
                "https://remdalpr.sharepoint.com/sites/Dropsheet/" +
                encodeURI(folder);

            response.redirect(url);
        }
    } catch (error) {
        console.error(error);
        Sentry.captureException(error);
        response.status(500).send();
    }
}
