import Random from "random-js";
const uuidv5 = require("uuidv5-browser");

export type UUID = {
    uuid: string;
};
const random = new Random();

export function newUUID() {
    return {
        uuid: random.uuid4(),
    };
}

export function genUUID() {
    return random.uuid4();
}

export function uuid5(text: string) {
    return uuidv5("null", text);
}
