import { Table } from "react-bootstrap";
import { FormWrapper } from "../../clay/widgets/FormField";
import { TABLE_STYLE } from "../styles";
import { Project } from "./table";
import * as React from "react";

export function ProjectLostAwardShared(props: {
    data: Project;
    widgets: {
        competitors: any;
    };
}) {
    return (
        <>
            <FormWrapper label="Competitors">
                <Table {...TABLE_STYLE}>
                    <thead>
                        {props.data.competitors.length > 0 && (
                            <tr>
                                <th />
                                <th style={{ width: "10em" }}>Bid Ranking</th>
                                <th>Competitor</th>
                                <th style={{ width: "10em" }}>Bid</th>
                                <th style={{ width: "10em" }}>
                                    % of Remdal's Bid
                                </th>
                                <th style={{ width: "10em" }}>
                                    Successful Bidder
                                </th>
                            </tr>
                        )}
                    </thead>
                    <props.widgets.competitors
                        containerClass="tbody"
                        addButtonText="Add Competitor"
                    />
                </Table>
            </FormWrapper>
        </>
    );
}
