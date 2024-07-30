import * as React from "react";
import { Badge, Button, ModalBody, ModalTitle, Table } from "react-bootstrap";
import Modal from "react-modal";
import { useProjectRecordQuery } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { Link } from "../../clay/link";
import { LocalDate, longDate } from "../../clay/LocalDate";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickCache } from "../../clay/quick-cache";
import { DateWidget } from "../../clay/widgets/DateWidget";
import { FormWrapper, Optional } from "../../clay/widgets/FormField";
import {
    RecordContext,
    RecordWidget,
    subStatus,
    subvalidate,
    ValidationError,
    Widget,
    WidgetAction,
    WidgetContext,
    WidgetExtraProps,
    WidgetProps,
    WidgetResult,
    WidgetState,
    WidgetStatus,
} from "../../clay/widgets/index";
import { ListWidget } from "../../clay/widgets/ListWidget";
import { TextAreaWidget } from "../../clay/widgets/TextAreaWidget";
import { useLocalFieldWidget } from "../inbox/useLocalWidget";
import ModalHeader from "../ModalHeader";
import { useUser } from "../state";
import UserAndDateWidget from "../user-and-date/UserAndDateWidget.widget";
import { ROLE_CERTIFIED_FOREMAN, User, USER_META } from "../user/table";
import { DETAIL_SHEET_META } from "./detail-sheet/table";
import PauseWidget from "./PauseWidget.widget";
import { Project, PROJECT_META } from "./table";

export type Data = Project;

function actionPauseProject(
    state: State,
    data: Data,
    reason: string,
    date: LocalDate,
    user: Link<User>
) {
    const inner = PauseWidget.initialize(
        {
            reason,
            date,
            user,
            addedDateTime: new Date(),
            confirmed: {
                user: null,
                date: null,
            },
        },
        {}
    );

    return {
        state: {
            ...state,
            pauses: {
                ...state.pauses,
                items: [...state.pauses.items, inner.state],
            },
        },
        data: {
            ...data,
            pauses: [...data.pauses, inner.data],
        } satisfies Project,
    };
}

function PauseProjectModal(props: {
    close: () => void;
    dispatch: (action: Action) => void;
}) {
    const date = useLocalFieldWidget(DateWidget, null, {});
    const reason = useLocalFieldWidget(TextAreaWidget, "", {});
    const user = useUser();

    const pauseProject = React.useCallback(() => {
        props.dispatch({
            type: "PAUSE_PROJECT",
            reason: reason.data,
            date: date.data!,
            user: user.id,
        });
        props.close();
    }, [date.data, reason.data, user.id, props.dispatch, props.close]);
    return (
        <Modal isOpen={true} onRequestClose={props.close}>
            <ModalHeader>
                <ModalTitle>Pause Project</ModalTitle>
            </ModalHeader>
            <ModalBody>
                <FormWrapper label="Reason for pausing this project">
                    {reason.component}
                </FormWrapper>
                <FormWrapper label="Project on hold until">
                    {date.component}
                </FormWrapper>
                <Button
                    onClick={pauseProject}
                    disabled={reason.data == "" || date.data === null}
                >
                    Pause Project
                </Button>
            </ModalBody>
        </Modal>
    );
}

export const Fields = {
    projectStartDate: Optional(DateWidget),
    projectStartDateConfirmed: Optional(UserAndDateWidget),
    pauses: ListWidget(PauseWidget, { emptyOk: true }),
};

function Component(props: Props) {
    const cache = useQuickCache();
    const detailSheets =
        useProjectRecordQuery(DETAIL_SHEET_META, props.data.id.uuid) || [];
    const entries = [];

    const user = useUser();
    const [isPausingProject, setPausingProject] = React.useState(false);

    const cancelConfirmProjectStartDate = React.useCallback(() => {
        props.dispatch({
            type: "PROJECT_START_DATE_CONFIRMED",
            action: {
                type: "DEACTIVATE",
            },
        });
    }, [props.dispatch, user.id]);

    const confirmProjectResume = React.useCallback(() => {
        props.dispatch({
            type: "PAUSES",
            action: {
                type: "ITEM",
                index: props.data.pauses.length - 1,
                action: {
                    type: "CONFIRMED",
                    action: {
                        type: "ACTIVATE",
                        user: user.id,
                    },
                },
            },
        });
    }, [props.data.pauses.length - 1, user.id]);

    const cancelConfirmProjectResume = React.useCallback(() => {
        props.dispatch({
            type: "PAUSES",
            action: {
                type: "ITEM",
                index: props.data.pauses.length - 1,
                action: {
                    type: "CONFIRMED",
                    action: {
                        type: "DEACTIVATE",
                    },
                },
            },
        });
    }, [props.data.pauses.length - 1, user.id]);

    const resumeProject = React.useCallback(() => {
        props.dispatch({
            type: "PAUSES",
            action: {
                type: "ITEM",
                index: props.data.pauses.length - 1,
                action: {
                    type: "DATE",
                    action: {
                        type: "SET",
                        value: new LocalDate(new Date()),
                    },
                },
            },
        });
        props.dispatch({
            type: "PAUSES",
            action: {
                type: "ITEM",
                index: props.data.pauses.length - 1,
                action: {
                    type: "CONFIRMED",
                    action: {
                        type: "ACTIVATE",
                        user: user.id,
                    },
                },
            },
        });
    }, [props.data.pauses.length, user.id]);

    const isPaused =
        props.data.pauses.length !== 0 &&
        props.data.pauses[props.data.pauses.length - 1].date!.asDate() >
            new Date();

    for (const entry of props.data.personnel) {
        if (entry.role === ROLE_CERTIFIED_FOREMAN) {
            entries.push({
                date: entry.assignedDate || props.data.quoteRequestDate,
                component: (
                    <tr key={entry.role + "-" + entry.user}>
                        <th>CF Assigned</th>
                        <td>
                            {cache.get(USER_META, entry.user)?.code}{" "}
                            {cache.get(USER_META, entry.user)?.name}
                        </td>
                        <td>{longDate(entry.assignedDate)}</td>
                    </tr>
                ),
            });
        }
    }

    for (const detailSheet of detailSheets) {
        entries.push({
            date: detailSheet.date,
            component: (
                <tr key={detailSheet.id.uuid}>
                    <th>Detail Sheet Generated</th>
                    <td>{cache.get(USER_META, detailSheet.user)?.name}</td>
                    <td>{longDate(detailSheet.date)}</td>
                </tr>
            ),
        });
    }

    if (props.data.projectAwardDate != null) {
        entries.push({
            date: props.data.projectAwardDate,
            component: (
                <tr key="awarded">
                    <th>Project Awarded</th>
                    <td></td>
                    <td>{longDate(props.data.projectAwardDate)}</td>
                </tr>
            ),
        });
    }
    if (props.data.contractDetailsDate != null) {
        entries.push({
            date: props.data.contractDetailsDate,
            component: (
                <tr key="contract-details">
                    <th>Contract Details Set</th>
                    <td></td>
                    <td>{longDate(props.data.contractDetailsDate)}</td>
                </tr>
            ),
        });
    }
    let index = 0;
    for (const pause of props.data.pauses) {
        entries.push({
            date: pause.addedDateTime,
            component: (
                <tr key={"pause-start-" + index}>
                    <th>Project Paused</th>
                    <td>{cache.get(USER_META, pause.user)?.name}</td>
                    <td>{longDate(pause.addedDateTime)}</td>
                    <td></td>
                    <td>{pause.reason}</td>
                    <td>
                        <Button
                            variant="danger"
                            onClick={() => {
                                props.dispatch({
                                    type: "PAUSES",
                                    action: {
                                        type: "REMOVE",
                                        index,
                                    },
                                });
                            }}
                        >
                            Cancel
                        </Button>
                    </td>
                </tr>
            ),
        });
        entries.push({
            date: pause.addedDateTime,
            component: (
                <tr key={"pause-stop-" + index}>
                    <th>Project Resumed</th>
                    <td>{cache.get(USER_META, pause.confirmed.user)?.name}</td>
                    <td>{longDate(pause.date!.asDate())}</td>
                    <td>
                        {pause.confirmed.user === null ? (
                            <Badge variant="danger">Unconfirmed</Badge>
                        ) : (
                            <Badge variant="success">Confirmed</Badge>
                        )}
                    </td>
                    <td />
                    <td>
                        {pause.confirmed.user !== null ? (
                            <Button
                                variant="danger"
                                onClick={cancelConfirmProjectResume}
                            >
                                Cancel
                            </Button>
                        ) : (
                            <Button onClick={confirmProjectResume}>
                                Confirm
                            </Button>
                        )}
                    </td>
                </tr>
            ),
        });
    }

    entries.push({
        date: props.data.projectStartDate?.asDate() || null,
        component: (
            <tr key="start-date">
                <th>Project Start Date</th>
                <td></td>
                <td>
                    <widgets.projectStartDate />
                </td>
                <td>
                    {props.data.projectStartDateConfirmed.user === null ? (
                        <Badge variant="danger">Unconfirmed</Badge>
                    ) : (
                        <Badge variant="success">Confirmed</Badge>
                    )}
                </td>
            </tr>
        ),
    });

    if (props.data.projectStartDateConfirmed.user !== null) {
        entries.push({
            date: props.data.projectStartDateConfirmed.date,
            component: (
                <tr key="start-date-confirmed">
                    <th>Project Start Date Confirmed</th>
                    <td>
                        {
                            cache.get(
                                USER_META,
                                props.data.projectStartDateConfirmed.user
                            )?.name
                        }
                    </td>
                    <td>
                        {longDate(props.data.projectStartDateConfirmed.date)}
                    </td>
                    <td />
                    <td />
                    <td>
                        <Button
                            variant="danger"
                            onClick={cancelConfirmProjectStartDate}
                        >
                            Cancel
                        </Button>
                    </td>
                </tr>
            ),
        });
    }

    entries.sort((x, y) => {
        if (x.date == null) {
            return -1;
        } else if (y.date == null) {
            return 1;
        } else if (x.date < y.date) {
            return -1;
        } else if (x.date > y.date) {
            return 1;
        } else {
            return 0;
        }
    });

    const confirmProjectStartDate = React.useCallback(() => {
        props.dispatch({
            type: "PROJECT_START_DATE_CONFIRMED",
            action: {
                type: "ACTIVATE",
                user: user.id,
            },
        });
    }, [props.dispatch, user.id]);

    return (
        <>
            <Table style={{ width: "fit-content" }}>
                <tbody>{entries.map((entry) => entry.component)}</tbody>
            </Table>
            <div className="space-buttons">
                {props.data.projectStartDateConfirmed.user === null &&
                    props.data.projectStartDate !== null && (
                        <Button onClick={confirmProjectStartDate}>
                            Confirm Project Start Date
                        </Button>
                    )}

                {props.data.projectStartDateConfirmed.user !== null &&
                    !isPaused && (
                        <Button onClick={() => setPausingProject(true)}>
                            Pause Project
                        </Button>
                    )}
                {isPaused && (
                    <Button variant="success" onClick={resumeProject}>
                        Resume Project
                    </Button>
                )}
            </div>
            {isPausingProject && (
                <PauseProjectModal
                    close={() => setPausingProject(false)}
                    dispatch={props.dispatch}
                />
            )}
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.projectStartDate> &
    WidgetContext<typeof Fields.projectStartDateConfirmed> &
    WidgetContext<typeof Fields.pauses>;
type ExtraProps = {};
type BaseState = {
    projectStartDate: WidgetState<typeof Fields.projectStartDate>;
    projectStartDateConfirmed: WidgetState<
        typeof Fields.projectStartDateConfirmed
    >;
    pauses: WidgetState<typeof Fields.pauses>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "PROJECT_START_DATE";
          action: WidgetAction<typeof Fields.projectStartDate>;
      }
    | {
          type: "PROJECT_START_DATE_CONFIRMED";
          action: WidgetAction<typeof Fields.projectStartDateConfirmed>;
      }
    | { type: "PAUSES"; action: WidgetAction<typeof Fields.pauses> }
    | {
          type: "PAUSE_PROJECT";
          reason: string;
          date: LocalDate;
          user: Link<User>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.projectStartDate,
        data.projectStartDate,
        cache,
        "projectStartDate",
        errors
    );
    subvalidate(
        Fields.projectStartDateConfirmed,
        data.projectStartDateConfirmed,
        cache,
        "projectStartDateConfirmed",
        errors
    );
    subvalidate(Fields.pauses, data.pauses, cache, "pauses", errors);
    return errors;
}
function baseReduce(
    state: State,
    data: Data,
    action: BaseAction,
    context: Context
): WidgetResult<State, Data> {
    let subcontext = context;
    switch (action.type) {
        case "PROJECT_START_DATE": {
            const inner = Fields.projectStartDate.reduce(
                state.projectStartDate,
                data.projectStartDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectStartDate: inner.state },
                data: { ...data, projectStartDate: inner.data },
            };
        }
        case "PROJECT_START_DATE_CONFIRMED": {
            const inner = Fields.projectStartDateConfirmed.reduce(
                state.projectStartDateConfirmed,
                data.projectStartDateConfirmed,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectStartDateConfirmed: inner.state },
                data: { ...data, projectStartDateConfirmed: inner.data },
            };
        }
        case "PAUSES": {
            const inner = Fields.pauses.reduce(
                state.pauses,
                data.pauses,
                action.action,
                subcontext
            );
            return {
                state: { ...state, pauses: inner.state },
                data: { ...data, pauses: inner.data },
            };
        }
        case "PAUSE_PROJECT":
            return actionPauseProject(
                state,
                data,
                action.reason,
                action.date,
                action.user
            );
    }
}
export type ReactContextType = {
    state: State;
    data: Data;
    dispatch: (action: Action) => void;
    status: WidgetStatus;
};
export const ReactContext = React.createContext<ReactContextType | undefined>(
    undefined
);
export const widgets: Widgets = {
    projectStartDate: function (
        props: WidgetExtraProps<typeof Fields.projectStartDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_START_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "projectStartDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectStartDate.component
                state={context.state.projectStartDate}
                data={context.data.projectStartDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Start Date"}
            />
        );
    },
    projectStartDateConfirmed: function (
        props: WidgetExtraProps<typeof Fields.projectStartDateConfirmed> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_START_DATE_CONFIRMED",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "projectStartDateConfirmed",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectStartDateConfirmed.component
                state={context.state.projectStartDateConfirmed}
                data={context.data.projectStartDateConfirmed}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Start Date Confirmed"}
            />
        );
    },
    pauses: function (
        props: WidgetExtraProps<typeof Fields.pauses> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PAUSES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "pauses", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.pauses.component
                state={context.state.pauses}
                data={context.data.pauses}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Pauses"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: PROJECT_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let projectStartDateState;
        {
            const inner = Fields.projectStartDate.initialize(
                data.projectStartDate,
                subcontext,
                subparameters.projectStartDate
            );
            projectStartDateState = inner.state;
            data = { ...data, projectStartDate: inner.data };
        }
        let projectStartDateConfirmedState;
        {
            const inner = Fields.projectStartDateConfirmed.initialize(
                data.projectStartDateConfirmed,
                subcontext,
                subparameters.projectStartDateConfirmed
            );
            projectStartDateConfirmedState = inner.state;
            data = { ...data, projectStartDateConfirmed: inner.data };
        }
        let pausesState;
        {
            const inner = Fields.pauses.initialize(
                data.pauses,
                subcontext,
                subparameters.pauses
            );
            pausesState = inner.state;
            data = { ...data, pauses: inner.data };
        }
        let state = {
            initialParameters: parameters,
            projectStartDate: projectStartDateState,
            projectStartDateConfirmed: projectStartDateConfirmedState,
            pauses: pausesState,
        };
        return {
            state,
            data,
        };
    },
    validate: baseValidate,
    component: React.memo((props: Props) => {
        return (
            <ReactContext.Provider value={props}>
                <RecordContext meta={PROJECT_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    projectStartDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectStartDate>
    >;
    projectStartDateConfirmed: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectStartDateConfirmed>
    >;
    pauses: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.pauses>
    >;
};
// END MAGIC -- DO NOT EDIT
