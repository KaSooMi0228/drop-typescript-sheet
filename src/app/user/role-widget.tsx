import { css } from "glamor";
import * as React from "react";
import { ListGroup, ListGroupItem } from "react-bootstrap";
import ReactSwitch from "react-switch";
import { useQuery } from "../../clay/api";
import { Link } from "../../clay/link";
import { Widget, WidgetStatus } from "../../clay/widgets";
import { Role } from "../roles/table";
import { CONTENT_AREA } from "../styles";

export type RolesWidgetAction = {
    type: "TOGGLE";
    value: Link<Role>;
};

type RolesWidgetProps = {
    state: null;
    data: Link<Role>[];
    dispatch: (action: RolesWidgetAction) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    hideStatus?: boolean;
};

export type RolesWidgetType = Widget<
    null,
    Link<Role>[],
    {},
    RolesWidgetAction,
    {
        style?: React.CSSProperties;
    }
>;

const PERMISSON_LABEL_STYLE = css({
    paddingLeft: ".25in",
    lineHeight: "28px",
    verticalAlign: "text-bottom",
});

export const RolesWidget: RolesWidgetType = {
    dataMeta: {
        type: "array",
        items: {
            type: "uuid",
        },
    },
    initialize(data: Link<Role>[]) {
        return {
            state: null,
            data,
        };
    },
    component({ data, dispatch, status, style, hideStatus }: RolesWidgetProps) {
        const roles =
            (useQuery(
                {
                    tableName: "Role",
                    columns: ["id", "name"],
                    sorts: ["name"],
                },
                []
            ) as any) || [];

        return (
            <ListGroup {...CONTENT_AREA}>
                {roles.map(([id, name]: [string, string]) => (
                    <ListGroupItem key={id}>
                        <ReactSwitch
                            checked={data.indexOf(id) !== -1}
                            onChange={() =>
                                dispatch({
                                    type: "TOGGLE",
                                    value: id,
                                })
                            }
                        />
                        <span {...PERMISSON_LABEL_STYLE}>{name}</span>
                    </ListGroupItem>
                ))}
            </ListGroup>
        );
    },
    reduce(
        state: null,
        data: Link<Role>[],
        action: RolesWidgetAction,
        context: {}
    ) {
        switch (action.type) {
            case "TOGGLE":
                if (data.indexOf(action.value) === -1) {
                    return {
                        state: null,
                        data: [...data, action.value],
                        requests: [],
                    };
                } else {
                    return {
                        state: null,
                        data: data.filter((value) => value !== action.value),
                        requests: [],
                    };
                }
        }
    },
    validate() {
        return [];
    },
};
