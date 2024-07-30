declare module 'angular-expressions' {
    export function compile(tag: string): ((scope: any) => any)
}
