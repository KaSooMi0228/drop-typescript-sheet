import { Case, useFlavour } from "safe-squel";

const flavor = useFlavour("postgres");

const options = {
    autoQuoteTableNames: true,
    autoQuoteFieldNames: true,
    nameQuoteCharacter: '"',
    separator: "\n",
};

export function select() {
    return flavor.select(options);
}
export function insert() {
    return flavor.insert(options);
}
export function update() {
    return flavor.update(options);
}

export function remove() {
    return flavor.remove(options);
}
export const str = flavor.str;
export const rstr = flavor.rstr;
export const expr = flavor.expr;
export const sqlCase: () => Case = flavor["case"] as any;
