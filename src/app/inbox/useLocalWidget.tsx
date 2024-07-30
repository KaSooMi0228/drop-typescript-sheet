import React from "react";
import { useQuickCache } from "../../clay/quick-cache";
import { RecordWidget, Widget } from "../../clay/widgets";

function localWidgetInit<State, Data, Action>(props: {
    initial: Data | undefined;
    widget: RecordWidget<State, Data, {}, Action, {}>;
}) {
    const data = props.initial || props.widget.dataMeta.repair(undefined);
    const inner = props.widget.initialize(data, {});
    return inner;
}

export function useLocalWidget<State, Data, Action>(
    widget: RecordWidget<State, Data, {}, Action, {}>,
    initial?: Data
) {
    const reducer = React.useCallback(
        (state: { state: State; data: Data }, action: Action) => {
            return widget.reduce(state.state, state.data, action, {});
        },
        [widget]
    );

    const [state, dispatch] = React.useReducer(
        reducer,
        { widget, initial },
        localWidgetInit
    );

    const cache = useQuickCache();

    const validation = widget.validate(state.data, cache);

    const component = (
        <widget.component
            state={state.state}
            data={state.data}
            status={{
                mutable: true,
                validation,
            }}
            dispatch={dispatch}
        />
    );

    return {
        data: state.data,
        isValid: validation.length === 0,
        dispatch,
        component,
    };
}

export function useLocalFieldWidget<State, Data, Action, ExtraProps>(
    widget: Widget<State, Data, {}, Action, ExtraProps>,
    initialValue: Data,
    props: ExtraProps
) {
    const reducer = React.useCallback(
        (state: { state: State; data: Data }, action: Action) => {
            return widget.reduce(state.state, state.data, action, {});
        },
        [widget]
    );

    const widgetInit = React.useCallback(() => {
        const inner = widget.initialize(initialValue, {});
        return inner;
    }, [widget, initialValue]);

    const [state, dispatch] = React.useReducer(reducer, widget, widgetInit);

    const cache = useQuickCache();

    const validation = widget.validate(state.data, cache);

    const component = (
        <widget.component
            state={state.state}
            data={state.data}
            status={{
                mutable: true,
                validation,
            }}
            dispatch={dispatch}
            {...props}
        />
    );

    return {
        data: state.data,
        isValid: validation.length === 0,
        dispatch,
        component,
    };
}

export function useControlledWidget<State, Data, Action>(
    widget: RecordWidget<State, Data, {}, Action, {}>,
    data: Data,
    updateData: (data: Data) => void
) {
    const reducer = React.useCallback(
        (state: { state: State; data: Data }, action: Action) => {
            return widget.reduce(state.state, state.data, action, {});
        },
        [widget]
    );

    const widgetInit = React.useCallback(() => {
        const inner = widget.initialize(data, {});
        return inner;
    }, [widget]);

    const [state, dispatch] = React.useReducer(reducer, widget, widgetInit);

    React.useEffect(() => {
        updateData(data);
    }, [data]);

    const cache = useQuickCache();

    const validation = widget.validate(state.data, cache);

    const component = (
        <widget.component
            state={state.state}
            data={state.data}
            status={{
                mutable: true,
                validation,
            }}
            dispatch={dispatch}
        />
    );

    return {
        isValid: validation.length === 0,
        dispatch,
        component,
    };
}
