import { find, memoize } from "lodash";
import React from "react";
import { Dictionary } from "../../../clay/common";
import { DeleteButton } from "../../../clay/delete-button";
import { PaginatedWidget } from "../../../clay/paginated-widget";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { StaticDateTimeWidget } from "../../../clay/widgets/DateTimeWidget";
import { FormWrapper } from "../../../clay/widgets/FormField";
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
import { FieldRow } from "../../../clay/widgets/layout";
import { StaticTextField } from "../../../clay/widgets/TextWidget";
import { ContactDetail } from "../../contact/table";
import { SiteVisitReportQuestion } from "../site-visit-report/table";
import { CustomerSurvey, CUSTOMER_SURVEY_META } from "./table";

export type Data = CustomerSurvey;

const Fields = {
    addedDateTime: StaticDateTimeWidget,
};

export function actionUpdateContact(
    state: State,
    data: CustomerSurvey,
    contact: ContactDetail,
    value: boolean
) {
    return {
        state,
        data: {
            ...data,
            contacts: value
                ? [...data.contacts, contact]
                : data.contacts.filter((x) => x.contact != contact.contact),
        },
    };
}

function Component(props: Props) {
    return (
        <>
            <div>
                <FormWrapper label="Date Sent">
                    <widgets.addedDateTime />
                </FormWrapper>
                <FieldRow>
                    <FormWrapper label="Name">
                        <StaticTextField value={props.data.contact.name} />
                    </FormWrapper>
                    <FormWrapper label="Email">
                        <StaticTextField value={props.data.contact.email} />
                    </FormWrapper>
                </FieldRow>

                <FormWrapper label="Survey Link">
                    <a href={"/survey/" + props.data.id.uuid + ""}>
                        https://dropsheet.remdal.com/survey/{props.data.id.uuid}
                    </a>
                </FormWrapper>

                <DeleteButton />
            </div>
        </>
    );
}

function Question(props: { question: SiteVisitReportQuestion }) {
    const answer = find(
        props.question.answers,
        (x) => x.id.uuid == props.question.selectedAnswer
    );
    return (
        <FormWrapper label={props.question.question}>
            <StaticTextField
                value={answer ? `${answer.name} (${answer.score})` : ""}
            />
            <textarea disabled>{props.question.comment}</textarea>
        </FormWrapper>
    );
}

function SectionWidget(
    index: number
): RecordWidget<{}, CustomerSurvey, {}, {}, {}> {
    return {
        dataMeta: CUSTOMER_SURVEY_META,
        reactContext: undefined as any,
        fieldWidgets: undefined as any,
        initialize(data: CustomerSurvey, context) {
            return { data, state: {} };
        },
        component(props) {
            const section = props.data.sections[index];
            return (
                <>
                    <h1>{section.name}</h1>
                    {section.questions.map((question, index) => (
                        <Question question={question} key={index} />
                    ))}
                    {index == props.data.sections.length - 1 && (
                        <FormWrapper label="Please confirm your email address">
                            <StaticTextField value={props.data.customerEmail} />
                        </FormWrapper>
                    )}
                </>
            );
        },
        reduce(state, data, action, context) {
            return { state, data };
        },
        validate(data, cache) {
            return [];
        },
    };
}

const SectionWidgetFactory = memoize(SectionWidget);

export const CustomerSurveyWidget = PaginatedWidget({
    dataMeta: CUSTOMER_SURVEY_META,
    pages(data) {
        return [
            {
                id: "main",
                title: "Customer Survey",
                widget: Widget,
            },
            ...data.sections.map((section, index) => ({
                id: `section-${index}`,
                title: section.name,
                widget: SectionWidgetFactory(index),
            })),
        ];
    },
});

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.addedDateTime>;
type ExtraProps = {};
type BaseState = {
    addedDateTime: WidgetState<typeof Fields.addedDateTime>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "ADDED_DATE_TIME";
          action: WidgetAction<typeof Fields.addedDateTime>;
      }
    | { type: "UPDATE_CONTACT"; contact: ContactDetail; value: boolean };

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
        case "UPDATE_CONTACT":
            return actionUpdateContact(
                state,
                data,
                action.contact,
                action.value
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
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: CUSTOMER_SURVEY_META,
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
        let state = {
            initialParameters: parameters,
            addedDateTime: addedDateTimeState,
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
                <RecordContext meta={CUSTOMER_SURVEY_META} value={props.data}>
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
};
// END MAGIC -- DO NOT EDIT
