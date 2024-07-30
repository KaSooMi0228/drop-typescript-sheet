import { Request, Response } from "express";
import msal from "@azure/msal-node";
import { readFileSync } from "fs";
import { databasePool } from "../clay/server/databasePool";
import { databaseDecode } from "../clay/server/readRecord";
import { JSONToAddress, calcAddressLineFormatted } from "../app/address";
import * as nunjucks from "nunjucks";
nunjucks.configure("templates", { autoescape: true });

const cryptoProvider = new msal.CryptoProvider();

const application = new msal.ConfidentialClientApplication({
  auth: {
    clientId: "2234d179-8d4e-4ebb-9edc-9c6520861caf",
    authority:
      "https://login.microsoftonline.com/28be5def-b564-421d-a9b8-3c2cd9d333d3",
    clientCertificate: {
      thumbprint: "711E7FE0916A7AE9BE77DD9DC5EDD4A5F2913CF0",
      privateKey: readFileSync("keys/dropsheet.key", "ascii"),
    },
  },
});

export async function serveProjectListPost(
  request: Request,
  response: Response
) {
  const token = await application.acquireTokenByCode(
    {
      code: request.body.code,
      scopes: [],
      redirectUri: "https://dropsheet.remdal.com/projects",
      // @ts-expect-error
      codeVerifier: request.session.verifier,
    },
    request.body
  );
  let username = token.account!.username;
  if (username === "winstone@remdal.com") {
    username = "winstonewert@gmail.com";
  }

  const { pool, context } = await databasePool;

  const { rows } = await pool.query({
    text: `select distinct on (project_number) project_number, projects.site_address from dropsheet_views.projects
join lateral unnest(projects.personnel) as person ON TRUE
join users on users.id = person.user
where users.account_email = $1
and projects.active
order by project_number`,
    values: [username],
  });

  const projects = rows.map((row) => ({
    project_number: row.project_number,
    address: calcAddressLineFormatted(
      JSONToAddress(
        databaseDecode(
          context,
          context.metas["Project"].fields["siteAddress"],
          row.site_address
        ) as any
      )
    ),
  }));

  console.log(projects);

  response.send(
    nunjucks.render("project-list.html", {
      projects,
    })
  );
}

export async function serveProjectList(request: Request, response: Response) {
  const { verifier, challenge } = await cryptoProvider.generatePkceCodes();

  // @ts-expect-error
  request.session.verifier = verifier;

  const url = await application.getAuthCodeUrl({
    responseMode: msal.ResponseMode.FORM_POST,
    codeChallenge: challenge,
    codeChallengeMethod: "S256",
    scopes: [],
    redirectUri: "https://dropsheet.remdal.com/projects",
  });

  response.redirect(url);
}
