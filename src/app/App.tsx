import {
    faBookDead,
    faBoxOpen,
    faBriefcase,
    faExclamationTriangle,
    faKey,
    faNetworkWired,
    faPrint,
    faSpinner,
    faUserAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { parseISO as parseDate } from "date-fns";
import humanizeDuration from "humanize-duration";
import * as React from "react";
import { Alert, Button, Nav, Navbar, NavItem } from "react-bootstrap";
import Toast from "react-bootstrap/Toast";
import { connect } from "react-redux";
import REMDAL_LOGO_IMAGE from "../assets/remdal-logo.jpg";
import { RouterPageState } from "../clay/router-page";
import { ServerMessage, Status } from "../clay/service";
import { titleCase } from "../clay/title-case";
import { hasPermission } from "../permissions";
import { useIsMobile } from "../useIsMobile";
import VERSION from "../version";
import { default as Login, Logout } from "./Login";
import { ROOT_PAGE } from "./pages";
import { buildLogFile, SERVICE } from "./service";
import { Action, isLoggedIn, PrintStatus, State, StateContext } from "./state";
import { VisibilityContext } from "./visibility";

type Props<S, A> = {
    loggedIn: boolean;
    imageUrl: string | null;
    pageState: RouterPageState;
    dispatch: (action: Action) => void;
    status: Status;
    state: State;
    errors: ServerMessage[];
    printing: PrintStatus[];
};

const LOGIN_STYLE: React.CSSProperties = {
    textAlign: "center",
    marginTop: "50px",
};

const APP_STYLE: React.CSSProperties = {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
};

const NAV_STYLE: React.CSSProperties = {
    marginBottom: 0,
    minHeight: ".75in",
    background: "#ddd",
};

const ERROR_CONTAINER: React.CSSProperties = {
    position: "absolute",
    bottom: "50%",
    right: "50%",
    marginLeft: "-50%",
    marginTop: "-50%",
    zIndex: 100000,
};

const PRINT_CONTAINER: React.CSSProperties = {
    position: "absolute",
    bottom: 0,
    right: 0,
};

type ErrorProps = {
    error: ServerMessage;
    dispatch: (action: Action) => void;
};

function Error({ error, dispatch }: ErrorProps) {
    const [showDetail, setDetail] = React.useState(false);

    return (
        <Toast
            show={true}
            delay={1000}
            onClose={() =>
                dispatch({
                    type: "CLOSE_ERROR",
                    error,
                })
            }
        >
            <Toast.Header>
                <FontAwesomeIcon icon={faExclamationTriangle} />{" "}
                {titleCase((error as any).status)}
            </Toast.Header>
            <Toast.Body>
                {(error as any).message && (
                    <Alert variant="danger">{(error as any).message}</Alert>
                )}
                {showDetail ? (
                    <pre
                        style={{
                            overflow: "auto",
                            display: "block",
                            maxHeight: "50vh",
                        }}
                    >
                        {JSON.stringify(error, null, 4)}
                    </pre>
                ) : (
                    <a onClick={() => setDetail(true)}>detail</a>
                )}
            </Toast.Body>
        </Toast>
    );
}

type PrintingProps = {
    status: PrintStatus;
    dispatch: (action: Action) => void;
};

function Printing({ status, dispatch }: PrintingProps) {
    const openError = React.useCallback(() => {
        const other = window.open("")!;
        other.document.write((status as any).error);
    }, [status]);

    return (
        <Toast
            show={true}
            delay={1000}
            onClose={() =>
                dispatch({
                    type: "CLOSE_PRINTING",
                    id: status.id,
                })
            }
        >
            <Toast.Header>
                <FontAwesomeIcon icon={faPrint} /> {titleCase(status.template)}
            </Toast.Header>
            <Toast.Body style={{ textAlign: "center" }}>
                {status.type === "starting" && (
                    <FontAwesomeIcon icon={faSpinner} spin size="6x" />
                )}
                {status.type === "finished" && (
                    <>
                        {status.url && (
                            <a
                                href={
                                    window.navigator.platform === "Win32"
                                        ? "ms-word:ofe|u|" + status.url
                                        : status.url
                                }
                            >
                                Open
                            </a>
                        )}
                        {status.error && (
                            <Button onClick={openError}>Error</Button>
                        )}
                        {status.target.length > 0 && (
                            <div>
                                <b>Copies Sent To:</b>
                                <ul>
                                    {status.target.map((email) => (
                                        <li key={email}>{email}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {status.offline && "Queued"}
                    </>
                )}
            </Toast.Body>
        </Toast>
    );
}

function calcAdvice(state: State) {
    if (!state.user) {
        if (state.status.connected) {
            return "You are not currently logged in, click the Login button to continue";
        } else {
            return "You are currently offline, you need to login while online";
        }
    } else {
        if (state.status.connected) {
            if (!state.status.currentToken) {
                return "You are not currently logged in, click the Login button to continue";
            } else {
                return "Please Stand By 1";
            }
        } else {
            if (!state.status.cache) {
                return "This device has not been synchronized. In order to enable offline support, you need to click the Sync button while online first";
            } else {
                return "Connect to the internet, or use Dropsheet Offline";
            }
        }
    }
}

function AppForm<S, A>({
    loggedIn,
    imageUrl,
    pageState,
    dispatch,
    status,
    state,
    errors,
    printing,
}: Props<S, A>) {
    const subdispatch = React.useCallback(
        (action) => dispatch({ type: "PAGE", action }),
        [dispatch]
    );
    const checkChange = React.useCallback(
        (event) => {
            if (ROOT_PAGE.hasUnsavedChanges(pageState)) {
                if (
                    !window.confirm(
                        "There are unsaved changes. Are you sure you want to leave?"
                    )
                ) {
                    event.preventDefault();
                }
            }
        },
        [pageState]
    );
    const isMobile = useIsMobile();
    if (loggedIn && state.user) {
        return (
            <VisibilityContext.Provider value={state.visible}>
                <StateContext.Provider value={state}>
                    <div style={APP_STYLE}>
                        <div
                            className="navbar navbar-default navbar-light"
                            style={NAV_STYLE}
                        >
                            <Nav>
                                <Navbar.Brand>
                                    <a href="#" onClick={checkChange}>
                                        <img
                                            src={REMDAL_LOGO_IMAGE}
                                            style={{ height: "40px" }}
                                        />
                                        {!isMobile && (
                                            <div
                                                style={{
                                                    color: "rgb(0, 83, 160)",
                                                    fontWeight: "bold",
                                                    display: "inline-block",
                                                    fontSize: "20pt",
                                                    verticalAlign: "middle",
                                                    marginLeft: "10px",
                                                }}
                                                title={VERSION}
                                            >
                                                DROPSHEET
                                            </div>
                                        )}
                                    </a>
                                </Navbar.Brand>
                            </Nav>
                            <ROOT_PAGE.headerComponent
                                state={pageState}
                                dispatch={subdispatch}
                            />
                            <Button size="sm" onClick={buildLogFile}>
                                <FontAwesomeIcon icon={faBookDead} />
                            </Button>
                            {!isMobile && (
                                <>
                                    {hasPermission(
                                        state.user,
                                        "General",
                                        "synchronize"
                                    ) && (
                                        <>
                                            <div style={{ width: ".75em" }} />
                                            <Button
                                                onClick={SERVICE.sync.bind(
                                                    SERVICE
                                                )}
                                            >
                                                Sync
                                                {status.cache &&
                                                    "ed " +
                                                        humanizeDuration(
                                                            new Date().getTime() -
                                                                parseDate(
                                                                    status.cache
                                                                        .syncTime
                                                                ).getTime(),
                                                            {
                                                                largest: 1,
                                                                round: true,
                                                            }
                                                        ) +
                                                        " ago"}
                                            </Button>
                                        </>
                                    )}
                                    {status.connected && status.offline && (
                                        <NavItem
                                            style={{
                                                fontSize: "20pt",
                                                padding: "5px",
                                            }}
                                        >
                                            <Button
                                                href={
                                                    "/#" + window.location.hash
                                                }
                                            >
                                                Use Dropsheet Online
                                            </Button>
                                        </NavItem>
                                    )}
                                    {status.pendingCount > 0 && (
                                        <NavItem
                                            style={{
                                                fontSize: "20pt",
                                                padding: "5px",
                                                color: "yellow",
                                            }}
                                        >
                                            {status.pendingCount}
                                        </NavItem>
                                    )}
                                    {status.offline && (
                                        <NavItem
                                            style={{
                                                fontSize: "20pt",
                                                padding: "5px",
                                            }}
                                        >
                                            <FontAwesomeIcon
                                                icon={faBriefcase}
                                            />
                                        </NavItem>
                                    )}
                                    {!status.offline && (
                                        <NavItem
                                            style={{
                                                fontSize: "20pt",
                                                padding: "5px",
                                                color: status.connected
                                                    ? "green"
                                                    : "red",
                                            }}
                                        >
                                            <FontAwesomeIcon
                                                icon={faNetworkWired}
                                            />
                                        </NavItem>
                                    )}{" "}
                                    <NavItem>
                                        {imageUrl && (
                                            <img
                                                style={{
                                                    height: "40px",
                                                    paddingLeft: "10px",
                                                    paddingRight: "10px",
                                                }}
                                                src={imageUrl}
                                            />
                                        )}
                                    </NavItem>
                                </>
                            )}
                            <NavItem>
                                <Logout />
                            </NavItem>
                        </div>
                        <ROOT_PAGE.component
                            state={pageState}
                            dispatch={subdispatch}
                        />
                        <div style={PRINT_CONTAINER}>
                            {printing.map((status) => (
                                <Printing
                                    key={status.id}
                                    status={status}
                                    dispatch={dispatch}
                                />
                            ))}
                        </div>
                        <div style={ERROR_CONTAINER}>
                            {errors.map((error, index) => (
                                <Error
                                    key={index}
                                    error={error}
                                    dispatch={dispatch}
                                />
                            ))}
                        </div>
                    </div>
                </StateContext.Provider>
            </VisibilityContext.Provider>
        );
    } else {
        return (
            <StateContext.Provider value={state}>
                <div style={LOGIN_STYLE}>
                    <h1>Please Login to use Dropsheet.</h1>
                    <Login />
                    <div
                        style={{
                            margin: "1em",
                            display: "flex",
                            width: "10em",
                            justifyContent: "space-between",
                            marginLeft: "auto",
                            marginRight: "auto",
                        }}
                    >
                        <FontAwesomeIcon
                            size="2x"
                            icon={faUserAlt}
                            style={{
                                color: state.user === null ? "red" : "green",
                            }}
                        />
                        <FontAwesomeIcon
                            size="2x"
                            icon={faNetworkWired}
                            style={{
                                color: !state.status.connected
                                    ? "red"
                                    : "green",
                            }}
                        />
                        <FontAwesomeIcon
                            size="2x"
                            icon={faKey}
                            style={{
                                color:
                                    state.status.currentToken === null
                                        ? "red"
                                        : "green",
                            }}
                        />
                        <FontAwesomeIcon
                            size="2x"
                            icon={faBoxOpen}
                            style={{
                                color: !state.status.cache ? "red" : "green",
                            }}
                        />
                    </div>
                    <h2>{calcAdvice(state)}</h2>
                    {!state.status.connected &&
                        state.status.cache &&
                        !state.status.offline && (
                            <Button href={"?offline" + window.location.hash}>
                                Use Dropsheet Offline
                            </Button>
                        )}
                </div>
            </StateContext.Provider>
        );
    }
}

function mapStateToProps(state: State) {
    return {
        loggedIn: isLoggedIn(state),
        imageUrl: state.profile_image_url,
        pageState: state.pageState,
        status: state.status,
        state: state,
        errors: state.errors,
        printing: state.printing,
        visible: state.visible,
    };
}
export default connect(mapStateToProps)(AppForm);
