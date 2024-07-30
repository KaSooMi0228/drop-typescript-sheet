import { some } from "lodash";
import * as React from "react";
import { Nav, Tab } from "react-bootstrap";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import {
    InitializeResult,
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
import { useUser } from "../state";
import { CONTENT_AREA } from "../styles";
import { isRoomCalculator } from "./action/table";
import AllowancesWidget from "./AllowancesWidget.widget";
import AreasWidget from "./AreasWidget.widget";
import ContingencyItemsV2Widget from "./ContingencyItemsV2Widget.widget";
import NotesWidget from "./NotesWidget.widget";
import OverviewWidget from "./OverviewWidget.widget";
import { Action as RoomWidgetAction } from "./side/RoomWidget.widget";
import { Estimate, ESTIMATE_META } from "./table";
import TotalsWidget from "./TotalsWidget.widget";

export type Data = Estimate;
const ESTIMATE_WIDGET_META = ESTIMATE_META;

export const Subs = {
    overview: OverviewWidget,
    areas: AreasWidget,
    allowances: AllowancesWidget,
    contingencyItemsV2: ContingencyItemsV2Widget,
    notes: NotesWidget,
    totals: TotalsWidget,
};

type MainTabs = keyof typeof Subs;

type ExtraState = {
    currentTab: MainTabs;
};
type ExtraActions = {
    type: "SELECT_TAB";
    tab: MainTabs;
};

function initialize(
    data: Estimate,
    context: Context,
    parameters: string[] = []
): InitializeResult<ExtraState, Estimate> {
    let state: ExtraState = {
        currentTab: (parameters[0] as MainTabs) || "overview",
    };

    return {
        state,
        data,
        parameters: {
            [state.currentTab]: parameters.slice(1),
        },
    };
}

function isRoomChangeAction(action: RoomWidgetAction): boolean {
    switch (action.action.type) {
        default:
            return true;
        case "BLUR":
            return false;
    }
}

function updateIndex<T>(items: T[], index: number, fn: (value: T) => T): T[] {
    items = [...items];
    items[index] = fn(items[index]);
    return items;
}

function zipMap<X, Y, Z>(x: X[], y: Y[], f: (x: X, y: Y) => Z): Z[] {
    const result = [];
    for (let index = 0; index < x.length; index++) {
        result.push(f(x[index], y[index]));
    }
    return result;
}
function reduce(
    state: State,
    data: Data,
    action: Action,
    context: Context
): WidgetResult<State, Data> {
    switch (action.type) {
        case "SELECT_TAB":
            return {
                state: {
                    ...state,
                    currentTab: action.tab,
                },
                data,
            };
        case "AREAS":
            if (
                action.action.type == "AREAS" &&
                action.action.action.type == "ITEM" &&
                action.action.action.action.type == "SIDES" &&
                action.action.action.action.action.type == "ITEM" &&
                action.action.action.action.action.action.type == "ROOM" &&
                isRoomChangeAction(
                    action.action.action.action.action.action.action
                )
            ) {
                const areaIndex = action.action.action.index;
                const sideIndex = action.action.action.action.action.index;

                const inner = baseReduce(state, data, action, context);

                const output = {
                    state: inner.state,
                    data: {
                        ...inner.data,
                        areas: updateIndex(
                            inner.data.areas,
                            areaIndex,
                            (area) => ({
                                ...area,
                                sides: updateIndex(
                                    area.sides,
                                    sideIndex,
                                    (side) => ({
                                        ...side,
                                        actions: zipMap(
                                            side.actions,
                                            inner.data.actions,
                                            (sideAction, estimateAction) =>
                                                isRoomCalculator(estimateAction)
                                                    ? {
                                                          ...sideAction,
                                                          hours: null,
                                                          materials: null,
                                                          units: null,
                                                      }
                                                    : sideAction
                                        ),
                                    })
                                ),
                            })
                        ),
                    },
                };
                return output;
            }

        default:
            let result = baseReduce(state, data, action, context);
            if (
                action.type == "AREAS" &&
                action.action.type === "AREAS" &&
                action.action.action.type === "REMOVE"
            ) {
                // If removed an area, make sure you remove allowances that refer to it
                const validAreas = result.data.areas.map(
                    (area) => area.id.uuid
                );

                const newData = {
                    ...result.data,
                    allowances: result.data.allowances
                        .filter(
                            (allowance) =>
                                allowance.areas.length == 0 ||
                                some(
                                    allowance.areas,
                                    (x) => validAreas.indexOf(x!) !== -1
                                )
                        )
                        .map((allowance) => ({
                            ...allowance,
                            areas: allowance.areas.filter(
                                (area) => validAreas.indexOf(area!) !== -1
                            ),
                        })),
                };
                result = {
                    state: {
                        ...result.state,
                        allowances: AllowancesWidget.initialize(
                            newData,
                            context
                        ).state,
                    },
                    data: newData,
                };
            }

            return result;
    }
}

function encodeState(state: ExtraState) {
    const encodeInnerState = Subs[state.currentTab].encodeState;
    return [
        state.currentTab,
        ...(encodeInnerState
            ? encodeInnerState((state as any)[state.currentTab])
            : []),
    ];
}

function Component(props: Props) {
    const user = useUser();
    const onSelectTab = React.useCallback(
        (tab: string | null) => {
            return props.dispatch({
                type: "SELECT_TAB",
                tab: tab as MainTabs,
            });
        },
        [props.dispatch]
    );

    return (
        <Tab.Container
            activeKey={props.state.currentTab}
            onSelect={onSelectTab}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    overflowY: "auto",
                }}
            >
                <div {...CONTENT_AREA}>
                    <Tab.Content {...CONTENT_AREA}>
                        <Tab.Pane eventKey="areas" {...CONTENT_AREA}>
                            {props.state.currentTab === "areas" && (
                                <widgets.areas />
                            )}
                        </Tab.Pane>
                        <Tab.Pane eventKey="overview" {...CONTENT_AREA}>
                            {props.state.currentTab === "overview" && (
                                <widgets.overview />
                            )}
                        </Tab.Pane>
                        <Tab.Pane eventKey="allowances" {...CONTENT_AREA}>
                            {props.state.currentTab === "allowances" && (
                                <widgets.allowances />
                            )}
                        </Tab.Pane>
                        <Tab.Pane
                            eventKey="contingencyItemsV2"
                            {...CONTENT_AREA}
                        >
                            {props.state.currentTab ===
                                "contingencyItemsV2" && (
                                <widgets.contingencyItemsV2 />
                            )}
                        </Tab.Pane>
                        <Tab.Pane eventKey="notes" {...CONTENT_AREA}>
                            {props.state.currentTab === "notes" && (
                                <widgets.notes />
                            )}
                        </Tab.Pane>
                        <Tab.Pane eventKey="totals" {...CONTENT_AREA}>
                            {props.state.currentTab === "totals" && (
                                <widgets.totals />
                            )}
                        </Tab.Pane>
                    </Tab.Content>
                </div>
                <div>
                    <Nav variant="pills">
                        <Nav.Item>
                            <Nav.Link eventKey="overview">Overview</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="areas">Areas</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="contingencyItemsV2">
                                Contingency Items
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="allowances">
                                Allowances
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="notes">Notes</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="totals">Totals</Nav.Link>
                        </Nav.Item>
                    </Nav>
                </div>
            </div>
        </Tab.Container>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Subs.overview> &
    WidgetContext<typeof Subs.areas> &
    WidgetContext<typeof Subs.allowances> &
    WidgetContext<typeof Subs.contingencyItemsV2> &
    WidgetContext<typeof Subs.notes> &
    WidgetContext<typeof Subs.totals>;
type ExtraProps = {};
type BaseState = {
    overview: WidgetState<typeof Subs.overview>;
    areas: WidgetState<typeof Subs.areas>;
    allowances: WidgetState<typeof Subs.allowances>;
    contingencyItemsV2: WidgetState<typeof Subs.contingencyItemsV2>;
    notes: WidgetState<typeof Subs.notes>;
    totals: WidgetState<typeof Subs.totals>;
    initialParameters?: string[];
};
export type State = BaseState & ExtraState;

type BaseAction =
    | { type: "OVERVIEW"; action: WidgetAction<typeof Subs.overview> }
    | { type: "AREAS"; action: WidgetAction<typeof Subs.areas> }
    | { type: "ALLOWANCES"; action: WidgetAction<typeof Subs.allowances> }
    | {
          type: "CONTINGENCY_ITEMS_V2";
          action: WidgetAction<typeof Subs.contingencyItemsV2>;
      }
    | { type: "NOTES"; action: WidgetAction<typeof Subs.notes> }
    | { type: "TOTALS"; action: WidgetAction<typeof Subs.totals> };

export type Action = ExtraActions | BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Subs.overview, data, cache, "overview", errors);
    subvalidate(Subs.areas, data, cache, "areas", errors);
    subvalidate(Subs.allowances, data, cache, "allowances", errors);
    subvalidate(
        Subs.contingencyItemsV2,
        data,
        cache,
        "contingencyItemsV2",
        errors
    );
    subvalidate(Subs.notes, data, cache, "notes", errors);
    subvalidate(Subs.totals, data, cache, "totals", errors);
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
        case "OVERVIEW": {
            const inner = Subs.overview.reduce(
                state.overview,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, overview: inner.state },
                data: inner.data,
            };
        }
        case "AREAS": {
            const inner = Subs.areas.reduce(
                state.areas,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, areas: inner.state },
                data: inner.data,
            };
        }
        case "ALLOWANCES": {
            const inner = Subs.allowances.reduce(
                state.allowances,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, allowances: inner.state },
                data: inner.data,
            };
        }
        case "CONTINGENCY_ITEMS_V2": {
            const inner = Subs.contingencyItemsV2.reduce(
                state.contingencyItemsV2,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contingencyItemsV2: inner.state },
                data: inner.data,
            };
        }
        case "NOTES": {
            const inner = Subs.notes.reduce(
                state.notes,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, notes: inner.state },
                data: inner.data,
            };
        }
        case "TOTALS": {
            const inner = Subs.totals.reduce(
                state.totals,
                data,
                action.action,
                subcontext
            );
            return {
                state: { ...state, totals: inner.state },
                data: inner.data,
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
    overview: function (
        props: WidgetExtraProps<typeof Subs.overview> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "OVERVIEW",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "overview", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.overview.component
                state={context.state.overview}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Overview"}
            />
        );
    },
    areas: function (
        props: WidgetExtraProps<typeof Subs.areas> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "AREAS", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "areas", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.areas.component
                state={context.state.areas}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Areas"}
            />
        );
    },
    allowances: function (
        props: WidgetExtraProps<typeof Subs.allowances> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "ALLOWANCES",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "allowances", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.allowances.component
                state={context.state.allowances}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Allowances"}
            />
        );
    },
    contingencyItemsV2: function (
        props: WidgetExtraProps<typeof Subs.contingencyItemsV2> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTINGENCY_ITEMS_V2",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "contingencyItemsV2",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Subs.contingencyItemsV2.component
                state={context.state.contingencyItemsV2}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contingency Items V2"}
            />
        );
    },
    notes: function (
        props: WidgetExtraProps<typeof Subs.notes> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "NOTES", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "notes", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.notes.component
                state={context.state.notes}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Notes"}
            />
        );
    },
    totals: function (
        props: WidgetExtraProps<typeof Subs.totals> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "TOTALS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "totals", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Subs.totals.component
                state={context.state.totals}
                data={context.data}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Totals"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ESTIMATE_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        const result = initialize(data, context, parameters);
        data = result.data;
        let subparameters: Dictionary<string[]> =
            (result as any).parameters || {};
        let subcontext = context;
        let overviewState;
        {
            const inner = Subs.overview.initialize(
                data,
                subcontext,
                subparameters.overview
            );
            overviewState = inner.state;
            data = inner.data;
        }
        let areasState;
        {
            const inner = Subs.areas.initialize(
                data,
                subcontext,
                subparameters.areas
            );
            areasState = inner.state;
            data = inner.data;
        }
        let allowancesState;
        {
            const inner = Subs.allowances.initialize(
                data,
                subcontext,
                subparameters.allowances
            );
            allowancesState = inner.state;
            data = inner.data;
        }
        let contingencyItemsV2State;
        {
            const inner = Subs.contingencyItemsV2.initialize(
                data,
                subcontext,
                subparameters.contingencyItemsV2
            );
            contingencyItemsV2State = inner.state;
            data = inner.data;
        }
        let notesState;
        {
            const inner = Subs.notes.initialize(
                data,
                subcontext,
                subparameters.notes
            );
            notesState = inner.state;
            data = inner.data;
        }
        let totalsState;
        {
            const inner = Subs.totals.initialize(
                data,
                subcontext,
                subparameters.totals
            );
            totalsState = inner.state;
            data = inner.data;
        }
        let state = {
            initialParameters: parameters,
            ...result.state,
            overview: overviewState,
            areas: areasState,
            allowances: allowancesState,
            contingencyItemsV2: contingencyItemsV2State,
            notes: notesState,
            totals: totalsState,
        };
        return {
            state,
            data,
        };
    },
    validate: baseValidate,
    encodeState: encodeState,
    component: React.memo((props: Props) => {
        return (
            <ReactContext.Provider value={props}>
                <RecordContext meta={ESTIMATE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
};
export default Widget;
type Widgets = {
    overview: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.overview>
    >;
    areas: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.areas>
    >;
    allowances: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.allowances>
    >;
    contingencyItemsV2: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.contingencyItemsV2>
    >;
    notes: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.notes>
    >;
    totals: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Subs.totals>
    >;
};
// END MAGIC -- DO NOT EDIT
