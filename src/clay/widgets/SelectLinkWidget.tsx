import { css } from "glamor";
import { find } from "lodash";
import * as React from "react";
import Select from "react-select";
import { Link } from "../link";
import { RecordMeta } from "../meta";
import { UUID } from "../uuid";
import { statusToState, Widget, WidgetStatus } from "../widgets";
import { SimpleAtomic } from "../widgets/simple-atomic";

export type SelectLinkWidgetAction<T> = {
    type: "SET";
    value: T | null;
};

type SelectLinkExtraProps<T> = {
    hideStatus?: boolean;
    records: T[];
    clearable?: boolean;
    include?: (item: T) => boolean;
};

type SelectLinkWidgetProps<T> = {
    state: null;
    data: Link<T>;
    dispatch: (action: SelectLinkWidgetAction<T>) => void;
    status: WidgetStatus;
} & SelectLinkExtraProps<T>;

const WIDGET_STYLE = css({
    zIndex: "2000",
    ".is-invalid  &div": {
        borderColor: "red",
        //backgroundPosition: "center right calc(0.375em + 0.7275rem)"
    },
});

export function selectStyle(invalid: boolean) {
    return {
        control: (provided: any) => ({
            ...provided,
            borderColor: invalid ? "#C71C22" : undefined,
        }),
        menuPortal: (provided: any) => ({
            ...provided,
            zIndex: 10,
        }),
        menu: (provided: any) => {
            return { ...provided, zIndex: 40 };
        },
        container: (provided: any) => ({
            ...provided,
            flexGrow: 1,
        }),
    };
}

export function SelectLinkWidget<
    DataType extends { id: UUID },
    JsonType,
    BrokenJsonType
>(options: {
    meta: RecordMeta<DataType, JsonType, BrokenJsonType>;
    label: (item: DataType) => string;
    include?: (item: DataType) => boolean;
}): Widget<
    null,
    Link<DataType>,
    {},
    SelectLinkWidgetAction<DataType>,
    SelectLinkExtraProps<DataType>
> {
    let include = options.include || (() => true);
    return {
        ...SimpleAtomic,
        dataMeta: {
            type: "string",
        },
        initialize(data: Link<DataType>) {
            return {
                state: null,
                data,
            };
        },
        component({
            data,
            dispatch,
            status,
            hideStatus,
            records,
            clearable,
            ...props
        }: SelectLinkWidgetProps<DataType>) {
            /*
                    isDisabled={!status.mutable}
                    onChange={(event: React.SyntheticEvent<{}>) =>
                        dispatch({
                            type: "SET",
                            value:
                                (event.target as any).value === ""
                                    ? null
                                    : (find(
                                        records,
                                        record =>
                                            record.id.uuid ==
                                            ((event.target as HTMLInputElement)
                                                .value as Link<DataType>)
                                    ) as DataType)
                        })
                    }
                    
                    
            */

            const getOptionLabel = React.useCallback(
                (option) => options.label(option.record),
                [options]
            );
            const getOptionValue = React.useCallback(
                (option) => option.record.id.uuid,
                []
            );
            const onChange = React.useCallback(
                (selected) => {
                    if (selected) {
                        dispatch({
                            type: "SET",
                            value: (selected as any).record as DataType,
                        });
                    } else {
                        dispatch({
                            type: "SET",
                            value: null,
                        });
                    }
                },
                [dispatch]
            );
            const selectOptions = React.useMemo(
                () =>
                    records
                        .filter(props.include ?? include)
                        .map((record) => ({ record })),
                [records, props.include, include]
            );
            const selected =
                find(records, (record) => record.id.uuid === data) || null;
            const value = React.useMemo(
                () => selected && { record: selected },
                [selected]
            );

            return (
                <Select
                    value={value}
                    getOptionLabel={getOptionLabel}
                    getOptionValue={getOptionValue}
                    isClearable={clearable}
                    isDisabled={!status.mutable}
                    styles={selectStyle(status.validation.length > 0)}
                    {...WIDGET_STYLE}
                    className={
                        hideStatus
                            ? ""
                            : statusToState(status.validation, data === null)
                    }
                    options={selectOptions}
                    onChange={onChange}
                    menuPlacement="auto"
                />
            );
        },
        reduce(
            state: null,
            data: Link<DataType>,
            action: SelectLinkWidgetAction<DataType>,
            context: {}
        ) {
            switch (action.type) {
                case "SET":
                    return {
                        state: null,
                        data: action.value ? action.value.id.uuid : null,
                        requests: [],
                    };
            }
        },
        validate(data: Link<DataType>) {
            if (data !== null) {
                return [];
            } else {
                return [
                    {
                        empty: true,
                        invalid: false,
                    },
                ];
            }
        },
    };
}
