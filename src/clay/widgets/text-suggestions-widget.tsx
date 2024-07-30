import { css } from "glamor";
import * as React from "react";
import { Typeahead } from "react-bootstrap-typeahead";
import { useId } from "react-id-generator";
import { useUser } from "../../app/state";
import { statusToState, Widget, WidgetResult, WidgetStatus } from "./index";

type TextSuggestionsWidgetAction<T> = {
    type: "TEXT_CHANGE";
    text: string;
};

type TextSuggestionsWidgetProps<T> = {
    state: null;
    data: string;
    dispatch: (action: TextSuggestionsWidgetAction<T>) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    suggestions: string[];
};

const WIDGET_STYLE = css({
    "html & input.form-control": {
        border: "none",
        height: "auto",
        padding: "0px",
    },
});

export function makeTextSuggestionsWidget<T>(): Widget<
    null,
    string,
    {},
    TextSuggestionsWidgetAction<T>,
    {
        style?: React.CSSProperties;
        suggestions: string[];
    }
> {
    function initialize(data: string, context: {}): WidgetResult<null, string> {
        return {
            data,
            state: null,
        };
    }

    return {
        dataMeta: {
            type: "string",
        },
        initialize,
        component: (props: TextSuggestionsWidgetProps<T>) => {
            const user = useUser();
            const widgetId = useId()[0];

            async function onChange(selected: any[]) {
                if (selected.length > 0) {
                    const item = selected[0];
                    props.dispatch({
                        type: "TEXT_CHANGE",
                        text: item,
                    });
                }
            }

            return (
                <div style={{ ...props.style, display: "flex", flexGrow: 1 }}>
                    <div
                        className={
                            "form-control " +
                            statusToState(
                                props.status.validation,
                                props.data === null
                            )
                        }
                        {...WIDGET_STYLE}
                    >
                        <Typeahead
                            flip={true}
                            positionFixed={true}
                            id={widgetId}
                            filterBy={() => true}
                            options={props.suggestions}
                            onInputChange={(text) => {
                                props.dispatch({
                                    type: "TEXT_CHANGE",
                                    text,
                                });
                            }}
                            selected={[props.data]}
                            onChange={onChange}
                            disabled={!props.status.mutable}
                        />
                    </div>
                </div>
            );
        },
        reduce: (
            state: null,
            data: string,
            action: TextSuggestionsWidgetAction<T>,
            context: {}
        ): WidgetResult<null, string> => {
            switch (action.type) {
                case "TEXT_CHANGE":
                    return {
                        state,
                        data: action.text,
                    };
            }
        },

        validate(data: string) {
            if (data === "") {
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
}

export const TextSuggestionWidget = makeTextSuggestionsWidget();
