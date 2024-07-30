import { faExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { format as formatDate } from "date-fns";
import { Dictionary } from "lodash";
import * as React from "react";
import { Button, ListGroup, ListGroupItem } from "react-bootstrap";
import { CONTENT_AREA } from "../styles";
import { NEW_THREAD_SOURCE } from "./NewThreadWidget.widget";
import { NOTIFICATION_SOURCES } from "./notification-sources";
import { NotificationSourceComponentProps } from "./NotificationSource";
import { ITEM_TYPE } from "./types";
import { useInboxItems } from "./use-inbox-items";

type ReactInboxSource = {
    Component: React.FC<NotificationSourceComponentProps>;
};

const INBOX_SOURCES: Dictionary<ReactInboxSource> = {
    "new-thread": NEW_THREAD_SOURCE,
};

for (const source of NOTIFICATION_SOURCES) {
    INBOX_SOURCES[source.key] = source;
}

export function Inbox(props: {
    openItem: ITEM_TYPE | null;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const items = useInboxItems();

    const onNewThread = React.useCallback(() => {
        props.setOpenItem({
            type: "new-thread",
            id: "",
        });
    }, [props.setOpenItem]);

    const CurrentComponent =
        props.openItem && INBOX_SOURCES[props.openItem.type].Component;

    return (
        <div
            style={{
                display: "flex",
                flexGrow: 1,
                borderTop: "black solid 1px",
                overflowY: "auto",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    borderRight: "solid gray .5px",
                    justifyContent: "space-between",
                    width: "50%",
                }}
            >
                <div {...CONTENT_AREA}>
                    <ListGroup>
                        {items.map((item, index) => (
                            <ListGroupItem
                                key={item.type + "@" + item.id}
                                onClick={() =>
                                    props.setOpenItem({
                                        type: item.type,
                                        id: item.id,
                                    })
                                }
                                active={
                                    (props.openItem &&
                                        props.openItem.type == item.type &&
                                        props.openItem.id === item.id) ||
                                    false
                                }
                            >
                                <FontAwesomeIcon
                                    style={{ color: item.color }}
                                    icon={item.icon}
                                />{" "}
                                <b>{item.label.toLocaleUpperCase()}</b>
                                &nbsp;
                                {item.unread && (
                                    <FontAwesomeIcon
                                        icon={faExclamation}
                                        style={{ color: "red" }}
                                    />
                                )}
                                &nbsp;
                                {item.project}
                                {item.contact && item.contact.name}
                                {item.company && " (" + item.company.name + ")"}
                                &nbsp;
                                {item.date && (
                                    <div
                                        style={{
                                            float: "right",
                                            fontStyle: "italic",
                                        }}
                                    >
                                        {item.date.toString()}
                                    </div>
                                )}
                                {!item.date && item.datetime && (
                                    <div
                                        style={{
                                            float: "right",
                                            fontStyle: "italic",
                                        }}
                                    >
                                        {formatDate(
                                            item.datetime,
                                            "yyy-MM-dd HH:mm"
                                        )}
                                    </div>
                                )}
                            </ListGroupItem>
                        ))}
                    </ListGroup>
                </div>
                <Button onClick={onNewThread}>New Thread</Button>
            </div>
            {props.openItem && CurrentComponent && (
                <div {...CONTENT_AREA}>
                    <CurrentComponent
                        id={props.openItem.id}
                        key={props.openItem.id}
                        setOpenItem={props.setOpenItem}
                    />
                </div>
            )}
        </div>
    );
}
