import { OAUTH_CLIENT_ID } from "../keys";
import { AuthenticationUser } from "./service";
import * as React from "react";

interface GoogleUser {
    getBasicProfile(): {
        getEmail(): string;
        getImageUrl(): string;
    };
    getAuthResponse(): {
        id_token: string;
    };
}

interface GoogleAuth {
    signIn(options: { scope: string }): Promise<GoogleUser>;
    signOut(): void;
    currentUser: {
        get(): GoogleUser;
        listen(f: (user: GoogleUser) => void): void;
    };
}

let googleAuth: GoogleAuth;

export const GOOGLE_AUTH = {
    initialize(userChange: (user: AuthenticationUser | null) => void) {
        const onUserChange = (user: GoogleUser) => {
            if (!user || !user.getAuthResponse().id_token) {
                userChange(null);
            } else {
                const profile = user.getBasicProfile();
                userChange({
                    id_token: user.getAuthResponse().id_token,
                    image: profile.getImageUrl(),
                    email: profile.getEmail(),
                });
            }
        };
        const scriptTag = document.createElement("script");
        scriptTag.src = "https://apis.google.com/js/platform.js";
        scriptTag.onload = () => {
            (global as any).gapi.load("auth2", async () => {
                const gapi = (global as any).gapi;
                googleAuth = await gapi.auth2.init({
                    clientId: OAUTH_CLIENT_ID,
                });

                googleAuth.currentUser.listen(onUserChange);
                onUserChange(googleAuth.currentUser.get());
            });
        };
        document.body.appendChild(scriptTag);
    },
    signIn() {
        if (googleAuth) {
            googleAuth.signIn({
                scope: "email",
            });
        }
    },
    signOut() {
        if (googleAuth) {
            googleAuth.signOut();
        }
    },
    getToken() {
        const user = googleAuth.currentUser.get();
        if (user) {
            return user.getAuthResponse().id_token;
        }
        return null;
    },
};
