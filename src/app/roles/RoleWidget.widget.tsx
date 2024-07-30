import {
    faAward,
    faBan,
    faCalendarAlt,
    faCalendarTimes,
    faCloud,
    faCloudSunRain,
    faCopy,
    faDollarSign,
    faEdit,
    faEnvelope,
    faFileExcel,
    faFileInvoice,
    faFileInvoiceDollar,
    faFileSignature,
    faGhost,
    faGlasses,
    faGlobe,
    faKey,
    faPen,
    faPeopleCarry,
    faPercentage,
    faPlus,
    faPlusSquare,
    faPollH,
    faProjectDiagram,
    faQuoteRight,
    faStar,
    faStethoscope,
    faSync,
    faTable,
    faTextHeight,
    faTrafficLight,
    faTrash,
    faUnlock,
    faUnlockAlt,
    faUserEdit,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { css } from "glamor";
import { uniq } from "lodash";
import * as React from "react";
import {
    Accordion,
    Button,
    Card,
    ListGroup,
    ListGroupItem,
} from "react-bootstrap";
import ReactSwitch from "react-switch";
import { Dictionary } from "../../clay/common";
import { propCheck } from "../../clay/propCheck";
import { QuickCacheApi, useQuickCache } from "../../clay/quick-cache";
import { SaveDeleteButton } from "../../clay/save-delete-button";
import { titleCase } from "../../clay/title-case";
import {
    FormField,
    FormWrapper,
    OptionalFormField,
} from "../../clay/widgets/FormField";
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
import { FieldRow } from "../../clay/widgets/layout";
import { SwitchWidget } from "../../clay/widgets/SwitchWidget";
import { TextWidget } from "../../clay/widgets/TextWidget";
import { PROJECT_DESCRIPTION_CATEGORY_META } from "../project-description/table";
import { PROJECT_TABS } from "../project/ProjectWidget.widget";
import { TABLES_META } from "../tables";
import { SQUAD_META } from "../user/table";
import { Role, ROLE_META } from "./table";
import UsersWidget from "./UsersWidget";

export type Data = Role;

const Fields = {
    name: FormField(TextWidget),
    azureId: OptionalFormField(TextWidget),
    projectRole: FormField(SwitchWidget),
};

type PermissionKey = {
    tableName: string;
    permission: string;
};

function parsePermissionKey(key: string): PermissionKey {
    const parts = key.split("-");
    return {
        tableName: parts[0],
        permission: parts[1],
    };
}

export type ExtraActions = {
    type: "TOGGLE_PERMISSON";
    tableName: string;
    permission: string;
};
function reduce(
    state: State,
    data: Data,
    action: Action,
    context: Context
): WidgetResult<State, Data> {
    switch (action.type) {
        case "TOGGLE_PERMISSON":
            const key = action.tableName + "-" + action.permission;
            if (data.permissions.indexOf(key) === -1) {
                const permissions = [...data.permissions];
                permissions.push(key);
                return {
                    state,
                    data: {
                        ...data,
                        permissions: uniq(permissions),
                    },
                };
            } else {
                return {
                    state,
                    data: {
                        ...data,
                        permissions: data.permissions.filter(
                            (permission) => permission !== key
                        ),
                    },
                };
            }
        default:
            return baseReduce(state, data, action, context);
    }
}

const DATED_TABLES = [
    "Quotation",
    "DetailSheet",
    "SiteVisitReport",
    "CoreValueNotice",
    "CustomerSurvey",
    "CompletionSurvey",
    "Payout",
    "WarrantyReviewDetailSheet",
    "Invoice",
];

function permissionsForTable(table: string, cache: QuickCacheApi) {
    switch (table) {
        case "Inbox":
            return [
                {
                    key: "show-pending-quotes",
                    label: "Show Pending Quotes",
                    icon: faCalendarTimes,
                },
                {
                    key: "show-unadded-to-accounting",
                    label: "Show Projects Not Added To Accounting Software",
                    icon: faUserEdit,
                },
                {
                    key: "show-unadded-to-accounting-invoice",
                    label: "Show Invoices Not Added To Accounting Software",
                    icon: faFileInvoice,
                },
                {
                    key: "show-unadded-to-accounting-payout",
                    label: "Show Payouts Not Added To Accounting Software",
                    icon: faFileInvoiceDollar,
                },
                {
                    key: "show-missing-detail-sheet",
                    label: "Show Missing Detail Sheets",
                    icon: faProjectDiagram,
                },
                {
                    key: "show-estimate-copy-request",
                    label: "Show All Estimate Copy Requests",
                    icon: faCopy,
                },
                {
                    key: "show-owned-estimate-copy-request",
                    label: "Show Estimate Copy Request For Associated Projects",
                    icon: faCopy,
                },
                {
                    key: "show-unlock-project-requests",
                    label: "Show Unlock Project Requests",
                    icon: faKey,
                },
                {
                    key: "show-ungenerated",
                    label: "Show Ungenerated Items",
                    icon: faStethoscope,
                },
                ...(cache.getAll(PROJECT_DESCRIPTION_CATEGORY_META) || []).map(
                    (category) => ({
                        key: "show-unassigned-" + category.id.uuid,
                        label: "Category Manager for " + category.name,
                        icon: faEdit,
                    })
                ),
                {
                    key: "show-all-margin-variance-approvals",
                    label: "Show All Margin Variance Approvals",
                    icon: faEdit,
                },
                {
                    key: "show-ready-for-payout",
                    label: "Show Ready For Payout",
                    icon: faPeopleCarry,
                },
                {
                    key: "show-my-completed-customer-surveys",
                    label: "Show My Completed Customer Surveys",
                    icon: faPollH,
                },
                {
                    key: "show-all-completed-customer-surveys",
                    label: "Show All Completed Customer Surveys",
                    icon: faPollH,
                },
                {
                    key: "show-late-estimates",
                    label: "Show Late Estimates",
                    icon: faEnvelope,
                },
                {
                    key: "show-confirm-project-start",
                    label: "Show Confirm Project Start",
                    icon: faEnvelope,
                },
            ];

        default: {
            const permissions = [
                {
                    key: "read",
                    label: "Read",
                    icon: faGlasses,
                },
                {
                    key: "write",
                    label: "Write",
                    icon: faPen,
                },
                {
                    key: "delete",
                    label:
                        DATED_TABLES.indexOf(table) === -1
                            ? "Delete"
                            : "Cancel",
                    icon: faTrash,
                },
                {
                    key: "new",
                    label: "New",
                    icon: faPlus,
                },
                {
                    key: "unlock",
                    label: "Unlock",
                    icon: faUnlock,
                },
                {
                    key: "export",
                    label: "Export to Excel",
                    icon: faFileExcel,
                },
            ];

            if (DATED_TABLES.indexOf(table) !== -1) {
                permissions.push({
                    key: "delete-nocancel",
                    label: "Delete",
                    icon: faTrash,
                });
            }

            switch (table) {
                case "WarrantyTemplate":
                    permissions.push({
                        key: "alter-warranty-text",
                        label: "Alter Text of Warranty in Project",
                        icon: faTextHeight,
                    });

                    break;
                case "WarrantyReview":
                    permissions.push({
                        key: "cancel",
                        label: "Cancel",
                        icon: faBan,
                    });

                    break;
                case "Project": {
                    permissions.push({
                        key: "force-project-role",
                        label: "Force Project Role",
                        icon: faPeopleCarry,
                    });
                    permissions.push({
                        key: "show-not-assigned-to-me",
                        label: "Show Projects Not Assigned To User",
                        icon: faGlobe,
                    });
                    permissions.push({
                        key: "show-quoting-projects",
                        label: "Show Unawarded and Unlost Projects",
                        icon: faQuoteRight,
                    });
                    permissions.push({
                        key: "show-lost-projects",
                        label: "Show Lost Projects",
                        icon: faGhost,
                    });
                    permissions.push({
                        key: "show-awarded-projects",
                        label: "Show Awarded Projects",
                        icon: faAward,
                    });
                    permissions.push({
                        key: "override-locked",
                        label: "Override Locked Field",
                        icon: faUnlockAlt,
                    });
                    permissions.push({
                        key: "override-lien-holdback-required",
                        label: "Override Lien Holdback Required",
                        icon: faCloud,
                    });
                    permissions.push({
                        key: "add-multiple-billing-contacts",
                        label: "Add Multiple Billing Contacts",
                        icon: faTable,
                    });
                    permissions.push({
                        key: "assign-certified-foreman",
                        label: "Assign Certified Foreman",
                        icon: faPeopleCarry,
                    });
                    permissions.push({
                        key: "extra-seasons",
                        label: "Allow Setting Past Seasons",
                        icon: faCloudSunRain,
                    });
                    permissions.push({
                        key: "reset-completed-project",
                        label: "Uncomplete Project",
                        icon: faBan,
                    });
                    permissions.push({
                        key: "approve-warranty-not-required",
                        label: "Approve Warranty Not Required",
                        icon: faFileSignature,
                    });
                    permissions.push({
                        key: "cancel-finish-schedule",
                        label: "Cancel Finish Schedule",
                        icon: faUnlockAlt,
                    });
                    permissions.push({
                        key: "cancel-warranty",
                        label: "Cancel Warranty",
                        icon: faUnlockAlt,
                    });
                    permissions.push(
                        ...(
                            cache.getAll(PROJECT_DESCRIPTION_CATEGORY_META) ||
                            []
                        ).map((category) => ({
                            key: "core-value-email-" + category.id.uuid,
                            label:
                                "Send Core Value Notices for " + category.name,
                            icon: faEnvelope,
                        }))
                    );

                    for (const squad of cache.getAll(SQUAD_META) || []) {
                        permissions.push({
                            key: "view-squad-" + squad.id.uuid,
                            label:
                                "View Projects for " + squad.name + " Squad ",
                            icon: faPeopleCarry,
                        });
                    }

                    for (const item of PROJECT_TABS) {
                        permissions.push({
                            key: "tab-" + item.key,
                            label: "Project Tab: " + item.title,
                            icon: faTable,
                        });
                    }

                    break;
                }
                case "Payout": {
                    permissions.push({
                        key: "override-commissions",
                        label: "Override Comissions",
                        icon: faDollarSign,
                    });
                    permissions.push({
                        key: "override-warranty-fund",
                        label: "Override Warranty Fund Contribution",
                        icon: faDollarSign,
                    });
                    permissions.push({
                        key: "print-cf-payout",
                        label: "Print CF Payout",
                        icon: faUserEdit,
                    });
                    permissions.push({
                        key: "override-employee-profit-share",
                        label: "Override Employee Profit Share",
                        icon: faPercentage,
                    });
                    permissions.push({
                        key: "admin",
                        label: "View Admin Only Tab",
                        icon: faGhost,
                    });
                    permissions.push({
                        key: "date-change",
                        label: "Override Date",
                        icon: faCalendarAlt,
                    });
                    break;
                }
                case "SaltOrder": {
                    permissions.push({
                        key: "pst-exempt",
                        label: "PST Exemption",
                        icon: faDollarSign,
                    });
                    break;
                }
                case "Quotation": {
                    permissions.push({
                        key: "change-active",
                        label: "Change Active Status",
                        icon: faTrafficLight,
                    });
                    permissions.push({
                        key: "show-active-season",
                        label: "Show Active & Season Status",
                        icon: faTrafficLight,
                    });
                }
                case "General":
                    {
                        permissions.push({
                            key: "synchronize",
                            label: "Synchronize",
                            icon: faSync,
                        });
                        permissions.push({
                            key: "duplicates",
                            label: "Access Deduplicator",
                            icon: faCopy,
                        });
                        permissions.push({
                            key: "scorecard",
                            label: "Access Scorecard",
                            icon: faStar,
                        });
                    }
                    break;
                case "Invoice":
                    permissions.push({
                        key: "date-change",
                        label: "Override Date",
                        icon: faCalendarAlt,
                    });
                    break;
                case "DetailSheet":
                    permissions.push({
                        key: "date-change",
                        label: "Override Date",
                        icon: faCalendarAlt,
                    });
                    break;
                case "SiteVisitReport":
                    permissions.push({
                        key: "date-change",
                        label: "Override Date",
                        icon: faCalendarAlt,
                    });
                    break;
                case "CoreValueNotice":
                    permissions.push({
                        key: "date-change",
                        label: "Override Date",
                        icon: faCalendarAlt,
                    });
                    break;
                case "Contact":
                    permissions.push({
                        key: "change-status",
                        label: "Change Status",
                        icon: faPlusSquare,
                    });
                    permissions.push({
                        key: "change-activity-date",
                        label: "Change Activity Date",
                        icon: faCalendarAlt,
                    });
                    break;
                case "Estimate":
                    permissions.push({
                        key: "contingency-items-v2",
                        label: "ContingencyItemsV2",
                        icon: faPlusSquare,
                    });
                    permissions.push({
                        key: "mobile-simple-estimate",
                        label: "Access to Mobile Simple Estimate",
                        icon: faPlusSquare,
                    });
            }

            return permissions;
        }
    }
}

const PERMISSON_LABEL_STYLE = css({
    paddingLeft: ".25in",
    lineHeight: "28px",
    verticalAlign: "text-bottom",
});

function Component(props: Props) {
    const cache = useQuickCache();
    let tables = Object.keys(TABLES_META).slice();
    tables.push("RecordHistory");
    tables.sort();
    return (
        <>
            <FieldRow>
                <widgets.name />
                <widgets.projectRole />
                <widgets.azureId />
            </FieldRow>
            <FormWrapper label="Users">
                <UsersWidget status={props.status} role={props.data.id.uuid} />
            </FormWrapper>
            <Accordion style={{ overflow: "auto" }}>
                {["Inbox", ...tables].map((tableName) => (
                    <Card key={tableName}>
                        <Card.Header>
                            <Accordion.Toggle
                                as={Button}
                                variant="link"
                                eventKey={tableName}
                            >
                                {titleCase(tableName)}{" "}
                            </Accordion.Toggle>
                            <div
                                style={{
                                    display: "inline-block",
                                    float: "right",
                                }}
                            >
                                {permissionsForTable(tableName, cache).map(
                                    (p) =>
                                        props.data.permissions.indexOf(
                                            tableName + "-" + p.key
                                        ) !== -1 ? (
                                            <FontAwesomeIcon
                                                style={{
                                                    marginLeft: ".25em",
                                                    color: "green",
                                                }}
                                                key={p.key}
                                                icon={p.icon}
                                            />
                                        ) : (
                                            <FontAwesomeIcon
                                                style={{
                                                    marginLeft: ".25em",
                                                    color: "red",
                                                }}
                                                key={p.key}
                                                icon={p.icon}
                                            />
                                        )
                                )}
                            </div>
                        </Card.Header>
                        <Accordion.Collapse eventKey={tableName}>
                            <ListGroup>
                                {permissionsForTable(tableName, cache).map(
                                    (permission) => (
                                        <ListGroupItem key={permission.key}>
                                            <ReactSwitch
                                                checked={
                                                    props.data.permissions.indexOf(
                                                        tableName +
                                                            "-" +
                                                            permission.key
                                                    ) !== -1
                                                }
                                                onChange={() =>
                                                    props.dispatch({
                                                        type: "TOGGLE_PERMISSON",
                                                        tableName,
                                                        permission:
                                                            permission.key,
                                                    })
                                                }
                                            />
                                            <span {...PERMISSON_LABEL_STYLE}>
                                                <FontAwesomeIcon
                                                    icon={permission.icon}
                                                />
                                                <span
                                                    style={{
                                                        marginLeft: "1em",
                                                    }}
                                                >
                                                    {permission.label}
                                                </span>
                                            </span>
                                        </ListGroupItem>
                                    )
                                )}
                            </ListGroup>
                        </Accordion.Collapse>
                    </Card>
                ))}
            </Accordion>
            <SaveDeleteButton duplicate noun="Role" />
        </>
    );
}

// BEGIN MAGIC -- DO NOT EDIT
type Context = WidgetContext<typeof Fields.name> &
    WidgetContext<typeof Fields.azureId> &
    WidgetContext<typeof Fields.projectRole>;
type ExtraProps = {};
type BaseState = {
    name: WidgetState<typeof Fields.name>;
    azureId: WidgetState<typeof Fields.azureId>;
    projectRole: WidgetState<typeof Fields.projectRole>;
    initialParameters?: string[];
};
export type State = BaseState;

type BaseAction =
    | { type: "NAME"; action: WidgetAction<typeof Fields.name> }
    | { type: "AZURE_ID"; action: WidgetAction<typeof Fields.azureId> }
    | { type: "PROJECT_ROLE"; action: WidgetAction<typeof Fields.projectRole> };

export type Action = ExtraActions | BaseAction;

export type Props = WidgetProps<State, Data, Action, ExtraProps>;

function baseValidate(data: Data, cache: QuickCacheApi) {
    const errors: ValidationError[] = [];
    subvalidate(Fields.name, data.name, cache, "name", errors);
    subvalidate(Fields.azureId, data.azureId, cache, "azureId", errors);
    subvalidate(
        Fields.projectRole,
        data.projectRole,
        cache,
        "projectRole",
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
        case "AZURE_ID": {
            const inner = Fields.azureId.reduce(
                state.azureId,
                data.azureId,
                action.action,
                subcontext
            );
            return {
                state: { ...state, azureId: inner.state },
                data: { ...data, azureId: inner.data },
            };
        }
        case "PROJECT_ROLE": {
            const inner = Fields.projectRole.reduce(
                state.projectRole,
                data.projectRole,
                action.action,
                subcontext
            );
            return {
                state: { ...state, projectRole: inner.state },
                data: { ...data, projectRole: inner.data },
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
    azureId: function (
        props: WidgetExtraProps<typeof Fields.azureId> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "AZURE_ID",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "azureId", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.azureId.component
                state={context.state.azureId}
                data={context.data.azureId}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Azure Id"}
            />
        );
    },
    projectRole: function (
        props: WidgetExtraProps<typeof Fields.projectRole> & {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        }
    ) {
        const context = React.useContext(ReactContext) as ReactContextType;
        const subdispatch = React.useCallback(
            (action) =>
                (props.dispatch || context.dispatch)({
                    type: "PROJECT_ROLE",
                    action,
                }),
            [context.dispatch, props.dispatch]
        );
        const status = React.useMemo(
            () => subStatus(context.status, "projectRole", !!props.readOnly),
            [context.status, props.readOnly]
        );
        return (
            <Fields.projectRole.component
                state={context.state.projectRole}
                data={context.data.projectRole}
                status={status}
                {...props}
                dispatch={subdispatch}
                label={props.label || "Project Role"}
            />
        );
    },
};
const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = {
    reactContext: ReactContext,
    fieldWidgets: widgets,
    dataMeta: ROLE_META,
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
        let azureIdState;
        {
            const inner = Fields.azureId.initialize(
                data.azureId,
                subcontext,
                subparameters.azureId
            );
            azureIdState = inner.state;
            data = { ...data, azureId: inner.data };
        }
        let projectRoleState;
        {
            const inner = Fields.projectRole.initialize(
                data.projectRole,
                subcontext,
                subparameters.projectRole
            );
            projectRoleState = inner.state;
            data = { ...data, projectRole: inner.data };
        }
        let state = {
            initialParameters: parameters,
            name: nameState,
            azureId: azureIdState,
            projectRole: projectRoleState,
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
                <RecordContext meta={ROLE_META} value={props.data}>
                    {Component(props)}
                </RecordContext>
            </ReactContext.Provider>
        );
    }, propCheck),
    reduce: reduce,
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
    azureId: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.azureId>
    >;
    projectRole: React.SFC<
        {
            label?: string;
            readOnly?: boolean;
            dispatch?: (action: Action) => void;
        } & WidgetExtraProps<typeof Fields.projectRole>
    >;
};
// END MAGIC -- DO NOT EDIT
