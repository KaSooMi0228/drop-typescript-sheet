import * as Sentry from "@sentry/node";
import session from "express-session";
import bodyParser from "body-parser";
const htmlToFormattedText = require("html-to-formatted-text");

import express, { Request, Response } from "express";
import FileType from "file-type";
import { OAuth2Client } from "google-auth-library";
import * as http from "http";
import multer from "multer";
import * as url from "url";
import { writeHeapSnapshot } from "v8";
import * as WebSocket from "ws";
import { NoticeDetail } from "../app/notice/table";
import {
  calcProjectStage,
  JSONToProject,
  ProjectJSON,
} from "../app/project/table";
import { UserPermissions } from "../clay/server/api";
import { databasePool } from "../clay/server/databasePool";
import { ServerError } from "../clay/server/error";
import { EVENTS } from "../clay/server/events";
import processApi from "../clay/server/processApi";
import { select } from "../clay/server/squel";
import storeRecord from "../clay/server/storeRecord";
import { genUUID } from "../clay/uuid";
import { OAUTH_CLIENT_ID } from "../keys";
import "../sentry-node";
import { serverPrint } from "./print";
import processEmail from "./processEmail";
import { processOffline } from "./processOffline";
import processProjectFiles from "./processProjectFiles";
import { readUser, resolveUserName } from "./resolve-user";
import { recordMessage } from "./sqlite";
import { serveSurvey, serveSurveyPresave, serveSurveySave } from "./survey";
import { serveProjectList, serveProjectListPost } from "./project-list";

const oauth2Client = new OAuth2Client(OAUTH_CLIENT_ID);

const app = express();

if (process.env.NODE_ENV === "production") {
  app.use(Sentry.Handlers.requestHandler());
}

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ noServer: true });

async function processMessage(
  ws: WebSocket,
  message: any,
  user: UserPermissions,
  session: string
) {
  if (process.env.SLOW_MODE) {
    await new Promise((resolve, _reject) => {
      setTimeout(resolve, 1000);
    });
  }

  const startProcessing = new Date().getTime();
  let result = undefined;
  let sent = false;
  let got_error: Error | null = null;

  try {
    const { pool, context } = await databasePool;
    if (message.request?.type === "OFFLINE") {
      result = {
        id: "cache",
        type: "RESPONSE",
        response: await processOffline(pool, context, user),
      };
    } else {
      result = await processApi(pool, context, message, user);
    }

    if (ws.readyState == WebSocket.OPEN) {
      ws.send(JSON.stringify(result));
      sent = true;
    }
  } catch (error) {
    got_error = error as Error;
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
    Sentry.captureException(error, {
      contexts: {
        details: {
          message: JSON.stringify(message),
          ...(error as any),
        },
      },
    });
    if (ws.readyState == WebSocket.OPEN) {
      if (error instanceof ServerError) {
        ws.send(
          JSON.stringify({
            type: "ERROR",
            ...error.detail,
            id: message.id,
          })
        );
      } else {
        ws.send(
          JSON.stringify({
            type: "ERROR",
            status: "UNKNOWN_ERROR",
            id: message.id,
          })
        );
      }
    }
  }

  recordMessage(
    user.id,
    session,
    new Date().getTime() - startProcessing,
    message,
    result,
    sent,
    got_error
  );
}

class Connection {
  ws: WebSocket;
  username: string | null;
  user: UserPermissions | null;
  pending: any[];
  userChange: () => void;
  interval: any;
  sessionId: string;

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.username = null;
    this.user = null;
    this.pending = [];
    this.sessionId = genUUID();
    ws.on("message", this.message.bind(this));
    ws.on("close", this.close.bind(this));

    this.userChange = () => {
      this.updateUser();
    };
    EVENTS.addListener("User", this.userChange);
    EVENTS.addListener("Role", this.userChange);

    this.interval = setInterval(this.heartbeat.bind(this), 10 * 1000);
  }

  heartbeat() {
    if (this.ws.readyState == WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "TICK",
        })
      );
    }
  }

  close() {
    clearInterval(this.interval);
    EVENTS.removeListener("User", this.userChange);
    EVENTS.removeListener("Role", this.userChange);
  }

  async updateUser() {
    if (this.username !== null) {
      const { pool } = await databasePool;
      this.user = await readUser(pool, this.username);
      if (this.user === null) {
        this.username = null;
        this.user = null;
        this.ws.send(
          JSON.stringify({
            type: "UPDATE_USER",
            user: null,
          })
        );
        throw new ServerError({
          status: "AUTHENTICATION_FAILED",
          substatus: "UNKNOWN_USER",
        });
      }

      this.ws.send(
        JSON.stringify({
          type: "UPDATE_USER",
          user: this.user,
        })
      );

      const pending = this.pending;
      this.pending = [];
      await Promise.all(
        pending.map((message) =>
          processMessage(this.ws, message, this.user!, this.sessionId)
        )
      );
    }
  }

  async message(rawMessage: string) {
    /*        await new Promise((resolve, reject) => {
                    setTimeout(resolve, 5000);
                });*/
    const message = JSON.parse(rawMessage);
    try {
      switch (message.type) {
        case "SET_USER": {
          let ticket: any;
          try {
            this.username = await resolveUserName(message.token);
            this.user = null;
          } catch (error) {
            this.user = null;
            this.username = null;
            this.ws.send(
              JSON.stringify({
                type: "UPDATE_USER",
                user: null,
              })
            );
            throw new ServerError({
              status: "AUTHENTICATION_FAILED",
              substatus: "TICKET_FAILED",
              detail: error,
            });
          }
          if (this.username !== null) {
            await this.updateUser();
          }
          break;
        }
        case "LOGOUT":
          this.username = null;
          this.user = null;
          this.ws.send(
            JSON.stringify({
              type: "UPDATE_USER",
              user: null,
            })
          );
          break;
        default:
          if (this.username === null || this.user === null) {
            this.pending.push(message);
            return;
          } else {
            await processMessage(this.ws, message, this.user, this.sessionId);
          }
          break;
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(error);
      }
      Sentry.captureException(error, {
        contexts: {
          details: {
            message: rawMessage,
            ...(error as any),
          },
        },
      });
      if (error instanceof ServerError) {
        this.ws.send(
          JSON.stringify({
            type: "ERROR",
            ...error.detail,
            id: message.id,
          })
        );
      } else {
        if (this.ws.readyState == WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              type: "ERROR",
              status: "UNKNOWN_ERROR",
              id: message.id,
            })
          );
        }
      }
    }
  }
}

wss.on("connection", (ws: WebSocket, request: http.IncomingMessage) => {
  new Connection(ws);
});

server.on("upgrade", function upgrade(request, socket, head) {
  const pathname = url.parse(request.url).pathname;
  if (pathname && pathname.startsWith("/api")) {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit("connection", ws, request);
    });
  }
});

async function sendNotice(
  source: string,
  destination: string,
  detail: NoticeDetail
) {
  if (source === destination) {
    return;
  }
  const { pool, context } = await databasePool;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await storeRecord({
      client,
      context,
      tableName: "Notice",
      user: {
        id: source,
        email: "",
        permissions: ["Notice-write", "Notice-new", "Notice-read"],
      },
      record: {
        id: genUUID(),
        recordVersion: null,
        source_user: source,
        to: destination,
        addedDateTime: null,
        detail: JSON.stringify(detail),
      },
      form: "notice",
      dateTime: new Date(),
    });
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function requestProjectNumber(request: Request, response: Response) {
  try {
    const { pool, context } = await databasePool;

    const result = await pool.query(
      "select nextval('projects_project_number_seq')"
    );

    response.send(`${result.rows[0].nextval}`);
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    response.status(500).send();
  }
}

app.use(bodyParser.urlencoded());
app.set("trust proxy", 1);
app.use(
  session({
    secret: "ASERAW#R WEAW#  $WCA",
    cookie: {
      secure: "auto",
    },
  })
);
app.get("/heapdump", () => {
  writeHeapSnapshot("snapshot.dmp");
  return "Ok";
});
app.get("/projects", serveProjectList);
app.post("/projects", serveProjectListPost);
app.get("/survey/:id", serveSurvey);
app.post("/survey/presave", multer().none(), serveSurveyPresave);
app.post("/survey/:id", multer().none(), serveSurveySave);
app.use("/print/", serverPrint);
app.use("/request-project-number/", requestProjectNumber);
app.post("/email/", multer().none(), processEmail);
app.get("/server/project-files/:projectNumber", processProjectFiles);
app.get("/server/image/:imageId", async (request, response) => {
  console.log(request.params);

  const { pool, context } = await databasePool;

  const query = await pool.query(
    "select data, name from rich_text_images where id = $1",
    [request.params.imageId]
  );

  if (query.rows.length > 0) {
    const fileTypeResult = await FileType.fromBuffer(query.rows[0].data);
    if (fileTypeResult) {
      response.set("content-type", fileTypeResult.mime);
    }
    response.set(
      "content-disposition",
      'attachment; filename="' + query.rows[0].name + '"'
    );
    response.send(query.rows[0].data);
  } else {
    response.sendStatus(404);
  }
});

EVENTS.addListener(
  "Project",
  async (userId, recordId, _oldRecord, newRecord: ProjectJSON | null) => {
    if (!newRecord) {
      return;
    }
    const { pool } = await databasePool;

    const recorded = await pool.query(
      select()
        .from("project_status_changes")
        .where("project = ?", recordId)
        .order("date", false)
        .limit(1)
        .field("status")
        .toParam()
    );
    const currentStatus = recorded.rows[0]?.status;

    const project = JSONToProject(newRecord);

    const status = calcProjectStage(project);

    if (status !== currentStatus) {
      await pool.query(
        'INSERT INTO project_status_changes (id, record_version, project,status,date,"user", recorded_date) VALUES ($1, 0, $2, $3, CURRENT_TIMESTAMP, $4, null)',
        [genUUID(), recordId, status, userId]
      );
    }
  }
);

if (process.env.NODE_ENV === "production") {
  app.use(Sentry.Handlers.errorHandler());

  app.use(function onError(err: any, req: any, res: any, next: any) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + "\n");
  });
}

//start our server
server.listen(process.env.PORT || 8999, () => {
  console.log(`Server started`);
});
