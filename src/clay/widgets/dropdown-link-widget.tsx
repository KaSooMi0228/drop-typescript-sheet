import natsort from "natsort";
import * as React from "react";
import { Link } from "../link";
import { RecordMeta } from "../meta";
import { useQuickAllRecords } from "../quick-cache";
import { UUID } from "../uuid";
import { Widget } from "../widgets";
import { SelectLinkWidget, SelectLinkWidgetAction } from "./SelectLinkWidget";

export function DropdownLinkWidget<
    DataType extends { id: UUID },
    JsonType,
    BrokenJsonType
>(options: {
    meta: RecordMeta<DataType, JsonType, BrokenJsonType>;
    label: (data: DataType) => string;
    include?: (data: DataType) => boolean;
    compare?: (lhs: DataType, rhs: DataType) => number;
}): Widget<
    null,
    Link<DataType>,
    {},
    SelectLinkWidgetAction<DataType>,
    {
        style?: React.CSSProperties;
        hideStatus?: boolean;
        include?: (data: DataType) => boolean;
        clearable?: boolean;
        nullText?: string;
    }
> {
    const Base = SelectLinkWidget(options);
    return {
        ...Base,
        component: (props) => {
            const records = useQuickAllRecordsSorted(
                options.meta,
                options.label,
                options.compare
            );
            return <Base.component {...props} records={records} />;
        },
    };
}

export const SORTER = natsort({
    insensitive: true,
});

export function useSorted<T>(
    records: T[],
    fn: (value: T) => string,
    compare?: (lhs: T, rhs: T) => number
) {
    return React.useMemo(() => {
        const result = [...records];
        if (compare) {
            result.sort(compare);
        } else {
            result.sort((x, y) => SORTER(fn(x), fn(y)));
        }
        return result;
    }, [records, fn, compare]);
}

const EMPTY_LIST: never[] = [];

export function useQuickAllRecordsSorted<DataType, JsonType, BrokenJsonType>(
    meta: RecordMeta<DataType, JsonType, BrokenJsonType>,
    label: (data: DataType) => string,
    compare?: (lhs: DataType, rhs: DataType) => number
) {
    return useSorted(
        useQuickAllRecords(meta) || (EMPTY_LIST as DataType[]),
        label,
        compare
    );
}
