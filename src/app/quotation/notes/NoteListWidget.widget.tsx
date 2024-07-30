import * as React from "react";
import { Dictionary } from "../../../clay/common";
import { propCheck } from "../../../clay/propCheck";
import { QuickCacheApi } from "../../../clay/quick-cache";
import { RemoveButton } from "../../../clay/remove-button";
import { DefaultLinkSetWidget } from "../../../clay/widgets/default-link-set-widget";
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
import {
    ListWidget,
    useListItemContext,
} from "../../../clay/widgets/ListWidget";
import { TextWidget } from "../../../clay/widgets/TextWidget";
import {
    DetailSheet,
    DetailSheetOption,
} from "../../project/detail-sheet/table";
import { TABLE_LEFT_STYLE } from "../../styles";
import { Quotation, QuotationOption } from "../table";
import NoteWidget from "./NoteWidget.widget";
import { NoteList, NOTE_LIST_META } from "./table";

export type Data = NoteList;

const Fields = {
    name: FormField(TextWidget),
    options: FormField(
        DefaultLinkSetWidget<QuotationOption | DetailSheetOption>({
            name: (option) => option.name,
        })
    ),
    notes: ListWidget(NoteWidget, { emptyOk: true }),
};

function actionFixMe(state: State, data: Data) {
    return {
        state,
        data: {
            ...data,
            options: null,
        },
    };
}

export type ExtraProps = {
    quotation?: Quotation | DetailSheet;
};

function Component(props: Props) {
    const listItemContentext = useListItemContext();
    return (
        <div
            {...listItemContentext.draggableProps}
            style={{
                ...listItemContentext.draggableProps,
                marginBottom: "10px",
            }}
        >
            <table {...TABLE_LEFT_STYLE}>
                <thead>
                    <tr>
                        <td colSpan={3}>
                            {listItemContentext.dragHandle}
                            <widgets.name />
                        </td>
                        <td>
                            {props.quotation && (
                                <div style={{ maxWidth: "25em" }}>
                                    <widgets.options
                                        records={props.quotation.options}
                                        default={(
                                            props.quotation.options.slice(
                                                0,
                                                1
                                            ) as (
                                                | DetailSheetOption
                                                | QuotationOption
                                            )[]
                                        ).map(
                                            (
                                                option:
                                                    | DetailSheetOption
                                                    | QuotationOption
                                            ) => option.id.uuid
                                        )}
                                    />
                                </div>
                            )}
                        </td>
                        <td style={{ flexGrow: 0 }}>
                            <FormWrapper label="">
                                <RemoveButton />
                            </FormWrapper>
                        </td>
                    </tr>
                </thead>
                <widgets.notes
                    extraItemForAdd
                    itemProps={{
                        quotation: props.quotation,
                        defaultOptions:
                            props.data.options === null && props.quotation
                                ? (
                                      props.quotation!.options.slice(0, 1) as (
                                          | DetailSheetOption
                                          | QuotationOption
                                      )[]
                                  ).map(
                                      (
                                          option:
                                              | DetailSheetOption
                                              | QuotationOption
                                      ) => option.id.uuid
                                  )
                                : props.data.options || [],
                    }}
                    containerClass="tbody"
                />
            </table>
        </div>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.options> &
    WidgetContext<typeof Fields.notes>;
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    options: WidgetState<typeof Fields.options>;
    notes: WidgetState<typeof Fields.notes>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "OPTIONS"; action: WidgetAction<typeof Fields.options> }
    | { type: "NOTES"; action: WidgetAction<typeof Fields.notes> }
    | { type: "FIX_ME" };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.options, data.options, cache, "options", errors);
    subvalidate(Fields.notes, data.notes, cache, "notes", errors);
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
        case "NAME": {
            const inner = Fields.name.reduce(
                state.name,
                data.name,
                action.action,
                subcontext
            );
            return {
                state: { ...state, name: inner.state },
                data: { ...data, name: inner.data },
            };
        }
        case "OPTIONS": {
            const inner = Fields.options.reduce(
                state.options,
                data.options,
                action.action,
                subcontext
            );
            return {
                state: { ...state, options: inner.state },
                data: { ...data, options: inner.data },
            };
        }
        case "NOTES": {
            const inner = Fields.notes.reduce(
                state.notes,
                data.notes,
                action.action,
                subcontext
            );
            return {
                state: { ...state, notes: inner.state },
                data: { ...data, notes: inner.data },
            };
        }
        case "FIX_ME":
            return actionFixMe(state, data);
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
    name: function (
        props: WidgetExtraProps<typeof Fields.name> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "NAME", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "name", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.name.component
                state={context.state.name}
                data={context.data.name}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Name"}
            />
        );
    },
    options: function (
        props: WidgetExtraProps<typeof Fields.options> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "OPTIONS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "options", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.options.component
                state={context.state.options}
                data={context.data.options}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Options"}
            />
        );
    },
    notes: function (
        props: WidgetExtraProps<typeof Fields.notes> & {
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
            <Fields.notes.component
                state={context.state.notes}
                data={context.data.notes}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Notes"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: NOTE_LIST_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let nameState;
        {
            const inner = Fields.name.initialize(
                data.name,
                subcontext,
                subparameters.name
            );
            nameState = inner.state;
            data = { ...data, name: inner.data };
        }
        let optionsState;
        {
            const inner = Fields.options.initialize(
                data.options,
                subcontext,
                subparameters.options
            );
            optionsState = inner.state;
            data = { ...data, options: inner.data };
        }
        let notesState;
        {
            const inner = Fields.notes.initialize(
                data.notes,
                subcontext,
                subparameters.notes
            );
            notesState = inner.state;
            data = { ...data, notes: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            options: optionsState,
            notes: notesState,
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
                <RecordContext meta={NOTE_LIST_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    name: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.name>
    >;
    options: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.options>
    >;
    notes: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.notes>
    >;
};
// END MAGIC -- DO NOT EDIT
