import { css } from "glamor";
import * as React from "react";
import { Widget, WidgetStatus } from "../../clay/widgets/index";
import { SimpleAtomic } from "../../clay/widgets/simple-atomic";
import { RichTextComponent } from "../rich-text-widget";
import { ReactContext as NotesWidgetReactContext } from "./NotesWidget.widget";

export type NoteBlockWidgetAction =
    | {
          type: "SET";
          value: string;
      }
    | {
          type: "BLUR";
      };

type NoteBlockWidgetProps = {
    state: boolean;
    data: string;
    dispatch: (action: NoteBlockWidgetAction) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    hideStatus?: boolean;
};

export type NoteBlockWidgetType = Widget<
    boolean,
    string,
    {},
    NoteBlockWidgetAction,
    {
        style?: React.CSSProperties;
        hideStatus?: boolean;
    }
>;

export const EDITOR_STYLE = css({
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    overflowY: "auto",
    "& .ck-editor": {
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        overflowY: "auto",
    },
    "& .ck-editor__main": {
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        overflowY: "auto",
    },
    "& .ck-editor__editable": {
        flexGrow: 1,
        maxHeight: "100%",
        overflowY: "auto",
    },
});

export const NoteBlockWidget: NoteBlockWidgetType = {
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
    component(props: NoteBlockWidgetProps) {
        const estimateContext = React.useContext(NotesWidgetReactContext);
        if (!estimateContext) {
            throw new Error();
        }
        const currentEstimate = React.useRef(estimateContext.data);
        currentEstimate.current = estimateContext.data;
        const getTags = React.useCallback(
            (prefix) => {
                const tags = [];
                for (const area of currentEstimate.current.areas) {
                    tags.push(area.name);
                    for (const side of area.sides) {
                        tags.push(side.name);
                    }
                }
                for (const action of currentEstimate.current.actions) {
                    tags.push(action.name);
                }
                return tags
                    .filter((tag) => tag.startsWith(prefix))
                    .map((tag) => "#" + tag);
            },
            [currentEstimate]
        );
        return (
            <div {...EDITOR_STYLE}>
                <RichTextComponent
                    mention={{
                        feeds: [
                            {
                                marker: "#",
                                feed: getTags,
                                minimumCharacters: 0,
                            },
                        ],
                    }}
                    onBlur={() => {}}
                    setValue={(data: string) => {
                        props.dispatch({
                            type: "SET",
                            value: data,
                        });
                    }}
                    value={props.data}
                />
            </div>
        );
    },
    reduce(
        state: boolean,
        data: string,
        action: NoteBlockWidgetAction,
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
                    data: data.trim().replace(/ +/, " "),
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
