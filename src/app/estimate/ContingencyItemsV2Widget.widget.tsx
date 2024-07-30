import Decimal from "decimal.js";
import * as React from "react";
import { Button } from "react-bootstrap";
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
import { duplicateIndex, ListWidget } from "../../clay/widgets/ListWidget";
import { CONTENT_AREA, TABLE_STYLE } from "../styles";
import EstimateContingencyItemV2Widget from "./ContingencyItemV2Widget.widget";
import { ACTION_TABLE_STYLE } from "./side/SideWidget.widget";
import { Side, SIDE_META } from "./side/table";
import { contingencySide, Estimate, ESTIMATE_META } from "./table";
import { ItemType, ITEM_TYPE_META } from "./types/table";

export type Data = Estimate;

export const Fields = {
    contingencyItemsV2: Optional(ListWidget(EstimateContingencyItemV2Widget)),
};

function actionDuplicateContingencyItem(
    state: State,
    data: Estimate,
    index: number,
    name: string
) {
    return {
        data: {
            ...data,
            contingencyItemsV2: duplicateIndex(
                data.contingencyItemsV2,
                index,
                (old) => ({
                    ...old,
                    estimate: {
                        ...old.estimate,
                        id: newUUID(),
                        name,
                    },
                })
            ),
        },
        state: {
            ...state,
            contingencyItemsV2: {
                ...state.contingencyItemsV2,
                items: duplicateIndex(state.contingencyItemsV2.items, index),
            },
        },
    };
}

function actionAddContingencyItem(
    state: State,
    data: Estimate,
    itemType: ItemType
) {
    const ESTIMATE_ACTION = {
        id: newUUID(),
        name: itemType.name,
        itemType: itemType.id.uuid,
        unitType: itemType.defaultUnitType,
        calculator: itemType.calculator,
        application: null,
        applicationType: null,
        hourRatio: new Decimal(1),
        materialsRatio: new Decimal(0),
        materialsRate: new Decimal(0),
        hourRate: null,
        unitIncrement: new Decimal(1),
        customUnitRate: null,
        finishSchedule: "",
        rateName: "",
        copyUnitsFromAction: null,
        markup: null,
    };
    const EMPTY_ACTION = {
        hours: new Decimal(0),
        materials: new Decimal(0),
        units: null,
        calculatorUnits: [],
        sealantCalculatorUnits: [],
        exclusions: [],
        warrantyExclusions: [],
        fieldNotes: [],
        note: { url: "" },
        overrideCopyUnits: false,
    };

    const newContingencyItem = {
        side: EMPTY_ACTION,
        estimate: ESTIMATE_ACTION,
        areas: [],
    };
    const inner = EstimateContingencyItemV2Widget.initialize(
        newContingencyItem,
        {}
    );
    return {
        state: {
            ...state,
            contingencyItemsV2: {
                ...state.contingencyItemsV2,
                items: [...state.contingencyItemsV2.items, inner.state],
            },
        },
        data: {
            ...data,
            contingencyItemsV2: [...data.contingencyItemsV2, inner.data],
        },
    };
}

function Component(props: Props) {
    const [addingItem, setAddingItem] = React.useState(false);
    const contingencyItems = (
        useQuickAllRecordsSorted(ITEM_TYPE_META, (record) => record.name) || []
    ).filter((item) => item.contingency);

    const side = React.useMemo<Side>(
        () => contingencySide(props.data),
        [props.data.contingencyItemsV2]
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
                    {contingencyItems.map((itemType) => (
                        <Button
                            key={itemType.id.uuid}
                            onClick={() => {
                                props.dispatch({
                                    type: "ADD_CONTINGENCY_ITEM",
                                    itemType,
                                });
                                setAddingItem(false);
                            }}
                        >
                            {itemType.name}
                        </Button>
                    ))}
                </div>
            </Modal>
            <div {...CONTENT_AREA}>
                <table {...ACTION_TABLE_STYLE} {...TABLE_STYLE}>
                    <thead>
                        <tr>
                            <th style={{ width: "1em" }} />
                            <th style={{ width: "15em" }}>Name</th>
                            <th />
                            <th>Units</th>
                            <th>Unit Rate</th>
                            <th>w/ Markup</th>
                            <th style={{ width: "8em" }}>Markup</th>
                            <th>Cost</th>
                            <th>Price</th>
                            <th>Areas</th>
                            <th />
                        </tr>
                    </thead>
                    <RecordContext meta={SIDE_META} value={side}>
                        <widgets.contingencyItemsV2 containerClass="tbody" />
                    </RecordContext>
                </table>
            </div>
            <Button onClick={() => setAddingItem(true)}>
                Add Contingency Item
            </Button>
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.contingencyItemsV2>;
type ExtraProps = {};
type BaseState = {
    contingencyItemsV2: WidgetState<typeof Fields.contingencyItemsV2>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "CONTINGENCY_ITEMS_V2";
          action: WidgetAction<typeof Fields.contingencyItemsV2>;
      }
    | { type: "DUPLICATE_CONTINGENCY_ITEM"; index: number; name: string }
    | { type: "ADD_CONTINGENCY_ITEM"; itemType: ItemType };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.contingencyItemsV2,
        data.contingencyItemsV2,
        cache,
        "contingencyItemsV2",
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
        case "CONTINGENCY_ITEMS_V2": {
            const inner = Fields.contingencyItemsV2.reduce(
                state.contingencyItemsV2,
                data.contingencyItemsV2,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contingencyItemsV2: inner.state },
                data: { ...data, contingencyItemsV2: inner.data },
            };
        }
        case "DUPLICATE_CONTINGENCY_ITEM":
            return actionDuplicateContingencyItem(
                state,
                data,
                action.index,
                action.name
            );
        case "ADD_CONTINGENCY_ITEM":
            return actionAddContingencyItem(state, data, action.itemType);
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
    contingencyItemsV2: function (
        props: WidgetExtraProps<typeof Fields.contingencyItemsV2> & {
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
            <Fields.contingencyItemsV2.component
                state={context.state.contingencyItemsV2}
                data={context.data.contingencyItemsV2}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contingency Items V2"}
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
        let contingencyItemsV2State;
        {
            const inner = Fields.contingencyItemsV2.initialize(
                data.contingencyItemsV2,
                subcontext,
                subparameters.contingencyItemsV2
            );
            contingencyItemsV2State = inner.state;
            data = { ...data, contingencyItemsV2: inner.data };
        }
        let state = {
            initialParameters: parameters,
            contingencyItemsV2: contingencyItemsV2State,
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
    contingencyItemsV2: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contingencyItemsV2>
    >;
};
// END MAGIC -- DO NOT EDIT
