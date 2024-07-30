import * as React from "react";
import { Table } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { longDate } from "../../clay/LocalDate";
import { propCheck } from "../../clay/propCheck";
import {
    QuickCacheApi,
    useQuickCache,
    useQuickRecord,
} from "../../clay/quick-cache";
import { SaveButton } from "../../clay/save-button";
import { DateTimeWidget } from "../../clay/widgets/DateTimeWidget";
import { Optional } from "../../clay/widgets/FormField";
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
import { ContactsWidget } from "../contact/ContactsWidget";
import {
    ROLE_CERTIFIED_FOREMAN,
    ROLE_PROJECT_MANAGER,
    ROLE_WARRANTY_REVIEWER,
    USER_META,
} from "../user/table";
import { WarrantyReview, WARRANTY_REVIEW_META } from "./table";

type Data = WarrantyReview;

const Fields = {
    ownersRepresentatives: Optional(ContactsWidget),
    completionDate: Optional(DateTimeWidget),
};

function Component(props: Props) {
    const setCompletionDate = React.useCallback(
        () =>
            props.dispatch({
                type: "COMPLETION_DATE",
                action: {
                    type: "SET",
                    value: new Date(),
                },
            }),
        [props.dispatch]
    );
    const cache = useQuickCache();
    const entries = [];

    const warrantyReviewerEntry = props.data.personnel.find(
        (entry) => entry.role === ROLE_WARRANTY_REVIEWER
    );
    const warrantyReviewer = useQuickRecord(
        USER_META,
        warrantyReviewerEntry?.user || null
    );

    if (props.data.reviewDate) {
        entries.push({
            date: props.data.reviewDate,
            component: (
                <tr key="review-date">
                    <th>Warranty Review Was Completed</th>
                    <th>{warrantyReviewer?.name}</th>
                    <th>{longDate(props.data.reviewDate)}</th>
                </tr>
            ),
        });
    }

    if (props.data.remediationWorkDueDate) {
        entries.push({
            date: props.data.remediationWorkDueDate,
            component: (
                <tr key="review-date">
                    <th>Remediation Work Due</th>
                    <th></th>
                    <th>
                        {longDate(props.data.remediationWorkDueDate.asDate())}
                    </th>
                </tr>
            ),
        });
    }

    if (props.data.completionDate) {
        entries.push({
            date: props.data.completionDate,
            component: (
                <tr key="review-date">
                    <th>Certified as Complete</th>
                    <th></th>
                    <th>{longDate(props.data.completionDate)}</th>
                </tr>
            ),
        });
    }

    for (const entry of props.data.personnel) {
        switch (entry.role) {
            case ROLE_PROJECT_MANAGER:
                entries.push({
                    date: entry.assignedDate,
                    component: (
                        <tr key="review-date">
                            <th>Project Manager Assigned</th>
                            <th>{cache.get(USER_META, entry.user)?.name}</th>
                            <th>{longDate(entry.assignedDate)}</th>
                        </tr>
                    ),
                });
                break;
            case ROLE_CERTIFIED_FOREMAN:
                entries.push({
                    date: entry.assignedDate,
                    component: (
                        <tr key="review-date">
                            <th>Certified Foreman Assigned</th>
                            <th>{cache.get(USER_META, entry.user)?.name}</th>
                            <th>{longDate(entry.assignedDate)}</th>
                        </tr>
                    ),
                });
                break;
        }
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

    return (
        <>
            <Table>
                <tbody>{entries.map((entry) => entry.component)}</tbody>
            </Table>

            <SaveButton
                label="Certify Completion"
                preSave={setCompletionDate}
            />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.ownersRepresentatives> &
    WidgetContext<typeof Fields.completionDate>;
type ExtraProps = {};
type BaseState = {
    ownersRepresentatives: WidgetState<typeof Fields.ownersRepresentatives>;
    completionDate: WidgetState<typeof Fields.completionDate>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "OWNERS_REPRESENTATIVES";
          action: WidgetAction<typeof Fields.ownersRepresentatives>;
      }
    | {
          type: "COMPLETION_DATE";
          action: WidgetAction<typeof Fields.completionDate>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.ownersRepresentatives,
        data.ownersRepresentatives,
        cache,
        "ownersRepresentatives",
        errors
    );
    subvalidate(
        Fields.completionDate,
        data.completionDate,
        cache,
        "completionDate",
        errors
    );
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
        case "OWNERS_REPRESENTATIVES": {
            const inner = Fields.ownersRepresentatives.reduce(
                state.ownersRepresentatives,
                data.ownersRepresentatives,
                action.action,
                subcontext
            );
            return {
                state: { ...state, ownersRepresentatives: inner.state },
                data: { ...data, ownersRepresentatives: inner.data },
            };
        }
        case "COMPLETION_DATE": {
            const inner = Fields.completionDate.reduce(
                state.completionDate,
                data.completionDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, completionDate: inner.state },
                data: { ...data, completionDate: inner.data },
            };
        }
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
    ownersRepresentatives: function (
        props: WidgetExtraProps<typeof Fields.ownersRepresentatives> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "OWNERS_REPRESENTATIVES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "ownersRepresentatives",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.ownersRepresentatives.component
                state={context.state.ownersRepresentatives}
                data={context.data.ownersRepresentatives}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Owners Representatives"}
            />
        );
    },
    completionDate: function (
        props: WidgetExtraProps<typeof Fields.completionDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMPLETION_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "completionDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.completionDate.component
                state={context.state.completionDate}
                data={context.data.completionDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Completion Date"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: WARRANTY_REVIEW_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let ownersRepresentativesState;
        {
            const inner = Fields.ownersRepresentatives.initialize(
                data.ownersRepresentatives,
                subcontext,
                subparameters.ownersRepresentatives
            );
            ownersRepresentativesState = inner.state;
            data = { ...data, ownersRepresentatives: inner.data };
        }
        let completionDateState;
        {
            const inner = Fields.completionDate.initialize(
                data.completionDate,
                subcontext,
                subparameters.completionDate
            );
            completionDateState = inner.state;
            data = { ...data, completionDate: inner.data };
        }
        let state = {
            initialParameters: parameters,
            ownersRepresentatives: ownersRepresentativesState,
            completionDate: completionDateState,
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
                <RecordContext meta={WARRANTY_REVIEW_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    ownersRepresentatives: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.ownersRepresentatives>
    >;
    completionDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.completionDate>
    >;
};
// END MAGIC -- DO NOT EDIT
