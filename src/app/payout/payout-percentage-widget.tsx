import { Decimal } from "decimal.js";
import ReactSwitch from "react-switch";
import { Percentage } from "../../clay/common";
import { Widget, WidgetStatus } from "../../clay/widgets";
import { SimpleAtomic } from "../../clay/widgets/simple-atomic";
import { hasPermission } from "../../permissions";
import { useUser } from "../state";
import * as React from "react";

export type PayoutPercentageWidgetAction = {
    type: "SET";
    value: Percentage;
};

type PayoutPercentageWidgetExtraProps = {
    permission: string;
    value: Percentage;
};

type PayoutPercentageWidgetProps = {
    state: null;
    data: Percentage;
    dispatch: (action: PayoutPercentageWidgetAction) => void;
    status: WidgetStatus;
} & PayoutPercentageWidgetExtraProps;

export type PayoutPercentageWidgetType = Widget<
    null,
    Percentage,
    {},
    PayoutPercentageWidgetAction,
    PayoutPercentageWidgetExtraProps
>;

export const PayoutPercentageWidget: PayoutPercentageWidgetType = {
    ...SimpleAtomic,
    dataMeta: {
        type: "percentage",
    },
    initialize(data: Percentage) {
        return {
            state: null,
            data,
        };
    },
    component({
        data,
        dispatch,
        status,
        value,
        permission,
    }: PayoutPercentageWidgetProps) {
        const user = useUser();

        if (hasPermission(user, "Payout", permission)) {
            return (
                <div
                    style={{
                        display: "inline-block",
                        marginRight: ".5em",
                        verticalAlign: "middle",
                    }}
                >
                    <ReactSwitch
                        checked={!data.isZero()}
                        disabled={!status.mutable}
                        onChange={(event) =>
                            dispatch({
                                type: "SET",
                                value: event ? value : new Decimal(0),
                            })
                        }
                    />
                </div>
            );
        } else {
            return <></>;
        }
    },
    reduce(
        state: null,
        data: Percentage,
        action: PayoutPercentageWidgetAction,
        context: {}
    ) {
        switch (action.type) {
            case "SET":
                return {
                    state: null,
                    data: action.value,
                };
        }
    },
    validate() {
        return [];
    },
};
