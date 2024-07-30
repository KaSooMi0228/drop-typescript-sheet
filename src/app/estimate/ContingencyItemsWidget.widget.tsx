import Decimal from "decimal.js";
import * as React from "react";
import { Button, Table } from "react-bootstrap";
import Modal from "react-modal";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi } from "../../clay/quick-cache";
import { newUUID } from "../../clay/uuid";
import { useQuickAllRecordsSorted } from "../../clay/widgets/dropdown-link-widget";
import { Optional } from "../../clay/widgets/FormField";
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
import { ListWidget } from "../../clay/widgets/ListWidget";
import { TABLE_STYLE } from "../styles";
import EstimateContingencyItemWidget from "./EstimateContingencyItemWidget.widget";
import {
    Estimate,
    EstimateContingencyItemType,
    ESTIMATE_CONTINGENCY_ITEM_TYPE_META,
    ESTIMATE_META,
} from "./table";

export type Data = Estimate;

export const Fields = {
    contingencyItems: Optional(ListWidget(EstimateContingencyItemWidget)),
};

function actionAddContingencyItem(
    state: State,
    data: Estimate,
    contingencyItem: EstimateContingencyItemType
) {
    const newContingencyItem = {
        id: newUUID(),
        name: contingencyItem.name,
        substrate: contingencyItem.substrate,
        quantity: new Decimal(0),
        type: contingencyItem.type,
        rate: contingencyItem.rate,
        markup: new Decimal("0.47"),
        areas: [],
        finishSchedule: "",
    };
    const inner = EstimateContingencyItemWidget.initialize(
        newContingencyItem,
        {}
    );
    return {
        state: {
            ...state,
            contingencyItems: {
                ...state.contingencyItems,
                items: [...state.contingencyItems.items, inner.state],
            },
        },
        data: {
            ...data,
            contingencyItems: [...data.contingencyItems, inner.data],
        },
    };
}

function Component(props: Props) {
    const [addingItem, setAddingItem] = React.useState(false);
    const contingencyItems = useQuickAllRecordsSorted(
        ESTIMATE_CONTINGENCY_ITEM_TYPE_META,
        (record) => record.name
    );

    return (
        <>
            <Modal
                isOpen={addingItem}
                onRequestClose={() => setAddingItem(false)}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        rowGap: "1em",
                        columnGap: "5em",
                    }}
                >
                    {contingencyItems.map((contingencyItem) => (
                        <Button
                            key={contingencyItem.id.uuid}
                            onClick={() => {
                                props.dispatch({
                                    type: "ADD_CONTINGENCY_ITEM",
                                    contingencyItem,
                                });
                                setAddingItem(false);
                            }}
                        >
                            {contingencyItem.name}
                        </Button>
                    ))}
                </div>
            </Modal>
            <Table {...TABLE_STYLE}>
                <thead>
                    <tr>
                        <th />
                        <th>Name</th>
                        <th style={{ width: "180px" }}>Quantity</th>
                        <th style={{ width: "180px" }}>Type</th>
                        <th style={{ width: "180px" }}>Rate</th>
                        <th style={{ width: "180px" }}>Cost</th>
                        <th style={{ width: "180px" }}>Markup</th>
                        <th style={{ width: "180px" }}>Price</th>
                        {props.data.areas.length > 1 && <th>Areas</th>}
                        <th />
                    </tr>
                </thead>
                <widgets.contingencyItems containerClass="tbody" />
            </Table>
            <Button onClick={() => setAddingItem(true)}>
                Add Contingency Item
            </Button>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.contingencyItems>;
type ExtraProps = {};
type BaseState = {
    contingencyItems: WidgetState<typeof Fields.contingencyItems>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "CONTINGENCY_ITEMS";
          action: WidgetAction<typeof Fields.contingencyItems>;
      }
    | {
          type: "ADD_CONTINGENCY_ITEM";
          contingencyItem: EstimateContingencyItemType;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.contingencyItems,
        data.contingencyItems,
        cache,
        "contingencyItems",
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
        case "CONTINGENCY_ITEMS": {
            const inner = Fields.contingencyItems.reduce(
                state.contingencyItems,
                data.contingencyItems,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contingencyItems: inner.state },
                data: { ...data, contingencyItems: inner.data },
            };
        }
        case "ADD_CONTINGENCY_ITEM":
            return actionAddContingencyItem(
                state,
                data,
                action.contingencyItem
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
    contingencyItems: function (
        props: WidgetExtraProps<typeof Fields.contingencyItems> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTINGENCY_ITEMS",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "contingencyItems", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contingencyItems.component
                state={context.state.contingencyItems}
                data={context.data.contingencyItems}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contingency Items"}
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
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let contingencyItemsState;
        {
            const inner = Fields.contingencyItems.initialize(
                data.contingencyItems,
                subcontext,
                subparameters.contingencyItems
            );
            contingencyItemsState = inner.state;
            data = { ...data, contingencyItems: inner.data };
        }
        let state = {
            initialParameters: parameters,
            contingencyItems: contingencyItemsState,
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
                <RecordContext meta={ESTIMATE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    contingencyItems: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contingencyItems>
    >;
};
// END MAGIC -- DO NOT EDIT
