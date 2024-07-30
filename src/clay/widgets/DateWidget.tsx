import { css } from "glamor";
import * as React from "react";
import { Button, FormControl } from "react-bootstrap";
import DatePicker from "react-date-picker";
import ReactDOM from "react-dom";
import { LocalDate } from "../LocalDate";
import { statusToState, Widget, WidgetStatus } from "./index";
import { SimpleAtomic } from "./simple-atomic";

class AdjustedDatePicker extends (DatePicker as any) {
    componentDidUpdate(prevProps: any, nextProps: any) {
        super.componentDidUpdate(prevProps, nextProps);
        const root = ReactDOM.findDOMNode(this as any) as Element;

        const buttons = root.querySelectorAll("button:not(tabIndex)");
        buttons.forEach((button) => {
            (button as any).tabIndex = -1;
        });
    }
}

export type DateWidgetAction = {
    type: "SET";
    value: LocalDate | null;
};

type DateWidgetProps = {
    state: null;
    data: LocalDate | null;
    dispatch: (action: DateWidgetAction) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    hideStatus?: boolean;
    todayButton?: boolean;
    fallback?: LocalDate | null;
};

export type DateWidget = {
    state: null;
    data: LocalDate | null;
    action: DateWidgetAction;
    context: {};
    props: {
        style?: React.CSSProperties;
        hideStatus?: boolean;
        todayButton?: boolean;
        fallback?: LocalDate | null;
    };
};

const WIDGET_STYLE = css({
    "html & div.react-date-picker__wrapper": {
        border: "none",
    },
    maxWidth: "2in",
    display: "flex",
});

export const DateWidget: Widget<
    null,
    LocalDate | null,
    {},
    DateWidgetAction,
    {
        style?: React.CSSProperties;
        hideStatus?: boolean;
        todayButton?: boolean;
        fallback?: LocalDate | null;
    }
> = {
    ...SimpleAtomic,
    noGrow: true,
    dataMeta: {
        type: "date",
    },
    initialize(data: LocalDate | null) {
        return {
            state: null,
            data,
        };
    },
    component({
        data,
        dispatch,
        status,
        style,
        hideStatus,
        todayButton = false,
        fallback,
    }: DateWidgetProps) {
        return (
            <div {...WIDGET_STYLE} tabIndex={-1}>
                <FormControl
                    as={AdjustedDatePicker as any}
                    calendarType="US"
                    disabled={!status.mutable}
                    className={
                        hideStatus
                            ? ""
                            : statusToState(status.validation, data == null)
                    }
                    value={
                        data || fallback
                            ? ((data || fallback)!.asDate() as any)
                            : null
                    }
                    onChange={(date: any) =>
                        dispatch({
                            type: "SET",
                            value: date ? new LocalDate(date) : null,
                        })
                    }
                    format="yyyy-M-d"
                />
                {data === null && todayButton && (
                    <Button
                        style={{ display: "inline-block" }}
                        onClick={() =>
                            dispatch({
                                type: "SET",
                                value: new LocalDate(new Date()),
                            })
                        }
                    >
                        Today
                    </Button>
                )}
            </div>
        );
    },
    reduce(
        state: null,
        data: LocalDate | null,
        action: DateWidgetAction,
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
    validate(data: LocalDate | null) {
        if (data !== null) {
            return [];
        } else {
            return [
                {
                    invalid: false,
                    empty: true,
                },
            ];
        }
    },
};
