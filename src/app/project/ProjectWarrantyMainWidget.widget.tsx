import { find, some } from "lodash";
import * as React from "react";
import { Table } from "react-bootstrap";
import { deleteRecord, storeRecord, useRecordQuery } from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { Link } from "../../clay/link";
import { longDate } from "../../clay/LocalDate";
import { propCheck } from "../../clay/propCheck";
import {
    QuickCacheApi,
    useQuickAllRecords,
    useQuickCache,
} from "../../clay/quick-cache";
import { SaveButton } from "../../clay/save-button";
import { FormField } from "../../clay/widgets/FormField";
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
import { RichTextWidget } from "../rich-text-widget";
import { useUser } from "../state";
import { User, USER_META } from "../user/table";
import {
    buildWarrantyReview,
    WARRANTY_REVIEW_META,
} from "../warranty-review/table";
import { WARRANTY_LENGTH_META } from "../warranty/table";
import { Project, PROJECT_META } from "./table";

export type Data = Project;

function actionGenerate(state: State, data: Data, user: Link<User>) {
    if (data.warrantyDate === null) {
        return {
            state,
            data: {
                ...data,
                warrantyDate: new Date(),
                warrantyHistory: [
                    ...data.warrantyHistory,
                    {
                        user,
                        datetime: new Date(),
                        event: "generate" as const,
                    },
                ],
            },
        };
    } else {
        return { state, data };
    }
}

export const Fields = {
    warrantyProjectNotes: FormField(RichTextWidget),
    warrantyPotentialConcerns: FormField(RichTextWidget),
};

function Component(props: Props) {
    const reviews =
        useRecordQuery(
            WARRANTY_REVIEW_META,
            {
                filters: [
                    {
                        column: "project",
                        filter: {
                            equal: props.data.id.uuid,
                        },
                    },
                ],
            },
            [props.data.id.uuid]
        ) || [];

    const user = useUser();

    const warrantyLengths = useQuickAllRecords(WARRANTY_LENGTH_META);

    const onPreSave = React.useCallback(() => {
        let alreadyCreated = false;
        for (const review of reviews) {
            if (review.recordVersion.version === 0) {
                deleteRecord(WARRANTY_REVIEW_META, "project", review.id.uuid);
            } else {
                alreadyCreated = true;
            }
        }
        if (
            !alreadyCreated &&
            some(props.data.warranties, (warranty) => warranty.scheduleReview)
        ) {
            const warranties = props.data.warranties.filter(
                (warranty) => warranty.active
            );
            const length =
                warranties.map((warranty) =>
                    find(warrantyLengths, (x) => x.id.uuid == warranty.length)
                )[0]?.number || null;

            storeRecord(
                WARRANTY_REVIEW_META,
                "project",
                buildWarrantyReview(props.data)
            );
        }
        props.dispatch({
            type: "GENERATE",
            user: user.id,
        });
    }, [props.dispatch, props.data, warrantyLengths]);

    const quickCache = useQuickCache();

    return (
        <>
            <widgets.warrantyProjectNotes label="Project Notes" />
            <widgets.warrantyPotentialConcerns label="Potential Concerns or Red Flags" />

            {props.data.warrantyHistory.length > 0 && (
                <Table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Date</th>
                            <th>Event</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.data.warrantyHistory.map((history, index) => (
                            <tr key={index}>
                                <td>
                                    {
                                        quickCache.get(USER_META, history.user)
                                            ?.name
                                    }
                                </td>
                                <td>{longDate(history.datetime)}</td>
                                <td>
                                    {history.event == "generate" &&
                                        "Generated Warranty"}
                                    {history.event == "unlock" &&
                                        "Unlocked Warranty"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            <div id="generate-warranty-document">
                <SaveButton
                    preSave={onPreSave}
                    label="Generate Warranty Document"
                    printTemplate="warranty"
                />
            </div>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.warrantyProjectNotes> &
    WidgetContext<typeof Fields.warrantyPotentialConcerns>;
type ExtraProps = {};
type BaseState = {
    warrantyProjectNotes: WidgetState<typeof Fields.warrantyProjectNotes>;
    warrantyPotentialConcerns: WidgetState<
        typeof Fields.warrantyPotentialConcerns
    >;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "WARRANTY_PROJECT_NOTES";
          action: WidgetAction<typeof Fields.warrantyProjectNotes>;
      }
    | {
          type: "WARRANTY_POTENTIAL_CONCERNS";
          action: WidgetAction<typeof Fields.warrantyPotentialConcerns>;
      }
    | { type: "GENERATE"; user: Link<User> };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.warrantyProjectNotes,
        data.warrantyProjectNotes,
        cache,
        "warrantyProjectNotes",
        errors
    );
    subvalidate(
        Fields.warrantyPotentialConcerns,
        data.warrantyPotentialConcerns,
        cache,
        "warrantyPotentialConcerns",
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
        case "WARRANTY_PROJECT_NOTES": {
            const inner = Fields.warrantyProjectNotes.reduce(
                state.warrantyProjectNotes,
                data.warrantyProjectNotes,
                action.action,
                subcontext
            );
            return {
                state: { ...state, warrantyProjectNotes: inner.state },
                data: { ...data, warrantyProjectNotes: inner.data },
            };
        }
        case "WARRANTY_POTENTIAL_CONCERNS": {
            const inner = Fields.warrantyPotentialConcerns.reduce(
                state.warrantyPotentialConcerns,
                data.warrantyPotentialConcerns,
                action.action,
                subcontext
            );
            return {
                state: { ...state, warrantyPotentialConcerns: inner.state },
                data: { ...data, warrantyPotentialConcerns: inner.data },
            };
        }
        case "GENERATE":
            return actionGenerate(state, data, action.user);
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
    warrantyProjectNotes: function (
        props: WidgetExtraProps<typeof Fields.warrantyProjectNotes> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "WARRANTY_PROJECT_NOTES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "warrantyProjectNotes",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.warrantyProjectNotes.component
                state={context.state.warrantyProjectNotes}
                data={context.data.warrantyProjectNotes}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Warranty Project Notes"}
            />
        );
    },
    warrantyPotentialConcerns: function (
        props: WidgetExtraProps<typeof Fields.warrantyPotentialConcerns> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "WARRANTY_POTENTIAL_CONCERNS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "warrantyPotentialConcerns",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.warrantyPotentialConcerns.component
                state={context.state.warrantyPotentialConcerns}
                data={context.data.warrantyPotentialConcerns}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Warranty Potential Concerns"}
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
        let warrantyProjectNotesState;
        {
            const inner = Fields.warrantyProjectNotes.initialize(
                data.warrantyProjectNotes,
                subcontext,
                subparameters.warrantyProjectNotes
            );
            warrantyProjectNotesState = inner.state;
            data = { ...data, warrantyProjectNotes: inner.data };
        }
        let warrantyPotentialConcernsState;
        {
            const inner = Fields.warrantyPotentialConcerns.initialize(
                data.warrantyPotentialConcerns,
                subcontext,
                subparameters.warrantyPotentialConcerns
            );
            warrantyPotentialConcernsState = inner.state;
            data = { ...data, warrantyPotentialConcerns: inner.data };
        }
        let state = {
            initialParameters: parameters,
            warrantyProjectNotes: warrantyProjectNotesState,
            warrantyPotentialConcerns: warrantyPotentialConcernsState,
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
    warrantyProjectNotes: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.warrantyProjectNotes>
    >;
    warrantyPotentialConcerns: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.warrantyPotentialConcerns>
    >;
};
// END MAGIC -- DO NOT EDIT
