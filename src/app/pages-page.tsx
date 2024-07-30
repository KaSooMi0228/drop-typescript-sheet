import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { css } from "glamor";
import * as React from "react";
import { BaseAction, Page } from "../clay/Page";
import { hasPermission } from "../permissions";
import { useUser } from "./state";

const CONTAINER_STYLE = css({
    display: "flex",
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "center",
    "& div": {
        textAlign: "center",
    },
});

const BUTTON_STYLE = css({
    display: "flex",
    flexDirection: "column",
    padding: "15px",
    margin: "10px",
    width: "150px",
    height: "120px",
    justifyContent: "space-between",
    color: "black",
    alignItems: "center",
    "& svg": {
        fontSize: "30pt",
        display: "block",
        alignSelf: "center",
    },
});
type State = {};

type Action = BaseAction;

type ButtonConf = {
    href: string;
    title: string;
    icon: any;
    permission?: {
        table: string;
        permission: string;
    };
};

type ViewData = {
    name: string;
    id: string;
};

const MakeButton = React.memo((props: { button: ButtonConf }) => {
    const button = props.button;

    return (
        <a
            href={button.href}
            {...BUTTON_STYLE}
            target={button.href.startsWith("#") ? undefined : "_blank"}
        >
            <FontAwesomeIcon icon={button.icon} /> <div>{button.title}</div>
        </a>
    );
});

type PagesPageOptions = {
    title: string;
    buttons: ButtonConf[];
};

export function PagesPage(options: PagesPageOptions): Page<State, Action> {
    options.buttons.sort((a, b) => a.title.localeCompare(b.title));
    return {
        initialize() {
            return {
                state: {
                    views: {},
                },
                requests: [],
            };
        },
        reduce(state, action, context) {
            switch (action.type) {
                case "PAGE_ACTIVATED":
                case "UPDATE_PARAMETERS":
                case "HEARTBEAT":
                    return {
                        state,
                        requests: [],
                    };
            }
        },
        headerComponent() {
            return <div style={{ flexGrow: 1 }} />;
        },
        component: React.memo(() => {
            let user = useUser();

            return (
                <div {...CONTAINER_STYLE}>
                    {options.buttons
                        .filter((button) => {
                            return (
                                !button.permission ||
                                hasPermission(
                                    user,
                                    button.permission.table,
                                    button.permission.permission
                                )
                            );
                        })
                        .map((button) => (
                            <MakeButton key={button.href} button={button} />
                        ))}
                </div>
            );
        }),
        encodeState() {
            return {
                segments: [],
                parameters: {},
            };
        },
        hasUnsavedChanges() {
            return false;
        },
        title() {
            return options.title;
        },
        beforeUnload() {
            return false;
        },
    };
}
