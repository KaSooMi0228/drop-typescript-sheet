function hexify(digits: number[]) {
    let total = 0;
    for (const digit of digits) {
        total = total * 11 + digit;
    }

    return total.toString(16);
}

export function fixId(unparsed: string): string {
    // A long long time ago, dropsheet used integer keys
    // When these were converted the uuids, the conversion was done in a goofy manner
    // the existing integer keys were converted to ascii strings with extra zeros at the end
    // and the resulting bytes interpreted as uuid keys.
    // This worked (the keys still lined up and were unique) but they aren't valid uuids
    // This function makes them valid keys

    unparsed = unparsed.toLowerCase();

    // firstly, we identify the invalid key
    if (
        (unparsed[14] !== "1" && unparsed[14] !== "4") ||
        unparsed[19] === "4" ||
        unparsed[19] === "3"
    ) {
        // first, we reconstruct the digits. An actuall 0 is zero, and the digits 0-9 are ascii 1-10.
        const digits = (unparsed.match(/\d\d/g) as string[]).map(
            (digitText) => {
                const digit = parseInt(digitText as string, 16);
                if (digit === 0) {
                    return 0;
                } else {
                    return digit - 47;
                }
            }
        );

        // we interpret the digits as digits in base-11 number to get a number
        // which we then encode as hex
        const text = hexify(digits.slice(0, 16)).padEnd(16, "0");
        // we then stick the resulting text into the first parts of the uuid to make a valid uuid
        // The many trailing zeros make it sufficiently unlikely to accidently generate a duplicate
        const result = `${text.substring(0, 8)}-${text.substring(
            8,
            12
        )}-4${text.substring(12, 15)}-8000-000000000000`;
        if (result.length != 36) {
            console.log(text, text.substring(12, 15));
            throw new Error(result);
        }
        if (result.startsWith("-")) {
            console.log(text);
            throw new Error(result);
        }
        return result;
    } else {
        if (unparsed.length != 36) {
            console.log(unparsed.length);
            throw new Error(unparsed);
        }
        return unparsed;
    }
}
