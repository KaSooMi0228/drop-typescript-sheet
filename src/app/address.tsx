import { RecordMeta } from "../clay/meta";
import * as React from "react";

//!Data
export type Address = {
    line1: string;
    unitNumber: string;
    city: string;
    postal: string;
    province: string;
};

export function calcAddressLineFormatted(address: Address): string {
    return (
        address.line1 +
        (address.unitNumber === "" ? "" : " ") +
        address.unitNumber +
        ", " +
        address.city +
        ", " +
        address.province +
        " " +
        address.postal
    );
}

export function isAddressEmpty(address: Address) {
    return (
        address.line1 === "" &&
        address.unitNumber === "" &&
        address.city === "" &&
        address.postal === "" &&
        address.province === ""
    );
}

// BEGIN MAGIC -- DO NOT EDIT
export type AddressJSON = {
    line1: string;
    unitNumber: string;
    city: string;
    postal: string;
    province: string;
};

export function JSONToAddress(json: AddressJSON): Address {
    return {
        line1: json.line1,
        unitNumber: json.unitNumber,
        city: json.city,
        postal: json.postal,
        province: json.province,
    };
}
export type AddressBrokenJSON = {
    line1?: string;
    unitNumber?: string;
    city?: string;
    postal?: string;
    province?: string;
};

export function newAddress(): Address {
    return JSONToAddress(repairAddressJSON(undefined));
}
export function repairAddressJSON(
    json: AddressBrokenJSON | undefined
): AddressJSON {
    if (json) {
        return {
            line1: json.line1 || "",
            unitNumber: json.unitNumber || "",
            city: json.city || "",
            postal: json.postal || "",
            province: json.province || "",
        };
    } else {
        return {
            line1: undefined || "",
            unitNumber: undefined || "",
            city: undefined || "",
            postal: undefined || "",
            province: undefined || "",
        };
    }
}

export function AddressToJSON(value: Address): AddressJSON {
    return {
        line1: value.line1,
        unitNumber: value.unitNumber,
        city: value.city,
        postal: value.postal,
        province: value.province,
    };
}

export const ADDRESS_META: RecordMeta<
    Address,
    AddressJSON,
    AddressBrokenJSON
> & { name: "Address" } = {
    name: "Address",
    type: "record",
    repair: repairAddressJSON,
    toJSON: AddressToJSON,
    fromJSON: JSONToAddress,
    fields: {
        line1: { type: "string" },
        unitNumber: { type: "string" },
        city: { type: "string" },
        postal: { type: "string" },
        province: { type: "string" },
    },
    userFacingKey: null,
    functions: {
        lineFormatted: {
            fn: calcAddressLineFormatted,
            parameterTypes: () => [ADDRESS_META],
            returnType: { type: "string" },
        },
    },
    segments: {},
};

// END MAGIC -- DO NOT EDIT
