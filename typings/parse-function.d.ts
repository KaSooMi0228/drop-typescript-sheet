declare module 'parse-function' {
    interface ParseApp {
        parse(x: Function): any
    }

    function ParseFunction(): ParseApp;

    export = ParseFunction
}