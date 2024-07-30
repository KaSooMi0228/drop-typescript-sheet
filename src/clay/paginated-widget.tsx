import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { css } from "glamor";
import { find, some } from "lodash";
import * as React from "react";
import { Pagination } from "react-bootstrap";
import { useIsMobile } from "../useIsMobile";
import { Dictionary } from "./common";
import { RecordMeta } from "./meta";
import { QuickCacheApi, useQuickCache } from "./quick-cache";
import {
    RecordWidget,
    subStatus,
    ValidationError,
    Widget,
    WidgetStatus,
} from "./widgets/index";

export const TAB_STYLE = css({
    flexGrow: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    borderBottom: "solid 1px black",
    paddingBottom: "20px",
});

export type PaginatedWidgetState<DataType, ContextType> = {
    currentPageId: string;
    currentPageState: any;
};

export type PaginatedWidgetAction<DataType> =
    | {
          type: "PAGE";
          pageId: string;
          action: any;
      }
    | {
          type: "REBUILD";
          data: DataType;
      }
    | {
          type: "SELECT_TAB";
          pageId: string;
      };

export type PageConfig<DataType, ContextType> = {
    id: string;
    title: string | ((cache: QuickCacheApi) => string);
    widget: RecordWidget<any, DataType, ContextType, any, {}>;
    admin?: boolean;
};

export type PaginatedWidgetConfig<DataType, ContextType> = {
    pages: (data: DataType) => PageConfig<DataType, ContextType>[];
    dataMeta: RecordMeta<DataType, any, any>;
    validate?: (
        data: DataType,
        cache: QuickCacheApi,
        errors: ValidationError[]
    ) => ValidationError[];
    processHook?: () => any;
    process?: (
        data: DataType,
        cache: QuickCacheApi,
        currentPageId: string,
        extra?: any
    ) => DataType | undefined | null;
};

type Props<DataType, ContextType> = {
    state: PaginatedWidgetState<DataType, ContextType>;
    data: DataType;
    dispatch: (action: PaginatedWidgetAction<DataType>) => void;
    status: WidgetStatus;
    extra?: any;
};

export type PaginatedWidgetType<DataType, ContextType> = Widget<
    PaginatedWidgetState<DataType, ContextType>,
    DataType,
    ContextType,
    PaginatedWidgetAction<DataType>,
    {}
> & {
    dataMeta: RecordMeta<DataType, any, any>;
    config: PaginatedWidgetConfig<DataType, ContextType>;
};

export function PaginatedWidget<DataType, ContextType>(
    config: PaginatedWidgetConfig<DataType, ContextType>
): PaginatedWidgetType<DataType, ContextType> {
    function componentParts(props: Props<DataType, ContextType>) {
        const cache = useQuickCache();
        const isMobile = useIsMobile();

        const processed = React.useMemo(
            () =>
                config.process
                    ? config.process(
                          props.data,
                          cache,
                          props.state.currentPageId,
                          props.extra
                      )
                    : null,
            [cache, props.data, props.state.currentPageId, props.extra]
        );

        React.useEffect(() => {
            if (processed) {
                props.dispatch({
                    type: "REBUILD",
                    data: processed,
                });
            }
        }, [processed, props.dispatch]);

        const pages = config.pages(props.data);
        const page = find(
            pages,
            (page) => page.id === props.state.currentPageId
        );
        if (!page) {
            throw new Error("Current tab is missing");
        }

        const accessible: Dictionary<boolean> = {};
        let finished = true;
        for (const page of pages) {
            accessible[page.id] = finished;
            if (
                finished &&
                props.status.mutable &&
                subStatus(props.status, page.id).validation.length > 0
            ) {
                finished = false;
            }
        }

        const subDispatch = React.useCallback(
            (action) => {
                props.dispatch({
                    type: "PAGE",
                    pageId: props.state.currentPageId,
                    action,
                });
            },
            [props.dispatch, props.state.currentPageId]
        );

        const mainComponent =
            processed === undefined ? (
                <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
                <page.widget.component
                    state={props.state.currentPageState}
                    data={props.data}
                    dispatch={subDispatch}
                    status={subStatus(props.status, props.state.currentPageId)}
                />
            );

        const pageIds = pages.map((page) => page.id);
        const activePageIndex = pageIds.indexOf(props.state.currentPageId);
        const tabs = pages
            .map((page) => {
                const pageIndex = pageIds.indexOf(page.id);

                if (
                    isMobile &&
                    (pageIndex < activePageIndex - 1 ||
                        pageIndex > activePageIndex + 1)
                ) {
                    return null;
                }
                return (
                    <Pagination.Item
                        key={page.id}
                        disabled={!accessible[page.id]}
                        active={page.id == props.state.currentPageId}
                        onClick={() =>
                            props.dispatch({
                                type: "SELECT_TAB",
                                pageId: page.id,
                            })
                        }
                    >
                        {isMobile && pageIndex > activePageIndex
                            ? ">"
                            : isMobile && pageIndex < activePageIndex
                            ? "<"
                            : typeof page.title === "string"
                            ? page.title
                            : page.title(cache)}
                    </Pagination.Item>
                );
            })
            .filter((x) => x != null);

        return { mainComponent, tabs };
    }
    return {
        dataMeta: config.dataMeta,
        config,
        initialize(data: DataType, context: ContextType, encoded?: string[]) {
            const pages = config.pages(data);

            const currentPageId =
                encoded && encoded[0] ? encoded[0] : pages[0].id;

            const page = find(pages, (page) => page.id === currentPageId)!;

            const inner = page.widget.initialize(data, context);

            return {
                state: {
                    currentPageState: inner.state,
                    currentPageId,
                },
                data: inner.data,
            };
        },
        reduce(
            state: PaginatedWidgetState<DataType, ContextType>,
            data: DataType,
            action: PaginatedWidgetAction<DataType>,
            context: ContextType
        ) {
            switch (action.type) {
                case "SELECT_TAB": {
                    const page = find(
                        config.pages(data),
                        (page) => page.id === action.pageId
                    )!;
                    const inner = page.widget.initialize(data, context);
                    return {
                        state: {
                            ...state,
                            currentPageId: action.pageId,
                            currentPageState: inner.state,
                        },
                        data: inner.data,
                    };
                }
                case "REBUILD": {
                    const page = find(
                        config.pages(data),
                        (page) => page.id === state.currentPageId
                    )!;
                    const inner = page.widget.initialize(action.data, context);
                    return {
                        state: {
                            ...state,
                            currentPageState: inner.state,
                        },
                        data: inner.data,
                    };
                }
                case "PAGE":
                    if (state.currentPageId === action.pageId) {
                        const page = find(
                            config.pages(data),
                            (page) => page.id === action.pageId
                        );
                        if (!page) {
                            throw new Error("Current tab is missing");
                        }
                        const inner = page.widget.reduce(
                            state.currentPageState,
                            data,
                            action.action,
                            context
                        );
                        return {
                            state: {
                                ...state,
                                currentPageState: inner.state,
                            },
                            data: inner.data,
                        };
                    } else {
                        return {
                            state,
                            data,
                        };
                    }
            }
        },
        validate(data: DataType, cache: QuickCacheApi) {
            const errors = [];
            for (const page of config.pages(data)) {
                const inner = page.widget.validate(data, cache);
                if (inner.length > 0) {
                    errors.push({
                        field: page.id,
                        invalid: some(inner, "invalid"),
                        empty: some(inner, "empty"),
                        detail: inner,
                    });
                }
            }
            if (config.validate) {
                return config.validate(data, cache, errors);
            } else {
                return errors;
            }
        },
        encodeState(state: PaginatedWidgetState<DataType, ContextType>) {
            return [state.currentPageId];
        },
        component(props: Props<DataType, ContextType>) {
            const { mainComponent, tabs } = componentParts(props);
            return (
                <>
                    <div {...TAB_STYLE}>{mainComponent}</div>
                    <Pagination style={{ marginBottom: "0px" }}>
                        {tabs}
                    </Pagination>
                </>
            );
        },
    };
}
