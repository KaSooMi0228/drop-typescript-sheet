import { css } from "glamor";
import React from "react";
import Select from "react-select";
import { patchRecord } from "../../clay/api";
import { Link } from "../../clay/link";
import { useQuickAllRecords } from "../../clay/quick-cache";
import { WidgetStatus } from "../../clay/widgets";
import { SORTER } from "../../clay/widgets/dropdown-link-widget";
import { selectStyle } from "../../clay/widgets/SelectLinkWidget";
import { User, USER_META } from "../user/table";
import { Role } from "./table";

const SELECT_CONTAINER = css({
    display: "flex",
    ">div:first-child": {
        flexGrow: 1,
    },
});

type Props = {
    status: WidgetStatus;
    role: Link<Role>;
};

export default function (props: Props) {
    const [records, setRecords] = React.useState<User[]>([]);
    const records_ = useQuickAllRecords(USER_META);

    React.useEffect(() => {
        if (records_) {
            const records = records_.slice();
            records.sort((x, y) => SORTER(x.name, y.name));
            setRecords(records_);
        }
    }, [records_, setRecords]);

    const onChange = React.useCallback(
        (selections) => {
            const selected_ids = selections.map((x: any) => x.record.id.uuid);
            for (const record of records) {
                const has_role = record.roles.indexOf(props.role) !== -1;
                const should_have_role =
                    selected_ids.indexOf(record.id.uuid) !== -1;

                if (has_role && !should_have_role) {
                    const roleIndex = record.roles.indexOf(props.role);
                    patchRecord(USER_META, "roles", record.id.uuid, {
                        roles: {
                            _t: "a",
                            ["_" + roleIndex]: [props.role, -1, 0],
                        },
                    });
                } else if (!has_role && should_have_role) {
                    patchRecord(USER_META, "roles", record.id.uuid, {
                        roles: {
                            _t: "a",
                            append: props.role,
                        },
                    });
                }
            }
        },
        [records, props.role]
    );

    const selectOptions = React.useMemo(() => {
        if (!records) {
            return [];
        } else {
            return records.map((record) => ({ record }));
        }
    }, [records]);

    return (
        <div {...SELECT_CONTAINER}>
            <Select
                isMulti
                isDisabled={!props.status.mutable}
                onChange={onChange}
                value={selectOptions.filter(
                    (record) => record.record.roles.indexOf(props.role) !== -1
                )}
                styles={selectStyle(props.status.validation.length > 0)}
                options={selectOptions}
                getOptionLabel={(area) => area.record.name}
                getOptionValue={(area) => area.record.id.uuid}
                menuPlacement="auto"
            />
        </div>
    );
}
