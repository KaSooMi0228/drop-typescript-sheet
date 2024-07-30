import {
    faBuilding,
    faCogs,
    faDatabase,
    faFileContract,
    faIdCard,
    faMapSigns,
    faQuestionCircle,
    faStar,
    faToolbox,
    faTractor,
} from "@fortawesome/free-solid-svg-icons";
import { ParsedUrlQuery } from "querystring";
import * as React from "react";
import { Breadcrumb, Button } from "react-bootstrap";
import { BaseAction, Page } from "../clay/Page";
import { hasPermission } from "../permissions";
import { useIsMobile } from "../useIsMobile";
import { Inbox } from "./inbox";
import { ITEM_TYPE } from "./inbox/types";
import { PagesPage } from "./pages-page";
import { useUser } from "./state";

const BUTTONS = [
    {
        href: "#/project/browse",
        title: "Projects",
        icon: faToolbox,
        permission: {
            table: "Project",
            permission: "read",
        },
    },
    {
        href: "#/salt/browse",
        title: "Salt Orders",
        icon: faTractor,
        permission: {
            table: "SaltOrder",
            permission: "read",
        },
    },
    {
        href: "#/contact/browse",
        title: "Contacts",
        icon: faIdCard,
        permission: {
            table: "Contact",
            permission: "read",
        },
    },
    {
        href: "#/company/browse",
        title: "Companies",
        icon: faBuilding,
        permission: {
            table: "Company",
            permission: "read",
        },
    },
    {
        href: "#/help",
        title: "Help",
        icon: faQuestionCircle,
        permission: {
            table: "Help",
            permission: "read",
        },
    },
    {
        href: "#/admin/",
        title: "Settings",
        icon: faCogs,
    },
    {
        href: "#/data/",
        title: "Data",
        icon: faDatabase,
    },
    {
        href: "#/campaigns/browse",
        title: "Campaigns",
        icon: faMapSigns,
        permission: {
            table: "Campaign",
            permission: "write",
        },
    },
    {
        href: "#/warranty-review/browse",
        title: "Warranty Reviews",
        icon: faFileContract,
        permission: {
            table: "WarrantyReview",
            permission: "write",
        },
    },
    {
        href: "https://can01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fapp.powerbi.com%2FreportEmbed%3FreportId%3Da33cf259-9e55-4b51-8879-e4a64cea3381%26autoAuth%3Dtrue%26ctid%3D28be5def-b564-421d-a9b8-3c2cd9d333d3&data=05%7C02%7Cfranke%40remdal.com%7Ccf83cada8f434f1298de08dc11efeea4%7C28be5defb564421da9b83c2cd9d333d3%7C1%7C0%7C638404969415896236%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C3000%7C%7C%7C&sdata=ihfJUe%2F681SsTgeqnV2dP85XmyBsltywGVeWhNysOH4%3D&reserved=0",
        title: "Scorecards",
        icon: faStar,
        permission: {
            table: "General",
            permission: "scorecard",
        },
    },
];

const BASE = PagesPage({
    title: "Dashboard",
    buttons: BUTTONS,
});

function decode(parameters: ParsedUrlQuery): ITEM_TYPE | null {
    if ("type" in parameters && "id" in parameters) {
        return {
            type: parameters.type as any,
            id: parameters.id as string,
        };
    } else {
        return null;
    }
}
type HomeState = {
    current_item: ITEM_TYPE | null;
};

const EMPTY = {};

type HomeAction =
    | BaseAction
    | {
          type: "SET_CURRENT_ITEM";
          item: ITEM_TYPE | null;
      };

export const HomePage: Page<HomeState, HomeAction> = {
    initialize(segments, parameters) {
        return {
            state: {
                current_item: decode(parameters),
            },
            requests: [],
        };
    },
    reduce(state, action, context) {
        switch (action.type) {
            case "PAGE_ACTIVATED":
            case "HEARTBEAT":
                return {
                    state,
                    requests: [],
                };
            case "UPDATE_PARAMETERS":
                return {
                    state: {
                        current_item: decode(action.parameters),
                    },
                    requests: [],
                };

            case "SET_CURRENT_ITEM":
                return {
                    state: {
                        current_item: action.item,
                    },
                    requests: [],
                };
        }
    },
    component(props) {
        const user = useUser();
        const isMobile = useIsMobile();

        const setOpenItem = React.useCallback(
            (item) => {
                props.dispatch({
                    type: "SET_CURRENT_ITEM",
                    item,
                });
            },
            [props.dispatch]
        );
        if (isMobile) {
            return (
                <div
                    style={{
                        padding: "1em",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Button href="#/mobile/site-visit-report">
                        Site Visit Report
                    </Button>
                    {hasPermission(
                        user,
                        "Estimate",
                        "mobile-simple-estimate"
                    ) && (
                        <Button
                            href="#/mobile/simple-estimate"
                            style={{ marginTop: "1em", marginBottom: "1em" }}
                        >
                            Simple Estimate
                        </Button>
                    )}
                </div>
            );
        } else {
            return (
                <>
                    <BASE.component state={EMPTY} dispatch={props.dispatch} />
                    {hasPermission(user, "Thread", "read") && (
                        <Inbox
                            openItem={props.state.current_item}
                            setOpenItem={setOpenItem}
                        />
                    )}
                </>
            );
        }
    },
    headerComponent() {
        return (
            <>
                <Breadcrumb>
                    <Breadcrumb.Item active>Dashboard</Breadcrumb.Item>
                </Breadcrumb>
                <div style={{ flexGrow: 1 }} />
            </>
        );
    },
    encodeState(state) {
        return {
            segments: [],
            parameters: state.current_item ? state.current_item : {},
        };
    },
    hasUnsavedChanges() {
        return false;
    },
    title() {
        return "Dashboard";
    },
    beforeUnload() {
        return false;
    },
};
