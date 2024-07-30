export function quote(value: string): string {
    return '"' + value.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

export function parseSeq(source: string): string[] {
    if (source.length === 2) {
        return [];
    }

    let mode = 0;
    const items = [];
    let current = "";
    for (let index = 1; index < source.length - 1; index++) {
        const character = source.charAt(index);
        switch (mode) {
            case 0:
                if (character === '"') {
                    mode = 1;
                } else {
                    current += character;
                    mode = 2;
                }
                break;
            case 1:
                if (character === '"') {
                    mode = 3;
                } else if (character === "\\") {
                    mode = 4;
                } else {
                    current += character;
                }
                break;
            case 2:
                if (character === ",") {
                    items.push(current);
                    current = "";
                    mode = 0;
                } else {
                    current += character;
                }
                break;
            case 3:
                if (character === '"') {
                    current += '"';
                    mode = 1;
                } else {
                    mode = 0;
                    items.push(current);
                    current = "";
                }
                break;
            case 4:
                current += character;
                mode = 1;
                break;
        }
    }
    items.push(current);
    return items;
}
