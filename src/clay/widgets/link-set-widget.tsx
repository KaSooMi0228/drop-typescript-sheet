import { css } from "glamor";
import * as React from "react";
import { Button } from "react-bootstrap";
import Select from "react-select";
import { Link } from "../link";
import { RecordMeta } from "../meta";
import { useQuickCache } from "../quick-cache";
import { UUID } from "../uuid";
import { Widget, WidgetResult, WidgetStatus } from "./index";
import { selectStyle } from "./SelectLinkWidget";

type LinkSetWidgetState = {};

type LinkSetWidgetAction<T> = {
    type: "SET";
    value: Link<T>[];
};

type LinkSetWidgetMetaOptions<T> = {
    meta: RecordMeta<T, any, any>;
    name: (record: T) => string;
    filter?: (record: T) => boolean;
};

type LinkSetWidgetProps<T> = {
    state: LinkSetWidgetState;
    data: Link<T>[];
    dispatch: (action: LinkSetWidgetAction<T>) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    records?: T[];
    horizontal?: true;
    selectAll?: boolean;
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

export function LinkSetWidget<T extends { id: UUID }>(
    options: LinkSetWidgetMetaOptions<T>
): Widget<
    LinkSetWidgetState,
    Link<T>[],
    {},
    LinkSetWidgetAction<T>,
    {
        style?: React.CSSProperties;
        suggestions?: { id: Link<T>; name: string }[];
        records?: T[];
        horizontal?: true;
        selectAll?: boolean;
    }
> {
    function initialize(
        data: Link<T>[],
        context: {}
    ): WidgetResult<LinkSetWidgetState, Link<T>[]> {
        return {
            data,
            state: {},
        };
    }

    return {
        dataMeta: {
            type: "uuid",
            linkTo: options.meta.name,
        },
        initialize,
        component: (props: LinkSetWidgetProps<T>) => {
            const cache = useQuickCache();
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

            let records = props.records;
            if (props.records === undefined) {
                const rawRecords = cache.getAll(options.meta) || [];
                records = React.useMemo(() => {
                    const result = rawRecords.filter((x) =>
                        options.filter
                            ? options.filter(x) ||
                              props.data.indexOf(x.id.uuid) !== -1
                            : true
                    );
                    result.sort((a, b) =>
                        options.name(a).localeCompare(options.name(b))
                    );
                    return result;
                }, [rawRecords]);
            }

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

            return (
                <div {...SELECT_CONTAINER}>
                    <Select
                        isMulti
                        isDisabled={!props.status.mutable}
                        onChange={onChange}
                        value={selectOptions.filter(
                            (record) =>
                                props.data.indexOf(record.record.id.uuid) !== -1
                        )}
                        styles={selectStyle(props.status.validation.length > 0)}
                        options={selectOptions}
                        getOptionLabel={(area) => options.name(area.record)}
                        getOptionValue={(area) => area.record.id.uuid}
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
            state: LinkSetWidgetState,
            data: Link<T>[],
            action: LinkSetWidgetAction<T>,
            context: {}
        ): WidgetResult<LinkSetWidgetState, Link<T>[]> => {
            switch (action.type) {
                case "SET":
                    return {
                        state,
                        data: action.value,
                    };
            }
        },

        validate(data: Link<T>[]) {
            if (data.length == 0) {
                return [
                    {
                        invalid: false,
                        empty: true,
                    },
                ];
            } else {
                return [];
            }
        },
    };
}
