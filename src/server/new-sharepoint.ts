import "@pnp/graph/users";
import { SPDefault } from "@pnp/nodejs";
import { HttpRequestError } from "@pnp/queryable";
import { spfi, spPost, SPQueryable } from "@pnp/sp";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/navigation";
import "@pnp/sp/security/item";
import "@pnp/sp/security/list";
import "@pnp/sp/security/web";
import "@pnp/sp/site-designs";
import "@pnp/sp/site-groups/web";
import "@pnp/sp/site-users/web";
import "@pnp/sp/sites";
import "@pnp/sp/webs";

import { body } from "@pnp/queryable";

import { readFileSync } from "fs";
import {
    ROLE_ESTIMATOR,
    ROLE_OBSERVER,
    ROLE_PROJECT_MANAGER,
    ROLE_SERVICE_REPRESENTATIVE,
} from "../app/user/table";
import { databasePool } from "../clay/server/databasePool";
import { rstr, select, str } from "../clay/server/squel";
import { acquireProjectFolder } from "./sharepoint";
const configuration = {
    auth: {
        clientId: "2234d179-8d4e-4ebb-9edc-9c6520861caf",
        authority:
            "https://login.microsoftonline.com/28be5def-b564-421d-a9b8-3c2cd9d333d3",
        clientCertificate: {
            thumbprint: "711E7FE0916A7AE9BE77DD9DC5EDD4A5F2913CF0",
            privateKey: readFileSync("keys/dropsheet.key", "ascii"),
        },
    },
};

const spConfig = SPDefault({
    msal: {
        config: configuration,
        scopes: ["https://remdalpr.sharepoint.com/.default"],
    },
});

const sp = spfi("https://remdalpr.sharepoint.com/").using(spConfig);

function isProduction() {
    return true;
    return process.env.NODE_ENV === "production";
}
type ProjectInformation = {
    cfs: string[];
    id: string;
    line1: string;
    city: string;
    province: string;
    postal: string;
    has_project_award_date: boolean;
};

function determineProjectDescription(
    number: string,
    information: ProjectInformation
) {
    return `Project ${number} - ${information.line1}`
        .trimEnd()
        .replace(/[#%\*:<>\?\/\\"'|]/g, " ");
}

const CF_SUB_FOLDERS = {
    "01 - SCOPE, SCH + NOTICES": [
        "Construction Sch",
        "IFC",
        "Notices",
        "Permits",
        "Workflow Process",
    ],
    "02 - DAILY RECORDS": ["Logbooks", "Timesheets"],
    "03 - SAFETY": [
        "Hazmat Reports",
        "Caution Cards",
        "Fall Protection",
        "Toolbox Talks",
    ],
    "04 - PHOTOS": [],
    "05 - INV + EXTRAS": ["T&M", "Unit Rate Work", "Job Cost Reports"],
    "06 - SVRS + MINUTES": [],
};

export async function reapplyDesigns(project_number: string) {
    const siteRelativeUrl = `/sites/${
        isProduction() ? "project" : "dev"
    }${project_number}`;

    const siteUrl = `https://remdalpr.sharepoint.com` + siteRelativeUrl;

    for (const design of [
        "4662ee86-32f1-4fe5-9363-f9357fb6f525",
        "0490504d-2d4d-4697-aef3-697c7f5fec9f",
    ]) {
        await sp.siteDesigns.applySiteDesign(design, siteUrl);
    }
}

export async function ensureProjectFolder(project_number: string) {
    const { pool, context } = await databasePool;
    const projectInformation = await pool.query(
        select()
            .from(rstr("dropsheet_views.projects"))
            .where("project_number = ?", project_number)
            .field("id")
            .field(
                str("project_award_date is not null"),
                "has_project_award_date"
            )
            .field(str("(projects.site_address).line1"))
            .field(str("(projects.site_address).city"))
            .field(str("(projects.site_address).province"))
            .field(str("(projects.site_address).postal"))
            .field(
                str(
                    "(select array_agg(json_build_object('code', code, 'email', account_email)) from unnest(projects.personnel) x join users on users.id = x.user where x.role = 'b0f6ddd1-36cc-436c-835e-08359b719eea')"
                ),
                "cfs"
            )
            .field(
                str(
                    `(select array_agg(distinct account_email) from unnest(projects.personnel) x join users on users.id = x.user where x.role in ?)`,
                    [ROLE_PROJECT_MANAGER, ROLE_ESTIMATOR, ROLE_OBSERVER]
                ),
                "pms"
            )
            .field(
                str(
                    `select array_agg(distinct account_email) from users where ? = ANY(roles)`,
                    ROLE_SERVICE_REPRESENTATIVE
                ),
                "srs"
            )
            .field(
                str(
                    `select array(select users.account_email from unnest(description_categories) x join roles on 'Inbox-show-unassigned-' || x = ANY(roles.permissions) join users on roles.id = ANY(users.roles))`
                ),
                "leaders"
            )
            .toParam()
    );

    if (projectInformation.rows.length == 0) {
        throw new Error("Project " + project_number + " not found");
    }

    const information = projectInformation.rows[0];

    const siteRelativeUrl = `/sites/${
        isProduction() ? "project" : "dev"
    }${project_number}`;

    const siteUrl = `https://remdalpr.sharepoint.com` + siteRelativeUrl;

    if (!(await sp.site.exists(siteUrl))) {
        await sp.site.createCommunicationSiteFromProps({
            Url: siteUrl,
            WebTemplate: "STS#3",
            Owner: isProduction()
                ? "c:0t.c|tenant|baa596ab-754e-400e-87f6-90fb9a169790"
                : "winstone@remdal.com",
            Title: determineProjectDescription(project_number, information),
        });

        for (const design of [
            "4662ee86-32f1-4fe5-9363-f9357fb6f525",
            "0490504d-2d4d-4697-aef3-697c7f5fec9f",
        ]) {
            await sp.siteDesigns.applySiteDesign(design, siteUrl);
        }
    }

    const site = spfi(siteUrl).using(spConfig);

    async function applyGroup(id: number, members: string[]) {
        console.log("AG", id, members);
        const siteGroup = site.web.siteGroups.getById(id);
        const users = await siteGroup.users();
        for (const pm of members) {
            if (pm === "winstonewert@gmail.com") {
                continue;
            }
            const user = users.find((user) => user.UserPrincipalName === pm);
            if (!user) {
                const spUser = await sp.web.ensureUser(pm);
                await spPost(
                    SPQueryable(siteGroup, "users"),
                    body({
                        LoginName: spUser.data.LoginName,
                    })
                );
            }
        }
        for (const user of users) {
            const pm = members.find(
                (x: string) => x === user.UserPrincipalName
            );
            if (!pm && !user.IsSiteAdmin && user.UserPrincipalName !== null) {
                await spPost(
                    SPQueryable(siteGroup, "users/removeByID(" + user.Id + ")")
                );
            }
        }
    }
    await applyGroup(3, [...information.leaders, "winstone@remdal.com"]);
    await applyGroup(5, [...information.pms, ...information.srs]);

    const documentsLibrary = site.web.getList(
        siteRelativeUrl + "/Shared Documents"
    ).rootFolder;
    const currentFolders = new Set(
        (await documentsLibrary.folders()).map((x) => x.Name)
    );

    async function makeDocFolder(name: string) {
        if (!currentFolders.has(name)) {
            await site.web.folders.addUsingPath(
                siteRelativeUrl + "/Shared Documents/" + name
            );
        }
    }
    await makeDocFolder("01 - Submission");
    await makeDocFolder("02 - Photos");
    if (information.has_project_award_date) {
        await makeDocFolder("04 - Contract Docs & Submittals");
        await makeDocFolder("05 - Invoicing & JCR");
        await makeDocFolder("06 - Warranty");
    }

    const listTitlesToIds = Object.fromEntries(
        (await site.web.lists()).map((x) => [x.Title, x.Id])
    );

    if (information.cfs) {
        for (const cf of information.cfs) {
            if (!(cf.code in listTitlesToIds)) {
                const result = await site.web.lists.add(
                    cf.code,
                    undefined,
                    101
                );
                await result.list.breakRoleInheritance(true);
                if (cf.email) {
                    const user = await site.web.ensureUser(cf.email);
                    result.list.roleAssignments.add(user.data.Id, 1073741827);
                }
                await site.web.navigation.quicklaunch.add(
                    cf.code,
                    siteUrl + "/" + cf.code
                );
            }

            const cfList = site.web.lists.getByTitle(cf.code);
            const folders = new Set(
                (await cfList.rootFolder.folders()).map((x) => x.Name)
            );
            for (const [folder, subfolders] of Object.entries(CF_SUB_FOLDERS)) {
                if (!folders.has(folder)) {
                    await site.web.folders.addUsingPath(
                        siteRelativeUrl + "/" + cf.code + "/" + folder
                    );
                }
                const currentSubFolders = new Set(
                    (
                        await site.web
                            .getFolderByServerRelativePath(
                                siteRelativeUrl + "/" + cf.code + "/" + folder
                            )
                            .folders()
                    ).map((x) => x.Name)
                );
                for (const subfolder of subfolders) {
                    if (!currentSubFolders.has(subfolder)) {
                        await site.web.folders.addUsingPath(
                            siteRelativeUrl +
                                "/" +
                                cf.code +
                                "/" +
                                folder +
                                "/" +
                                subfolder
                        );
                    }
                }
            }
        }
    }
    return {
        targetSite: site,
        cfs: new Set<string>(information.cfs.map((x: any) => x.code as string)),
    };
}

export async function storeFile(
    folder: string,
    fullName: string,
    document: string | Buffer
) {
    const parts = folder.split("/");
    let staging;
    let projectFolder;
    let subfolder;
    if (parts[1] === "Staging") {
        staging = true;
        projectFolder = parts[3];
        subfolder = parts[4];
    } else {
        staging = false;
        projectFolder = parts[2];
        subfolder = parts[3];
    }

    const projectNumber = /Project (\d+) -/.exec(projectFolder)![1];
    let library;

    if (subfolder.endsWith(" - Dropsheet Forms")) {
        library = "Dropsheet Documents";
    } else if (subfolder.startsWith("07 - ")) {
        library = subfolder.split("-")[1].trim();
    } else {
        return;
    }

    const relativeUrl = `/sites/${
        !staging ? "project" : "dev"
    }${projectNumber}`;
    const siteUrl = `https://remdalpr.sharepoint.com` + relativeUrl;

    const site = spfi(siteUrl).using(spConfig);
    const result = await site.web
        .getFolderByServerRelativePath(relativeUrl + "/" + library)
        .files.addUsingPath(fullName, document, { Overwrite: true });

    const url = new URL(result.data.LinkingUrl);
    return url.origin + url.pathname;
}

export function evaluateTarget(currentPath: string, cfs: Set<string>) {
    const parts = currentPath.split("/").slice(3);
    let staging;
    let projectFolder;
    let subfolder;
    let rest;
    if (parts[1] === "Staging") {
        staging = true;
        projectFolder = parts[3];
        subfolder = parts[4];
        rest = parts.slice(5);
    } else {
        staging = false;
        projectFolder = parts[2];
        subfolder = parts[3];
        rest = parts.slice(4);
    }

    const projectNumber = /Project (\d+) -/.exec(projectFolder)![1];
    let library;
    let path;

    if (subfolder.endsWith(" - Dropsheet Forms")) {
        library = "Dropsheet Documents";
        path = rest.join("/");
    } else if (subfolder.startsWith("07 - ")) {
        library = subfolder.split("-")[1].trim();
        if (cfs.has(library)) {
            path = rest.join("/");
        } else {
            library = "Shared Documents";
            path = subfolder + "/" + rest.join("/");
        }
    } else if (rest.length == 0) {
        library = "Shared Documents";
        path = subfolder;
    } else {
        library = "Shared Documents";
        path = subfolder + "/" + rest.join("/");
    }
    const siteUrl = `/sites/${!staging ? "project" : "dev"}${projectNumber}`;

    return siteUrl + "/" + library + "/" + path;
}

export async function transferDocuments(project_number: string) {
    const { targetSite, cfs } = await ensureProjectFolder(project_number);
    const dropsheetSite = spfi(
        "https://remdalpr.sharepoint.com/sites/Dropsheet"
    ).using(spConfig);

    const oldFolder = await acquireProjectFolder(project_number);

    const tried = new Set<string>();

    const recurse = async (current: string) => {
        const folder = dropsheetSite.web.getFolderByServerRelativePath(current);
        const subfolders = await folder.folders();

        for (const subfolder of subfolders) {
            await recurse(current + "/" + subfolder.Name);
        }

        for (const file of await folder.files()) {
            const target = evaluateTarget(file.ServerRelativeUrl, cfs);
            console.log("SOURCE", file.ServerRelativeUrl);
            const parts = target.split("/");
            for (let index = 5; index < parts.length; index++) {
                const d = parts.slice(0, index).join("/");
                if (!tried.has(d)) {
                    tried.add(d);
                    try {
                        await targetSite.web.folders.addUsingPath(d);
                    } catch (error) {}
                }
            }

            try {
                await folder.files
                    .getByUrl(file.Name)
                    .copyByPath(target, false);
            } catch (error) {
                if (error instanceof HttpRequestError) {
                    const response = await error.response.json();
                    if (
                        response["odata.error"].code ===
                        "-2130575257, Microsoft.SharePoint.SPException"
                    ) {
                        console.log("Skipping", target);
                    } else {
                        console.log("ERROR", target);
                        throw error;
                    }
                } else {
                    console.log("ERROR", target);
                    throw error;
                }
            }
        }
    };

    await recurse(oldFolder);

    //  throw new Error("Working");
}
