import { css } from "glamor";
import * as React from "react";
import { Button } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { useId } from "react-id-generator";
import { useUser } from "../../app/state";
import { hasPermission } from "../../permissions";
import { useQuery } from "../api";
import { toPattern } from "../dataGrid/patterns";
import { Link } from "../link";
import { openWindow } from "../openWindow";
import { FilterDetail } from "../server/api";
import { statusToState, Widget, WidgetResult, WidgetStatus } from "./index";

type LinkWidgetState = {
    text: string | null;
};

type Item = {
    id: string | null;
    name: string;
};

type LinkWidgetAction<T> =
    | {
          type: "TEXT_CHANGE";
          text: string;
      }
    | {
          type: "SELECT";
          id: string | null;
      }
    | { type: "BLUR" }
    | { type: "NEW_RECORD"; id: string };

type LinkWidgetMetaOptions<T> = {
    table: string;
    openUrl?: string;
    nameColumn?: string;
    activeColumn?: string;
    emptyFilter?: FilterDetail[];
    extraFilter?: FilterDetail;
    handleNew?: (text: string) => Promise<T | null>;
};

type LinkWidgetProps<T> = {
    state: LinkWidgetState;
    data: Link<T>;
    dispatch: (action: LinkWidgetAction<T>) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    suggestions?: { id: Link<T>; name: string }[];
    fallback?: Link<T>;
};

const WIDGET_STYLE = css({
    "html & input.form-control": {
        border: "none",
        height: "auto",
        padding: "0px",
    },
});

export function LinkWidget<T>(options: LinkWidgetMetaOptions<T>): Widget<
    LinkWidgetState,
    Link<T>,
    {},
    LinkWidgetAction<T>,
    {
        style?: React.CSSProperties;
        suggestions?: { id: Link<T>; name: string }[];
        fallback?: Link<T>;
    }
> {
    const nameColumn = options.nameColumn || "name";

    function initialize(
        data: Link<T>,
        context: {}
    ): WidgetResult<LinkWidgetState, Link<T>> {
        return {
            data,
            state: {
                text: null,
            },
        };
    }

    return {
        dataMeta: {
            type: "uuid",
            linkTo: options.table,
        },
        initialize,
        component: (props: LinkWidgetProps<T>) => {
            const user = useUser();
            const text = props.state.text || "";
            const lookupQuery = useQuery(
                {
                    tableName: options.table,
                    columns: ["id", nameColumn],
                    filters: [
                        ...(text === ""
                            ? options.emptyFilter || []
                            : [
                                  {
                                      column: nameColumn,
                                      filter: {
                                          like: toPattern(text),
                                      },
                                  },
                              ]),
                        ...(options.activeColumn
                            ? [
                                  {
                                      or: [
                                          {
                                              column: "id",
                                              filter: {
                                                  equal: props.data,
                                              },
                                          },
                                          {
                                              and: [
                                                  {
                                                      column: options.activeColumn,
                                                      filter: {
                                                          equal: true,
                                                      },
                                                  },
                                                  ...(options.extraFilter
                                                      ? [options.extraFilter]
                                                      : []),
                                              ],
                                          },
                                      ],
                                  },
                              ]
                            : options.extraFilter
                            ? [
                                  {
                                      or: [
                                          {
                                              column: "id",
                                              filter: {
                                                  equal: props.data,
                                              },
                                          },

                                          options.extraFilter,
                                      ],
                                  },
                              ]
                            : []),
                    ],
                    sorts: [nameColumn],
                    limit: 100,
                },
                [options, props.data, text]
            );

            const target = useQuery(
                {
                    tableName: options.table,
                    columns: ["id", nameColumn],
                    filters: [
                        {
                            column: "id",
                            filter: {
                                equal: props.data || props.fallback || null,
                            },
                        },
                    ],
                },
                [props.data, props.fallback]
            );

            const widgetId = useId()[0];

            const onOpenClick = React.useCallback(() => {
                if (props.data === null) {
                    throw new Error("unreachable");
                }
                window.open(options.openUrl + "/" + props.data + "?watching");
            }, [props.data]);

            async function onChange(selected: any[]) {
                if (selected.length > 0) {
                    const item = selected[0];
                    if (item.id === null) {
                        const result = await (options.handleNew
                            ? options.handleNew(props.state.text || "")
                            : openWindow(
                                  options.openUrl +
                                      "/new/?watching&name=" +
                                      encodeURIComponent(props.state.text || "")
                              ));

                        props.dispatch({
                            type: "SELECT",
                            id: result,
                        });
                    } else {
                        props.dispatch({
                            type: "SELECT",
                            id: item.id,
                        });
                    }
                } else {
                    if (props.data !== null) {
                        props.dispatch({
                            type: "SELECT",
                            id: null,
                        });
                    }
                }
            }

            const items: Item[] = [];
            let selectedText = "";
            if (
                props.suggestions &&
                props.state.text === null &&
                props.data === null
            ) {
                for (const item of props.suggestions) {
                    items.push(item);
                }
            } else if (lookupQuery) {
                for (const row of lookupQuery) {
                    items.push({
                        id: row[0] as string,
                        name: (row[1] as string) || "",
                    });
                }
            }
            if (target && target[0]) {
                selectedText = (target[0][1] as string) || "";
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
                            labelKey="name"
                            selected={[
                                {
                                    name:
                                        props.state.text === null
                                            ? selectedText
                                            : props.state.text,
                                    id: props.data,
                                },
                            ]}
                            filterBy={() => true}
                            options={[
                                ...items,
                                ...((options.openUrl !== undefined ||
                                    options.handleNew) &&
                                hasPermission(user, options.table, "new")
                                    ? [
                                          {
                                              name:
                                                  (props.state.text || "") +
                                                  " (new)",
                                              id: null,
                                          } as Item,
                                      ]
                                    : []),
                            ]}
                            onInputChange={(text) =>
                                props.dispatch({
                                    type: "TEXT_CHANGE",
                                    text,
                                })
                            }
                            onBlur={() => props.dispatch({ type: "BLUR" })}
                            onChange={onChange}
                            disabled={!props.status.mutable}
                        />
                    </div>
                    {props.data && options.openUrl && (
                        <Button onClick={onOpenClick}>Open</Button>
                    )}
                </div>
            );
        },
        reduce: (
            state: LinkWidgetState,
            data: Link<T>,
            action: LinkWidgetAction<T>,
            context: {}
        ): WidgetResult<LinkWidgetState, Link<T>> => {
            switch (action.type) {
                case "TEXT_CHANGE":
                    return {
                        state: {
                            ...state,
                            text: action.text,
                        },
                        data,
                    };
                case "SELECT":
                    return {
                        state: {
                            ...state,
                            text: null,
                        },
                        data: action.id,
                    };
                case "BLUR":
                    return {
                        state: {
                            ...state,
                            text: null,
                        },
                        data,
                    };
                case "NEW_RECORD":
                    return initialize(action.id, context);
            }
        },

        validate(data: Link<T>) {
            if (data === null) {
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
