import { css } from "glamor";
import * as React from "react";
import TagsInput from "react-tagsinput";
import { Widget, WidgetResult, WidgetStatus } from "./index";

type TagsWidgetState = {};

type TagsWidgetAction = {
    type: "SET";
    value: string[];
};

type TagsWidgetProps = {
    state: TagsWidgetState;
    data: string[];
    dispatch: (action: TagsWidgetAction) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
};

const PERMISSON_LABEL_STYLE = css({
    paddingLeft: ".25in",
    lineHeight: "28px",
    verticalAlign: "text-bottom",
});

const SELECT_CONTAINER = css({
    display: "flex",
    ">div:first-child": {
        flexGrow: 1,
    },
});

export const TagsWidget: Widget<
    TagsWidgetState,
    string[],
    {},
    TagsWidgetAction,
    {
        style?: React.CSSProperties;
    }
> = {
    dataMeta: {
        type: "array",
        items: {
            type: "string",
        },
    },
    initialize: (data: string[], context: {}) => {
        return {
            data,
            state: {},
        };
    },
    component: (props: TagsWidgetProps) => {
        const onChange = React.useCallback(
            (tags) => {
                props.dispatch({
                    type: "SET",
                    value: tags,
                });
            },
            [props.dispatch]
        );

        const [text, setText] = React.useState("");

        return (
            <TagsInput
                value={props.data}
                onChange={onChange}
                inputValue={text}
                onChangeInput={setText}
            />
        );
    },
    reduce: (
        state: TagsWidgetState,
        data: string[],
        action: TagsWidgetAction,
        context: {}
    ): WidgetResult<TagsWidgetState, string[]> => {
        switch (action.type) {
            case "SET":
                return {
                    state,
                    data: action.value,
                };
        }
    },

    validate(data: string[]) {
        if (data.length == 0) {
            return [
                {
                    invalid: false,
                    empty: true,
                },
            ];
        } else {
            return [];
        }
    },
};
