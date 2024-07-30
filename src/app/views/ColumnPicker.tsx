import { css } from "glamor";
import * as React from "react";
import { FormControl, ListGroup, ListGroupItem } from "react-bootstrap";
import { useId } from "react-id-generator";
import { COLUMNS, keyToLabel } from "../../clay/dataGrid/columns";
import { useQuickAllRecords, useQuickCache } from "../../clay/quick-cache";
import { Role, ROLE_META } from "../roles/table";
import { SaltProduct, SALT_PRODUCT_META } from "../salt/table";
import { CONTENT_AREA } from "../styles";

interface Props {
    table: string;
    selectColumn: (key: string, label: string) => void;
}

type ColumnDetail = {
    label: string;
    key: string;
};

function makeColumns(
    table: string,
    saltProducts: SaltProduct[] | undefined,
    roles: Role[] | undefined
) {
    const columns: ColumnDetail[] = [];
    if (saltProducts && roles) {
        for (const [key, value] of Object.entries(COLUMNS[table])) {
            switch (value.subkeyType) {
                case null:
                    columns.push({
                        key,
                        label: keyToLabel(key),
                    });
                    break;
                case "Role":
                    for (const role of roles) {
                        if (role.projectRole) {
                            columns.push({
                                key: key + "@" + role.id.uuid,
                                label: keyToLabel(key) + " > " + role.name,
                            });
                        }
                    }
                    break;
                case "SaltProduct":
                    for (const product of saltProducts) {
                        if (product.noUnits === (key === "orderItems")) {
                            columns.push({
                                key: key + "@" + product.id.uuid,
                                label: keyToLabel(key) + " > " + product.name,
                            });
                        }
                    }
                    break;
            }
        }
    }

    columns.sort((a, b) => {
        const a_parts = a.key.split(".").length;
        const b_parts = b.key.split(".").length;
        if (a_parts == b_parts) {
            return a.label.localeCompare(b.label);
        } else {
            return a_parts - b_parts;
        }
    });
    return columns;
}

const WIDGET_STYLE = css({
    "html & input.form-control": {
        border: "none",
        height: "auto",
        padding: "0px",
    },
    "& ul": {
        width: "auto !important",
    },
});

export default function ColumnPicker({ table, selectColumn }: Props) {
    const cache = useQuickCache();

    function handleChange(selected: ColumnDetail[]) {
        if (selected.length > 0) {
            selectColumn(selected[0].key, selected[0].label);
        }
    }

    const saltProducts = useQuickAllRecords(SALT_PRODUCT_META);
    const roles = useQuickAllRecords(ROLE_META);
    const columns = React.useMemo(() => {
        return makeColumns(table, saltProducts, roles);
    }, [table, saltProducts, roles]);

    const [text, setText] = React.useState("");

    const onTextChange = React.useCallback(
        (event) => {
            setText(event.target.value);
        },
        [setText]
    );

    const filteredColumns = React.useMemo(() => {
        return columns
            .filter(
                (x) => x.label.toLowerCase().indexOf(text.toLowerCase()) !== -1
            )
            .slice(0, 100);
    }, [columns, text]);

    const id = useId();
    return (
        <>
            <div className={"f-column-picker form-control "} {...WIDGET_STYLE}>
                <FormControl
                    type="text"
                    autoFocus
                    value={text}
                    onChange={onTextChange}
                />
            </div>
            <div {...CONTENT_AREA}>
                <ListGroup>
                    {filteredColumns.map((column) => (
                        <ListGroupItem
                            key={column.key}
                            onClick={() => {
                                selectColumn(column.key, column.label);
                            }}
                        >
                            {column.label}
                        </ListGroupItem>
                    ))}
                </ListGroup>
            </div>
        </>
    );
}
