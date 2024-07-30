import * as React from "react";

type GenerateContextType = {};
export const GenerateContext = React.createContext<GenerateContextType | null>(
    null
);
