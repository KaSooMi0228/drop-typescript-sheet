import * as React from "react";

export type LookupContext = {
    nameForId: (tableName: string, id: string) => string | null;
};
