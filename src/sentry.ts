import * as Sentry from "@sentry/react";
import { Event, EventProcessor, Hub, Integration } from "@sentry/types";
import { logger, normalize, uuid4 } from "@sentry/utils";
import { IDBPDatabase, openDB } from "idb";

/**
 * cache offline errors and send when connected
 */
export class Offline implements Integration {
    /**
     * @inheritDoc
     */
    public static id: string = "Offline";

    /**
     * @inheritDoc
     */
    public readonly name: string = Offline.id;

    /**
     * event cache
     */
    public offlineErrors: Promise<IDBPDatabase>;

    public hub?: Hub;

    /**
     * @inheritDoc
     */
    public constructor(options: { maxStoredEvents?: number } = {}) {
        this.offlineErrors = openDB("dropsheet-errors", 1, {
            async upgrade(db) {
                db.createObjectStore("errors");
            },
        });
    }

    /**
     * @inheritDoc
     */
    public setupOnce(
        addGlobalEventProcessor: (callback: EventProcessor) => void,
        getCurrentHub: () => Hub
    ): void {
        this.hub = getCurrentHub();
        if (typeof window !== "undefined") {
            window.addEventListener("online", () => {
                void this._sendEvents().catch(() => {
                    logger.warn("could not send cached events");
                });
            });

            // if online now, send any events stored in a previous offline session
            if (window.navigator.onLine) {
                void this._sendEvents().catch(() => {
                    logger.warn("could not send cached events");
                });
            }
        }

        addGlobalEventProcessor((event: Event) => {
            // cache if we are positively offline
            if (!navigator.onLine) {
                void this._cacheEvent(event).catch((_error): void => {
                    logger.warn("could not cache event while offline");
                });

                // return null on success or failure, because being offline will still result in an error
                return null;
            }

            return event;
        });
    }

    /**
     * cache an event to send later
     * @param event an event
     */
    private async _cacheEvent(event: Event): Promise<void> {
        const database = await this.offlineErrors;
        const key = uuid4();
        database.put("errors", normalize(event), key);
    }

    /**
     * send all events
     */
    private async _sendEvents(): Promise<void> {
        const database = await this.offlineErrors;
        const transaction = database.transaction(["errors"], "readwrite");
        const errors = transaction.objectStore("errors");
        let cursor = await errors.openCursor();
        while (cursor) {
            await cursor.delete();

            cursor = await cursor.continue();
        }
    }
}
if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
    Sentry.init({
        dsn: "https://c37711c73d4b46e699024949090c4bca@dropsheet.remdal.com/5897301",
        release: process.env.VERSION,
        integrations: [new Offline()],
    });
}
