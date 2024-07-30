import { faPlus, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { css } from "glamor";
import { find, groupBy, some } from "lodash";
import { plural } from "pluralize";
import { ParsedUrlQuery } from "querystring";
import * as React from "react";
import { Breadcrumb, Nav } from "react-bootstrap";
import { CONTENT_AREA } from "../app/styles";
import { titleCase } from "../clay/title-case";
import { Dictionary } from "./common";
import { RecordMeta } from "./meta";
import {
    BaseAction,
    Page,
    PageContext,
    PageRequest,
    PageState,
    ReduceResult,
} from "./Page";
import { castRequest, QueryRequest, Request, RequestHandle } from "./requests";
import { QueryTableResult } from "./server/api";
import {
    TableWidgetPage,
    TableWidgetPageAction,
    TableWidgetPageState,
} from "./TableWidgetPage";
import { newUUID, UUID } from "./uuid";
import { Widget } from "./widgets";

const CATEGORY_STYLE = css({
    display: "block",
    background: "#ccc",
    fontSize: "15pt",
    padding: "10px",
});

type DataItem = { label: string; id: string; category: any; default: boolean };

export type AdminCollectionPageState<
    StateType,
    DataType extends { id: UUID },
    ActionType
> = {
    data: DataItem[] | null;
    state: TableWidgetPageState<StateType, DataType, ActionType> | null;
    refreshing: boolean;
};

function activeKey<StateType, DataType extends { id: UUID }, ActionType>(
    state: AdminCollectionPageState<StateType, DataType, ActionType>
) {
    const innerState = state.state;
    if (innerState === null) {
        return null;
    }

    if (innerState.currentRecordId === "new") {
        return "new-" + (innerState.category || "");
    } else {
        return innerState.currentRecordId;
    }
}

export type AdminCollectionPageAction<ActionType, DataType> =
    | {
          type: "EDITOR";
          action: TableWidgetPageAction<ActionType, DataType>;
      }
    | {
          type: "LOAD_DATA";
          response: QueryTableResult;
      }
    | {
          type: "DUPLICATE";
      }
    | BaseAction;

export type AdminCollectionPageConfig<
    StateType,
    DataType,
    ActionType,
    JsonType,
    BrokenJsonType
> = {
    meta: Widget<StateType, DataType, PageContext, ActionType, {}> & {
        dataMeta: RecordMeta<DataType, JsonType, BrokenJsonType>;
    };
    labelColumn: string;
    urlPrefix: string;
    categoryColumn?: string;
    defaultColumn?: string;
    adminCategory?: string;
    categories?: { key: string; label: string }[];
    title?: string;
    addText?: string;
    applyCategory?: (data: DataType, category: string) => DataType;
    postSave?: (record: DataType) => void;
};

export function AdminCollectionPage<
    StateType,
    DataType extends { id: UUID },
    ActionType,
    JsonType,
    BrokenJsonType
>(
    options: AdminCollectionPageConfig<
        StateType,
        DataType,
        ActionType,
        JsonType,
        BrokenJsonType
    >
): Page<
    AdminCollectionPageState<StateType, DataType, ActionType>,
    AdminCollectionPageAction<ActionType, DataType>
> {
    type Action = AdminCollectionPageAction<ActionType, DataType>;
    type State = AdminCollectionPageState<StateType, DataType, ActionType>;

    const table = options.meta.dataMeta.name;

    const editorPage = TableWidgetPage({
        meta: options.meta,
        makeContext: (context) => context,
        title() {
            return "";
        },
        applyCategory: options.applyCategory,
        postSave: options.postSave,
    });

    function requestData(): RequestHandle<PageRequest, Action> {
        return castRequest(
            Request<QueryRequest, Action>(
                "QUERY",
                {
                    tableName: table,
                    columns: [
                        "id",
                        options.labelColumn,
                        options.categoryColumn || "null",
                        options.defaultColumn || "null",
                    ],
                    sorts: [options.labelColumn],
                },
                (response) =>
                    ({
                        type: "LOAD_DATA" as "LOAD_DATA",
                        response,
                    } as Action)
            )
        );
    }

    function initialize(
        segments: string[],
        parameters: ParsedUrlQuery,
        context: PageContext
    ): ReduceResult<State, Action> {
        if (segments.length > 0) {
            const userId = segments[0];
            const inner = editorPage.initialize(segments, parameters, context);
            return {
                state: {
                    data: null,
                    state: inner.state,
                    refreshing: true,
                },
                requests: [...processRequests(inner.requests), requestData()],
            };
        } else {
            return {
                state: {
                    data: null,
                    state: null,
                    refreshing: true,
                },
                requests: [requestData()],
            };
        }
    }

    function processRequests(
        requests: RequestHandle<
            PageRequest,
            TableWidgetPageAction<ActionType, DataType>
        >[]
    ) {
        return requests
            .filter((request) => request.type !== "FINISHED")
            .map((request) => ({
                type: request.type,
                request: request.request,
                decorator: (response: any) => ({
                    type: "EDITOR" as "EDITOR",
                    action: request.decorator(response),
                }),
            }));
    }

    const CONTAINER_STYLE = css({
        flexGrow: 1,
        display: "flex",
        overflowY: "auto",
    });

    const LIST_STYLE = css({
        overflowY: "scroll",
        width: "25%",
    });

    const EDITOR_STYLE = css({
        width: "75%",
    });

    type Props = { state: State; dispatch: (action: Action) => void };
    function component(props: Props) {
        const checkChange = React.useCallback(
            (event) => {
                if (hasUnsavedChanges(props.state)) {
                    if (
                        !window.confirm(
                            "There are unsaved changes. Are you sure you want to leave?"
                        )
                    ) {
                        event.preventDefault();
                    }
                }
            },
            [props.state]
        );
        const items: Dictionary<DataItem[]> = options.categories
            ? props.state.data
                ? groupBy(props.state.data, "category")
                : {}
            : {
                  "": props.state.data || [],
              };

        const categories = options.categories || [
            {
                key: "",
                label: "",
            },
        ];

        return (
            <div {...CONTAINER_STYLE}>
                <div {...LIST_STYLE}>
                    <Nav
                        variant="pills"
                        className="flex-column"
                        activeKey={activeKey(props.state) || undefined}
                    >
                        {props.state.data &&
                            categories.map((category) => (
                                <React.Fragment key={category.key}>
                                    {options.categories && (
                                        <Nav.Item {...CATEGORY_STYLE}>
                                            {category.label}
                                        </Nav.Item>
                                    )}

                                    {(items[category.key] || []).map((data) => (
                                        <Nav.Item key={data.id}>
                                            <Nav.Link
                                                eventKey={data.id}
                                                href={
                                                    options.urlPrefix +
                                                    "/" +
                                                    data.id
                                                }
                                                onClick={checkChange}
                                            >
                                                {data.label}

                                                {data.default && (
                                                    <>
                                                        {" "}
                                                        <FontAwesomeIcon
                                                            icon={faStar}
                                                        />
                                                    </>
                                                )}
                                            </Nav.Link>
                                        </Nav.Item>
                                    ))}
                                    <Nav.Item>
                                        <Nav.Link
                                            eventKey={
                                                "new-" + (category.key || "")
                                            }
                                            href={
                                                options.urlPrefix +
                                                "/new?category=" +
                                                category.key
                                            }
                                            onClick={checkChange}
                                        >
                                            <FontAwesomeIcon
                                                icon={faPlus}
                                                style={{ color: "green" }}
                                            />{" "}
                                            {options.addText ??
                                                `New ${
                                                    category.label
                                                } ${titleCase(
                                                    options.meta.dataMeta.name
                                                )}`}
                                        </Nav.Link>
                                    </Nav.Item>
                                </React.Fragment>
                            ))}
                    </Nav>
                </div>
                <div {...EDITOR_STYLE} {...CONTENT_AREA}>
                    {props.state.state !== null && (
                        <editorPage.component
                            state={props.state.state as any}
                            dispatch={(action) =>
                                props.dispatch({
                                    type: "EDITOR",
                                    action,
                                })
                            }
                        />
                    )}
                </div>
            </div>
        );
    }

    function innerReduce(
        state: State,
        action: Action,
        context: PageContext
    ): ReduceResult<State, Action> {
        switch (action.type) {
            case "LOAD_DATA":
                return {
                    state: {
                        ...state,
                        refreshing: false,
                        data: action.response.rows.map((record) => ({
                            id: record[0] as string,
                            label: record[1] as string,
                            category: record[2],
                            default: !!record[3],
                        })),
                    },
                    requests: [],
                };
            case "PAGE_ACTIVATED":
            case "HEARTBEAT":
                return {
                    state,
                    requests: [],
                };
            case "DUPLICATE":
                const innerState = state.state;
                if (
                    innerState === null ||
                    innerState.currentRecordId === "new"
                ) {
                    throw new Error();
                }

                const currentRecord = innerState.currentRecord;
                if (!currentRecord) {
                    throw new Error();
                }

                const item = find(
                    state.data,
                    (row) => row.id === innerState.currentRecordId
                );
                if (item === undefined) {
                    throw new Error();
                }
                const category = item.category;
                const newId: UUID = newUUID();
                return {
                    state: {
                        ...state,
                        state: {
                            ...innerState,
                            category,
                            currentRecordId: "new",
                            currentRecord: {
                                ...currentRecord,
                                id: newId,
                            },
                        },
                    },
                    requests: [],
                };
            case "EDITOR": {
                if (state.state) {
                    const inner = editorPage.reduce(
                        state.state,
                        action.action,
                        context
                    );

                    const updated =
                        action.action.type === "SAVED" ||
                        action.action.type === "DELETED" ||
                        action.action.type === "DUPLICATED";

                    return {
                        state: {
                            ...state,
                            state: inner.state,
                            refreshing: state.refreshing || updated,
                        },
                        requests: [
                            ...processRequests(inner.requests),
                            ...(updated ? [requestData()] : []),
                        ],
                    };
                } else {
                    return {
                        state,
                        requests: [],
                    };
                }
            }
            case "UPDATE_PARAMETERS": {
                if (state.state === null && action.segments.length > 0) {
                    const inner = editorPage.initialize(
                        action.segments,
                        action.parameters,
                        context
                    );

                    return {
                        state: {
                            ...state,
                            state: inner.state,
                        },
                        requests: [...processRequests(inner.requests)],
                    };
                } else if (action.segments.length === 0) {
                    return {
                        state: {
                            ...state,
                            state: null,
                        },
                        requests: [],
                    };
                } else {
                    return innerReduce(
                        state,
                        {
                            type: "EDITOR",
                            action,
                        },
                        context
                    );
                }
            }
        }
    }

    function reduce(
        state: State,
        action: Action,
        context: PageContext
    ): ReduceResult<State, Action> {
        let result = innerReduce(state, action, context);
        if (result.state.state && result.state.state.currentRecordId) {
            window.localStorage.setItem(
                "dropsheet-admin-selected-" + options.meta.dataMeta.name,
                result.state.state.currentRecordId
            );
        }

        if (result.state.refreshing) {
            // we don't have data yet, don't try to do anything
            return result;
        }

        const data = result.state.data;

        if (!data || data.length == 0) {
            // there is not data, so nothing we can do about that
            return result;
        }

        const innerState = result.state.state;

        if (
            innerState === null ||
            (innerState.currentRecordId !== "new" &&
                !some(
                    result.state.data,
                    (item) => item.id === innerState.currentRecordId
                ))
        ) {
            const lastId = window.localStorage.getItem(
                "dropsheet-admin-selected-" + options.meta.dataMeta.name
            );
            let idToLoad = data[0].id;
            if (some(result.state.data, (item) => item.id === lastId)) {
                idToLoad = lastId as string;
            }
            return innerReduce(
                result.state,
                {
                    type: "UPDATE_PARAMETERS",
                    segments: [idToLoad],
                    parameters: {},
                },
                context
            );
        }

        return result;
    }

    function encodeState(state: State) {
        return state.state === null
            ? {
                  segments: [],
                  parameters: {},
              }
            : editorPage.encodeState(
                  state.state as PageState<typeof editorPage>
              );
    }

    function hasUnsavedChanges(state: State) {
        if (state.state === null) {
            return false;
        } else {
            return editorPage.hasUnsavedChanges(state.state);
        }
    }

    return {
        initialize,
        reduce,
        component,
        encodeState,
        hasUnsavedChanges,
        headerComponent(props) {
            const onDuplicate = React.useCallback(() => {
                props.dispatch({
                    type: "DUPLICATE",
                });
            }, [props.dispatch]);

            return (
                <>
                    <Breadcrumb>
                        <Breadcrumb.Item href="#/">Dashboard</Breadcrumb.Item>
                        <Breadcrumb.Item href="#/admin/">
                            Settings
                        </Breadcrumb.Item>
                        {options.adminCategory && (
                            <Breadcrumb.Item
                                href={"#/admin/" + options.adminCategory + "/"}
                            >
                                {titleCase(options.adminCategory)}
                            </Breadcrumb.Item>
                        )}
                        <Breadcrumb.Item active>
                            {options.title ||
                                plural(titleCase(options.meta.dataMeta.name))}
                        </Breadcrumb.Item>
                    </Breadcrumb>
                    <div style={{ flexGrow: 1 }} />
                </>
            );
        },
        title() {
            return (
                options.title ?? plural(titleCase(options.meta.dataMeta.name))
            );
        },
        beforeUnload() {
            return false;
        },
    };
}
