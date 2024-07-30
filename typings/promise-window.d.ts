declare module 'promise-window' {
    class PromiseWindow {
        constructor(url: string)
        open(): Promise<any>
    }

    namespace PromiseWindow {
    }
    export = PromiseWindow
}
