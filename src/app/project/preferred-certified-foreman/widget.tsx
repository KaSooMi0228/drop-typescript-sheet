import { Table } from "react-bootstrap";
import { ListWidget } from "../../../clay/widgets/ListWidget";
import PreferredCertifiedForemanRowWidget from "./PreferredCertifiedForemanRowWidget.widget";
import * as React from "react";

const MetaBase = ListWidget(PreferredCertifiedForemanRowWidget, {
    emptyOk: true,
});
export const PreferredCertifiedForemenWidget: typeof MetaBase = {
    ...MetaBase,
    component(props) {
        return (
            <Table
                style={{
                    width: "100%",
                    maxWidth: "75em",
                    marginRight: "auto",
                }}
            >
                <thead>
                    <tr>
                        <th style={{ width: "1em" }} />
                        <th style={{ width: "10em" }}>
                            Preferred Certified Foreman
                        </th>
                        <th>Reason</th>
                        <th style={{ width: "1em" }} />
                    </tr>
                </thead>
                <MetaBase.component
                    {...props}
                    extraItemForAdd={props.data.length < 3}
                    containerClass="tbody"
                />
            </Table>
        );
    },
};
