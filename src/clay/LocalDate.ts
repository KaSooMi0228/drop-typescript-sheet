import { format as formatDate } from "date-fns";
import addDays from "date-fns/addDays";
import compareAsc from "date-fns/compareAsc";
import differenceInDays from "date-fns/differenceInDays";
import dateFormat from "date-fns/format";
import dateParse from "date-fns/parseISO";
import startOfDay from "date-fns/startOfDay";

export class LocalDate {
    date: Date;
    constructor(date: Date) {
        this.date = startOfDay(date);
    }

    asDate() {
        return this.date;
    }

    static parse(text: string): LocalDate {
        return new LocalDate(startOfDay(dateParse(text)));
    }

    toString(): string {
        return dateFormat(this.date, "yyyy-MM-dd");
    }

    compare(other: LocalDate) {
        return compareAsc(this.date, other.date);
    }

    before(other: LocalDate) {
        return compareAsc(this.date, other.date) == -1;
    }

    addDays(x: number): LocalDate {
        return new LocalDate(addDays(this.date, x));
    }

    ageDays(): number {
        return differenceInDays(this.date, new Date());
    }
}

export function longDate(date: Date | null): string | null {
    if (date) {
        return formatDate(date, "MMMM d, yyyy");
    } else {
        return null;
    }
}
