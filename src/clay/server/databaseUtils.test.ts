import { strictEqual } from "assert";
import { quote } from "./databaseUtils";
describe("database utils", () => {
    it("quotes", () => {
        strictEqual(quote("alpha"), '"alpha"');
        strictEqual(quote('al"ha'), '"al\\"ha"');
        strictEqual(quote("al\\ha"), '"al\\\\ha"');
        strictEqual(quote('"'), '"\\""');
        strictEqual(quote(quote('"')), '"\\"\\\\\\"\\""');
        strictEqual(quote('"\\alpha'), '"\\"\\\\alpha"');
        strictEqual(quote('"\\"alpha'), '"\\"\\\\\\"alpha"');
        strictEqual(quote(" \\ "), '" \\\\ "');
        strictEqual(quote(quote(" \\ ")), '"\\" \\\\\\\\ \\""');
    });
});
