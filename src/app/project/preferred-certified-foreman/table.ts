import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { User } from "../../user/table";

//!Data
export type PreferredCertifiedForeman = {
    certifiedForeman: Link<User>;
    reason: string;
};

// BEGIN MAGIC -- DO NOT EDIT
export type PreferredCertifiedForemanJSON = {
    certifiedForeman: string | null;
    reason: string;
};

export function JSONToPreferredCertifiedForeman(
    json: PreferredCertifiedForemanJSON
): PreferredCertifiedForeman {
    return {
        certifiedForeman: json.certifiedForeman,
        reason: json.reason,
    };
}
export type PreferredCertifiedForemanBrokenJSON = {
    certifiedForeman?: string | null;
    reason?: string;
};

export function newPreferredCertifiedForeman(): PreferredCertifiedForeman {
    return JSONToPreferredCertifiedForeman(
        repairPreferredCertifiedForemanJSON(undefined)
    );
}
export function repairPreferredCertifiedForemanJSON(
    json: PreferredCertifiedForemanBrokenJSON | undefined
): PreferredCertifiedForemanJSON {
    if (json) {
        return {
            certifiedForeman: json.certifiedForeman || null,
            reason: json.reason || "",
        };
    } else {
        return {
            certifiedForeman: undefined || null,
            reason: undefined || "",
        };
    }
}

export function PreferredCertifiedForemanToJSON(
    value: PreferredCertifiedForeman
): PreferredCertifiedForemanJSON {
    return {
        certifiedForeman: value.certifiedForeman,
        reason: value.reason,
    };
}

export const PREFERRED_CERTIFIED_FOREMAN_META: RecordMeta<
    PreferredCertifiedForeman,
    PreferredCertifiedForemanJSON,
    PreferredCertifiedForemanBrokenJSON
> & { name: "PreferredCertifiedForeman" } = {
    name: "PreferredCertifiedForeman",
    type: "record",
    repair: repairPreferredCertifiedForemanJSON,
    toJSON: PreferredCertifiedForemanToJSON,
    fromJSON: JSONToPreferredCertifiedForeman,
    fields: {
        certifiedForeman: { type: "uuid", linkTo: "User" },
        reason: { type: "string" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
