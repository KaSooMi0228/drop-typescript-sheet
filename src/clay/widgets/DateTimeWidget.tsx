import { faKey } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import formatISO9075 from "date-fns/formatISO9075";
import { css } from "glamor";
import * as React from "react";
import { Alert, Button, FormControl } from "react-bootstrap";
import ReactModal from "react-modal";
import RelativePortal from "react-relative-portal";
import { LocalDate } from "../LocalDate";
import { statusToState, Widget, WidgetStatus } from "./index";
import { SimpleAtomic } from "./simple-atomic";

const DateTimePicker = require("react-datetime-picker");

export type DateWidgetAction = {
    type: "SET";
    value: Date | null;
};

type StaticDateTimeWidgetProps = {
    state: null;
    data: Date | null;
    dispatch: (action: DateWidgetAction) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    hideStatus?: boolean;
    todayButton?: boolean;
    allowOverride?: boolean;
};

export type StaticDateTimeWidget = {
    state: null;
    data: LocalDate | null;
    action: DateWidgetAction;
    context: {};
    props: {
        style?: React.CSSProperties;
        hideStatus?: boolean;
    };
};

const WIDGET_STYLE = css({
    "html & div.react-datetime-picker__wrapper": {
        border: "none",
    },
    maxWidth: "2in",
    display: "flex",
});

const MODAL_STYLE = {
    content: {
        maxHeight: "13em",
        maxWidth: "40em",
        top: "50%",
        left: "50%",
        right: "auto",
        bottom: "auto",
        marginRight: "-50%",
        transform: "translate(-50%,-50%)",
    },
};

export const StaticDateTimeWidget: Widget<
    null,
    Date | null,
    {},
    DateWidgetAction,
    {
        style?: React.CSSProperties;
        hideStatus?: boolean;
        todayButton?: boolean;
        allowOverride?: boolean;
    }
> = {
    ...SimpleAtomic,
    noGrow: true,
    dataMeta: {
        type: "date",
    },
    initialize(data: Date | null) {
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
        allowOverride,
    }: StaticDateTimeWidgetProps) {
        const [modalOpen, setModalOpen] = React.useState(false);
        const openModal = React.useCallback(() => {
            setModalOpen(true);
        }, [setModalOpen]);
        const closeModal = React.useCallback(() => {
            setModalOpen(false);
        }, [setModalOpen]);

        const [override, setOverride] = React.useState<Date | null | undefined>(
            undefined
        );
        const onIt = React.useCallback(
            (event) => {
                setOverride(event);
            },
            [setOverride, override]
        );

        const onDo = React.useCallback(() => {
            if (override !== undefined) {
                dispatch({
                    type: "SET",
                    value: override,
                });
            }
            setModalOpen(false);
        }, [override, dispatch, setModalOpen]);

        return (
            <div
                style={{
                    display: "flex",
                }}
            >
                <ReactModal
                    isOpen={modalOpen}
                    style={MODAL_STYLE}
                    onRequestClose={closeModal}
                >
                    <Alert variant="danger">
                        You are overriding an automatic timestamp. You should
                        not ordinarily do this.
                    </Alert>
                    <RelativePortal className="relative-portal">
                        <DateTimePicker.default
                            value={override === undefined ? data : override}
                            calendarType="US"
                            onChange={onIt}
                        />
                    </RelativePortal>
                    <div
                        style={{
                            display: "flex",
                            marginTop: "4em",
                            justifyContent: "space-between",
                        }}
                    >
                        <Button variant="danger" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={onDo}>
                            Override
                        </Button>
                    </div>
                </ReactModal>
                <FormControl
                    type="text"
                    disabled={true}
                    style={{ width: "2in" }}
                    value={data ? formatISO9075(data) : ""}
                />
                {allowOverride && (
                    <Button onClick={openModal}>
                        <FontAwesomeIcon icon={faKey} />
                    </Button>
                )}
            </div>
        );
    },
    reduce(
        state: null,
        data: Date | null,
        action: DateWidgetAction,
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
    validate(data: Date | null) {
        return [];
    },
};

export const DateTimeWidget: Widget<
    null,
    Date | null,
    {},
    DateWidgetAction,
    {
        style?: React.CSSProperties;
        hideStatus?: boolean;
        todayButton?: boolean;
        allowOverride?: boolean;
    }
> = {
    ...SimpleAtomic,
    noGrow: true,
    dataMeta: {
        type: "date",
    },
    initialize(data: Date | null) {
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
        allowOverride,
    }: StaticDateTimeWidgetProps) {
        const onIt = React.useCallback(
            (event) => {
                dispatch({
                    type: "SET",
                    value: event,
                });
            },
            [dispatch]
        );

        return (
            <div
                className={
                    "datepicker " +
                    statusToState(status.validation, data === null)
                }
                style={{
                    width: "17em",
                }}
            >
                <DateTimePicker.default
                    value={data}
                    calendarType="US"
                    onChange={onIt}
                    disabled={!status.mutable}
                />
            </div>
        );
    },
    reduce(
        state: null,
        data: Date | null,
        action: DateWidgetAction,
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
    validate(data: Date | null) {
        return [];
    },
};
