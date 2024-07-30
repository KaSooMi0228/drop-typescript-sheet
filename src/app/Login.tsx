import { InteractionType } from "@azure/msal-browser";
import { useMsal, useMsalAuthentication } from "@azure/msal-react";
import { faDoorOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as React from "react";
import { Button } from "react-bootstrap";
import { StateContext } from "./state";

function LoginForm() {
    const state = React.useContext(StateContext);

    const request = {
        loginHint:
            state?.user?.email === "winstonewert@gmail.com"
                ? "winstone@remdal.com"
                : state?.user?.email,
        scopes: [],
    };

    const { login, result, error } = useMsalAuthentication(
        InteractionType.Silent,
        request
    );
    const { inProgress } = useMsal();

    const onLogin = React.useCallback(() => {
        login(InteractionType.Popup);
    }, [login]);

    React.useEffect(() => {
        if (error) {
            console.error(error);
        }
    }, [error]);

    return (
        <Button onClick={onLogin} disabled={inProgress != "none"}>
            Login
        </Button>
    );
}

export default LoginForm;

export function Logout() {
    const { instance } = useMsal();

    const onLogout = React.useCallback(() => {
        instance.logoutPopup();
    }, [instance]);

    return (
        <Button size="sm" onClick={onLogout}>
            <FontAwesomeIcon icon={faDoorOpen} />
        </Button>
    );
}
