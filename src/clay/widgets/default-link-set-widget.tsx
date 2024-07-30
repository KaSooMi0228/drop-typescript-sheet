import { css } from "glamor";
import * as React from "react";
import { Button } from "react-bootstrap";
import Select from "react-select";
import { Link } from "../link";
import { UUID } from "../uuid";
import { Widget, WidgetResult, WidgetStatus } from "./index";
import { selectStyle } from "./SelectLinkWidget";

type DefaultLinkSetWidgetState = {};

type DefaultLinkSetWidgetAction<T> = {
    type: "SET";
    value: Link<T>[];
};

type DefaultLinkSetWidgetMetaOptions<T> = {
    name: (record: T) => string;
};

type DefaultLinkSetWidgetProps<T> = {
    state: DefaultLinkSetWidgetState;
    data: Link<T>[] | null;
    dispatch: (action: DefaultLinkSetWidgetAction<T>) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    records?: T[];
    horizontal?: true;
    selectAll?: boolean;
    default: Link<T>[];
};

const PERMISSON_LABEL_STYLE = css({
    paddingLeft: ".25in",
    lineHeight: "28px",
    verticalAlign: "text-bottom",
});

const SELECT_CONTAINER = css({
    display: "flex",
    ">div:first-child": {
        flexGrow: 1,
    },
});

export function DefaultLinkSetWidget<T extends { id: UUID }>(
    options: DefaultLinkSetWidgetMetaOptions<T>
): Widget<
    DefaultLinkSetWidgetState,
    Link<T>[] | null,
    {},
    DefaultLinkSetWidgetAction<T>,
    {
        style?: React.CSSProperties;
        suggestions?: { id: Link<T>; name: string }[];
        records?: T[];
        horizontal?: true;
        selectAll?: boolean;
        default: Link<T>[];
    }
> {
    function initialize(
        data: Link<T>[] | null,
        context: {}
    ): WidgetResult<DefaultLinkSetWidgetState, Link<T>[] | null> {
        return {
            data,
            state: {},
        };
    }

    return {
        dataMeta: {
            type: "uuid",
        },
        initialize,
        component: (props: DefaultLinkSetWidgetProps<T>) => {
            const onChange = React.useCallback(
                (selections) => {
                    props.dispatch({
                        type: "SET",
                        value: selections
                            ? selections.map(
                                  (selection: { record: T }) =>
                                      selection.record.id.uuid
                              )
                            : [],
                    });
                },
                [props.dispatch]
            );

            let records = props.records || [];

            const selectOptions = React.useMemo(() => {
                if (!records) {
                    return [];
                } else {
                    return records.map((record) => ({ record }));
                }
            }, [records]);

            const onSelectAll = React.useCallback(
                () =>
                    props.dispatch({
                        type: "SET",
                        value: selectOptions.map(
                            (record) => record.record.id.uuid
                        ),
                    }),
                [props.dispatch, records]
            );

            let data = props.data === null ? props.default : props.data;

            return (
                <div {...SELECT_CONTAINER}>
                    <Select
                        isMulti
                        isDisabled={!props.status.mutable}
                        onChange={onChange}
                        value={selectOptions.filter(
                            (record) =>
                                data.indexOf(record.record.id.uuid) !== -1
                        )}
                        styles={selectStyle(props.status.validation.length > 0)}
                        options={selectOptions}
                        getOptionLabel={(area) => options.name(area.record)}
                        getOptionValue={(area) => {
                            return area.record.id.uuid;
                        }}
                        menuPlacement="auto"
                    />
                    {props.selectAll && props.status.mutable && (
                        <>
                            <div style={{ width: "1em" }} />
                            <Button onClick={onSelectAll}>Select All</Button>
                        </>
                    )}
                </div>
            );
        },
        reduce: (
            state: DefaultLinkSetWidgetState,
            data: Link<T>[] | null,
            action: DefaultLinkSetWidgetAction<T>,
            context: {}
        ): WidgetResult<DefaultLinkSetWidgetState, Link<T>[] | null> => {
            switch (action.type) {
                case "SET":
                    return {
                        state,
                        data: action.value,
                    };
            }
        },

        validate(data: Link<T>[] | null) {
            if (data !== null && data.length == 0) {
                return [
                    {
                        empty: true,
                        invalid: false,
                    },
                ];
            }
            return [];
        },
    };
}
