import dateParse from "date-fns/parseISO";
import { Serial } from "../../clay/common";
import { Link } from "../../clay/link";
import { LocalDate } from "../../clay/LocalDate";
import { RecordMeta } from "../../clay/meta";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";
import { Contact } from "../contact/table";
import { User } from "../user/table";

//!Data
export type CampaignContactDetail = {
    contact: Link<Contact>;
    date: LocalDate | null;
    user: Link<User>;
};

//!Data
export type Campaign = {
    id: UUID;
    recordVersion: Version;
    name: string;
    startDate: LocalDate | null;
    endDate: LocalDate | null;
    number: Serial;
    contacts: CampaignContactDetail[];
    defaultContactDate: LocalDate | null;
    defaultContactUser: Link<User>;
    activated: boolean;
    added_date_time: Date | null;
};

// BEGIN MAGIC -- DO NOT EDIT
export type CampaignContactDetailJSON = {
    contact: string | null;
    date: string | null;
    user: string | null;
};

export function JSONToCampaignContactDetail(
    json: CampaignContactDetailJSON
): CampaignContactDetail {
    return {
        contact: json.contact,
        date: json.date !== null ? LocalDate.parse(json.date) : null,
        user: json.user,
    };
}
export type CampaignContactDetailBrokenJSON = {
    contact?: string | null;
    date?: string | null;
    user?: string | null;
};

export function newCampaignContactDetail(): CampaignContactDetail {
    return JSONToCampaignContactDetail(
        repairCampaignContactDetailJSON(undefined)
    );
}
export function repairCampaignContactDetailJSON(
    json: CampaignContactDetailBrokenJSON | undefined
): CampaignContactDetailJSON {
    if (json) {
        return {
            contact: json.contact || null,
            date: json.date || null,
            user: json.user || null,
        };
    } else {
        return {
            contact: undefined || null,
            date: undefined || null,
            user: undefined || null,
        };
    }
}

export function CampaignContactDetailToJSON(
    value: CampaignContactDetail
): CampaignContactDetailJSON {
    return {
        contact: value.contact,
        date: value.date !== null ? value.date.toString() : null,
        user: value.user,
    };
}

export const CAMPAIGN_CONTACT_DETAIL_META: RecordMeta<
    CampaignContactDetail,
    CampaignContactDetailJSON,
    CampaignContactDetailBrokenJSON
> & { name: "CampaignContactDetail" } = {
    name: "CampaignContactDetail",
    type: "record",
    repair: repairCampaignContactDetailJSON,
    toJSON: CampaignContactDetailToJSON,
    fromJSON: JSONToCampaignContactDetail,
    fields: {
        contact: { type: "uuid", linkTo: "Contact" },
        date: { type: "date" },
        user: { type: "uuid", linkTo: "User" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type CampaignJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    startDate: string | null;
    endDate: string | null;
    number: number | null;
    contacts: CampaignContactDetailJSON[];
    defaultContactDate: string | null;
    defaultContactUser: string | null;
    activated: boolean;
    added_date_time: string | null;
};

export function JSONToCampaign(json: CampaignJSON): Campaign {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        startDate:
            json.startDate !== null ? LocalDate.parse(json.startDate) : null,
        endDate: json.endDate !== null ? LocalDate.parse(json.endDate) : null,
        number: json.number,
        contacts: json.contacts.map((inner) =>
            JSONToCampaignContactDetail(inner)
        ),
        defaultContactDate:
            json.defaultContactDate !== null
                ? LocalDate.parse(json.defaultContactDate)
                : null,
        defaultContactUser: json.defaultContactUser,
        activated: json.activated,
        added_date_time:
            json.added_date_time !== null
                ? dateParse(json.added_date_time)
                : null,
    };
}
export type CampaignBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    startDate?: string | null;
    endDate?: string | null;
    number?: number | null;
    contacts?: CampaignContactDetailJSON[];
    defaultContactDate?: string | null;
    defaultContactUser?: string | null;
    activated?: boolean;
    added_date_time?: string | null;
};

export function newCampaign(): Campaign {
    return JSONToCampaign(repairCampaignJSON(undefined));
}
export function repairCampaignJSON(
    json: CampaignBrokenJSON | undefined
): CampaignJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            startDate: json.startDate || null,
            endDate: json.endDate || null,
            number: json.number === undefined ? null : json.number,
            contacts: (json.contacts || []).map((inner) =>
                repairCampaignContactDetailJSON(inner)
            ),
            defaultContactDate: json.defaultContactDate || null,
            defaultContactUser: json.defaultContactUser || null,
            activated: json.activated || false,
            added_date_time: json.added_date_time
                ? new Date(json.added_date_time!).toISOString()
                : null,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            startDate: undefined || null,
            endDate: undefined || null,
            number: null,
            contacts: (undefined || []).map((inner) =>
                repairCampaignContactDetailJSON(inner)
            ),
            defaultContactDate: undefined || null,
            defaultContactUser: undefined || null,
            activated: undefined || false,
            added_date_time: undefined
                ? new Date(undefined!).toISOString()
                : null,
        };
    }
}

export function CampaignToJSON(value: Campaign): CampaignJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        startDate: value.startDate !== null ? value.startDate.toString() : null,
        endDate: value.endDate !== null ? value.endDate.toString() : null,
        number: value.number,
        contacts: value.contacts.map((inner) =>
            CampaignContactDetailToJSON(inner)
        ),
        defaultContactDate:
            value.defaultContactDate !== null
                ? value.defaultContactDate.toString()
                : null,
        defaultContactUser: value.defaultContactUser,
        activated: value.activated,
        added_date_time:
            value.added_date_time !== null
                ? value.added_date_time.toISOString()
                : null,
    };
}

export const CAMPAIGN_META: RecordMeta<
    Campaign,
    CampaignJSON,
    CampaignBrokenJSON
> & { name: "Campaign" } = {
    name: "Campaign",
    type: "record",
    repair: repairCampaignJSON,
    toJSON: CampaignToJSON,
    fromJSON: JSONToCampaign,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        startDate: { type: "date" },
        endDate: { type: "date" },
        number: { type: "serial" },
        contacts: { type: "array", items: CAMPAIGN_CONTACT_DETAIL_META },
        defaultContactDate: { type: "date" },
        defaultContactUser: { type: "uuid", linkTo: "User" },
        activated: { type: "boolean" },
        added_date_time: { type: "datetime" },
    },
    userFacingKey: "number",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
