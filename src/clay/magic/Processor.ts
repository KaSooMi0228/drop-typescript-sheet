import { WriterFunction } from "ts-morph";
import { Dictionary } from "../common";

export type Processor = {
    defaultImports: Dictionary<string>;
    imports: Dictionary<string[]>;
    code: WriterFunction;
};
