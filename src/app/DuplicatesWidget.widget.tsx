import { diff } from "jsondiffpatch";
import * as React from "react";
import { Breadcrumb, Button, Tab, Tabs } from "react-bootstrap";
import {
    deleteRecord,
    fetchRawRecord,
    patchRecord,
    useRawRecordQuery,
} from "../clay/api";
import { Dictionary } from "../clay/common";
import { Link } from "../clay/link";
import { Meta, RecordMeta } from "../clay/meta";
import { BaseAction as PageBaseAction, Page } from "../clay/Page";
import { propCheck } from "../clay/propCheck";
import { QuickCacheApi } from "../clay/quick-cache";
import { FormWrapper } from "../clay/widgets/FormField";
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
} from "../clay/widgets/index";
import { CompanyLinkWidget } from "./company";
import { Company, COMPANY_META } from "./company/table";
import { ContactLinkWidget } from "./contact/link";
import { Contact, CONTACT_META } from "./contact/table";
import { useLocalWidget } from "./inbox/useLocalWidget";
import { TABLES_META } from "./tables";
import { UserLinkWidget } from "./user";
import { User, USER_META } from "./user/table";

//!Data
export type DuplicatesWidgetDataX = {
    contactSource: Link<Contact>;
    contactDestination: Link<Contact>;

    companySource: Link<Company>;
    companyDestination: Link<Company>;

    userSource: Link<User>;
    userDestination: Link<User>;
};

export type Data = DuplicatesWidgetDataX;

const Fields = {
    contactSource: ContactLinkWidget,
    contactDestination: ContactLinkWidget,

    companySource: CompanyLinkWidget,
    companyDestination: CompanyLinkWidget,

    userSource: UserLinkWidget,
    userDestination: UserLinkWidget,
};

function collectLinks(
    links: string[],
    arrayLinks: string[],
    meta: Meta,
    linkTable: string,
    prefix: string
) {
    switch (meta.type) {
        case "record":
            for (const [field, fieldMeta] of Object.entries(meta.fields)) {
                collectLinks(
                    links,
                    arrayLinks,
                    fieldMeta,
                    linkTable,
                    prefix ? prefix + "." + field : field
                );
            }
            break;
        case "array":
            collectLinks(arrayLinks, arrayLinks, meta.items, linkTable, prefix);
            break;

        case "uuid":
            if (meta.linkTo == linkTable) {
                links.push(prefix);
            }
            break;
    }
}

function lookupAllUses(linkTableName: string, id: string | null) {
    const records: Dictionary<any> = {};
    for (const [tableName, table] of Object.entries(TABLES_META)) {
        const { links, arrayLinks } = React.useMemo(() => {
            const links: string[] = [];
            const arrayLinks: string[] = [];
            collectLinks(links, arrayLinks, table, linkTableName, "");
            return { links, arrayLinks };
        }, []);

        if (arrayLinks.length > 0 || links.length > 0) {
            records[tableName] = useRawRecordQuery(
                table,
                {
                    filters: [
                        {
                            or: [
                                ...links.map((link) => ({
                                    column: link,
                                    filter: {
                                        equal: id,
                                    },
                                })),
                                ...arrayLinks.map((link) => ({
                                    column: link,
                                    filter: {
                                        intersects: [id],
                                    },
                                })),
                            ],
                        },
                    ],
                },
                [id],
                !!id
            );
        }
    }
    return records;
}

function updateRecord(
    meta: Meta,
    linkTableName: string,
    record: any,
    source: string,
    destination: string
) {
    switch (meta.type) {
        case "record":
            const newRecord: any = {};
            for (const [field, fieldMeta] of Object.entries(meta.fields)) {
                newRecord[field] = updateRecord(
                    fieldMeta,
                    linkTableName,
                    record[field],
                    source,
                    destination
                );
            }
            return newRecord;
        case "array":
            return record.map((item: any) =>
                updateRecord(
                    meta.items,
                    linkTableName,
                    item,
                    source,
                    destination
                )
            );
        case "uuid":
            if (meta.linkTo === linkTableName && record == source) {
                return destination;
            } else {
                return record;
            }
        default:
            return record;
    }
}

function findChanges(
    linkTableName: string,
    source: string | null,
    destination: string | null
) {
    const records = lookupAllUses(linkTableName, source);

    const patches = [];

    if (source && destination) {
        for (const [tableName, tableRecords] of Object.entries(records)) {
            if (tableRecords === undefined) {
                return undefined;
            }

            for (const record of tableRecords) {
                const updatedRecord = updateRecord(
                    TABLES_META[tableName],
                    linkTableName,
                    record,
                    source,
                    destination
                );
                const patch = diff(record, updatedRecord);
                patches.push({
                    meta: TABLES_META[tableName],
                    id: record.id,
                    patch,
                });
            }
        }
        return patches;
    } else {
        return undefined;
    }
}

function DuplicateHandler<T>(props: {
    table: RecordMeta<any, any, any>;
    source: Link<T>;
    destination: Link<T>;
    sourceWidget: React.FunctionComponent;
    destinationWidget: React.FunctionComponent;
    clearSource: () => void;
}) {
    const changes = findChanges(
        props.table.name,
        props.source,
        props.destination
    );

    const onApply = React.useCallback(async () => {
        if (changes && confirm("Are you sure you want to merge?")) {
            const x = await Promise.all(
                changes.map((change) =>
                    patchRecord(change.meta, "Merge", change.id, change.patch)
                )
            );
            if (props.table.name === "Contact") {
                const oldRecord = await fetchRawRecord(
                    props.table,
                    props.source!
                );
                const newRecord = await fetchRawRecord(
                    props.table,
                    props.destination!
                );

                const updatedRecord = {
                    ...newRecord,
                    companyHistory: [
                        ...oldRecord.companyHistory,
                        ...newRecord.companyHistory,
                    ],
                };

                const patch = diff(newRecord, updatedRecord);
                if (patch !== undefined) {
                    await patchRecord(
                        props.table,
                        "Duplicator",
                        props.destination!,
                        patch
                    );
                }
            }
            await deleteRecord(props.table, "Merge", props.source!);
            props.clearSource();
            alert("Records Merged");
        }
    }, [changes, props.table, props.destination]);
    return (
        <Tab
            eventKey={props.table.name}
            title={props.table.name}
            style={{ margin: "1em", flex: 1 }}
        >
            <FormWrapper label="Correct">
                <props.destinationWidget />
            </FormWrapper>
            <FormWrapper label="Duplicate">
                <props.sourceWidget />
            </FormWrapper>
            <Button onClick={onApply} disabled={changes == undefined}>
                Apply Changes To {changes?.length} Records
            </Button>
        </Tab>
    );
}

function Component(props: Props) {
    return (
        <Tabs id="duplicates">
            {DuplicateHandler({
                table: CONTACT_META,
                source: props.data.contactSource,
                destination: props.data.contactDestination,
                sourceWidget: widgets.contactSource,
                destinationWidget: widgets.contactDestination,
                clearSource: () => {
                    props.dispatch({
                        type: "CONTACT_SOURCE",
                        action: {
                            type: "SELECT",
                            id: null,
                        },
                    });
                },
            })}
            {DuplicateHandler({
                table: COMPANY_META,
                source: props.data.companySource,
                destination: props.data.companyDestination,
                sourceWidget: widgets.companySource,
                destinationWidget: widgets.companyDestination,
                clearSource: () => {
                    props.dispatch({
                        type: "COMPANY_SOURCE",
                        action: {
                            type: "SELECT",
                            id: null,
                        },
                    });
                },
            })}
            {DuplicateHandler({
                table: USER_META,
                source: props.data.userSource,
                destination: props.data.userDestination,
                sourceWidget: widgets.userSource,
                destinationWidget: widgets.userDestination,
                clearSource: () => {
                    props.dispatch({
                        type: "USER_SOURCE",
                        action: {
                            type: "SELECT",
                            id: null,
                        },
                    });
                },
            })}
        </Tabs>
    );
}

type DuplicatesState = {};

type DuplicatesAction = PageBaseAction;

export const DuplicatesPage: Page<DuplicatesState, DuplicatesAction> = {
    initialize(segments, parameters) {
        return {
            state: {},
            requests: [],
        };
    },
    reduce(state, action, context) {
        switch (action.type) {
            case "PAGE_ACTIVATED":
            case "HEARTBEAT":
                return {
                    state,
                    requests: [],
                };
            case "UPDATE_PARAMETERS":
                return {
                    state: {},
                    requests: [],
                };
        }
    },
    component(props) {
        const { component } = useLocalWidget(Widget);

        return <>{component}</>;
    },
    headerComponent() {
        return (
            <>
                <Breadcrumb>
                    <Breadcrumb.Item href="#/">Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item href="#/admin/">Settings</Breadcrumb.Item>

                    <Breadcrumb.Item active>Duplicates</Breadcrumb.Item>
                </Breadcrumb>
                <div style={{ flexGrow: 1 }} />
            </>
        );
    },
    encodeState(state) {
        return {
            segments: [],
            parameters: {},
        };
    },
    hasUnsavedChanges() {
        return false;
    },
    title() {
        return "Duplicates";
    },
    beforeUnload() {
        return false;
    },
};

// BEGIN MAGIC -- DO NOT EDIT
export type DuplicatesWidgetDataXJSON = {
    contactSource: string | null;
    contactDestination: string | null;
    companySource: string | null;
    companyDestination: string | null;
    userSource: string | null;
    userDestination: string | null;
};

export function JSONToDuplicatesWidgetDataX(
    json: DuplicatesWidgetDataXJSON
): DuplicatesWidgetDataX {
    return {
        contactSource: json.contactSource,
        contactDestination: json.contactDestination,
        companySource: json.companySource,
        companyDestination: json.companyDestination,
        userSource: json.userSource,
        userDestination: json.userDestination,
    };
}
export type DuplicatesWidgetDataXBrokenJSON = {
    contactSource?: string | null;
    contactDestination?: string | null;
    companySource?: string | null;
    companyDestination?: string | null;
    userSource?: string | null;
    userDestination?: string | null;
};

export function newDuplicatesWidgetDataX(): DuplicatesWidgetDataX {
    return JSONToDuplicatesWidgetDataX(
        repairDuplicatesWidgetDataXJSON(undefined)
    );
}
export function repairDuplicatesWidgetDataXJSON(
    json: DuplicatesWidgetDataXBrokenJSON | undefined
): DuplicatesWidgetDataXJSON {
    if (json) {
        return {
            contactSource: json.contactSource || null,
            contactDestination: json.contactDestination || null,
            companySource: json.companySource || null,
            companyDestination: json.companyDestination || null,
            userSource: json.userSource || null,
            userDestination: json.userDestination || null,
        };
    } else {
        return {
            contactSource: undefined || null,
            contactDestination: undefined || null,
            companySource: undefined || null,
            companyDestination: undefined || null,
            userSource: undefined || null,
            userDestination: undefined || null,
        };
    }
}

export function DuplicatesWidgetDataXToJSON(
    value: DuplicatesWidgetDataX
): DuplicatesWidgetDataXJSON {
    return {
        contactSource: value.contactSource,
        contactDestination: value.contactDestination,
        companySource: value.companySource,
        companyDestination: value.companyDestination,
        userSource: value.userSource,
        userDestination: value.userDestination,
    };
}

export const DUPLICATES_WIDGET_DATA_X_META: RecordMeta<
    DuplicatesWidgetDataX,
    DuplicatesWidgetDataXJSON,
    DuplicatesWidgetDataXBrokenJSON
> & { name: "DuplicatesWidgetDataX" } = {
    name: "DuplicatesWidgetDataX",
    type: "record",
    repair: repairDuplicatesWidgetDataXJSON,
    toJSON: DuplicatesWidgetDataXToJSON,
    fromJSON: JSONToDuplicatesWidgetDataX,
    fields: {
        contactSource: { type: "uuid", linkTo: "Contact" },
        contactDestination: { type: "uuid", linkTo: "Contact" },
        companySource: { type: "uuid", linkTo: "Company" },
        companyDestination: { type: "uuid", linkTo: "Company" },
        userSource: { type: "uuid", linkTo: "User" },
        userDestination: { type: "uuid", linkTo: "User" },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

type Context = WidgetContext<typeof Fields.contactSource> &
    WidgetContext<typeof Fields.contactDestination> &
    WidgetContext<typeof Fields.companySource> &
    WidgetContext<typeof Fields.companyDestination> &
    WidgetContext<typeof Fields.userSource> &
    WidgetContext<typeof Fields.userDestination>;
type ExtraProps = {};
type BaseState = {
    contactSource: WidgetState<typeof Fields.contactSource>;
    contactDestination: WidgetState<typeof Fields.contactDestination>;
    companySource: WidgetState<typeof Fields.companySource>;
    companyDestination: WidgetState<typeof Fields.companyDestination>;
    userSource: WidgetState<typeof Fields.userSource>;
    userDestination: WidgetState<typeof Fields.userDestination>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | {
          type: "CONTACT_SOURCE";
          action: WidgetAction<typeof Fields.contactSource>;
      }
    | {
          type: "CONTACT_DESTINATION";
          action: WidgetAction<typeof Fields.contactDestination>;
      }
    | {
          type: "COMPANY_SOURCE";
          action: WidgetAction<typeof Fields.companySource>;
      }
    | {
          type: "COMPANY_DESTINATION";
          action: WidgetAction<typeof Fields.companyDestination>;
      }
    | { type: "USER_SOURCE"; action: WidgetAction<typeof Fields.userSource> }
    | {
          type: "USER_DESTINATION";
          action: WidgetAction<typeof Fields.userDestination>;
      };

export type Action = BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(
        Fields.contactSource,
        data.contactSource,
        cache,
        "contactSource",
        errors
    );
    subvalidate(
        Fields.contactDestination,
        data.contactDestination,
        cache,
        "contactDestination",
        errors
    );
    subvalidate(
        Fields.companySource,
        data.companySource,
        cache,
        "companySource",
        errors
    );
    subvalidate(
        Fields.companyDestination,
        data.companyDestination,
        cache,
        "companyDestination",
        errors
    );
    subvalidate(
        Fields.userSource,
        data.userSource,
        cache,
        "userSource",
        errors
    );
    subvalidate(
        Fields.userDestination,
        data.userDestination,
        cache,
        "userDestination",
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
        case "CONTACT_SOURCE": {
            const inner = Fields.contactSource.reduce(
                state.contactSource,
                data.contactSource,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contactSource: inner.state },
                data: { ...data, contactSource: inner.data },
            };
        }
        case "CONTACT_DESTINATION": {
            const inner = Fields.contactDestination.reduce(
                state.contactDestination,
                data.contactDestination,
                action.action,
                subcontext
            );
            return {
                state: { ...state, contactDestination: inner.state },
                data: { ...data, contactDestination: inner.data },
            };
        }
        case "COMPANY_SOURCE": {
            const inner = Fields.companySource.reduce(
                state.companySource,
                data.companySource,
                action.action,
                subcontext
            );
            return {
                state: { ...state, companySource: inner.state },
                data: { ...data, companySource: inner.data },
            };
        }
        case "COMPANY_DESTINATION": {
            const inner = Fields.companyDestination.reduce(
                state.companyDestination,
                data.companyDestination,
                action.action,
                subcontext
            );
            return {
                state: { ...state, companyDestination: inner.state },
                data: { ...data, companyDestination: inner.data },
            };
        }
        case "USER_SOURCE": {
            const inner = Fields.userSource.reduce(
                state.userSource,
                data.userSource,
                action.action,
                subcontext
            );
            return {
                state: { ...state, userSource: inner.state },
                data: { ...data, userSource: inner.data },
            };
        }
        case "USER_DESTINATION": {
            const inner = Fields.userDestination.reduce(
                state.userDestination,
                data.userDestination,
                action.action,
                subcontext
            );
            return {
                state: { ...state, userDestination: inner.state },
                data: { ...data, userDestination: inner.data },
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
    contactSource: function (
        props: WidgetExtraProps<typeof Fields.contactSource> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTACT_SOURCE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "contactSource", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contactSource.component
                state={context.state.contactSource}
                data={context.data.contactSource}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contact Source"}
            />
        );
    },
    contactDestination: function (
        props: WidgetExtraProps<typeof Fields.contactDestination> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "CONTACT_DESTINATION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "contactDestination",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.contactDestination.component
                state={context.state.contactDestination}
                data={context.data.contactDestination}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Contact Destination"}
            />
        );
    },
    companySource: function (
        props: WidgetExtraProps<typeof Fields.companySource> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMPANY_SOURCE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "companySource", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.companySource.component
                state={context.state.companySource}
                data={context.data.companySource}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Company Source"}
            />
        );
    },
    companyDestination: function (
        props: WidgetExtraProps<typeof Fields.companyDestination> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "COMPANY_DESTINATION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(
                    context.status,
                    "companyDestination",
                    !!props.readOnly
                ),
            [context.status, props.readOnly]
        );
        return (
            <Fields.companyDestination.component
                state={context.state.companyDestination}
                data={context.data.companyDestination}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Company Destination"}
            />
        );
    },
    userSource: function (
        props: WidgetExtraProps<typeof Fields.userSource> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "USER_SOURCE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "userSource", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.userSource.component
                state={context.state.userSource}
                data={context.data.userSource}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "User Source"}
            />
        );
    },
    userDestination: function (
        props: WidgetExtraProps<typeof Fields.userDestination> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "USER_DESTINATION",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () =>
                subStatus(context.status, "userDestination", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.userDestination.component
                state={context.state.userDestination}
                data={context.data.userDestination}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "User Destination"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: DUPLICATES_WIDGET_DATA_X_META,
    initialize(
        data: Data,
        context: Context,
        parameters?: string[]
    ): WidgetResult<State, Data> {
        let subparameters: Dictionary<string[]> = {};
        let subcontext = context;
        let contactSourceState;
        {
            const inner = Fields.contactSource.initialize(
                data.contactSource,
                subcontext,
                subparameters.contactSource
            );
            contactSourceState = inner.state;
            data = { ...data, contactSource: inner.data };
        }
        let contactDestinationState;
        {
            const inner = Fields.contactDestination.initialize(
                data.contactDestination,
                subcontext,
                subparameters.contactDestination
            );
            contactDestinationState = inner.state;
            data = { ...data, contactDestination: inner.data };
        }
        let companySourceState;
        {
            const inner = Fields.companySource.initialize(
                data.companySource,
                subcontext,
                subparameters.companySource
            );
            companySourceState = inner.state;
            data = { ...data, companySource: inner.data };
        }
        let companyDestinationState;
        {
            const inner = Fields.companyDestination.initialize(
                data.companyDestination,
                subcontext,
                subparameters.companyDestination
            );
            companyDestinationState = inner.state;
            data = { ...data, companyDestination: inner.data };
        }
        let userSourceState;
        {
            const inner = Fields.userSource.initialize(
                data.userSource,
                subcontext,
                subparameters.userSource
            );
            userSourceState = inner.state;
            data = { ...data, userSource: inner.data };
        }
        let userDestinationState;
        {
            const inner = Fields.userDestination.initialize(
                data.userDestination,
                subcontext,
                subparameters.userDestination
            );
            userDestinationState = inner.state;
            data = { ...data, userDestination: inner.data };
        }
        let state = {
            initialParameters: parameters,
            contactSource: contactSourceState,
            contactDestination: contactDestinationState,
            companySource: companySourceState,
            companyDestination: companyDestinationState,
            userSource: userSourceState,
            userDestination: userDestinationState,
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
                <RecordContext
                    meta={DUPLICATES_WIDGET_DATA_X_META}
                    value={props.data}
                >
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: baseReduce,
};
export default Widget;
type Widgets = {
    contactSource: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contactSource>
    >;
    contactDestination: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.contactDestination>
    >;
    companySource: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.companySource>
    >;
    companyDestination: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.companyDestination>
    >;
    userSource: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.userSource>
    >;
    userDestination: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.userDestination>
    >;
};
// END MAGIC -- DO NOT EDIT
