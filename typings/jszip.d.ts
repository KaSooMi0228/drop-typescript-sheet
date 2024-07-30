declare module 'jszip' {
    class JSZip {
        constructor(buffer: Buffer);
        generate(options: {
            type: 'nodebuffer',
            compression?: 'DEFLATE'
        }): Buffer
    }

    namespace JSZip {
    }
    export = JSZip
}
