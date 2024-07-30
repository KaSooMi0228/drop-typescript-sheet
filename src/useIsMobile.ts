import { debounce } from "lodash";
import * as React from "react";
export const useIsMobile = (): boolean => {
    const [isMobile, setIsMobile] = React.useState(false);

    React.useLayoutEffect(() => {
        const updateSize = (): void => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener("resize", debounce(updateSize, 250));
        updateSize();
        return (): void => window.removeEventListener("resize", updateSize);
    }, []);

    return isMobile;
};
