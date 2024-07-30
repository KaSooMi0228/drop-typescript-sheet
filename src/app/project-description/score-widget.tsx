import Decimal from "decimal.js";
import { css } from "glamor";
import * as React from "react";
import Select from "react-select";
import { statusToState, Widget, WidgetStatus } from "../../clay/widgets";
import { selectStyle } from "../../clay/widgets/SelectLinkWidget";
import { SimpleAtomic } from "../../clay/widgets/simple-atomic";

const WIDGET_STYLE = css({
    ".is-valid": {
        backgroundPosition: "center right calc(0.375em + 0.7275rem)",
    },
});
export type ScoreWidgetAction = {
    type: "SET";
    value: Decimal | null;
};

type ScoreWidgetProps = {
    state: null;
    data: Decimal | null;
    dispatch: (action: ScoreWidgetAction) => void;
    status: WidgetStatus;
    hideStatus?: boolean;
};

const INVALID_STYLE = {
    control: (provided: any) => ({
        ...provided,
        borderColor: "#C71C22",
    }),
};

const OPTIONS = [
    new Decimal(15),
    new Decimal(14),
    new Decimal(13),
    new Decimal(12),
    new Decimal(11),
    new Decimal(10),
    new Decimal(9),
    new Decimal(8),
    new Decimal(7),
    new Decimal(6),
    new Decimal(5),
    new Decimal(4),
    new Decimal(3),
    new Decimal(2),
    new Decimal(1),
    new Decimal(0),
    null,
].map((option) => ({ option }));

export const ScoreWidget: Widget<
    null,
    Decimal | null,
    {},
    ScoreWidgetAction,
    {
        style?: React.CSSProperties;
        hideStatus?: boolean;
    }
> = {
    ...SimpleAtomic,
    dataMeta: {
        type: "quantity?" as const,
    },
    initialize(data: Decimal | null) {
        return {
            state: null,
            data,
        };
    },
    component(props: ScoreWidgetProps) {
        return (
            <div style={{ width: "7em" }}>
                <Select
                    {...WIDGET_STYLE}
                    isDisabled={!props.status.mutable}
                    value={{ option: props.data }}
                    onChange={(selected) => {
                        if (selected) {
                            props.dispatch({
                                type: "SET",
                                value: (selected as any).option,
                            });
                        }
                    }}
                    styles={selectStyle(props.status.validation.length > 0)}
                    className={
                        props.hideStatus
                            ? ""
                            : statusToState(
                                  props.status.validation,
                                  props.data === null
                              )
                    }
                    getOptionLabel={(option) =>
                        option.option === null
                            ? "N/A"
                            : option.option.toString()
                    }
                    getOptionValue={(option) =>
                        option.option === null
                            ? "N/A"
                            : option.option.toString()
                    }
                    options={OPTIONS}
                    menuPlacement="auto"
                />
            </div>
        );
    },
    reduce(
        state: null,
        data: Decimal | null,
        action: ScoreWidgetAction,
        context: {}
    ) {
        switch (action.type) {
            case "SET":
                return {
                    state: null,
                    data: action.value,
                    requests: [],
                };
        }
    },
    validate(data: Decimal | null) {
        return [];
    },
};
