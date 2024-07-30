import { memoize } from "lodash";
import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { DeleteButton } from "../../../clay/delete-button";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi, useQuickRecords } from "../../../clay/quick-cache";
import { StaticDateTimeWidget } from "../../../clay/widgets/DateTimeWidget";
import { FormField } from "../../../clay/widgets/FormField";
import {
    RecordContext,
    RecordWidget,
    subStatus,
    subvalidate,
    useRecordContext,
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
import { QuantityWidget } from "../../../clay/widgets/number-widget";
import { SelectLinkWidget } from "../../../clay/widgets/SelectLinkWidget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import { CONTENT_AREA } from "../../styles";
import { UserLinkWidget } from "../../user";
import { ROLE_CERTIFIED_FOREMAN, USER_META } from "../../user/table";
import { PROJECT_META } from "../table";
import SiteVisitReportSectionWidget, {
    Action as SiteVisitReportSectionWidgetAction,
    State as SiteVisitReportSectionWidgetState,
} from "./SiteVisitReportSectionWidget.widget";
import { SiteVisitReport, SITE_VISIT_REPORT_META } from "./table";

export type Data = SiteVisitReport;

export const Fields = {
    addedDateTime: FormField(StaticDateTimeWidget),
    user: FormField(UserLinkWidget),
    weatherConditions: FormField(TextWidget),
    numberOfWorkersOnSite: FormField(QuantityWidget),
    certifiedForeman: FormField(
        SelectLinkWidget({
            meta: USER_META,
            label: (user) => user.name,
        })
    ),
};

function SiteVisitReportSurveySectionWidget(
    index: number
): RecordWidget<
    SiteVisitReportSectionWidgetState,
    SiteVisitReport,
    {},
    SiteVisitReportSectionWidgetAction,
    {}
> {
    return {
        dataMeta: SITE_VISIT_REPORT_META,
        reactContext: undefined as any,
        fieldWidgets: undefined as any,
        initialize(data: SiteVisitReport, context) {
            const inner = SiteVisitReportSectionWidget.initialize(
                data.sections[index],
                context
            );
            const items = data.sections.slice();
            items[index] = inner.data;
            return {
                data: {
                    ...data,
                    sections: items,
                },
                state: inner.state,
            };
        },
        component(props) {
            return (
                <div {...CONTENT_AREA}>
                    <SiteVisitReportSectionWidget.component
                        {...props}
                        data={props.data.sections[index]}
                        final={index + 1 === props.data.sections.length}
                    />
                </div>
            );
        },
        reduce(state, data, action, context) {
            const inner = SiteVisitReportSectionWidget.reduce(
                state,
                data.sections[index],
                action,
                context
            );
            const items = data.sections.slice();
            items[index] = inner.data;
            return {
                state: inner.state,
                data: {
                    ...data,
                    sections: items,
                },
            };
        },
        validate(data, cache) {
            return SiteVisitReportSectionWidget.validate(
                data.sections[index],
                cache
            );
        },
    };
}

function Component(props: Props) {
    const projectContext = useRecordContext(PROJECT_META);
    const certifiedForemen = useQuickRecords(
        USER_META,
        projectContext.personnel
            .filter((role) => role.role === ROLE_CERTIFIED_FOREMAN)
            .map((x) => x.user!)
    );

    return (
        <>
            <widgets.addedDateTime label="Date and Time of Site Visit" />
            <widgets.user label="Site Visit By" />
            <widgets.certifiedForeman records={certifiedForemen} />
            <widgets.weatherConditions />
            <widgets.numberOfWorkersOnSite />
            <DeleteButton />
        </>
    );
}

export const SectionWidgetFactory = memoize(SiteVisitReportSurveySectionWidget);

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.addedDateTime> &
    WidgetContext<typeof Fields.user> &
    WidgetContext<typeof Fields.weatherConditions> &
    WidgetContext<typeof Fields.numberOfWorkersOnSite> &
    WidgetContext<typeof Fields.certifiedForeman>;
type ExtraProps = {};
type BaseState = {
    addedDateTime: WidgetState<typeof Fields.addedDateTime>;
    user: WidgetState<typeof Fields.user>;
    weatherConditions: WidgetState<typeof Fields.weatherConditions>;
    numberOfWorkersOnSite: WidgetState<typeof Fields.numberOfWorkersOnSite>;
    certifiedForeman: WidgetState<typeof Fields.certifiedForeman>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "ADDED_DATE_TIME";
          action: WidgetAction<typeof Fields.addedDateTime>;
      }
    | { type: "USER"; action: WidgetAction<typeof Fields.user> }
    | {
          type: "WEATHER_CONDITIONS";
          action: WidgetAction<typeof Fields.weatherConditions>;
      }
    | {
          type: "NUMBER_OF_WORKERS_ON_SITE";
          action: WidgetAction<typeof Fields.numberOfWorkersOnSite>;
      }
    | {
          type: "CERTIFIED_FOREMAN";
          action: WidgetAction<typeof Fields.certifiedForeman>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.addedDateTime,
        data.addedDateTime,
        cache,
        "addedDateTime",
        errors
    );
    subvalidate(Fields.user, data.user, cache, "user", errors);
    subvalidate(
        Fields.weatherConditions,
        data.weatherConditions,
        cache,
        "weatherConditions",
        errors
    );
    subvalidate(
        Fields.numberOfWorkersOnSite,
        data.numberOfWorkersOnSite,
        cache,
        "numberOfWorkersOnSite",
        errors
    );
    subvalidate(
        Fields.certifiedForeman,
        data.certifiedForeman,
        cache,
        "certifiedForeman",
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
        case "ADDED_DATE_TIME": {
            const inner = Fields.addedDateTime.reduce(
                state.addedDateTime,
                data.addedDateTime,
                action.action,
                subcontext
            );
            return {
                state: { ...state, addedDateTime: inner.state },
                data: { ...data, addedDateTime: inner.data },
            };
        }
        case "USER": {
            const inner = Fields.user.reduce(
                state.user,
                data.user,
                action.action,
                subcontext
            );
            return {
                state: { ...state, user: inner.state },
                data: { ...data, user: inner.data },
            };
        }
        case "WEATHER_CONDITIONS": {
            const inner = Fields.weatherConditions.reduce(
                state.weatherConditions,
                data.weatherConditions,
                action.action,
                subcontext
            );
            return {
                state: { ...state, weatherConditions: inner.state },
                data: { ...data, weatherConditions: inner.data },
            };
        }
        case "NUMBER_OF_WORKERS_ON_SITE": {
            const inner = Fields.numberOfWorkersOnSite.reduce(
                state.numberOfWorkersOnSite,
                data.numberOfWorkersOnSite,
                action.action,
                subcontext
            );
            return {
                state: { ...state, numberOfWorkersOnSite: inner.state },
                data: { ...data, numberOfWorkersOnSite: inner.data },
            };
        }
        case "CERTIFIED_FOREMAN": {
            const inner = Fields.certifiedForeman.reduce(
                state.certifiedForeman,
                data.certifiedForeman,
                action.action,
                subcontext
            );
            return {
                state: { ...state, certifiedForeman: inner.state },
                data: { ...data, certifiedForeman: inner.data },
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
    addedDateTime: function (
        props: WidgetExtraProps<typeof Fields.addedDateTime> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ADDED_DATE_TIME",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "addedDateTime", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.addedDateTime.component
                state={context.state.addedDateTime}
                data={context.data.addedDateTime}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Added Date Time"}
            />
        );
    },
    user: function (
        props: WidgetExtraProps<typeof Fields.user> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "USER", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "user", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.user.component
                state={context.state.user}
                data={context.data.user}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "User"}
            />
        );
    },
    weatherConditions: function (
        props: WidgetExtraProps<typeof Fields.weatherConditions> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "WEATHER_CONDITIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "weatherConditions",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.weatherConditions.component
                state={context.state.weatherConditions}
                data={context.data.weatherConditions}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Weather Conditions"}
            />
        );
    },
    numberOfWorkersOnSite: function (
        props: WidgetExtraProps<typeof Fields.numberOfWorkersOnSite> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "NUMBER_OF_WORKERS_ON_SITE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "numberOfWorkersOnSite",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.numberOfWorkersOnSite.component
                state={context.state.numberOfWorkersOnSite}
                data={context.data.numberOfWorkersOnSite}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Number of Workers on Site"}
            />
        );
    },
    certifiedForeman: function (
        props: WidgetExtraProps<typeof Fields.certifiedForeman> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CERTIFIED_FOREMAN",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "certifiedForeman", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.certifiedForeman.component
                state={context.state.certifiedForeman}
                data={context.data.certifiedForeman}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Certified Foreman"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: SITE_VISIT_REPORT_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let addedDateTimeState;
        {
            const inner = Fields.addedDateTime.initialize(
                data.addedDateTime,
                subcontext,
                subparameters.addedDateTime
            );
            addedDateTimeState = inner.state;
            data = { ...data, addedDateTime: inner.data };
        }
        let userState;
        {
            const inner = Fields.user.initialize(
                data.user,
                subcontext,
                subparameters.user
            );
            userState = inner.state;
            data = { ...data, user: inner.data };
        }
        let weatherConditionsState;
        {
            const inner = Fields.weatherConditions.initialize(
                data.weatherConditions,
                subcontext,
                subparameters.weatherConditions
            );
            weatherConditionsState = inner.state;
            data = { ...data, weatherConditions: inner.data };
        }
        let numberOfWorkersOnSiteState;
        {
            const inner = Fields.numberOfWorkersOnSite.initialize(
                data.numberOfWorkersOnSite,
                subcontext,
                subparameters.numberOfWorkersOnSite
            );
            numberOfWorkersOnSiteState = inner.state;
            data = { ...data, numberOfWorkersOnSite: inner.data };
        }
        let certifiedForemanState;
        {
            const inner = Fields.certifiedForeman.initialize(
                data.certifiedForeman,
                subcontext,
                subparameters.certifiedForeman
            );
            certifiedForemanState = inner.state;
            data = { ...data, certifiedForeman: inner.data };
        }
        let state = {
            initialParameters: parameters,
            addedDateTime: addedDateTimeState,
            user: userState,
            weatherConditions: weatherConditionsState,
            numberOfWorkersOnSite: numberOfWorkersOnSiteState,
            certifiedForeman: certifiedForemanState,
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
                <RecordContext meta={SITE_VISIT_REPORT_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    addedDateTime: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.addedDateTime>
    >;
    user: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.user>
    >;
    weatherConditions: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.weatherConditions>
    >;
    numberOfWorkersOnSite: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.numberOfWorkersOnSite>
    >;
    certifiedForeman: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.certifiedForeman>
    >;
};
// END MAGIC -- DO NOT EDIT
