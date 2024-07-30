import React from "react";
import { Typeahead } from "react-bootstrap-typeahead";
import { useId } from "react-id-generator";
import { Dictionary } from "../clay/common";
import { propCheck } from "../clay/propCheck";
import { QuickCacheApi } from "../clay/quick-cache";
import { RemoveButton } from "../clay/remove-button";
import { lookupPlace, useAutocomplete } from "../clay/requests/geocode";
import { statusToState, WidgetResult } from "../clay/widgets";
import {
    FormField,
    FormWrapper,
    OptionalFormField,
} from "../clay/widgets/FormField";
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
    WidgetState,
    WidgetStatus,
} from "../clay/widgets/index";
import { useListItemContext } from "../clay/widgets/ListWidget";
import { TextWidget } from "../clay/widgets/TextWidget";
import { Address, ADDRESS_META } from "./address";

export type Data = Address;
export const Fields = {
    line1: FormField(TextWidget),
    unitNumber: OptionalFormField(TextWidget),
    city: FormField(TextWidget),
    province: FormField(TextWidget),
    postal: OptionalFormField(TextWidget),
};

export type ExtraProps = {
    label?: string;
};

type ExtraActions =
    | {
          type: "SET_PLACE";
          place: google.maps.places.PlaceResult;
      }
    | {
          type: "LINE1_CHANGE";
          text: string;
      };

function reduce(
    state: State,
    data: Address,
    action: Action,
    context: Context
): WidgetResult<State, Address> {
    switch (action.type) {
        case "SET_PLACE":
            const newAddress = {
                ...data,
            };
            if (action.place.address_components) {
                for (const component of action.place.address_components) {
                    for (const component_type of component.types) {
                        switch (component_type) {
                            case "locality":
                                newAddress.city = component.long_name;
                                break;
                            case "administrative_area_level_1":
                                newAddress.province = component.short_name;
                                break;
                            case "postal_code":
                                newAddress.postal = component.short_name;
                                break;
                        }
                    }
                }
            }
            return {
                state,
                data: newAddress,
            };
        case "LINE1_CHANGE":
            return {
                state,
                data: {
                    ...data,
                    line1: action.text,
                },
            };
        default:
            return baseReduce(state, data, action, context);
    }
}

function initialize(data: Address, context: Context) {
    return {
        state: {},
        data: data,
    };
}

function Component(props: Props) {
    const autocompletes = useAutocomplete(props.data.line1);
    const listItemContext = useListItemContext();
    const widgetId = useId()[0];
    async function onChange(selected: any[]) {
        if (selected.length > 0) {
            props.dispatch({
                type: "LINE1_CHANGE",
                text: selected[0].structured_formatting.main_text,
            });

            const place = await lookupPlace({ placeId: selected[0].place_id });
            props.dispatch({
                type: "SET_PLACE",
                place,
            });
        }
    }
    return (
        <div
            {...listItemContext.draggableProps}
            style={{ ...listItemContext.draggableProps.style, display: "flex" }}
        >
            {listItemContext.dragHandle && (
                <FormWrapper label=" " style={{ marginRight: "1em" }}>
                    {listItemContext.dragHandle}
                </FormWrapper>
            )}
            <FormWrapper
                label={props.label || "Address"}
                style={{ flexGrow: 2 }}
            >
                <div
                    className={
                        "address-typeahead form-control " +
                        statusToState(
                            props.status.validation,
                            props.data.line1 === ""
                        )
                    }
                >
                    <Typeahead
                        id={widgetId}
                        labelKey="description"
                        selected={[
                            {
                                description: props.data.line1,
                            } as google.maps.places.AutocompletePrediction,
                        ]}
                        options={autocompletes.data || []}
                        onInputChange={(text) =>
                            props.dispatch({
                                type: "LINE1_CHANGE",
                                text,
                            })
                        }
                        onChange={onChange}
                        disabled={!props.status.mutable}
                    />
                </div>
            </FormWrapper>
            <div style={{ flexGrow: 1, marginLeft: "20px" }}>
                <widgets.unitNumber hideStatus />
            </div>
            <div style={{ flexGrow: 1, marginLeft: "20px" }}>
                <widgets.city hideStatus />
            </div>
            <div style={{ width: "8em", marginLeft: "20px" }}>
                <widgets.province hideStatus />
            </div>
            <div style={{ width: "8em", marginLeft: "20px" }}>
                <widgets.postal hideStatus label="Postal Code" />
            </div>
            <FormWrapper label=" ">
                <RemoveButton />
            </FormWrapper>
        </div>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.line1> &
    WidgetContext<typeof Fields.unitNumber> &
    WidgetContext<typeof Fields.city> &
    WidgetContext<typeof Fields.province> &
    WidgetContext<typeof Fields.postal>;
type BaseState = {
    line1: WidgetState<typeof Fields.line1>;
    unitNumber: WidgetState<typeof Fields.unitNumber>;
    city: WidgetState<typeof Fields.city>;
    province: WidgetState<typeof Fields.province>;
    postal: WidgetState<typeof Fields.postal>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "LINE1"; action: WidgetAction<typeof Fields.line1> }
    | { type: "UNIT_NUMBER"; action: WidgetAction<typeof Fields.unitNumber> }
    | { type: "CITY"; action: WidgetAction<typeof Fields.city> }
    | { type: "PROVINCE"; action: WidgetAction<typeof Fields.province> }
    | { type: "POSTAL"; action: WidgetAction<typeof Fields.postal> };

export type Action = ExtraActions | BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps> & ExtraProps;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.line1, data.line1, cache, "line1", errors);
    subvalidate(
        Fields.unitNumber,
        data.unitNumber,
        cache,
        "unitNumber",
        errors
    );
    subvalidate(Fields.city, data.city, cache, "city", errors);
    subvalidate(Fields.province, data.province, cache, "province", errors);
    subvalidate(Fields.postal, data.postal, cache, "postal", errors);
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
        case "LINE1": {
            const inner = Fields.line1.reduce(
                state.line1,
                data.line1,
                action.action,
                subcontext
            );
            return {
                state: { ...state, line1: inner.state },
                data: { ...data, line1: inner.data },
            };
        }
        case "UNIT_NUMBER": {
            const inner = Fields.unitNumber.reduce(
                state.unitNumber,
                data.unitNumber,
                action.action,
                subcontext
            );
            return {
                state: { ...state, unitNumber: inner.state },
                data: { ...data, unitNumber: inner.data },
            };
        }
        case "CITY": {
            const inner = Fields.city.reduce(
                state.city,
                data.city,
                action.action,
                subcontext
            );
            return {
                state: { ...state, city: inner.state },
                data: { ...data, city: inner.data },
            };
        }
        case "PROVINCE": {
            const inner = Fields.province.reduce(
                state.province,
                data.province,
                action.action,
                subcontext
            );
            return {
                state: { ...state, province: inner.state },
                data: { ...data, province: inner.data },
            };
        }
        case "POSTAL": {
            const inner = Fields.postal.reduce(
                state.postal,
                data.postal,
                action.action,
                subcontext
            );
            return {
                state: { ...state, postal: inner.state },
                data: { ...data, postal: inner.data },
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
    line1: function (
        props: WidgetExtraProps<typeof Fields.line1> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "LINE1", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "line1", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.line1.component
                state={context.state.line1}
                data={context.data.line1}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Line1"}
            />
        );
    },
    unitNumber: function (
        props: WidgetExtraProps<typeof Fields.unitNumber> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "UNIT_NUMBER",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "unitNumber", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.unitNumber.component
                state={context.state.unitNumber}
                data={context.data.unitNumber}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Unit Number"}
            />
        );
    },
    city: function (
        props: WidgetExtraProps<typeof Fields.city> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({ type: "CITY", action }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "city", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.city.component
                state={context.state.city}
                data={context.data.city}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "City"}
            />
        );
    },
    province: function (
        props: WidgetExtraProps<typeof Fields.province> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROVINCE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "province", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.province.component
                state={context.state.province}
                data={context.data.province}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Province"}
            />
        );
    },
    postal: function (
        props: WidgetExtraProps<typeof Fields.postal> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "POSTAL",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "postal", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.postal.component
                state={context.state.postal}
                data={context.data.postal}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Postal"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ADDRESS_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        const result = initialize(data, context);
        data = result.data;
        let subparameters: Dictionary<string[]> =
            (result as any).parameters || {};
        let subcontext = context;
        let line1State;
        {
            const inner = Fields.line1.initialize(
                data.line1,
                subcontext,
                subparameters.line1
            );
            line1State = inner.state;
            data = { ...data, line1: inner.data };
        }
        let unitNumberState;
        {
            const inner = Fields.unitNumber.initialize(
                data.unitNumber,
                subcontext,
                subparameters.unitNumber
            );
            unitNumberState = inner.state;
            data = { ...data, unitNumber: inner.data };
        }
        let cityState;
        {
            const inner = Fields.city.initialize(
                data.city,
                subcontext,
                subparameters.city
            );
            cityState = inner.state;
            data = { ...data, city: inner.data };
        }
        let provinceState;
        {
            const inner = Fields.province.initialize(
                data.province,
                subcontext,
                subparameters.province
            );
            provinceState = inner.state;
            data = { ...data, province: inner.data };
        }
        let postalState;
        {
            const inner = Fields.postal.initialize(
                data.postal,
                subcontext,
                subparameters.postal
            );
            postalState = inner.state;
            data = { ...data, postal: inner.data };
        }
        let state = {
            initialParameters: parameters,
            ...result.state,
            line1: line1State,
            unitNumber: unitNumberState,
            city: cityState,
            province: provinceState,
            postal: postalState,
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
                <RecordContext meta={ADDRESS_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
};
export default Widget;
type Widgets = {
    line1: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.line1>
    >;
    unitNumber: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.unitNumber>
    >;
    city: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.city>
    >;
    province: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.province>
    >;
    postal: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.postal>
    >;
};
// END MAGIC -- DO NOT EDIT
