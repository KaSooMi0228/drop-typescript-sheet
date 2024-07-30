import { css } from "glamor";
import { memoize } from "lodash";
import * as React from "react";
import usePromise from "react-use-promise";
import { storeRecord } from "../clay/api";
import { newUUID } from "../clay/uuid";
import { Widget, WidgetStatus } from "../clay/widgets";
import { SimpleAtomic } from "../clay/widgets/simple-atomic";
import { RICH_TEXT_IMAGE_META } from "./rich-text-image";

function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();

        reader.onerror = function onerror(ev) {
            reject(ev.target!.error);
        };

        reader.onload = function onload(ev) {
            resolve(ev.target!.result! as ArrayBuffer);
        };

        reader.readAsArrayBuffer(file);
    });
}
class UploadAdapter {
    loader: any;
    constructor(loader: any) {
        this.loader = loader;
    }
    async upload() {
        const file = await this.loader.file;
        const buffer = await fileToArrayBuffer(file);
        const id = newUUID();
        await storeRecord(RICH_TEXT_IMAGE_META, "rich text editor", {
            id,
            recordVersion: { version: null },
            name: file.name,
            data: buffer,
        });
        return {
            default: "/server/image/" + id.uuid,
        };
    }
    abort() {}
}
export type RichTextWidgetAction =
    | {
          type: "SET";
          value: string;
      }
    | {
          type: "BLUR";
      };

type RichTextWidgetProps = {
    state: boolean;
    data: string;
    dispatch: (action: RichTextWidgetAction) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    hideStatus?: boolean;
    mention?: any;
};

export type RichTextWidgetType = Widget<
    boolean,
    string,
    {},
    RichTextWidgetAction,
    {
        style?: React.CSSProperties;
        hideStatus?: boolean;
        mention?: any;
    }
>;

export const EDITOR_STYLE = css({});

const loadRichText = memoize(() => import("./rich-text-impl"));

export function RichTextComponent(props: {
    mention?: any;
    value: string;
    setValue: (x: string) => void;
    onBlur: () => void;
    disabled?: boolean;
}) {
    const [result, error, state] = usePromise(loadRichText, []);

    if (!result) {
        return <></>;
    }

    return (
        <result.CKEditor
            disabled={props.disabled}
            editor={result.ClassicEditor}
            onInit={(editor: any) => {
                editor.plugins.get("FileRepository").createUploadAdapter = (
                    loader: any
                ) => new UploadAdapter(loader);
            }}
            onBlur={props.onBlur}
            config={{
                plugins: result.CK_PLUGINS,

                toolbar: [
                    "heading",
                    "|",
                    "fontSize",
                    "fontFamily",
                    "fontColor",
                    "fontBackgroundColor",
                    "bold",
                    "italic",
                    "underline",
                    "|",
                    "alignment",
                    "numberedList",
                    "bulletedList",
                    "|",
                    "link",
                    "insertTable",
                    "imageUpload",
                    "|",
                    "undo",
                    "redo",
                ],
                image: {
                    styles: [
                        "alignLeft",
                        "alignCenter",
                        "alignRight",
                        "full",
                        "side",
                    ],
                    toolbar: [
                        "imageStyle:full",
                        "imageStyle:side",
                        "imageStyle:alignLeft",
                        "imageStyle:alignCenter",
                        "imageStyle:alignRight",
                    ],
                },
                table: {
                    contentToolbar: [
                        "tableColumn",
                        "tableRow",
                        "mergeTableCells",
                        "tableProperties",
                        "tableCellProperties",
                    ],
                    tableProperties: {},
                    tableCellProperties: {},
                },
                mention: props.mention,
            }}
            onChange={(_: any, editor: any) => {
                props.setValue(editor.getData());
            }}
            data={props.value}
        />
    );
}

export const RichTextWidget: RichTextWidgetType = {
    ...SimpleAtomic,
    dataMeta: {
        type: "string",
    },
    initialize(data: string) {
        return {
            state: false,
            data,
        };
    },
    component(props: RichTextWidgetProps) {
        return (
            <div {...EDITOR_STYLE}>
                <RichTextComponent
                    disabled={!props.status.mutable}
                    setValue={(data: string) => {
                        props.dispatch({
                            type: "SET",
                            value: data,
                        });
                    }}
                    mention={props.mention}
                    value={props.data}
                    onBlur={() => {
                        props.dispatch({
                            type: "BLUR",
                        });
                    }}
                />
            </div>
        );
    },
    reduce(
        state: boolean,
        data: string,
        action: RichTextWidgetAction,
        context: {}
    ) {
        switch (action.type) {
            case "SET":
                return {
                    state: true,
                    data: action.value,
                };
            case "BLUR":
                return {
                    state: false,
                    data: data
                        .replace(/&nbsp;/g, " ")
                        .trim()
                        .replace(/ +/, " "),
                };
        }
    },
    validate(data: string) {
        if (data !== "") {
            return [];
        } else {
            return [
                {
                    invalid: false,
                    empty: true,
                },
            ];
        }
    },
};
