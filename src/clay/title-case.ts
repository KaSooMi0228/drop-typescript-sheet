import { noCase } from "change-case";
import { titleCase as inner } from "title-case";
export function titleCase(text: string) {
    return inner(noCase(text));
}
