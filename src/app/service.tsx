import { replaceRecord } from "../clay/api";
import { Connection, forceReload, StandardService } from "../clay/service";
import { uuid5 } from "../clay/uuid";
import { SUBSCRIPTION_META } from "./inbox/table";
import { grabLog, recordLog } from "./logger";
import {
    processWorkerMessage,
    SERVICE_CHANNEL,
    startWorker,
} from "./sw/worker";
import * as React from "react";

export const CHANNEL = new BroadcastChannel("dropsheet");
CHANNEL.addEventListener("message", (event) => {
    if (event.data.type !== "SEND_LOGS") {
        recordLog("broadcast", event.data);
    }
    switch (event.data.type) {
        case "REQUEST_LOGS":
            CHANNEL.postMessage({
                type: "SEND_LOGS",
                client: "foreign",
                log: grabLog(),
            });
            break;
        case "INVALIDATE_CACHE":
            SERVICE.emit("cache-change", event.data);
            break;
    }
});

let refreshed = false;

async function openConnection(): Promise<Connection> {
    if (typeof window !== "undefined") {
        return {
            send: (message: any) => {
                processWorkerMessage(message);
            },
            listen: (callback: (message: any) => void) => {
                SERVICE_CHANNEL.on("message", (m) => {
                    callback(m);
                });
                startWorker();
            },
        };
    } else {
        return {
            send(message: any) {},
            listen(callback: (message: any) => void) {},
        };
    }
}

export const SERVICE = new StandardService(openConnection());
SERVICE.setMaxListeners(1000);

if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
        if (event.key === "dropsheet-auth") {
            if (event.newValue === null) {
                SERVICE.emit("message", {
                    type: "SET_USER" as "SET_USER",
                    token: null,
                    profile_image_url: null,
                });
            } else {
                SERVICE.emit("message", {
                    type: "SET_USER",
                    ...JSON.parse(event.newValue),
                });
            }
        }
    });
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

if (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    process.env.PRODUCTION
) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshed) {
            refreshed = true;
            forceReload("controllerchange");
        }
    });
    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
        registration.update();
        if (registration.pushManager) {
            registration.pushManager
                .subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(
                        process.env.VAPID_PUBLIC_KEY!
                    ),
                })
                .then((subscription) => {
                    const j = subscription.toJSON();
                    replaceRecord(SUBSCRIPTION_META, "subscription", {
                        id: { uuid: uuid5(subscription.endpoint) },
                        recordVersion: { version: null },
                        endpoint: subscription.endpoint,
                        auth: j.keys!.auth,
                        p256dh: j.keys!.p256dh,
                        modifiedBy: null,
                    });
                })
                .catch((error) => {
                    console.error(error);
                });
        }
    });
}

export async function buildLogFile() {
    const myDiv = document.createElement("div");
    myDiv.className = "report-node";
    myDiv.innerHTML = "<div>Please Wait...</div>";
    document.body.appendChild(myDiv);

    CHANNEL.postMessage({
        type: "REQUEST_LOGS",
    });
    const logs = [
        {
            id: "reload",
            data: window.localStorage.getItem("dropsheet-reloaded"),
        },
        {
            id: "MAIN",
            log: grabLog(),
        },
    ];
    const collect = (message: any) => {
        if (message.type === "SEND_LOGS") {
            logs.push({ id: message.client, log: message.log });
        }
    };
    CHANNEL.addEventListener("message", collect);

    await new Promise((resolve) => setTimeout(resolve, 10000));

    CHANNEL.removeEventListener("message", collect);

    const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(logs));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
        "download",
        `dropsheet report ${new Date().toISOString()}.json`
    );
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    document.body.removeChild(myDiv);
}

SERVICE.addListener("message", (message) => {
    if (message.type === "REQUEST_LOGS") {
        SERVICE.send({
            type: "SEND_LOGS",
            client: message.client,
            log: grabLog(),
        });
    }
});
