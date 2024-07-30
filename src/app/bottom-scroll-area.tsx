import * as React from "react";
import { CONTENT_AREA } from "./styles";

export function BottomScrollArea(props: { children: React.ReactNode }) {
    const myRef = React.useRef<HTMLDivElement | null>(null);

    React.useLayoutEffect(() => {
        if (myRef.current) {
            myRef.current.scrollBy(0, myRef.current.scrollHeight * 2);
        }
    }, []);

    return (
        <div {...CONTENT_AREA} ref={myRef}>
            {props.children}
        </div>
    );
}
