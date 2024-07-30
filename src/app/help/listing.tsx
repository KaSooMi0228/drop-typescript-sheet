import { css } from "glamor";
import { ParsedUrlQuery } from "querystring";
import { Breadcrumb, Button, ListGroup, ListGroupItem } from "react-bootstrap";
import {
    BaseAction,
    PageContext,
    PageRequest,
    ReduceResult,
} from "../../clay/Page";
import {
    castRequest,
    QueryRequest,
    Request,
    RequestHandle,
} from "../../clay/requests";
import { QueryTableResult } from "../../clay/server/api";
import { hasPermission } from "../../permissions";
import { useUser } from "../state";
import * as React from "react";

type DataItem = { title: string; id: string };

export type State = {
    data: DataItem[] | null;
    refreshing: boolean;
};

export type Action =
    | {
          type: "LOAD_DATA";
          response: QueryTableResult;
      }
    | BaseAction;

function requestData(): RequestHandle<PageRequest, Action> {
    return castRequest(
        Request<QueryRequest, Action>(
            "QUERY",
            {
                tableName: "Help",
                columns: ["id", "title"],
                sorts: ["title"],
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
    return {
        state: {
            data: null,
            refreshing: true,
        },
        requests: [requestData()],
    };
}

const CONTAINER_STYLE = css({
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    margin: "25px",
    "& .list-group": {
        width: "100%",
    },
});

type Props = { state: State; dispatch: (action: Action) => void };
function component(props: Props) {
    const user = useUser();
    return (
        <>
            <div {...CONTAINER_STYLE}>
                <ListGroup>
                    {props.state.data &&
                        props.state.data.map((item) => (
                            <ListGroupItem key={item.id}>
                                <a href={"#/help/view/" + item.id}>
                                    {item.title}
                                </a>
                            </ListGroupItem>
                        ))}
                </ListGroup>
                <div style={{ flexGrow: 1 }} />
                <div>
                    {hasPermission(user, "Help", "new") && (
                        <Button onClick={() => window.open("#/help/edit/new")}>
                            Add Help Item
                        </Button>
                    )}
                </div>
            </div>
        </>
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
                        title: record[1] as string,
                    })),
                },
                requests: [],
            };
        case "HEARTBEAT":
        case "PAGE_ACTIVATED":
            return {
                state,
                requests: [],
            };

        case "UPDATE_PARAMETERS": {
            return {
                state,
                requests: [],
            };
        }
    }
}

function reduce(
    state: State,
    action: Action,
    context: PageContext
): ReduceResult<State, Action> {
    return innerReduce(state, action, context);
}

function encodeState(state: State) {
    return {
        segments: [],
        parameters: {},
    };
}

export const HELP_LISTING_PAGE = {
    initialize,
    reduce,
    component,
    encodeState,
    hasUnsavedChanges() {
        return false;
    },
    headerComponent() {
        return (
            <>
                <Breadcrumb>
                    <Breadcrumb.Item href="#/">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item href="#/help/">Help</Breadcrumb.Item>
                </Breadcrumb>
                <div style={{ flexGrow: 1 }} />
            </>
        );
    },
    title() {
        return "Help";
    },
    beforeUnload() {
        return false;
    },
};
