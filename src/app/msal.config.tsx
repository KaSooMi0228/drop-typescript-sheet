import * as msal from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import * as React from "react";
import { SERVICE } from "./service";

const MSAL_CONFIG = {
    auth: {
        clientId: "2234d179-8d4e-4ebb-9edc-9c6520861caf",
        authority:
            "https://login.microsoftonline.com/28be5def-b564-421d-a9b8-3c2cd9d333d3",
        redirectUri:
            window.location.protocol +
            "//" +
            window.location.host +
            "/blank.html",
    },
};

const msalInstance = new msal.PublicClientApplication(MSAL_CONFIG);

const allAccounts = msalInstance.getAllAccounts();
if (allAccounts.length > 0) {
    const account = allAccounts[0];
    msalInstance.setActiveAccount(account);
    msalInstance
        .acquireTokenSilent({
            account,
            scopes: ["openid"],
        })
        .catch((error) => {
            console.error(error);
        });
}

msalInstance.addEventCallback((event) => {
    if (process.env.NODE_ENV !== 'production') {
        SERVICE.userChange({
            id_token: "fake-token",
            email: "winstonewert@gmail.com",
            image: "",
        });
        return;   
    }
    if (
        (event.eventType === msal.EventType.LOGIN_SUCCESS ||
            event.eventType == msal.EventType.ACQUIRE_TOKEN_SUCCESS) &&
        event.payload
    ) {
        const payload = event.payload as msal.AuthenticationResult;
        SERVICE.userChange({
            id_token: payload.idToken,
            email: payload.account!.username,
            image: "",
        });
    } else if (event.eventType === msal.EventType.LOGOUT_SUCCESS) {
        SERVICE.userChange(null);
    }
});

export function Authentication(props: { children: React.ReactNode }) {
    return (
        <MsalProvider instance={msalInstance}>{props.children}</MsalProvider>
    );
}
