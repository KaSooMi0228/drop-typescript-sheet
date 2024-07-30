import * as React from "react";
import { Col, Row } from "react-bootstrap";
import ReactSwitch from "react-switch";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { FormField, FormWrapper } from "../../../clay/widgets/FormField";
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
} from "../../../clay/widgets/index";
import { SwitchWidget } from "../../../clay/widgets/SwitchWidget";
import { calcQualityRfqIsQuality, QualityRfq, QUALITY_RFQ_META } from "./table";

export type Data = QualityRfq;

export const Fields = {
    repeatClient: FormField(SwitchWidget),
    reasonableTimeline: FormField(SwitchWidget),
    significantSize: FormField(SwitchWidget),
    projectFundingInPlace: FormField(SwitchWidget),
    clearScopeOfWork: FormField(SwitchWidget),
};

function Component(props: Props) {
    return (
        <>
            <Row>
                <Col style={{ display: "flex" }}>
                    <widgets.repeatClient label="Repeat Client / Strong Referral" />
                </Col>
                <Col style={{ display: "flex" }}>
                    <widgets.reasonableTimeline />
                </Col>
                <Col style={{ display: "flex" }}>
                    <widgets.significantSize />
                </Col>
                <Col style={{ display: "flex" }}>
                    <widgets.projectFundingInPlace />
                </Col>
                <Col style={{ display: "flex" }}>
                    <widgets.clearScopeOfWork />
                </Col>
                <Col style={{ display: "flex" }}>
                    <FormWrapper label="Quality RFQ">
                        <div>
                            <ReactSwitch
                                checked={calcQualityRfqIsQuality(props.data)}
                                onChange={() => {}}
                                disabled={true}
                            />
                        </div>
                    </FormWrapper>
                </Col>
            </Row>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.repeatClient> &
    WidgetContext<typeof Fields.reasonableTimeline> &
    WidgetContext<typeof Fields.significantSize> &
    WidgetContext<typeof Fields.projectFundingInPlace> &
    WidgetContext<typeof Fields.clearScopeOfWork>;
type ExtraProps = {};
type BaseState = {
    repeatClient: WidgetState<typeof Fields.repeatClient>;
    reasonableTimeline: WidgetState<typeof Fields.reasonableTimeline>;
    significantSize: WidgetState<typeof Fields.significantSize>;
    projectFundingInPlace: WidgetState<typeof Fields.projectFundingInPlace>;
    clearScopeOfWork: WidgetState<typeof Fields.clearScopeOfWork>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "REPEAT_CLIENT";
          action: WidgetAction<typeof Fields.repeatClient>;
      }
    | {
          type: "REASONABLE_TIMELINE";
          action: WidgetAction<typeof Fields.reasonableTimeline>;
      }
    | {
          type: "SIGNIFICANT_SIZE";
          action: WidgetAction<typeof Fields.significantSize>;
      }
    | {
          type: "PROJECT_FUNDING_IN_PLACE";
          action: WidgetAction<typeof Fields.projectFundingInPlace>;
      }
    | {
          type: "CLEAR_SCOPE_OF_WORK";
          action: WidgetAction<typeof Fields.clearScopeOfWork>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.repeatClient,
        data.repeatClient,
        cache,
        "repeatClient",
        errors
    );
    subvalidate(
        Fields.reasonableTimeline,
        data.reasonableTimeline,
        cache,
        "reasonableTimeline",
        errors
    );
    subvalidate(
        Fields.significantSize,
        data.significantSize,
        cache,
        "significantSize",
        errors
    );
    subvalidate(
        Fields.projectFundingInPlace,
        data.projectFundingInPlace,
        cache,
        "projectFundingInPlace",
        errors
    );
    subvalidate(
        Fields.clearScopeOfWork,
        data.clearScopeOfWork,
        cache,
        "clearScopeOfWork",
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
        case "REPEAT_CLIENT": {
            const inner = Fields.repeatClient.reduce(
                state.repeatClient,
                data.repeatClient,
                action.action,
                subcontext
            );
            return {
                state: { ...state, repeatClient: inner.state },
                data: { ...data, repeatClient: inner.data },
            };
        }
        case "REASONABLE_TIMELINE": {
            const inner = Fields.reasonableTimeline.reduce(
                state.reasonableTimeline,
                data.reasonableTimeline,
                action.action,
                subcontext
            );
            return {
                state: { ...state, reasonableTimeline: inner.state },
                data: { ...data, reasonableTimeline: inner.data },
            };
        }
        case "SIGNIFICANT_SIZE": {
            const inner = Fields.significantSize.reduce(
                state.significantSize,
                data.significantSize,
                action.action,
                subcontext
            );
            return {
                state: { ...state, significantSize: inner.state },
                data: { ...data, significantSize: inner.data },
            };
        }
        case "PROJECT_FUNDING_IN_PLACE": {
            const inner = Fields.projectFundingInPlace.reduce(
                state.projectFundingInPlace,
                data.projectFundingInPlace,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectFundingInPlace: inner.state },
                data: { ...data, projectFundingInPlace: inner.data },
            };
        }
        case "CLEAR_SCOPE_OF_WORK": {
            const inner = Fields.clearScopeOfWork.reduce(
                state.clearScopeOfWork,
                data.clearScopeOfWork,
                action.action,
                subcontext
            );
            return {
                state: { ...state, clearScopeOfWork: inner.state },
                data: { ...data, clearScopeOfWork: inner.data },
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
    repeatClient: function (
        props: WidgetExtraProps<typeof Fields.repeatClient> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "REPEAT_CLIENT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "repeatClient", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.repeatClient.component
                state={context.state.repeatClient}
                data={context.data.repeatClient}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Repeat Client"}
            />
        );
    },
    reasonableTimeline: function (
        props: WidgetExtraProps<typeof Fields.reasonableTimeline> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "REASONABLE_TIMELINE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "reasonableTimeline",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.reasonableTimeline.component
                state={context.state.reasonableTimeline}
                data={context.data.reasonableTimeline}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Reasonable Timeline"}
            />
        );
    },
    significantSize: function (
        props: WidgetExtraProps<typeof Fields.significantSize> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "SIGNIFICANT_SIZE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "significantSize", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.significantSize.component
                state={context.state.significantSize}
                data={context.data.significantSize}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Significant Size"}
            />
        );
    },
    projectFundingInPlace: function (
        props: WidgetExtraProps<typeof Fields.projectFundingInPlace> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_FUNDING_IN_PLACE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "projectFundingInPlace",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectFundingInPlace.component
                state={context.state.projectFundingInPlace}
                data={context.data.projectFundingInPlace}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Funding in Place"}
            />
        );
    },
    clearScopeOfWork: function (
        props: WidgetExtraProps<typeof Fields.clearScopeOfWork> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CLEAR_SCOPE_OF_WORK",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "clearScopeOfWork", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.clearScopeOfWork.component
                state={context.state.clearScopeOfWork}
                data={context.data.clearScopeOfWork}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Clear Scope of Work"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: QUALITY_RFQ_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let repeatClientState;
        {
            const inner = Fields.repeatClient.initialize(
                data.repeatClient,
                subcontext,
                subparameters.repeatClient
            );
            repeatClientState = inner.state;
            data = { ...data, repeatClient: inner.data };
        }
        let reasonableTimelineState;
        {
            const inner = Fields.reasonableTimeline.initialize(
                data.reasonableTimeline,
                subcontext,
                subparameters.reasonableTimeline
            );
            reasonableTimelineState = inner.state;
            data = { ...data, reasonableTimeline: inner.data };
        }
        let significantSizeState;
        {
            const inner = Fields.significantSize.initialize(
                data.significantSize,
                subcontext,
                subparameters.significantSize
            );
            significantSizeState = inner.state;
            data = { ...data, significantSize: inner.data };
        }
        let projectFundingInPlaceState;
        {
            const inner = Fields.projectFundingInPlace.initialize(
                data.projectFundingInPlace,
                subcontext,
                subparameters.projectFundingInPlace
            );
            projectFundingInPlaceState = inner.state;
            data = { ...data, projectFundingInPlace: inner.data };
        }
        let clearScopeOfWorkState;
        {
            const inner = Fields.clearScopeOfWork.initialize(
                data.clearScopeOfWork,
                subcontext,
                subparameters.clearScopeOfWork
            );
            clearScopeOfWorkState = inner.state;
            data = { ...data, clearScopeOfWork: inner.data };
        }
        let state = {
            initialParameters: parameters,
            repeatClient: repeatClientState,
            reasonableTimeline: reasonableTimelineState,
            significantSize: significantSizeState,
            projectFundingInPlace: projectFundingInPlaceState,
            clearScopeOfWork: clearScopeOfWorkState,
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
                <RecordContext meta={QUALITY_RFQ_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    repeatClient: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.repeatClient>
    >;
    reasonableTimeline: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.reasonableTimeline>
    >;
    significantSize: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.significantSize>
    >;
    projectFundingInPlace: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectFundingInPlace>
    >;
    clearScopeOfWork: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.clearScopeOfWork>
    >;
};
// END MAGIC -- DO NOT EDIT
