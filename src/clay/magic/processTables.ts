import { constantCase } from "change-case";
import {
    CodeBlockWriter,
    ImportSpecifierStructure,
    Node,
    Project,
} from "ts-morph";
import { Dictionary } from "../common";
import bail from "./bail";
import { Processor } from "./Processor";

type TableDetail = {
    name: string;
    container: string;
};

export default function processTables(project: Project, node: Node): Processor {
    const tables: Dictionary<boolean> = {};

    if (!Node.isTypeAliasDeclaration(node)) {
        throw bail(node, "Expected a TypeAliasDeclaration");
    } else {
        const structure = node.getStructure();
        const typeNode = node.getTypeNode();
        if (!typeNode) {
            throw bail(node, "Missing TypeNode");
        } else {
            if (!Node.isTupleTypeNode(typeNode)) {
                throw bail(typeNode, "Expected a TupleTypeNode");
            } else {
                for (const subTypeNode of typeNode.getElements()) {
                    if (!Node.isTypeReference(subTypeNode)) {
                        throw bail(
                            subTypeNode,
                            "Expected a type reference node"
                        );
                    } else {
                        if (subTypeNode.getTypeArguments().length !== 0) {
                            throw bail(
                                subTypeNode,
                                "Did not expect type arguments"
                            );
                        }
                        const typeName = subTypeNode.getTypeName();
                        if (!Node.isIdentifier(typeName)) {
                            throw bail(typeName, "expected identifier");
                        } else {
                            const tableName: string = typeName.getText();
                            tables[tableName] = true;
                        }
                    }
                }
            }
        }
    }

    const metaSourceFile = project.getSourceFile("src/clay/meta.ts");
    if (!metaSourceFile) {
        throw bail(node, "cannot find meta source");
    }
    const metaPath = node
        .getSourceFile()
        .getDirectory()
        .getRelativePathAsModuleSpecifierTo(metaSourceFile);

    const commonSourceFile = project.getSourceFile("src/clay/common.ts");
    if (!commonSourceFile) {
        throw bail(node, "cannot find common source");
    }
    const commonPath = node
        .getSourceFile()
        .getDirectory()
        .getRelativePathAsModuleSpecifierTo(commonSourceFile);

    const imports: Dictionary<string[]> = {
        [commonPath]: ["Dictionary"],
        [metaPath]: ["RecordMeta"],
    };

    for (const importDeclaration of node
        .getSourceFile()
        .getImportDeclarations()) {
        const structure = importDeclaration.getStructure();
        if (structure) {
            for (const namedImport of structure.namedImports as ImportSpecifierStructure[]) {
                if (tables[namedImport.name]) {
                    const specifier =
                        importDeclaration.getModuleSpecifierValue();
                    imports[specifier] = [
                        ...(imports[specifier] || []),
                        constantCase(namedImport.name) + "_META",
                    ];
                }
            }
        }
    }

    return {
        imports,
        defaultImports: {},
        code: (writer: CodeBlockWriter) => {
            writer
                .write(
                    `export const TABLES_META: Dictionary<RecordMeta<any, any, any>> = `
                )
                .block(() => {
                    for (const name of Object.keys(tables)) {
                        writer.writeLine(
                            `${name}: ${constantCase(name)}_META,`
                        );
                    }
                });
            writer.writeLine("");
        },
    };
}
