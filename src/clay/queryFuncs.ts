import { differenceInDays } from "date-fns";
import { Decimal } from "decimal.js";
import { some, uniq } from "lodash";
import { ProjectSchedule } from "../app/project/schedule";
import { Quantity } from "./common";
import { LocalDate } from "./LocalDate";

export class ResolveError extends Error {
    constructor() {
        super("Not Suported");

        Object.setPrototypeOf(this, ResolveError.prototype);
    }
}

export function sumMap<T>(items: T[], f: (t: T) => Decimal) {
    return items.map(f).reduce((x, y) => x.add(y), new Decimal(0));
}

export function joinMap<T>(items: T[], join: string, f: (t: T) => string) {
    return items.map(f).join(join);
}

export function filterMap<T, S>(
    items: T[],
    g: (t: T) => boolean,
    f: (t: T) => S
) {
    return items.filter(g).map(f);
}

export function firstMatch<T, S>(
    items: T[],
    match: (t: T) => boolean,
    f: (t: T) => S
) {
    for (const item of items) {
        if (match(item)) {
            return f(item);
        }
    }
    return null;
}

export function lastItem<T, S>(items: T[], f: (t: T) => S) {
    if (items.length == 0) {
        return null;
    } else {
        return f(items[items.length - 1]);
    }
}

export function isNotNull<T>(T: T | null) {
    return T !== null;
}

export function ifNull<T>(t: T | null, other: T) {
    return t === null ? other : t;
}

export function isNull<T>(T: T | null) {
    return T === null;
}

export function isEmpty<T>(items: T[]) {
    return items.length == 0;
}

export function setDifference<T>(lhs: T[], rhs: T[]): T[] {
    return lhs.filter((x) => rhs.indexOf(x) == -1);
}

export function uniqueMap<T, S>(items: T[], f: (s: T) => S) {
    return uniq(items.map(f));
}

export function anyMap<T>(items: T[], f: (s: T) => boolean) {
    return some(items.map(f));
}

export function selectArray<T>(...items: T[][]) {
    for (const item of items) {
        if (item.length > 0) {
            return item;
        }
    }
    return [];
}

export function resolve(column: string): any {
    throw new ResolveError();
}

export function daysAgo(date: Date | LocalDate | null): Decimal | null {
    if (date instanceof LocalDate) {
        return daysAgo(date.date);
    }
    if (date) {
        return new Decimal(differenceInDays(new Date(), date));
    } else {
        return null;
    }
}

export function currentYear(): Quantity {
    return new Decimal(new Date().getFullYear());
}

export function extractYear(date: LocalDate): Decimal {
    return new Decimal(date.date.getFullYear());
}

export function createProjectSchedule(projectSchedule: ProjectSchedule) {
    return projectSchedule;
}

export function maximum<T>(
    items: T[],
    f: (item: T) => Decimal | null
): Decimal | null {
    let biggest: Decimal | null = null;
    for (const item of items) {
        const value = f(item);
        if (value !== null && (biggest === null || biggest.lessThan(value))) {
            biggest = value;
        }
    }
    return biggest;
}
