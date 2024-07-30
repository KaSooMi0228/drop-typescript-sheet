import Decimal from "decimal.js";

type LogEntry = {
    date: Date;
    kind: string;
    payload: any;
};

const LOGS: LogEntry[] = [];
const THRESHOLD = 1000 * 60 * 60;

export function recordLog(kind: string, payload: any) {
    while (
        LOGS.length > 0 &&
        new Date().getTime() - LOGS[0].date.getTime() > THRESHOLD
    ) {
        LOGS.splice(0, 1);
    }
    LOGS.push({
        date: new Date(),
        kind,
        payload,
    });
}

type Context = {
    target: any[];
    previous: Map<any, number>;
};

function serializeTo(current: any, context: Context) {
    const previousIndex = context.previous.get(current);
    if (previousIndex !== undefined) {
        context.target.push(previousIndex);
    } else {
        context.previous.set(current, context.target.length);

        switch (typeof current) {
            case "object":
                if (Array.isArray(current)) {
                    context.target.push("a", current.length);
                    for (const element of current) {
                        serializeTo(element, context);
                    }
                } else if (current instanceof Date) {
                    context.target.push("d", current.toISOString());
                } else if (current instanceof Decimal) {
                    context.target.push("$", current.toString());
                } else if (current === null) {
                    context.target.push("n");
                } else {
                    const entries = Object.entries(current);
                    context.target.push("o", entries.length);
                    for (const [key, value] of entries) {
                        serializeTo(key, context);
                        serializeTo(value, context);
                    }
                }

                break;
            case "string":
            case "boolean":
            case "undefined":
                context.target.push("v", current);
                break;
            case "function":
                context.target.push("f");
                break;
            default:
                context.target.push("?");
                break;
        }
    }
}

export function grabLog(): any[] {
    const context = {
        target: [],
        previous: new Map(),
    };
    serializeTo(LOGS, context);
    return context.target;
}
