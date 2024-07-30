import * as React from "react";
import { Dictionary } from "../../clay/common";
import { PageContext, usePageContext } from "../../clay/Page";
import {
    PaginatedWidgetAction,
    PaginatedWidgetState,
} from "../../clay/paginated-widget";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickRecord } from "../../clay/quick-cache";
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
import { ProjectLinkWidget } from "../project/link";
import { ProjectWarrantyWidget } from "../project/project-warranty";
import { Project, PROJECT_META } from "../project/table";
import { CONTENT_AREA } from "../styles";
import { WarrantyReview, WARRANTY_REVIEW_META } from "./table";

export type Data = WarrantyReview;

export const Fields = {
    project: ProjectLinkWidget,
};

function reduceShowWarranty(
    context: PageContext,
    x: WidgetResult<PaginatedWidgetState<Project, PageContext>, Project>,
    action: PaginatedWidgetAction<Project>
): WidgetResult<PaginatedWidgetState<Project, PageContext>, Project> {
    return ProjectWarrantyWidget.reduce(x.state, x.data, action, context);
}

function initializeShowWarranty([project, context]: [
    Project,
    PageContext
]): WidgetResult<PaginatedWidgetState<Project, PageContext>, Project> {
    return ProjectWarrantyWidget.initialize(project, context);
}

function ShowWarranty({ project }: { project: Project }) {
    const pageContext = usePageContext();

    const [state, dispatch] = React.useReducer(
        reduceShowWarranty.bind(undefined, pageContext),
        [project, pageContext],
        initializeShowWarranty
    );

    return (
        <div id="warranty-project-details" {...CONTENT_AREA}>
            <ProjectWarrantyWidget.component
                data={state.data}
                state={state.state}
                dispatch={dispatch}
                status={{
                    mutable: false,
                    validation: [],
                }}
            />
        </div>
    );
}

function Component(props: Props) {
    const project = useQuickRecord(PROJECT_META, props.data.project);
    if (project) {
        return <ShowWarranty project={project} />;
    } else {
        return <></>;
    }
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.project>;
type ExtraProps = {};
type BaseState = {
    project: WidgetState<typeof Fields.project>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction = {
    type: "PROJECT";
    action: WidgetAction<typeof Fields.project>;
};

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.project, data.project, cache, "project", errors);
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
        case "PROJECT": {
            const inner = Fields.project.reduce(
                state.project,
                data.project,
                action.action,
                subcontext
            );
            return {
                state: { ...state, project: inner.state },
                data: { ...data, project: inner.data },
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
    project: function (
        props: WidgetExtraProps<typeof Fields.project> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "project", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.project.component
                state={context.state.project}
                data={context.data.project}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project"}
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
        let projectState;
        {
            const inner = Fields.project.initialize(
                data.project,
                subcontext,
                subparameters.project
            );
            projectState = inner.state;
            data = { ...data, project: inner.data };
        }
        let state = {
            initialParameters: parameters,
            project: projectState,
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
    project: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.project>
    >;
};
// END MAGIC -- DO NOT EDIT
