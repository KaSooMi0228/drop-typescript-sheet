import dateParse from "date-fns/parseISO";
import Decimal from "decimal.js";
import { Serial } from "../../clay/common";
import { Link } from "../../clay/link";
import { LocalDate } from "../../clay/LocalDate";
import { RecordMeta } from "../../clay/meta";
import { Phone } from "../../clay/phone";
import {
    daysAgo,
    firstMatch,
    ifNull,
    isNull,
    joinMap,
    lastItem,
} from "../../clay/queryFuncs";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";
import { Campaign } from "../campaign/table";
import {
    Company,
    CompanyDetail,
    CompanyDetailJSON,
    CompanyDetailToJSON,
    COMPANY_DETAIL_META,
    JSONToCompanyDetail,
    repairCompanyDetailJSON,
} from "../company/table";
import { ContactType } from "../contact-type/table";
import {
    DatedString,
    DatedStringJSON,
    DatedStringToJSON,
    DATED_STRING_META,
    JSONToDatedString,
    repairDatedStringJSON,
} from "../dated-strings/table";
import { Industry } from "../industry/table";
import { User } from "../user/table";

//!Data
export type ContactInactiveReason = {
    id: UUID;
    recordVersion: Version;
    name: string;
    requireDetail: boolean;
};

//!Data
export type CustomerRelation = {
    id: UUID;
    recordVersion: Version;
    name: string;
};

//!Data
export type ContactPhone = {
    type: "" | "home" | "office" | "cell" | "fax" | "direct" | "other";
    number: Phone;
};

//!Data
export type CompanyHistory = {
    date: Date | null;
    company: Link<Company>;
    user: Link<User>;
};

//!Data
export type ContactFollowupActivity = {
    id: UUID;
    recordVersion: Version;
    name: string;
};

//!Data
export type ContactFollowUp = {
    id: UUID;
    scheduled: LocalDate | null;
    actual: Date | null;
    campaign: Link<Campaign>;
    user: Link<User>;
    message: string;
    activity: Link<ContactFollowupActivity>;
};

//!Data
export type Contact = {
    id: UUID;
    recordVersion: Version;
    contactNumber: Serial;
    name: string;
    email: string;
    emails: string[];
    phones: ContactPhone[];
    type: Link<ContactType>;
    company: Link<Company>;
    companyHistory: CompanyHistory[];
    unitNumber: string;

    spouseName: string;
    childrenNames: string;
    birthdate: LocalDate | null;
    bestTimeToCall: string;
    preferredCommunication: string;
    relatedTo: string;
    stayInTouchCycle: string;
    conversationStarter: string;
    personalityType: string;
    notes: DatedString[];

    addedDate: LocalDate | null;
    addedDateTime: Date | null;
    addedBy: Link<User>;
    modifiedDate: LocalDate | null;
    modifiedBy: Link<User>;

    serviceRepresentative: Link<User>;
    customerRelation: Link<CustomerRelation>;
    preferredProjectManager: Link<User>;

    billingPreference: Link<any>;
    christmasCard: boolean;
    lastContactDate: LocalDate | null;
    inactiveReason: Link<ContactInactiveReason>;
    inactiveReasonDetail: string;
    industry: Link<Industry>;

    followUps: ContactFollowUp[];
};

export function calcContactPendingFollowUpUser(contact: Contact): Link<User> {
    return lastItem(contact.followUps, (follow) =>
        ifNull(daysAgo(follow.scheduled), new Decimal("-1")).gt(
            new Decimal("-1")
        ) && isNull(follow.actual)
            ? follow.user
            : null
    );
}

export function calcContactPendingFollowUpDate(
    contact: Contact
): LocalDate | null {
    return lastItem(contact.followUps, (followUp) => followUp.scheduled);
}

export function calcContactPendingFollowUpOverdue(contact: Contact): boolean {
    return lastItem(contact.followUps, (followUp) =>
        ifNull(daysAgo(followUp.scheduled), new Decimal("-1")).gt(
            new Decimal(7)
        )
    )!;
}

export function calcContactActive(contact: Contact): boolean {
    return isNull(contact.inactiveReason);
}

//!Data
export type ContactDetail = {
    contact: Link<Contact>;
    name: string;
    email: string;
    phones: ContactPhone[];
    type: Link<ContactType>;
    company: CompanyDetail;
    unitNumber: string;
};

export function emptyContactDetail() {
    return buildContactDetail(null, null);
}

export function calcContactDetailSummary(contact: ContactDetail): string {
    return (
        contact.name +
        " (" +
        contact.email +
        (contact.email !== "" ? "; " : "") +
        joinMap(
            contact.phones,
            "; ",
            (phone) => phone.type + ": " + phone.number.format()
        ) +
        ")"
    );
}

export function buildCompanyDetail(company: Company | null): CompanyDetail {
    if (company === null) {
        return {
            company: null,
            name: "",
            address: {
                line1: "",
                unitNumber: "",
                city: "",
                province: "",
                postal: "",
            },
            email: "",
            fax: new Phone(""),
            phone: new Phone(""),
            website: "",
            billingContactEmail: "",
        };
    } else {
        return {
            company: company.id.uuid,
            name: company.name,
            address: company.address,
            email: company.email,
            fax: company.fax,
            phone: company.phone,
            website: company.website,
            billingContactEmail: company.billingContactEmail,
        };
    }
}

export function buildContactDetail(
    contact: Contact | null,
    company: Company | null
): ContactDetail {
    if (contact === null) {
        return {
            contact: null,
            type: null,
            name: "",
            email: "",
            phones: [],
            unitNumber: "",
            company: buildCompanyDetail(null),
        };
    } else {
        return {
            contact: contact.id.uuid,
            type: contact.type,
            name: contact.name,
            email: contact.email,
            phones: contact.phones,
            unitNumber: contact.unitNumber,
            company: buildCompanyDetail(company),
        };
    }
}

export function calcContactDetailCell(contact: ContactDetail): Phone | null {
    return firstMatch(
        contact.phones,
        (phone) => phone.type === "cell",
        (phone) => phone.number
    );
}

export function calcContactDetailPhone(contact: ContactDetail): Phone | null {
    return firstMatch(
        contact.phones,
        (phone) => phone.type !== "cell",
        (phone) => phone.number
    );
}

export function calcContactCell(contact: Contact): Phone | null {
    return firstMatch(
        contact.phones,
        (phone) => phone.type === "cell",
        (phone) => phone.number
    );
}

export function calcContactPhone(contact: Contact): Phone | null {
    return firstMatch(
        contact.phones,
        (phone) => phone.type !== "cell",
        (phone) => phone.number
    );
}

export function calcContactSummary(contact: Contact): string {
    return (
        contact.name +
        " (" +
        contact.email +
        (contact.email !== "" ? "; " : "") +
        joinMap(
            contact.phones,
            "; ",
            (phone) => phone.type + ": " + phone.number.format()
        ) +
        ")"
    );
}

// BEGIN MAGIC -- DO NOT EDIT
export type ContactInactiveReasonJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    requireDetail: boolean;
};

export function JSONToContactInactiveReason(
    json: ContactInactiveReasonJSON
): ContactInactiveReason {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        requireDetail: json.requireDetail,
    };
}
export type ContactInactiveReasonBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    requireDetail?: boolean;
};

export function newContactInactiveReason(): ContactInactiveReason {
    return JSONToContactInactiveReason(
        repairContactInactiveReasonJSON(undefined)
    );
}
export function repairContactInactiveReasonJSON(
    json: ContactInactiveReasonBrokenJSON | undefined
): ContactInactiveReasonJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            requireDetail: json.requireDetail || false,
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            requireDetail: undefined || false,
        };
    }
}

export function ContactInactiveReasonToJSON(
    value: ContactInactiveReason
): ContactInactiveReasonJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        requireDetail: value.requireDetail,
    };
}

export const CONTACT_INACTIVE_REASON_META: RecordMeta<
    ContactInactiveReason,
    ContactInactiveReasonJSON,
    ContactInactiveReasonBrokenJSON
> & { name: "ContactInactiveReason" } = {
    name: "ContactInactiveReason",
    type: "record",
    repair: repairContactInactiveReasonJSON,
    toJSON: ContactInactiveReasonToJSON,
    fromJSON: JSONToContactInactiveReason,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        requireDetail: { type: "boolean" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type CustomerRelationJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
};

export function JSONToCustomerRelation(
    json: CustomerRelationJSON
): CustomerRelation {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
    };
}
export type CustomerRelationBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
};

export function newCustomerRelation(): CustomerRelation {
    return JSONToCustomerRelation(repairCustomerRelationJSON(undefined));
}
export function repairCustomerRelationJSON(
    json: CustomerRelationBrokenJSON | undefined
): CustomerRelationJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
        };
    }
}

export function CustomerRelationToJSON(
    value: CustomerRelation
): CustomerRelationJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
    };
}

export const CUSTOMER_RELATION_META: RecordMeta<
    CustomerRelation,
    CustomerRelationJSON,
    CustomerRelationBrokenJSON
> & { name: "CustomerRelation" } = {
    name: "CustomerRelation",
    type: "record",
    repair: repairCustomerRelationJSON,
    toJSON: CustomerRelationToJSON,
    fromJSON: JSONToCustomerRelation,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type ContactPhoneJSON = {
    type: string;
    number: string;
};

export function JSONToContactPhone(json: ContactPhoneJSON): ContactPhone {
    return {
        type: json.type as any,
        number: new Phone(json.number),
    };
}
export type ContactPhoneBrokenJSON = {
    type?: string;
    number?: string;
};

export function newContactPhone(): ContactPhone {
    return JSONToContactPhone(repairContactPhoneJSON(undefined));
}
export function repairContactPhoneJSON(
    json: ContactPhoneBrokenJSON | undefined
): ContactPhoneJSON {
    if (json) {
        return {
            type: json.type || "",
            number: json.number || "",
        };
    } else {
        return {
            type: undefined || "",
            number: undefined || "",
        };
    }
}

export function ContactPhoneToJSON(value: ContactPhone): ContactPhoneJSON {
    return {
        type: value.type,
        number: value.number.phone,
    };
}

export const CONTACT_PHONE_META: RecordMeta<
    ContactPhone,
    ContactPhoneJSON,
    ContactPhoneBrokenJSON
> & { name: "ContactPhone" } = {
    name: "ContactPhone",
    type: "record",
    repair: repairContactPhoneJSON,
    toJSON: ContactPhoneToJSON,
    fromJSON: JSONToContactPhone,
    fields: {
        type: {
            type: "enum",
            values: ["", "home", "office", "cell", "fax", "direct", "other"],
        },
        number: { type: "phone" },
    },
    userFacingKey: "number",
    functions: {},
    segments: {},
};

export type CompanyHistoryJSON = {
    date: string | null;
    company: string | null;
    user: string | null;
};

export function JSONToCompanyHistory(json: CompanyHistoryJSON): CompanyHistory {
    return {
        date: json.date !== null ? dateParse(json.date) : null,
        company: json.company,
        user: json.user,
    };
}
export type CompanyHistoryBrokenJSON = {
    date?: string | null;
    company?: string | null;
    user?: string | null;
};

export function newCompanyHistory(): CompanyHistory {
    return JSONToCompanyHistory(repairCompanyHistoryJSON(undefined));
}
export function repairCompanyHistoryJSON(
    json: CompanyHistoryBrokenJSON | undefined
): CompanyHistoryJSON {
    if (json) {
        return {
            date: json.date ? new Date(json.date!).toISOString() : null,
            company: json.company || null,
            user: json.user || null,
        };
    } else {
        return {
            date: undefined ? new Date(undefined!).toISOString() : null,
            company: undefined || null,
            user: undefined || null,
        };
    }
}

export function CompanyHistoryToJSON(
    value: CompanyHistory
): CompanyHistoryJSON {
    return {
        date: value.date !== null ? value.date.toISOString() : null,
        company: value.company,
        user: value.user,
    };
}

export const COMPANY_HISTORY_META: RecordMeta<
    CompanyHistory,
    CompanyHistoryJSON,
    CompanyHistoryBrokenJSON
> & { name: "CompanyHistory" } = {
    name: "CompanyHistory",
    type: "record",
    repair: repairCompanyHistoryJSON,
    toJSON: CompanyHistoryToJSON,
    fromJSON: JSONToCompanyHistory,
    fields: {
        date: { type: "datetime" },
        company: { type: "uuid", linkTo: "Company" },
        user: { type: "uuid", linkTo: "User" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type ContactFollowupActivityJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
};

export function JSONToContactFollowupActivity(
    json: ContactFollowupActivityJSON
): ContactFollowupActivity {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
    };
}
export type ContactFollowupActivityBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
};

export function newContactFollowupActivity(): ContactFollowupActivity {
    return JSONToContactFollowupActivity(
        repairContactFollowupActivityJSON(undefined)
    );
}
export function repairContactFollowupActivityJSON(
    json: ContactFollowupActivityBrokenJSON | undefined
): ContactFollowupActivityJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
        };
    }
}

export function ContactFollowupActivityToJSON(
    value: ContactFollowupActivity
): ContactFollowupActivityJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
    };
}

export const CONTACT_FOLLOWUP_ACTIVITY_META: RecordMeta<
    ContactFollowupActivity,
    ContactFollowupActivityJSON,
    ContactFollowupActivityBrokenJSON
> & { name: "ContactFollowupActivity" } = {
    name: "ContactFollowupActivity",
    type: "record",
    repair: repairContactFollowupActivityJSON,
    toJSON: ContactFollowupActivityToJSON,
    fromJSON: JSONToContactFollowupActivity,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type ContactFollowUpJSON = {
    id: string;
    scheduled: string | null;
    actual: string | null;
    campaign: string | null;
    user: string | null;
    message: string;
    activity: string | null;
};

export function JSONToContactFollowUp(
    json: ContactFollowUpJSON
): ContactFollowUp {
    return {
        id: { uuid: json.id },
        scheduled:
            json.scheduled !== null ? LocalDate.parse(json.scheduled) : null,
        actual: json.actual !== null ? dateParse(json.actual) : null,
        campaign: json.campaign,
        user: json.user,
        message: json.message,
        activity: json.activity,
    };
}
export type ContactFollowUpBrokenJSON = {
    id?: string;
    scheduled?: string | null;
    actual?: string | null;
    campaign?: string | null;
    user?: string | null;
    message?: string;
    activity?: string | null;
};

export function newContactFollowUp(): ContactFollowUp {
    return JSONToContactFollowUp(repairContactFollowUpJSON(undefined));
}
export function repairContactFollowUpJSON(
    json: ContactFollowUpBrokenJSON | undefined
): ContactFollowUpJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            scheduled: json.scheduled || null,
            actual: json.actual ? new Date(json.actual!).toISOString() : null,
            campaign: json.campaign || null,
            user: json.user || null,
            message: json.message || "",
            activity: json.activity || null,
        };
    } else {
        return {
            id: undefined || genUUID(),
            scheduled: undefined || null,
            actual: undefined ? new Date(undefined!).toISOString() : null,
            campaign: undefined || null,
            user: undefined || null,
            message: undefined || "",
            activity: undefined || null,
        };
    }
}

export function ContactFollowUpToJSON(
    value: ContactFollowUp
): ContactFollowUpJSON {
    return {
        id: value.id.uuid,
        scheduled: value.scheduled !== null ? value.scheduled.toString() : null,
        actual: value.actual !== null ? value.actual.toISOString() : null,
        campaign: value.campaign,
        user: value.user,
        message: value.message,
        activity: value.activity,
    };
}

export const CONTACT_FOLLOW_UP_META: RecordMeta<
    ContactFollowUp,
    ContactFollowUpJSON,
    ContactFollowUpBrokenJSON
> & { name: "ContactFollowUp" } = {
    name: "ContactFollowUp",
    type: "record",
    repair: repairContactFollowUpJSON,
    toJSON: ContactFollowUpToJSON,
    fromJSON: JSONToContactFollowUp,
    fields: {
        id: { type: "uuid" },
        scheduled: { type: "date" },
        actual: { type: "datetime" },
        campaign: { type: "uuid", linkTo: "Campaign" },
        user: { type: "uuid", linkTo: "User" },
        message: { type: "string" },
        activity: { type: "uuid", linkTo: "ContactFollowupActivity" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type ContactJSON = {
    id: string;
    recordVersion: number | null;
    contactNumber: number | null;
    name: string;
    email: string;
    emails: string[];
    phones: ContactPhoneJSON[];
    type: string | null;
    company: string | null;
    companyHistory: CompanyHistoryJSON[];
    unitNumber: string;
    spouseName: string;
    childrenNames: string;
    birthdate: string | null;
    bestTimeToCall: string;
    preferredCommunication: string;
    relatedTo: string;
    stayInTouchCycle: string;
    conversationStarter: string;
    personalityType: string;
    notes: DatedStringJSON[];
    addedDate: string | null;
    addedDateTime: string | null;
    addedBy: string | null;
    modifiedDate: string | null;
    modifiedBy: string | null;
    serviceRepresentative: string | null;
    customerRelation: string | null;
    preferredProjectManager: string | null;
    billingPreference: string | null;
    christmasCard: boolean;
    lastContactDate: string | null;
    inactiveReason: string | null;
    inactiveReasonDetail: string;
    industry: string | null;
    followUps: ContactFollowUpJSON[];
};

export function JSONToContact(json: ContactJSON): Contact {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        contactNumber: json.contactNumber,
        name: json.name,
        email: json.email,
        emails: json.emails.map((inner) => inner),
        phones: json.phones.map((inner) => JSONToContactPhone(inner)),
        type: json.type,
        company: json.company,
        companyHistory: json.companyHistory.map((inner) =>
            JSONToCompanyHistory(inner)
        ),
        unitNumber: json.unitNumber,
        spouseName: json.spouseName,
        childrenNames: json.childrenNames,
        birthdate:
            json.birthdate !== null ? LocalDate.parse(json.birthdate) : null,
        bestTimeToCall: json.bestTimeToCall,
        preferredCommunication: json.preferredCommunication,
        relatedTo: json.relatedTo,
        stayInTouchCycle: json.stayInTouchCycle,
        conversationStarter: json.conversationStarter,
        personalityType: json.personalityType,
        notes: json.notes.map((inner) => JSONToDatedString(inner)),
        addedDate:
            json.addedDate !== null ? LocalDate.parse(json.addedDate) : null,
        addedDateTime:
            json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
        addedBy: json.addedBy,
        modifiedDate:
            json.modifiedDate !== null
                ? LocalDate.parse(json.modifiedDate)
                : null,
        modifiedBy: json.modifiedBy,
        serviceRepresentative: json.serviceRepresentative,
        customerRelation: json.customerRelation,
        preferredProjectManager: json.preferredProjectManager,
        billingPreference: json.billingPreference,
        christmasCard: json.christmasCard,
        lastContactDate:
            json.lastContactDate !== null
                ? LocalDate.parse(json.lastContactDate)
                : null,
        inactiveReason: json.inactiveReason,
        inactiveReasonDetail: json.inactiveReasonDetail,
        industry: json.industry,
        followUps: json.followUps.map((inner) => JSONToContactFollowUp(inner)),
    };
}
export type ContactBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    contactNumber?: number | null;
    name?: string;
    email?: string;
    emails?: string[];
    phones?: ContactPhoneJSON[];
    type?: string | null;
    company?: string | null;
    companyHistory?: CompanyHistoryJSON[];
    unitNumber?: string;
    spouseName?: string;
    childrenNames?: string;
    birthdate?: string | null;
    bestTimeToCall?: string;
    preferredCommunication?: string;
    relatedTo?: string;
    stayInTouchCycle?: string;
    conversationStarter?: string;
    personalityType?: string;
    notes?: DatedStringJSON[];
    addedDate?: string | null;
    addedDateTime?: string | null;
    addedBy?: string | null;
    modifiedDate?: string | null;
    modifiedBy?: string | null;
    serviceRepresentative?: string | null;
    customerRelation?: string | null;
    preferredProjectManager?: string | null;
    billingPreference?: string | null;
    christmasCard?: boolean;
    lastContactDate?: string | null;
    inactiveReason?: string | null;
    inactiveReasonDetail?: string;
    industry?: string | null;
    followUps?: ContactFollowUpJSON[];
};

export function newContact(): Contact {
    return JSONToContact(repairContactJSON(undefined));
}
export function repairContactJSON(
    json: ContactBrokenJSON | undefined
): ContactJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            contactNumber:
                json.contactNumber === undefined ? null : json.contactNumber,
            name: json.name || "",
            email: json.email || "",
            emails: (json.emails || []).map((inner) => inner || ""),
            phones: (json.phones || []).map((inner) =>
                repairContactPhoneJSON(inner)
            ),
            type: json.type || null,
            company: json.company || null,
            companyHistory: (json.companyHistory || []).map((inner) =>
                repairCompanyHistoryJSON(inner)
            ),
            unitNumber: json.unitNumber || "",
            spouseName: json.spouseName || "",
            childrenNames: json.childrenNames || "",
            birthdate: json.birthdate || null,
            bestTimeToCall: json.bestTimeToCall || "",
            preferredCommunication: json.preferredCommunication || "",
            relatedTo: json.relatedTo || "",
            stayInTouchCycle: json.stayInTouchCycle || "",
            conversationStarter: json.conversationStarter || "",
            personalityType: json.personalityType || "",
            notes: (json.notes || []).map((inner) =>
                repairDatedStringJSON(inner)
            ),
            addedDate: json.addedDate || null,
            addedDateTime: json.addedDateTime
                ? new Date(json.addedDateTime!).toISOString()
                : null,
            addedBy: json.addedBy || null,
            modifiedDate: json.modifiedDate || null,
            modifiedBy: json.modifiedBy || null,
            serviceRepresentative: json.serviceRepresentative || null,
            customerRelation: json.customerRelation || null,
            preferredProjectManager: json.preferredProjectManager || null,
            billingPreference: json.billingPreference || null,
            christmasCard: json.christmasCard || false,
            lastContactDate: json.lastContactDate || null,
            inactiveReason: json.inactiveReason || null,
            inactiveReasonDetail: json.inactiveReasonDetail || "",
            industry: json.industry || null,
            followUps: (json.followUps || []).map((inner) =>
                repairContactFollowUpJSON(inner)
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            contactNumber: null,
            name: undefined || "",
            email: undefined || "",
            emails: (undefined || []).map((inner) => inner || ""),
            phones: (undefined || []).map((inner) =>
                repairContactPhoneJSON(inner)
            ),
            type: undefined || null,
            company: undefined || null,
            companyHistory: (undefined || []).map((inner) =>
                repairCompanyHistoryJSON(inner)
            ),
            unitNumber: undefined || "",
            spouseName: undefined || "",
            childrenNames: undefined || "",
            birthdate: undefined || null,
            bestTimeToCall: undefined || "",
            preferredCommunication: undefined || "",
            relatedTo: undefined || "",
            stayInTouchCycle: undefined || "",
            conversationStarter: undefined || "",
            personalityType: undefined || "",
            notes: (undefined || []).map((inner) =>
                repairDatedStringJSON(inner)
            ),
            addedDate: undefined || null,
            addedDateTime: undefined
                ? new Date(undefined!).toISOString()
                : null,
            addedBy: undefined || null,
            modifiedDate: undefined || null,
            modifiedBy: undefined || null,
            serviceRepresentative: undefined || null,
            customerRelation: undefined || null,
            preferredProjectManager: undefined || null,
            billingPreference: undefined || null,
            christmasCard: undefined || false,
            lastContactDate: undefined || null,
            inactiveReason: undefined || null,
            inactiveReasonDetail: undefined || "",
            industry: undefined || null,
            followUps: (undefined || []).map((inner) =>
                repairContactFollowUpJSON(inner)
            ),
        };
    }
}

export function ContactToJSON(value: Contact): ContactJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        contactNumber: value.contactNumber,
        name: value.name,
        email: value.email,
        emails: value.emails.map((inner) => inner),
        phones: value.phones.map((inner) => ContactPhoneToJSON(inner)),
        type: value.type,
        company: value.company,
        companyHistory: value.companyHistory.map((inner) =>
            CompanyHistoryToJSON(inner)
        ),
        unitNumber: value.unitNumber,
        spouseName: value.spouseName,
        childrenNames: value.childrenNames,
        birthdate: value.birthdate !== null ? value.birthdate.toString() : null,
        bestTimeToCall: value.bestTimeToCall,
        preferredCommunication: value.preferredCommunication,
        relatedTo: value.relatedTo,
        stayInTouchCycle: value.stayInTouchCycle,
        conversationStarter: value.conversationStarter,
        personalityType: value.personalityType,
        notes: value.notes.map((inner) => DatedStringToJSON(inner)),
        addedDate: value.addedDate !== null ? value.addedDate.toString() : null,
        addedDateTime:
            value.addedDateTime !== null
                ? value.addedDateTime.toISOString()
                : null,
        addedBy: value.addedBy,
        modifiedDate:
            value.modifiedDate !== null ? value.modifiedDate.toString() : null,
        modifiedBy: value.modifiedBy,
        serviceRepresentative: value.serviceRepresentative,
        customerRelation: value.customerRelation,
        preferredProjectManager: value.preferredProjectManager,
        billingPreference: value.billingPreference,
        christmasCard: value.christmasCard,
        lastContactDate:
            value.lastContactDate !== null
                ? value.lastContactDate.toString()
                : null,
        inactiveReason: value.inactiveReason,
        inactiveReasonDetail: value.inactiveReasonDetail,
        industry: value.industry,
        followUps: value.followUps.map((inner) => ContactFollowUpToJSON(inner)),
    };
}

export const CONTACT_META: RecordMeta<
    Contact,
    ContactJSON,
    ContactBrokenJSON
> & { name: "Contact" } = {
    name: "Contact",
    type: "record",
    repair: repairContactJSON,
    toJSON: ContactToJSON,
    fromJSON: JSONToContact,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        contactNumber: { type: "serial" },
        name: { type: "string" },
        email: { type: "string" },
        emails: { type: "array", items: { type: "string" } },
        phones: { type: "array", items: CONTACT_PHONE_META },
        type: { type: "uuid", linkTo: "ContactType" },
        company: { type: "uuid", linkTo: "Company" },
        companyHistory: { type: "array", items: COMPANY_HISTORY_META },
        unitNumber: { type: "string" },
        spouseName: { type: "string" },
        childrenNames: { type: "string" },
        birthdate: { type: "date" },
        bestTimeToCall: { type: "string" },
        preferredCommunication: { type: "string" },
        relatedTo: { type: "string" },
        stayInTouchCycle: { type: "string" },
        conversationStarter: { type: "string" },
        personalityType: { type: "string" },
        notes: { type: "array", items: DATED_STRING_META },
        addedDate: { type: "date" },
        addedDateTime: { type: "datetime" },
        addedBy: { type: "uuid", linkTo: "User" },
        modifiedDate: { type: "date" },
        modifiedBy: { type: "uuid", linkTo: "User" },
        serviceRepresentative: { type: "uuid", linkTo: "User" },
        customerRelation: { type: "uuid", linkTo: "CustomerRelation" },
        preferredProjectManager: { type: "uuid", linkTo: "User" },
        billingPreference: { type: "uuid", linkTo: "any" },
        christmasCard: { type: "boolean" },
        lastContactDate: { type: "date" },
        inactiveReason: { type: "uuid", linkTo: "ContactInactiveReason" },
        inactiveReasonDetail: { type: "string" },
        industry: { type: "uuid", linkTo: "Industry" },
        followUps: { type: "array", items: CONTACT_FOLLOW_UP_META },
    },
    userFacingKey: "contactNumber",
    functions: {
        pendingFollowUpUser: {
            fn: calcContactPendingFollowUpUser,
            parameterTypes: () => [CONTACT_META],
            returnType: { type: "uuid", linkTo: "User" },
        },
        pendingFollowUpDate: {
            fn: calcContactPendingFollowUpDate,
            parameterTypes: () => [CONTACT_META],
            returnType: { type: "date" },
        },
        pendingFollowUpOverdue: {
            fn: calcContactPendingFollowUpOverdue,
            parameterTypes: () => [CONTACT_META],
            returnType: { type: "boolean" },
        },
        active: {
            fn: calcContactActive,
            parameterTypes: () => [CONTACT_META],
            returnType: { type: "boolean" },
        },
        cell: {
            fn: calcContactCell,
            parameterTypes: () => [CONTACT_META],
            returnType: { type: "phone" },
        },
        phone: {
            fn: calcContactPhone,
            parameterTypes: () => [CONTACT_META],
            returnType: { type: "phone" },
        },
        summary: {
            fn: calcContactSummary,
            parameterTypes: () => [CONTACT_META],
            returnType: { type: "string" },
        },
    },
    segments: {},
};

export type ContactDetailJSON = {
    contact: string | null;
    name: string;
    email: string;
    phones: ContactPhoneJSON[];
    type: string | null;
    company: CompanyDetailJSON;
    unitNumber: string;
};

export function JSONToContactDetail(json: ContactDetailJSON): ContactDetail {
    return {
        contact: json.contact,
        name: json.name,
        email: json.email,
        phones: json.phones.map((inner) => JSONToContactPhone(inner)),
        type: json.type,
        company: JSONToCompanyDetail(json.company),
        unitNumber: json.unitNumber,
    };
}
export type ContactDetailBrokenJSON = {
    contact?: string | null;
    name?: string;
    email?: string;
    phones?: ContactPhoneJSON[];
    type?: string | null;
    company?: CompanyDetailJSON;
    unitNumber?: string;
};

export function newContactDetail(): ContactDetail {
    return JSONToContactDetail(repairContactDetailJSON(undefined));
}
export function repairContactDetailJSON(
    json: ContactDetailBrokenJSON | undefined
): ContactDetailJSON {
    if (json) {
        return {
            contact: json.contact || null,
            name: json.name || "",
            email: json.email || "",
            phones: (json.phones || []).map((inner) =>
                repairContactPhoneJSON(inner)
            ),
            type: json.type || null,
            company: repairCompanyDetailJSON(json.company),
            unitNumber: json.unitNumber || "",
        };
    } else {
        return {
            contact: undefined || null,
            name: undefined || "",
            email: undefined || "",
            phones: (undefined || []).map((inner) =>
                repairContactPhoneJSON(inner)
            ),
            type: undefined || null,
            company: repairCompanyDetailJSON(undefined),
            unitNumber: undefined || "",
        };
    }
}

export function ContactDetailToJSON(value: ContactDetail): ContactDetailJSON {
    return {
        contact: value.contact,
        name: value.name,
        email: value.email,
        phones: value.phones.map((inner) => ContactPhoneToJSON(inner)),
        type: value.type,
        company: CompanyDetailToJSON(value.company),
        unitNumber: value.unitNumber,
    };
}

export const CONTACT_DETAIL_META: RecordMeta<
    ContactDetail,
    ContactDetailJSON,
    ContactDetailBrokenJSON
> & { name: "ContactDetail" } = {
    name: "ContactDetail",
    type: "record",
    repair: repairContactDetailJSON,
    toJSON: ContactDetailToJSON,
    fromJSON: JSONToContactDetail,
    fields: {
        contact: { type: "uuid", linkTo: "Contact" },
        name: { type: "string" },
        email: { type: "string" },
        phones: { type: "array", items: CONTACT_PHONE_META },
        type: { type: "uuid", linkTo: "ContactType" },
        company: COMPANY_DETAIL_META,
        unitNumber: { type: "string" },
    },
    userFacingKey: "name",
    functions: {
        summary: {
            fn: calcContactDetailSummary,
            parameterTypes: () => [CONTACT_DETAIL_META],
            returnType: { type: "string" },
        },
        cell: {
            fn: calcContactDetailCell,
            parameterTypes: () => [CONTACT_DETAIL_META],
            returnType: { type: "phone" },
        },
        phone: {
            fn: calcContactDetailPhone,
            parameterTypes: () => [CONTACT_DETAIL_META],
            returnType: { type: "phone" },
        },
    },
    segments: {},
};

// END MAGIC -- DO NOT EDIT
