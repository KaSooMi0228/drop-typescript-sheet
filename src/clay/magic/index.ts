import { strictEqual } from "assert";
import { promisify } from "es6-promisify";
import {
    readFileSync,
    stat as statStandard,
    statSync,
    writeFileSync,
} from "fs";
import { mapValues, some } from "lodash";
import { resolve } from "path";
import { format } from "prettier";
import { Node, Project, SourceFile } from "ts-morph";
import { Dictionary } from "../common";
import bail from "./bail";
import processData from "./processData";
import { Processor } from "./Processor";
import processTables from "./processTables";
import processWidget from "./processWidget";

const stat = promisify(statStandard);

const PROCESSORS: Dictionary<(project: Project, node: Node) => Processor> = {
    Tables: processTables,
    Data: processData,
};

function isMacroedExport(node: Node): string | null {
    if (Node.isExportable(node) && node.isExported()) {
        const comments = node.getLeadingCommentRanges();
        if (comments.length > 0) {
            if (comments[0].getText().startsWith("//!")) {
                strictEqual(comments.length, 1);
                return comments[0].getText().substring(3).trim();
            }
        }
    }
    return null;
}

const EXTERNAL_NAMED_IMPORTS: Dictionary<string> = {
    strictEqual: "assert",
    deepStrictEqual: "assert",
    mapValues: "lodash",
    fromPairs: "lodash",
    uniqueId: "lodash",
    Client: "pg",
    ClientBase: "pg",
    FunctionBlock: "safe-squel",
    snake: "change-case",
    plural: "pluralize",
    camelCase: "change-case",
};

function processFile(project: Project, source: SourceFile) {
    const text = source.getFullText();
    if (text.indexOf("BEGIN MAGIC") !== -1) {
        const updatedText = text.replace(
            /\n\/\/ BEGIN MAGIC[\s\S]*\n\/\/ END MAGIC.*\n*/,
            ""
        );
        source.replaceText([0, source.getEnd()], updatedText);
    }

    const actions: Processor[] = [];
    const syntaxList = source.getChildSyntaxList();
    if (syntaxList) {
        for (const node of syntaxList.getChildren()) {
            const macro = isMacroedExport(node);
            if (macro != null) {
                const processor = PROCESSORS[macro];
                if (processor) {
                    actions.push(processor(project, node));
                } else {
                    console.error(PROCESSORS);
                    throw bail(node, "Unknown macro " + macro);
                }
            }
        }
    }
    if (source.getFilePath().endsWith(".widget.tsx")) {
        actions.push(processWidget(project, source));
    }

    for (const action of actions) {
        for (const key of Object.keys(action.imports)) {
            source.addImportDeclaration({
                moduleSpecifier: key,
                namedImports: action.imports[key].map((name) => ({ name })),
            });
        }
        for (const [name, specifier] of Object.entries(action.defaultImports)) {
            source.addImportDeclaration({
                moduleSpecifier: specifier,
                namespaceImport: name,
            });
        }
    }

    if (actions.length > 0) {
        source.addStatements((writer) => {
            writer.writeLine("");
            writer.writeLine("");
            writer.writeLine("// BEGIN MAGIC -- DO NOT EDIT");
            for (const action of actions) {
                action.code(writer);
            }
            writer.writeLine("// END MAGIC -- DO NOT EDIT");
        });
    }

    source.organizeImports();

    if (
        source.getFilePath().endsWith(".tsx") &&
        !some(
            source.getImportDeclarations(),
            (x) =>
                x.getStructure().namespaceImport == "React" ||
                x.getStructure().defaultImport == "React"
        )
    ) {
        source.addImportDeclaration({
            moduleSpecifier: "react",
            namespaceImport: "React",
        });
    }

    source.replaceText(
        [0, source.getEnd()],
        format(source.getFullText(), {
            tabWidth: 4,
            parser: "typescript",
        })
    );
}

type CacheDetail = {
    timestamp: number | null;
};

const project = new Project({});
project.addSourceFilesAtPaths("src/**/*{.ts,.tsx}");

let magicCache: Dictionary<CacheDetail>;
try {
    const source = readFileSync(".magic-cache.json", "utf-8");
    magicCache = JSON.parse(source);
} catch (error) {
    magicCache = {};
}

const times = mapValues(magicCache, (_, key) => {
    try {
        return statSync(key).mtime.getTime();
    } catch (error) {
        return undefined;
    }
});

// if any of the magic files change, throw away the old timestamps
// we will rebuild everything
for (const [key, detail] of Object.entries(magicCache)) {
    if (key.indexOf("src/clay/magic") !== -1) {
        const mtime = times[key];
        if (mtime !== detail.timestamp) {
            magicCache = {};
            break;
        }
    }
}

const filenames = [];
const sources = project.getSourceFiles();
const targetFiles = process.argv.slice(2).map((path) => resolve(path));

for (const source of sources) {
    if (targetFiles.length > 0) {
        if (targetFiles.indexOf(source.getFilePath()) != -1) {
            filenames.push(source.getFilePath());
        }
    } else {
        const path = source.getFilePath();
        if (!path.endsWith(".d.ts")) {
            if (path in magicCache) {
                const mtime = times[path];
                if (mtime !== magicCache[path].timestamp) {
                    filenames.push(source.getFilePath());
                }
            } else {
                filenames.push(source.getFilePath());
            }
        }
    }
}
for (const path of filenames) {
    magicCache[path] = {
        timestamp: null,
    };
}

for (const path of filenames) {
    console.log("Updating ", path); // tslint:disable-line no-console
    const source = project.getSourceFile(path);
    if (!source) {
        throw new Error("Source should exist");
    }
    processFile(project, source);
}

project.saveSync();

for (const filename of filenames) {
    magicCache[filename].timestamp = statSync(filename).mtime.getTime();
}

writeFileSync(".magic-cache.json", JSON.stringify(magicCache));
