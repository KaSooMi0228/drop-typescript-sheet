import { Project, Node, SourceFile } from "ts-morph";
import { normalize, relative, join } from "path";
import { Dictionary } from "./src/clay/common";

async function main() {
  const project = new Project({});
  project.addSourceFilesAtPaths("src/**/*{.ts,.tsx,.js}");

  const seen: Dictionary<boolean> = {};
  const source: Dictionary<string> = {};
  const waiting = [project.getSourceFileOrThrow("src/server/runServer.ts")];
  while (waiting.length > 0) {
    const file = waiting.pop()!;
    const imports = file.getImportDeclarations();

    if (file.getFilePath().endsWith("DataGrid.tsx")) {
      const bad_saw: Dictionary<boolean> = {};
      let current = file.getFilePath().toString();
      while (current) {
        if (bad_saw[current]) {
          break;
        }
        bad_saw[current] = true;
        console.log(current);
        current = source[current];
      }
      break;
    }

    for (const imp of imports) {
      const specifier = imp.getModuleSpecifierValue();
      /*if (specifier == "react") {
                        const bad_saw: Dictionary<boolean> = {}
                        let current = file.getFilePath().toString()
                        while (current) {
                            if (bad_saw[current]) {
                                break;
                            }
                            bad_saw[current] = true;
                            console.log(current)
                            current = source[current]
                        }
                        return;
            }*/
      if (imp.isModuleSpecifierRelative() && !specifier.endsWith("json")) {
        const target = relative(
          __dirname,
          join(file.getDirectoryPath(), specifier)
        );
        if (!seen[target]) {
          seen[target] = true;
        } else {
          continue;
        }

        if (target.endsWith(".css") || target.endsWith(".jpg")) {
          continue;
        }

        let found = false;
        for (const suffix of [".ts", ".tsx", "/index.ts", "/index.tsx"]) {
          const ts = project.getSourceFile(target + suffix);
          if (ts) {
            source[ts.getFilePath()] = file.getFilePath();
            waiting.push(ts);
            found = true;
            break;
          }
        }

        if (!found) {
          throw new Error(target);
        }
      }
    }
  }
}

main().catch((err) => console.error(err));
