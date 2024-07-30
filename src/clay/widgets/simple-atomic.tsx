import { Dictionary } from "../common";
import { WidgetResult } from "./index";
import * as React from "react";

export const SimpleAtomic = {
    requests<StateType, DateType>(state: StateType, data: DateType) {
        return {};
    },
    requestsUpdated<StateType, DataType, ContextType>(
        state: StateType,
        data: DataType,
        requests: Dictionary<any>,
        context: ContextType
    ): WidgetResult<StateType, DataType> {
        return {
            state,
            data,
        };
    },
};
