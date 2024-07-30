import dateFormat from "date-fns/format";
import React from "react";
import { Button, Table } from "react-bootstrap";
import { deleteRecord } from "../../clay/api";
import { Link } from "../../clay/link";
import { Meta } from "../../clay/meta";
import { useQuickCache, useQuickRecord } from "../../clay/quick-cache";
import { titleCase } from "../../clay/title-case";
import { NoticeDetail, NOTICE_META } from "../notice/table";
import { calcProjectSummary, PROJECT_META } from "../project/table";
import { ROLE_META } from "../roles/table";
import { TABLE_STYLE } from "../styles";
import { TABLES_META } from "../tables";
import { User, USER_META } from "../user/table";
import { MessageBody, MessageFooter, MessageHeader } from "./message";
import { ITEM_TYPE } from "./types";

function UserName(props: { user: Link<User> }) {
    const user = useQuickRecord(USER_META, props.user);
    return <>{user?.name}</>;
}

function DiffField(props: { value: any; meta: Meta }) {
    switch (props.meta.type) {
        case "string":
        case "quantity":
            return props.value;
        case "datetime":
            return props.value
                ? dateFormat(new Date(props.value), "yyyy-MM-dd h:mm a")
                : "(none)";
        case "uuid":
            if (
                props.meta.linkTo &&
                TABLES_META[props.meta.linkTo] &&
                props.value
            ) {
                const record = useQuickRecord(
                    TABLES_META[props.meta.linkTo],
                    props.value
                );
                if (record) {
                    return record.name;
                } else {
                    return "?";
                }
            } else {
                return "(none)";
            }
        case "array":
            const items = props.meta.items;
            return props.value.map((value: any, index: number) => (
                <React.Fragment key={index}>
                    {index != 0 && ","}
                    <DiffField value={value} meta={items} />
                </React.Fragment>
            ));
        default:
            return "(changed)";
    }
}

function Component(props: {
    id: string;
    setOpenItem: (item: ITEM_TYPE | null) => void;
}) {
    const notice = useQuickRecord(NOTICE_META, props.id);

    const cache = useQuickCache();

    const onDismiss = React.useCallback(() => {
        deleteRecord(NOTICE_META, "inbox", props.id).then(() =>
            props.setOpenItem(null)
        );
    }, [props.id, props.setOpenItem]);

    if (!notice) {
        return <></>;
    }
    const detail: NoticeDetail = JSON.parse(notice.detail);

    switch (detail.type) {
        case "ASSIGNED_TO_PROJECT":
            const project = cache.get(PROJECT_META, detail.project);
            return (
                <>
                    <MessageHeader>
                        {project && calcProjectSummary(project)} Assignment
                    </MessageHeader>
                    <MessageBody>
                        You have been assigned as{" "}
                        {cache.get(ROLE_META, detail.role)?.name} on this
                        project by{" "}
                        {cache.get(USER_META, notice.source_user)?.name}.
                        <Button
                            onClick={() =>
                                window.open(
                                    "#/project/edit/" + detail.project + "/"
                                )
                            }
                            style={{ marginTop: "1em", maxWidth: "10em" }}
                        >
                            Open Project
                        </Button>
                    </MessageBody>
                    <MessageFooter>
                        <Button
                            onClick={onDismiss}
                            style={{ marginLeft: "auto", display: "block" }}
                        >
                            Dismiss
                        </Button>
                    </MessageFooter>
                </>
            );
        case "PROJECT_MODIFIED":
            return (
                <>
                    <MessageHeader>
                        {project && calcProjectSummary(project)} Modified
                    </MessageHeader>
                    <MessageBody>
                        This project was modified by{" "}
                        {cache.get(USER_META, notice.source_user)?.name}
                        {". "}
                        <Button
                            onClick={() =>
                                window.open(
                                    "#/project/edit/" + detail.project + "/"
                                )
                            }
                            style={{ marginTop: "1em", maxWidth: "10em" }}
                        >
                            Open Project
                        </Button>
                        <Table {...TABLE_STYLE}>
                            <tbody>
                                {Object.entries(detail.diff)
                                    .filter(
                                        ([key, value]) =>
                                            key !== "recordVersion"
                                    )
                                    .map(([key, value]) => (
                                        <tr key={key}>
                                            <td>{titleCase(key)}</td>
                                            <td>
                                                <DiffField
                                                    key={key}
                                                    value={value}
                                                    meta={
                                                        PROJECT_META.fields[key]
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </Table>
                    </MessageBody>
                    <MessageFooter>
                        <Button
                            onClick={onDismiss}
                            style={{ marginLeft: "auto", display: "block" }}
                        >
                            Dismiss
                        </Button>
                    </MessageFooter>
                </>
            );
    }
}
