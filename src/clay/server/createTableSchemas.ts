import ajv, { Ajv } from "ajv";
import { mapValues } from "lodash";
import { Dictionary } from "../common";
import { Meta } from "../meta";

function transformMetaToSchema(meta: Meta): object {
    switch (meta.type) {
        case "record":
            return {
                type: "object",
                additionalProperties: false,
                required: Object.keys(meta.fields),
                properties: mapValues(meta.fields, transformMetaToSchema),
            };
        case "binary":
            return {
                type: "string",
            };
        case "string":
            return {
                type: "string",
            };
        case "enum":
            return {
                type: "string",
                enum: meta.values,
            };
        case "uuid":
            return {
                oneOf: [
                    {
                        type: "string",
                        pattern:
                            "^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}$",
                    },
                    { type: "null" },
                ],
            };
        case "serial":
            return {
                oneOf: [
                    {
                        type: "number",
                    },
                    { type: "null" },
                ],
            };
        case "date":
            return {
                oneOf: [
                    {
                        type: "string",
                        pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$",
                    },
                    { type: "null" },
                ],
            };
        case "datetime":
            return {
                oneOf: [
                    {
                        type: "string",
                        pattern:
                            "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{3}Z$",
                    },
                    { type: "null" },
                ],
            };
        case "version":
            return {
                oneOf: [{ type: "number" }, { type: "null" }],
            };

        case "boolean":
            return {
                type: "boolean",
            };
        case "boolean?":
            return {
                oneOf: [
                    {
                        type: "boolean",
                    },
                    { type: "null" },
                ],
            };
        case "money?":
        case "percentage?":
        case "quantity?":
            return {
                oneOf: [
                    {
                        type: "string",
                        pattern: "^-?[0-9]+(.[0-9]+)?$",
                    },
                    { type: "null" },
                ],
            };
        case "money":
        case "percentage":
        case "quantity":
            return {
                type: "string",
                pattern: "^-?[0-9]+(.[0-9]+)?$",
            };
        case "phone":
            return {
                type: "string",
                pattern: "^[0-9]*$",
            };
        case "array":
            return {
                type: "array",
                items: transformMetaToSchema(meta.items),
            };
        case "array?":
            return {
                oneOf: [
                    {
                        type: "array",
                        items: transformMetaToSchema(meta.items),
                    },
                    { type: "null" },
                ],
            };
        case "null":
            throw new Error("Should not happen");
    }
}

export default function createTableSchemas(metas: Dictionary<Meta>): Ajv {
    const validator = new ajv();
    for (const key of Object.keys(metas)) {
        validator.addSchema(transformMetaToSchema(metas[key]), key);
    }
    return validator;
}
