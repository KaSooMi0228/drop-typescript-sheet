import { format as formatDate } from "date-fns";
import { formatters } from "jsondiffpatch";
import { ParsedUrlQuery } from "querystring";
import * as React from "react";
import { Breadcrumb, Button, Table } from "react-bootstrap";
import Modal from "react-modal";
import { ChangeRejected, CHANGE_REJECTED_META } from "../app/notice/table";
import { USER_META } from "../app/user/table";
import { rawRequest } from "./api";
import { BaseAction, PageContext, ReduceResult } from "./Page";
import { useQuickRecord } from "./quick-cache";
import { useQuickAllRecordsSorted } from "./widgets/dropdown-link-widget";

type State = {};

type Action = BaseAction;

function initialize(
    segments: string[],
    parameters: ParsedUrlQuery,
    context: PageContext
): ReduceResult<State, Action> {
    return {
        state: {},
        requests: [],
    };
}

function reduce(
    state: State,
    action: Action,
    context: PageContext
): ReduceResult<State, Action> {
    switch (action.type) {
        case "PAGE_ACTIVATED":
        case "UPDATE_PARAMETERS":
        case "HEARTBEAT":
            return {
                state,
                requests: [],
            };
    }
}

type Props = {
    state: State;
    dispatch: (action: Action) => void;
};

function ChangeRow(props: {
    change: ChangeRejected;
    setCurrentDiff: (patch: any) => void;
}) {
    const user = useQuickRecord(USER_META, props.change.addedBy);

    let decoded: any;
    try {
        decoded = JSON.parse(props.change.detail);
    } catch (error) {
        console.error(props.change.detail);
        decoded = {};
        // ok
    }

    const tryApply = React.useCallback(() => {
        rawRequest(decoded);
    }, [props.change]);

    const tryForce = React.useCallback(() => {
        if (confirm("Are you sure want to force this change?")) {
            rawRequest({ ...decoded, override: true }).then((response) => {
                alert("Force Suceeded");
            });
        }
    }, [props.change]);

    return (
        <tr>
            <td>{user?.name}</td>
            <td>{decoded.tableName}</td>
            <td>{decoded.id}</td>
            <td>
                {formatDate(props.change.addedDateTime!, "yyyy-MM-dd h:mm a")}
            </td>
            <td>
                <Button
                    size="sm"
                    style={{
                        width: "80px",
                        height: "24px",
                        padding: "0px",
                    }}
                    onClick={() => {
                        props.setCurrentDiff(decoded.patches);
                    }}
                >
                    Changes
                </Button>
            </td>
            <td>
                <Button
                    size="sm"
                    style={{
                        width: "80px",
                        height: "24px",
                        padding: "0px",
                    }}
                    onClick={tryApply}
                >
                    Retry
                </Button>
            </td>
            <td>
                <Button
                    size="sm"
                    style={{
                        width: "80px",
                        height: "24px",
                        padding: "0px",
                    }}
                    variant="danger"
                    onClick={tryForce}
                >
                    Force
                </Button>
            </td>
        </tr>
    );
}

function component(props: Props) {
    const rejectedChanges =
        useQuickAllRecordsSorted(
            CHANGE_REJECTED_META,
            (_record) => "",
            (x, y) => (y.addedDateTime as any) - (x.addedDateTime as any)
        ) || [];

    const [currentDiff, setCurrentDiff] = React.useState<any[] | undefined>(
        undefined
    );

    return (
        <>
            <Modal
                isOpen={currentDiff !== undefined}
                onRequestClose={() => setCurrentDiff(undefined)}
            >
                {currentDiff &&
                    currentDiff.map((currentDiff, index) => (
                        <div
                            key={index}
                            dangerouslySetInnerHTML={{
                                __html: formatters.html.format(
                                    currentDiff || undefined,
                                    {}
                                ),
                            }}
                        />
                    ))}
            </Modal>
            <Table>
                <tbody>
                    {rejectedChanges.slice(0, 100).map((change, index) => (
                        <ChangeRow
                            change={change}
                            key={index}
                            setCurrentDiff={setCurrentDiff}
                        />
                    ))}
                </tbody>
            </Table>
        </>
    );
}

function encodeState(state: State) {
    return {
        segments: [],
        parameters: {},
    };
}

export const RejectedChangesPage = {
    initialize,
    reduce,
    component,
    encodeState,
    hasUnsavedChanges(state: State) {
        return false;
    },
    headerComponent() {
        return (
            <>
                <Breadcrumb>
                    <Breadcrumb.Item href="#/">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item href="#/admin/">Settings</Breadcrumb.Item>
                    <Breadcrumb.Item href="#/general/">General</Breadcrumb.Item>
                    <Breadcrumb.Item active>Rejected Changes</Breadcrumb.Item>
                </Breadcrumb>
                <div style={{ flexGrow: 1 }} />
            </>
        );
    },
    title() {
        return "Rejected Changes";
    },
    beforeUnload() {
        return false;
    },
};
