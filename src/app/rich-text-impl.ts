export const { CKEditor } = require("@ckeditor/ckeditor5-react");
export const ClassicEditor =
    require("@ckeditor/ckeditor5-editor-classic/src/classiceditor").default;
const Plugin = require("@ckeditor/ckeditor5-core/src/plugin");
export const CK_PLUGINS = [
    require("@ckeditor/ckeditor5-essentials/src/essentials"),
    require("@ckeditor/ckeditor5-paragraph/src/paragraph"),
    require("@ckeditor/ckeditor5-heading/src/heading"),
    require("@ckeditor/ckeditor5-basic-styles/src/bold"),
    require("@ckeditor/ckeditor5-basic-styles/src/italic"),
    require("@ckeditor/ckeditor5-basic-styles/src/underline"),
    require("@ckeditor/ckeditor5-list/src/list"),
    require("@ckeditor/ckeditor5-table/src/table"),
    require("@ckeditor/ckeditor5-table/src/tabletoolbar"),
    require("@ckeditor/ckeditor5-table/src/tableproperties"),
    require("@ckeditor/ckeditor5-table/src/tablecellproperties"),
    require("@ckeditor/ckeditor5-image/src/image"),
    require("@ckeditor/ckeditor5-image/src/imagetoolbar"),
    require("@ckeditor/ckeditor5-image/src/imageupload"),
    require("@ckeditor/ckeditor5-image/src/imagecaption"),
    require("@ckeditor/ckeditor5-image/src/imagestyle"),
    require("@ckeditor/ckeditor5-image/src/imageresize"),
    require("@ckeditor/ckeditor5-alignment/src/alignment"),
    require("@ckeditor/ckeditor5-link/src/link"),
    require("@ckeditor/ckeditor5-font/src/font"),
    require("@ckeditor/ckeditor5-mention/src/mention"),
].map((x) => x.default);

export default CKEditor;
