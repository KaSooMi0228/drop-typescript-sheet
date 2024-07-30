import { Node } from "ts-morph";

export default function bail(node: Node, message: string): Error {
    return new Error(
        `${message} on line ${node.getStartLineNumber()} in ${node
            .getSourceFile()
            .getFilePath()}`
    );
}
