import { Link } from "../../clay/link";
import { LocalDate } from "../../clay/LocalDate";
import { RecordMeta } from "../../clay/meta";
import { Phone } from "../../clay/phone";
import { genUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";
import { Term } from "../../terms/table";
import {
    Address,
    AddressJSON,
    AddressToJSON,
    ADDRESS_META,
    JSONToAddress,
    repairAddressJSON,
} from "../address";
import { User } from "../user/table";

//!Data
export type Company = {
    id: UUID;
    recordVersion: Version;
    name: string;
    address: Address;
    email: string;
    fax: Phone;
    phone: Phone;
    website: string;
    unitNumber: string;

    addedDate: LocalDate | null;
    addedBy: Link<User>;
    modifiedDate: LocalDate | null;
    modifiedBy: Link<User>;
    serviceRepresentative: Link<User>;
    terms: Link<Term>;
    billingContactEmail: string;
};

export function calcCompanySummary(company: Company): string {
    return (
        company.name +
        " (" +
        company.address.city +
        " " +
        company.phone.format() +
        ")"
    );
}

//!Data
export type CompanyDetail = {
    company: Link<Company>;
    name: string;
    address: Address;
    email: string;
    fax: Phone;
    phone: Phone;
    website: string;
    billingContactEmail: string;
};

// BEGIN MAGIC -- DO NOT EDIT
export type CompanyJSON = {
    id: string;
    recordVersion: number | null;
    name: string;
    address: AddressJSON;
    email: string;
    fax: string;
    phone: string;
    website: string;
    unitNumber: string;
    addedDate: string | null;
    addedBy: string | null;
    modifiedDate: string | null;
    modifiedBy: string | null;
    serviceRepresentative: string | null;
    terms: string | null;
    billingContactEmail: string;
};

export function JSONToCompany(json: CompanyJSON): Company {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        name: json.name,
        address: JSONToAddress(json.address),
        email: json.email,
        fax: new Phone(json.fax),
        phone: new Phone(json.phone),
        website: json.website,
        unitNumber: json.unitNumber,
        addedDate:
            json.addedDate !== null ? LocalDate.parse(json.addedDate) : null,
        addedBy: json.addedBy,
        modifiedDate:
            json.modifiedDate !== null
                ? LocalDate.parse(json.modifiedDate)
                : null,
        modifiedBy: json.modifiedBy,
        serviceRepresentative: json.serviceRepresentative,
        terms: json.terms,
        billingContactEmail: json.billingContactEmail,
    };
}
export type CompanyBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    name?: string;
    address?: AddressJSON;
    email?: string;
    fax?: string;
    phone?: string;
    website?: string;
    unitNumber?: string;
    addedDate?: string | null;
    addedBy?: string | null;
    modifiedDate?: string | null;
    modifiedBy?: string | null;
    serviceRepresentative?: string | null;
    terms?: string | null;
    billingContactEmail?: string;
};

export function newCompany(): Company {
    return JSONToCompany(repairCompanyJSON(undefined));
}
export function repairCompanyJSON(
    json: CompanyBrokenJSON | undefined
): CompanyJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            name: json.name || "",
            address: repairAddressJSON(json.address),
            email: json.email || "",
            fax: json.fax || "",
            phone: json.phone || "",
            website: json.website || "",
            unitNumber: json.unitNumber || "",
            addedDate: json.addedDate || null,
            addedBy: json.addedBy || null,
            modifiedDate: json.modifiedDate || null,
            modifiedBy: json.modifiedBy || null,
            serviceRepresentative: json.serviceRepresentative || null,
            terms: json.terms || null,
            billingContactEmail: json.billingContactEmail || "",
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            name: undefined || "",
            address: repairAddressJSON(undefined),
            email: undefined || "",
            fax: undefined || "",
            phone: undefined || "",
            website: undefined || "",
            unitNumber: undefined || "",
            addedDate: undefined || null,
            addedBy: undefined || null,
            modifiedDate: undefined || null,
            modifiedBy: undefined || null,
            serviceRepresentative: undefined || null,
            terms: undefined || null,
            billingContactEmail: undefined || "",
        };
    }
}

export function CompanyToJSON(value: Company): CompanyJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        name: value.name,
        address: AddressToJSON(value.address),
        email: value.email,
        fax: value.fax.phone,
        phone: value.phone.phone,
        website: value.website,
        unitNumber: value.unitNumber,
        addedDate: value.addedDate !== null ? value.addedDate.toString() : null,
        addedBy: value.addedBy,
        modifiedDate:
            value.modifiedDate !== null ? value.modifiedDate.toString() : null,
        modifiedBy: value.modifiedBy,
        serviceRepresentative: value.serviceRepresentative,
        terms: value.terms,
        billingContactEmail: value.billingContactEmail,
    };
}

export const COMPANY_META: RecordMeta<
    Company,
    CompanyJSON,
    CompanyBrokenJSON
> & { name: "Company" } = {
    name: "Company",
    type: "record",
    repair: repairCompanyJSON,
    toJSON: CompanyToJSON,
    fromJSON: JSONToCompany,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        name: { type: "string" },
        address: ADDRESS_META,
        email: { type: "string" },
        fax: { type: "phone" },
        phone: { type: "phone" },
        website: { type: "string" },
        unitNumber: { type: "string" },
        addedDate: { type: "date" },
        addedBy: { type: "uuid", linkTo: "User" },
        modifiedDate: { type: "date" },
        modifiedBy: { type: "uuid", linkTo: "User" },
        serviceRepresentative: { type: "uuid", linkTo: "User" },
        terms: { type: "uuid", linkTo: "Term" },
        billingContactEmail: { type: "string" },
    },
    userFacingKey: "name",
    functions: {
        summary: {
            fn: calcCompanySummary,
            parameterTypes: () => [COMPANY_META],
            returnType: { type: "string" },
        },
    },
    segments: {},
};

export type CompanyDetailJSON = {
    company: string | null;
    name: string;
    address: AddressJSON;
    email: string;
    fax: string;
    phone: string;
    website: string;
    billingContactEmail: string;
};

export function JSONToCompanyDetail(json: CompanyDetailJSON): CompanyDetail {
    return {
        company: json.company,
        name: json.name,
        address: JSONToAddress(json.address),
        email: json.email,
        fax: new Phone(json.fax),
        phone: new Phone(json.phone),
        website: json.website,
        billingContactEmail: json.billingContactEmail,
    };
}
export type CompanyDetailBrokenJSON = {
    company?: string | null;
    name?: string;
    address?: AddressJSON;
    email?: string;
    fax?: string;
    phone?: string;
    website?: string;
    billingContactEmail?: string;
};

export function newCompanyDetail(): CompanyDetail {
    return JSONToCompanyDetail(repairCompanyDetailJSON(undefined));
}
export function repairCompanyDetailJSON(
    json: CompanyDetailBrokenJSON | undefined
): CompanyDetailJSON {
    if (json) {
        return {
            company: json.company || null,
            name: json.name || "",
            address: repairAddressJSON(json.address),
            email: json.email || "",
            fax: json.fax || "",
            phone: json.phone || "",
            website: json.website || "",
            billingContactEmail: json.billingContactEmail || "",
        };
    } else {
        return {
            company: undefined || null,
            name: undefined || "",
            address: repairAddressJSON(undefined),
            email: undefined || "",
            fax: undefined || "",
            phone: undefined || "",
            website: undefined || "",
            billingContactEmail: undefined || "",
        };
    }
}

export function CompanyDetailToJSON(value: CompanyDetail): CompanyDetailJSON {
    return {
        company: value.company,
        name: value.name,
        address: AddressToJSON(value.address),
        email: value.email,
        fax: value.fax.phone,
        phone: value.phone.phone,
        website: value.website,
        billingContactEmail: value.billingContactEmail,
    };
}

export const COMPANY_DETAIL_META: RecordMeta<
    CompanyDetail,
    CompanyDetailJSON,
    CompanyDetailBrokenJSON
> & { name: "CompanyDetail" } = {
    name: "CompanyDetail",
    type: "record",
    repair: repairCompanyDetailJSON,
    toJSON: CompanyDetailToJSON,
    fromJSON: JSONToCompanyDetail,
    fields: {
        company: { type: "uuid", linkTo: "Company" },
        name: { type: "string" },
        address: ADDRESS_META,
        email: { type: "string" },
        fax: { type: "phone" },
        phone: { type: "phone" },
        website: { type: "string" },
        billingContactEmail: { type: "string" },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
