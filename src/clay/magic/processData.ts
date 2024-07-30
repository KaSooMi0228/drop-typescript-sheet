import { constantCase } from "change-case";
import {
    CodeBlockWriter,
    ImportSpecifierStructure,
    Node,
    Project,
    SourceFile,
} from "ts-morph";
import { Dictionary } from "../common";
import bail from "./bail";
import { Processor } from "./Processor";

type TypeHandler = {
    jsonType: string;
    fromJSON: (access: string) => string;
    repairJSON: (access: string) => string;
    toJSON: (access: string) => string;
    imports: Dictionary<string[]>;
    meta: string;
};

const ATOMICS: Dictionary<TypeHandler> = {
    string: {
        jsonType: "string",
        fromJSON: (value) => value,
        repairJSON: (value) => value + ' || ""',
        toJSON: (value) => value,
        imports: {},
        meta: JSON.stringify({ type: "string" }),
    },
    ArrayBuffer: {
        jsonType: "string",
        fromJSON: (value) => `b64decode(${value})`,
        repairJSON: (value) => value + ' || ""',
        toJSON: (value) => `b64encode(${value})`,
        imports: {
            "base64-arraybuffer": [
                "encode as b64encode",
                "decode as b64decode",
            ],
        },
        meta: JSON.stringify({ type: "binary" }),
    },
    Money: {
        jsonType: "string",
        fromJSON: (value) => `new Decimal(${value})`,
        repairJSON: (value) => value + ' || "0"',
        toJSON: (value) => `(${value}).toString()`,
        imports: {
            "decimal.js": ["Decimal"],
        },
        meta: JSON.stringify({ type: "money" }),
    },
    Percentage: {
        jsonType: "string",
        fromJSON: (value) => `new Decimal(${value})`,
        repairJSON: (value) => value + ' || "0"',
        toJSON: (value) => `(${value}).toString()`,
        imports: {
            "decimal.js": ["Decimal"],
        },
        meta: JSON.stringify({ type: "percentage" }),
    },
    Quantity: {
        jsonType: "string",
        fromJSON: (value) => `new Decimal(${value})`,
        repairJSON: (value) => value + ' || "0"',
        toJSON: (value) => `(${value}).toString()`,
        imports: {
            "decimal.js": ["Decimal"],
        },
        meta: JSON.stringify({ type: "quantity" }),
    },
    Phone: {
        jsonType: "string",
        fromJSON: (value) => `new Phone(${value})`,
        toJSON: (value) => value + ".phone",
        repairJSON: (value) => value + ' || ""',
        imports: {},
        meta: JSON.stringify({ type: "phone" }),
    },
    "Phone | null": {
        jsonType: "string",
        fromJSON: (value) => `new Phone(${value})`,
        toJSON: (value) => value + ".phone",
        repairJSON: (value) => value + ' || ""',
        imports: {},
        meta: JSON.stringify({ type: "phone" }),
    },
    boolean: {
        jsonType: "boolean",
        fromJSON: (value) => value,
        repairJSON: (value) => value + " || false",
        toJSON: (value) => value,
        imports: {},
        meta: JSON.stringify({ type: "boolean" }),
    },
    UUID: {
        jsonType: "string",
        toJSON: (value) => value + ".uuid",
        fromJSON: (value) => `{uuid: ${value}}`,
        repairJSON: (value) => value + " || genUUID()",
        imports: {},
        meta: JSON.stringify({ type: "uuid" }),
    },
    Version: {
        jsonType: "number | null",
        toJSON: (value) => value + ".version",
        fromJSON: (value) => `{version: ${value}}`,
        repairJSON: (value) => {
            if (value === "undefined") {
                return "null";
            } else {
                return value + " === undefined ? null : " + value;
            }
        },
        imports: {},
        meta: JSON.stringify({ type: "version" }),
    },
    ["LocalDate | null"]: {
        jsonType: "string | null",
        toJSON: (value) => `${value} !== null ? ${value}.toString() : null`,
        fromJSON: (value) =>
            `${value} !== null ? LocalDate.parse(${value}) : null`,
        repairJSON: (value) => value + " || null",
        imports: {},
        meta: JSON.stringify({ type: "date" }),
    },
    ["Money | null"]: {
        jsonType: "string | null",
        toJSON: (value) => `${value} !== null ? ${value}.toString() : null`,
        fromJSON: (value) => `${value} !== null ? new Decimal(${value}) : null`,
        repairJSON: (value) => value + " || null",
        imports: { "decimal.js": ["Decimal"] },
        meta: JSON.stringify({ type: "money?" }),
    },
    ["Percentage | null"]: {
        jsonType: "string | null",
        toJSON: (value) => `${value} !== null ? ${value}.toString() : null`,
        fromJSON: (value) => `${value} !== null ? new Decimal(${value}) : null`,
        repairJSON: (value) => value + " || null",
        imports: { "decimal.js": ["Decimal"] },
        meta: JSON.stringify({ type: "percentage?" }),
    },
    ["Quantity | null"]: {
        jsonType: "string | null",
        toJSON: (value) => `${value} !== null ? ${value}.toString() : null`,
        fromJSON: (value) => `${value} !== null ? new Decimal(${value}) : null`,
        repairJSON: (value) => value + " || null",
        imports: { "decimal.js": ["Decimal"] },
        meta: JSON.stringify({ type: "quantity?" }),
    },

    ["Date | null"]: {
        jsonType: "string | null",
        toJSON: (value) => `${value} !== null ? ${value}.toISOString() : null`,
        fromJSON: (value) => `${value} !== null ? dateParse(${value}) : null`,
        repairJSON: (value) =>
            `${value} ? new Date(${value}!).toISOString() : null`,
        imports: {},
        meta: JSON.stringify({ type: "datetime" }),
    },
    ["boolean | null"]: {
        jsonType: "boolean | null",
        toJSON: (value) => `${value}`,
        fromJSON: (value) => `${value}`,
        repairJSON: (value) => value + " ?? null",
        imports: {},
        meta: JSON.stringify({ type: "boolean?" }),
    },
    Serial: {
        jsonType: "number | null",
        toJSON: (value) => `${value}`,
        fromJSON: (value) => `${value}`,
        repairJSON: (value) =>
            value === "undefined"
                ? "null"
                : `${value} === undefined ? null : ${value}`,
        imports: {},
        meta: JSON.stringify({ type: "serial" }),
    },
};

function linkType(name: string): TypeHandler {
    return {
        jsonType: "string | null",
        fromJSON: (value) => value,
        repairJSON: (value) => value + "|| null",
        toJSON: (value) => value,
        imports: {},
        meta: `{type: 'uuid', linkTo: '${name}'}`,
    };
}

function arrayType(handler: TypeHandler): TypeHandler {
    return {
        jsonType: `(${handler.jsonType})[]`,
        fromJSON: (value) =>
            `${value}.map(inner => ${handler.fromJSON("inner")})`,
        repairJSON: (value) =>
            `(${value} || []).map(inner => ${handler.repairJSON("inner")})`,
        toJSON: (value) => `${value}.map(inner => ${handler.toJSON("inner")})`,
        imports: handler.imports,
        meta: `{type: 'array', items: ${handler.meta}}`,
    };
}

function nullableArrayType(handler: TypeHandler): TypeHandler {
    return {
        jsonType: `(${handler.jsonType})[] | null`,
        fromJSON: (value) =>
            `(${value} === null ? null : ${value}.map(inner => ${handler.fromJSON(
                "inner"
            )}))`,
        repairJSON: (value) =>
            `(Array.isArray(${value}) ? (${value}||[]).map(inner => ${handler.repairJSON(
                "inner"
            )}) : null)`,
        toJSON: (value) =>
            `${value} === null ? null : ${value}.map(inner => ${handler.toJSON(
                "inner"
            )})`,
        imports: handler.imports,
        meta: `{type: 'array?', items: ${handler.meta}}`,
    };
}

function localType(name: string): TypeHandler {
    return {
        jsonType: name + "JSON",
        fromJSON: (value) => `JSONTo${name}(${value})`,
        repairJSON: (value) => `repair${name}JSON(${value})`,
        toJSON: (value) => `${name}ToJSON(${value})`,
        imports: {},
        meta: constantCase(name) + "_META",
    };
}

function remoteType(name: string, specifier: string): TypeHandler {
    return {
        ...localType(name),
        imports: {
            [specifier]: [
                name + "JSON",
                "JSONTo" + name,
                name + "ToJSON",
                "repair" + name + "JSON",
                constantCase(name) + "_META",
            ],
        },
    };
}

function enumType(name: string): TypeHandler {
    const names = name.split("|").map((x) => x.trim());
    if (!names[0]) {
        names.splice(0, 1);
    }
    return {
        jsonType: "string",
        fromJSON: (value) => value + " as any",
        toJSON: (value) => value,
        repairJSON: (value) => `${value} || ${names[0]}`,
        imports: {},
        meta: `{
            type: "enum",
            values: [${names.join(",")}]
        }`,
    };
}

function resolveType(
    sourceFile: SourceFile,
    name: string,
    node: Node
): TypeHandler {
    if (name === "Decimal" || name === "Decimal | null") {
        throw bail(sourceFile, "should not use Decimal");
    }
    if (name.endsWith("[]")) {
        return arrayType(
            resolveType(sourceFile, name.substring(0, name.length - 2), node)
        );
    }
    if (name.endsWith("[] | null")) {
        return nullableArrayType(
            resolveType(sourceFile, name.substring(0, name.length - 2), node)
        );
    }

    if (name.startsWith("Link<")) {
        return linkType(name.slice(5, name.length - 1));
    }
    const atomic = ATOMICS[name];
    if (atomic !== undefined) {
        return atomic;
    }

    if (name.indexOf("|") !== -1) {
        return enumType(name);
    }

    const symbol = sourceFile.getSymbol();
    if (!symbol) {
        throw bail(sourceFile, "symbol table is missing");
    }
    if (symbol.getExport(name) !== undefined) {
        return localType(name);
    }

    const importDeclaration = sourceFile.getImportDeclaration((declaration) => {
        const structure = declaration.getStructure();
        if (structure) {
            for (const namedImport of structure.namedImports as ImportSpecifierStructure[]) {
                if (namedImport.name === name) {
                    return true;
                }
            }
        }
        return false;
    });

    if (importDeclaration) {
        return remoteType(name, importDeclaration.getModuleSpecifierValue());
    }

    throw bail(node, "Unable to resolve type " + name);
}

function extractMembers(node: Node) {
    if (!Node.isTypeAliasDeclaration(node)) {
        throw bail(node, "Expected a TypeAliasDeclaration");
    }

    const typeNode = node.getTypeNode();
    if (!typeNode) {
        throw bail(node, "Missing TypeNode");
    }

    if (!Node.isTypeLiteral(typeNode)) {
        throw bail(node, "Expected a TypeLiteralNode");
    }
    if (typeNode.getMethods().length !== 0) {
        throw bail(node, "Methods not supported");
    }

    const expressions: Dictionary<any> = {};

    const hasSegments = !!node
        .getSourceFile()
        .getVariableStatement(node.getName() + "Segments");

    for (const exportDeclaration of node.getSourceFile().getFunctions()) {
        const name = exportDeclaration.getName();
        if (name && name.startsWith("calc" + node.getName())) {
            const parameters = exportDeclaration.getParameters();
            if (!parameters) {
                throw bail(exportDeclaration, "missing parameters");
            }

            if (
                parameters[0].getTypeNodeOrThrow().getText() == node.getName()
            ) {
                const parameterTypes = parameters.map((parameter) =>
                    resolveType(
                        node.getSourceFile(),
                        parameter.getTypeNodeOrThrow().getText(),
                        parameter.getTypeNodeOrThrow()
                    )
                );

                const returnTypeNode = exportDeclaration.getReturnTypeNode();
                if (!returnTypeNode) {
                    throw bail(
                        exportDeclaration,
                        "function must have explicit return type"
                    );
                }

                const returnType = resolveType(
                    node.getSourceFile(),
                    returnTypeNode.getText(),
                    returnTypeNode
                );
                const expressionName = name.slice(4 + node.getName().length);
                expressions[expressionName] = {
                    parameterTypes,
                    returnType,
                };
            }
        }
    }

    return {
        name: node.getName(),
        members: typeNode
            .getProperties()
            .map((property) => property.getStructure())
            .map((property) => ({
                type: resolveType(
                    node.getSourceFile(),
                    property.type as string,
                    typeNode
                ),
                name: property.name,
                nullable: property.hasQuestionToken,
            })),
        expressions,
        hasSegments,
    };
}

export default function processTables(project: Project, node: Node): Processor {
    const tables: Dictionary<boolean> = {};

    const detail = extractMembers(node);

    const metaSourceFile = project.getSourceFile("src/clay/meta.ts");
    if (!metaSourceFile) {
        throw bail(node, "cannot find meta source");
    }
    const metaPath = node
        .getSourceFile()
        .getDirectory()
        .getRelativePathAsModuleSpecifierTo(metaSourceFile);

    const uuidSourceFile = project.getSourceFile("src/clay/uuid.ts");
    if (!uuidSourceFile) {
        throw bail(node, "cannot find uuid source");
    }
    const uuidPath = node
        .getSourceFile()
        .getDirectory()
        .getRelativePathAsModuleSpecifierTo(uuidSourceFile);

    const imports: Dictionary<string[]> = {
        [metaPath]: ["Meta", "RecordMeta"],
        [uuidPath]: ["genUUID"],
    };

    for (const member of detail.members) {
        for (const key of Object.keys(member.type.imports)) {
            imports[key] = [
                ...(imports[key] || []),
                ...member.type.imports[key],
            ];
        }
    }

    let userFacingKey: string | null = null;

    for (const member of detail.members) {
        if (member.type === ATOMICS.Serial) {
            userFacingKey = member.name;
        }
    }

    if (userFacingKey === null) {
        for (const member of detail.members) {
            if (
                member.name === "name" ||
                member.name === "title" ||
                member.name === "number"
            ) {
                userFacingKey = member.name;
            }
        }
    }

    return {
        imports,
        defaultImports: {
            dateParse: "date-fns/parseISO",
        },
        code: (writer: CodeBlockWriter) => {
            writer.write(`export type ${detail.name}JSON =`).block(() => {
                for (const member of detail.members) {
                    writer.writeLine(`${member.name}: ${member.type.jsonType}`);
                }
            });
            writer.writeLine("");
            writer
                .write(
                    `export function JSONTo${detail.name}(json: ${detail.name}JSON): ${detail.name}`
                )
                .block(() => {
                    writer.write("return").block(() => {
                        for (const member of detail.members) {
                            writer.writeLine(
                                `${member.name}: ${member.type.fromJSON(
                                    "json." + member.name
                                )},`
                            );
                        }
                    });
                });
            writer.write(`export type ${detail.name}BrokenJSON =`).block(() => {
                for (const member of detail.members) {
                    writer.writeLine(
                        `${member.name}?: ${member.type.jsonType}`
                    );
                }
            });
            writer.writeLine("");
            writer
                .write(`export function new${detail.name}(): ${detail.name}`)
                .block(() => {
                    writer.writeLine(
                        `return JSONTo${detail.name}(repair${detail.name}JSON(undefined))`
                    );
                });
            writer
                .write(
                    `export function repair${detail.name}JSON(json: ${detail.name}BrokenJSON | undefined): ${detail.name}JSON`
                )
                .block(() => {
                    writer.write("if (json)").block(() => {
                        writer.write("return").block(() => {
                            for (const member of detail.members) {
                                writer.writeLine(
                                    `${member.name}: ${member.type.repairJSON(
                                        "json." + member.name
                                    )},`
                                );
                            }
                        });
                    });
                    writer.write("else").block(() => {
                        writer.write("return").block(() => {
                            for (const member of detail.members) {
                                writer.writeLine(
                                    `${member.name}: ${member.type.repairJSON(
                                        "undefined"
                                    )},`
                                );
                            }
                        });
                    });
                });
            writer.writeLine("");
            writer
                .write(
                    `export function ${detail.name}ToJSON(value: ${detail.name}): ${detail.name}JSON`
                )
                .block(() => {
                    writer.write("return").block(() => {
                        for (const member of detail.members) {
                            writer.writeLine(
                                `${member.name}: ${member.type.toJSON(
                                    "value." + member.name
                                )},`
                            );
                        }
                    });
                });
            writer.writeLine("");
            writer
                .write(
                    `export const ${constantCase(
                        detail.name
                    )}_META: RecordMeta<${detail.name}, ${detail.name}JSON, ${
                        detail.name
                    }BrokenJSON> & {name: "${detail.name}"} = `
                )
                .block(() => {
                    writer.writeLine(`name: "${detail.name}",`);
                    writer.writeLine('type: "record",');
                    writer.writeLine(`repair: repair${detail.name}JSON,`);
                    writer.writeLine(`toJSON: ${detail.name}ToJSON,`);
                    writer.writeLine(`fromJSON: JSONTo${detail.name},`);
                    writer.write("fields:").block(() => {
                        for (const member of detail.members) {
                            writer.writeLine(
                                `${member.name}: ${member.type.meta},`
                            );
                        }
                    });
                    writer.writeLine(
                        `,userFacingKey: ${JSON.stringify(userFacingKey)},`
                    );
                    writer.write("functions: ").block(() => {
                        for (const [key, value] of Object.entries(
                            detail.expressions
                        )) {
                            writer
                                .write(
                                    key.charAt(0).toLowerCase() +
                                        key.slice(1) +
                                        ":"
                                )
                                .block(() => {
                                    writer.writeLine(
                                        `fn: calc${detail.name}${key},`
                                    );
                                    writer.writeLine(
                                        `parameterTypes: () => [${value.parameterTypes
                                            .map((x: any) => x.meta)
                                            .join(",")}],`
                                    );
                                    writer.writeLine(
                                        `returnType: ${value.returnType.meta},`
                                    );
                                });
                            writer.write(",");
                        }
                    });
                    writer.writeLine(
                        `,segments: ${
                            detail.hasSegments ? detail.name + "Segments" : "{}"
                        }`
                    );
                });
            writer.writeLine("");
        },
    };
}
