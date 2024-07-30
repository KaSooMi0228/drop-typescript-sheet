import { Breadcrumb } from "react-bootstrap";
import { RouterPage } from "../../clay/router-page";
import { TableWidgetPage } from "../../clay/TableWidgetPage";
import HelpViewWidget from "./HelpViewWidget.widget";
import HelpWidget from "./HelpWidget.widget";
import { HELP_LISTING_PAGE } from "./listing";
import * as React from "react";

export const HELP_PAGE = RouterPage({
    edit: TableWidgetPage({
        meta: HelpWidget,
        makeContext: (context) => context,
        title: (help) => help.title,
    }),
    view: {
        ...TableWidgetPage({
            meta: HelpViewWidget,
            makeContext: (context) => context,
            title: (help) => help.title,
        }),
        headerComponent(props) {
            return (
                <>
                    <Breadcrumb>
                        <Breadcrumb.Item href="#/">Dashboard</Breadcrumb.Item>
                        <Breadcrumb.Item href="#/help/">Help</Breadcrumb.Item>
                        <Breadcrumb.Item>
                            {props.state.currentRecord &&
                                props.state.currentRecord.title}
                        </Breadcrumb.Item>
                    </Breadcrumb>
                    <div style={{ flexGrow: 1 }} />
                </>
            );
        },
    },
    "": HELP_LISTING_PAGE,
});
