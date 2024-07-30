import RAW_COLUMNS from "../../columns.json";
import { Dictionary } from "../common";
import { Meta } from "../meta";
import { titleCase } from "../title-case";

export function keyToLabel(key: string): string {
    const parts = key.split(".");

    return parts.map((text) => titleCase(text)).join(" > ");
}

export const COLUMNS: Dictionary<
    Dictionary<{
        meta: Meta;
        subkeyType: null | "SaltProduct" | "Role";
    }>
> = RAW_COLUMNS as any;
