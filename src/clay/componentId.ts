import { uniqueId } from "lodash";
import { useState } from "react";

export default function componentId() {
    const [id, setId] = useState(() => uniqueId("element"));
    return id;
}
