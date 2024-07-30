import { diff } from "jsondiffpatch";
import React from "react";
import { fetchRawRecord, patchRecord } from "../../clay/api";
import { PageContext, usePageContext } from "../../clay/Page";
import { useQuickCache } from "../../clay/quick-cache";
import { UUID } from "../../clay/uuid";
import { RecordWidget } from "../../clay/widgets";
import { ITEM_TYPE } from "./types";

type RecordWidgetState<Data, State> = {
    base: any;
    data: Data | null;
    state: State | null;
};
type RecordWidgetAction<Data, Action> =
    | {
          type: "LOAD";
          record: any;
      }
    | {
          type: "WIDGET";
          action: Action;
      };

export function useRecordWidget<State, Data extends { id: UUID }, Action>(
    widget: RecordWidget<State, Data, PageContext, Action, {}>,
    id: string,
    setOpenItem: (item: ITEM_TYPE | null) => void,
    mutable: boolean = true
) {
    const pageContext = usePageContext();

    const reducer = React.useCallback(
        (
            state: RecordWidgetState<Data, State>,
            action: RecordWidgetAction<Data, Action>
        ): RecordWidgetState<Data, State> => {
            switch (action.type) {
                case "LOAD":
                    const data = widget.dataMeta.fromJSON(action.record);
                    return {
                        base: action.record,
                        ...widget.initialize(data, pageContext),
                    };
                case "WIDGET":
                    return {
                        base: state.base,
                        ...widget.reduce(
                            state.state!,
                            state.data!,
                            action.action,
                            pageContext
                        ),
                    };
            }
        },
        [widget, pageContext]
    );

    const [state, dispatch] = React.useReducer(reducer, {
        data: null,
        state: null,
    } as RecordWidgetState<Data, State>);

    React.useEffect(() => {
        fetchRawRecord(widget.dataMeta, id).then((project) =>
            dispatch({ type: "LOAD", record: project! })
        );
    }, [widget, id]);

    const cache = useQuickCache();

    const widgetDispatch = React.useCallback(
        (action) => dispatch({ type: "WIDGET", action }),
        [dispatch]
    );

    const onSave = React.useCallback(() => {
        const patch = diff(state.base, widget.dataMeta.toJSON(state.data!));
        patchRecord(widget.dataMeta, "inbox", state.data!.id.uuid, patch).then(
            () => setOpenItem(null)
        );
    }, [state, setOpenItem]);

    const validation = state.data ? widget.validate(state.data, cache) : [];

    const component =
        state.data && state.state ? (
            <widget.component
                state={state.state}
                data={state.data}
                status={{
                    mutable,
                    validation,
                }}
                dispatch={widgetDispatch}
            />
        ) : (
            <></>
        );
    return {
        data: state.data,
        dispatch: widgetDispatch,
        onSave,
        isValid: validation.length === 0,
        component,
    };
}
