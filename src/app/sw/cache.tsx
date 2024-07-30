import { openDB } from "idb";
import { max } from "lodash";
import { CACHE_CONFIG } from "../../cache";
import { UserPermissions } from "../../clay/server/api";
import * as React from "react";

type CacheMessage =
    | {
          type: "SET_CACHE";
          table: string;
          records: any[];
      }
    | {
          type: "UPDATE_CACHE";
          table: string;
          recordId: string;
          record: any;
      };

const EXTRA_STORES = [
    { name: "pending", version: 1 },
    { name: "meta", version: 1 },
    { name: "patches", version: 11 },
];

export function openDatabase() {
    const lastVersion = max([
        ...Object.values(CACHE_CONFIG).map((config) => config.version),
        ...Object.values(EXTRA_STORES).map((config) => config.version),
    ])!;
    return openDB("dropsheet", lastVersion, {
        async upgrade(db, oldVersion, newVersion, transaction) {
            for (const { name, version } of EXTRA_STORES) {
                if (version > oldVersion) {
                    await db.createObjectStore(name);
                }
            }
            for (const [tableName, config] of Object.entries(CACHE_CONFIG)) {
                if (config.version > oldVersion) {
                    await db.createObjectStore(tableName);
                }
            }
        },
    });
}

export async function processCache(message: CacheMessage) {
    switch (message.type) {
        case "SET_CACHE": {
            const database = await openDatabase();
            const transaction = await database.transaction(
                message.table,
                "readwrite"
            );
            const store = await transaction.objectStore(message.table);
            await store.clear();
            for (const record of message.records) {
                await store.put(record, record.id);
            }
            break;
        }
        case "UPDATE_CACHE": {
            const database = await openDatabase();
            if (message.record === null) {
                await database.delete(message.table, message.recordId);
            } else {
                await database.put(
                    message.table,
                    message.record,
                    message.recordId
                );
            }

            break;
        }
    }
}
export async function getCacheData() {
    const database = await openDatabase();
    const data = await database.get("meta", "1");
    return data;
}

let currentToken: string | null = null;

export function getCurrentToken(): string | null {
    return currentToken;
}

export function setCurrentToken(token: string | null) {
    currentToken = token;
}

export async function getCurrentUser(): Promise<UserPermissions | null> {
    const database = await openDatabase();
    const data = await database.get("meta", "user");
    return data || null;
}

export async function setCurrentUser(user: UserPermissions | null) {
    const database = await openDatabase();
    const data = await database.put("meta", user, "user");
}

export async function cacheUpdate(response: any) {
    const database = await openDatabase();
    const transaction = await database.transaction(
        ["meta", ...Object.keys(CACHE_CONFIG)],
        "readwrite"
    );
    const metaStore = await transaction.objectStore("meta");
    await metaStore.put(
        {
            syncTime: new Date().toISOString(),
        },
        "1"
    );
    for (const [table, records] of Object.entries(response.response.records)) {
        const store = await transaction.objectStore(table);
        await store.clear();
        for (const record of records as any[]) {
            await store.put(record, record.id);
        }
    }
}
