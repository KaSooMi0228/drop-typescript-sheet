import * as React from "react";
import { Table, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import { ActionButton } from "../../clay/ActionButton";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../clay/quick-cache";
import { StaticDateTimeWidget } from "../../clay/widgets/DateTimeWidget";
import { FormField, FormWrapper } from "../../clay/widgets/FormField";
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
import { LabelledBoolWidget } from "../../clay/widgets/labelled-bool-widget";
import { ListWidget } from "../../clay/widgets/ListWidget";
import { formatMoney } from "../estimate/TotalsWidget.widget";
import {
    calcQuotationExpectedContractValue,
    QUOTATION_META,
} from "../quotation/table";
import { RichTextWidget } from "../rich-text-widget";
import { UserLinkWidget } from "../user";
import CompetitorDetailWidget from "./CompetitorDetailWidget.widget";
import { ProjectLostAwardShared } from "./projectLostAwardShared";
import { ReactContext as ProjectWidgetReactContext } from "./ProjectWidget.widget";
import { Project, PROJECT_META } from "./table";

export type Data = Project;

export const Fields = {
    competitors: ListWidget(CompetitorDetailWidget, { emptyOk: true }),
    projectLostDate: StaticDateTimeWidget,
    projectLostUser: FormField(UserLinkWidget),
    projectLostNotes: FormField(RichTextWidget),
    projectProceededWithoutRemdal: LabelledBoolWidget(
        "Project Lost",
        "Project Did Not Proceed"
    ),
    // Make sure any fields in this widget are reset in the handler for
    // CANCEL_AWARD_LOST at the project level
};

function Component(props: Props) {
    const projectContext = React.useContext(ProjectWidgetReactContext)!;
    const quotation = useQuickRecord(
        QUOTATION_META,
        props.data.selectedQuotation
    );
    const expectedContractValue = React.useMemo(
        () => quotation && calcQuotationExpectedContractValue(quotation),
        [quotation]
    );

    return (
        <>
            <FormWrapper label="Project Lost Date">
                <div style={{ display: "flex" }}>
                    <widgets.projectLostDate />
                    <div style={{ width: "1em" }} />
                    <ActionButton
                        status={props.status}
                        disabled={props.data.contractDetailsDate !== null}
                        onClick={() =>
                            projectContext.dispatch({
                                type: "CANCEL_AWARD_LOST",
                            })
                        }
                    >
                        Cancel
                    </ActionButton>
                </div>
            </FormWrapper>
            {quotation && (
                <Table
                    style={{
                        maxWidth: "50em",
                    }}
                >
                    <thead>
                        <tr>
                            <th>Remdal Options</th>
                            <th>Project Description</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotation.options
                            .filter(
                                (option) =>
                                    option.includedInExpectedContractValue
                            )
                            .map((option) => (
                                <tr key={option.id.uuid}>
                                    <td>{option.name}</td>
                                    <td>{option.description}</td>
                                    <td>{formatMoney(option.details.total)}</td>
                                </tr>
                            ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th />
                            <th>Expected Contract Value</th>
                            <th>
                                {expectedContractValue &&
                                    formatMoney(expectedContractValue)}
                            </th>
                        </tr>
                    </tfoot>
                </Table>
            )}
            <ProjectLostAwardShared data={props.data} widgets={widgets} />
            <FormWrapper label="Project Status">
                {props.data.selectedQuotation ? (
                    <widgets.projectProceededWithoutRemdal />
                ) : (
                    <div>
                        <ToggleButtonGroup type="radio" value={"x"} name="id">
                            <ToggleButton value="false" variant={"primary"}>
                                Did Not Quote
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </div>
                )}
            </FormWrapper>
            <widgets.projectLostUser
                label="Project Lost Recorded By"
                readOnly
            />
            <widgets.projectLostNotes />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.competitors> &
    WidgetContext<typeof Fields.projectLostDate> &
    WidgetContext<typeof Fields.projectLostUser> &
    WidgetContext<typeof Fields.projectLostNotes> &
    WidgetContext<typeof Fields.projectProceededWithoutRemdal>;
type ExtraProps = {};
type BaseState = {
    competitors: WidgetState<typeof Fields.competitors>;
    projectLostDate: WidgetState<typeof Fields.projectLostDate>;
    projectLostUser: WidgetState<typeof Fields.projectLostUser>;
    projectLostNotes: WidgetState<typeof Fields.projectLostNotes>;
    projectProceededWithoutRemdal: WidgetState<
        typeof Fields.projectProceededWithoutRemdal
    >;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "COMPETITORS"; action: WidgetAction<typeof Fields.competitors> }
    | {
          type: "PROJECT_LOST_DATE";
          action: WidgetAction<typeof Fields.projectLostDate>;
      }
    | {
          type: "PROJECT_LOST_USER";
          action: WidgetAction<typeof Fields.projectLostUser>;
      }
    | {
          type: "PROJECT_LOST_NOTES";
          action: WidgetAction<typeof Fields.projectLostNotes>;
      }
    | {
          type: "PROJECT_PROCEEDED_WITHOUT_REMDAL";
          action: WidgetAction<typeof Fields.projectProceededWithoutRemdal>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.competitors,
        data.competitors,
        cache,
        "competitors",
        errors
    );
    subvalidate(
        Fields.projectLostDate,
        data.projectLostDate,
        cache,
        "projectLostDate",
        errors
    );
    subvalidate(
        Fields.projectLostUser,
        data.projectLostUser,
        cache,
        "projectLostUser",
        errors
    );
    subvalidate(
        Fields.projectLostNotes,
        data.projectLostNotes,
        cache,
        "projectLostNotes",
        errors
    );
    subvalidate(
        Fields.projectProceededWithoutRemdal,
        data.projectProceededWithoutRemdal,
        cache,
        "projectProceededWithoutRemdal",
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
        case "COMPETITORS": {
            const inner = Fields.competitors.reduce(
                state.competitors,
                data.competitors,
                action.action,
                subcontext
            );
            return {
                state: { ...state, competitors: inner.state },
                data: { ...data, competitors: inner.data },
            };
        }
        case "PROJECT_LOST_DATE": {
            const inner = Fields.projectLostDate.reduce(
                state.projectLostDate,
                data.projectLostDate,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectLostDate: inner.state },
                data: { ...data, projectLostDate: inner.data },
            };
        }
        case "PROJECT_LOST_USER": {
            const inner = Fields.projectLostUser.reduce(
                state.projectLostUser,
                data.projectLostUser,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectLostUser: inner.state },
                data: { ...data, projectLostUser: inner.data },
            };
        }
        case "PROJECT_LOST_NOTES": {
            const inner = Fields.projectLostNotes.reduce(
                state.projectLostNotes,
                data.projectLostNotes,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectLostNotes: inner.state },
                data: { ...data, projectLostNotes: inner.data },
            };
        }
        case "PROJECT_PROCEEDED_WITHOUT_REMDAL": {
            const inner = Fields.projectProceededWithoutRemdal.reduce(
                state.projectProceededWithoutRemdal,
                data.projectProceededWithoutRemdal,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectProceededWithoutRemdal: inner.state },
                data: { ...data, projectProceededWithoutRemdal: inner.data },
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
    competitors: function (
        props: WidgetExtraProps<typeof Fields.competitors> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMPETITORS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "competitors", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.competitors.component
                state={context.state.competitors}
                data={context.data.competitors}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Competitors"}
            />
        );
    },
    projectLostDate: function (
        props: WidgetExtraProps<typeof Fields.projectLostDate> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_LOST_DATE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "projectLostDate", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectLostDate.component
                state={context.state.projectLostDate}
                data={context.data.projectLostDate}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Lost Date"}
            />
        );
    },
    projectLostUser: function (
        props: WidgetExtraProps<typeof Fields.projectLostUser> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_LOST_USER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "projectLostUser", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectLostUser.component
                state={context.state.projectLostUser}
                data={context.data.projectLostUser}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Lost User"}
            />
        );
    },
    projectLostNotes: function (
        props: WidgetExtraProps<typeof Fields.projectLostNotes> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_LOST_NOTES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "projectLostNotes", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectLostNotes.component
                state={context.state.projectLostNotes}
                data={context.data.projectLostNotes}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Lost Notes"}
            />
        );
    },
    projectProceededWithoutRemdal: function (
        props: WidgetExtraProps<typeof Fields.projectProceededWithoutRemdal> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_PROCEEDED_WITHOUT_REMDAL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "projectProceededWithoutRemdal",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectProceededWithoutRemdal.component
                state={context.state.projectProceededWithoutRemdal}
                data={context.data.projectProceededWithoutRemdal}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Proceeded without Remdal"}
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
        let competitorsState;
        {
            const inner = Fields.competitors.initialize(
                data.competitors,
                subcontext,
                subparameters.competitors
            );
            competitorsState = inner.state;
            data = { ...data, competitors: inner.data };
        }
        let projectLostDateState;
        {
            const inner = Fields.projectLostDate.initialize(
                data.projectLostDate,
                subcontext,
                subparameters.projectLostDate
            );
            projectLostDateState = inner.state;
            data = { ...data, projectLostDate: inner.data };
        }
        let projectLostUserState;
        {
            const inner = Fields.projectLostUser.initialize(
                data.projectLostUser,
                subcontext,
                subparameters.projectLostUser
            );
            projectLostUserState = inner.state;
            data = { ...data, projectLostUser: inner.data };
        }
        let projectLostNotesState;
        {
            const inner = Fields.projectLostNotes.initialize(
                data.projectLostNotes,
                subcontext,
                subparameters.projectLostNotes
            );
            projectLostNotesState = inner.state;
            data = { ...data, projectLostNotes: inner.data };
        }
        let projectProceededWithoutRemdalState;
        {
            const inner = Fields.projectProceededWithoutRemdal.initialize(
                data.projectProceededWithoutRemdal,
                subcontext,
                subparameters.projectProceededWithoutRemdal
            );
            projectProceededWithoutRemdalState = inner.state;
            data = { ...data, projectProceededWithoutRemdal: inner.data };
        }
        let state = {
            initialParameters: parameters,
            competitors: competitorsState,
            projectLostDate: projectLostDateState,
            projectLostUser: projectLostUserState,
            projectLostNotes: projectLostNotesState,
            projectProceededWithoutRemdal: projectProceededWithoutRemdalState,
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
    competitors: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.competitors>
    >;
    projectLostDate: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectLostDate>
    >;
    projectLostUser: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectLostUser>
    >;
    projectLostNotes: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectLostNotes>
    >;
    projectProceededWithoutRemdal: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectProceededWithoutRemdal>
    >;
};
// END MAGIC -- DO NOT EDIT
