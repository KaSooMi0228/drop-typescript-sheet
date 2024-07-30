import { Link } from "../../clay/link";
import { RecordMeta } from "../../clay/meta";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";
import { User } from "../user/table";

//!Data
export type Subscription = {
    id: UUID;
    recordVersion: Version;
    endpoint: string;
    auth: string;
    p256dh: string;
    modifiedBy: Link<User>;
};

// BEGIN MAGIC -- DO NOT EDIT
export type SubscriptionJSON = {
    id: string;
    recordVersion: number | null;
    endpoint: string;
    auth: string;
    p256dh: string;
    modifiedBy: string | null;
};

export function JSONToSubscription(json: SubscriptionJSON): Subscription {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        endpoint: json.endpoint,
        auth: json.auth,
        p256dh: json.p256dh,
        modifiedBy: json.modifiedBy,
    };
}
export type SubscriptionBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    endpoint?: string;
    auth?: string;
    p256dh?: string;
    modifiedBy?: string | null;
};

export function newSubscription(): Subscription {
    return JSONToSubscription(repairSubscriptionJSON(undefined));
}
export function repairSubscriptionJSON(
    json: SubscriptionBrokenJSON | undefined
): SubscriptionJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            endpoint: json.endpoint || "",
            auth: json.auth || "",
            p256dh: json.p256dh || "",
            modifiedBy: json.modifiedBy || null,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            endpoint: undefined || "",
            auth: undefined || "",
            p256dh: undefined || "",
            modifiedBy: undefined || null,
        };
    }
}

export function SubscriptionToJSON(value: Subscription): SubscriptionJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        endpoint: value.endpoint,
        auth: value.auth,
        p256dh: value.p256dh,
        modifiedBy: value.modifiedBy,
    };
}

export const SUBSCRIPTION_META: RecordMeta<
    Subscription,
    SubscriptionJSON,
    SubscriptionBrokenJSON
> & { name: "Subscription" } = {
    name: "Subscription",
    type: "record",
    repair: repairSubscriptionJSON,
    toJSON: SubscriptionToJSON,
    fromJSON: JSONToSubscription,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        endpoint: { type: "string" },
        auth: { type: "string" },
        p256dh: { type: "string" },
        modifiedBy: { type: "uuid", linkTo: "User" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
